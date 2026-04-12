'use client';

import { useState } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { api } from '../lib/api';

const AGENTS = [
  {
    id: 'optimizer',
    name: 'Optimizador de Campañas',
    icon: '⚡',
    description: 'Analiza campañas activas y detecta automáticamente qué pausar, escalar o ajustar',
    color: 'amber',
    endpoint: 'optimize',
    hasInput: false,
    tag: 'Auto',
    examples: ['Detecta CPA alto', 'Identifica fatiga creativa', 'Sugiere escalamiento'],
  },
  {
    id: 'advisor',
    name: 'Asesor de Crecimiento',
    icon: '📈',
    description: 'Estrategia de crecimiento personalizada basada en tus datos y objetivos',
    color: 'indigo',
    endpoint: 'growth',
    hasInput: true,
    tag: 'Estrategia',
    placeholder: 'Ej: "Quiero escalar de $5k a $15k/mes en ad spend manteniendo ROAS > 2x"',
    examples: ['Plan de escalamiento', 'Estructura de campañas', 'Estrategia CBO vs ABO'],
  },
  {
    id: 'creative_director',
    name: 'Director Creativo',
    icon: '🎨',
    description: 'Analiza el rendimiento de tus creativos e identifica qué funciona y qué rotar',
    color: 'pink',
    endpoint: 'creatives',
    hasInput: false,
    tag: 'Auto',
    examples: ['Hook rate analysis', 'Fatiga creativa', 'Nuevas direcciones'],
  },
  {
    id: 'script_gen',
    name: 'Generador de Guiones',
    icon: '✍️',
    description: 'Crea guiones de video ads con ángulos de dolor, aspiración y prueba social',
    color: 'purple',
    endpoint: 'scripts',
    hasInput: true,
    tag: 'Creativo',
    placeholder: 'Ej: "Necesito 3 guiones para un producto de skincare, público mujeres 25-40"',
    examples: ['Ángulo dolor', 'Ángulo aspiracional', 'Ángulo social proof'],
  },
  {
    id: 'finance',
    name: 'Analista Financiero',
    icon: '💰',
    description: 'Análisis de márgenes, MER, breakeven ROAS y proyecciones a 30 días',
    color: 'emerald',
    endpoint: 'finance',
    hasInput: true,
    tag: 'Finanzas',
    placeholder: 'Ej: "Analiza si puedo aumentar ad spend 30% sin perder margen"',
    examples: ['MER y ROAS', 'Breakeven analysis', 'Proyección 30 días'],
  },
  {
    id: 'landing_auditor',
    name: 'Auditor de Landing Page',
    icon: '🌐',
    description: 'Audita tu landing page para CRO: headlines, CTAs, fricción, trust signals',
    color: 'sky',
    endpoint: 'landing-audit',
    hasInput: false,
    tag: 'CRO',
    examples: ['Puntos de fricción', 'Copy persuasivo', 'Trust signals'],
  },
  {
    id: 'analytics',
    name: 'Google Analytics Advisor',
    icon: '📊',
    description: 'Analiza tráfico, conversiones, fuentes y comportamiento de usuarios con datos reales de GA4',
    color: 'blue',
    endpoint: 'analytics',
    hasInput: false,
    tag: 'Analytics',
    examples: ['Fuentes de tráfico', 'Bounce rate', 'Correlación Meta ↔ GA4'],
  },
];

const colorMap = {
  amber: {
    card: 'hover:border-amber-700/50',
    tag: 'bg-amber-900/30 text-amber-300 border-amber-700/30',
    button: 'bg-amber-600 hover:bg-amber-500',
    result: 'border-amber-700/40 bg-amber-950/20',
    icon: 'bg-amber-900/30',
  },
  indigo: {
    card: 'hover:border-indigo-700/50',
    tag: 'bg-indigo-900/30 text-indigo-300 border-indigo-700/30',
    button: 'bg-indigo-600 hover:bg-indigo-500',
    result: 'border-indigo-700/40 bg-indigo-950/20',
    icon: 'bg-indigo-900/30',
  },
  pink: {
    card: 'hover:border-pink-700/50',
    tag: 'bg-pink-900/30 text-pink-300 border-pink-700/30',
    button: 'bg-pink-600 hover:bg-pink-500',
    result: 'border-pink-700/40 bg-pink-950/20',
    icon: 'bg-pink-900/30',
  },
  purple: {
    card: 'hover:border-purple-700/50',
    tag: 'bg-purple-900/30 text-purple-300 border-purple-700/30',
    button: 'bg-purple-600 hover:bg-purple-500',
    result: 'border-purple-700/40 bg-purple-950/20',
    icon: 'bg-purple-900/30',
  },
  emerald: {
    card: 'hover:border-emerald-700/50',
    tag: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/30',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    result: 'border-emerald-700/40 bg-emerald-950/20',
    icon: 'bg-emerald-900/30',
  },
  sky: {
    card: 'hover:border-sky-700/50',
    tag: 'bg-sky-900/30 text-sky-300 border-sky-700/30',
    button: 'bg-sky-600 hover:bg-sky-500',
    result: 'border-sky-700/40 bg-sky-950/20',
    icon: 'bg-sky-900/30',
  },
  blue: {
    card: 'hover:border-blue-700/50',
    tag: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
    button: 'bg-blue-600 hover:bg-blue-500',
    result: 'border-blue-700/40 bg-blue-950/20',
    icon: 'bg-blue-900/30',
  },
};

export default function AgentsPage() {
  const [prompts, setPrompts] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [expandedResult, setExpandedResult] = useState(null);

  async function runAgent(agent) {
    setErrors(prev => ({ ...prev, [agent.id]: '' }));
    setLoading(prev => ({ ...prev, [agent.id]: true }));

    try {
      const prompt = prompts[agent.id] || '';
      let result;

      switch (agent.endpoint) {
        case 'optimize':
          result = await api.runOptimizer();
          break;
        case 'growth':
          result = await api.runGrowth({ prompt });
          break;
        case 'creatives':
          result = await api.runCreatives();
          break;
        case 'scripts':
          result = await api.runScripts({ prompt });
          break;
        case 'finance':
          result = await api.runFinance({ prompt });
          break;
        case 'landing-audit':
          result = await api.runLandingAudit({ prompt });
          break;
        default:
          throw new Error('Agente no disponible');
      }

      setResults(prev => ({ ...prev, [agent.id]: result }));
      setExpandedResult(agent.id);
    } catch (err) {
      setErrors(prev => ({ ...prev, [agent.id]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [agent.id]: false }));
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Agentes IA</h1>
            <p className="text-gray-400 mt-1">
              6 agentes especializados para analizar y optimizar tu negocio
            </p>
          </div>
          <a
            href="/audit"
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-indigo-900/20"
          >
            Ejecutar Auditoría Completa
          </a>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AGENTS.map((agent) => {
            const isLoading = loading[agent.id];
            const hasResult = results[agent.id];
            const agentError = errors[agent.id];
            const prompt = prompts[agent.id] || '';
            const colors = colorMap[agent.color];
            const isExpanded = expandedResult === agent.id;

            return (
              <div
                key={agent.id}
                className={`bg-gray-900/80 border border-gray-800 rounded-xl transition-all ${colors.card} ${
                  hasResult ? 'md:col-span-2' : ''
                }`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${colors.icon}`}>
                        {agent.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-white">{agent.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors.tag}`}>
                            {agent.tag}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">{agent.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {agent.examples.map((ex, i) => (
                      <span key={i} className="text-[11px] px-2 py-1 bg-gray-800/60 text-gray-400 rounded-md">
                        {ex}
                      </span>
                    ))}
                  </div>

                  {/* Input */}
                  {agent.hasInput && (
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompts(prev => ({ ...prev, [agent.id]: e.target.value }))}
                      placeholder={agent.placeholder || 'Describe qué quieres que analice...'}
                      rows={2}
                      className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 mb-3 resize-none"
                    />
                  )}

                  {/* Error */}
                  {agentError && (
                    <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 mb-3">
                      <p className="text-red-300 text-xs">{agentError}</p>
                    </div>
                  )}

                  {/* Button */}
                  <button
                    onClick={() => runAgent(agent)}
                    disabled={isLoading}
                    className={`w-full ${colors.button} disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-all text-sm flex items-center justify-center gap-2`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Analizando...
                      </>
                    ) : (
                      <>Ejecutar</>
                    )}
                  </button>
                </div>

                {/* Result */}
                {hasResult && (
                  <div className={`border-t ${colors.result} rounded-b-xl`}>
                    <button
                      onClick={() => setExpandedResult(isExpanded ? null : agent.id)}
                      className="w-full flex items-center justify-between px-5 py-3 text-sm"
                    >
                      <span className="font-medium text-gray-300">Resultado del análisis</span>
                      <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5">
                        <div className="bg-gray-950/60 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-sans">
                            {typeof hasResult === 'string' ? hasResult : JSON.stringify(hasResult, null, 2)}
                          </pre>
                        </div>
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
