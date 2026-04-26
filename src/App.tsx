import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import Dashboard from './pages/Dashboard';
import ServiceManagement from './pages/ServiceManagement';
import AgentManagement from './pages/AgentManagement';
import TaskManagement from './pages/TaskManagement';
import Settings from './pages/Settings';
import SystemMonitor from './pages/SystemMonitor';
import MemoryEvolution from './pages/MemoryEvolution';
import CognitiveLoopPage from './pages/CognitiveLoop';
import ToolManager from './pages/ToolManager';
import SessionManagement from './pages/SessionManagement';
import SkillRegistry from './pages/SkillRegistry';
import AIChatPage from './pages/AIChatPage';
import ModelConfig from './pages/ModelConfig';
import LogsTerminal from './pages/LogsTerminal';
import OpenLab from './pages/OpenLab';
import SecurityCenter from './pages/SecurityCenter';
import Telemetry from './pages/Telemetry';

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
            <Route path="/sessions" element={<SessionManagement />} />
            <Route path="/skills" element={<SkillRegistry />} />
            <Route path="/model-config" element={<ModelConfig />} />
            <Route path="/cognitive-loop" element={<CognitiveLoopPage />} />
            <Route path="/memory-evolution" element={<MemoryEvolution />} />
            <Route path="/tools" element={<ToolManager />} />
            <Route path="/ai-chat" element={<AIChatPage />} />
            <Route path="/open-lab" element={<OpenLab />} />
            <Route path="/security" element={<SecurityCenter />} />
            <Route path="/system-monitor" element={<SystemMonitor />} />
            <Route path="/logs-terminal" element={<LogsTerminal />} />
            <Route path="/telemetry" element={<Telemetry />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
