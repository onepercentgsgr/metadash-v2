'use client';

import { useState } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { api } from '../lib/api';

function AuditSection({ title, icon, content, status }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {status && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              status === 'done' ? 'bg-green-900/50 text-green-300' :
              status === 'running' ? 'bg-yellow-900/50 text-yellow-300' :
              status === 'error' ? 'bg-red-900/50 text-red-300' :
              'bg-gray-700/50 text-gray-400'
            }`}>
              {status === 'done' ? 'Completado' :
               status === 'running' ? 'Analizando...' :
               status === 'error' ? 'Error' : 'Pendiente'}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && content && (
        <div className="px-5 pb-5 border-t border-gray-800/50">
          <div className="prose prose-invert prose-sm max-w-none mt-4 whitespace-pre-wrap text-gray-300 leading-relaxed">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const [running, setRunning] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [sections, setSections] = useState({
    campaigns: { status: 'pending', data: null },
    creatives: { status: 'pending', data: null },
    landing: { status: 'pending', data: null },
    finance: { status: 'pending', data: null },
    scripts: { status: 'pending', data: null },
    synthesis: { status: 'pending', data: null },
  });

  async function runFullAudit() {
    setRunning(true);
    setError('');
    setAuditResult(null);
    setProgress(0);

    // Reset sections
    setSections({
      campaigns: { status: 'running', data: null },
      creatives: { status: 'pending', data: null },
      landing: { status: 'pending', data: null },
      finance: { status: 'pending', data: null },
      scripts: { status: 'pending', data: null },
      synthesis: { status: 'pending', data: null },
    });

    try {
      // Run individual agents progressively for better UX
      const steps = [
        { key: 'campaigns', label: 'Campañas', fn: () => api.runOptimizer() },
        { key: 'creatives', label: 'Creativos', fn: () => api.runCreatives() },
        { key: 'landing', label: 'Landing Page', fn: () => api.runLandingAudit({}) },
        { key: 'finance', label: 'Finanzas', fn: () => api.runFinance({ prompt: 'Analiza el estado financiero completo' }) },
        { key: 'scripts', label: 'Guiones', fn: () => api.runScripts({ prompt: 'Genera 3 guiones basados en los datos disponibles' }) },
      ];

      const results = {};

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setSections(prev => ({
          ...prev,
          [step.key]: { status: 'running', data: null },
        }));

        try {
          const result = await step.fn();
          results[step.key] = result;
          setSections(prev => ({
            ...prev,
            [step.key]: { status: 'done', data: typeof result === 'string' ? result : JSON.stringify(result, null, 2) },
          }));
        } catch (err) {
          setSections(prev => ({
            ...prev,
            [step.key]: { status: 'error', data: `Error: ${err.message}` },
          }));
        }

        setProgress(Math.round(((i + 1) / (steps.length + 1)) * 100));
      }

      // Final synthesis via full-audit endpoint
      setSections(prev => ({
        ...prev,
        synthesis: { status: 'running', data: null },
      }));

      try {
        const synthesis = await api.runFullAudit();
        setSections(prev => ({
          ...prev,
          synthesis: { status: 'done', data: typeof synthesis === 'string' ? synthesis : JSON.stringify(synthesis, null, 2) },
        }));
        setAuditResult(synthesis);
      } catch (err) {
        setSections(prev => ({
          ...prev,
          synthesis: { status: 'error', data: `Error en síntesis: ${err.message}` },
        }));
      }

      setProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  const allSectionsList = [
    { key: 'campaigns', title: 'Análisis de Campañas', icon: '📊' },
    { key: 'creatives', title: 'Rendimiento Creativo', icon: '🎨' },
    { key: 'landing', title: 'Auditoría de Landing Page', icon: '🌐' },
    { key: 'finance', title: 'Análisis Financiero', icon: '💰' },
    { key: 'scripts', title: 'Guiones Sugeridos', icon: '✍️' },
    { key: 'synthesis', title: 'Síntesis CEO — Plan de Acción', icon: '🎯' },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Auditoría Completa</h1>
            <p className="text-gray-400 mt-1">
              Análisis integral de campañas, creativos, landing page, finanzas y plan de acción
            </p>
          </div>
          <button
            onClick={runFullAudit}
            disabled={running}
            className={`px-6 py-3 rounded-xl font-semibold transition-all text-sm ${
              running
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/30'
            }`}
          >
            {running ? 'Ejecutando auditoría...' : 'Ejecutar Auditoría Completa'}
          </button>
        </div>

        {/* Progress Bar */}
        {running && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Progreso de auditoría</span>
              <span className="text-sm font-medium text-indigo-300">{progress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Los agentes están analizando tu cuenta. Esto puede tomar 1-2 minutos.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* How it works (before running) */}
        {!running && !auditResult && !Object.values(sections).some(s => s.data) && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-white mb-3">¿Cómo funciona?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6">
              La auditoría completa ejecuta 6 agentes especializados en secuencia. Cada agente analiza un aspecto
              diferente de tu negocio y al final un agente CEO sintetiza todo en un plan de acción priorizado.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {allSectionsList.map(s => (
                <div key={s.key} className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm text-gray-300">{s.title}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg max-w-lg mx-auto">
              <p className="text-yellow-200 text-sm">
                Asegurate de tener configuradas las APIs en <a href="/settings" className="underline">Configuración</a> antes de ejecutar la auditoría.
              </p>
            </div>
          </div>
        )}

        {/* Audit Sections */}
        {Object.values(sections).some(s => s.data || s.status !== 'pending') && (
          <div className="space-y-4">
            {allSectionsList.map(s => (
              <AuditSection
                key={s.key}
                title={s.title}
                icon={s.icon}
                content={sections[s.key].data}
                status={sections[s.key].status}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export function getServerSideProps(context) {
  return { props: {} };
}
