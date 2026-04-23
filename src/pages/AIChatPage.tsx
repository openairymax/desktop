import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import AIChat from '../components/AIChat';
import { motion } from 'framer-motion';

const AIChatPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: '32px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: 'var(--shadow-md)'
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              {t('nav.aiChat')}
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: 'var(--font-size-md)',
              color: 'var(--text-muted)',
            }}>
              {t('aiChat.subtitle') || 'AgentOS AI 智能助手对话界面'}
            </p>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          height: 'calc(100vh - 200px)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <AIChat />
      </motion.div>
    </div>
  );
};

export default AIChatPage;
