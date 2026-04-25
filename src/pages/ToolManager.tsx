import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, Search, Play, Trash2, RefreshCw, Loader2,
  AlertCircle, ChevronDown, ChevronUp, Code, Terminal, Brain, ListTodo, MessageSquare, HardDrive
} from 'lucide-react';
import { useSkills } from '../hooks/useAgentOS';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  system: <Terminal size={14} />,
  agent: <Brain size={14} />,
  task: <ListTodo size={14} />,
  memory: <MessageSquare size={14} />,
  io: <HardDrive size={14} />,
};

const ToolManager: React.FC = () => {
  const { skills, loading, error: skillsError, fetchSkills, executeSkill, deleteSkill, getSkillCount } = useSkills();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [execArgs, setExecArgs] = useState('{}');
  const [execResult, setExecResult] = useState<Record<string, unknown> | null>(null);
  const [execLoading, setExecLoading] = useState<string | null>(null);
  const [execHistory, setExecHistory] = useState<Array<{ name: string; result: string; timestamp: string; success: boolean }>>([]);

  useEffect(() => { fetchSkills(); }, []);

  const handleExecute = async (skillId: string, skillName: string) => {
    setExecLoading(skillId);
    setExecResult(null);
    try {
      const params = JSON.parse(execArgs);
      await executeSkill(skillId, Object.keys(params).length > 0 ? params : undefined);
      setExecResult({ success: true, message: `技能 ${skillName} 执行成功` });
      setExecHistory(prev => [{ name: skillName, result: '执行成功', timestamp: new Date().toISOString(), success: true }, ...prev].slice(0, 10));
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setExecResult({ error: errMsg });
      setExecHistory(prev => [{ name: skillName, result: errMsg, timestamp: new Date().toISOString(), success: false }, ...prev].slice(0, 10));
    } finally {
      setExecLoading(null);
    }
  };

  const handleDelete = async (skillId: string) => {
    setExecLoading(`delete-${skillId}`);
    try { await deleteSkill(skillId); } finally { setExecLoading(null); }
  };

  const filteredTools = skills.filter((s: any) => {
    const name = s.name || '';
    const desc = s.description || '';
    const matchesSearch = !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || (s.metadata as any)?.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(skills.map((s: any) => (s.metadata as any)?.category).filter(Boolean))];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Wrench size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              工具管理
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>AgentOS 可用工具列表与执行控制台</p>
          </div>
        </div>
        <button onClick={() => fetchSkills()} style={{
          padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 'var(--font-size-md)',
          transition: 'all var(--transition-fast)',
        }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
        </button>
      </div>

      {skillsError && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px', backgroundColor: 'var(--error-light)',
          border: '1px solid var(--error-color)', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error-color)',
        }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: 'var(--font-size-sm)' }}>{skillsError}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索工具..." style={{
            width: '100%', padding: '10px 14px 10px 36px', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
            fontSize: 'var(--font-size-md)', fontFamily: 'inherit', outline: 'none', transition: 'all var(--transition-fast)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.2)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        {categories.length > 1 && (
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{
            padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', fontFamily: 'inherit', outline: 'none',
          }}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? '全部类别' : cat}</option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
          <Loader2 size={32} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {!loading && filteredTools.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center',
        }}>
          <Wrench size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)' }}>暂无可用工具</p>
        </div>
      )}

      {!loading && filteredTools.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {filteredTools.map((tool: any, index: number) => {
              const name = tool.name || '';
              const desc = tool.description || '';
              const cat = tool.metadata?.category || '';
              const isSelected = selectedTool?.id === tool.id;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  style={{
                    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer' }}
                    onClick={() => setSelectedTool(isSelected ? null : tool)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {CATEGORY_ICONS[cat] || <Code size={14} />}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>{name}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{desc}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {cat && <span style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{cat}</span>}
                      {isSelected ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid var(--border-subtle)' }}
                      >
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', marginBottom: '6px' }}>参数 (JSON)</label>
                            <textarea value={execArgs} onChange={e => setExecArgs(e.target.value)} rows={3} placeholder='{"key": "value"}' style={{
                              width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-mono)', outline: 'none', resize: 'vertical', transition: 'all var(--transition-fast)',
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.2)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleExecute(tool.id, name)} disabled={execLoading === tool.id} style={{
                              padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-md)',
                              background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white', cursor: 'pointer',
                              fontFamily: 'inherit', fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center', gap: '6px',
                              transition: 'all var(--transition-fast)', opacity: execLoading === tool.id ? 0.5 : 1,
                            }}>
                              {execLoading === tool.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
                              执行
                            </button>
                            <button onClick={() => handleDelete(tool.id)} disabled={execLoading === `delete-${tool.id}`} style={{
                              padding: '8px 16px', border: '1px solid var(--error-color)', borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--error-light)', color: 'var(--error-color)', cursor: 'pointer',
                              fontFamily: 'inherit', fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center', gap: '6px',
                              transition: 'all var(--transition-fast)', opacity: execLoading === `delete-${tool.id}` ? 0.5 : 1,
                            }}>
                              <Trash2 size={14} /> 删除
                            </button>
                          </div>
                          {execResult && (
                            <pre style={{
                              margin: 0, padding: '12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)',
                              fontFamily: 'var(--font-mono)', maxHeight: '200px', overflow: 'auto', lineHeight: 1.6,
                              backgroundColor: 'error' in execResult ? 'var(--error-light)' : 'var(--success-light)',
                              color: 'error' in execResult ? 'var(--error-color)' : 'var(--success-color)',
                            }}>
                              {JSON.stringify(execResult, null, 2)}
                            </pre>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {execHistory.length > 0 && (
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '20px', marginTop: '20px',
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={16} style={{ color: '#f59e0b' }} /> 执行历史
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {execHistory.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>{item.name}</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <span style={{
                  fontSize: 'var(--font-size-xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  color: item.success ? 'var(--success-color)' : 'var(--error-color)',
                  backgroundColor: item.success ? 'var(--success-light)' : 'var(--error-light)',
                }}>
                  {item.success ? '成功' : '失败'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolManager;
