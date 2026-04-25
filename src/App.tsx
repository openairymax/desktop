import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ServiceManagement from './pages/ServiceManagement';
import AgentManagement from './pages/AgentManagement';
import TaskManagement from './pages/TaskManagement';
import Configuration from './pages/Configuration';
import LogViewer from './pages/LogViewer';
import Terminal from './pages/Terminal';
import SettingsPage from './pages/Settings';
import LLMConfig from './pages/LLMConfig';
import AgentRuntime from './pages/AgentRuntime';
import SystemMonitor from './pages/SystemMonitor';
import MemoryEvolution from './pages/MemoryEvolution';
import CognitiveLoop from './pages/CognitiveLoop';
import ToolManager from './pages/ToolManager';
import ProtocolPlayground from './pages/ProtocolPlayground';
import DualThinkingSystem from './pages/DualThinkingSystem';
import AIChatPage from './pages/AIChatPage';
import SessionManagement from './pages/SessionManagement';
import SkillRegistry from './pages/SkillRegistry';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/services" element={<ServiceManagement />} />
          <Route path="/agents" element={<AgentManagement />} />
          <Route path="/tasks" element={<TaskManagement />} />
          <Route path="/config" element={<Configuration />} />
          <Route path="/logs" element={<LogViewer />} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/llm-config" element={<LLMConfig />} />
          <Route path="/agent-runtime" element={<AgentRuntime />} />
          <Route path="/system-monitor" element={<SystemMonitor />} />
          <Route path="/memory-evolution" element={<MemoryEvolution />} />
          <Route path="/cognitive-loop" element={<CognitiveLoop />} />
          <Route path="/tools" element={<ToolManager />} />
          <Route path="/protocols" element={<ProtocolPlayground />} />
          <Route path="/sessions" element={<SessionManagement />} />
          <Route path="/skills" element={<SkillRegistry />} />
          <Route path="/dual-thinking" element={<DualThinkingSystem />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
