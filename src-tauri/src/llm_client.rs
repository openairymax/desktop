use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMProviderConfig {
    pub id: String,
    pub name: String,
    pub provider_type: String,
    pub base_url: String,
    pub api_key: Option<String>,
    pub model: String,
    #[serde(default = "default_timeout")]
    pub timeout_seconds: u64,
}

fn default_timeout() -> u64 { 120 }

impl LLMProviderConfig {
    pub fn openai(api_key: Option<String>, model: Option<String>) -> Self {
        Self {
            id: "openai".to_string(),
            name: "OpenAI".to_string(),
            provider_type: "openai".to_string(),
            base_url: "https://api.openai.com/v1".to_string(),
            api_key,
            model: model.unwrap_or_else(|| "gpt-4o".to_string()),
            timeout_seconds: 120,
        }
    }

    pub fn anthropic(api_key: Option<String>, model: Option<String>) -> Self {
        Self {
            id: "anthropic".to_string(),
            name: "Anthropic".to_string(),
            provider_type: "anthropic".to_string(),
            base_url: "https://api.anthropic.com/v1".to_string(),
            api_key,
            model: model.unwrap_or_else(|| "claude-3-5-sonnet-20241022".to_string()),
            timeout_seconds: 120,
        }
    }

    pub fn ollama(base_url: Option<String>, model: Option<String>) -> Self {
        Self {
            id: "localai".to_string(),
            name: "Local AI (Ollama)".to_string(),
            provider_type: "ollama".to_string(),
            base_url: base_url.unwrap_or_else(|| "http://localhost:11434/v1".to_string()),
            api_key: None,
            model: model.unwrap_or_else(|| "llama3".to_string()),
            timeout_seconds: 300,
        }
    }

    #[allow(dead_code)]
    pub fn from_json(value: &serde_json::Value) -> Option<Self> {
        let provider_type = value.get("type")
            .or_else(|| value.get("provider_type"))
            .and_then(|v| v.as_str())
            .unwrap_or("openai");
        Some(Self {
            id: value.get("id")?.as_str()?.to_string(),
            name: value.get("name").and_then(|v| v.as_str()).unwrap_or_default().to_string(),
            provider_type: provider_type.to_string(),
            base_url: value.get("base_url")?.as_str()?.to_string(),
            api_key: value.get("api_key").and_then(|v| v.as_str()).map(|s| s.to_string()),
            model: value.get("model").and_then(|v| v.as_str()).unwrap_or("gpt-4o").to_string(),
            timeout_seconds: value.get("timeout_seconds").and_then(|v| v.as_u64()).unwrap_or(120),
        })
    }
}

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

pub struct LLMClient {
    http: reqwest::Client,
}

impl LLMClient {
    pub fn new() -> Self {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(120))
            .connect_timeout(Duration::from_secs(10))
            .build()
            .unwrap_or_default();

        Self { http }
    }

    pub async fn chat(
        &self,
        config: &LLMProviderConfig,
        request: &ChatRequest,
    ) -> Result<ChatResponse, String> {
        log::info!(
            "LLM API call: provider={}, model={}, messages={}",
            config.provider_type,
            config.model,
            request.messages.len()
        );

        match config.provider_type.as_str() {
            "anthropic" => self.chat_anthropic(config, request).await,
            "ollama" => self.chat_openai_compat(config, request).await,
            _ => self.chat_openai(config, request).await,
        }
    }

    async fn chat_openai(
        &self,
        config: &LLMProviderConfig,
        request: &ChatRequest,
    ) -> Result<ChatResponse, String> {
        let url = format!("{}/chat/completions", config.base_url);
        let body = serde_json::to_value(request)
            .map_err(|e| format!("Failed to serialize request: {}", e))?;

        #[allow(unused_mut)]
        let mut req_builder = self
            .http
            .post(&url)
            .header("Content-Type", "application/json");

        if let Some(ref key) = config.api_key {
            req_builder = req_builder.header("Authorization", format!("Bearer {}", key));
        }

        let resp = req_builder
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("OpenAI API request failed: {}", e))?;

        let status = resp.status();
        let response_text = resp.text().await.map_err(|e| format!("Failed to read response: {}", e))?;

        if !status.is_success() {
            return Err(format!("OpenAI API error {}: {}", status, response_text));
        }

        let json: serde_json::Value = serde_json::from_str(&response_text)
            .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

        self.parse_openai_response(&json, &config.model)
    }

    async fn chat_anthropic(
        &self,
        config: &LLMProviderConfig,
        request: &ChatRequest,
    ) -> Result<ChatResponse, String> {
        let url = format!("{}/messages", config.base_url);

        let anthropic_messages: Vec<serde_json::Value> = request
            .messages
            .iter()
            .map(|m| {
                serde_json::json!({
                    "role": m.role,
                    "content": m.content
                })
            })
            .collect();

        let body = serde_json::json!({
            "model": config.model,
            "max_tokens": request.max_tokens.unwrap_or(4096),
            "messages": anthropic_messages,
            "temperature": request.temperature.unwrap_or(0.7),
            "stream": false
        });

        #[allow(unused_mut)]
        let mut req_builder = self
            .http
            .post(&url)
            .header("Content-Type", "application/json")
            .header("x-api-key", config.api_key.as_deref().unwrap_or(""))
            .header("anthropic-version", "2023-06-01");

        let resp = req_builder
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Anthropic API request failed: {}", e))?;

        let status = resp.status();
        let response_text = resp.text().await.map_err(|e| format!("Failed to read response: {}", e))?;

        if !status.is_success() {
            return Err(format!("Anthropic API error {}: {}", status, response_text));
        }

        let json: serde_json::Value = serde_json::from_str(&response_text)
            .map_err(|e| format!("Failed to parse Anthropic response: {}", e))?;

        self.parse_anthropic_response(&json, &config.model)
    }

    async fn chat_openai_compat(
        &self,
        config: &LLMProviderConfig,
        request: &ChatRequest,
    ) -> Result<ChatResponse, String> {
        let url = format!("{}/chat/completions", config.base_url);
        let body = serde_json::to_value(request)
            .map_err(|e| format!("Failed to serialize request: {}", e))?;

        let resp = self
            .http
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Ollama API request failed: {}", e))?;

        let status = resp.status();
        let response_text = resp.text().await.map_err(|e| format!("Failed to read response: {}", e))?;

        if !status.is_success() {
            return Err(format!("Ollama API error {}: {}", status, response_text));
        }

        let json: serde_json::Value = serde_json::from_str(&response_text)
            .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

        self.parse_openai_response(&json, &config.model)
    }

    fn parse_openai_response(
        &self,
        json: &serde_json::Value,
        model: &str,
    ) -> Result<ChatResponse, String> {
        let choice = json
            .get("choices")
            .and_then(|c| c.as_array())
            .and_then(|arr| arr.first())
            .ok_or_else(|| "No choices in OpenAI response".to_string())?;

        let message = choice
            .get("message")
            .ok_or_else(|| "No message in choice".to_string())?;

        let content = message
            .get("content")
            .and_then(|c| c.as_str())
            .unwrap_or("")
            .to_string();

        let finish_reason = choice
            .get("finish_reason")
            .and_then(|f| f.as_str())
            .unwrap_or("stop")
            .to_string();

        let usage = json.get("usage").map(|u| UsageInfo {
            prompt_tokens: u.get("prompt_tokens").and_then(|t| t.as_u64()).unwrap_or(0) as u32,
            completion_tokens: u.get("completion_tokens").and_then(|t| t.as_u64()).unwrap_or(0) as u32,
            total_tokens: u.get("total_tokens").and_then(|t| t.as_u64()).unwrap_or(0) as u32,
        }).unwrap_or(UsageInfo {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
        });

        Ok(ChatResponse {
            id: json
                .get("id")
                .and_then(|i| i.as_str())
                .unwrap_or("unknown")
                .to_string(),
            content,
            role: "assistant".to_string(),
            model: model.to_string(),
            finish_reason,
            usage,
            tool_calls: message.get("tool_calls").cloned(),
        })
    }

    fn parse_anthropic_response(
        &self,
        json: &serde_json::Value,
        model: &str,
    ) -> Result<ChatResponse, String> {
        let content_block = json
            .get("content")
            .and_then(|c| c.as_array())
            .and_then(|arr| arr.iter().find(|b| b.get("type").and_then(|t| t.as_str()) == Some("text")))
            .ok_or_else(|| "No text content in Anthropic response".to_string())?;

        let content = content_block
            .get("text")
            .and_then(|t| t.as_str())
            .unwrap_or("")
            .to_string();

        let usage = json.get("usage").map(|u| UsageInfo {
            prompt_tokens: u.get("input_tokens").and_then(|t| t.as_u64()).unwrap_or(0) as u32,
            completion_tokens: u.get("output_tokens").and_then(|t| t.as_u64()).unwrap_or(0) as u32,
            total_tokens: 0,
        }).unwrap_or(UsageInfo {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
        });

        Ok(ChatResponse {
            id: json
                .get("id")
                .and_then(|i| i.as_str())
                .unwrap_or("unknown")
                .to_string(),
            content,
            role: "assistant".to_string(),
            model: model.to_string(),
            finish_reason: "stop".to_string(),
            usage,
            tool_calls: None,
        })
    }

    pub async fn test_connection(&self, config: &LLMProviderConfig) -> Result<ConnectionTestResult, String> {
        let start = std::time::Instant::now();

        let test_request = ChatRequest {
            model: config.model.clone(),
            messages: vec![ChatMessage {
                role: "user".to_string(),
                content: "ping".to_string(),
                name: None,
                tool_calls: None,
                tool_call_id: None,
            }],
            temperature: Some(0.0),
            max_tokens: Some(5),
            stream: Some(false),
            tools: None,
            top_p: None,
        };

        match self.chat(config, &test_request).await {
            Ok(resp) => {
                let latency_ms = start.elapsed().as_millis() as u64;
                Ok(ConnectionTestResult {
                    success: true,
                    latency_ms,
                    models: vec![config.model.clone()],
                    message: format!(
                        "Connection successful. Model: {}, Tokens: {}",
                        config.model, resp.usage.total_tokens
                    ),
                })
            }
            Err(e) => {
                let latency_ms = start.elapsed().as_millis() as u64;
                Ok(ConnectionTestResult {
                    success: false,
                    latency_ms,
                    models: vec![],
                    message: format!("Connection failed: {}", e),
                })
            }
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionTestResult {
    pub success: bool,
    pub latency_ms: u64,
    pub models: Vec<String>,
    pub message: String,
}
