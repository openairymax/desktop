import React, { useState } from 'react';
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
  { key: 'dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'nav.dashboard', category: 'core' },
  { key: 'services', path: '/services', icon: <Server className="w-5 h-5" />, label: 'nav.services', category: 'core' },
  { key: 'agents', path: '/agents', icon: <Bot className="w-5 h-5" />, label: 'nav.agents', category: 'core' },
  { key: 'tasks', path: '/tasks', icon: <ListTodo className="w-5 h-5" />, label: 'nav.tasks', category: 'core' },
  { key: 'dual-thinking', path: '/dual-thinking', icon: <Sparkles className="w-5 h-5" />, label: 'nav.dualThinking', category: 'advanced' },
  { key: 'agent-runtime', path: '/agent-runtime', icon: <Cpu className="w-5 h-5" />, label: 'nav.agentRuntime', category: 'advanced' },
  { key: 'memory-evolution', path: '/memory-evolution', icon: <Brain className="w-5 h-5" />, label: 'nav.memoryEvolution', category: 'advanced' },
  { key: 'cognitive-loop', path: '/cognitive-loop', icon: <Eye className="w-5 h-5" />, label: 'nav.cognitiveLoop', category: 'advanced' },
  { key: 'tools', path: '/tools', icon: <Wrench className="w-5 h-5" />, label: 'nav.tools', category: 'advanced' },
  { key: 'ai-chat', path: '/ai-chat', icon: <MessageSquare className="w-5 h-5" />, label: 'nav.aiChat', category: 'advanced' },
  { key: 'protocols', path: '/protocols', icon: <Globe className="w-5 h-5" />, label: 'nav.protocols', category: 'advanced' },
  { key: 'system-monitor', path: '/system-monitor', icon: <BarChart3 className="w-5 h-5" />, label: 'nav.systemMonitor', category: 'system' },
  { key: 'logs', path: '/logs', icon: <FileText className="w-5 h-5" />, label: 'nav.logs', category: 'system' },
  { key: 'terminal', path: '/terminal', icon: <Terminal className="w-5 h-5" />, label: 'nav.terminal', category: 'system' },
  { key: 'settings', path: '/settings', icon: <SettingsIcon className="w-5 h-5" />, label: 'nav.settings', category: 'system' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const renderNavItems = (category: string) => (
    <>
      {NAV_ITEMS.filter(item => item.category === category).map(item => (
        <Link
          key={item.key}
          to={item.path}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
            location.pathname === item.path
              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          } ${sidebarCollapsed ? 'justify-center' : ''}`}
          title={t(item.label)}
        >
          {item.icon}
          {!sidebarCollapsed && <span>{t(item.label)}</span>}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-gray-200 dark:border-gray-800 ${sidebarCollapsed ? 'justify-center px-2' : 'px-6'}`}>
          <motion.span
            className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
          >
            {sidebarCollapsed ? 'A' : 'AgentOS'}
          </motion.span>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:block ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-400" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {!sidebarCollapsed && <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 uppercase tracking-wider">{t('nav.categories.core')}</div>}
          {renderNavItems('core')}
          {!sidebarCollapsed && <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 uppercase tracking-wider">{t('nav.categories.advanced')}</div>}
          {renderNavItems('advanced')}
          {!sidebarCollapsed && <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 uppercase tracking-wider">{t('nav.categories.system')}</div>}
          {renderNavItems('system')}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <button
            onClick={toggleDark}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!sidebarCollapsed && <span>{darkMode ? t('nav.lightMode') : t('nav.darkMode')}</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t(NAV_ITEMS.find(n => n.path === location.pathname)?.label || 'nav.dashboard')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={toggleDark}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg lg:hidden"
            >
              {darkMode ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
              U
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ErrorBoundary>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile close button */}
      <AnimatePresence>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="fixed top-4 right-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg lg:hidden"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
