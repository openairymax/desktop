import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Settings, Globe, Palette, Bell, Link, Monitor, Save, RotateCcw,
  Trash2, CheckCircle, AlertCircle, Loader2, Monitor as MonitorIcon,
  Sun, Moon, Languages, Volume2, Zap, Shield, Database
} from 'lucide-react';
import { saveSettings, loadSettings, getSystemInfo, type SystemInfo } from '../services/agentos-sdk';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language?.startsWith('zh') ? 'zh' : 'en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    const saved = localStorage.getItem('theme');
    return saved as 'light' | 'dark' | 'auto' || 'dark';
  });
  const [backendUrl, setBackendUrl] = useState('http://localhost:18080');
  const [autoStart, setAutoStart] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const loadSavedSettings = useCallback(async () => {
    try {
      const data = await loadSettings();
      if (data.language) setLanguage(data.language as string);
      if (data.theme) setTheme(data.theme as 'light' | 'dark' | 'auto');
      if (data.backendUrl) setBackendUrl(data.backendUrl as string);
      if (typeof data.autoStart === 'boolean') setAutoStart(data.autoStart);
      if (typeof data.notifications === 'boolean') setNotifications(data.notifications);
    } catch {
      console.warn('Failed to load settings');
    }
  }, []);

  const loadSystemInfo = useCallback(async () => {
    try {
      const data = await getSystemInfo();
      setSystemInfo(data);
    } catch {
      console.warn('Failed to get system info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedSettings();
    loadSystemInfo();
  }, [loadSavedSettings, loadSystemInfo]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveSettings({ language, theme, backendUrl, autoStart, notifications });
      setMessage({ type: 'success', text: t('settings.savedSuccess') });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: t('settings.saveError') });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm(t('settings.resetConfirm'))) return;
    setLanguage('zh');
    setTheme('dark');
    setBackendUrl('http://localhost:18080');
    setAutoStart(false);
    setNotifications(true);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setMessage(null);
    try {
      await fetch(backendUrl, { method: 'HEAD', mode: 'no-cors' });
      setMessage({ type: 'success', text: t('settings.connectionSuccess', { url: backendUrl }) });
    } catch {
      setMessage({ type: 'error', text: t('settings.connectionFailed', { error: 'Unable to reach server' }) });
    } finally {
      setTestingConnection(false);
    }
  };

  const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      style={{
        position: 'relative',
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        backgroundColor: checked ? 'var(--primary-color)' : 'var(--bg-tertiary)',
        border: `1px solid ${checked ? 'var(--primary-color)' : 'var(--border-color)'}`,
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: checked ? '22px' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute',
          top: '2px',
          left: '0',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        }}
      />
    </button>
  );

  const SettingRow: React.FC<{
    icon: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
  }> = ({ icon, title, description, children }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      padding: '16px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--primary-light), transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary-color)',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <p style={{
            margin: 0,
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-primary)',
          }}>
            {title}
          </p>
          {description && (
            <p style={{
              margin: '2px 0 0 0',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-muted)',
            }}>
              {description}
            </p>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--text-muted)' }} />
        <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: '900px', margin: '0 auto' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <Settings size={24} />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              {t('settings.title')}
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>{t('settings.description')}</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            marginBottom: '24px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: message.type === 'success' ? 'var(--success-light)' : 'var(--error-light)',
            border: `1px solid ${message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)'}`,
            color: message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)',
          }}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>{message.text}</span>
        </motion.div>
      )}

      {/* Settings Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Appearance */}
        <Card title={t('settings.appearance') || 'Appearance'} icon={<Palette size={18} />} variant="default">
          <SettingRow
            icon={<Languages size={18} />}
            title={t('settings.language')}
            description={t('settings.languageHelp')}
          >
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-md)',
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="zh">简体中文</option>
              <option value="en">English</option>
            </select>
          </SettingRow>

          <SettingRow
            icon={theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            title={t('settings.theme')}
            description={t('settings.themeHelp')}
          >
            <div style={{ display: 'flex', gap: '6px', padding: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              {(['light', 'dark', 'auto'] as const).map((t_theme) => (
                <button
                  key={t_theme}
                  onClick={() => setTheme(t_theme)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: theme === t_theme ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
                    cursor: 'pointer',
                    border: 'none',
                    fontFamily: 'inherit',
                    transition: 'all var(--transition-fast)',
                    backgroundColor: theme === t_theme ? 'var(--bg-card)' : 'transparent',
                    color: theme === t_theme ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: theme === t_theme ? 'var(--shadow-sm)' : 'none',
                    textTransform: 'capitalize',
                  }}
                >
                  {t(`settings.theme${t_theme.charAt(0).toUpperCase() + t_theme.slice(1)}`)}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow
            icon={<Volume2 size={18} />}
            title={t('settings.notifications')}
            description={t('settings.notificationsHelp')}
          >
            <ToggleSwitch checked={notifications} onChange={() => setNotifications(!notifications)} />
          </SettingRow>

          <SettingRow
            icon={<Zap size={18} />}
            title={t('settings.autoStart')}
            description={t('settings.autoStartHelp')}
          >
            <ToggleSwitch checked={autoStart} onChange={() => setAutoStart(!autoStart)} />
          </SettingRow>
        </Card>

        {/* Connection */}
        <Card title={t('settings.connection')} icon={<Link size={18} />} variant="default">
          <div style={{ padding: '8px 0' }}>
            <Input
              label={t('settings.backendUrl')}
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://localhost:18080"
              suffix={<Link size={16} />}
            />
            <div style={{ marginTop: '16px' }}>
              <Button
                variant="secondary"
                onClick={handleTestConnection}
                loading={testingConnection}
                size="sm"
              >
                {testingConnection ? t('settings.testing') : t('settings.testConnection')}
              </Button>
            </div>
          </div>
        </Card>

        {/* System Info */}
        {systemInfo && (
          <Card title={t('settings.system')} icon={<MonitorIcon size={18} />} variant="gradient">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
            }}>
              {[
                { label: t('settings.platform'), value: `${systemInfo.os} ${systemInfo.osVersion}`, icon: <Monitor size={16} /> },
                { label: t('settings.architecture'), value: systemInfo.architecture, icon: <Shield size={16} /> },
                { label: t('settings.cpuCores'), value: `${systemInfo.cpuCores} Cores`, icon: <Zap size={16} /> },
                { label: t('settings.memory'), value: `${systemInfo.totalMemoryGb.toFixed(1)} GB`, icon: <Database size={16} /> },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                    {item.icon}
                    <span style={{ fontSize: 'var(--font-size-sm)' }}>{item.label}</span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                  }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
          style={{ flex: 1 }}
        >
          <Save size={16} />
          {saving ? t('settings.saving') : t('settings.save')}
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          <RotateCcw size={16} />
          {t('settings.reset')}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (window.confirm(t('settings.clearCacheConfirm'))) {
              setMessage({ type: 'success', text: t('settings.cacheCleared') });
            }
          }}
        >
          <Trash2 size={16} />
          {t('settings.clearCache')}
        </Button>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
