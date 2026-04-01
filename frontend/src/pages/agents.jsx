'use client';

import { useState } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { api } from '../lib/api';

const AGENTS = [
  {
    id: 'advisor',
    name: 'Asesor de Crecimiento',
    icon: '👨‍💼',
    description: 'Estrategia de crecimiento y consejos sobre monetización',
    color: 'indigo',
    endpoint: 'growth',
    hasInput: true,
  },
  {
    id: 'optimizer',
    name: 'Optimizador de Campañas',
    icon: '⚡',
    description: 'Analiza tus campañas y sugiere optimizaciones',
    color: 'yellow',
    endpoint: 'optimize',
    hasInput: false,
  },
  {
    id: 'creative_director',
    name: 'Director Creativo',
    icon: '🎨',
    description: 'Ideas para creatividades y análisis de ads',
    color: 'pink',
    endpoint: 'creatives',
    hasInput: true,
  },
  {
    id: 'script_gen',
    name: 'Generador de Guiones',
    icon: '✍️',
    description: 'Crea guiones para videos y contenido',
    color: 'purple',
    endpoint: 'scripts',
    hasInput: true,
  },
  {
    id: 'finance',
    name: 'Analista Financiero',
    icon: '💰',
    description: 'Análisis de márgenes y predicciones financieras',
    color: 'green',
    endpoint: 'finance',
    hasInput: true,
  },
  {
    id: 'landing_auditor',
    name: 'Auditor de Landing Page',
    icon: '🔍',
    description: 'Revisa tu landing y sugiere mejoras de conversión',
    color: 'blue',
    endpoint: 'landing-audit',
    hasInput: false,
  },
];

const colorClasses = {
  indigo: 'border-indigo-700 bg-indigo-950/20 text-indigo-300',
  yellow: 'border-yellow-700 bg-yellow-950/20 text-yellow-300',
  pink: 'border-pink-700 bg-pink-950/20 text-pink-300',
  purple: 'border-purple-700 bg-purple-950/20 text-purple-300',
  green: 'border-green-700 bg-green-950/20 text-green-300',
  blue: 'border-blue-700 bg-blue-950/20 text-blue-300',
};

const buttonClasses = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700',
  yellow: 'bg-yellow-600 hover:bg-yellow-700',
  pink: 'bg-pink-600 hover:bg-pink-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
  green: 'bg-green-600 hover:bg-green-700',
  blue: 'bg-blue-600 hover:bg-blue-700',
};

export default function AgentsPage() {
  const [prompts, setPrompts] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  function setAgentLoading(agentId, val) {
    setLoading((prev) => ({ ...prev, [agentId]: val }));
  }

  function setAgentError(agentId, msg) {
    setErrors((prev) => ({ ...prev, [agentId]: msg }));
  }

  function setAgentResult(agentId, result) {
    setResults((prev) => ({ ...prev, [agentId]: result }));
  }

  async function runAgent(agent) {
    setAgentError(agent.id, '');
    setAgentLoading(agent.id, true);

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

      setAgentResult(agent.id, result);
    } catch (err) {
      setAgentError(agent.id, err.message);
    } finally {
      setAgentLoading(agent.id, false);
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🤖 Agentes IA</h1>
          <p className="text-gray-400">
            Elige un agente especializado para analizar tu negocio y obtener recomendaciones
          </p>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AGENTS.map((agent) => {
            const isLoading = loading[agent.id];
            const hasResult = results[agent.id];
            const agentError = errors[agent.id];
            const prompt = prompts[agent.id] || '';

            return (
              <div
                key={agent.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 hover:border-gray-700 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{agent.icon}</span>
                      <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400">{agent.description}</p>
                  </div>
                </div>

                {/* Input */}
                {agent.hasInput && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Instrucción</label>
                    <textarea
                      value={prompt}
                      onChange={(e) =>
                        setPrompts((prev) => ({
                          ...prev,
                          [agent.id]: e.target.value,
                        }))
                      }
                      placeholder="Describe qué quieres que analice..."
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Error */}
                {agentError && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                    <p className="text-red-200 text-xs">{agentError}</p>
                  </div>
                )}

                {/* Result */}
                {hasResult && (
                  <div className={`border rounded-lg p-3 text-xs ${colorClasses[agent.color]}`}>
                    <p className="font-semibold mb-2">Resultado:</p>
                    <div className="whitespace-pre-wrap text-gray-200 max-h-40 overflow-y-auto">
                      {typeof hasResult === 'string'
                        ? hasResult
                        : JSON.stringify(hasResult, null, 2)}
                    </div>
                  </div>
                )}

                {/* Button */}
                <button
                  onClick={() => runAgent(agent)}
                  disabled={isLoading}
                  className={`w-full ${buttonClasses[agent.color]} disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors text-sm`}
                >
                  {isLoading ? 'Analizando...' : '▶️ Ejecutar'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">💡 Cómo usar los agentes</h3>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li>Configura tus claves API en Configuración antes de usar los agentes</li>
            <li>Algunos agentes requieren información previa (landing page, tokens, etc.)</li>
            <li>Los resultados se muestran inmediatamente después del análisis</li>
            <li>Puedes ejecutar múltiples agentes en paralelo</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
