'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const AGENTS = [
  { id: 'optimize',      label: 'Optimizador',    icon: 'campaigns', path: '/agent/optimize',      desc: 'Analiza campañas y da acciones inmediatas' },
  { id: 'finance',       label: 'Finanzas',        icon: 'financials',path: '/agent/finance',       desc: 'Márgenes, ROAS real y control de gasto' },
  { id: 'scripts',       label: 'Scripts',         icon: 'tiktok',    path: '/agent/scripts',       desc: 'Genera guiones de video ads listos para grabar' },
  { id: 'creatives',     label: 'Creativos',       icon: 'videos',    path: '/agent/creatives',     desc: 'Analiza y mejora creatividades actuales' },
  { id: 'growth',        label: 'Growth',          icon: 'rocket',    path: '/agent/growth',        desc: 'Estrategia de escala y nuevas audiencias' },
  { id: 'cro',           label: 'CRO',             icon: 'audit',     path: '/agent/cro',           desc: 'Conversión en landing page y funnel' },
  { id: 'landing-audit', label: 'Landing',         icon: 'audit',     path: '/agent/landing-audit', desc: 'Auditoría de landing page y mejoras' },
  { id: 'full-audit',    label: 'Auditoría Total', icon: 'crown',     path: '/agent/full-audit',    desc: 'Análisis completo del negocio' },
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
    roas:   { value: roas,   color: semaphoreColor(roas, { green: 2, yellow: 1 }),                    label: 'ROAS Prom.' },
    ctr:    { value: ctr,    color: semaphoreColor(ctr, { green: 1, yellow: 0.5 }),                   label: 'CTR Prom. (%)' },
    cpm:    { value: cpm,    color: semaphoreColor(cpm ? 20 - cpm : null, { green: 10, yellow: 0 }), label: 'CPM Prom.' },
    spend:  { value: spend,  color: 'blue',                                                            label: 'Gasto Total' },
    active: { value: active.length, color: 'blue',                                                    label: 'Campañas activas' },
  };
}

const colorMap = {
  green:  { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',  text: '#34d399', dot: '#10b981' },
  yellow: { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.2)',   text: '#fbbf24', dot: '#eab308' },
  red:    { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',   text: '#f87171', dot: '#ef4444' },
  blue:   { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)',  text: '#a5b4fc', dot: '#6366f1' },
  gray:   { bg: 'rgba(107,114,128,0.08)',border: 'rgba(107,114,128,0.2)', text: '#9ca3af', dot: '#6b7280' },
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

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const runAgent = async (agentId, path) => {
    setAgentLoading((p) => ({ ...p, [agentId]: true }));
    try {
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: '', context: { campaigns_data: campaigns } }),
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

  const card = {
    background: '#16161a',
    border: '1px solid #1e1e24',
    borderRadius: '1rem',
  };

  return (
    <Layout>
      <div className="space-y-7">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#6366f1' }}>
              Meta Ads · TikTok Ads
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Campañas &amp; Agentes IA</h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Control total del gasto publicitario en tiempo real</p>
          </div>
          <button
            onClick={fetchCampaigns}
            disabled={loadingCampaigns}
            className="px-4 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
            style={{
              background: 'rgba(99,102,241,0.12)',
              color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
          >
            {loadingCampaigns ? 'Actualizando...' : '↻ Actualizar'}
          </button>
        </div>

        {/* Semaphore */}
        {semaphore ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(semaphore).map(([key, { value, color, label }]) => {
              const c = colorMap[color];
              return (
                <div key={key} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '1rem', padding: '1rem' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: c.text, opacity: 0.7 }}>{label}</span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: c.text }}>
                    {value === null ? '—' : typeof value === 'number' ? value.toFixed(2) : value}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ ...card, padding: '1.25rem', textAlign: 'center' }}>
            {campaignError ? (
              <p className="text-sm" style={{ color: '#f87171' }}>{campaignError}</p>
            ) : loadingCampaigns ? (
              <p className="text-sm" style={{ color: '#6b7280' }}>Cargando métricas...</p>
            ) : (
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Conectá Meta Ads en{' '}
                <a href="/settings" style={{ color: '#a5b4fc', textDecoration: 'underline' }}>Configuración</a>
                {' '}para ver el semáforo.
              </p>
            )}
          </div>
        )}

        {/* Campaign Table */}
        {campaigns.length > 0 && (
          <div style={{ ...card, overflow: 'hidden' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e1e24' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#6b7280' }}>Últimos 7 días</p>
              <h2 className="text-sm font-semibold text-white">Campañas activas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e1e24' }}>
                    {['Campaña', 'Estado', 'Gasto', 'ROAS', 'CTR', 'CPM', 'Alcance'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => {
                    const roas = parseFloat(c.roas || 0);
                    const roasColor = roas >= 2 ? '#34d399' : roas >= 1 ? '#fbbf24' : '#f87171';
                    return (
                      <tr key={c.id || i} style={{ borderBottom: '1px solid rgba(30,30,36,0.8)' }}
                        className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium max-w-[200px] truncate" style={{ color: '#e5e7eb' }}>{c.name || c.id}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                            style={c.status === 'ACTIVE'
                              ? { background: 'rgba(16,185,129,0.1)', color: '#34d399' }
                              : { background: 'rgba(107,114,128,0.1)', color: '#9ca3af' }
                            }>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: '#d1d5db' }}>${parseFloat(c.spend || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: roasColor }}>{roas.toFixed(2)}x</td>
                        <td className="px-4 py-3" style={{ color: '#d1d5db' }}>{parseFloat(c.ctr || 0).toFixed(2)}%</td>
                        <td className="px-4 py-3" style={{ color: '#d1d5db' }}>${parseFloat(c.cpm || 0).toFixed(2)}</td>
                        <td className="px-4 py-3" style={{ color: '#d1d5db' }}>{(c.reach || 0).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Agent Tabs */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div className="overflow-x-auto" style={{ borderBottom: '1px solid #1e1e24' }}>
            <div className="flex min-w-max">
              {AGENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActiveTab(a.id)}
                  className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2"
                  style={activeTab === a.id
                    ? { color: '#a5b4fc', borderBottom: '2px solid #6366f1', background: 'rgba(99,102,241,0.06)' }
                    : { color: '#6b7280', borderBottom: '2px solid transparent' }
                  }
                >
                  <Icon name={a.icon} size={13} strokeWidth={2} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {currentAgent && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2"><Icon name={currentAgent.icon} size={15} strokeWidth={2} style={{ color: '#a5b4fc' }} />{currentAgent.label}</h3>
                    <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{currentAgent.desc}</p>
                  </div>
                  <button
                    onClick={() => runAgent(currentAgent.id, currentAgent.path)}
                    disabled={agentLoading[currentAgent.id]}
                    className="shrink-0 px-4 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                      color: 'white',
                      boxShadow: '0 4px 15px rgba(99,102,241,0.25)',
                    }}
                  >
                    {agentLoading[currentAgent.id] ? 'Ejecutando...' : '▶ Ejecutar agente'}
                  </button>
                </div>

                {agentOutputs[currentAgent.id] && (
                  <div className="relative">
                    <pre className="rounded-xl p-4 text-sm whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto leading-relaxed"
                      style={{ background: '#0d0d11', border: '1px solid #1e1e24', color: '#d1d5db' }}>
                      {agentOutputs[currentAgent.id]}
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(agentOutputs[currentAgent.id])}
                      className="absolute top-3 right-3 text-xs rounded-lg px-2 py-1 transition-colors"
                      style={{ background: '#16161a', border: '1px solid #2a2a35', color: '#9ca3af' }}
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* TikTok Ads Paid */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div className="px-5 py-4 flex items-center gap-4" style={{ borderBottom: '1px solid #1e1e24' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.2)', color: '#ec4899' }}>
              <Icon name="tiktok" size={16} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#ec4899', opacity: 0.7 }}>Paid</p>
              <h2 className="text-sm font-semibold text-white">TikTok Ads — Agente Pago</h2>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex gap-3 flex-wrap">
              {[
                { id: 'strategy', label: 'Plan de Lanzamiento', icon: 'rocket' },
                { id: 'optimize', label: 'Optimización Diaria',  icon: 'campaigns' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setTiktokMode(m.id)}
                  className="px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2"
                  style={tiktokMode === m.id
                    ? { background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)', color: '#f9a8d4' }
                    : { background: '#16161a', border: '1px solid #2a2a35', color: '#9ca3af' }
                  }
                >
                  <Icon name={m.icon} size={13} strokeWidth={2} />
                  {m.label}
                </button>
              ))}
              <button
                onClick={runTikTokAds}
                disabled={tiktokLoading}
                className="ml-auto px-5 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg,#db2777,#ec4899)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(236,72,153,0.2)',
                }}
              >
                {tiktokLoading ? 'Ejecutando...' : '▶ Ejecutar'}
              </button>
            </div>

            {tiktokOutput && (
              <div className="relative">
                <pre className="rounded-xl p-4 text-sm whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto"
                  style={{ background: '#0d0d11', border: '1px solid #1e1e24', color: '#d1d5db' }}>
                  {tiktokOutput}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(tiktokOutput)}
                  className="absolute top-3 right-3 text-xs rounded-lg px-2 py-1"
                  style={{ background: '#16161a', border: '1px solid #2a2a35', color: '#9ca3af' }}
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
