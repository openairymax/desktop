import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  Command,
  LayoutDashboard,
  Bot,
  ListTodo,
  MessageSquare,
  Brain,
  Wrench,
  BarChart3,
  Terminal,
  Settings as SettingsIcon,
  Server,
  Eye,
  Shield,
  Database,
  Grid,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SearchResult {
  label: string;
  path: string;
  icon: React.ReactNode;
  category: string;
  shortcut?: string;
}

const SEARCH_ITEMS: SearchResult[] = [
  {
    label: '仪表盘',
    path: '/',
    icon: <LayoutDashboard size={16} />,
    category: '核心',
    shortcut: 'Ctrl+1',
  },
  {
    label: '智能体',
    path: '/agents',
    icon: <Bot size={16} />,
    category: '核心',
    shortcut: 'Ctrl+2',
  },
  {
    label: '任务',
    path: '/tasks',
    icon: <ListTodo size={16} />,
    category: '核心',
    shortcut: 'Ctrl+3',
  },
  {
    label: '会话',
    path: '/sessions',
    icon: <Layers size={16} />,
    category: '核心',
    shortcut: 'Ctrl+4',
  },
  {
    label: 'AI 助手',
    path: '/ai-chat',
    icon: <MessageSquare size={16} />,
    category: '核心',
    shortcut: 'Ctrl+5',
  },
  {
    label: '技能',
    path: '/skills',
    icon: <Wrench size={16} />,
    category: '核心',
    shortcut: 'Ctrl+6',
  },
  { label: '工具', path: '/tools', icon: <Grid size={16} />, category: '核心', shortcut: 'Ctrl+7' },
  {
    label: '模型配置',
    path: '/model-config',
    icon: <Brain size={16} />,
    category: 'AI能力',
    shortcut: 'Ctrl+8',
  },
  { label: '认知循环', path: '/cognitive-loop', icon: <Eye size={16} />, category: 'AI能力' },
  {
    label: '记忆系统',
    path: '/memory-evolution',
    icon: <Database size={16} />,
    category: 'AI能力',
  },
  { label: '应用市场', path: '/open-lab', icon: <Sparkles size={16} />, category: 'AI能力' },
  {
    label: '服务网关',
    path: '/services',
    icon: <Server size={16} />,
    category: '系统工具',
    shortcut: 'Ctrl+9',
  },
  { label: '安全中心', path: '/security', icon: <Shield size={16} />, category: '系统工具' },
  {
    label: '系统监控',
    path: '/system-monitor',
    icon: <BarChart3 size={16} />,
    category: '系统工具',
  },
  { label: '遥测', path: '/telemetry', icon: <Activity size={16} />, category: '系统工具' },
  { label: '日志终端', path: '/logs-terminal', icon: <Terminal size={16} />, category: '系统工具' },
  {
    label: '系统设置',
    path: '/settings',
    icon: <SettingsIcon size={16} />,
    category: '系统工具',
    shortcut: 'Ctrl+0',
  },
];

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [filtered, setFiltered] = useState<SearchResult[]>(SEARCH_ITEMS);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    setQuery('');
    setSelectedIndex(0);
    setFiltered(SEARCH_ITEMS);
  }, [open]);

  const navigateTo = useCallback((item: SearchResult | undefined) => {
    if (!item) return;
    navigate(item.path);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        navigateTo(filtered[selectedIndex]);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selectedIndex, filtered, navigateTo, onClose]);

  const categories = [...new Set(filtered.map((i) => i.category))];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '560px',
              maxWidth: '90vw',
              zIndex: 2001,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                  const q = e.target.value.trim();
                  setFiltered(
                    q
                      ? SEARCH_ITEMS.filter(
                          (item) =>
                            item.label.toLowerCase().includes(q.toLowerCase()) ||
                            item.category.toLowerCase().includes(q.toLowerCase()),
                        )
                      : SEARCH_ITEMS,
                  );
                }}
                placeholder="搜索页面、功能、设置..."
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <kbd
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace',
                  flexShrink: 0,
                }}
              >
                ESC
              </kbd>
            </div>

            <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  <Search size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>未找到匹配结果</p>
                </div>
              )}

              {categories.map((cat) => (
                <div key={cat}>
                  <div
                    style={{
                      padding: '6px 12px 4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {cat}
                  </div>
                  {filtered
                    .filter((i) => i.category === cat)
                    .map((item) => {
                      const globalIdx = filtered.indexOf(item);
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <button
                          key={item.path}
                          onClick={() => navigateTo(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '9px 12px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '13px',
                            color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
                            transition: 'all 100ms ease',
                            textAlign: 'left',
                          }}
                        >
                          <span
                            style={{
                              color: isSelected ? 'var(--primary-color)' : 'var(--text-muted)',
                              flexShrink: 0,
                            }}
                          >
                            {item.icon}
                          </span>
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.shortcut && (
                            <kbd
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-muted)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {item.shortcut}
                            </kbd>
                          )}
                          <ArrowRight
                            size={14}
                            style={{ opacity: isSelected ? 1 : 0, transition: 'opacity 100ms' }}
                          />
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '8px 16px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Command size={12} />K 打开搜索
              </span>
              <span>↑↓ 导航</span>
              <span>Enter 跳转</span>
              <span>Esc 关闭</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
