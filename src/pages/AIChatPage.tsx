import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import AIChat from '../components/AIChat';

const AIChatPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          {t('nav.aiChat')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('aiChat.subtitle') || 'AgentOS AI 智能助手对话界面'}</p>
      </div>
      <div className="h-[calc(100vh-14rem)]">
        <AIChat />
      </div>
    </div>
  );
};

export default AIChatPage;
