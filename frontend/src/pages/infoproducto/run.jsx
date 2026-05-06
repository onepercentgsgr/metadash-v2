'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/Icons';
import LaunchDashboard from '../../components/LaunchDashboard';
import { Markdown } from '../../components/Markdown';

// Mirror of backend PIPELINE_WAVES — keeps UI in sync with orchestrator
const WAVES = [
  ['oferta'],
  ['investigacion'],
  ['avatares'],
  ['brand', 'producto'],
  ['mockup', 'ads', 'copys'],
  ['bonus_mockups', 'bundle', 'landing', 'guiones'],
  ['ugc', 'upsells', 'email'],
  ['lanzamiento'],
];

const STEP_DISPLAY = {
  oferta:         { name: 'Modelado de Oferta',      agent: 'EL INVESTIGADOR',         icon: '🎯' },
  investigacion:  { name: 'Investigación de Mercado',agent: 'EL INVESTIGADOR',         icon: '🔍' },
  avatares:       { name: 'Avatares + Ángulos',      agent: 'COPYWRITER DR',           icon: '👥' },
  brand:          { name: 'Identidad Visual',        agent: 'DIRECTOR DE ARTE',        icon: '🎨' },
  producto:       { name: 'Producto Completo',       agent: 'EL INVESTIGADOR',         icon: '📖' },
  mockup:         { name: 'Mockup Principal',        agent: 'DIRECTOR DE ARTE',        icon: '📸' },
  ads:            { name: 'Prompts de Ads',          agent: 'DIRECTOR DE ARTE',        icon: '🖼️' },
  copys:          { name: 'Copys Meta + TikTok',     agent: 'COPYWRITER DR',           icon: '✍️' },
  bonus_mockups:  { name: 'Bonus Mockups',           agent: 'DIRECTOR DE ARTE',        icon: '🎁' },
  bundle:         { name: 'Bundle Completo',         agent: 'DIRECTOR DE ARTE',        icon: '📦' },
  landing:        { name: 'Landing Page',            agent: 'DEVELOPER',               icon: '🚀' },
  guiones:        { name: 'Guiones Video Ads',       agent: 'COPYWRITER DR',           icon: '🎬' },
  ugc:            { name: 'UGC Realistas',           agent: 'DIRECTOR DE ARTE',        icon: '📱' },
  upsells:        { name: 'Upsells + AOV',           agent: 'COPYWRITER DR',           icon: '💎' },
  email:          { name: 'Email Marketing',         agent: 'COPYWRITER DR',           icon: '📧' },
  lanzamiento:    { name: 'Plan de Lanzamiento',     agent: 'ESTRATEGA',               icon: '🗓️' },
};

const ALL_STEPS = WAVES.flat();

export default function RunPipelinePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [stepStates, setStepStates] = useState(() => {
    const init = {};
    ALL_STEPS.forEach(s => init[s] = { status: 'pending', output: '', duration: null });
    return init;
  });
  const [activeStep, setActiveStep] = useState(null);
  const [activeOutput, setActiveOutput] = useState('');
  const [runId, setRunId] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState('idle'); // idle | running | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [totalDuration, setTotalDuration] = useState(null);
  const [seedState, setSeedState] = useState(null);

  const startedRef = useRef(false);

  // Load chat seed state from localStorage if available
  useEffect(() => {
    try {
      const fromChat = localStorage.getItem('metadash_pipeline_seed');
      const fromInfoproducto = localStorage.getItem('metadash_infoproducto');
      const seed = fromChat
        ? JSON.parse(fromChat)
        : (fromInfoproducto ? JSON.parse(fromInfoproducto) : {});
      setSeedState(seed);
    } catch {
      setSeedState({});
    }
  }, []);

  const startPipeline = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setPipelineStatus('running');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const res = await fetch(`${API_URL}/agents/infoproducto/run-pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ state: seedState || {} }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
        throw new Error(err.detail || `Error ${res.status}`);
      }

      // Stream SSE events
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx;
        while ((nlIdx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, nlIdx).trim();
          buffer = buffer.slice(nlIdx + 2);
          if (!chunk.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(chunk.slice(6));
            handleEvent(event);
          } catch {}
        }
      }
    } catch (e) {
      setPipelineStatus('error');
      setErrorMsg(e?.message || String(e));
    }
  }, [seedState]);

  const handleEvent = (event) => {
    switch (event.type) {
      case 'pipeline.start':
        setRunId(event.run_id);
        break;
      case 'wave.start':
        // no-op visually; step.start events do the work
        break;
      case 'step.start':
        setActiveStep(event.step_id);
        setActiveOutput(`⚙️ ${event.agent} arrancando ${event.focus}...\n\n`);
        setStepStates(prev => ({
          ...prev,
          [event.step_id]: { ...prev[event.step_id], status: 'running' },
        }));
        break;
      case 'step.complete':
        setStepStates(prev => ({
          ...prev,
          [event.step_id]: {
            status: 'complete',
            output: event.output || '',
            duration: event.duration_seconds,
          },
        }));
        // If this step is the currently-displayed one, show the full output
        setActiveStep(prev => {
          if (prev === event.step_id) setActiveOutput(event.output || '');
          return prev;
        });
        break;
      case 'step.error':
        setStepStates(prev => ({
          ...prev,
          [event.step_id]: { ...prev[event.step_id], status: 'error', error: event.error },
        }));
        break;
      case 'pipeline.done':
        setPipelineStatus('done');
        setTotalDuration(event.duration_seconds);
        break;
      case 'pipeline.error':
        setPipelineStatus('error');
        setErrorMsg(event.error || 'Error desconocido');
        break;
      default:
        break;
    }
  };

  // Auto-start once seedState is loaded (on first mount)
  useEffect(() => {
    if (seedState !== null && pipelineStatus === 'idle' && !authLoading && user) {
      startPipeline();
    }
  }, [seedState, pipelineStatus, authLoading, user, startPipeline]);

  const downloadBundle = async () => {
    if (!runId) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const tokRes = await fetch(`${API_URL}/agents/infoproducto/bundle/${runId}/download-token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!tokRes.ok) throw new Error('No se pudo generar el token de descarga');
      const { token: dlToken } = await tokRes.json();
      window.location.href = `${API_URL}/agents/infoproducto/bundle/${runId}/by-token?token=${encodeURIComponent(dlToken)}`;
    } catch (e) {
      alert('Error descargando bundle: ' + (e?.message || e));
    }
  };

  const completedCount = Object.values(stepStates).filter(s => s.status === 'complete').length;
  const progressPct = Math.round((completedCount / ALL_STEPS.length) * 100);

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans">
      {/* Header */}
      <header className="border-b border-[#1e1e24] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-500 hover:text-gray-300 text-sm"
          >
            ← Dashboard
          </button>
          <div className="h-6 w-px bg-[#27272f]" />
          <h1 className="text-base font-extrabold tracking-tight">
            🎬 El Estudio · <span className="text-indigo-400">Pipeline Nivel Dios</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500">
            {completedCount}/{ALL_STEPS.length} pasos · {progressPct}%
          </div>
          {pipelineStatus === 'done' && (
            <button
              onClick={downloadBundle}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <Icon name="file" size={13} />
              Descargar bundle ZIP
            </button>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-[#1e1e24]">
        <div
          className={`h-full transition-all ${
            pipelineStatus === 'error'
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-0 min-h-[calc(100vh-65px)]">
        {/* Timeline */}
        <aside className="border-r border-[#1e1e24] bg-[#0c0c0f] overflow-y-auto p-4 max-h-[calc(100vh-65px)]">
          {WAVES.map((wave, wIdx) => (
            <div key={wIdx} className="mb-5">
              <div className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-2 px-2">
                Ola {wIdx + 1} {wave.length > 1 && <span className="text-indigo-500">· {wave.length} agentes en paralelo</span>}
              </div>
              <div className="space-y-1.5">
                {wave.map(stepId => {
                  const display = STEP_DISPLAY[stepId] || { name: stepId, agent: '?', icon: '•' };
                  const state = stepStates[stepId] || { status: 'pending' };
                  const isActive = activeStep === stepId;
                  return (
                    <button
                      key={stepId}
                      onClick={() => {
                        setActiveStep(stepId);
                        setActiveOutput(state.output || '');
                      }}
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition border ${
                        isActive
                          ? 'bg-indigo-600/15 border-indigo-700/50'
                          : 'border-transparent hover:bg-[#111114]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                        state.status === 'complete' ? 'bg-emerald-600/20 text-emerald-400' :
                        state.status === 'running'  ? 'bg-indigo-600 text-white animate-pulse' :
                        state.status === 'error'    ? 'bg-red-600/20 text-red-400' :
                                                      'bg-[#27272f] text-gray-500'
                      }`}>
                        {state.status === 'complete' ? '✓' :
                         state.status === 'running'  ? '⚙' :
                         state.status === 'error'    ? '✗' :
                                                       display.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12px] font-semibold truncate ${
                          state.status === 'complete' ? 'text-emerald-300' :
                          state.status === 'running'  ? 'text-indigo-300' :
                          state.status === 'error'    ? 'text-red-300' :
                                                        'text-gray-400'
                        }`}>
                          {display.name}
                        </div>
                        <div className="text-[9px] text-gray-600 truncate uppercase tracking-wider">
                          {display.agent}
                          {state.duration && <span className="text-gray-500 ml-1">· {state.duration}s</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Live preview */}
        <section className="overflow-y-auto max-h-[calc(100vh-65px)] p-6">
          {pipelineStatus === 'error' ? (
            <div className="bg-red-950/20 border border-red-700/40 rounded-2xl p-6">
              <h2 className="text-base font-bold text-red-300 mb-2">⚠ Error en el pipeline</h2>
              <p className="text-sm text-red-200/70">{errorMsg}</p>
              <button
                onClick={() => router.reload()}
                className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold"
              >
                Reintentar
              </button>
            </div>
          ) : pipelineStatus === 'done' ? (
            <LaunchDashboard
              run={{
                product_name: seedState?.oferta?.nombre || seedState?.nombre || null,
                deliverables: Object.fromEntries(
                  Object.entries(stepStates)
                    .filter(([, s]) => s?.output)
                    .map(([k, s]) => [k, s.output])
                ),
                state_snapshot: seedState || {},
              }}
              onDownloadBundle={downloadBundle}
            />
          ) : null}

          {activeStep ? (
            <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#1e1e24]">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
                    {STEP_DISPLAY[activeStep]?.agent || 'AGENTE'}
                  </div>
                  <h2 className="text-base font-bold text-gray-100">
                    {STEP_DISPLAY[activeStep]?.icon} {STEP_DISPLAY[activeStep]?.name || activeStep}
                  </h2>
                </div>
                {stepStates[activeStep]?.duration && (
                  <span className="text-[11px] text-gray-500">⏱ {stepStates[activeStep].duration}s</span>
                )}
              </div>
              <div className="bg-[#09090b] border border-[#1e1e24] rounded-xl p-5 min-h-[400px] max-h-[70vh] overflow-y-auto">
                {activeOutput ? (
                  <>
                    <Markdown>{activeOutput}</Markdown>
                    {stepStates[activeStep]?.status === 'running' && (
                      <span className="inline-block ml-1 w-2 h-3.5 bg-indigo-400 animate-pulse align-middle" />
                    )}
                  </>
                ) : (
                  <div className="text-xs text-gray-500">⏳ Esperando…</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm pt-20">
              {pipelineStatus === 'idle'
                ? '⏳ Iniciando pipeline...'
                : 'Hacé click en un paso del timeline para ver su output'}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
