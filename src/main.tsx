import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import { AgentOSProvider } from './hooks/useAgentOS';
import { initializeTauri } from './services/tauri-bridge';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import PWAPrompt from './components/PWAPrompt';
import './styles/globals.css';

initializeTauri()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <I18nProvider>
          <AgentOSProvider>
            <ServiceWorkerRegistration />
            <App />
            <PWAPrompt />
          </AgentOSProvider>
        </I18nProvider>
      </React.StrictMode>,
    );
  })
  .catch((e) => {
    console.error('Failed to initialize Tauri bridge:', e);
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <I18nProvider>
          <AgentOSProvider>
            <ServiceWorkerRegistration />
            <App />
            <PWAPrompt />
          </AgentOSProvider>
        </I18nProvider>
      </React.StrictMode>,
    );
  });
