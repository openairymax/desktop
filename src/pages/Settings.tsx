import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Palette, Bell, Link, Save, RotateCcw,
  Trash2, CheckCircle, AlertCircle, Loader2,
  Sun, Moon, Languages, Volume2, Zap, Shield, Database, Wifi, WifiOff, Monitor
} from 'lucide-react';
import { useAgentOS, useConnection } from '../hooks/useAgentOS';

const SettingsPage: React.FC = () => {
  const { updateEndpoint, getEndpoint } = useAgentOS();
  const { connection, connect, disconnect } = useConnection();

  const [language, setLanguage] = useState('zh');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark' | 'auto') || 'dark';
  });
  const [gatewayUrl, setGatewayUrl] = useState(() => getEndpoint());
  const [apiKey, setApiKey] = useState('');
  const [autoStart, setAutoStart] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('agentos-language');
    if (savedLang) setLanguage(savedLang);
    const savedAutoStart = localStorage.getItem('agentos-autoStart');
    if (savedAutoStart) setAutoStart(savedAutoStart === 'true');
    const savedNotifications = localStorage.getItem('agentos-notifications');
    if (savedNotifications) setNotifications(savedNotifications === 'true');
  }, []);

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
      updateEndpoint(gatewayUrl, apiKey || undefined);
      localStorage.setItem('agentos-language', language);
      localStorage.setItem('agentos-autoStart', String(autoStart));
      localStorage.setItem('agentos-notifications', String(notifications));
      setMessage({ type: 'success', text: '设置已保存' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: '保存设置失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm('确定要将所有设置恢复为默认值吗？')) return;
    setLanguage('zh');
    setTheme('dark');
    setGatewayUrl('http://localhost:18789');
    setApiKey('');
    setAutoStart(false);
    setNotifications(true);
  };

  const handleTestConnection = async () => {
    setMessage(null);
    try {
      updateEndpoint(gatewayUrl, apiKey || undefined);
      await connect();
      if (connection.status === 'connected') {
        setMessage({ type: 'success', text: `连接 ${gatewayUrl} 成功！` });
      } else {
        setMessage({ type: 'error', text: '连接失败，请检查网关地址' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `连接错误: ${err instanceof Error ? err.message : '未知错误'}` });
    }
  };

  const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      style={{
        position: 'relative', width: '44px', height: '24px', borderRadius: '12px',
        backgroundColor: checked ? 'var(--primary-color)' : 'var(--bg-tertiary)',
        border: `1px solid ${checked ? 'var(--primary-color)' : 'var(--border-color)'}`,
        cursor: 'pointer', transition: 'all var(--transition-fast)', flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: checked ? '22px' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute', top: '2px', left: '0', width: '18px', height: '18px',
          borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
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
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', padding: '16px 0', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--primary-light), transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary-color)', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
            {title}
          </p>
          {description && (
            <p style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              {description}
            </p>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );

  const connStatusColor = connection.status === 'connected'
    ? 'var(--success-color)' : connection.status === 'error'
    ? 'var(--error-color)' : 'var(--text-muted)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: '900px', margin: '0 auto' }}
    >
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Settings size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              设置
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>自定义 AgentOS 桌面客户端</p>
          </div>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px',
            marginBottom: '24px', borderRadius: 'var(--radius-md)',
            backgroundColor: message.type === 'success' ? 'var(--success-light)' : 'var(--error-light)',
            border: `1px solid ${message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)'}`,
            color: message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)',
          }}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>{message.text}</span>
        </motion.div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '20px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Link size={18} style={{ color: 'var(--primary-color)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              AgentOS 网关连接
            </h3>
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)', color: connStatusColor,
              backgroundColor: connection.status === 'connected' ? 'var(--success-light)' : connection.status === 'error' ? 'var(--error-light)' : 'var(--bg-tertiary)',
            }}>
              {connection.status === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
              {connection.status === 'connected' ? '已连接' : connection.status === 'error' ? '连接失败' : connection.status === 'connecting' ? '连接中...' : '未连接'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                网关地址
              </label>
              <input
                type="text"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                placeholder="http://localhost:18789"
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: 'var(--font-size-md)', fontFamily: 'var(--font-mono)',
                  outline: 'none', transition: 'all var(--transition-fast)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                API 密钥（可选）
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="留空则不使用认证"
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: 'var(--font-size-md)', fontFamily: 'inherit',
                  outline: 'none', transition: 'all var(--transition-fast)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleTestConnection}
                style={{
                  padding: '8px 16px', border: '1px solid var(--primary-color)', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 'var(--font-size-md)', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Wifi size={14} /> 测试连接
              </button>
              {connection.status === 'connected' && (
                <button
                  onClick={disconnect}
                  style={{
                    padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 'var(--font-size-md)', display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <WifiOff size={14} /> 断开
                </button>
              )}
            </div>
            {connection.health && (
              <div style={{
                padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>状态</span>
                  <span style={{ color: 'var(--success-color)' }}>{connection.health.status}</span>
                </div>
                {connection.health.version && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>版本</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{connection.health.version}</span>
                  </div>
                )}
                {connection.health.uptime && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>运行时间</span>
                    <span>{connection.health.uptime}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '20px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Palette size={18} style={{ color: 'var(--primary-color)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              外观与偏好
            </h3>
          </div>
          <SettingRow icon={<Languages size={18} />} title="语言" description="更改应用语言">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 'var(--font-size-md)',
                fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="zh">简体中文</option>
              <option value="en">English</option>
            </select>
          </SettingRow>
          <SettingRow icon={theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} title="主题" description="选择外观模式">
            <div style={{ display: 'flex', gap: '6px', padding: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              {(['light', 'dark', 'auto'] as const).map((t_theme) => (
                <button
                  key={t_theme}
                  onClick={() => setTheme(t_theme)}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)',
                    fontWeight: theme === t_theme ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
                    cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all var(--transition-fast)',
                    backgroundColor: theme === t_theme ? 'var(--bg-card)' : 'transparent',
                    color: theme === t_theme ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: theme === t_theme ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {t_theme === 'light' ? '浅色' : t_theme === 'dark' ? '深色' : '跟随系统'}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow icon={<Volume2 size={18} />} title="桌面通知" description="任务状态变更时显示通知">
            <ToggleSwitch checked={notifications} onChange={() => setNotifications(!notifications)} />
          </SettingRow>
          <SettingRow icon={<Zap size={18} />} title="开机自动启动" description="系统启动时自动运行 AgentOS">
            <ToggleSwitch checked={autoStart} onChange={() => setAutoStart(!autoStart)} />
          </SettingRow>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: '12px', marginTop: '32px', paddingTop: '24px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, padding: '10px 16px', border: 'none', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
            color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all var(--transition-fast)', opacity: saving ? 0.5 : 1,
          }}
        >
          <Save size={16} />
          {saving ? '保存中...' : '保存设置'}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '10px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 'var(--font-size-md)', display: 'flex', alignItems: 'center',
            gap: '6px', transition: 'all var(--transition-fast)',
          }}
        >
          <RotateCcw size={16} /> 恢复默认
        </button>
        <button
          onClick={() => {
            if (window.confirm('确定要清除所有缓存数据吗？')) {
              setMessage({ type: 'success', text: '缓存已清除' });
              setTimeout(() => setMessage(null), 3000);
            }
          }}
          style={{
            padding: '10px 16px', border: '1px solid var(--error-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--error-light)', color: 'var(--error-color)', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 'var(--font-size-md)', display: 'flex', alignItems: 'center',
            gap: '6px', transition: 'all var(--transition-fast)',
          }}
        >
          <Trash2 size={16} /> 清除缓存
        </button>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
