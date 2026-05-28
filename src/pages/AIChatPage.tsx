import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AIChat from '../components/AIChat';

const AIChatPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }} role="region" aria-label="AI Chat">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #ec4899, #f472b6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <MessageSquare size={20} />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              AI 助手
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>
              {t('aiChat.subtitle')}
            </p>
          </div>
        </div>
      </motion.div>

      <AIChat />
    </div>
  );
};

export default AIChatPage;
