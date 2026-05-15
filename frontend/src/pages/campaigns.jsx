'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: '7d',    value: 'last_7d' },
  { label: '14d',   value: 'last_14d' },
  { label: '30d',   value: 'last_30d' },
];

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

const colorMap = {
  green:  { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  text: '#34d399', dot: '#10b981' },
  yellow: { bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.2)',   text: '#fbbf24', dot: '#eab308' },
  red:    { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   text: '#f87171', dot: '#ef4444' },
  blue:   { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)',  text: '#a5b4fc', dot: '#6366f1' },
  gray:   { bg: 'rgba(107,114,128,0.08)',border: 'rgba(107,114,128,0.2)', text: '#9ca3af', dot: '#6b7280' },
};

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

  const roas  = avg('roas');
  const ctr   = avg('ctr');
  const cpm   = avg('cpm');
  const spend = active.reduce((a, c) => a + parseFloat(c.spend || 0), 0);

  return {
    roas:   { value: roas,         color: semaphoreColor(roas, { green: 2, yellow: 1 }),                     label: 'ROAS Prom.' },
    ctr:    { value: ctr,          color: semaphoreColor(ctr,  { green: 1, yellow: 0.5 }),                   label: 'CTR Prom. (%)' },
    cpm:    { value: cpm,          color: semaphoreColor(cpm != null ? 20 - cpm : null, { green: 10, yellow: 0 }), label: 'CPM Prom.' },
    spend:  { value: spend,        color: 'blue',                                                             label: 'Gasto Total' },
    active: { value: active.length,color: 'blue',                                                             label: 'Campañas activas' },
  };
}

function roasColor(roas) {
  const v = parseFloat(roas || 0);
  if (v >= 2) return '#34d399';
  if (v >= 1) return '#fbbf24';
  if (v > 0)  return '#f87171';
  return '#6b7280';
}

function rentabilidadBadge(roas) {
  const v = parseFloat(roas || 0);
  if (v === 0) return { emoji: '⚪', label: 'Sin datos',    bg: 'rgba(107,114,128,0.1)', color: '#9ca3af' };
  if (v >= 2)  return { emoji: '🟢', label: 'Rentable',     bg: 'rgba(16,185,129,0.1)',  color: '#34d399' };
  if (v >= 1)  return { emoji: '🟡', label: 'Break-even',   bg: 'rgba(234,179,8,0.1)',   color: '#fbbf24' };
  return            { emoji: '🔴', label: 'No rentable',   bg: 'rgba(239,68,68,0.1)',   color: '#f87171' };
}

function DailyBarChart({ daily }) {
  if (!daily || daily.length === 0) return null;

  const HEIGHT = 48;
  const BAR_W = 10;
  const GAP   = 3;
  const W     = daily.length * (BAR_W + GAP) - GAP;
  const maxSpend = Math.max(...daily.map((d) => parseFloat(d.spend || 0)), 0.01);

  return (
    <svg width={W} height={HEIGHT} style={{ display: 'block' }}>
      {daily.map((d, i) => {
        const spend = parseFloat(d.spend || 0);
        const roas  = parseFloat(d.roas  || 0);
        const barH  = Math.max(2, (spend / maxSpend) * HEIGHT);
        const x     = i * (BAR_W + GAP);
        const y     = HEIGHT - barH;
        const fill  = roas >= 2 ? '#10b981' : roas >= 1 ? '#eab308' : '#ef4444';
        const tip   = `${d.date}: $${spend.toFixed(2)} | ROAS ${roas.toFixed(2)}x`;
        return (
          <rect key={i} x={x} y={y} width={BAR_W} height={barH} rx={2} fill={fill} opacity={0.85}>
            <title>{tip}</title>
          </rect>
        );
      })}
    </svg>
  );
}

function AdSetRow({ adset, token, onActionDone }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    const action = adset.status === 'ACTIVE' ? 'pause' : 'enable';
    setLoading(true);
    try {
      await fetch(`${API}/adsets/action`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ adset_id: adset.id, action }),
      });
      onActionDone();
    } finally {
      setLoading(false);
    }
  };

  const roas  = parseFloat(adset.roas || 0);
  const badge = rentabilidadBadge(roas);

  return (
    <tr style={{ borderBottom: '1px solid rgba(30,30,36,0.6)' }}>
      <td className="pl-16 pr-4 py-2 font-medium max-w-[180px] truncate" style={{ color: '#d1d5db', fontSize: '0.8rem' }}>
        {adset.name || adset.id}
      </td>
      <td className="px-4 py-2">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
          style={{ background: badge.bg, color: badge.color }}>
          {badge.emoji} {badge.label}
        </span>
      </td>
      <td className="px-4 py-2">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
          style={adset.status === 'ACTIVE'
            ? { background: 'rgba(16,185,129,0.1)', color: '#34d399' }
            : { background: 'rgba(107,114,128,0.1)', color: '#9ca3af' }}>
          {adset.status}
        </span>
      </td>
      <td className="px-4 py-2" style={{ color: '#d1d5db', fontSize: '0.8rem' }}>${parseFloat(adset.spend || 0).toFixed(2)}</td>
      <td className="px-4 py-2 font-bold" style={{ color: roasColor(roas), fontSize: '0.8rem' }}>{roas.toFixed(2)}x</td>
      <td className="px-4 py-2" style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{parseInt(adset.purchases || 0)}</td>
      <td className="px-4 py-2" style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{parseFloat(adset.ctr || 0).toFixed(2)}%</td>
      <td className="px-4 py-2" style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{parseFloat(adset.frequency || 0).toFixed(1)}</td>
      <td className="px-4 py-2">
        <button
          onClick={handleAction}
          disabled={loading}
          className="px-3 py-1 text-xs rounded-lg transition-all disabled:opacity-50"
          style={adset.status === 'ACTIVE'
            ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }
            : { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
          {loading ? '...' : adset.status === 'ACTIVE' ? '⏸ Pausar' : '▶ Activar'}
        </button>
      </td>
    </tr>
  );
}

function ExpandedRow({ campaignId, token, period, expandedData, onAdsetActionDone }) {
  const data  = expandedData[campaignId];
  const colSpan = 9;

  if (!data) {
    return (
      <tr>
        <td colSpan={colSpan} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem 1.5rem', color: '#6b7280', fontSize: '0.8rem' }}>
          Cargando...
        </td>
      </tr>
    );
  }

  if (data.error) {
    return (
      <tr>
        <td colSpan={colSpan} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem 1.5rem', color: '#f87171', fontSize: '0.8rem' }}>
          No se pudieron cargar los conjuntos
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={colSpan} style={{ background: 'rgba(255,255,255,0.02)', padding: 0 }}>
        {/* Daily bar chart strip */}
        {data.daily && data.daily.length > 0 && (
          <div className="flex items-center gap-4 px-6 py-3" style={{ borderBottom: '1px solid rgba(30,30,36,0.6)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>
              14 días
            </span>
            <DailyBarChart daily={data.daily} />
          </div>
        )}

        {/* Ad sets table */}
        {data.adsets && data.adsets.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(30,30,36,0.6)' }}>
                {['Conjunto', 'Rentabilidad', 'Estado', 'Gasto', 'ROAS', 'Compras', 'CTR', 'Frec.', 'Acción'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#4b5563' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.adsets.map((as, i) => (
                <AdSetRow key={as.id || i} adset={as} token={token} onActionDone={onAdsetActionDone} />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-6 py-3" style={{ color: '#6b7280', fontSize: '0.8rem' }}>Sin conjuntos de anuncios</p>
        )}
      </td>
    </tr>
  );
}

export default function CampaignsPage() {
  const { user } = useAuth();

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [period, setPeriod]                 = useState('last_7d');
  const [campaigns, setCampaigns]           = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignError, setCampaignError]   = useState('');
  const [actionLoading, setActionLoading]   = useState({});

  const [expandedIds, setExpandedIds]       = useState(new Set());
  const [expandedData, setExpandedData]     = useState({});

  const [agentTab, setAgentTab]             = useState('optimize');
  const [agentSubTab, setAgentSubTab]       = useState('optimizer');
  const [agentOutputs, setAgentOutputs]     = useState({});
  const [agentLoading, setAgentLoading]     = useState({});

  const [clarityProjectId, setClarityProjectId] = useState('');
  const [clarityInsights, setClarityInsights]   = useState('');
  const [clarityAgentLoading, setClarityAgentLoading] = useState(false);
  const [clarityAgentOutput, setClarityAgentOutput]   = useState('');

  const [tiktokMode, setTiktokMode]         = useState('strategy');
  const [tiktokOutput, setTiktokOutput]     = useState('');
  const [tiktokLoading, setTiktokLoading]   = useState(false);

  const card = {
    background: '#16161a',
    border: '1px solid #1e1e24',
    borderRadius: '1rem',
  };

  const fetchCampaigns = useCallback(async () => {
    if (!token) return;
    setLoadingCampaigns(true);
    setCampaignError('');
    try {
      const res = await fetch(`${API}/campaigns?date_preset=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setCampaignError(err.detail || `Error ${res.status}`);
        return;
      }
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch {
      setCampaignError('No se pudo conectar con Meta Ads. Verificá tu configuración.');
    } finally {
      setLoadingCampaigns(false);
    }
  }, [token, period]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/config`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.clarity_project_id) setClarityProjectId(d.clarity_project_id); })
      .catch(() => {});
  }, [token]);

  const fetchExpandedData = useCallback(async (campaignId) => {
    setExpandedData((prev) => ({ ...prev, [campaignId]: undefined }));
    try {
      const [adsetsRes, dailyRes] = await Promise.all([
        fetch(`${API}/campaigns/${campaignId}/adsets?date_preset=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/campaigns/${campaignId}/daily?days=14`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const adsets = adsetsRes.ok ? await adsetsRes.json() : [];
      const daily  = dailyRes.ok  ? await dailyRes.json()  : [];

      setExpandedData((prev) => ({
        ...prev,
        [campaignId]: {
          adsets: Array.isArray(adsets) ? adsets : [],
          daily:  Array.isArray(daily)  ? daily  : [],
        },
      }));
    } catch {
      setExpandedData((prev) => ({ ...prev, [campaignId]: { error: true } }));
    }
  }, [token, period]);

  const toggleExpand = (campaignId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(campaignId)) {
        next.delete(campaignId);
      } else {
        next.add(campaignId);
        fetchExpandedData(campaignId);
      }
      return next;
    });
  };

  const handleCampaignAction = async (campaignId, currentStatus) => {
    const action = currentStatus === 'ACTIVE' ? 'pause' : 'enable';
    setActionLoading((p) => ({ ...p, [campaignId]: true }));
    try {
      await fetch(`${API}/campaigns/action`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, action }),
      });
      fetchCampaigns();
    } finally {
      setActionLoading((p) => ({ ...p, [campaignId]: false }));
    }
  };

  const allAdsets = Object.values(expandedData)
    .filter(Boolean)
    .flatMap((d) => (!d.error && d.adsets) ? d.adsets : []);

  const runAgent = async (agentId, path) => {
    setAgentLoading((p) => ({ ...p, [agentId]: true }));
    try {
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: '',
          context: {
            campaigns_data: campaigns,
            adsets_data: allAdsets,
            clarity_insights: clarityInsights || undefined,
          },
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

  const runClarityAgent = async () => {
    setClarityAgentLoading(true);
    setClarityAgentOutput('');
    try {
      const res = await fetch(`${API}/agent/optimize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: '',
          context: {
            campaigns_data: campaigns,
            adsets_data: allAdsets,
            clarity_insights: clarityInsights,
          },
        }),
      });
      const data = await res.json();
      setClarityAgentOutput(res.ok ? (data.result || JSON.stringify(data)) : (data.detail || 'Error'));
    } catch (e) {
      setClarityAgentOutput(`Error: ${e.message}`);
    } finally {
      setClarityAgentLoading(false);
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

  const semaphore   = computeSemaphore(campaigns);
  const currentAgent = AGENTS.find((a) => a.id === agentTab);

  return (
    <Layout>
      <div className="space-y-7">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#6366f1' }}>
              Meta Ads · TikTok Ads
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Campañas &amp; Agentes IA</h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Control total del gasto publicitario en tiempo real</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Period chips */}
            <div className="flex gap-1 rounded-xl p-1" style={{ background: '#1e1e24' }}>
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className="px-3 py-1 text-xs font-semibold rounded-lg transition-all"
                  style={period === p.value
                    ? { background: '#6366f1', color: '#fff' }
                    : { color: '#6b7280' }
                  }
                >
                  {p.label}
                </button>
              ))}
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
        </div>

        {/* ── Semaphore ── */}
        {semaphore ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(semaphore).map(([key, { value, color, label }]) => {
              const c = colorMap[color];
              const display = value === null ? '—'
                : key === 'spend'  ? `$${value.toFixed(2)}`
                : key === 'active' ? `${value}`
                : key === 'cpm'    ? `$${value.toFixed(2)}`
                : key === 'roas'   ? `${value.toFixed(2)}x`
                : `${value.toFixed(2)}%`;
              return (
                <div key={key} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '1rem', padding: '1rem' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: c.text, opacity: 0.7 }}>{label}</span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: c.text }}>{display}</div>
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

        {/* ── Campaign Table ── */}
        {campaigns.length > 0 && (
          <div style={{ ...card, overflow: 'hidden' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e1e24' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#6b7280' }}>
                {PERIODS.find((p) => p.value === period)?.label}
              </p>
              <h2 className="text-sm font-semibold text-white">Campañas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e1e24' }}>
                    {['', 'Campaña', 'Rentabilidad', 'Estado', 'Gasto', 'ROAS', 'Compras', 'CTR', 'Frec.', 'Acción'].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => {
                    const roas  = parseFloat(c.roas || 0);
                    const badge = rentabilidadBadge(roas);
                    const isExp = expandedIds.has(c.id);

                    return (
                      <React.Fragment key={c.id || i}>
                        <tr
                          style={{ borderBottom: isExp ? 'none' : '1px solid rgba(30,30,36,0.8)' }}
                          className="transition-colors hover:bg-white/[0.02]"
                        >
                          {/* Expand toggle */}
                          <td className="pl-4 pr-2 py-3">
                            <button
                              onClick={() => toggleExpand(c.id)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all"
                              style={{
                                background: isExp ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                                color: isExp ? '#a5b4fc' : '#6b7280',
                                border: `1px solid ${isExp ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                              }}
                            >
                              {isExp ? '▼' : '▶'}
                            </button>
                          </td>

                          <td className="px-4 py-3 font-medium max-w-[200px] truncate" style={{ color: '#e5e7eb' }}>
                            {c.name || c.id}
                          </td>

                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                              style={{ background: badge.bg, color: badge.color }}>
                              {badge.emoji} {badge.label}
                            </span>
                          </td>

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

                          <td className="px-4 py-3 font-bold" style={{ color: roasColor(roas) }}>
                            {roas.toFixed(2)}x
                          </td>

                          <td className="px-4 py-3" style={{ color: '#d1d5db' }}>{parseInt(c.purchases || 0)}</td>
                          <td className="px-4 py-3" style={{ color: '#d1d5db' }}>{parseFloat(c.ctr || 0).toFixed(2)}%</td>
                          <td className="px-4 py-3" style={{ color: '#d1d5db' }}>{parseFloat(c.frequency || 0).toFixed(1)}</td>

                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleCampaignAction(c.id, c.status)}
                              disabled={!!actionLoading[c.id]}
                              className="px-3 py-1 text-xs rounded-lg transition-all disabled:opacity-50"
                              style={c.status === 'ACTIVE'
                                ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }
                                : { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }
                              }>
                              {actionLoading[c.id] ? '...' : c.status === 'ACTIVE' ? '⏸ Pausar' : '▶ Activar'}
                            </button>
                          </td>
                        </tr>

                        {isExp && (
                          <ExpandedRow
                            campaignId={c.id}
                            token={token}
                            period={period}
                            expandedData={expandedData}
                            onAdsetActionDone={fetchCampaigns}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AI Agents Section ── */}
        <div style={{ ...card, overflow: 'hidden' }}>
          {/* Section header with Optimizador / Clarity sub-tabs */}
          <div className="flex items-center gap-6 px-5 py-4" style={{ borderBottom: '1px solid #1e1e24' }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#6366f1', opacity: 0.7 }}>IA</p>
              <h2 className="text-sm font-semibold text-white">Agentes IA</h2>
            </div>
            <div className="flex gap-1 ml-auto rounded-xl p-1" style={{ background: '#1e1e24' }}>
              {[{ id: 'optimizer', label: 'Optimizador' }, { id: 'clarity', label: 'Clarity' }].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAgentSubTab(t.id)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
                  style={agentSubTab === t.id
                    ? { background: '#6366f1', color: '#fff' }
                    : { color: '#6b7280' }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {agentSubTab === 'optimizer' && (
            <>
              {/* Agent type tabs */}
              <div className="overflow-x-auto" style={{ borderBottom: '1px solid #1e1e24' }}>
                <div className="flex min-w-max">
                  {AGENTS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAgentTab(a.id)}
                      className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2"
                      style={agentTab === a.id
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
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <Icon name={currentAgent.icon} size={15} strokeWidth={2} style={{ color: '#a5b4fc' }} />
                          {currentAgent.label}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{currentAgent.desc}</p>
                        {clarityInsights && (
                          <p className="text-xs mt-1" style={{ color: '#fbbf24' }}>
                            ✓ Insights de Clarity incluidos en el contexto
                          </p>
                        )}
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
            </>
          )}

          {agentSubTab === 'clarity' && (
            <div className="p-6 space-y-5">
              {/* Clarity card */}
              <div className="rounded-xl p-5 space-y-4" style={{ background: '#1a1a21', border: '1px solid #1e1e24' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">Microsoft Clarity</h3>
                    <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                      Analizá el comportamiento de usuarios en tu sitio y combinalo con los datos de campañas para obtener insights accionables.
                    </p>
                  </div>
                  {clarityProjectId && (
                    <a
                      href={`https://app.clarity.ms/projects/id/${clarityProjectId}/dashboard`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap"
                      style={{
                        background: 'rgba(99,102,241,0.12)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(99,102,241,0.25)',
                      }}
                    >
                      Abrir Clarity Dashboard →
                    </a>
                  )}
                </div>

                <textarea
                  value={clarityInsights}
                  onChange={(e) => setClarityInsights(e.target.value)}
                  rows={5}
                  placeholder="Ej: 40% de los usuarios hace clic en el botón pero no completa el checkout..."
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none transition-colors"
                  style={{
                    background: '#0d0d11',
                    border: '1px solid #2a2a35',
                    color: '#e5e7eb',
                    outline: 'none',
                  }}
                />

                <div className="flex items-center gap-3">
                  <button
                    onClick={runClarityAgent}
                    disabled={clarityAgentLoading || !clarityInsights.trim()}
                    className="px-5 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                      color: 'white',
                      boxShadow: '0 4px 15px rgba(99,102,241,0.25)',
                    }}
                  >
                    {clarityAgentLoading ? 'Analizando...' : '▶ Enviar insights al Optimizador'}
                  </button>
                  {clarityInsights && !clarityAgentLoading && (
                    <span className="text-xs" style={{ color: '#6b7280' }}>
                      Los insights también se incluyen al ejecutar cualquier agente del tab Optimizador
                    </span>
                  )}
                </div>
              </div>

              {clarityAgentOutput && (
                <div className="relative">
                  <pre className="rounded-xl p-4 text-sm whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto leading-relaxed"
                    style={{ background: '#0d0d11', border: '1px solid #1e1e24', color: '#d1d5db' }}>
                    {clarityAgentOutput}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(clarityAgentOutput)}
                    className="absolute top-3 right-3 text-xs rounded-lg px-2 py-1"
                    style={{ background: '#16161a', border: '1px solid #2a2a35', color: '#9ca3af' }}
                  >
                    Copiar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── TikTok Ads Paid ── */}
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
