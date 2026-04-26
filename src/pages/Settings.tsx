import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Globe, Palette, Database, Shield,
  Bell, Save, RefreshCw, Loader2, Trash2, Download, Upload,
  CheckCircle2, AlertTriangle
} from 'lucide-react';

type TabKey = 'appearance' | 'gateway' | 'data' | 'about';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('appearance');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('i18n-lang') || 'zh');
  const [endpointUrl, setEndpointUrl] = useState(() => localStorage.getItem('agentos-endpoint') || 'http://localhost:8080');
  const [autoConnect, setAutoConnect] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    setTheme(localStorage.getItem('theme') || 'dark');
  }, []);

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('theme', theme);
    localStorage.setItem('i18n-lang', language);
    localStorage.setItem('agentos-endpoint', endpointUrl);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('agentos-')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `airymax-agentos-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (!window.confirm('确定要清除所有本地数据吗？这将删除所有配置、智能体、任务等数据。')) return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('agentos-')) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'appearance', label: '外观设置', icon: <Palette size={15} /> },
    { key: 'gateway', label: '网关配置', icon: <Globe size={15} /> },
    { key: 'data', label: '数据管理', icon: <Database size={15} /> },
    { key: 'about', label: '关于', icon: <Shield size={15} /> },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #64748b, #475569)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <SettingsIcon size={20} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>系统设置</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>自定义 Airymax AgentOS 的行为和外观</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', marginBottom: '20px', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: activeTab === tab.key ? 'white' : 'transparent',
            color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.key ? '500' : '400',
            fontFamily: 'inherit', transition: 'all 150ms ease',
            boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
          }}>{tab.icon}{tab.label}</button>
        ))}
      </div>

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '24px', maxWidth: '600px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>外观</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>主题模式</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'dark', label: '深色', desc: '默认，护眼' },
                  { value: 'light', label: '浅色', desc: '明亮风格' },
                ].map(t => (
                  <button key={t.value} onClick={() => setTheme(t.value)} style={{
                    flex: 1, padding: '14px', borderRadius: '10px', border: `2px solid ${theme === t.value ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    background: theme === t.value ? 'var(--primary-light)' : 'transparent', cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'inherit',
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme === t.value ? 'var(--primary-color)' : 'var(--text-primary)' }}>{t.label}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>界面语言</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer',
              }}>
                <option value="zh">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={compactMode} onChange={e => setCompactMode(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
                紧凑模式（减少间距）
              </label>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={notifEnabled} onChange={e => setNotifEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
                启用通知提醒
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Gateway Tab */}
      {activeTab === 'gateway' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '24px', maxWidth: '600px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>网关连接</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>AgentOS Gateway 地址</label>
              <input type="text" value={endpointUrl} onChange={e => setEndpointUrl(e.target.value)}
                placeholder="http://localhost:8080"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoConnect} onChange={e => setAutoConnect(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
                启动时自动连接网关
              </label>
            </div>
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--info-light)', borderRadius: '8px', border: '1px solid var(--info-color)33' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--info-color)' }}>
                {'离线模式下桌面端将使用本地存储运行所有功能，连接网关后可解锁完整的多智能体协作能力。'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '24px', maxWidth: '600px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>数据管理</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleExportData} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', border: '1px solid var(--border-color)',
                borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                fontSize: '13px', fontFamily: 'inherit', textAlign: 'left',
              }}><Download size={16} /> 导出所有数据（JSON 备份）</button>
              <button onClick={handleClearData} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', border: '1px solid var(--error-color)',
                borderRadius: '8px', background: 'var(--error-light)', color: 'var(--error-color)', cursor: 'pointer',
                fontSize: '13px', fontFamily: 'inherit', textAlign: 'left',
              }}><Trash2 size={16} /> 清除所有本地数据</button>
            </div>
            <div style={{ marginTop: '16px', padding: '12px 14px', backgroundColor: 'var(--warning-light)', borderRadius: '8px', border: '1px solid var(--warning-color)33' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--warning-color)' }}>
                {'清除数据操作不可撤销，建议在清除前先导出备份。'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '32px', maxWidth: '600px', textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              marginBottom: '16px',
            }}>
              <SettingsIcon size={32} />
            </div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>Airymax AgentOS</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>版本 0.0.4 · Tauri 桌面客户端</p>
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', textAlign: 'left' }}>
              {[
                ['框架', 'Tauri v2 + React 18'],
                ['构建时间', new Date().toLocaleDateString()],
                ['平台', navigator.platform],
                ['引擎', 'WebView2'],
              ].map(([k, v]) => (<React.Fragment key={k}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span><span style={{ color: 'var(--text-secondary)' }}>{v}</span>
              </React.Fragment>))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Save Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', position: 'sticky', bottom: '0', padding: '12px 0' }}>
        <button onClick={handleSave} disabled={saving}
          style={{
            padding: '10px 28px', border: 'none', borderRadius: '8px',
            background: saved ? '#10b981' : 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
            color: 'white', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: '500', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >{saving ? <Loader2 size={16} className="spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}{saved ? '已保存' : '保存设置'}</button>
      </div>
    </div>
  );
};

export default Settings;
