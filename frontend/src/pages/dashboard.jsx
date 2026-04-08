'use client';

import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function MetricCard({ label, value, subtitle, icon, color = 'indigo', trend }) {
  const colorMap = {
    indigo: 'from-indigo-600/20 to-indigo-900/10 border-indigo-700/50',
    green: 'from-green-600/20 to-green-900/10 border-green-700/50',
    yellow: 'from-yellow-600/20 to-yellow-900/10 border-yellow-700/50',
    red: 'from-red-600/20 to-red-900/10 border-red-700/50',
    blue: 'from-blue-600/20 to-blue-900/10 border-blue-700/50',
    purple: 'from-purple-600/20 to-purple-900/10 border-purple-700/50',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    connected: { bg: 'bg-green-900/40 text-green-300 border-green-700/50', label: 'Conectado' },
    disconnected: { bg: 'bg-red-900/40 text-red-300 border-red-700/50', label: 'Desconectado' },
    partial: { bg: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50', label: 'Parcial' },
  };
  const s = map[status] || map.disconnected;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${s.bg}`}>
      {s.label}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configStatus, setConfigStatus] = useState({
    meta: 'disconnected',
    anthropic: 'disconnected',
    landing: 'disconnected',
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [configData, campaignData, financeData] = await Promise.allSettled([
        api.getConfig(),
        api.getCampaigns('last_7d'),
        api.getRecords(),
      ]);

      if (configData.status === 'fulfilled') {
        const c = configData.value;
        setConfig(c);
        setConfigStatus({
          meta: c.meta_access_token && c.meta_ad_account_id ? 'connected' : (c.meta_access_token || c.meta_ad_account_id ? 'partial' : 'disconnected'),
          anthropic: c.anthropic_api_key ? 'connected' : 'disconnected',
          landing: c.landing_page_url ? 'connected' : 'disconnected',
        });
      }

      if (campaignData.status === 'fulfilled' && Array.isArray(campaignData.value)) {
        setCampaigns(campaignData.value);
      }

      if (financeData.status === 'fulfilled' && Array.isArray(financeData.value)) {
        setRecords(financeData.value);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate metrics from campaigns
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.insights?.spend || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.insights?.revenue || 0), 0);
  const totalPurchases = campaigns.reduce((sum, c) => sum + (c.insights?.purchases || 0), 0);
  const avgRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '—';
  const avgCpa = totalPurchases > 0 ? (totalSpend / totalPurchases).toFixed(2) : '—';
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Buen día{user?.name ? `, ${user.name}` : ''}
            </h1>
            <p className="text-gray-400 mt-1">Resumen de tu cuenta de Meta Ads y rendimiento</p>
          </div>
          <button
            onClick={loadAll}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm border border-gray-700"
          >
            Actualizar
          </button>
        </div>

        {/* Connection Status */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Estado de Conexiones</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xl">📱</span>
                <span className="text-sm text-gray-300">Meta Ads API</span>
              </div>
              <StatusBadge status={configStatus.meta} />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xl">🤖</span>
                <span className="text-sm text-gray-300">Agentes IA (Anthropic)</span>
              </div>
              <StatusBadge status={configStatus.anthropic} />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌐</span>
                <span className="text-sm text-gray-300">Landing Page</span>
              </div>
              <StatusBadge status={configStatus.landing} />
            </div>
          </div>
          {configStatus.meta === 'disconnected' && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg">
              <p className="text-yellow-200 text-sm">
                Conecta tu cuenta de Meta Ads en <a href="/settings" className="underline font-medium">Configuración</a> para ver métricas reales de tus campañas.
              </p>
            </div>
          )}
        </div>

        {/* KPI Metrics */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Métricas Clave — Últimos 7 días</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon="💰"
              label="Inversión Total"
              value={totalSpend > 0 ? `$${totalSpend.toLocaleString()}` : '—'}
              color="red"
            />
            <MetricCard
              icon="📈"
              label="Revenue"
              value={totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : '—'}
              color="green"
            />
            <MetricCard
              icon="🎯"
              label="ROAS"
              value={avgRoas !== '—' ? `${avgRoas}x` : '—'}
              color="indigo"
            />
            <MetricCard
              icon="🛒"
              label="Compras"
              value={totalPurchases > 0 ? totalPurchases.toLocaleString() : '—'}
              subtitle={avgCpa !== '—' ? `CPA: $${avgCpa}` : ''}
              color="purple"
            />
          </div>
        </div>

        {/* Campaigns Overview + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaigns */}
          <div className="lg:col-span-2 bg-gray-900/80 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Campañas Activas</h2>
              <span className="text-xs text-gray-500">{activeCampaigns} activas de {campaigns.length}</span>
            </div>
            {campaigns.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {campaigns.slice(0, 8).map((campaign, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{campaign.name}</div>
                      <div className="text-xs text-gray-500">{campaign.objective || 'N/A'}</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <div className="text-gray-300">${campaign.insights?.spend?.toFixed(2) || '0'}</div>
                        <div className="text-gray-500">gasto</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-300">{campaign.insights?.roas?.toFixed(2) || '0'}x</div>
                        <div className="text-gray-500">ROAS</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        campaign.status === 'ACTIVE' ? 'bg-green-900/40 text-green-300' : 'bg-gray-700/40 text-gray-400'
                      }`}>
                        {campaign.status === 'ACTIVE' ? 'Activa' : 'Pausada'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-sm">No hay campañas cargadas.</p>
                <p className="text-xs mt-1">Conecta tu cuenta de Meta Ads para ver tus campañas aquí.</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <a href="/audit" className="flex items-center gap-3 p-3 bg-indigo-900/20 border border-indigo-700/30 rounded-lg hover:bg-indigo-900/30 transition-colors group">
                <span className="text-xl">🔍</span>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-indigo-300">Auditoría Completa</div>
                  <div className="text-xs text-gray-500">Análisis integral de todas tus campañas</div>
                </div>
              </a>
              <a href="/agents" className="flex items-center gap-3 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg hover:bg-purple-900/30 transition-colors group">
                <span className="text-xl">🤖</span>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-purple-300">Agentes IA</div>
                  <div className="text-xs text-gray-500">Ejecuta agentes especializados</div>
                </div>
              </a>
              <a href="/financials" className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-700/30 rounded-lg hover:bg-green-900/30 transition-colors group">
                <span className="text-xl">💰</span>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-green-300">Finanzas</div>
                  <div className="text-xs text-gray-500">Control financiero y márgenes</div>
                </div>
              </a>
              <a href="/settings" className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg hover:bg-gray-800/70 transition-colors group">
                <span className="text-xl">⚙️</span>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-gray-200">Configuración</div>
                  <div className="text-xs text-gray-500">APIs, tokens y datos del negocio</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        {records.length > 0 && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Resumen Financiero</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {records.slice(-1).map((r, i) => (
                <>
                  <div key={`ing-${i}`} className="text-center p-3 bg-gray-800/40 rounded-lg">
                    <div className="text-lg font-bold text-green-400">${(r.ingresos || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Ingresos</div>
                  </div>
                  <div key={`cos-${i}`} className="text-center p-3 bg-gray-800/40 rounded-lg">
                    <div className="text-lg font-bold text-red-400">${(r.costos || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Costos</div>
                  </div>
                  <div key={`ads-${i}`} className="text-center p-3 bg-gray-800/40 rounded-lg">
                    <div className="text-lg font-bold text-yellow-400">${(r.ad_spend || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Ad Spend</div>
                  </div>
                  <div key={`dev-${i}`} className="text-center p-3 bg-gray-800/40 rounded-lg">
                    <div className="text-lg font-bold text-orange-400">${(r.devoluciones || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Devoluciones</div>
                  </div>
                  <div key={`ord-${i}`} className="text-center p-3 bg-gray-800/40 rounded-lg">
                    <div className="text-lg font-bold text-indigo-400">{(r.ordenes || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Órdenes</div>
                  </div>
                </>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export function getServerSideProps(context) {
  return { props: {} };
}
