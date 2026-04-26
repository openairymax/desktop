import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import Dashboard from './pages/Dashboard';
import ServiceManagement from './pages/ServiceManagement';
import AgentManagement from './pages/AgentManagement';
import TaskManagement from './pages/TaskManagement';
import LogViewer from './pages/LogViewer';
import Terminal from './pages/Terminal';
import Settings from './pages/Settings';
import LLMConfig from './pages/LLMConfig';
import AgentRuntime from './pages/AgentRuntime';
import SystemMonitor from './pages/SystemMonitor';
import MemoryEvolution from './pages/MemoryEvolution';
import CognitiveLoopPage from './pages/CognitiveLoop';
import ToolManager from './pages/ToolManager';
import ProtocolPlayground from './pages/ProtocolPlayground';
import SessionManagement from './pages/SessionManagement';
import SkillRegistry from './pages/SkillRegistry';
import DualThinkingSystem from './pages/DualThinkingSystem';
import AIChatPage from './pages/AIChatPage';
import Configuration from './pages/Configuration';
import ModelConfig from './pages/ModelConfig';
import LogsTerminal from './pages/LogsTerminal';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/services" element={<ServiceManagement />} />
            <Route path="/agents" element={<AgentManagement />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/model-config" element={<ModelConfig />} />
            <Route path="/cognitive-loop" element={<CognitiveLoopPage />} />
            <Route path="/memory-evolution" element={<MemoryEvolution />} />
            <Route path="/tools" element={<ToolManager />} />
            <Route path="/ai-chat" element={<AIChatPage />} />
            <Route path="/system-monitor" element={<SystemMonitor />} />
            <Route path="/logs-terminal" element={<LogsTerminal />} />
            <Route path="/settings" element={<Settings />} />

            {/* Legacy routes - redirect or keep for backward compat */}
            <Route path="/config" element={<Configuration />} />
            <Route path="/llm-config" element={<LLMConfig />} />
            <Route path="/agent-runtime" element={<AgentRuntime />} />
            <Route path="/dual-thinking" element={<DualThinkingSystem />} />
            <Route path="/sessions" element={<SessionManagement />} />
            <Route path="/skills" element={<SkillRegistry />} />
            <Route path="/protocols" element={<ProtocolPlayground />} />
            <Route path="/terminal" element={<Terminal />} />
            <Route path="/logs" element={<LogViewer />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
