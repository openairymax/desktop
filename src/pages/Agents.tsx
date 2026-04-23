import React, { useState, useEffect, useMemo } from "react";
import {
  Bot,
  Plus,
  Search,
  Filter,
  Cpu,
  Globe,
  Code2,
  Brain,
  Sparkles,
  Zap,
  Shield,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Clock,
  Activity,
  Star,
  Play,
  Square,
  ArrowUpDown,
  Download,
  CheckSquare,
  X,
  RefreshCw
} from "lucide-react";
import { exportToCSV } from "../utils/export";
import sdk from "../services/agentos-sdk";
import type { AgentInfo } from "../services/agentos-sdk";
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../components/useAlert";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";

const agentTypeConfig: Record<string, { icon: typeof Bot; color: string; gradient: string; bgLight: string; label: string }> = {
  research: { icon: Brain, color: "var(--primary-color)", gradient: "linear-gradient(135deg, var(--primary-color), var(--info-color))", bgLight: "rgba(99,102,241,0.08)", label: "研究型" },
  coding: { icon: Code2, color: "var(--success-color)", gradient: "linear-gradient(135deg, var(--success-color), #4ade80)", bgLight: "rgba(34,197,94,0.08)", label: "编码型" },
  assistant: { icon: Sparkles, color: "#a855f7", gradient: "linear-gradient(135deg, #a855f7, #c084fc)", bgLight: "rgba(168,85,247,0.08)", label: "助手型" },
  system: { icon: Shield, color: "var(--warning-color)", gradient: "linear-gradient(135deg, var(--warning-color), #fbbf24)", bgLight: "rgba(245,158,11,0.08)", label: "系统型" },
};

const Agents: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { error, success, confirm: confirmModal } = useAlert();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadAgents();
  }, []);

  const filteredAndSortedAgents = useMemo(() => {
    let result = [...agents];

    if (searchTerm) {
      result = result.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.type && agent.type.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      result = result.filter(agent => agent.type === filterType);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status':
          cmp = (a.status === 'running' ? 0 : 1) - (b.status === 'running' ? 0 : 1);
          break;
        case 'type':
          cmp = (a.type || '').localeCompare(b.type || '');
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [agents, searchTerm, sortBy, sortOrder, filterType]);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<string | null>(null);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await sdk.listAgents();
      setAgents(data || []);
    } catch (err) {
      error("加载失败", `无法加载智能体列表: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (name: string, type: string) => {
    try {
      await sdk.registerAgent(name, type);
      setShowRegisterModal(false);
      loadAgents();
      success("注册成功", `智能体 "${name}" 已成功注册`);
    } catch (err) {
      error("注册失败", `${t.agents.registerFailed}: ${err}`);
    }
  };

  const handleStartAgent = async (agentId: string) => {
    setActionLoading(agentId + "-start");
    try {
      await sdk.startAgent(agentId);
      loadAgents();
    } catch (err) {
      error("启动失败", `无法启动智能体: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopAgent = async (agentId: string) => {
    const confirmed = await confirmModal({
      type: 'danger',
      title: '停止智能体',
      message: '确定要停止此智能体吗？',
    });
    if (!confirmed) return;
    setActionLoading(agentId + "-stop");
    try {
      await sdk.stopAgent(agentId);
      loadAgents();
    } catch (err) {
      error("停止失败", `无法停止智能体: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelectAgent = (agentId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(filteredAndSortedAgents.map((a: AgentInfo) => a.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBatchStart = async () => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      try { await sdk.startAgent(id); } catch {}
    }
    success("批量启动", `已发送 ${selectedIds.size} 个智能体的启动指令`);
    clearSelection();
    loadAgents();
  };

  const handleBatchStop = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = await confirmModal({
      type: 'danger',
      title: '批量停止',
      message: `确定要停止选中的 ${selectedIds.size} 个智能体吗？`,
    });
    if (!confirmed) return;
    for (const id of selectedIds) {
      try { await sdk.stopAgent(id); } catch {}
    }
    success("批量停止", `已发送 ${selectedIds.size} 个智能体的停止指令`);
    clearSelection();
    loadAgents();
  };

  const toggleSort = (field: 'name' | 'status' | 'type') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getAgentConfig = (type: string) => {
    return agentTypeConfig[type] || { icon: Bot, color: "#94a3b8", gradient: "linear-gradient(135deg, #94a3b8, #cbd5e1)", bgLight: "rgba(148,163,184,0.08)", label: type };
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
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
          }}>
            <Bot size={20} />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              {t.agents.title}
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: 'var(--font-size-md)',
              color: 'var(--text-muted)',
            }}>
              {t.agents.subtitle}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowRegisterModal(true)}
        >
          <Plus size={16} />
          {t.agents.registerNew}
        </Button>
      </div>

      {/* Toolbar */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          flexWrap: "wrap", 
          gap: "16px",
          padding: '16px',
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            flex: 1, 
            minWidth: "200px"
          }}>
            <div style={{ 
              position: "relative", 
              flex: 1, 
              maxWidth: "360px"
            }}>
              <Search size={15} style={{
                position: "absolute", 
                left: "12px", 
                top: "50%",
                transform: "translateY(-50%)", 
                color: "var(--text-muted)"
              }} />
              <Input
                placeholder={`${t.agents.searchAgents}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  paddingLeft: "38px",
                }}
              />
            </div>
            {/* Type Filter */}
            <div style={{ 
              display: 'flex', 
              gap: '6px',
              flexWrap: 'wrap',
            }}>
              {['all', ...Object.keys(agentTypeConfig)].map(type => (
                <Button
                  key={type}
                  onClick={() => setFilterType(type)}
                  variant={filterType === type ? 'primary' : 'ghost'}
                  size="sm"
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {type === 'all' ? '全部' : agentTypeConfig[type]?.label || type}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            flexWrap: 'wrap',
          }}>
            {selectedIds.size > 0 && (
              <>
                <span style={{ 
                  fontSize: 'var(--font-size-xs)', 
                  color: 'var(--primary-color)', 
                  fontWeight: 600,
                  backgroundColor: 'var(--primary-light)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  已选 {selectedIds.size} 项
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  取消选择
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleBatchStart}
                >
                  <Play size={13} />
                  批量启动
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBatchStop}
                >
                  <Square size={13} />
                  批量停止
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSort('name')}
              title="按名称排序"
              style={{ 
                borderRadius: 'var(--radius-md)',
              }}
            >
              <ArrowUpDown size={14} />
              名称{sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAgents}
              title="刷新列表"
              style={{ 
                borderRadius: 'var(--radius-md)',
              }}
            >
              <RefreshCw size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (agents.length > 0) {
                  exportToCSV(agents.map(a => ({
                    名称: a.name, 类型: a.type, 状态: a.status,
                    描述: (a as any).description || '', 创建时间: (a as any).createdAt || '',
                  })), 'agentos_agents');
                }
              }}
              title="导出列表"
              style={{ 
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Download size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Agent Type Stats Bar */}
      <div style={{
        display: "flex", 
        gap: "12px", 
        marginBottom: "24px",
        overflowX: "auto", 
        paddingBottom: "8px",
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--border-color) var(--bg-tertiary)',
      }}>
        {Object.entries(agentTypeConfig).map(([typeKey, config]) => {
          const count = agents.filter(a => a.type === typeKey).length;
          const IconComp = config.icon;
          return (
            <motion.div 
                key={typeKey} 
                style={{
                  padding: "12px 20px", 
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-card)",
                  border: `1px solid var(--border-subtle)`,
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px",
                  minWidth: "140px",
                  cursor: "pointer",
                  boxShadow: 'var(--shadow-sm)',
                }}
                whileHover={{
                  y: -2,
                  boxShadow: 'var(--shadow-md)',
                  borderColor: 'var(--border-color)',
                }}
                onClick={() => setFilterType(typeKey)}
              >
              <div style={{
                width: "36px", 
                height: "36px", 
                borderRadius: "var(--radius-md)",
                background: config.gradient,
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <IconComp size={18} color="white" />
              </div>
              <div>
                <div style={{ 
                  fontSize: "var(--font-size-xs)", 
                  color: "var(--text-muted)",
                  marginBottom: "2px",
                }}>
                  {config.label}
                </div>
                <div style={{ 
                  fontSize: "var(--font-size-lg)", 
                  fontWeight: 600, 
                  color: config.color, 
                  lineHeight: 1.2 
                }}>
                  {count}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: selectedAgent ? "1fr 360px" : "1fr", 
        gap: "24px"
      }}>
        {/* Agent Cards Grid */}
        <div>
          {loading ? (
            <Card style={{ 
              textAlign: "center", 
              padding: "64px",
            }}>
              <Loader2 size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', animation: 'spin 1s linear infinite' }} />
              <div style={{ 
                fontSize: 'var(--font-size-md)', 
                color: 'var(--text-muted)'
              }}>
                加载智能体列表...
              </div>
            </Card>
          ) : filteredAndSortedAgents.length === 0 ? (
            <Card style={{ 
              textAlign: "center", 
              padding: "64px",
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "var(--radius-xl)",
                background: "var(--bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                boxShadow: 'var(--shadow-sm)',
              }}>
                <Bot size={40} style={{ opacity: 0.2, color: 'var(--text-muted)' }} />
              </div>
              <div style={{ 
                fontSize: "var(--font-size-lg)", 
                fontWeight: 500, 
                margin: "0 0 12px 0",
                color: 'var(--text-primary)',
              }}>
                {t.agents.noAgentsRegistered}
              </div>
              <div style={{ 
                fontSize: "var(--font-size-md)", 
                color: "var(--text-muted)", 
                marginBottom: "32px",
                maxWidth: "320px",
                marginLeft: "auto",
                marginRight: "auto",
              }}>
                {t.agents.noAgentsHint}
              </div>
              <Button
                variant="primary"
                onClick={() => setShowRegisterModal(true)}
              >
                <Plus size={16} />
                {t.agents.registerNew}
              </Button>
            </Card>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}>
              <AnimatePresence>
                {filteredAndSortedAgents.map((agent: AgentInfo) => {
                  const config = getAgentConfig(agent.type || "general");
                  const IconComp = config.icon;
                  const isSelected = selectedAgent?.name === agent.name;
                  const isChecked = selectedIds.has(agent.id);

                  return (
                    <motion.div
                      key={agent.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card 
                        style={{
                          border: `2px solid`,
                          borderColor: isSelected ? config.color : isChecked ? 'var(--primary-color)' : "var(--border-subtle)",
                          background: isSelected ? `${config.color}06` : isChecked ? 'var(--primary-light)' : "var(--bg-card)",
                          cursor: "pointer",
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                        onClick={() => setSelectedAgent(isSelected ? null : agent)}
                      >
                        {/* Selection Checkbox */}
                        <div
                          onClick={(e) => { e.stopPropagation(); toggleSelectAgent(agent.id); }}
                          style={{
                            position: 'absolute', 
                            top: '16px', 
                            left: '16px',
                            width: '20px', 
                            height: '20px', 
                            borderRadius: 'var(--radius-sm)',
                            border: `2px solid ${isChecked ? 'var(--primary-color)' : 'var(--border-color)'}`,
                            background: isChecked ? 'var(--primary-color)' : 'transparent',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            cursor: 'pointer', 
                            zIndex: 2,
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          {isChecked && <CheckSquare size={12} color="white" />}
                        </div>

                        <div style={{ 
                          display: "flex", 
                          alignItems: "flex-start", 
                          gap: "16px",
                          padding: '16px',
                        }}>
                          <div style={{
                            width: "48px", 
                            height: "48px", 
                            borderRadius: "var(--radius-md)",
                            background: config.gradient,
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: 'var(--shadow-sm)',
                          }}>
                            <IconComp size={24} color="white" />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "8px", 
                              marginBottom: "6px"
                            }}>
                              <span style={{ 
                                fontWeight: 600, 
                                fontSize: "var(--font-size-md)",
                                color: 'var(--text-primary)',
                              }}>
                                {agent.name}
                              </span>
                              {isSelected && <ChevronRight size={16} style={{ color: config.color }} />}
                            </div>

                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "8px", 
                              marginBottom: "8px"
                            }}>
                              <span style={{
                                background: "var(--bg-tertiary)",
                                color: config.color,
                                fontWeight: 500,
                                fontSize: "var(--font-size-xs)",
                                padding: "4px 10px",
                                borderRadius: "var(--radius-sm)",
                              }}>
                                {config.label}
                              </span>
                            </div>

                            {agent.description && (
                              <p style={{
                                fontSize: "var(--font-size-sm)", 
                                color: "var(--text-secondary)",
                                lineHeight: 1.5, 
                                margin: 0, 
                                display: "-webkit-box",
                                WebkitLineClamp: 2, 
                                WebkitBoxOrient: "vertical", 
                                overflow: "hidden",
                              }}>
                                {agent.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bottom status bar */}
                        <div style={{
                          marginTop: "0", 
                          padding: "12px 16px",
                          borderTop: "1px solid var(--border-subtle)",
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {agent.status === "active" || agent.status === "running" ? (
                              <>
                                <span style={{
                                  width: "8px", 
                                  height: "8px", 
                                  borderRadius: "50%",
                                  background: "var(--success-color)",
                                  boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)',
                                }} />
                                <span style={{ 
                                  fontSize: "var(--font-size-sm)", 
                                  color: "var(--success-color)", 
                                  fontWeight: 500 
                                }}>
                                  运行中
                                </span>
                              </>
                            ) : (
                              <>
                                <span style={{ 
                                  width: "8px", 
                                  height: "8px", 
                                  borderRadius: "50%", 
                                  background: "var(--text-muted)"
                                }} />
                                <span style={{ 
                                  fontSize: "var(--font-size-sm)", 
                                  color: "var(--text-muted)" 
                                }}>
                                  空闲
                                </span>
                              </>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {(agent.status === "idle" || agent.status === "stopped") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleStartAgent(agent.id); }}
                                disabled={actionLoading === (agent.id + "-start")}
                                title="启动智能体"
                                style={{
                                  borderRadius: 'var(--radius-md)',
                                }}
                              >
                                {actionLoading === (agent.id + "-start") ? 
                                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 
                                  <Play size={14} />
                                }
                              </Button>
                            )}
                            {(agent.status === "running" || agent.status === "active") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleStopAgent(agent.id); }}
                                disabled={actionLoading === (agent.id + "-stop")}
                                title="停止智能体"
                                style={{
                                  color: "var(--error-color)",
                                  borderRadius: 'var(--radius-md)',
                                }}
                              >
                                {actionLoading === (agent.id + "-stop") ? 
                                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 
                                  <Square size={14} />
                                }
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setShowConfigModal(agent.id); }}
                              title="配置"
                              style={{
                                borderRadius: 'var(--radius-md)',
                              }}
                            >
                              <Shield size={14} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedAgent && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card style={{
                height: "fit-content",
                position: "sticky",
                top: "88px",
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}>
                {(() => {
                  const config = getAgentConfig(selectedAgent.type || "general");
                  const IconComp = config.icon;

                  return (
                    <>
                      <div style={{
                        padding: "20px", 
                        borderBottom: "1px solid var(--border-subtle)",
                        background: "var(--bg-tertiary)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{
                            width: "56px", 
                            height: "56px", 
                            borderRadius: "var(--radius-md)",
                            background: config.gradient,
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            boxShadow: 'var(--shadow-md)',
                          }}>
                            <IconComp size="28" color="white" />
                          </div>
                          <div>
                            <h3 style={{ 
                              margin: 0, 
                              fontSize: "var(--font-size-xl)",
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}>
                              {selectedAgent.name}
                            </h3>
                            <span style={{
                              background: "var(--bg-card)",
                              color: config.color,
                              fontSize: "var(--font-size-xs)",
                              padding: "4px 10px",
                              borderRadius: "var(--radius-sm)",
                              display: 'inline-block',
                              marginTop: '6px',
                            }}>
                              {config.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ 
                        padding: "20px", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "20px"
                      }}>
                        <DetailRow 
                          icon={<Star size={16} />} 
                          label="类型" 
                          value={selectedAgent.type} 
                        />
                        <DetailRow 
                          icon={<Activity size={16} />} 
                          label="状态" 
                          value={
                            <span style={{ 
                              color: selectedAgent.status === "active" ? "var(--success-color)" : "var(--text-muted)",
                              fontWeight: 500,
                            }}>
                              {selectedAgent.status === "active" ? "运行中" : "空闲"}
                            </span>
                          } 
                        />
                        <DetailRow 
                          icon={<Clock size={16} />} 
                          label="描述" 
                          value={selectedAgent.description || "—"} 
                        />

                        <div style={{ 
                          marginTop: "8px", 
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "12px"
                        }}>
                          <Button
                            variant="primary"
                            onClick={async () => {
                              if (!selectedAgent) return;
                              try {
                                await sdk.startAgent(selectedAgent.id);
                                success("启动成功", `智能体 "${selectedAgent.name}" 启动指令已发送`);
                                loadAgents();
                              } catch (err) { 
                                error("启动失败", `无法启动智能体: ${err}`); 
                              }
                            }}
                          >
                            启动智能体
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              if (selectedAgent) navigate(`/agents?id=${selectedAgent.id}`);
                            }}
                          >
                            <ExternalLink size={16} />
                            查看详情
                          </Button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Register Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <RegisterModal
            onClose={() => setShowRegisterModal(false)}
            onRegister={handleRegister}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--font-size-xs)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: "var(--font-size-md)", fontWeight: 500, paddingLeft: "20px" }}>{value}</div>
    </div>
  );
}

function RegisterModal({ onClose, onRegister }: { onClose: () => void; onRegister: (name: string, type: string) => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState<"info" | "confirm">('info');
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState("research");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agentName.trim()) return;
    if (step === "info") { setStep("confirm"); return; }
    setSubmitting(true);
    try { await onRegister(agentName.trim(), agentType); } finally { setSubmitting(false); }
  };

  return (
    <motion.div 
      className="modal-overlay" 
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <Card 
          style={{ 
            maxWidth: "480px", 
            margin: "0 auto",
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-subtle)',
          }} 
          onClick={(e) => e?.stopPropagation()}
        >
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            padding: "20px", 
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-tertiary)",
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: "var(--font-size-xl)", 
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              {t.agents.registerNew}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
                borderRadius: "var(--radius-md)",
                transition: "all var(--transition-fast)",
                lineHeight: 1,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              <X size={20} />
            </button>
          </div>

          {step === "info" ? (
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: "64px", 
                  height: "64px", 
                  borderRadius: "var(--radius-xl)",
                  background: "var(--primary-color)",
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                }}>
                  <Plus size={28} color="white" />
                </div>
                <p style={{ 
                  color: "var(--text-secondary)", 
                  fontSize: "var(--font-size-md)", 
                  margin: 0,
                  maxWidth: "320px",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}>
                  创建一个新的 AI 智能体，赋予它独特的能力和角色
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ 
                  fontSize: "var(--font-size-md)", 
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}>
                  {t.agents.agentName}
                </label>
                <Input
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="例如：Research Assistant、Code Reviewer..."
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoFocus
                />
                <p style={{ 
                  fontSize: "var(--font-size-sm)", 
                  color: "var(--text-muted)", 
                  margin: 0,
                }}>
                  {t.agents.agentNameHelp}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <label style={{ 
                  fontSize: "var(--font-size-md)", 
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}>
                  {t.agents.agentType}
                </label>
                <div style={{
                  display: "grid", 
                  gridTemplateColumns: "repeat(2, 1fr)", 
                  gap: "12px",
                }}>
                  {Object.entries(agentTypeConfig).map(([key, cfg]) => {
                    const IconComp = cfg.icon;
                    const isActive = agentType === key;
                    return (
                      <motion.div
                        key={key}
                        onClick={() => setAgentType(key)}
                        style={{
                          padding: "16px", 
                          borderRadius: "var(--radius-lg)",
                          border: `2px solid`, 
                          borderColor: isActive ? cfg.color : "var(--border-subtle)",
                          background: isActive ? `${cfg.color}06` : "var(--bg-tertiary)",
                          cursor: "pointer",
                          display: "flex", 
                          alignItems: "center", 
                          gap: "12px",
                          boxShadow: 'var(--shadow-sm)',
                        }}
                        whileHover={!isActive ? {
                          borderColor: 'var(--border-color)',
                          background: 'var(--bg-card)',
                          y: -2,
                          boxShadow: 'var(--shadow-md)',
                        } : {}}
                      >
                        <div style={{
                          width: "36px", 
                          height: "36px", 
                          borderRadius: "var(--radius-md)",
                          background: isActive ? cfg.gradient : "var(--bg-secondary)",
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                        }}>
                          <IconComp size={18} color={isActive ? "white" : "var(--text-muted)"} />
                        </div>
                        <div>
                          <div style={{ 
                            fontSize: "var(--font-size-sm)", 
                            fontWeight: 600, 
                            color: isActive ? cfg.color : "var(--text-primary)"
                          }}>
                            {cfg.label}
                          </div>
                          <div style={{ 
                            fontSize: "var(--font-size-xs)", 
                            color: "var(--text-muted)"
                          }}>
                            {key}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div style={{ 
                display: "flex", 
                gap: "12px", 
                marginTop: "8px",
              }}>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  style={{ 
                    flex: 1,
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!agentName.trim() || submitting}
                  style={{ 
                    flex: 1,
                  }}
                >
                  下一步 <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: "24px", 
              display: "flex", 
              flexDirection: "column", 
              gap: "24px", 
              alignItems: "center", 
              textAlign: "center"
            }}>
              <div style={{
                width: "56px", 
                height: "56px", 
                borderRadius: "28px",
                background: "var(--success-color)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
              }}>
                <CheckCircle2 size={28} color="white" />
              </div>
              <div>
                <h3 style={{ 
                  margin: "0 0 8px 0", 
                  fontSize: "var(--font-size-lg)", 
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>
                  确认注册
                </h3>
                <p style={{ 
                  color: "var(--text-secondary)", 
                  fontSize: "var(--font-size-md)", 
                  margin: 0,
                }}>
                  即将注册以下智能体：
                </p>
              </div>

              <Card style={{ 
                width: "100%", 
                background: "var(--bg-tertiary)",
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "100px 1fr", 
                  gap: "16px", 
                  fontSize: "var(--font-size-md)",
                  padding: '16px',
                }}>
                  <span style={{ 
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}>
                    名称
                  </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{agentName}</strong>
                  <span style={{ 
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}>
                    类型
                  </span>
                  <span>
                    <span style={{
                      background: "var(--bg-card)",
                      color: agentTypeConfig[agentType]?.color,
                      fontSize: "var(--font-size-xs)",
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                    }}>
                      {agentTypeConfig[agentType]?.label}
                    </span>
                  </span>
                </div>
              </Card>

              <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                <Button
                  variant="secondary"
                  onClick={() => setStep("info")}
                  style={{ 
                    flex: 1,
                  }}
                >
                  返回修改
                </Button>
                <Button
                  variant="success"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ 
                    flex: 1,
                  }}
                >
                  {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
                  确认注册
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default Agents;