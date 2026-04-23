import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Trash2,
  Zap,
  Brain,
  Database,
  Clock,
} from "lucide-react";
import sdk from "../services/agentos-sdk";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  tokenCount?: number;
  toolCalls?: Array<{ name: string; args: string }>;
}

const SUGGESTIONS = [
  { icon: Zap, text: "启动所有服务", action: "启动服务集群" },
  { icon: Brain, text: "查看智能体列表", action: "列出已注册智能体" },
  { icon: Database, text: "查看记忆系统状态", action: "查询记忆存储情况" },
  { icon: Clock, text: "获取系统信息", action: "显示硬件配置" },
];

const AIChat: React.FC<{
  onSendMessage?: (message: string) => void;
  initialMessages?: ChatMessage[];
  model?: string;
  compact?: boolean;
}> = ({ onSendMessage, initialMessages, model = "gpt-4o", compact = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const content = text || inputValue.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
      tokenCount: Math.ceil(content.length / 4),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    if (onSendMessage) onSendMessage(content);

    try {
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const response = await sdk.chat({
        providerId: "openai",
        messages: [
          { role: "system", content: `你是 AgentOS 智能助手，一个工业级 AI 操作系统的前端界面。你的职责是帮助用户管理 AgentOS 的各项功能，包括：服务管理、智能体注册、任务提交、LLM 配置、记忆系统等。请用中文回复，保持简洁专业。` },
          ...allMessages,
        ],
        model,
        temperature: 0.7,
        maxTokens: 2048,
      });

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-resp`,
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        tokenCount: response.usage.completionTokens,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Store conversation in memory
      try {
        await sdk.memoryStore("conversation", `用户: ${content} → 助手: ${response.content.slice(0, 100)}...`, "ai-chat");
      } catch { /* memory store is best-effort */ }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: "抱歉，AI 对话服务暂时不可用。请检查 LLM 配置是否正确，或稍后重试。",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, model, onSendMessage]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSuggestionClick = (suggestion: typeof SUGGESTIONS[0]) => {
    handleSend(suggestion.action);
  };

  const handleClear = () => {
    if (confirm("确定要清空所有对话记录吗？")) {
      setMessages([]);
    }
  };

  if (compact && messages.length === 0) return null;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "var(--bg-primary)",
      borderRadius: compact ? "var(--radius-lg)" : undefined,
      overflow: "hidden",
    }}>
      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: compact ? "16px" : "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
              color: "var(--text-muted)",
            }}
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 8px 32px rgba(99,102,241,0.3)',
                  '0 12px 40px rgba(99,102,241,0.4)',
                  '0 8px 32px rgba(99,102,241,0.3)'
                ]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary-color), var(--info-color))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={36} color="white" />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: "var(--font-size-xl)", 
                fontWeight: 'var(--font-weight-bold)', 
                color: "var(--text-primary)"
              }}>
                AgentOS 智能助手
              </h3>
              <p style={{ 
                margin: "12px 0 0 0", 
                fontSize: "var(--font-size-md)", 
                maxWidth: "400px", 
                textAlign: "center", 
                lineHeight: 1.5,
                color: 'var(--text-secondary)'
              }}>
                通过自然语言与 AgentOS 交互，我可以帮您管理服务、操作智能体、查询系统状态、配置模型。
              </p>
            </div>

            {/* Suggestions */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginTop: "8px" }}>
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  whileHover={{
                    y: -2,
                    boxShadow: 'var(--shadow-md)',
                    borderColor: 'var(--primary-color)'
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "12px 20px",
                    fontSize: "var(--font-size-sm)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all var(--transition-fast)",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  <s.icon size={16} style={{ color: 'var(--primary-color)' }} />
                  {s.text}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            {!compact && (
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "8px",
                paddingBottom: "12px",
                borderBottom: "1px solid var(--border-subtle)"
              }}>
                <span style={{ 
                  fontSize: "var(--font-size-sm)", 
                  color: "var(--text-muted)"
                }}>
                  {messages.length} 条消息 · {messages.reduce((sum, m) => sum + (m.tokenCount || 0), 0)} tokens
                </span>
                <motion.button 
                  onClick={handleClear}
                  whileHover={{ color: 'var(--error-color)' }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--text-muted)",
                    transition: "all var(--transition-fast)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  <Trash2 size={14} />
                  清空
                </motion.button>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex",
                    gap: "12px",
                    maxWidth: compact ? "100%" : "85%",
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role !== "user" && (
                    <div style={{
                      width: "36px", 
                      height: "36px", 
                      borderRadius: "var(--radius-md)",
                      background: "linear-gradient(135deg, var(--primary-color), var(--info-color))",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      <Bot size={18} color="white" />
                    </div>
                  )}

                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    style={{
                      maxWidth: "100%",
                      padding: "16px 20px",
                      borderRadius: msg.role === "user"
                        ? "var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)"
                        : "var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)",
                      background: msg.role === "user"
                        ? "linear-gradient(135deg, var(--primary-color), var(--primary-light))"
                        : "var(--bg-secondary)",
                      color: msg.role === "user" ? "white" : "var(--text-primary)",
                      boxShadow: "var(--shadow-sm)",
                      lineHeight: 1.65,
                      fontSize: "var(--font-size-md)",
                      position: "relative",
                    }}
                  >
                    {/* Render markdown-like content */}
                    <div style={{ 
                      whiteSpace: "pre-wrap", 
                      wordBreak: "break-word",
                      marginBottom: "8px"
                    }}>{msg.content}</div>

                    {/* Meta bar */}
                    <div style={{
                      display: "flex", 
                      alignItems: "center", 
                      gap: "10px",
                      paddingTop: "8px",
                      borderTop: msg.role === "user" ? "1px solid rgba(255,255,255,0.15)" : "1px solid var(--border-subtle)",
                      fontSize: "var(--font-size-xs)",
                      opacity: 0.7,
                    }}>
                      <span>{msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.tokenCount && <span>{msg.tokenCount} tokens</span>}
                      <motion.button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ 
                          background: "none", 
                          border: "none", 
                          cursor: "pointer", 
                          padding: "4px", 
                          marginLeft: "auto", 
                          opacity: 0.7,
                          borderRadius: "var(--radius-sm)"
                        }}
                        title="复制"
                      >
                        {copiedId === msg.id ? (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Check size={14} style={{ color: msg.role === "user" ? "white" : "var(--text-primary)" }} />
                          </motion.div>
                        ) : (
                          <Copy size={14} style={{ color: msg.role === "user" ? "white" : "var(--text-primary)" }} />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>

                  {msg.role === "user" && (
                    <div style={{
                      width: "36px", 
                      height: "36px", 
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-tertiary)", 
                      border: "1px solid var(--border-subtle)",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <User size={18} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex", 
                    gap: "12px",
                    alignSelf: "flex-start", 
                    maxWidth: "85%"
                  }}
                >
                  <div style={{
                    width: "36px", 
                    height: "36px", 
                    borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, var(--primary-color), var(--info-color))",
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <Bot size={18} color="white" />
                  </div>
                  <motion.div 
                    animate={{ 
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity
                    }}
                    style={{
                      padding: "16px 20px", 
                      borderRadius: "var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)",
                      background: "var(--bg-secondary)", 
                      border: "1px solid var(--border-subtle)",
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <div style={{
                        width: 16, 
                        height: 16, 
                        border: "2px solid var(--primary-color)",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }} />
                      <span style={{ 
                        fontSize: "var(--font-size-sm)", 
                        color: "var(--text-secondary)" 
                      }}>正在思考...</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        padding: compact ? "12px" : "20px",
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-secondary)",
      }}>
        <motion.div 
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-xl)",
            padding: "12px 16px",
            transition: "all var(--transition-fast)",
          }}
          whileHover={{ borderColor: 'var(--primary-color)' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary-color)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; }}
        >
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { 
                e.preventDefault(); 
                handleSend(); 
              }
            }}
            placeholder="输入消息... (Enter 发送)"
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: "var(--font-size-md)",
              fontFamily: "inherit",
              maxHeight: "120px",
              lineHeight: 1.5,
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            style={{
              flexShrink: 0,
              padding: "10px 18px",
              borderRadius: "var(--radius-lg)",
              background: inputValue.trim() && !isLoading ? "linear-gradient(135deg, var(--primary-color), var(--info-color))" : "var(--bg-tertiary)",
              color: inputValue.trim() && !isLoading ? "white" : "var(--text-muted)",
              border: "none",
              cursor: inputValue.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: inputValue.trim() && !isLoading ? "var(--shadow-sm)" : "none",
              transition: "all var(--transition-fast)",
            }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RotateCcw size={18} />
              </motion.div>
            ) : (
              <Send size={18} />
            )}
          </motion.button>
        </motion.div>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginTop: "12px", 
          fontSize: "var(--font-size-xs)", 
          color: "var(--text-muted)"
        }}>
          <span>Shift+Enter 换行 · Enter 发送</span>
          <span>模型: {model}</span>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
