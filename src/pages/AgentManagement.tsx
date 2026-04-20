import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';

const AgentManagement: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bot className="w-8 h-8 text-purple-600" />
          {t('nav.agents')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('agents.subtitle') || '智能体注册、配置与生命周期管理'}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{t('agents.comingSoon') || '智能体管理功能开发中...'}</p>
      </div>
    </div>
  );
};

export default AgentManagement;
