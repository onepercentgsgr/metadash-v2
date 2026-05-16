'use client';

import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icons';
import { api } from '../lib/api';

const SECTIONS_META = [
  { key: 'campaigns', title: 'Análisis de Campañas',        icon: 'campaigns', accent: '#6366f1' },
  { key: 'creatives', title: 'Rendimiento Creativo',         icon: 'videos',    accent: '#ec4899' },
  { key: 'landing',   title: 'Auditoría de Landing Page',    icon: 'audit',     accent: '#0ea5e9' },
  { key: 'finance',   title: 'Análisis Financiero',          icon: 'financials',accent: '#10b981' },
  { key: 'scripts',   title: 'Guiones Sugeridos',            icon: 'tiktok',    accent: '#8b5cf6' },
  { key: 'synthesis', title: 'Síntesis CEO — Plan de Acción',icon: 'crown',     accent: '#f59e0b' },
];

function AuditSection({ title, icon, accent, content, status }) {
  const [expanded, setExpanded] = useState(true);

  const statusConfig = {
    done:    { label: 'Completado', bg: 'rgba(16,185,129,0.1)',  color: '#34d399', border: 'rgba(16,185,129,0.25)' },
    running: { label: 'Analizando…',bg: 'rgba(234,179,8,0.1)',  color: '#fbbf24', border: 'rgba(234,179,8,0.25)' },
    error:   { label: 'Error',      bg: 'rgba(239,68,68,0.1)',  color: '#f87171', border: 'rgba(239,68,68,0.25)' },
    pending: { label: 'Pendiente',  bg: 'rgba(107,114,128,0.1)',color: '#9ca3af', border: 'rgba(107,114,128,0.25)' },
  };
  const sc = statusConfig[status] || statusConfig.pending;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent}18`, border: `1px solid ${accent}30`, color: accent }}>
            <Icon name={icon} size={16} strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {status && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
              {sc.label}
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: '#6b7280' }}>{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && content && (
        <div className="px-5 pb-5" style={{ borderTop: '1px solid #1e1e24' }}>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#d1d5db' }}>
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

function CompetitorComparator() {
  const [urlOwn, setUrlOwn] = useState('');
  const [urlCompetitor, setUrlCompetitor] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function runComparison() {
    if (!urlOwn.trim() || !urlCompetitor.trim()) {
      setError('Ingresá ambas URLs para comparar');
      return;
    }
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const data = await api.compareLandings(urlOwn.trim(), urlCompetitor.trim());
      setResult(typeof data === 'string' ? data : data?.result || JSON.stringify(data));
    } catch (err) {
      setError(err.message || 'Error al comparar landings');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Info card */}
      <div className="rounded-2xl p-5" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', color: '#ec4899' }}>
            <Icon name="spy" size={18} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white mb-1">¿Cómo funciona?</h2>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              El agente extrae y analiza ambas landings. Te dice exactamente qué hace mejor el competidor,
              qué ventajas tenés vos, los 3 gaps que más afectan tu conversión,
              y genera 3 prompts listos para reescribir las secciones más débiles.
            </p>
          </div>
        </div>
      </div>

      {/* URL inputs */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#9ca3af' }}>
            Tu landing page
          </label>
          <input
            type="url"
            value={urlOwn}
            onChange={e => setUrlOwn(e.target.value)}
            placeholder="https://tu-producto.com"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
            style={{ background: '#0d0d11', border: '1px solid #2a2a35' }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#9ca3af' }}>
            Landing del competidor
          </label>
          <input
            type="url"
            value={urlCompetitor}
            onChange={e => setUrlCompetitor(e.target.value)}
            placeholder="https://competidor.com"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
            style={{ background: '#0d0d11', border: '1px solid #2a2a35' }}
          />
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
          </div>
        )}

        <button
          onClick={runComparison}
          disabled={running}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          style={running ? {
            background: '#1e1e24',
            color: '#6b7280',
            border: '1px solid #2a2a35',
          } : {
            background: 'linear-gradient(135deg,#db2777,#9333ea)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(219,39,119,0.3)',
          }}
        >
          {running ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Comparando landings… puede tomar 30–60 seg
            </span>
          ) : (
            '⚔️ Comparar contra competidor'
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
          <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #1e1e24' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
            <span className="text-sm font-bold text-white">Comparación completada</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ml-auto"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
              Completado
            </span>
          </div>
          <div className="px-5 py-5">
            <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#d1d5db' }}>
              {result}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState('full');
  const [running, setRunning]     = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [error, setError]         = useState('');
  const [progress, setProgress]   = useState(0);
  const [sections, setSections]   = useState({
    campaigns: { status: 'pending', data: null },
    creatives: { status: 'pending', data: null },
    landing:   { status: 'pending', data: null },
    finance:   { status: 'pending', data: null },
    scripts:   { status: 'pending', data: null },
    synthesis: { status: 'pending', data: null },
  });

  async function runFullAudit() {
    setRunning(true);
    setError('');
    setAuditResult(null);
    setProgress(0);

    setSections({
      campaigns: { status: 'running', data: null },
      creatives: { status: 'pending', data: null },
      landing:   { status: 'pending', data: null },
      finance:   { status: 'pending', data: null },
      scripts:   { status: 'pending', data: null },
      synthesis: { status: 'pending', data: null },
    });

    try {
      const steps = [
        { key: 'campaigns', fn: () => api.runOptimizer() },
        { key: 'creatives', fn: () => api.runCreatives() },
        { key: 'landing',   fn: () => api.runLandingAudit({}) },
        { key: 'finance',   fn: () => api.runFinance({ prompt: 'Analiza el estado financiero completo' }) },
        { key: 'scripts',   fn: () => api.runScripts({ prompt: 'Genera 3 guiones basados en los datos disponibles' }) },
      ];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setSections(prev => ({ ...prev, [step.key]: { status: 'running', data: null } }));
        try {
          const result = await step.fn();
          setSections(prev => ({
            ...prev,
            [step.key]: { status: 'done', data: typeof result === 'string' ? result : JSON.stringify(result, null, 2) },
          }));
        } catch (err) {
          setSections(prev => ({ ...prev, [step.key]: { status: 'error', data: `Error: ${err.message}` } }));
        }
        setProgress(Math.round(((i + 1) / (steps.length + 1)) * 100));
      }

      setSections(prev => ({ ...prev, synthesis: { status: 'running', data: null } }));
      try {
        const synthesis = await api.runFullAudit();
        setSections(prev => ({
          ...prev,
          synthesis: { status: 'done', data: typeof synthesis === 'string' ? synthesis : JSON.stringify(synthesis, null, 2) },
        }));
        setAuditResult(synthesis);
      } catch (err) {
        setSections(prev => ({ ...prev, synthesis: { status: 'error', data: `Error en síntesis: ${err.message}` } }));
      }

      setProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  const hasSectionData = Object.values(sections).some(s => s.data || s.status !== 'pending');

  const tabs = [
    { id: 'full', label: 'Auditoría Completa', icon: 'audit' },
    { id: 'competitor', label: 'Comparar vs Competidor', icon: 'spy' },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-7">

        {/* Header */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#6366f1' }}>
            Análisis inteligente
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Auditoría</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Análisis integral de tu negocio o comparación directa contra tu competidor
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all"
              style={activeTab === tab.id ? {
                background: tab.id === 'competitor'
                  ? 'linear-gradient(135deg,#db2777,#9333ea)'
                  : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                color: 'white',
                boxShadow: `0 2px 12px ${tab.id === 'competitor' ? 'rgba(219,39,119,0.3)' : 'rgba(99,102,241,0.3)'}`,
              } : {
                color: '#6b7280',
              }}
            >
              <Icon name={tab.icon} size={14} strokeWidth={2} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Full Audit Tab */}
        {activeTab === 'full' && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: '#6b7280' }}>
                  6 agentes especializados · Análisis completo de cuenta
                </p>
              </div>
              <button
                onClick={runFullAudit}
                disabled={running}
                className="px-5 py-2.5 rounded-xl font-semibold transition-all text-sm disabled:opacity-50"
                style={running ? {
                  background: '#1e1e24',
                  color: '#6b7280',
                  border: '1px solid #2a2a35',
                } : {
                  background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                }}
              >
                {running ? 'Ejecutando auditoría...' : '▶ Ejecutar Auditoría Completa'}
              </button>
            </div>

            {/* Progress Bar */}
            {running && (
              <div className="rounded-2xl p-5" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6366f1' }} />
                    <span className="text-sm font-medium text-white">Auditoría en progreso</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#a5b4fc' }}>{progress}%</span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: '#1e1e24' }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
                      boxShadow: '0 0 8px rgba(99,102,241,0.5)',
                    }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                  Los agentes están analizando tu cuenta. Esto puede tomar 1–2 minutos.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!running && !hasSectionData && (
              <div className="rounded-2xl p-8 text-center" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1' }}>
                  <Icon name="audit" size={28} strokeWidth={1.5} />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">¿Cómo funciona?</h2>
                <p className="text-sm max-w-xl mx-auto mb-6" style={{ color: '#9ca3af' }}>
                  La auditoría ejecuta 6 agentes especializados en secuencia. Cada uno analiza un aspecto diferente
                  de tu negocio y al final un agente CEO sintetiza todo en un plan de acción priorizado.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-xl mx-auto mb-6">
                  {SECTIONS_META.map(s => (
                    <div key={s.key} className="flex items-center gap-2 p-3 rounded-xl"
                      style={{ background: '#0d0d11', border: '1px solid #1e1e24' }}>
                      <span style={{ color: s.accent }}><Icon name={s.icon} size={14} strokeWidth={2} /></span>
                      <span className="text-xs font-medium" style={{ color: '#d1d5db' }}>{s.title.split(' — ')[0]}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-4 max-w-md mx-auto"
                  style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)' }}>
                  <p className="text-xs" style={{ color: '#fcd34d' }}>
                    Asegurate de tener configuradas las APIs en{' '}
                    <a href="/settings" style={{ textDecoration: 'underline' }}>Configuración</a>
                    {' '}antes de ejecutar la auditoría.
                  </p>
                </div>
              </div>
            )}

            {/* Audit Sections */}
            {hasSectionData && (
              <div className="space-y-3">
                {SECTIONS_META.map(s => (
                  <AuditSection
                    key={s.key}
                    title={s.title}
                    icon={s.icon}
                    accent={s.accent}
                    content={sections[s.key].data}
                    status={sections[s.key].status}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Competitor Comparator Tab */}
        {activeTab === 'competitor' && <CompetitorComparator />}
      </div>
    </Layout>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
