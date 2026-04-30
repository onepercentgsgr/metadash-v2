'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const WIZARD_STEPS = [
  { id: 'oferta', num: 0, icon: '🎯', name: 'Modelado de Oferta' },
  { id: 'investigacion', num: 1, icon: '🔍', name: 'Investigación de Mercado' },
  { id: 'avatares', num: 2, icon: '👥', name: 'Avatares + Ángulos' },
  { id: 'brand', num: 3, icon: '🎨', name: 'Identidad Visual' },
  { id: 'mockup', num: 4, icon: '📸', name: 'Mockup Principal' },
  { id: 'ads', num: 5, icon: '🖼️', name: 'Prompts de ADS' },
  { id: 'bonus_mockups', num: 6, icon: '🎁', name: 'Bonus Mockups' },
  { id: 'bundle', num: 7, icon: '📦', name: 'Bundle Completo' },
  { id: 'landing', num: 8, icon: '🚀', name: 'Landing Page' },
  { id: 'copys', num: 9, icon: '✍️', name: 'Copys para Ads' },
  { id: 'guiones', num: 10, icon: '🎬', name: 'Guiones Video Ads' },
  { id: 'ugc', num: 11, icon: '📱', name: 'UGC Realistas' },
  { id: 'producto', num: 12, icon: '📖', name: 'Generador de Producto' },
  { id: 'lanzamiento', num: 13, icon: '🚀', name: 'Plan de Lanzamiento' },
];

function ConnectionPill({ icon, label, status }) {
  const isOk = status === 'connected';
  const isPartial = status === 'partial';
  const dotColor = isOk
    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
    : isPartial
    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
    : 'bg-gray-600';
  const labelColor = isOk ? 'text-emerald-300' : isPartial ? 'text-amber-300' : 'text-gray-500';
  const stateText = isOk ? 'Conectado' : isPartial ? 'Parcial' : 'Desconectado';
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#111114] border border-[#1e1e24]">
      <div className="flex items-center gap-3">
        <span className="text-base">{icon}</span>
        <span className="text-sm text-gray-300 font-medium tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        <span className={`text-[10px] uppercase tracking-widest font-semibold ${labelColor}`}>
          {stateText}
        </span>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, subtitle, accent }) {
  const accentClass = {
    indigo: 'hover:border-indigo-700/50 hover:bg-indigo-600/5',
    violet: 'hover:border-violet-700/50 hover:bg-violet-600/5',
    emerald: 'hover:border-emerald-700/50 hover:bg-emerald-600/5',
    amber: 'hover:border-amber-700/50 hover:bg-amber-600/5',
  }[accent] || 'hover:border-gray-700/60';
  return (
    <Link
      href={href}
      className={`group bg-[#16161a] border border-[#1e1e24] rounded-2xl p-6 transition-all ${accentClass}`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <span className="text-gray-600 group-hover:text-gray-300 transition-colors text-lg">→</span>
      </div>
      <div className="text-base font-bold text-gray-100 tracking-tight mb-1">{title}</div>
      <div className="text-sm text-gray-400 leading-snug">{subtitle}</div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wizardState, setWizardState] = useState(null);
  const [configStatus, setConfigStatus] = useState({
    meta: 'disconnected',
    anthropic: 'disconnected',
    landing: 'disconnected',
    ga4: 'disconnected',
  });

  useEffect(() => {
    loadAll();
    // Read wizard state from localStorage
    try {
      const raw = localStorage.getItem('metadash_infoproducto');
      if (raw) {
        const parsed = JSON.parse(raw);
        setWizardState(parsed);
      }
    } catch (e) {
      console.warn('No wizard state', e);
    }
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const configData = await api.getConfig().catch(() => null);
      if (configData) {
        setConfig(configData);
        const c = configData;
        const hasGa4 = !!(c.ga4_property_id && c.ga4_credentials_json);
        setConfigStatus({
          meta:
            c.meta_access_token && c.meta_ad_account_id
              ? 'connected'
              : c.meta_access_token || c.meta_ad_account_id
              ? 'partial'
              : 'disconnected',
          anthropic: c.anthropic_api_key ? 'connected' : 'disconnected',
          landing: c.landing_page_url ? 'connected' : 'disconnected',
          ga4: hasGa4 ? 'connected' : 'disconnected',
        });
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Wizard progress derivation
  const currentStepIndex =
    wizardState && typeof wizardState.paso_actual === 'number' ? wizardState.paso_actual : null;
  const completedSteps = Array.isArray(wizardState?.pasos_completos)
    ? wizardState.pasos_completos.length
    : 0;
  const currentStep =
    currentStepIndex !== null && WIZARD_STEPS[currentStepIndex]
      ? WIZARD_STEPS[currentStepIndex]
      : null;
  const progressPct = Math.round((completedSteps / WIZARD_STEPS.length) * 100);
  const hasWizardProgress = currentStepIndex !== null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buen día';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-400">Cargando…</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Hero */}
        <header className="pt-2">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-3">
            Tu workspace · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-100">
            {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-2xl">
            Tu próximo paso para lanzar tu infoproducto. Sin distracciones, una sola misión hoy.
          </p>
        </header>

        {/* Tu lanzamiento de hoy */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              Tu lanzamiento de hoy
            </span>
            {hasWizardProgress && (
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">
                {progressPct}% completado
              </span>
            )}
          </div>

          {hasWizardProgress ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/10 to-violet-600/10 border border-indigo-700/30 rounded-2xl p-8">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{currentStep?.icon || '🚀'}</span>
                    <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-semibold">
                      Paso {currentStepIndex} de {WIZARD_STEPS.length - 1}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-100 mb-2">
                    {currentStep?.name || 'Continuá tu lanzamiento'}
                  </h2>
                  <p className="text-sm text-gray-400 max-w-md">
                    Retomá donde te quedaste. Cada paso te acerca al lanzamiento real de tu infoproducto.
                  </p>
                  {/* progress bar */}
                  <div className="mt-5 h-1.5 bg-[#1e1e24] rounded-full overflow-hidden max-w-md">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
                <Link
                  href="/infoproducto"
                  className="self-start md:self-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-6 py-3.5 transition shadow-lg shadow-indigo-900/30 whitespace-nowrap"
                >
                  Continuar →
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/15 to-violet-600/15 border border-indigo-700/40 rounded-2xl p-10 text-center">
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="text-5xl mb-4">🚀</div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-100 mb-3">
                  Empezá tu primer lanzamiento
                </h2>
                <p className="text-sm text-gray-400 max-w-lg mx-auto mb-6">
                  Un wizard guiado de 14 pasos. Pasás de idea a infoproducto listo para vender —
                  con copy, ads, landing y plan de lanzamiento.
                </p>
                <Link
                  href="/infoproducto"
                  className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-7 py-4 transition shadow-lg shadow-indigo-900/40 text-base"
                >
                  Empezar ahora →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Acciones rápidas */}
        <section>
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-4">
            Acciones rápidas
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <QuickAction
              href="/infoproducto"
              icon="🚀"
              title="Empezar Infoproducto"
              subtitle="Wizard de 14 pasos guiado por agentes IA"
              accent="indigo"
            />
            <QuickAction
              href="/tiktok"
              icon="🎬"
              title="Generar Video TikTok"
              subtitle="Guiones y videos orgánicos en minutos"
              accent="violet"
            />
            <QuickAction
              href="/audit"
              icon="🤖"
              title="Auditoría Completa"
              subtitle="Análisis integral de tus campañas y métricas"
              accent="emerald"
            />
            <QuickAction
              href="/settings"
              icon="⚙️"
              title="Configurar APIs"
              subtitle="Meta Ads, Anthropic, GA4, Landing Page"
              accent="amber"
            />
          </div>
        </section>

        {/* Conexiones */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              Conexiones
            </span>
            <Link
              href="/settings"
              className="text-[11px] text-gray-500 hover:text-gray-200 font-medium transition-colors"
            >
              Gestionar →
            </Link>
          </div>
          <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ConnectionPill icon="📱" label="Meta Ads" status={configStatus.meta} />
              <ConnectionPill icon="🤖" label="Anthropic" status={configStatus.anthropic} />
              <ConnectionPill icon="📊" label="Google Analytics 4" status={configStatus.ga4} />
              <ConnectionPill icon="🌐" label="Landing Page" status={configStatus.landing} />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export function getServerSideProps(context) {
  return { props: {} };
}
