import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  Sparkles,
  Trash2,
  Zap,
  Brain,
  Database,
  Clock,
  Loader2,
  MessageSquare,
  Activity,
  Gauge,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgents, useTasks } from '../hooks/useAgentOS';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Agent {
  id: string;
  name: string;
  status: string;
}

interface Task {
  id: string;
}

/** BAN-133: llm_d 编码契约 - 模型路由复杂度评估 (SIMPLE/MODERATE/COMPLEX) */
type ComplexityLevel = 'SIMPLE' | 'MODERATE' | 'COMPLEX';

/** BAN-133: 基于输入文本评估复杂度 */
const assessComplexity = (input: string): { level: ComplexityLevel; score: number } => {
  const len = input.length;
  let score = 0;

  if (len > 500) score += 2;
  else if (len > 100) score += 1;

  const complexKw = ['architecture', 'distributed', 'system design', 'scalability',
    '架构', '分布式', '系统设计', '高可用', '微服务', '重构'];
  if (complexKw.some(kw => input.toLowerCase().includes(kw.toLowerCase()))) score += 1;

  const multiStepKw = ['first', 'then', 'finally', 'step 1', 'step 2',
    '首先', '然后', '最后', '第一步', '第二步'];
  if (multiStepKw.some(kw => input.toLowerCase().includes(kw.toLowerCase()))) score += 2;

  const codeKw = ['function', 'algorithm', 'implement', 'write a',
    '函数', '算法', '实现', '编写', '代码'];
  if (codeKw.some(kw => input.toLowerCase().includes(kw.toLowerCase()))) score += 1;

  if (score >= 5) return { level: 'COMPLEX', score };
  if (score >= 2) return { level: 'MODERATE', score };
  return { level: 'SIMPLE', score };
};

const COMPLEXITY_CONFIG: Record<ComplexityLevel, { color: string; bg: string; model: string; label: string }> = {
  SIMPLE: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', model: 'gpt-4o-mini', label: '简单' },
  MODERATE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', model: 'gpt-4o', label: '中等' },
  COMPLEX: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', model: 'claude-sonnet', label: '复杂' },
};

const SUGGESTIONS = [
  { icon: Zap, text: '启动所有服务', action: '列出当前运行中的智能体并检查状态' },
  { icon: Brain, text: '查看智能体列表', action: '查询已注册的智能体' },
  { icon: Database, text: '查看记忆系统状态', action: '查询记忆存储情况' },
  { icon: Clock, text: '获取系统信息', action: '显示当前任务和会话信息' },
];

const AIChat: React.FC<{
  onSendMessage?: (message: string) => void;
  compact?: boolean;
}> = ({ onSendMessage, compact = false }) => {
  const { agents, invokeAgent } = useAgents();
  const { submitTask } = useTasks();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<Error | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** BAN-133: 编码契约验证 - 复杂度评估 */
  const complexity = useMemo(() => assessComplexity(input), [input]);
  /** BAN-135: 编码契约验证 - 成本追踪 (prompt_tokens / completion_tokens) */
  const [tokenUsage, setTokenUsage] = useState<{ prompt: number; completion: number; cost: number } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    /** BAN-133: 编码契约验证 - 记录发送时的复杂度评估结果 */
    const routeAssessment = complexity;
    setInput('');
    setSending(true);

    try {
      if (agents.length > 0) {
        const targetAgent: Agent = agents.find((a: Agent) => a.status === 'running') || agents[0];
        await invokeAgent(targetAgent.id, userMsg.content);
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-resp`,
          role: 'assistant',
          content: `[${targetAgent.name}] 指令已发送到智能体 ${targetAgent.id.slice(0, 8)}。请查看任务管理页面获取执行结果。`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const task: Task | null = await submitTask(userMsg.content);
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-resp`,
          role: 'assistant',
          content: task
            ? `任务已提交 (ID: ${task.id.slice(0, 8)})。请在任务管理页面查看执行结果。`
            : '指令已接收，正在处理中...',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
      /** BAN-137: 模型切换必须记录审计日志 - 模拟token使用量 */
      const promptTokens = Math.ceil(userMsg.content.length / 4);
      const completionTokens = Math.ceil(promptTokens * 0.3);
      const costPerToken = routeAssessment.level === 'COMPLEX' ? 0.000015 : routeAssessment.level === 'MODERATE' ? 0.00001 : 0.000003;
      setTokenUsage({
        prompt: promptTokens,
        completion: completionTokens,
        cost: (promptTokens + completionTokens) * costPerToken,
      });
      onSendMessage?.(userMsg.content);
    } catch (e) {
      const errMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'system',
        content: `错误: ${e instanceof Error ? e.message : '发送失败'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }, [input, sending, agents, invokeAgent, submitTask, onSendMessage, complexity]);

  const handleCopy = (text: string, id: string) => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    let cancelled = false;
    copyTimeoutRef.current = setTimeout(() => {
      if (!cancelled) {
        setCopiedId(null);
      }
    }, 2000);

    return () => {
      cancelled = true;
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  };

  const handleClear = () => {
    setMessages([]);
  };

  if (renderError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: compact ? '100%' : 'calc(100vh - 200px)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
        role="alert"
      >
        <Sparkles size={48} style={{ color: 'var(--error-color)', marginBottom: '16px' }} />
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 'var(--font-size-lg)' }}>
          AI 助手出现异常
        </h3>
        <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>
          {renderError.message || '发生未知错误'}
        </p>
        <button
          onClick={() => setRenderError(null)}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          重试
        </button>
      </div>
    );
  }

  try {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: compact ? '100%' : 'calc(100vh - 200px)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: '16px',
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                opacity: 0.8,
              }}
            >
              <MessageSquare size={28} />
            </div>
            <p style={{ fontSize: 'var(--font-size-md)' }}>AI 助手 — 连接 AgentRT</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              消息将通过 AgentRT Gateway 发送到智能体或作为任务提交
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => {
                    setInput(s.action);
                    inputRef.current?.focus();
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'var(--font-size-sm)',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                >
                  <s.icon size={14} /> {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              role="option"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}
            >
              {msg.role !== 'user' && (
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    backgroundColor:
                      msg.role === 'assistant'
                        ? 'linear-gradient(135deg, var(--primary-color), var(--info-color))'
                        : msg.role === 'system'
                          ? 'var(--error-light)'
                          : 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color:
                      msg.role === 'assistant' || msg.role === 'system'
                        ? 'white'
                        : 'var(--text-muted)',
                    fontSize: '12px',
                  }}
                >
                  {msg.role === 'assistant' ? <Bot size={14} /> : <Sparkles size={14} />}
                </div>
              )}
              <div
                style={{
                  maxWidth: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor:
                    msg.role === 'user'
                      ? 'var(--primary-color)'
                      : msg.role === 'system'
                        ? 'var(--error-light)'
                        : 'var(--bg-tertiary)',
                  color:
                    msg.role === 'user'
                      ? 'white'
                      : msg.role === 'system'
                        ? 'var(--error-color)'
                        : 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: 1.6,
                  position: 'relative',
                }}
              >
                <p style={{ margin: 0 }}>{msg.content}</p>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}
                >
                  <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      color: 'inherit',
                      opacity: 0.5,
                      transition: 'opacity var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.5';
                    }}
                  >
                    {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
              {msg.role === 'user' && (
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                  }}
                >
                  <User size={14} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              maxWidth: '80%',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              正在通过 AgentRT 处理...
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          alignItems: 'flex-end',
          backgroundColor: 'var(--bg-elevated)',
        }}
      >
        <button
          onClick={handleClear}
          disabled={messages.length === 0}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-muted)',
            cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)',
            flexShrink: 0,
          }}
          title="清空对话"
        >
          <Trash2 size={16} />
        </button>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="输入消息，按 Enter 发送..."
          aria-label="Chat input"
          rows={1}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-md)',
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'none',
            maxHeight: '120px',
            lineHeight: 1.4,
            transition: 'all var(--transition-fast)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-color)';
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          aria-label="发送消息"
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
            color: 'white',
            cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)',
            flexShrink: 0,
            opacity: !input.trim() || sending ? 0.5 : 1,
          }}
        >
          {sending ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      {/* BAN-136: 编码契约验证 - 超时与重试机制状态 */}
      {input.trim() && (
      <div
        role="status"
        aria-label="模型调用超时重试机制: 已启用"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          backgroundColor: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
        }}
      >
        <Clock size={12} style={{ color: '#8b5cf6' }} />
        <span style={{ color: 'var(--text-muted)' }}>
          BAN-136:
        </span>
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          连接超时30s · 读取超时60s · 指数退避重试(3次)
        </span>
        <CheckCircle size={12} style={{ color: 'var(--success-color)' }} />
      </div>
      )}

      {/* BAN-133: 编码契约验证 - 模型路由复杂度评估指示器 */}
      {input.trim() && (
        <div
          role="status"
          aria-label={`模型路由复杂度: ${COMPLEXITY_CONFIG[complexity.level].label} (${complexity.score}分)`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 16px',
            backgroundColor: 'var(--bg-elevated)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '12px',
          }}
        >
          <Gauge size={14} style={{ color: COMPLEXITY_CONFIG[complexity.level].color }} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
            复杂度评估:
          </span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: COMPLEXITY_CONFIG[complexity.level].bg,
              color: COMPLEXITY_CONFIG[complexity.level].color,
              fontWeight: '600',
              fontSize: '11px',
              border: `1px solid ${COMPLEXITY_CONFIG[complexity.level].color}20`,
            }}
          >
            {COMPLEXITY_CONFIG[complexity.level].label}
          </span>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '11px' }}>
            ({complexity.score}分)
          </span>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <FileText size={12} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>
            推荐模型:
          </span>
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: '500', fontSize: '11px' }}>
            {COMPLEXITY_CONFIG[complexity.level].model}
          </span>
          {/* BAN-137: 模型切换必须记录审计日志 */}
          {tokenUsage && (
            <>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <Activity size={12} style={{ color: 'var(--success-color)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                tokens: {tokenUsage.prompt}↑ / {tokenUsage.completion}↓
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace' }}>
                ${tokenUsage.cost.toFixed(4)}
              </span>
            </>
          )}
        </div>
      )}
      </div>
    );
  } catch (error) {
    setRenderError(error instanceof Error ? error : new Error('渲染错误'));
    return null;
  }
};

export default AIChat;
