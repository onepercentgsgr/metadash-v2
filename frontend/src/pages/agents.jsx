'use client';

import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icons';
import { api } from '../lib/api';

const AGENTS = [
  { id: 'optimizer',      name: 'Optimizador de Campañas', icon: 'campaigns', description: 'Detecta qué pausar, escalar o ajustar en tus campañas activas',     accent: '#f59e0b', endpoint: 'optimize',     hasInput: false, tag: 'Auto',      examples: ['Detecta CPA alto', 'Fatiga creativa', 'Escalamiento'] },
  { id: 'advisor',        name: 'Asesor de Crecimiento',   icon: 'financials', description: 'Estrategia de crecimiento personalizada basada en tus datos',       accent: '#6366f1', endpoint: 'growth',       hasInput: true,  tag: 'Estrategia', examples: ['Plan de escalamiento', 'CBO vs ABO', 'Estructura'], placeholder: 'Ej: "Quiero escalar de $5k a $15k/mes manteniendo ROAS > 2x"' },
  { id: 'creative_dir',   name: 'Director Creativo',       icon: 'videos',    description: 'Analiza creativos e identifica qué funciona y qué rotar',             accent: '#ec4899', endpoint: 'creatives',    hasInput: false, tag: 'Auto',      examples: ['Hook rate', 'Fatiga', 'Nuevas dir.'] },
  { id: 'script_gen',     name: 'Generador de Guiones',    icon: 'tiktok',    description: 'Guiones de video ads con ángulos de dolor, aspiración y social proof', accent: '#8b5cf6', endpoint: 'scripts',     hasInput: true,  tag: 'Creativo',  examples: ['Ángulo dolor', 'Aspiracional', 'Social proof'], placeholder: 'Ej: "3 guiones para skincare, mujeres 25-40"' },
  { id: 'finance',        name: 'Analista Financiero',     icon: 'financials', description: 'MER, breakeven ROAS, márgenes y proyecciones a 30 días',            accent: '#10b981', endpoint: 'finance',      hasInput: true,  tag: 'Finanzas',  examples: ['MER y ROAS', 'Breakeven', 'Proyección 30d'], placeholder: 'Ej: "¿Puedo aumentar ad spend 30% sin perder margen?"' },
  { id: 'landing_audit',  name: 'Auditor de Landing',      icon: 'audit',     description: 'CRO: headlines, CTAs, puntos de fricción y trust signals',            accent: '#0ea5e9', endpoint: 'landing-audit',hasInput: false, tag: 'CRO',       examples: ['Fricción', 'Copy', 'Trust signals'] },
  { id: 'analytics',      name: 'Analytics Advisor',       icon: 'dashboard', description: 'Analiza tráfico, conversiones y comportamiento con datos de GA4',     accent: '#3b82f6', endpoint: 'analytics',   hasInput: false, tag: 'Analytics', examples: ['Fuentes', 'Bounce rate', 'Meta ↔ GA4'] },
];

export default function AgentsPage() {
  const [prompts, setPrompts]   = useState({});
  const [results, setResults]   = useState({});
  const [loading, setLoading]   = useState({});
  const [errors, setErrors]     = useState({});
  const [expanded, setExpanded] = useState(null);

  async function run(agent) {
    setErrors(p => ({ ...p, [agent.id]: '' }));
    setLoading(p => ({ ...p, [agent.id]: true }));
    try {
      const prompt = prompts[agent.id] || '';
      let result;
      switch (agent.endpoint) {
        case 'optimize':      result = await api.runOptimizer();               break;
        case 'growth':        result = await api.runGrowth({ prompt });        break;
        case 'creatives':     result = await api.runCreatives();               break;
        case 'scripts':       result = await api.runScripts({ prompt });       break;
        case 'finance':       result = await api.runFinance({ prompt });       break;
        case 'landing-audit': result = await api.runLandingAudit({ prompt });  break;
        default: throw new Error('Agente no disponible');
      }
      setResults(p => ({ ...p, [agent.id]: result }));
      setExpanded(agent.id);
    } catch (err) {
      setErrors(p => ({ ...p, [agent.id]: err.message }));
    } finally {
      setLoading(p => ({ ...p, [agent.id]: false }));
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5"
              style={{ color: 'rgba(255,255,255,0.25)' }}>Inteligencia Artificial</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Agentes IA</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
              7 agentes especializados para optimizar tu negocio
            </p>
          </div>
          <a href="/audit"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
            }}>
            <Icon name="audit" size={14} strokeWidth={2} />
            Auditoría Completa
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENTS.map((agent) => {
            const isLoading  = loading[agent.id];
            const hasResult  = results[agent.id];
            const agentError = errors[agent.id];
            const isExpanded = expanded === agent.id;

            return (
              <div key={agent.id}
                className={`rounded-2xl overflow-hidden transition-all duration-150 ${hasResult ? 'md:col-span-2' : ''}`}
                style={{
                  background: '#16161a',
                  border: isExpanded ? `1px solid ${agent.accent}30` : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: isExpanded ? `0 0 0 1px ${agent.accent}15, 0 8px 32px rgba(0,0,0,0.5)` : '0 1px 3px rgba(0,0,0,0.3)',
                }}
              >
                <div className="p-5">
                  {/* Card header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${agent.accent}15`, border: `1px solid ${agent.accent}25`, color: agent.accent }}>
                      <Icon name={agent.icon} size={17} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h3 className="text-sm font-bold text-white tracking-tight">{agent.name}</h3>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                          style={{ background: `${agent.accent}18`, color: agent.accent, border: `1px solid ${agent.accent}30` }}>
                          {agent.tag}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {agent.examples.map((ex, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded-md font-medium"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {ex}
                      </span>
                    ))}
                  </div>

                  {/* Input */}
                  {agent.hasInput && (
                    <textarea
                      value={prompts[agent.id] || ''}
                      onChange={(e) => setPrompts(p => ({ ...p, [agent.id]: e.target.value }))}
                      placeholder={agent.placeholder}
                      rows={2}
                      className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none mb-3 resize-none"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white',
                        fontFamily: 'inherit',
                      }}
                    />
                  )}

                  {/* Error */}
                  {agentError && (
                    <div className="rounded-xl p-3 mb-3 text-xs"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                      {agentError}
                    </div>
                  )}

                  {/* CTA */}
                  <button onClick={() => run(agent)} disabled={isLoading}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: `${agent.accent}18`, color: agent.accent, border: `1px solid ${agent.accent}30` }}
                    onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = `${agent.accent}28`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${agent.accent}18`; }}
                  >
                    {isLoading ? (
                      <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />Analizando...</>
                    ) : (
                      <><Icon name={agent.icon} size={14} strokeWidth={2} />Ejecutar {agent.name}</>
                    )}
                  </button>
                </div>

                {/* Result panel */}
                {hasResult && (
                  <div style={{ borderTop: `1px solid ${agent.accent}18`, background: `${agent.accent}06` }}>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : agent.id)}
                      className="w-full flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.accent }} />
                        <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          Resultado del análisis
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5">
                        <pre className="rounded-xl p-4 max-h-[500px] overflow-y-auto text-sm leading-relaxed font-sans whitespace-pre-wrap"
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)' }}>
                          {typeof hasResult === 'string' ? hasResult : JSON.stringify(hasResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
