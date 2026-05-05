import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, Download, Star, Search, Filter, CheckCircle, RefreshCw,
  ExternalLink, Package, Tag, Users, Clock, ChevronRight
} from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'

interface OpenLabApp {
  id: string
  name: string
  category: string
  description: string
  version: string
  rating: number
  downloads: number
  author: string
  tags: string[]
  status: 'installed' | 'available' | 'updating'
  lastUpdated: string
  icon: string
}

const defaultApps: OpenLabApp[] = [
  {
    id: 'docgen',
    name: '文档生成器',
    category: '生产力',
    description: '自动生成项目文档、API 文档和代码注释文档，支持多种格式输出',
    version: '2.1.0',
    rating: 4.8,
    downloads: 12540,
    author: 'AgentOS Team',
    tags: ['文档', '自动化', 'markdown'],
    status: 'available',
    lastUpdated: '2026-04-20',
    icon: '📄'
  },
  {
    id: 'ecommerce',
    name: '电商助手',
    category: '商业',
    description: '智能电商运营助手，支持商品管理、订单处理、客户服务和数据分析',
    version: '1.5.3',
    rating: 4.6,
    downloads: 8923,
    author: 'Commerce AI',
    tags: ['电商', '订单', '客服'],
    status: 'installed',
    lastUpdated: '2026-04-15',
    icon: '🛒'
  },
  {
    id: 'research',
    name: '研究助理',
    category: '研究',
    description: '学术研究与数据分析助手，支持文献检索、论文摘要和趋势分析',
    version: '3.0.1',
    rating: 4.9,
    downloads: 15670,
    author: 'Research Labs',
    tags: ['研究', '论文', '数据'],
    status: 'available',
    lastUpdated: '2026-04-22',
    icon: '🔬'
  },
  {
    id: 'videoedit',
    name: '视频编辑',
    category: '创意',
    description: 'AI 驱动的视频编辑工具，支持自动剪辑、字幕生成和特效添加',
    version: '1.2.0',
    rating: 4.4,
    downloads: 6780,
    author: 'Media AI',
    tags: ['视频', '剪辑', 'AI'],
    status: 'available',
    lastUpdated: '2026-04-18',
    icon: '🎬'
  },
  {
    id: 'code-review',
    name: '代码审查',
    category: '开发',
    description: '智能代码审查工具，支持多种编程语言，提供代码质量评估和改进建议',
    version: '2.3.1',
    rating: 4.7,
    downloads: 11230,
    author: 'DevTools',
    tags: ['代码', '审查', '质量'],
    status: 'available',
    lastUpdated: '2026-04-24',
    icon: '🔍'
  },
  {
    id: 'data-viz',
    name: '数据可视化',
    category: '数据',
    description: '强大的数据可视化工具，支持图表生成、仪表盘创建和交互式报表',
    version: '1.8.0',
    rating: 4.5,
    downloads: 9450,
    author: 'DataViz Inc',
    tags: ['数据', '图表', '报表'],
    status: 'installed',
    lastUpdated: '2026-04-19',
    icon: '📊'
  }
]

const categories = ['全部', '生产力', '商业', '研究', '创意', '开发', '数据']

const OpenLab: React.FC = () => {
  const [apps, setApps] = useState<OpenLabApp[]>(() => {
    const saved = localStorage.getItem('agentos-openlab-apps')
    return saved ? JSON.parse(saved) : defaultApps
  })
  const [filterCategory, setFilterCategory] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApp, setSelectedApp] = useState<OpenLabApp | null>(null)

  useEffect(() => {
    localStorage.setItem('agentos-openlab-apps', JSON.stringify(apps))
  }, [apps])

  const filteredApps = apps.filter(app => {
    const matchCategory = filterCategory === '全部' || app.category === filterCategory
    const matchSearch = !searchQuery || 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchCategory && matchSearch
  })

  const handleInstall = (id: string) => {
    setApps(prev => prev.map(app => {
      if (app.id === id) {
        return { ...app, status: 'updating' }
      }
      return app
    }))
    invoke('call_tool', { name: 'app_install', arguments: JSON.stringify({ app_id: id }) })
      .then(() => {
        setApps(prev => prev.map(app => {
          if (app.id === id) {
            return { ...app, status: app.status === 'installed' ? 'available' : 'installed' }
          }
          return app
        }))
      })
      .catch((e: unknown) => {
        console.warn('App install failed:', e)
        setApps(prev => prev.map(app => {
          if (app.id === id) {
            return { ...app, status: 'available' }
          }
          return app
        }))
      })
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          fill={i <= Math.round(rating) ? 'var(--warning-color)' : 'none'}
          color={i <= Math.round(rating) ? 'var(--warning-color)' : 'var(--text-muted)'}
        />
      )
    }
    return stars
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
          <Sparkles size={24} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--warning-color)' }} />
          应用市场
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          浏览和安装 AgentOS 扩展应用
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索应用..."
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px',
              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: '13px', outline: 'none'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: filterCategory === cat ? 'var(--primary-color)' : 'transparent',
                color: filterCategory === cat ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '12px', transition: 'all 150ms ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredApps.map(app => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px',
              border: '1px solid var(--border-subtle)', cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            onClick={() => setSelectedApp(app)}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--primary-color)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '10px',
                  background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '24px'
                }}>
                  {app.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 2px 0', color: 'var(--text-primary)' }}>
                    {app.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.category}</div>
                </div>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation()
                  handleInstall(app.id)
                }}
                disabled={app.status === 'updating'}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none',
                  background: app.status === 'installed' ? 'var(--success-light)' : 'var(--primary-color)',
                  color: app.status === 'installed' ? 'var(--success-color)' : 'white',
                  cursor: app.status === 'updating' ? 'wait' : 'pointer',
                  fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
                  transition: 'all 150ms ease'
                }}
              >
                {app.status === 'updating' ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : app.status === 'installed' ? (
                  <><CheckCircle size={14} /> 已安装</>
                ) : (
                  <><Download size={14} /> 安装</>
                )}
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              {app.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>{renderStars(app.rating)}</div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.rating}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Download size={12} />
                {app.downloads.toLocaleString()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredApps.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Package size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>未找到匹配的应用</p>
          <p style={{ margin: 0, fontSize: '13px' }}>尝试调整搜索条件或分类筛选</p>
        </div>
      )}

      {selectedApp && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => setSelectedApp(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)', borderRadius: '16px', padding: '24px',
              width: '480px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '12px',
                  background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '32px'
                }}>
                  {selectedApp.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                    {selectedApp.name}
                  </h2>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    v{selectedApp.version} · {selectedApp.author}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                  background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: 1.6 }}>
              {selectedApp.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>评分</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} fill="var(--warning-color)" color="var(--warning-color)" />
                  <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedApp.rating}
                  </span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>下载量</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {selectedApp.downloads.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>版本</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {selectedApp.version}
                </div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>更新</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {selectedApp.lastUpdated}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>标签</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selectedApp.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                      background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                handleInstall(selectedApp.id)
                setSelectedApp(null)
              }}
              disabled={selectedApp.status === 'updating'}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                background: selectedApp.status === 'installed' ? 'var(--bg-tertiary)' : 'var(--primary-color)',
                color: selectedApp.status === 'installed' ? 'var(--text-secondary)' : 'white',
                cursor: selectedApp.status === 'updating' ? 'wait' : 'pointer',
                fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', transition: 'all 150ms ease'
              }}
            >
              {selectedApp.status === 'updating' ? (
                <><RefreshCw size={16} className="animate-spin" /> 安装中...</>
              ) : selectedApp.status === 'installed' ? (
                <><CheckCircle size={16} /> 已安装</>
              ) : (
                <><Download size={16} /> 安装应用</>
              )}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default OpenLab
