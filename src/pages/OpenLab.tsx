import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Download,
  Star,
  Search,
  CheckCircle,
  RefreshCw,
  Package,
  Tag,
} from 'lucide-react';
import { invoke } from '../utils/tauriCompat';
import { logger } from '../utils/logger';

interface OpenLabApp {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  rating?: number;
  downloads?: number;
  author: string;
  tags: string[];
  status: 'installed' | 'available' | 'updating';
  lastUpdated: string;
  icon: string;
}

// 从 JSON-RPC result 中提取对象数组（兼容 gateway market.* 的返回结构）
function toMarketArray(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    for (const key of ['agents', 'skills', 'items', 'results']) {
      const v = obj[key];
      if (Array.isArray(v)) return v as Array<Record<string, unknown>>;
    }
  }
  return [];
}

function getString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === 'string' ? v : String(v ?? '');
}

// 将 market.search_agents / market.search_skills 的真实数据归一化为市场应用条目。
// 不编造假下载量/评分：真实数据缺失时字段为 undefined。
function normalizeMarketData(result: unknown): OpenLabApp[] {
  return toMarketArray(result).map((item) => ({
    id: getString(item, 'id') || getString(item, 'name') || `item-${Date.now()}`,
    name: getString(item, 'name'),
    category: getString(item, 'category') || getString(item, 'type') || '其他',
    description: getString(item, 'description') || '',
    version: getString(item, 'version') || '1.0.0',
    rating: typeof item['rating'] === 'number' ? (item['rating'] as number) : undefined,
    downloads: typeof item['downloads'] === 'number' ? (item['downloads'] as number) : undefined,
    author: getString(item, 'author') || getString(item, 'author_name') || '',
    tags: Array.isArray(item['tags']) ? (item['tags'] as string[]) : [],
    status: 'available',
    lastUpdated: getString(item, 'last_updated') || getString(item, 'updated_at') || '',
    icon: getString(item, 'icon') || getString(item, 'emoji') || '🧩',
  }));
}

const categories = ['全部', '生产力', '商业', '研究', '创意', '开发', '数据'];

const OpenLab: React.FC = () => {
  const { t } = useTranslation();
  const [apps, setApps] = useState<OpenLabApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<OpenLabApp | null>(null);

  // 应用市场数据来自 gateway market.search_agents / market.search_skills；
  // 无数据时显示空态，不提供任何本地编造的默认应用。
  useEffect(() => {
    let cancelled = false;
    const loadMarket = async () => {
      try {
        const [agentResult, skillResult] = await Promise.all([
          invoke('market.search_agents', {}),
          invoke('market.search_skills', {}),
        ]);
        if (cancelled) return;
        const marketApps = [
          ...normalizeMarketData(agentResult),
          ...normalizeMarketData(skillResult),
        ];
        setApps(marketApps);
        localStorage.setItem('agentos-openlab-apps', JSON.stringify(marketApps));
      } catch (e) {
        // Gateway 不可达或市场为空：显示空态，不降级为假数据，记录日志
        logger.warn('market.search_agents / market.search_skills 拉取失败', e);
        if (!cancelled) setApps([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadMarket();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('agentos-openlab-apps', JSON.stringify(apps));
  }, [apps]);

  const filteredApps = apps.filter((app) => {
    const matchCategory = filterCategory === '全部' || app.category === filterCategory;
    const matchSearch =
      !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleInstall = (id: string) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          return { ...app, status: 'updating' };
        }
        return app;
      }),
    );
    invoke('call_tool', { name: 'app_install', arguments: JSON.stringify({ app_id: id }) })
      .then(() => {
        setApps((prev) =>
          prev.map((app) => {
            if (app.id === id) {
              return { ...app, status: app.status === 'installed' ? 'available' : 'installed' };
            }
            return app;
          }),
        );
      })
      .catch((_e: unknown) => {
        setApps((prev) =>
          prev.map((app) => {
            if (app.id === id) {
              return { ...app, status: 'available' };
            }
            return app;
          }),
        );
      });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          fill={i <= Math.round(rating) ? 'var(--warning-color)' : 'none'}
          color={i <= Math.round(rating) ? 'var(--warning-color)' : 'var(--text-muted)'}
        />,
      );
    }
    return stars;
  };

  return (
    <div role="region" aria-label="OpenLab 实验平台" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 4px 0',
            color: 'var(--text-primary)',
          }}
        >
          <Sparkles
            size={24}
            style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--warning-color)' }}
          />
          应用市场
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          浏览和安装 AgentRT 扩展应用
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            role="searchbox"
            aria-label="搜索实验"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索应用..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              aria-label={`筛选分类: ${cat}`}
              aria-pressed={filterCategory === cat}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: filterCategory === cat ? 'var(--primary-color)' : 'transparent',
                color: filterCategory === cat ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 150ms ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div
        role="list"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {filteredApps.map((app) => (
          <motion.div
            key={app.id}
            role="listitem"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onClick={() => setSelectedApp(app)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  {app.icon}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      margin: '0 0 2px 0',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {app.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.category}</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInstall(app.id);
                }}
                disabled={app.status === 'updating'}
                aria-label={app.status === 'installed' ? '卸载应用' : app.status === 'updating' ? '安装中' : '安装应用'}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background:
                    app.status === 'installed' ? 'var(--success-light)' : 'var(--primary-color)',
                  color: app.status === 'installed' ? 'var(--success-color)' : 'white',
                  cursor: app.status === 'updating' ? 'wait' : 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 150ms ease',
                }}
              >
                {app.status === 'updating' ? (
                  <span role="status" aria-live="polite"><RefreshCw size={14} className="animate-spin" /></span>
                ) : app.status === 'installed' ? (
                  <>
                    <CheckCircle size={14} /> 已安装
                  </>
                ) : (
                  <>
                    <Download size={14} /> 安装
                  </>
                )}
              </button>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: '0 0 12px 0',
                lineHeight: 1.5,
              }}
            >
              {app.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>{renderStars(app.rating ?? 0)}</div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {app.rating ?? '—'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                <Download size={12} />
                {(app.downloads ?? 0).toLocaleString()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredApps.length === 0 && (
        <div role="status" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Package size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            {loading ? '正在加载应用市场...' : '未找到匹配的应用'}
          </p>
          <p style={{ margin: 0, fontSize: '13px' }}>
            {loading ? '正在从 AgentRT 市场获取数据' : '尝试调整搜索条件或分类筛选'}
          </p>
        </div>
      )}

      {selectedApp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedApp.name} 应用详情`}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setSelectedApp(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: '24px',
              width: '480px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                  }}
                >
                  {selectedApp.icon}
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      margin: '0 0 4px 0',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {selectedApp.name}
                  </h2>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    v{selectedApp.version} · {selectedApp.author}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                aria-label="关闭"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: '0 0 20px 0',
                lineHeight: 1.6,
              }}
            >
              {selectedApp.description}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  评分
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} fill="var(--warning-color)" color="var(--warning-color)" />
                  <span
                    style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}
                  >
                    {selectedApp.rating ?? '—'}
                  </span>
                </div>
              </div>
              <div
                style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  下载量
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {(selectedApp.downloads ?? 0).toLocaleString()}
                </div>
              </div>
              <div
                style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {t('settings.version')}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {selectedApp.version}
                </div>
              </div>
              <div
                style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  更新
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {selectedApp.lastUpdated}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                标签
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selectedApp.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
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
                handleInstall(selectedApp.id);
                setSelectedApp(null);
              }}
              disabled={selectedApp.status === 'updating'}
              aria-label={selectedApp.status === 'installed' ? '卸载应用' : selectedApp.status === 'updating' ? '安装中' : '安装应用'}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background:
                  selectedApp.status === 'installed'
                    ? 'var(--bg-tertiary)'
                    : 'var(--primary-color)',
                color: selectedApp.status === 'installed' ? 'var(--text-secondary)' : 'white',
                cursor: selectedApp.status === 'updating' ? 'wait' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 150ms ease',
              }}
            >
              {selectedApp.status === 'updating' ? (
                <span role="status" aria-live="polite">
                  <RefreshCw size={16} className="animate-spin" /> 安装中...
                </span>
              ) : selectedApp.status === 'installed' ? (
                <>
                  <CheckCircle size={16} /> 已安装
                </>
              ) : (
                <>
                  <Download size={16} /> 安装应用
                </>
              )}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OpenLab;
