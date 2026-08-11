use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f64>,
    /// agent.run 会话 ID（可选，多轮对话上下文延续）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub id: String,
    pub content: String,
    pub role: String,
    pub model: String,
    pub finish_reason: String,
    pub usage: UsageInfo,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageInfo {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

/// LLM 客户端：不再直连 OpenAI / Anthropic / Ollama，
/// 所有对话请求统一通过 gateway 的 JSON-RPC（agent.run）转发，secrets 由 gateway 管理。
pub struct LLMClient {
    http: reqwest::Client,
    gateway_url: String,
}

impl LLMClient {
    pub fn new(gateway_url: String) -> Self {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(120))
            .connect_timeout(Duration::from_secs(10))
            .build()
            .unwrap_or_default();

        Self { http, gateway_url }
    }

    /// 对话：调用 gateway agent.run（JSON-RPC POST {gateway_url}/api/），解析对话结果
    pub async fn chat(&self, request: &ChatRequest) -> Result<ChatResponse, String> {
        log::info!(
            "LLM chat via gateway agent.run: model={}, messages={}",
            request.model,
            request.messages.len()
        );

        let prompt = Self::build_prompt(&request.messages);
        let mut params = serde_json::json!({
            "prompt": prompt
        });
        // 可选参数：会话 ID（gateway 契约 agent.run {prompt, session_id?}，无 agent_id）
        if let Some(session_id) = &request.session_id {
            params["session_id"] = serde_json::Value::String(session_id.clone());
        }

        let result = self.send_jsonrpc("agent.run", params).await?;
        Ok(Self::parse_chat_response(&result, &request.model))
    }

    /// 连接测试：调用 gateway llm.list_models 验证连通。
    ///
    /// 说明：不提供本地兜底——gateway 不可达时返回明确错误，由前端展示真实状态。
    pub async fn test_connection(&self) -> Result<ConnectionTestResult, String> {
        let start = std::time::Instant::now();

        let result = self
            .send_jsonrpc("llm.list_models", serde_json::json!({}))
            .await?;

        let latency_ms = start.elapsed().as_millis() as u64;
        let models = Self::parse_models(&result);

        Ok(ConnectionTestResult {
            success: true,
            latency_ms,
            models,
            message: "Gateway connection successful (JSON-RPC /api/)".to_string(),
        })
    }

    /// 构建 agent.run 的 prompt 文本（将消息列表拼成 “role: content” 形式）
    fn build_prompt(messages: &[ChatMessage]) -> String {
        messages
            .iter()
            .map(|m| format!("{}: {}", m.role, m.content))
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// 解析 llm.list_models 返回的模型列表
    fn parse_models(result: &serde_json::Value) -> Vec<String> {
        let items = result
            .as_array()
            .or_else(|| result.get("models").and_then(|v| v.as_array()))
            .cloned()
            .unwrap_or_default();
        items
            .iter()
            .filter_map(|m| {
                m.get("id")
                    .or_else(|| m.get("name"))
                    .or_else(|| m.get("model"))
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
            })
            .collect()
    }

    /// 解析 agent.run 返回的对话结果（容错：兼容 response/content/output/result 等字段）
    fn parse_chat_response(result: &serde_json::Value, model: &str) -> ChatResponse {
        // 结果可能是纯字符串，也可能是对象
        let content = if let Some(s) = result.as_str() {
            s.to_string()
        } else {
            result
                .get("response")
                .or_else(|| result.get("content"))
                .or_else(|| result.get("output"))
                .or_else(|| result.get("result"))
                .map(|v| match v {
                    serde_json::Value::String(s) => s.clone(),
                    other => other.to_string(),
                })
                .unwrap_or_default()
        };

        let usage = result.get("usage").map(|u| UsageInfo {
            prompt_tokens: u.get("prompt_tokens").and_then(|t| t.as_u64()).unwrap_or(0) as u32,
            completion_tokens: u
                .get("completion_tokens")
                .and_then(|t| t.as_u64())
                .unwrap_or(0) as u32,
            total_tokens: u.get("total_tokens").and_then(|t| t.as_u64()).unwrap_or(0) as u32,
        });

        ChatResponse {
            id: result
                .get("id")
                .and_then(|i| i.as_str())
                .map(|s| s.to_string())
                .unwrap_or_else(|| format!("agentrun_{}", uuid::Uuid::new_v4())),
            content,
            role: result
                .get("role")
                .and_then(|r| r.as_str())
                .unwrap_or("assistant")
                .to_string(),
            model: result
                .get("model")
                .and_then(|m| m.as_str())
                .unwrap_or(model)
                .to_string(),
            finish_reason: result
                .get("finish_reason")
                .and_then(|f| f.as_str())
                .unwrap_or("stop")
                .to_string(),
            usage: usage.unwrap_or(UsageInfo {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
            }),
            tool_calls: result.get("tool_calls").cloned(),
        }
    }

    /// 发送 JSON-RPC 请求到 gateway（POST {gateway_url}/api/）
    async fn send_jsonrpc(
        &self,
        method: &str,
        params: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let url = format!("{}/api/", self.gateway_url);
        let body = serde_json::json!({
            "jsonrpc": "2.0",
            "id": uuid::Uuid::new_v4().to_string(),
            "method": method,
            "params": params
        });

        let resp = self
            .http
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Gateway JSON-RPC request failed: {}", e))?;

        let status = resp.status();
        let response_text = resp
            .text()
            .await
            .map_err(|e| format!("Failed to read gateway response: {}", e))?;

        if !status.is_success() {
            return Err(format!("Gateway JSON-RPC error {}: {}", status, response_text));
        }

        let json: serde_json::Value = serde_json::from_str(&response_text)
            .map_err(|e| format!("Failed to parse gateway JSON-RPC response: {}", e))?;

        if let Some(error) = json.get("error") {
            return Err(format!("JSON-RPC error: {}", error));
        }

        Ok(json
            .get("result")
            .cloned()
            .unwrap_or(serde_json::Value::Null))
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionTestResult {
    pub success: bool,
    pub latency_ms: u64,
    pub models: Vec<String>,
    pub message: String,
}
