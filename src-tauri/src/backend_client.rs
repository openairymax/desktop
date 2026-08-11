use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone)]
pub struct BackendConfig {
    pub gateway_url: String,
    pub timeout_seconds: u64,
    pub api_key: Option<String>,
}

const DEFAULT_GATEWAY_HOST: &str = "127.0.0.1";
const DEFAULT_GATEWAY_PORT: u16 = 8080;

impl Default for BackendConfig {
    fn default() -> Self {
        // 默认网关：http://127.0.0.1:8080（gateway_d 默认监听 8080）。
        // 可配置性：环境变量 AIRY_GATEWAY_URL 覆盖默认值，构造参数 BackendConfig 也可覆盖。
        let gateway_url = std::env::var("AIRY_GATEWAY_URL").unwrap_or_else(|_| {
            format!("http://{}:{}", DEFAULT_GATEWAY_HOST, DEFAULT_GATEWAY_PORT)
        });
        Self {
            gateway_url,
            timeout_seconds: 30,
            api_key: None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct BackendClient {
    config: Arc<RwLock<BackendConfig>>,
    http: reqwest::Client,
    /// 客户端本地配置存储：gateway 白名单无通用 config 方法，UI 设置保存在本地内存
    local_config: Arc<RwLock<HashMap<String, String>>>,
}

impl BackendClient {
    pub fn new(config: BackendConfig) -> Self {
        let http = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(config.timeout_seconds))
            .build()
            .unwrap_or_default();

        Self {
            config: Arc::new(RwLock::new(config)),
            http,
            local_config: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    #[allow(dead_code)]
    pub async fn update_config(&self, config: BackendConfig) {
        let mut current = self.config.write().await;
        *current = config;
    }

    pub async fn get_gateway_url(&self) -> String {
        self.config.read().await.gateway_url.clone()
    }

    /// 健康检查：JSON-RPC info.health（原 REST GET /health）
    #[allow(dead_code)]
    pub async fn health_check(&self) -> Result<HealthResponse, String> {
        let result = self.send_jsonrpc("info.health", serde_json::json!({})).await?;

        Ok(HealthResponse {
            status: result
                .get("status")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string(),
            version: result
                .get("version")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string(),
            uptime_seconds: result
                .get("uptime_seconds")
                .and_then(|v| v.as_u64())
                .unwrap_or(0),
            services: result
                .get("services")
                .cloned()
                .unwrap_or(serde_json::Value::Null),
        })
    }

    /// 服务列表：JSON-RPC info.system（原 REST GET /api/v1/services）
    #[allow(dead_code)]
    pub async fn list_services(&self) -> Result<Vec<ServiceEntry>, String> {
        let result = self.send_jsonrpc("info.system", serde_json::json!({})).await?;
        Ok(Self::parse_service_list(&result))
    }

    /// 单个服务：JSON-RPC info.system 后按名称过滤（原 REST GET /api/v1/services/{name}）
    #[allow(dead_code)]
    pub async fn get_service(&self, name: &str) -> Result<ServiceEntry, String> {
        let services = self.list_services().await?;
        services
            .into_iter()
            .find(|s| s.name == name)
            .ok_or_else(|| format!("Service not found: {}", name))
    }

    /// Agent 列表：JSON-RPC a2a.discover_agents（原 REST GET /api/v1/agents）
    pub async fn list_agents(&self) -> Result<Vec<AgentEntry>, String> {
        let result = self
            .send_jsonrpc("a2a.discover_agents", serde_json::json!({}))
            .await?;
        Ok(Self::parse_agent_list(&result))
    }

    /// 注册 Agent：JSON-RPC a2a.register_agent {name, url}
    pub async fn register_agent(&self, config: &AgentRegistration) -> Result<AgentEntry, String> {
        let params = serde_json::json!({
            "name": config.name,
            "url": config.url,
        });
        let result = self.send_jsonrpc("a2a.register_agent", params).await?;
        Self::parse_agent(&result)
            .ok_or_else(|| "Failed to parse agent registration response".to_string())
    }

    /// 提交任务：JSON-RPC sched.dag_submit（原 REST POST /api/v1/tasks）
    ///
    /// 说明：gateway 以 DAG 表达任务，TaskSubmission 映射为单节点 DAG。
    pub async fn submit_task(&self, request: &TaskSubmission) -> Result<TaskEntry, String> {
        let params = serde_json::json!({
            "dag": {
                "nodes": [
                    {
                        "id": uuid::Uuid::new_v4().to_string(),
                        "goal": request.description,
                        "role": request.agent_id,
                        "depends": []
                    }
                ]
            }
        });
        let result = self.send_jsonrpc("sched.dag_submit", params).await?;
        Self::parse_task(&result).ok_or_else(|| "Failed to parse task response".to_string())
    }

    /// 任务列表：JSON-RPC info.history（原 REST GET /api/v1/tasks）
    ///
    /// 说明：gateway 白名单无“列出全部 DAG”方法，使用 info.history 近似。
    pub async fn list_tasks(&self) -> Result<Vec<TaskEntry>, String> {
        let result = self.send_jsonrpc("info.history", serde_json::json!({})).await?;
        Ok(Self::parse_task_list(&result))
    }

    /// 查询任务：JSON-RPC sched.dag_status（原 REST GET /api/v1/tasks/{id}）
    pub async fn get_task(&self, task_id: &str) -> Result<TaskEntry, String> {
        let result = self
            .send_jsonrpc("sched.dag_status", serde_json::json!({"dag_id": task_id}))
            .await?;
        Self::parse_task(&result)
            .ok_or_else(|| format!("Failed to parse task response for {}", task_id))
    }

    /// 取消任务：JSON-RPC sched.dag_cancel（原 REST POST /api/v1/tasks/{id}/cancel）
    pub async fn cancel_task(&self, task_id: &str) -> Result<(), String> {
        let _ = self
            .send_jsonrpc("sched.dag_cancel", serde_json::json!({"dag_id": task_id}))
            .await?;
        Ok(())
    }

    /// 运行指标：JSON-RPC observe.query_metrics（原 REST GET /metrics）
    pub async fn get_metrics(&self) -> Result<serde_json::Value, String> {
        self.send_jsonrpc("observe.query_metrics", serde_json::json!({}))
            .await
    }

    /// 读取配置：gateway 白名单无通用配置方法，改为客户端本地内存存储
    pub async fn get_config(&self, key: &str) -> Result<ConfigEntry, String> {
        let store = self.local_config.read().await;
        match store.get(key) {
            Some(value) => Ok(ConfigEntry {
                key: key.to_string(),
                value: value.clone(),
                namespace: None,
                version: None,
                source: Some("local".to_string()),
            }),
            None => Err(format!("Config key not found: {}", key)),
        }
    }

    /// 写入配置：gateway 白名单无通用配置方法，改为客户端本地内存存储
    pub async fn set_config(&self, key: &str, value: &str) -> Result<ConfigEntry, String> {
        let mut store = self.local_config.write().await;
        store.insert(key.to_string(), value.to_string());
        Ok(ConfigEntry {
            key: key.to_string(),
            value: value.to_string(),
            namespace: None,
            version: None,
            source: Some("local".to_string()),
        })
    }

    /// 测试协议连通性：gateway JSON-RPC 白名单无 protocol.translate /
    /// protocol.test 方法，协议适配由 gateway 内部完成。
    ///
    /// 这里仅验证 gateway 本身可达（info.health），不再直连被测端点。
    pub async fn test_protocol_connection(
        &self,
        protocol: &str,
        endpoint: &str,
    ) -> Result<ProtocolTestResult, String> {
        let start = std::time::Instant::now();
        self.send_jsonrpc("info.health", serde_json::json!({}))
            .await?;
        let latency_ms = start.elapsed().as_millis() as u64;

        Ok(ProtocolTestResult {
            protocol: protocol.to_string(),
            endpoint: endpoint.to_string(),
            success: true,
            latency_ms,
            message: format!(
                "Gateway 连通（{} 协议适配由 gateway 内部完成，桌面端不再直连端点）",
                protocol
            ),
            details: None,
        })
    }

    /// 协议适配器列表：基于 info.system 推导的能力描述，非 gateway 后端协议数据。
    ///
    /// 说明：gateway JSON-RPC 白名单无“协议适配器列表”方法，此处仅从
    /// info.system 返回的服务中按已知协议关键字（mcp / a2a / openai / jsonrpc）
    /// 名称匹配，作为 UI 能力描述的近似展示。
    pub async fn list_protocol_adapters(&self) -> Result<Vec<ProtocolAdapter>, String> {
        let result = self
            .send_jsonrpc("info.system", serde_json::json!({}))
            .await?;
        let services = result
            .get("services")
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or_default();

        let known_protocols = ["mcp", "a2a", "openai", "jsonrpc"];
        let adapters: Vec<ProtocolAdapter> = services
            .iter()
            .filter_map(|svc| {
                let name = svc.get("name").and_then(|v| v.as_str())?;
                let lower = name.to_lowercase();
                let protocol = known_protocols.iter().find(|p| lower.contains(**p))?;
                let metadata = svc.get("metadata");
                Some(ProtocolAdapter {
                    name: name.to_string(),
                    protocol: protocol.to_string(),
                    version: svc
                        .get("version")
                        .and_then(|v| v.as_str())
                        .unwrap_or("1.0")
                        .to_string(),
                    status: svc
                        .get("status")
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown")
                        .to_string(),
                    endpoint: metadata
                        .and_then(|m| m.get("endpoint"))
                        .and_then(|v| v.as_str())
                        .unwrap_or_default()
                        .to_string(),
                    capabilities: metadata
                        .and_then(|m| m.get("capabilities"))
                        .and_then(|v| v.as_array())
                        .map(|arr| {
                            arr.iter()
                                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                                .collect()
                        })
                        .unwrap_or_default(),
                })
            })
            .collect();

        Ok(adapters)
    }

    /// 发送 JSON-RPC 请求到 gateway（POST {gateway_url}/api/）
    ///
    /// 请求：{"jsonrpc":"2.0","id":"<uuid>","method":"<ns>.<method>","params":{...}}
    /// 响应：{"jsonrpc":"2.0","result":...,"id":...} 或 error 结构
    pub async fn send_jsonrpc(
        &self,
        method: &str,
        params: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let url = format!("{}/api/", self.get_gateway_url().await);
        let body = serde_json::json!({
            "jsonrpc": "2.0",
            "id": uuid::Uuid::new_v4().to_string(),
            "method": method,
            "params": params
        });

        let resp = self
            .send_authenticated_request(reqwest::Method::POST, &url, Some(body))
            .await?;
        let result: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse JSON-RPC response: {}", e))?;

        if let Some(error) = result.get("error") {
            return Err(format!("JSON-RPC error: {}", error));
        }

        Ok(result
            .get("result")
            .cloned()
            .unwrap_or(serde_json::Value::Null))
    }

    /// 发送携带可选鉴权头的请求。
    ///
    /// 说明：gateway JSON-RPC 白名单无鉴权要求（不校验 Bearer 头），
    /// 默认不附带任何鉴权头；仅当调用方显式配置了 api_key 时才附带
    /// Authorization: Bearer <api_key>，以兼容 gateway 未来启用鉴权。
    async fn send_authenticated_request(
        &self,
        method: reqwest::Method,
        url: &str,
        body: Option<serde_json::Value>,
    ) -> Result<reqwest::Response, String> {
        let config = self.config.read().await;
        let mut req = self.http.request(method, url);

        if let Some(ref api_key) = config.api_key {
            req = req.header("Authorization", format!("Bearer {}", api_key));
        }

        if let Some(body) = body {
            req = req.json(&body);
        }

        let resp = req
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if resp.status() == reqwest::StatusCode::UNAUTHORIZED {
            return Err("Authentication required. Please configure API key.".to_string());
        }

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("Request failed with status {}: {}", status, text));
        }

        Ok(resp)
    }

    // ---- 响应解析辅助函数（容错解析，字段缺失时使用默认值）----

    fn parse_service_list(result: &serde_json::Value) -> Vec<ServiceEntry> {
        let items = result
            .get("services")
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or_default();
        items
            .iter()
            .filter_map(|v| {
                Some(ServiceEntry {
                    name: v.get("name")?.as_str()?.to_string(),
                    status: v
                        .get("status")
                        .and_then(|s| s.as_str())
                        .unwrap_or("unknown")
                        .to_string(),
                    healthy: v.get("healthy").and_then(|h| h.as_bool()).unwrap_or(false),
                    port: v.get("port").and_then(|p| p.as_u64()).map(|p| p as u16),
                    uptime_seconds: v.get("uptime_seconds").and_then(|u| u.as_u64()),
                    metadata: v.get("metadata").cloned(),
                })
            })
            .collect()
    }

    fn parse_agent_list(result: &serde_json::Value) -> Vec<AgentEntry> {
        let items = result
            .as_array()
            .or_else(|| result.get("agents").and_then(|v| v.as_array()))
            .cloned()
            .unwrap_or_default();
        items.iter().filter_map(|v| Self::parse_agent(v)).collect()
    }

    fn parse_agent(v: &serde_json::Value) -> Option<AgentEntry> {
        Some(AgentEntry {
            id: v.get("id")?.as_str()?.to_string(),
            name: v
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or_default()
                .to_string(),
            agent_type: v.get("type").and_then(|t| t.as_str()).map(|s| s.to_string()),
            status: v
                .get("status")
                .and_then(|s| s.as_str())
                .unwrap_or("unknown")
                .to_string(),
            task_count: v.get("task_count").and_then(|c| c.as_u64()).map(|c| c as u32),
            last_active: v
                .get("last_active")
                .and_then(|l| l.as_str())
                .map(|s| s.to_string()),
            description: v
                .get("description")
                .and_then(|d| d.as_str())
                .map(|s| s.to_string()),
            capabilities: v
                .get("capabilities")
                .and_then(|c| c.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|c| c.as_str().map(|s| s.to_string()))
                        .collect()
                }),
            config: v.get("config").cloned(),
            created_at: v
                .get("created_at")
                .and_then(|c| c.as_str())
                .map(|s| s.to_string()),
        })
    }

    fn parse_task_list(result: &serde_json::Value) -> Vec<TaskEntry> {
        let items = result
            .as_array()
            .or_else(|| result.get("tasks").and_then(|v| v.as_array()))
            .or_else(|| result.get("history").and_then(|v| v.as_array()))
            .cloned()
            .unwrap_or_default();
        items.iter().filter_map(|v| Self::parse_task(v)).collect()
    }

    fn parse_task(v: &serde_json::Value) -> Option<TaskEntry> {
        Some(TaskEntry {
            id: v
                .get("id")
                .and_then(|i| i.as_str())
                .or_else(|| v.get("dag_id").and_then(|i| i.as_str()))
                .unwrap_or_default()
                .to_string(),
            agent_id: v.get("agent_id").and_then(|a| a.as_str()).map(|s| s.to_string()),
            name: v.get("name").and_then(|n| n.as_str()).map(|s| s.to_string()),
            type_: v.get("type").and_then(|t| t.as_str()).map(|s| s.to_string()),
            status: v
                .get("status")
                .and_then(|s| s.as_str())
                .unwrap_or("unknown")
                .to_string(),
            progress: v.get("progress").and_then(|p| p.as_f64()).unwrap_or(0.0) as f32,
            created_at: v
                .get("created_at")
                .and_then(|c| c.as_str())
                .unwrap_or_default()
                .to_string(),
            updated_at: v
                .get("updated_at")
                .and_then(|u| u.as_str())
                .map(|s| s.to_string()),
            result: v.get("result").cloned(),
            error: v.get("error").and_then(|e| e.as_str()).map(|s| s.to_string()),
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub uptime_seconds: u64,
    pub services: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct ServiceEntry {
    pub name: String,
    pub status: String,
    pub healthy: bool,
    pub port: Option<u16>,
    pub uptime_seconds: Option<u64>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentEntry {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub agent_type: Option<String>,
    pub status: String,
    pub task_count: Option<u32>,
    pub last_active: Option<String>,
    pub description: Option<String>,
    pub capabilities: Option<Vec<String>>,
    pub config: Option<serde_json::Value>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentRegistration {
    pub name: String,
    /// Agent 端点 URL（可选，gateway 契约 a2a.register_agent {name?, url?}）
    pub url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TaskEntry {
    pub id: String,
    pub agent_id: Option<String>,
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub status: String,
    pub progress: f32,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskSubmission {
    pub agent_id: String,
    pub description: String,
    pub priority: Option<String>,
    pub parameters: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigEntry {
    pub key: String,
    pub value: String,
    pub namespace: Option<String>,
    pub version: Option<u64>,
    pub source: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ProtocolTestResult {
    pub protocol: String,
    pub endpoint: String,
    pub success: bool,
    pub latency_ms: u64,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProtocolAdapter {
    pub name: String,
    pub protocol: String,
    pub version: String,
    pub status: String,
    pub endpoint: String,
    pub capabilities: Vec<String>,
}
