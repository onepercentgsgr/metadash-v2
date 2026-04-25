'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const AGENTS = [
  { id: 'optimize',      label: 'Optimizador',        icon: '🤖', path: '/agent/optimize',       desc: 'Analiza campañas y da acciones inmediatas' },
  { id: 'finance',       label: 'Finanzas',            icon: '💰', path: '/agent/finance',        desc: 'Márgenes, ROAS real y control de gasto' },
  { id: 'scripts',       label: 'Scripts',             icon: '🎬', path: '/agent/scripts',        desc: 'Genera guiones de video ads listos para grabar' },
  { id: 'creatives',     label: 'Creativos',           icon: '🎨', path: '/agent/creatives',      desc: 'Analiza y mejora creatividades actuales' },
  { id: 'growth',        label: 'Growth',              icon: '📈', path: '/agent/growth',         desc: 'Estrategia de escala y nuevas audiencias' },
  { id: 'cro',           label: 'CRO',                 icon: '🔄', path: '/agent/cro',            desc: 'Conversión en landing page y funnel' },
  { id: 'landing-audit', label: 'Landing',             icon: '🏠', path: '/agent/landing-audit',  desc: 'Auditoría de landing page y mejoras' },
  { id: 'full-audit',    label: 'Auditoría Total',     icon: '🔍', path: '/agent/full-audit',     desc: 'Análisis completo del negocio' },
];

function semaphoreColor(value, thresholds) {
  if (value === null || value === undefined) return 'gray';
  if (value >= thresholds.green) return 'green';
  if (value >= thresholds.yellow) return 'yellow';
  return 'red';
}

function computeSemaphore(campaigns) {
  if (!campaigns || campaigns.length === 0) return null;
  const active = campaigns.filter((c) => c.status === 'ACTIVE');
  if (active.length === 0) return null;

  const avg = (key) => {
    const vals = active.map((c) => parseFloat(c[key] || 0)).filter((v) => !isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const roas = avg('roas');
  const ctr = avg('ctr');
  const cpm = avg('cpm');
  const spend = active.reduce((a, c) => a + parseFloat(c.spend || 0), 0);

  return {
    roas: { value: roas, color: semaphoreColor(roas, { green: 2, yellow: 1 }), label: 'ROAS Prom.' },
    ctr: { value: ctr, color: semaphoreColor(ctr, { green: 1, yellow: 0.5 }), label: 'CTR Prom. (%)' },
    cpm: { value: cpm, color: semaphoreColor(cpm ? 20 - cpm : null, { green: 10, yellow: 0 }), label: 'CPM Prom.' },
    spend: { value: spend, color: 'blue', label: 'Gasto Total' },
    active: { value: active.length, color: 'blue', label: 'Campañas activas' },
  };
}

const colorMap = {
  green: 'bg-emerald-900/40 border-emerald-600/40 text-emerald-300',
  yellow: 'bg-yellow-900/40 border-yellow-600/40 text-yellow-300',
  red: 'bg-red-900/40 border-red-600/40 text-red-300',
  blue: 'bg-indigo-900/40 border-indigo-600/40 text-indigo-300',
  gray: 'bg-gray-800/40 border-gray-600/40 text-gray-400',
};

const dotMap = {
  green: 'bg-emerald-400',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
  blue: 'bg-indigo-400',
  gray: 'bg-gray-500',
};

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignError, setCampaignError] = useState('');

  const [activeTab, setActiveTab] = useState('optimize');
  const [agentOutputs, setAgentOutputs] = useState({});
  const [agentLoading, setAgentLoading] = useState({});

  const [tiktokMode, setTiktokMode] = useState('strategy');
  const [tiktokOutput, setTiktokOutput] = useState('');
  const [tiktokLoading, setTiktokLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchCampaigns = useCallback(async () => {
    if (!token) return;
    setLoadingCampaigns(true);
    setCampaignError('');
    try {
      const res = await fetch(`${API}/campaigns?date_preset=last_7d`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setCampaignError(err.detail || `Error ${res.status}`);
        return;
      }
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (e) {
      setCampaignError('No se pudo conectar con Meta Ads. Verificá tu configuración.');
    } finally {
      setLoadingCampaigns(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const runAgent = async (agentId, path) => {
    setAgentLoading((p) => ({ ...p, [agentId]: true }));
    try {
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: '',
          context: { campaigns_data: campaigns },
        }),
      });
      const data = await res.json();
      setAgentOutputs((p) => ({
        ...p,
        [agentId]: res.ok ? (data.result || JSON.stringify(data)) : (data.detail || 'Error desconocido'),
      }));
    } catch (e) {
      setAgentOutputs((p) => ({ ...p, [agentId]: `Error: ${e.message}` }));
    } finally {
      setAgentLoading((p) => ({ ...p, [agentId]: false }));
    }
  };

  const runTikTokAds = async () => {
    setTiktokLoading(true);
    setTiktokOutput('');
    try {
      const res = await fetch(`${API}/agents/tiktok-ads/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: tiktokMode, payload: {} }),
      });
      const data = await res.json();
      setTiktokOutput(res.ok ? data.output : (data.detail || 'Error'));
    } catch (e) {
      setTiktokOutput(`Error: ${e.message}`);
    } finally {
      setTiktokLoading(false);
    }
  };

  const semaphore = computeSemaphore(campaigns);
  const currentAgent = AGENTS.find((a) => a.id === activeTab);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Campañas &amp; Agentes IA</h1>
            <p className="text-gray-400 text-sm mt-1">Meta Ads + TikTok Ads — control total del gasto</p>
          </div>
          <button
            onClick={fetchCampaigns}
            disabled={loadingCampaigns}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loadingCampaigns ? 'Actualizando...' : '↻ Actualizar'}
          </button>
        </div>

        {/* Semaphore */}
        {semaphore ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(semaphore).map(([key, { value, color, label }]) => (
              <div key={key} className={`border rounded-xl p-4 ${colorMap[color]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${dotMap[color]}`} />
                  <span className="text-xs font-medium opacity-80">{label}</span>
                </div>
                <div className="text-xl font-bold">
                  {value === null ? '—' : typeof value === 'number' ? value.toFixed(2) : value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            {campaignError ? (
              <p className="text-red-400 text-sm">{campaignError}</p>
            ) : loadingCampaigns ? (
              <p className="text-gray-500 text-sm">Cargando métricas...</p>
            ) : (
              <p className="text-gray-500 text-sm">
                Conectá Meta Ads en <a href="/settings" className="text-indigo-400 underline">Configuración</a> para ver el semáforo.
              </p>
            )}
          </div>
        )}

        {/* Campaign Table */}
        {campaigns.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-white">Campañas activas (últimos 7 días)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Campaña', 'Estado', 'Gasto', 'ROAS', 'CTR', 'CPM', 'Alcance'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => {
                    const roas = parseFloat(c.roas || 0);
                    const roasColor = roas >= 2 ? 'text-emerald-400' : roas >= 1 ? 'text-yellow-400' : 'text-red-400';
                    return (
                      <tr key={c.id || i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-gray-200 font-medium max-w-[200px] truncate">{c.name || c.id}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === 'ACTIVE' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">${parseFloat(c.spend || 0).toFixed(2)}</td>
                        <td className={`px-4 py-3 font-semibold ${roasColor}`}>{roas.toFixed(2)}x</td>
                        <td className="px-4 py-3 text-gray-300">{parseFloat(c.ctr || 0).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-gray-300">${parseFloat(c.cpm || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-300">{(c.reach || 0).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8 Agent Tabs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="border-b border-gray-800 overflow-x-auto">
            <div className="flex min-w-max">
              {AGENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActiveTab(a.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === a.id
                      ? 'text-indigo-300 border-b-2 border-indigo-500 bg-indigo-900/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                  }`}
                >
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {currentAgent && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-white font-semibold">{currentAgent.icon} {currentAgent.label}</h3>
                    <p className="text-gray-400 text-sm mt-1">{currentAgent.desc}</p>
                  </div>
                  <button
                    onClick={() => runAgent(currentAgent.id, currentAgent.path)}
                    disabled={agentLoading[currentAgent.id]}
                    className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {agentLoading[currentAgent.id] ? 'Ejecutando...' : '▶ Ejecutar agente'}
                  </button>
                </div>

                {agentOutputs[currentAgent.id] && (
                  <div className="relative">
                    <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto">
                      {agentOutputs[currentAgent.id]}
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(agentOutputs[currentAgent.id])}
                      className="absolute top-3 right-3 text-xs text-gray-500 hover:text-gray-300 bg-gray-900 border border-gray-700 rounded px-2 py-1"
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* TikTok Ads Paid Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
            <span className="text-xl">🎵</span>
            <div>
              <h2 className="text-sm font-semibold text-white">TikTok Ads — Agente Pago</h2>
              <p className="text-xs text-gray-500 mt-0.5">Estrategia de lanzamiento u optimización diaria — sin quemar plata</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex gap-3">
              <button
                onClick={() => setTiktokMode('strategy')}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  tiktokMode === 'strategy'
                    ? 'bg-pink-900/30 border-pink-600/40 text-pink-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                🚀 Plan de Lanzamiento
              </button>
              <button
                onClick={() => setTiktokMode('optimize')}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  tiktokMode === 'optimize'
                    ? 'bg-pink-900/30 border-pink-600/40 text-pink-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                ⚡ Optimización Diaria
              </button>
              <button
                onClick={runTikTokAds}
                disabled={tiktokLoading}
                className="ml-auto px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {tiktokLoading ? 'Ejecutando...' : '▶ Ejecutar'}
              </button>
            </div>

            {tiktokOutput && (
              <div className="relative">
                <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto">
                  {tiktokOutput}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(tiktokOutput)}
                  className="absolute top-3 right-3 text-xs text-gray-500 hover:text-gray-300 bg-gray-900 border border-gray-700 rounded px-2 py-1"
                >
                  Copiar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
