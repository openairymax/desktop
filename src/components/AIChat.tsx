import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgents, useTasks } from '../hooks/useAgentOS';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      if (agents.length > 0) {
        const targetAgent = agents.find((a: any) => a.status === 'running') || agents[0];
        await invokeAgent(targetAgent.id, userMsg.content);
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-resp`,
          role: 'assistant',
          content: `[${targetAgent.name}] 指令已发送到智能体 ${targetAgent.id.slice(0, 8)}。请查看任务管理页面获取执行结果。`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const task = await submitTask(userMsg.content);
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
  }, [input, sending, agents, invokeAgent, submitTask, onSendMessage]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([]);
  };

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
            <p style={{ fontSize: 'var(--font-size-md)' }}>AI 助手 — 连接 AgentOS</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              消息将通过 AgentOS Gateway 发送到智能体或作为任务提交
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
              正在通过 AgentOS 处理...
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
    </div>
  );
};

export default AIChat;
