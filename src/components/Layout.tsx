import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';
import GlobalSearch from './GlobalSearch';
import ConnectionIndicator from './ConnectionIndicator';
import NotificationCenter from './NotificationCenter';
import { useNavigationShortcuts } from '../hooks/useKeyboardShortcuts';
import {
  LayoutDashboard, Server, Bot, ListTodo, Settings as SettingsIcon,
  FileText, Terminal, Cpu, Brain, Wrench, MessageSquare, Globe,
  Menu, X, ChevronLeft, ChevronRight, Sun, Moon, Bell, Sparkles, Eye, BarChart3,
  Search, Minus, Square, Maximize2, Command, Shield, Database, Grid, Activity, Layers
} from 'lucide-react';

declare global {
  interface Window {
    __TAURI__?: string;
    __TAURI_INTERNALS__?: Record<string, unknown>;
  }
}

interface NavItem {
  key: string;
  path: string;
  icon: React.ReactNode;
  label: string;
  category: 'core' | 'ai' | 'system';
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/', icon: <LayoutDashboard size={18} />, label: '仪表盘', category: 'core' },
  { key: 'agents', path: '/agents', icon: <Bot size={18} />, label: '智能体', category: 'core' },
  { key: 'tasks', path: '/tasks', icon: <ListTodo size={18} />, label: '任务', category: 'core' },
  { key: 'sessions', path: '/sessions', icon: <Layers size={18} />, label: '会话', category: 'core' },
  { key: 'ai-chat', path: '/ai-chat', icon: <MessageSquare size={18} />, label: 'AI 助手', category: 'core' },
  { key: 'skills', path: '/skills', icon: <Wrench size={18} />, label: '技能', category: 'core' },
  { key: 'tools', path: '/tools', icon: <Grid size={18} />, label: '工具', category: 'core' },
  { key: 'model-config', path: '/model-config', icon: <Brain size={18} />, label: '模型配置', category: 'ai' },
  { key: 'cognitive-loop', path: '/cognitive-loop', icon: <Eye size={18} />, label: '认知循环', category: 'ai' },
  { key: 'memory', path: '/memory-evolution', icon: <Database size={18} />, label: '记忆系统', category: 'ai' },
  { key: 'open-lab', path: '/open-lab', icon: <Sparkles size={18} />, label: '应用市场', category: 'ai' },
  { key: 'services', path: '/services', icon: <Server size={18} />, label: '服务网关', category: 'system' },
  { key: 'security', path: '/security', icon: <Shield size={18} />, label: '安全中心', category: 'system' },
  { key: 'system-monitor', path: '/system-monitor', icon: <BarChart3 size={18} />, label: '系统监控', category: 'system' },
  { key: 'telemetry', path: '/telemetry', icon: <Activity size={18} />, label: '遥测', category: 'system' },
  { key: 'logs-terminal', path: '/logs-terminal', icon: <Terminal size={18} />, label: '日志终端', category: 'system' },
  { key: 'settings', path: '/settings', icon: <SettingsIcon size={18} />, label: '系统设置', category: 'system' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : true;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDark = () => setDarkMode(prev => !prev);

  const [searchOpen, setSearchOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  useNavigationShortcuts();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleMinimize = () => {
    if (window.__TAURI__) {
      import('@tauri-apps/api/window').then(m => m.getCurrentWindow().minimize());
    }
  };

  const handleMaximize = () => {
    if (window.__TAURI__) {
      import('@tauri-apps/api/window').then(async ({ getCurrentWindow }) => {
        const win = getCurrentWindow();
        isMaximized ? await win.unmaximize() : await win.maximize();
        setIsMaximized(!isMaximized);
      });
    }
  };

  const handleClose = () => {
    if (window.__TAURI__) {
      import('@tauri-apps/api/window').then(m => m.getCurrentWindow().hide());
    } else {
      window.close();
    }
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.key}
        to={item.path}
        onClick={() => setMobileOpen(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: sidebarCollapsed ? '10px' : '10px 14px',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 150ms ease',
          color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
          backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: isActive ? '500' : '400',
          marginBottom: '2px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
        title={item.label}
      >
        <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.8 }}>{item.icon}</span>
        {!sidebarCollapsed && (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
        )}
      </Link>
    );
  };

  const renderNavSection = (category: string, title: string) => (
    <div style={{ marginBottom: '16px' }}>
      {!sidebarCollapsed && (
        <div style={{
          fontSize: '10px',
          fontWeight: '600',
          color: 'var(--text-muted)',
          padding: '0 14px',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {title}
        </div>
      )}
      {NAV_ITEMS.filter(item => item.category === category).map(renderNavItem)}
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)',
    }}>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 40,
            }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? '64px' : '240px' }}
        transition={{ duration: 0.2 }}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 50,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          padding: sidebarCollapsed ? '0 12px' : '0 20px',
          borderBottom: '1px solid var(--border-subtle)',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          flexShrink: 0,
        }}>
          <motion.span
            style={{
              fontSize: '18px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {sidebarCollapsed ? 'A' : 'Airymax AgentOS'}
          </motion.span>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              padding: 0,
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav style={{
          flex: 1,
          padding: '12px 8px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {renderNavSection('core', '核心功能')}
          {renderNavSection('ai', 'AI 能力')}
          {renderNavSection('system', '系统工具')}
        </nav>

        <div style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <button
            onClick={toggleDark}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              border: 'none',
              fontFamily: 'inherit',
              transition: 'all 150ms ease',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {!sidebarCollapsed && <span>{darkMode ? '浅色模式' : '深色模式'}</span>}
          </button>
        </div>
      </motion.aside>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        <header style={{
          height: '48px',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              display: window.__TAURI__ ? 'none' : undefined,
            }}
          >
            <Menu size={18} />
          </button>
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}>
            {NAV_ITEMS.find(n => n.path === location.pathname)?.label || '仪表盘'}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            title="全局搜索 (Ctrl+K)"
            style={{
              width: '34px', height: '34px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: 'transparent', color: 'var(--text-secondary)',
              cursor: 'pointer', position: 'relative', transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            <Search size={15} />
            <kbd style={{
              position: 'absolute', bottom: '-2px', right: '-4px',
              padding: '1px 5px', borderRadius: '3px', fontSize: '9px',
              border: '1px solid var(--border-subtle)', color: 'var(--text-muted)',
              fontFamily: 'monospace', lineHeight: 1, pointerEvents: 'none',
            }}>⌘K</kbd>
          </button>

          <NotificationCenter />

          {/* Window Controls (Tauri only) */}
          {window.__TAURI__ && (
            <>
              <button onClick={handleMinimize} title="最小化" style={{
                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer',
                border: 'none', background: 'transparent', transition: 'all 100ms ease',
              }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Minus size={14} />
              </button>
              <button onClick={handleMaximize} title={isMaximized ? '还原' : '最大化'} style={{
                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer',
                border: 'none', background: 'transparent', transition: 'all 100ms ease',
              }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                {isMaximized ? <Square size={12} /> : <Maximize2 size={13} />}
              </button>
              <button onClick={handleClose} title="关闭到托盘" style={{
                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer',
                border: 'none', background: 'transparent', transition: 'all 100ms ease',
              }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-light)'; e.currentTarget.style.color = 'var(--error-color)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <X size={14} />
              </button>
            </>
          )}

          {!window.__TAURI__ && (
            <>
              <button
                onClick={toggleDark}
                style={{
                  width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer',
                  border: 'none', background: 'transparent', position: 'relative', transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                transition: 'transform 150ms ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                U
              </div>
            </>
          )}
        </div>
        </header>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: 'var(--bg-primary)',
          padding: '24px',
        }}>
          <ErrorBoundary>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </ErrorBoundary>
        </div>

        <footer style={{
          height: '28px',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ConnectionIndicator compact showLabel />
            <span style={{ color: 'var(--text-muted)' }}>Airymax AgentOS v0.0.5</span>
          </div>
          <div>
            <span>{new Date().toLocaleDateString()}</span>
            <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>Ctrl+K 搜索</span>
            <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>Ctrl+1~0 导航</span>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              zIndex: 60,
              padding: '8px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        )}
      </AnimatePresence>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Layout;
