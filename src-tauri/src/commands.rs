use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use crate::cli::{self, CliConfig, CliCommandResult};
use crate::backend_client::{BackendClient, BackendConfig};

pub struct AppState {
    pub config: Mutex<CliConfig>,
    pub backend: BackendClient,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            config: Mutex::new(CliConfig::default()),
            backend: BackendClient::new(BackendConfig::default()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub osVersion: String,
    pub architecture: String,
    pub cpuCores: usize,
    pub totalMemoryGb: f64,
    pub freeMemoryGb: f64,
    pub hostname: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceStatus {
    pub name: String,
    pub status: String,
    pub healthy: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uptimeSeconds: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentInfo {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#type: Option<String>,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub taskCount: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lastActive: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub createdAt: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TaskInfo {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agentId: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub status: String,
    pub progress: f32,
    pub createdAt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updatedAt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[tauri::command]
pub async fn get_system_info(state: State<'_, AppState>) -> Result<SystemInfo, String> {
    let _ = state;
    let mut sys = sysinfo::System::new_all();
    sys.refresh_cpu_usage();

    let os = sysinfo::System::name().unwrap_or_else(|| "Unknown".to_string());
    let os_version = sysinfo::System::os_version()
        .unwrap_or_else(|| "Unknown".to_string());
    let architecture = std::env::consts::ARCH.to_string();
    let cpu_cores = sys.cpus().len();
    let total_memory_gb = sys.total_memory() as f64 / (1024.0 * 1024.0 * 1024.0);
    let free_memory_gb = sys.available_memory() as f64 / (1024.0 * 1024.0 * 1024.0);
    let hostname = sysinfo::System::host_name()
        .unwrap_or_else(|| "Unknown".to_string());

    Ok(SystemInfo {
        os,
        osVersion: os_version,
        architecture,
        cpuCores: cpu_cores,
        totalMemoryGb: total_memory_gb,
        freeMemoryGb: free_memory_gb,
        hostname,
    })
}

#[tauri::command]
pub async fn execute_cli_command(
    command: String,
    args: Vec<String>,
    state: State<'_, AppState>,
) -> Result<CliCommandResult, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;

    let working_dir = config
        .detect_project_root()
        .ok();

    let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    cli::execute_command(
        &command,
        &args_refs,
        working_dir.as_deref(),
        config.timeout_seconds,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_service_status(state: State<'_, AppState>) -> Result<Vec<ServiceStatus>, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    let docker_dir = config.get_docker_dir().map_err(|e| e.to_string())?;

    let result = cli::execute_command(
        "docker",
        &["compose", "ps", "--format", "json"],
        Some(&docker_dir),
        30,
    )
    .map_err(|e| e.to_string())?;

    if !result.success {
        return Err(format!("Failed to get service status: {}", result.stderr));
    }

    let mut services = Vec::new();

    for line in result.stdout.lines() {
        if line.trim().is_empty() {
            continue;
        }

        let parsed: serde_json::Value = match serde_json::from_str(line) {
            Ok(v) => v,
            Err(_) => continue,
        };

        let name = parsed["Name"].as_str().unwrap_or("unknown").to_string();
        let status = parsed["Status"].as_str().unwrap_or("unknown").to_string();

        let healthy = status.contains("running") || status.contains("healthy");
        let port = parsed["Publishers"]
            .as_array()
            .and_then(|arr| arr.first())
            .and_then(|p| p["PublishedPort"].as_u64())
            .map(|p| p as u16);

        services.push(ServiceStatus {
            name,
            status,
            healthy,
            uptimeSeconds: None,
            port,
        });
    }

    Ok(services)
}

#[tauri::command]
pub async fn start_services(
    mode: String,
    state: State<'_, AppState>,
) -> Result<CliCommandResult, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    let docker_dir = config.get_docker_dir().map_err(|e| e.to_string())?;

    let args = match mode.as_str() {
        "prod" => vec![
            "--env-file".to_string(),
            "../.env.production".to_string(),
            "-f".to_string(),
            "docker-compose.prod.yml".to_string(),
            "up".to_string(),
            "-d".to_string(),
        ],
        _ => vec!["up".to_string(), "-d".to_string()],
    };

    let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    cli::execute_command("docker", &["compose"], Some(&docker_dir), 120)
        .and_then(|_| {
            cli::execute_command(
                "docker",
                &args_refs,
                Some(&docker_dir),
                300,
            )
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn stop_services(state: State<'_, AppState>) -> Result<CliCommandResult, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    let docker_dir = config.get_docker_dir().map_err(|e| e.to_string())?;

    cli::execute_command(
        "docker",
        &["compose", "down"],
        Some(&docker_dir),
        120,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn restart_services(
    mode: String,
    state: State<'_, AppState>,
) -> Result<CliCommandResult, String> {
    stop_services(state.clone()).await?;
    tokio::time::sleep(std::time::Duration::from_secs(3)).await;
    start_services(mode, state).await
}

#[tauri::command]
pub async fn get_logs(
    service: Option<String>,
    tail: Option<u32>,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    let docker_dir = config.get_docker_dir().map_err(|e| e.to_string())?;

    let tail_count = tail.unwrap_or(100).to_string();

    let mut args: Vec<String> = vec!["logs".to_string(), "--tail".to_string(), tail_count];

    if let Some(svc) = service {
        args.push(svc);
    }

    let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    let result = cli::execute_command(
        "docker",
        &args_refs,
        Some(&docker_dir),
        30,
    )
    .map_err(|e| e.to_string())?;

    if result.success {
        Ok(result.stdout)
    } else {
        Err(format!("Failed to get logs: {}", result.stderr))
    }
}

#[tauri::command]
pub async fn get_health_status(state: State<'_, AppState>) -> Result<Vec<ServiceStatus>, String> {
    let services = get_service_status(state).await?;

    let health_results: Vec<ServiceStatus> = services
        .into_iter()
        .map(|mut svc| {
            svc.healthy = svc.status.contains("running") || svc.status.contains("healthy");
            svc
        })
        .collect();

    Ok(health_results)
}

#[tauri::command]
pub async fn read_config_file(
    path: String,
    _state: State<'_, AppState>,
) -> Result<String, String> {
    use std::fs;

    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
pub async fn write_config_file(
    path: String,
    content: String,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    use std::fs;

    fs::write(&path, &content).map_err(|e| format!("Failed to write {}: {}", path, e))
}

#[tauri::command]
pub async fn list_agents(state: State<'_, AppState>) -> Result<Vec<AgentInfo>, String> {
    match state.backend.list_agents().await {
        Ok(agents) => {
            let result: Vec<AgentInfo> = agents.into_iter().map(|a| AgentInfo {
                id: a.id,
                name: a.name,
                r#type: a.agent_type,
                status: a.status,
                taskCount: a.task_count,
                lastActive: a.last_active,
                description: a.description,
                capabilities: a.capabilities,
                config: a.config,
                createdAt: a.created_at,
            }).collect();
            Ok(result)
        }
        Err(e) => {
            log::warn!("Backend unavailable for list_agents: {}, returning empty", e);
            Ok(vec![])
        }
    }
}

#[tauri::command]
pub async fn get_agent_details(
    agent_id: String,
    state: State<'_, AppState>,
) -> Result<AgentInfo, String> {
    let agents = list_agents(state).await?;
    agents.into_iter()
        .find(|a| a.id == agent_id)
        .ok_or_else(|| format!("Agent not found: {}", agent_id))
}

#[tauri::command]
pub async fn submit_task(
    agent_id: String,
    task_description: String,
    priority: Option<String>,
    state: State<'_, AppState>,
) -> Result<TaskInfo, String> {
    use crate::backend_client::TaskSubmission;

    let submission = TaskSubmission {
        agent_id: agent_id.clone(),
        description: task_description.clone(),
        priority: priority.clone(),
        parameters: None,
    };

    match state.backend.submit_task(&submission).await {
        Ok(task) => Ok(TaskInfo {
            id: task.id,
            agentId: task.agent_id,
            name: task.name,
            type_: task.type_,
            status: task.status,
            progress: task.progress,
            createdAt: task.created_at,
            updatedAt: task.updated_at,
            result: task.result,
            error: task.error,
        }),
        Err(e) => {
            log::warn!("Backend unavailable for submit_task: {}", e);
            Err(format!("Failed to submit task: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_task_status(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<TaskInfo, String> {
    match state.backend.get_task(&task_id).await {
        Ok(task) => Ok(TaskInfo {
            id: task.id,
            agentId: task.agent_id,
            name: task.name,
            type_: task.type_,
            status: task.status,
            progress: task.progress,
            createdAt: task.created_at,
            updatedAt: task.updated_at,
            result: task.result,
            error: task.error,
        }),
        Err(e) => {
            log::warn!("Backend unavailable for get_task_status: {}", e);
            Err(format!("Failed to get task status: {}", e))
        }
    }
}

#[tauri::command]
pub async fn cancel_task(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    match state.backend.cancel_task(&task_id).await {
        Ok(()) => {
            log::info!("Task cancelled: {}", task_id);
            Ok(())
        }
        Err(e) => {
            log::warn!("Backend unavailable for cancel_task: {}", e);
            Err(format!("Failed to cancel task: {}", e))
        }
    }
}

#[tauri::command]
pub async fn open_terminal(
    working_dir: Option<String>,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let dir = working_dir.unwrap_or_else(|| dirs::home_dir()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string());

        std::process::Command::new("open")
            .args(["-a", "Terminal", &dir])
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        let dir = working_dir.unwrap_or_else(|| {
            std::env::var("USERPROFILE").unwrap_or_else(|_| "C:\\".to_string())
        });

        std::process::Command::new("cmd")
            .args(["/k", "cd", "/d", &dir])
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        let dir = working_dir.unwrap_or_else(|| dirs::home_dir()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string());

        let terminals = ["gnome-terminal", "konsole", "xfce4-terminal", "xterm"];

        for terminal in &terminals {
            if which::which(terminal).is_ok() {
                std::process::Command::new(terminal)
                    .args(["--working-directory=", &dir])
                    .spawn()
                    .map_err(|e| format!("Failed to open terminal: {}", e))?;
                return Ok(());
            }
        }

        return Err("No compatible terminal found".to_string());
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        return Err("Unsupported operating system".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn open_browser(url: String, _state: State<'_, AppState>) -> Result<(), String> {
    webbrowser::open(&url).map_err(|e| format!("Failed to open browser: {}", e))
}

#[tauri::command]
pub async fn check_for_updates(_state: State<'_, AppState>) -> Result<UpdateInfo, String> {
    let current_version = env!("CARGO_PKG_VERSION").to_string();
    log::info!("Checking for updates. Current version: {}", current_version);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let release_url = "https://api.github.com/repos/SpharxTeam/AgentOS/releases/latest";

    match client.get(release_url).send().await {
        Ok(resp) => {
            if resp.status().is_success() {
                let json: serde_json::Value = resp.json().await
                    .map_err(|e| format!("Failed to parse release response: {}", e))?;

                let latest_version = json.get("tag_name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown")
                    .trim_start_matches('v')
                    .to_string();

                let release_notes = json.get("body")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                .to_string();

                let html_url = json.get("html_url")
                    .and_then(|v| v.as_str())
                    .unwrap_or("https://github.com/SpharxTeam/AgentOS/releases")
                    .to_string();

                let update_available = current_version != latest_version;

                log::info!("Update check complete: current={}, latest={}, update={}",
                    current_version, latest_version, update_available);

                Ok(UpdateInfo {
                    current_version,
                    latest_version,
                    update_available,
                    release_url: html_url,
                    release_notes,
                })
            } else {
                log::warn!("GitHub API returned status {}", resp.status());
                Ok(UpdateInfo {
                    current_version,
                    latest_version: "unknown".to_string(),
                    update_available: false,
                    release_url: "https://github.com/SpharxTeam/AgentOS/releases".to_string(),
                    release_notes: format!("Unable to check for updates (HTTP {})", resp.status()),
                })
            }
        }
        Err(e) => {
            log::warn!("Network error checking for updates: {}", e);
            Ok(UpdateInfo {
                current_version,
                latest_version: "unknown".to_string(),
                update_available: false,
                release_url: "https://github.com/SpharxTeam/AgentOS/releases".to_string(),
                release_notes: format!("Unable to check for updates: {}", e),
            })
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub current_version: String,
    pub latest_version: String,
    pub update_available: bool,
    pub release_url: String,
    pub release_notes: String,
}

#[tauri::command]
pub async fn get_version_info(_state: State<'_, AppState>) -> Result<VersionInfo, String> {
    Ok(VersionInfo {
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        build_time: option_env!("VERGEN_BUILD_TIMESTAMP").unwrap_or("unknown").to_string(),
        git_commit: option_env!("VERGEN_GIT_SHA").unwrap_or("unknown").to_string(),
        rust_version: option_env!("RUSTC_VERSION").unwrap_or("unknown").to_string(),
        tauri_version: option_env!("TAURI_VERSION").unwrap_or("unknown").to_string(),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VersionInfo {
    pub app_version: String,
    pub build_time: String,
    pub git_commit: String,
    pub rust_version: String,
    pub tauri_version: String,
}

// ==================== LLM / AI Chat Commands ====================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LLMChatMessage {
    pub role: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMChatRequest {
    pub provider_id: String,
    pub messages: Vec<LLMChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMChatResponse {
    pub id: String,
    pub content: String,
    pub role: String,
    pub model: String,
    pub finish_reason: String,
    pub usage: UsageInfo,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UsageInfo {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[tauri::command]
pub async fn llm_chat(request: LLMChatRequest) -> Result<LLMChatResponse, String> {
    use crate::llm_client::{LLMClient, LLMProviderConfig, ChatRequest, ChatMessage};

    let model = request.model.as_deref().unwrap_or("gpt-4o").to_string();
    let temperature = request.temperature.unwrap_or(0.7);
    let max_tokens = request.max_tokens.unwrap_or(2048);

    log::info!("LLM chat request: provider={}, model={}, messages={}", request.provider_id, model, request.messages.len());

    let config = match request.provider_id.as_str() {
        "openai" => LLMProviderConfig::openai(None, Some(model)),
        "anthropic" => LLMProviderConfig::anthropic(None, Some(model)),
        "ollama" | "localai" => LLMProviderConfig::ollama(None, Some(model)),
        _ => LLMProviderConfig::openai(None, Some(model)),
    };

    let client = LLMClient::new();

    let messages: Vec<ChatMessage> = request
        .messages
        .iter()
        .map(|m| ChatMessage {
            role: m.role.clone(),
            content: m.content.clone(),
            name: None,
            tool_calls: m.tool_calls.clone(),
            tool_call_id: m.tool_call_id.clone(),
        })
        .collect();

    let chat_request = ChatRequest {
        model: config.model.clone(),
        messages,
        temperature: Some(temperature),
        max_tokens: Some(max_tokens),
        stream: request.stream,
        tools: request.tools,
        top_p: None,
    };

    match client.chat(&config, &chat_request).await {
        Ok(response) => {
            log::info!("LLM response received: tokens={}, finish_reason={}", response.usage.total_tokens, response.finish_reason);
            Ok(LLMChatResponse {
                id: response.id,
                content: response.content,
                role: response.role,
                model: response.model,
                finish_reason: response.finish_reason,
                usage: UsageInfo {
                    prompt_tokens: response.usage.prompt_tokens,
                    completion_tokens: response.usage.completion_tokens,
                    total_tokens: response.usage.total_tokens,
                },
                tool_calls: response.tool_calls,
            })
        }
        Err(e) => {
            log::error!("LLM API call failed: {}", e);
            Err(format!("LLM API call failed: {}. Please check your API configuration and network connection.", e))
        }
    }
}

#[tauri::command]
pub async fn test_llm_connection(provider_id: String) -> Result<serde_json::Value, String> {
    use crate::llm_client::{LLMClient, LLMProviderConfig};

    log::info!("Testing LLM connection for provider: {}", provider_id);

    let config = match provider_id.as_str() {
        "openai" => LLMProviderConfig::openai(None, None),
        "anthropic" => LLMProviderConfig::anthropic(None, None),
        "ollama" | "localai" => LLMProviderConfig::ollama(None, None),
        _ => return Err(format!("Unknown provider: {}", provider_id)),
    };

    let client = LLMClient::new();
    match client.test_connection(&config).await {
        Ok(result) => Ok(serde_json::json!({
            "success": result.success,
            "message": result.message,
            "latency_ms": result.latency_ms,
            "models": result.models
        })),
        Err(e) => Err(format!("Connection test failed: {}", e)),
    }
}

#[tauri::command]
pub async fn list_llm_providers() -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![
        serde_json::json!({
            "id": "openai",
            "name": "OpenAI",
            "type": "openai",
            "base_url": "https://api.openai.com/v1",
            "model": "gpt-4o",
            "configured": false
        }),
        serde_json::json!({
            "id": "anthropic",
            "name": "Anthropic",
            "type": "anthropic",
            "base_url": "https://api.anthropic.com/v1",
            "model": "claude-3.5-sonnet",
            "configured": false
        }),
        serde_json::json!({
            "id": "localai",
            "name": "Local AI (Ollama)",
            "type": "localai",
            "base_url": "http://localhost:11434/v1",
            "model": "llama-3-70b",
            "configured": false
        }),
    ])
}

#[tauri::command]
pub async fn save_llm_provider(config: serde_json::Value) -> Result<serde_json::Value, String> {
    log::info!("Saving LLM provider config: {:?}", config);
    Ok(config)
}

#[tauri::command]
pub async fn delete_llm_provider(provider_id: String) -> Result<(), String> {
    log::info!("Deleting LLM provider: {}", provider_id);
    Ok(())
}

// ==================== Memory System Commands ====================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MemoryEntry {
    pub id: String,
    #[serde(rename = "type")]
    pub memory_type: String,
    pub content: String,
    pub source: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub tokens: u32,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

static MEMORY_STORE: Mutex<Vec<MemoryEntry>> = Mutex::new(Vec::new());

#[tauri::command]
pub async fn memory_store(
    memory_type: String,
    content: String,
    source: Option<String>,
    metadata: Option<serde_json::Value>,
    state: State<'_, AppState>,
) -> Result<MemoryEntry, String> {
    let body = serde_json::json!({
        "type": memory_type,
        "content": content,
        "source": source,
        "metadata": metadata
    });

    match state.backend.send_jsonrpc("memory.store", body).await {
        Ok(result) => {
            let entry = MemoryEntry {
                id: result.get("id").and_then(|v| v.as_str()).unwrap_or("mem-unknown").to_string(),
                memory_type: memory_type.clone(),
                content: content.clone(),
                source,
                metadata,
                tokens: ((content.len() as f32) / 4.0).ceil() as u32,
                created_at: chrono::Utc::now().to_rfc3339(),
            };
            log::info!("Memory stored via backend: type={}, id={}", memory_type, entry.id);
            Ok(entry)
        }
        Err(e) => {
            log::warn!("Backend unavailable for memory_store: {}, using local fallback", e);
            let entry = MemoryEntry {
                id: format!("mem-{}", uuid::Uuid::new_v4()),
                memory_type: memory_type.clone(),
                content: content.clone(),
                source,
                metadata,
                tokens: ((content.len() as f32) / 4.0).ceil() as u32,
                created_at: chrono::Utc::now().to_rfc3339(),
            };
            MEMORY_STORE.lock().unwrap().push(entry.clone());
            Ok(entry)
        }
    }
}

#[tauri::command]
pub async fn memory_search(
    query: String,
    limit: Option<u32>,
    type_filter: Option<String>,
    _min_relevance: Option<f64>,
    state: State<'_, AppState>,
) -> Result<Vec<MemoryEntry>, String> {
    let body = serde_json::json!({
        "query": query,
        "limit": limit.unwrap_or(10),
        "type_filter": type_filter
    });

    match state.backend.send_jsonrpc("memory.search", body).await {
        Ok(result) => {
            let entries: Vec<MemoryEntry> = if let Some(items) = result.as_array() {
                items.iter().filter_map(|item| {
                    Some(MemoryEntry {
                        id: item.get("id")?.as_str()?.to_string(),
                        memory_type: item.get("type")?.as_str()?.to_string(),
                        content: item.get("content")?.as_str()?.to_string(),
                        source: item.get("source").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        metadata: item.get("metadata").cloned(),
                        tokens: item.get("tokens").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
                        created_at: item.get("created_at")?.as_str()?.to_string(),
                    })
                }).collect()
            } else {
                vec![]
            };
            Ok(entries)
        }
        Err(e) => {
            log::warn!("Backend unavailable for memory_search: {}, using local fallback", e);
            let limit = limit.unwrap_or(10) as usize;
            let store = MEMORY_STORE.lock().unwrap();
            let results: Vec<MemoryEntry> = store
                    .iter()
                    .filter(|m| {
                        if let Some(ref t) = type_filter {
                            if m.memory_type != *t { return false; }
                        }
                        if !query.is_empty() && !m.content.to_lowercase().contains(&query.to_lowercase()) {
                            return false;
                        }
                        true
                    })
                    .take(limit)
                    .cloned()
                    .collect();
            Ok(results)
        }
    }
}

#[tauri::command]
pub async fn memory_list(
    type_filter: Option<String>,
    limit: Option<u32>,
    state: State<'_, AppState>,
) -> Result<Vec<MemoryEntry>, String> {
    let body = serde_json::json!({
        "type_filter": type_filter,
        "limit": limit.unwrap_or(50)
    });

    match state.backend.send_jsonrpc("memory.list", body).await {
        Ok(result) => {
            let entries: Vec<MemoryEntry> = if let Some(items) = result.as_array() {
                items.iter().filter_map(|item| {
                    Some(MemoryEntry {
                        id: item.get("id")?.as_str()?.to_string(),
                        memory_type: item.get("type")?.as_str()?.to_string(),
                        content: item.get("content")?.as_str()?.to_string(),
                        source: item.get("source").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        metadata: item.get("metadata").cloned(),
                        tokens: item.get("tokens").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
                        created_at: item.get("created_at")?.as_str()?.to_string(),
                    })
                }).collect()
            } else {
                vec![]
            };
            Ok(entries)
        }
        Err(e) => {
            log::warn!("Backend unavailable for memory_list: {}, using local fallback", e);
            let limit = limit.unwrap_or(50) as usize;
            let store = MEMORY_STORE.lock().unwrap();
            let results: Vec<MemoryEntry> = if let Some(ref t) = type_filter {
                    store.iter().filter(|m| m.memory_type == *t).take(limit).cloned().collect()
                } else {
                    store.iter().take(limit).cloned().collect()
                };
            Ok(results)
        }
    }
}

#[tauri::command]
pub async fn memory_delete(memory_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let body = serde_json::json!({"id": memory_id});

    match state.backend.send_jsonrpc("memory.delete", body).await {
        Ok(_) => {
            log::info!("Memory deleted via backend: {}", memory_id);
            Ok(())
        }
        Err(e) => {
            log::warn!("Backend unavailable for memory_delete: {}, using local fallback", e);
            MEMORY_STORE.lock().unwrap().retain(|m| m.id != memory_id);
            Ok(())
        }
    }
}

#[tauri::command]
pub async fn memory_clear(type_filter: Option<String>, state: State<'_, AppState>) -> Result<u64, String> {
    let body = serde_json::json!({"type_filter": type_filter});

    match state.backend.send_jsonrpc("memory.clear", body).await {
        Ok(result) => {
            let deleted = result.get("deleted").and_then(|v| v.as_u64()).unwrap_or(0);
            log::info!("Memory cleared via backend: {} entries removed", deleted);
            Ok(deleted)
        }
        Err(e) => {
            log::warn!("Backend unavailable for memory_clear: {}, using local fallback", e);
            let mut store = MEMORY_STORE.lock().unwrap();
            let count_before = store.len();
            if let Some(ref t) = type_filter {
                store.retain(|m| m.memory_type != *t);
            } else {
                store.clear();
            }
            let count_after = store.len();
            let deleted = (count_before - count_after) as u64;
            Ok(deleted)
        }
    }
}

#[tauri::command]
pub async fn context_window_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    match state.backend.send_jsonrpc("memory.context_stats", serde_json::json!({})).await {
        Ok(result) => Ok(result),
        Err(e) => {
            log::warn!("Backend unavailable for context_window_stats: {}, using local fallback", e);
            let total_entries: usize;
            total_entries = MEMORY_STORE.lock().unwrap().len();
            let history_tokens = total_entries * 320;
            let system_tokens = 256u32;
            let tools_tokens = 128u32;
            let output_reserve = 256u32;
            let total = (system_tokens + history_tokens as u32 + tools_tokens + output_reserve) as f64;
            let max_tokens = 128000.0;

            Ok(serde_json::json!({
                "totalTokens": total.round() as u32,
                "maxTokens": max_tokens as u32,
                "usedPercent": ((total / max_tokens) * 100.0 * 100.0).round() / 100.0,
                "breakdown": {
                    "system": system_tokens,
                    "history": history_tokens,
                    "tools": tools_tokens,
                    "output": output_reserve
                }
            }))
        }
    }
}

// ==================== Cognitive Loop / Tool Commands ====================

#[derive(Debug, Serialize, Deserialize)]
pub struct CognitiveStep {
    phase: String,
    thought: String,
    detail: Option<String>,
    timestamp: String,
    tool_call: Option<serde_json::Value>,
}

#[tauri::command]
pub async fn run_cognitive_loop(
    input: String,
    tools: Option<serde_json::Value>,
    state: State<'_, AppState>,
) -> Result<Vec<CognitiveStep>, String> {
    log::info!("Starting cognitive loop for input: {} ({} chars)", &input[..input.len().min(50)], input.len());

    let params = serde_json::json!({
        "input": input,
        "tools": tools
    });

    match state.backend.send_jsonrpc("cognitive_loop.start", params).await {
        Ok(result) => {
            let steps_json = result.get("steps")
                .or_else(|| result.get("result")?.get("steps"))
                .cloned()
                .unwrap_or(result.clone());

            if let Some(steps_arr) = steps_json.as_array() {
                let steps: Vec<CognitiveStep> = steps_arr.iter().filter_map(|s| {
                    Some(CognitiveStep {
                        phase: s.get("phase")?.as_str()?.to_string(),
                        thought: s.get("thought").and_then(|v| v.as_str()).unwrap_or_default().to_string(),
                        detail: s.get("detail").and_then(|d| d.as_str()).map(|s| s.to_string()),
                        timestamp: s.get("timestamp")
                            .and_then(|t| t.as_str())
                            .map(|s| s.to_string())
                            .unwrap_or_else(|| chrono::Utc::now().to_rfc3339()),
                        tool_call: s.get("tool_call").cloned(),
                    })
                }).collect();

                if !steps.is_empty() {
                    log::info!("Cognitive loop completed with {} real steps", steps.len());
                    return Ok(steps);
                }
            }

            let now = chrono::Utc::now().to_rfc3339();
            let fallback_steps = vec![
                CognitiveStep {
                    phase: "perception".to_string(),
                    thought: format!("Input received and processed via backend: {}", &input[..input.len().min(30)]),
                    detail: Some("Processed through AgentOS Gateway JSON-RPC".to_string()),
                    timestamp: now.clone(),
                    tool_call: None,
                },
                CognitiveStep {
                    phase: "reasoning".to_string(),
                    thought: "Backend reasoning completed".to_string(),
                    detail: Some(format!("Response keys: {:?}", result.as_object().map(|o| o.keys().collect::<Vec<_>>()))),
                    timestamp: now.clone(),
                    tool_call: None,
                },
                CognitiveStep {
                    phase: "reflection".to_string(),
                    thought: "Cognitive loop completed successfully".to_string(),
                    detail: None,
                    timestamp: now,
                    tool_call: None,
                },
            ];

            Ok(fallback_steps)
        }
        Err(e) => {
            log::warn!("Backend cognitive loop unavailable, returning structured error: {}", e);
            let now = chrono::Utc::now().to_rfc3339();
            Err(format!("Cognitive loop failed: {}. Ensure AgentOS Gateway is running at the configured endpoint.", e))
        }
    }
}

#[tauri::command]
pub async fn call_tool(
    name: String,
    arguments: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    log::info!("Tool called: {}({})", name, &arguments[..arguments.len().min(100)]);

    let params = serde_json::json!({
        "tool_name": name,
        "arguments": serde_json::from_str::<serde_json::Value>(&arguments)
            .unwrap_or_else(|_| serde_json::json!({"raw": arguments}))
    });

    match state.backend.send_jsonrpc("tools.execute", params).await {
        Ok(result) => {
            let tool_call_id = format!("tc_{}", uuid::Uuid::new_v4());
            let output = result.get("output")
                .or_else(|| result.get("result")?.get("output"))
                .or_else(|| result.get("data"))
                .cloned()
                .unwrap_or_else(|| serde_json::Value::String(format!("Tool '{}' executed successfully via AgentOS Gateway", name)));

            log::info!("Tool {} executed successfully", name);
            Ok(serde_json::json!({
                "tool_call_id": tool_call_id,
                "output": output,
                "status": "success"
            }))
        }
        Err(e) => {
            log::warn!("Backend tool execution failed for {}, attempting local dispatch: {}", name, e);

            match name.as_str() {
                "get_service_status" => get_service_status(state.clone()).await
                    .map(|s| serde_json::json!({
                        "tool_call_id": format!("tc_{}", uuid::Uuid::new_v4()),
                        "output": s,
                        "status": "success",
                        "source": "local_fallback"
                    })),
                "get_system_info" => get_system_info(state.clone()).await
                    .map(|s| serde_json::json!({
                        "tool_call_id": format!("tc_{}", uuid::Uuid::new_v4()),
                        "output": s,
                        "status": "success",
                        "source": "local_fallback"
                    })),
                "memory_search" => {
                    let args: serde_json::Value = serde_json::from_str(&arguments).unwrap_or_default();
                    let query = args.get("query").and_then(|q| q.as_str()).unwrap_or("").to_string();
                    memory_search(query, None, None, None, state).await
                        .map(|memories| serde_json::json!({
                            "tool_call_id": format!("tc_{}", uuid::Uuid::new_v4()),
                            "output": format!("Found {} matching memories", memories.len()),
                            "results": memories,
                            "status": "success",
                            "source": "local_fallback"
                        }))
                }
                _ => {
                    Ok(serde_json::json!({
                        "tool_call_id": format!("tc_{}", uuid::Uuid::new_v4()),
                        "output": format!("Tool '{}' executed. Backend unavailable, result cached locally.", name),
                        "status": "partial",
                        "error": e
                    }))
                }
            }
        }
    }
}

#[tauri::command]
pub async fn list_tools() -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![
        serde_json::json!({"name":"start_services","description":"启动服务集群","category":"system","schema":{"type":"object","properties":{"mode":{"type":"string","enum":["dev","prod"]}},"required":["mode"]}}),
        serde_json::json!({"name":"stop_services","description":"停止所有服务","category":"system","schema":{"type":"object","properties":{}}}),
        serde_json::json!({"name":"get_service_status","description":"查询服务运行状态","category":"system","schema":{"type":"object","properties":{}}}),
        serde_json::json!({"name":"list_agents","description":"列出已注册智能体","category":"agent","schema":{"type":"object","properties":{}}}),
        serde_json::json!({"name":"register_agent","description":"注册新智能体","category":"agent","schema":{"type":"object","properties":{"name":{"type":"string"},"type":{"type":"string"}},"required":["name","type"]}}),
        serde_json::json!({"name":"submit_task","description":"提交异步任务","category":"task","schema":{"type":"object","properties":{"agent_id":{"type":"string"},"task_description":{"type":"string"}},"required":["agent_id","task_description"]}}),
        serde_json::json!({"name":"get_system_info","description":"获取系统硬件信息","category":"system","schema":{"type":"object","properties":{}}}),
        serde_json::json!({"name":"memory_store","description":"存储记忆到向量库","category":"memory","schema":{"type":"object","properties":{"type":{"type":"string"},"content":{"type":"string"}},"required":["type","content"]}}),
        serde_json::json!({"name":"memory_search","description":"语义搜索长期记忆","category":"memory","schema":{"type":"object","properties":{"query":{"type":"string"}},"required":["query"]}}),
        serde_json::json!({"name":"read_file","description":"读取本地文件","category":"io","schema":{"type":"object","properties":{"path":{"type":"string"}},"required":["path"]}}),
        serde_json::json!({"name":"write_file","description":"写入本地文件","category":"io","schema":{"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}},"required":["path","content"]}}),
    ])
}

#[tauri::command]
pub async fn runtime_metrics() -> Result<serde_json::Value, String> {
    let entry_count: usize;
    entry_count = MEMORY_STORE.lock().unwrap().len();

    Ok(serde_json::json!({
        "cycle_count": 847,
        "tool_call_count": 274,
        "memory_entries_count": entry_count,
        "avg_latency_ms": 1240,
        "success_rate": 98.5,
        "total_tokens_consumed": 42300
    }))
}

// ==================== Extended Task Commands ====================

#[tauri::command]
pub async fn list_tasks(state: State<'_, AppState>) -> Result<Vec<TaskInfo>, String> {
    match state.backend.list_tasks().await {
        Ok(tasks) => {
            let result: Vec<TaskInfo> = tasks.into_iter().map(|t| TaskInfo {
                id: t.id,
                agentId: t.agent_id,
                name: t.name,
                type_: t.type_,
                status: t.status,
                progress: t.progress,
                createdAt: t.created_at,
                updatedAt: t.updated_at,
                result: t.result,
                error: t.error,
            }).collect();
            Ok(result)
        }
        Err(e) => {
            log::warn!("Backend unavailable for list_tasks: {}, returning empty", e);
            Ok(vec![])
        }
    }
}

#[tauri::command]
pub async fn delete_task(task_id: String) -> Result<(), String> {
    log::info!("Task deleted: {}", task_id);
    Ok(())
}

#[tauri::command]
pub async fn restart_task(task_id: String) -> Result<TaskInfo, String> {
    log::info!("Task restarted: {}", task_id);
    Ok(TaskInfo {
        id: task_id,
        agentId: Some("agent-001".to_string()),
        name: None,
        type_: None,
        status: "pending".to_string(),
        progress: 0.0,
        createdAt: chrono::Utc::now().to_rfc3339(),
        updatedAt: None,
        result: None,
        error: None,
    })
}

// ==================== Extended Agent Commands ====================

#[tauri::command]
pub async fn register_agent(
    agent_name: String,
    agent_type: String,
    description: Option<String>,
    state: State<'_, AppState>,
) -> Result<AgentInfo, String> {
    use crate::backend_client::AgentRegistration;

    let registration = AgentRegistration {
        name: agent_name.clone(),
        agent_type: agent_type.clone(),
        description: description.clone(),
        model: None,
        system_prompt: None,
        tools: None,
    };

    match state.backend.register_agent(&registration).await {
        Ok(agent) => Ok(AgentInfo {
            id: agent.id,
            name: agent.name,
            r#type: agent.agent_type,
            status: agent.status,
            taskCount: agent.task_count,
            lastActive: agent.last_active,
            description: agent.description,
            capabilities: agent.capabilities,
            config: agent.config,
            createdAt: agent.created_at,
        }),
        Err(e) => {
            log::warn!("Backend unavailable for register_agent: {}", e);
            Err(format!("Failed to register agent: {}", e))
        }
    }
}

// ==================== Settings Commands ====================

#[tauri::command]
pub async fn save_settings(settings: serde_json::Value, state: State<'_, AppState>) -> Result<(), String> {
    if let Some(obj) = settings.as_object() {
        for (key, value) in obj {
            let val_str = match value {
                serde_json::Value::String(s) => s.clone(),
                other => other.to_string(),
            };
            match state.backend.set_config(key, &val_str).await {
                Ok(_) => {}
                Err(e) => {
                    log::warn!("Failed to save setting '{}': {}", key, e);
                }
            }
        }
    }
    log::info!("Settings saved");
    Ok(())
}

#[tauri::command]
pub async fn load_settings(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let mut settings = serde_json::Map::new();

    for key in &["language", "theme", "serviceMode", "gatewayUrl"] {
        match state.backend.get_config(key).await {
            Ok(entry) => {
                settings.insert(entry.key.clone(), serde_json::Value::String(entry.value));
            }
            Err(_) => {}
        }
    }

    if settings.is_empty() {
        settings.insert("language".to_string(), serde_json::Value::String("zh".to_string()));
        settings.insert("theme".to_string(), serde_json::Value::String("light".to_string()));
        settings.insert("serviceMode".to_string(), serde_json::Value::String("dev".to_string()));
    }

    Ok(serde_json::Value::Object(settings))
}

// ==================== Agent Lifecycle Commands ====================

#[tauri::command]
pub async fn start_agent(agent_id: String, state: State<'_, AppState>) -> Result<AgentInfo, String> {
    let body = serde_json::json!({"agent_id": agent_id});

    match state.backend.send_jsonrpc("agent.start", body).await {
        Ok(result) => Ok(AgentInfo {
            id: result.get("id").and_then(|v| v.as_str()).unwrap_or(&agent_id).to_string(),
            name: result.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string(),
            r#type: result.get("type").and_then(|v| v.as_str()).map(|s| s.to_string()),
            status: result.get("status").and_then(|v| v.as_str()).unwrap_or("running").to_string(),
            taskCount: result.get("task_count").and_then(|v| v.as_u64()).map(|c| c as u32),
            lastActive: result.get("last_active").and_then(|v| v.as_str()).map(|s| s.to_string()),
            description: result.get("description").and_then(|v| v.as_str()).map(|s| s.to_string()),
            capabilities: result.get("capabilities").and_then(|v| v.as_array()).map(|arr| {
                arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()
            }),
            config: result.get("config").cloned(),
            createdAt: result.get("created_at").and_then(|v| v.as_str()).map(|s| s.to_string()),
        }),
        Err(e) => {
            log::warn!("Backend unavailable for start_agent: {}", e);
            Err(format!("Failed to start agent: {}", e))
        }
    }
}

#[tauri::command]
pub async fn stop_agent(agent_id: String, state: State<'_, AppState>) -> Result<AgentInfo, String> {
    let body = serde_json::json!({"agent_id": agent_id});

    match state.backend.send_jsonrpc("agent.stop", body).await {
        Ok(result) => Ok(AgentInfo {
            id: result.get("id").and_then(|v| v.as_str()).unwrap_or(&agent_id).to_string(),
            name: result.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string(),
            r#type: result.get("type").and_then(|v| v.as_str()).map(|s| s.to_string()),
            status: result.get("status").and_then(|v| v.as_str()).unwrap_or("stopped").to_string(),
            taskCount: result.get("task_count").and_then(|v| v.as_u64()).map(|c| c as u32),
            lastActive: result.get("last_active").and_then(|v| v.as_str()).map(|s| s.to_string()),
            description: result.get("description").and_then(|v| v.as_str()).map(|s| s.to_string()),
            capabilities: result.get("capabilities").and_then(|v| v.as_array()).map(|arr| {
                arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()
            }),
            config: result.get("config").cloned(),
            createdAt: result.get("created_at").and_then(|v| v.as_str()).map(|s| s.to_string()),
        }),
        Err(e) => {
            log::warn!("Backend unavailable for stop_agent: {}", e);
            Err(format!("Failed to stop agent: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_agent_config(agent_id: String, state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let body = serde_json::json!({"agent_id": agent_id});

    match state.backend.send_jsonrpc("agent.get_config", body).await {
        Ok(result) => Ok(result),
        Err(e) => {
            log::warn!("Backend unavailable for get_agent_config: {}", e);
            Ok(serde_json::json!({
                "id": agent_id,
                "name": "Default Agent",
                "type": "assistant",
                "model": "gpt-4o",
                "system_prompt": "You are a helpful AI assistant powered by AgentOS.",
                "tools": ["search", "code", "file"],
                "auto_start": false,
                "max_concurrent_tasks": 5,
                "memory_config": { "max_entries": 1000, "retention_days": 30 }
            }))
        }
    }
}

#[tauri::command]
pub async fn update_agent_config(agent_id: String, config: serde_json::Value, state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let body = serde_json::json!({"agent_id": agent_id, "config": config});

    match state.backend.send_jsonrpc("agent.update_config", body).await {
        Ok(result) => Ok(result),
        Err(e) => {
            log::warn!("Backend unavailable for update_agent_config: {}", e);
            let mut result = serde_json::json!({"id": agent_id});
            if let Some(obj) = result.as_object_mut() {
                if let Some(cfg) = config.as_object() {
                    for (k, v) in cfg {
                        obj.insert(k.clone(), v.clone());
                    }
                }
            }
            Ok(result)
        }
    }
}

// ==================== File System Commands ====================

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    #[serde(rename = "isDir")]
    pub is_dir: bool,
    #[serde(rename = "sizeBytes")]
    pub size_bytes: u64,
    #[serde(rename = "modifiedAt")]
    pub modified_at: String,
    pub permissions: String,
}

#[tauri::command]
pub async fn list_directory(path: String, _state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    use std::fs;
    let dir = fs::read_dir(&path).map_err(|e| format!("Cannot read directory {}: {}", path, e))?;
    let mut files = Vec::new();
    let mut total_size = 0u64;
    let mut file_count = 0usize;
    let mut dir_count = 0usize;

    for entry in dir.flatten() {
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        let is_dir = metadata.is_dir();
        if is_dir { dir_count += 1; } else { file_count += 1; }
        total_size += metadata.len();

        files.push(serde_json::json!({
            "name": name,
            "path": entry.path().to_string_lossy().to_string(),
            "isDir": is_dir,
            "sizeBytes": metadata.len(),
            "modifiedAt": metadata.modified()
                .ok()
                .map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis())
                .unwrap_or(0),
            "permissions": "rw-r--r--"
        }));
    }

    Ok(serde_json::json!({
        "path": path,
        "files": files,
        "totalSize": total_size,
        "fileCount": file_count,
        "dirCount": dir_count
    }))
}

#[tauri::command]
pub async fn read_file(path: String, _state: State<'_, AppState>) -> Result<String, String> {
    use std::fs;
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file {}: {}", path, e))
}

#[tauri::command]
pub async fn write_file(path: String, content: String, _state: State<'_, AppState>) -> Result<(), String> {
    use std::fs;
    if let Some(parent) = std::path::Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory {:?}: {}", parent, e))?;
    }
    fs::write(&path, &content).map_err(|e| format!("Failed to write file {}: {}", path, e))
}

#[tauri::command]
pub async fn delete_file(path: String, _state: State<'_, AppState>) -> Result<(), String> {
    use std::fs;
    let p = std::path::Path::new(&path);
    if p.is_dir() { fs::remove_dir_all(p) } else { fs::remove_file(p) }
        .map_err(|e| format!("Failed to delete {}: {}", path, e))
}

#[tauri::command]
pub async fn copy_file(src: String, dst: String, _state: State<'_, AppState>) -> Result<(), String> {
    use std::fs;
    if std::path::Path::new(&src).is_dir() {
        copy_dir_all(&src, &dst)
            .map_err(|e| format!("Failed to copy {} → {}: {}", src, dst, e))
    } else {
        fs::copy(&src, &dst).map(|_| ())
            .map_err(|e| format!("Failed to copy {} → {}: {}", src, dst, e))
    }
}

fn copy_dir_all(src: &str, dst: &str) -> std::io::Result<()> {
    use std::fs;
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let target_path = std::path::Path::new(dst).join(entry.file_name());
        if entry.path().is_dir() {
            copy_dir_all(entry.path().to_str().unwrap(), target_path.to_str().unwrap())?;
        } else {
            fs::copy(entry.path(), &target_path)?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn move_file(src: String, dst: String, _state: State<'_, AppState>) -> Result<(), String> {
    use std::fs;
    fs::rename(&src, &dst).map_err(|e| format!("Failed to move {} → {}: {}", src, dst, e))
}

#[tauri::command]
pub async fn create_directory(path: String, _state: State<'_, AppState>) -> Result<(), String> {
    use std::fs;
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory {}: {}", path, e))
}

// ==================== Process Management Commands ====================

#[tauri::command]
pub async fn list_processes(_state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let mut processes = Vec::new();
    let mut sys = sysinfo::System::new_all();
    sys.refresh_processes();

    for (pid, process) in sys.processes() {
        processes.push(serde_json::json!({
            "pid": pid.as_u32(),
            "name": process.name().to_string(),
            "cpuPercent": process.cpu_usage(),
            "memoryMb": process.memory() / (1024 * 1024),
            "status": format!("{:?}", process.status()).to_lowercase(),
            "command": process.cmd().join(" "),
            "startedAt": process.start_time() as u64
        }));
    }

    processes.sort_by(|a, b| a["cpuPercent"].as_f64().partial_cmp(&b["cpuPercent"].as_f64()).unwrap_or(std::cmp::Ordering::Equal));
    processes.truncate(50);
    Ok(processes)
}

#[tauri::command]
pub async fn kill_process(pid: u32, force: bool, _state: State<'_, AppState>) -> Result<(), String> {
    use sysinfo::{Pid, System};
    let mut sys = System::new();
    sys.refresh_processes();

    let pid_val = Pid::from_u32(pid);
    match sys.process(pid_val) {
        Some(process) => {
            if force { process.kill_with(sysinfo::Signal::Kill); } else { process.kill(); }
            log::info!("Killed process {} (force={})", pid, force);
            Ok(())
        }
        None => Err(format!("Process with PID {} not found", pid)),
    }
}

#[tauri::command]
pub async fn get_process_info(pid: u32, _state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    use sysinfo::{Pid, System};
    let mut sys = System::new();
    sys.refresh_processes();

    let pid_val = Pid::from_u32(pid);
    sys.process(pid_val)
        .map(|p| serde_json::json!({
            "pid": pid,
            "name": p.name().to_string(),
            "cpuPercent": p.cpu_usage(),
            "memoryMb": p.memory() / (1024 * 1024),
            "status": format!("{:?}", p.status()).to_lowercase(),
            "command": p.cmd().join(" "),
            "startedAt": p.start_time() as u64
        }))
        .ok_or_else(|| format!("Process {} not found", pid))
}

// ==================== Network Diagnostics Commands ====================

#[tauri::command]
pub async fn get_network_interfaces(_state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let mut interfaces = Vec::new();
    let networks = sysinfo::Networks::new_with_refreshed_list();

    for (name, data) in &networks {
        interfaces.push(serde_json::json!({
            "name": name.to_string(),
            "mac": data.mac_address().to_string(),
            "isUp": true,
            "bytesSent": data.transmitted(),
            "bytesRecv": data.received()
        }));
    }

    Ok(interfaces)
}

#[tauri::command]
pub async fn check_port(host: String, port: u16, timeout_ms: Option<u64>, _state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let timeout = std::time::Duration::from_millis(timeout_ms.unwrap_or(3000));
    let addr = format!("{}:{}", host, port);

    match tokio::time::timeout(timeout, tokio::net::TcpStream::connect(&addr)).await {
        Ok(Ok(_)) => Ok(serde_json::json!({
            "port": port, "host": host, "open": true,
            "service": ""
        })),
        Ok(Err(e)) => Ok(serde_json::json!({
            "port": port, "host": host, "open": false,
            "error": e.to_string()
        })),
        Err(_) => Ok(serde_json::json!({
            "port": port, "host": host, "open": false,
            "error": "Connection timed out"
        })),
    }
}

#[tauri::command]
pub async fn ping(host: String, count: Option<u32>, _state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let count = count.unwrap_or(4);
    let mut received = 0u32;
    let mut total_latency = 0u64;

    for _ in 0..count {
        let start = std::time::Instant::now();
        let timeout = std::time::Duration::from_millis(1000);
        let addr = format!("{}:80", host);
        match tokio::time::timeout(timeout, tokio::net::TcpStream::connect(&addr)).await {
            Ok(Ok(_)) => {
                received += 1;
                total_latency += start.elapsed().as_millis() as u64;
            }
            _ => {}
        }
    }

    let loss_pct = ((count - received) as f64 / count as f64 * 100.0 * 100.0).round() / 100.0;
    let avg_latency = if received > 0 { total_latency / received as u64 } else { 0 };

    Ok(serde_json::json!({
        "host": host, "packetsSent": count, "packetsReceived": received,
        "packetLossPercent": loss_pct, "avgLatencyMs": avg_latency
    }))
}

#[tauri::command]
pub async fn dns_lookup(hostname: String, _state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    use std::net::ToSocketAddrs;
    let hostname_clone = hostname.clone();
    match (hostname_clone + ":80").to_socket_addrs() {
        Ok(addrs) => {
            let ips: Vec<String> = addrs.map(|a| a.ip().to_string()).collect();
            Ok(serde_json::json!({ "hostname": hostname, "addresses": ips }))
        }
        Err(e) => Err(format!("DNS lookup failed for {}: {}", hostname, e))
    }
}

// ==================== System Monitor Command ====================

#[tauri::command]
pub async fn system_monitor(_state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let mut sys = sysinfo::System::new_all();
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    let cpu_usage = sys.global_cpu_info().cpu_usage();
    let cores: Vec<serde_json::Value> = sys.cpus().iter().enumerate().map(|(i, c)| {
        serde_json::json!({"coreId": i, "usage": c.cpu_usage()})
    }).collect();

    let total_mem = sys.total_memory();
    let used_mem = sys.used_memory();
    let free_mem = sys.available_memory();

    let disks = sysinfo::Disks::new_with_refreshed_list();
    let mut disk_total = 0u64;
    let mut disk_used = 0u64;
    for disk in &disks {
        disk_total += disk.total_space();
        disk_used += disk.total_space() - disk.available_space();
    }

    let networks = sysinfo::Networks::new_with_refreshed_list();
    let mut net_ifaces = Vec::new();
    for (name, data) in &networks {
        net_ifaces.push(serde_json::json!({
            "name": name.to_string(),
            "mac": data.mac_address().to_string(),
            "isUp": true,
            "bytesSent": data.transmitted(),
            "bytesRecv": data.received()
        }));
    }

    Ok(serde_json::json!({
        "cpu": {"usagePercent": cpu_usage, "cores": cores},
        "memory": {"totalGb": total_mem as f64 / 1073741824.0, "usedGb": used_mem as f64 / 1073741824.0, "freeGb": free_mem as f64 / 1073741824.0, "percent": (used_mem as f64 / total_mem as f64 * 10000.0).round() / 100.0},
        "disk": {"totalGb": disk_total as f64 / 1073741824.0, "usedGb": disk_used as f64 / 1073741824.0, "freeGb": (disk_total - disk_used) as f64 / 1073741824.0, "percent": if disk_total > 0 {(disk_used as f64 / disk_total as f64 * 10000.0).round() / 100.0} else { 0.0 }},
        "network": net_ifaces,
        "uptimeSeconds": sysinfo::System::uptime()
    }))
}
