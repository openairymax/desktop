import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';
import {
  LayoutDashboard, Server, Bot, ListTodo, Settings as SettingsIcon,
  FileText, Terminal, Cpu, Brain, Wrench, MessageSquare, Globe,
  Menu, X, ChevronLeft, ChevronRight, Sun, Moon, Bell, Sparkles, Eye, BarChart3
} from 'lucide-react';

interface NavItem {
  key: string;
  path: string;
  icon: React.ReactNode;
  label: string;
  category: 'core' | 'advanced' | 'system';
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/', icon: <LayoutDashboard size={18} />, label: 'nav.dashboard', category: 'core' },
  { key: 'services', path: '/services', icon: <Server size={18} />, label: 'nav.services', category: 'core' },
  { key: 'agents', path: '/agents', icon: <Bot size={18} />, label: 'nav.agents', category: 'core' },
  { key: 'tasks', path: '/tasks', icon: <ListTodo size={18} />, label: 'nav.tasks', category: 'core' },
  { key: 'dual-thinking', path: '/dual-thinking', icon: <Sparkles size={18} />, label: 'nav.dualThinking', category: 'advanced' },
  { key: 'agent-runtime', path: '/agent-runtime', icon: <Cpu size={18} />, label: 'nav.agentRuntime', category: 'advanced' },
  { key: 'memory-evolution', path: '/memory-evolution', icon: <Brain size={18} />, label: 'nav.memoryEvolution', category: 'advanced' },
  { key: 'cognitive-loop', path: '/cognitive-loop', icon: <Eye size={18} />, label: 'nav.cognitiveLoop', category: 'advanced' },
  { key: 'tools', path: '/tools', icon: <Wrench size={18} />, label: 'nav.tools', category: 'advanced' },
  { key: 'ai-chat', path: '/ai-chat', icon: <MessageSquare size={18} />, label: 'nav.aiChat', category: 'advanced' },
  { key: 'protocols', path: '/protocols', icon: <Globe size={18} />, label: 'nav.protocols', category: 'advanced' },
  { key: 'system-monitor', path: '/system-monitor', icon: <BarChart3 size={18} />, label: 'nav.systemMonitor', category: 'system' },
  { key: 'logs', path: '/logs', icon: <FileText size={18} />, label: 'nav.logs', category: 'system' },
  { key: 'terminal', path: '/terminal', icon: <Terminal size={18} />, label: 'nav.terminal', category: 'system' },
  { key: 'settings', path: '/settings', icon: <SettingsIcon size={18} />, label: 'nav.settings', category: 'system' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
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
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(item.label)}</span>
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
          {t(title)}
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
            {sidebarCollapsed ? 'A' : 'AgentOS'}
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
          {renderNavSection('core', 'nav.categories.core')}
          {renderNavSection('advanced', 'nav.categories.advanced')}
          {renderNavSection('system', 'nav.categories.system')}
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
            {!sidebarCollapsed && <span>{darkMode ? t('nav.lightMode') : t('nav.darkMode')}</span>}
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
                display: 'none',
              }}
              className="md:flex"
            >
              <Menu size={18} />
            </button>
            <h2 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              {t(NAV_ITEMS.find(n => n.path === location.pathname)?.label || 'nav.dashboard')}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              style={{
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                position: 'relative',
                transition: 'all 150ms ease',
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
              <Bell size={15} />
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--error-color)',
              }} />
            </button>
            <button
              onClick={toggleDark}
              style={{
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                transition: 'all 150ms ease',
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
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            >
              U
            </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-color)',
              }} />
              <span>AgentOS v2.1.0</span>
            </div>
            <span>Ready</span>
          </div>
          <div>
            <span>{new Date().toLocaleDateString()}</span>
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
    </div>
  );
};

export default Layout;