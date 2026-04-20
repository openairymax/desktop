import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Settings, Globe, Palette, Bell, Link, Monitor, Save, RotateCcw,
  Trash2, CheckCircle, AlertCircle, Loader2, Monitor as MonitorIcon
} from 'lucide-react';
import { saveSettings, loadSettings, getSystemInfo, type SystemInfo } from '../services/agentos-sdk';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language?.startsWith('zh') ? 'zh' : 'en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
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
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }, []);

  const loadSystemInfo = useCallback(async () => {
    try {
      const data = await getSystemInfo();
      setSystemInfo(data);
    } catch (e) {
      console.warn('Failed to get system info:', e);
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
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveSettings({ language, theme, backendUrl, autoStart, notifications });
      setMessage({ type: 'success', text: t('settings.savedSuccess') });
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: t('settings.saveError') });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm(t('settings.resetConfirm'))) return;
    setLanguage('zh');
    setTheme('light');
    setBackendUrl('http://localhost:18080');
    setAutoStart(false);
    setNotifications(true);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setMessage(null);
    try {
      const response = await fetch(backendUrl, { method: 'HEAD', mode: 'no-cors' });
      setMessage({ type: 'success', text: t('settings.connectionSuccess', { url: backendUrl }) });
    } catch {
      setMessage({ type: 'error', text: t('settings.connectionFailed', { error: 'Unable to reach server' }) });
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        <span className="ml-3 text-gray-500">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-8 h-8 text-gray-600" />
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('settings.description')}</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </motion.div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.general')}</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.language')}</p>
                <p className="text-sm text-gray-500">{t('settings.languageHelp')}</p>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="zh">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.theme')}</p>
                <p className="text-sm text-gray-500">{t('settings.themeHelp')}</p>
              </div>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                {(['light', 'dark', 'auto'] as const).map((t_theme) => (
                  <button
                    key={t_theme}
                    onClick={() => setTheme(t_theme)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                      theme === t_theme
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {t(`settings.theme${t_theme.charAt(0).toUpperCase() + t_theme.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.notifications')}</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.notifications')}</p>
                <p className="text-sm text-gray-500">{t('settings.notificationsHelp')}</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.autoStart')}</p>
                <p className="text-sm text-gray-500">{t('settings.autoStartHelp')}</p>
              </div>
              <button
                onClick={() => setAutoStart(!autoStart)}
                className={`relative w-11 h-6 rounded-full transition-colors ${autoStart ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoStart ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Link className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.connection')}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.backendUrl')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="http://localhost:18080"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  {testingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : t('settings.testConnection')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {systemInfo && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MonitorIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.system')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-500">{t('settings.platform')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{systemInfo.os} {systemInfo.osVersion}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-500">{t('settings.architecture')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{systemInfo.architecture}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-500">{t('settings.cpuCores')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{systemInfo.cpuCores}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-500">{t('settings.memory')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{systemInfo.totalMemoryGb.toFixed(1)} GB</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? t('settings.saving') : t('settings.save')}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          {t('settings.reset')}
        </button>
        <button
          onClick={() => { if (window.confirm(t('settings.clearCacheConfirm'))) setMessage({ type: 'success', text: t('settings.cacheCleared') }); }}
          className="px-6 py-3 border border-red-300 dark:border-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400 transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          {t('settings.clearCache')}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
