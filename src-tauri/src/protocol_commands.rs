use crate::backend_client::{BackendClient, ProtocolAdapter};
use crate::commands::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProtocolInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub version: String,
    pub status: String,
    pub endpoint: String,
    pub capabilities: Vec<String>,
    pub color: String,
    pub icon: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProtocolConnectionTest {
    pub protocol_id: String,
    pub endpoint: String,
    pub success: bool,
    pub latency_ms: u64,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProtocolMessage {
    pub protocol: String,
    pub method: String,
    pub params: serde_json::Value,
    pub id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProtocolResponse {
    pub protocol: String,
    pub success: bool,
    pub data: serde_json::Value,
    pub error: Option<String>,
    pub latency_ms: u64,
}

#[tauri::command]
pub async fn list_protocols(state: State<'_, AppState>) -> Result<Vec<ProtocolInfo>, String> {
    let client = get_backend_client(&state)?;

    // 说明：gateway 契约无“协议适配器列表”方法，此处返回的是基于
    // info.system 推导的能力描述（非 gateway 后端协议数据）
    match client.list_protocol_adapters().await {
        Ok(adapters) => {
            let protocols = adapters.into_iter().map(|a| adapter_to_info(&a)).collect();
            Ok(protocols)
        }
        Err(e) => Err(format!("Failed to list protocols: {}", e)),
    }
}

#[tauri::command]
pub async fn test_protocol_connection(
    protocol_id: String,
    endpoint: String,
    state: State<'_, AppState>,
) -> Result<ProtocolConnectionTest, String> {
    let client = get_backend_client(&state)?;

    // gateway 契约无 protocol.translate：仅验证 gateway 连通性（info.health），
    // 协议适配状态由 gateway 内部管理；移除“本地直连端点”兜底降级
    let result = client
        .test_protocol_connection(&protocol_id, &endpoint)
        .await?;

    Ok(ProtocolConnectionTest {
        protocol_id: result.protocol,
        endpoint: result.endpoint,
        success: result.success,
        latency_ms: result.latency_ms,
        message: result.message,
        details: result.details,
    })
}

#[tauri::command]
pub async fn send_protocol_message(
    message: ProtocolMessage,
    state: State<'_, AppState>,
) -> Result<ProtocolResponse, String> {
    let client = get_backend_client(&state)?;
    let start = std::time::Instant::now();

    let result = match message.protocol.as_str() {
        // jsonrpc：直接透传到 gateway JSON-RPC 接口（POST /api/）
        "jsonrpc" | "json-rpc" => client.send_jsonrpc(&message.method, message.params).await,
        // gateway 契约无 protocol.translate：mcp / a2a / openai 协议适配
        // 由 gateway 内部完成，桌面端不支持直接透传，返回明确错误
        "mcp" | "a2a" | "openai" => Err(format!(
            "协议 '{}' 不支持桌面端直接透传：gateway 契约无 protocol.translate 方法，\
             {} 适配由 gateway 内部完成，请通过 agent.run / a2a.* 等白名单方法使用对应能力",
            message.protocol, message.protocol
        )),
        _ => Err(format!("Unsupported protocol: {}", message.protocol)),
    };

    let latency = start.elapsed().as_millis() as u64;

    match result {
        Ok(data) => Ok(ProtocolResponse {
            protocol: message.protocol,
            success: true,
            data,
            error: None,
            latency_ms: latency,
        }),
        Err(e) => Ok(ProtocolResponse {
            protocol: message.protocol,
            success: false,
            data: serde_json::Value::Null,
            error: Some(e),
            latency_ms: latency,
        }),
    }
}

#[tauri::command]
pub async fn get_protocol_capabilities(
    protocol_id: String,
    _state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    // 说明：以下为本地能力描述（非 gateway 后端数据）。gateway 契约
    // 无“能力列表”方法，此表仅用于 UI 展示协议规范支持的方法集合。
    let capabilities = match protocol_id.as_str() {
        "jsonrpc" | "json-rpc" => vec![
            serde_json::json!({"name": "agent.run", "description": "运行 agent 对话（完整链路 gateway→think_d→llm_d）", "params": ["prompt", "session_id?"]}),
            serde_json::json!({"name": "agent.cancel", "description": "取消 agent 会话", "params": ["session_id"]}),
            serde_json::json!({"name": "llm.list_models", "description": "列出 gateway 可用的模型", "params": []}),
            serde_json::json!({"name": "mem.write", "description": "写入记忆", "params": ["content", "metadata?"]}),
            serde_json::json!({"name": "mem.search", "description": "搜索记忆", "params": ["query", "top_k?"]}),
            serde_json::json!({"name": "mem.get", "description": "按 id 获取记忆", "params": ["id"]}),
            serde_json::json!({"name": "mem.delete", "description": "按 id 删除记忆", "params": ["id"]}),
            serde_json::json!({"name": "mem.count", "description": "记忆条目计数", "params": []}),
            serde_json::json!({"name": "sched.dag_submit", "description": "提交 DAG 任务", "params": ["dag"]}),
            serde_json::json!({"name": "sched.dag_status", "description": "查询 DAG 任务状态", "params": ["dag_id"]}),
            serde_json::json!({"name": "sched.dag_cancel", "description": "取消 DAG 任务", "params": ["dag_id"]}),
            serde_json::json!({"name": "a2a.discover_agents", "description": "发现已注册 agent", "params": []}),
            serde_json::json!({"name": "a2a.register_agent", "description": "注册 agent", "params": ["name?", "url?"]}),
            serde_json::json!({"name": "a2a.unregister_agent", "description": "注销 agent", "params": []}),
            serde_json::json!({"name": "plugin.list", "description": "列出插件", "params": []}),
            serde_json::json!({"name": "plugin.execute", "description": "执行插件", "params": ["id", "params"]}),
            serde_json::json!({"name": "think.process", "description": "思考处理", "params": ["prompt"]}),
            serde_json::json!({"name": "info.health", "description": "网关健康检查", "params": []}),
            serde_json::json!({"name": "info.system", "description": "系统服务信息", "params": []}),
            serde_json::json!({"name": "info.history", "description": "历史记录", "params": []}),
            serde_json::json!({"name": "observe.query_metrics", "description": "查询运行指标", "params": ["name?"]}),
            serde_json::json!({"name": "ping", "description": "网关连通性探测", "params": []}),
        ],
        "mcp" => vec![
            serde_json::json!({"name": "tools/list", "description": "List available MCP tools", "params": []}),
            serde_json::json!({"name": "tools/call", "description": "Call MCP tool", "params": ["name", "arguments"]}),
            serde_json::json!({"name": "resources/list", "description": "List MCP resources", "params": []}),
            serde_json::json!({"name": "resources/read", "description": "Read MCP resource", "params": ["uri"]}),
            serde_json::json!({"name": "prompts/list", "description": "List MCP prompts", "params": []}),
            serde_json::json!({"name": "prompts/get", "description": "Get MCP prompt", "params": ["name", "arguments"]}),
            serde_json::json!({"name": "completion/complete", "description": "Get completions", "params": ["ref", "argument"]}),
            serde_json::json!({"name": "sampling/createMessage", "description": "Create LLM message", "params": ["messages", "modelPreferences"]}),
        ],
        "a2a" => vec![
            serde_json::json!({"name": "agent/discover", "description": "Discover A2A agents", "params": ["filter"]}),
            serde_json::json!({"name": "agent/describe", "description": "Get agent card", "params": ["agent_id"]}),
            serde_json::json!({"name": "task/create", "description": "Create A2A task", "params": ["agent_id", "message"]}),
            serde_json::json!({"name": "task/get", "description": "Get task status", "params": ["task_id"]}),
            serde_json::json!({"name": "task/cancel", "description": "Cancel task", "params": ["task_id"]}),
            serde_json::json!({"name": "task/list", "description": "List agent tasks", "params": ["agent_id"]}),
            serde_json::json!({"name": "message/send", "description": "Send message to agent", "params": ["agent_id", "message"]}),
            serde_json::json!({"name": "message/stream", "description": "Stream message to agent", "params": ["agent_id", "message"]}),
        ],
        "openai" => vec![
            serde_json::json!({"name": "chat.completions.create", "description": "Create chat completion", "params": ["model", "messages"]}),
            serde_json::json!({"name": "models.list", "description": "List available models", "params": []}),
            serde_json::json!({"name": "models.retrieve", "description": "Get model details", "params": ["model"]}),
            serde_json::json!({"name": "embeddings.create", "description": "Create embeddings", "params": ["model", "input"]}),
            serde_json::json!({"name": "fine_tuning.jobs.create", "description": "Create fine-tuning job", "params": ["model", "training_file"]}),
            serde_json::json!({"name": "assistants.create", "description": "Create assistant", "params": ["model", "instructions"]}),
            serde_json::json!({"name": "threads.create", "description": "Create thread", "params": []}),
            serde_json::json!({"name": "runs.create", "description": "Create run", "params": ["thread_id", "assistant_id"]}),
        ],
        _ => vec![],
    };

    Ok(capabilities)
}

fn get_backend_client(state: &AppState) -> Result<BackendClient, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(BackendClient::new(crate::backend_client::BackendConfig {
        gateway_url: config
            .gateway_url
            .clone()
            .unwrap_or_else(|| format!("http://127.0.0.1:{}", 8080)),
        timeout_seconds: config.timeout_seconds,
        api_key: config.api_key.clone(),
    }))
}

fn adapter_to_info(adapter: &ProtocolAdapter) -> ProtocolInfo {
    let (color, icon) = match adapter.protocol.as_str() {
        "mcp" => ("#4CAF50", "🔌"),
        "a2a" => ("#2196F3", "🤝"),
        "openai" => ("#FF9800", "🧠"),
        _ => ("#9E9E9E", "📡"),
    };

    ProtocolInfo {
        id: adapter.name.clone(),
        name: format!("{} v{}", adapter.protocol.to_uppercase(), adapter.version),
        description: format!("{} protocol adapter", adapter.protocol.to_uppercase()),
        version: adapter.version.clone(),
        status: adapter.status.clone(),
        endpoint: adapter.endpoint.clone(),
        capabilities: adapter.capabilities.clone(),
        color: color.to_string(),
        icon: icon.to_string(),
    }
}
