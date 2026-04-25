'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.onboarded_at) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl mb-5 shadow-lg shadow-indigo-900/40">
            MD
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Bienvenido a <span className="text-indigo-400">MetaDash</span>
          </h1>
          <p className="text-gray-400 text-lg">
            ¿Cómo querés empezar?
          </p>
        </div>

        {/* Path Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Path A: Starting from scratch */}
          <Link href="/infoproducto">
            <div className="group relative bg-gray-900 border border-gray-800 hover:border-emerald-600/60 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/20 hover:-translate-y-1">
              {/* Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-3xl mb-5">
                  🚀
                </div>

                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  Estoy empezando desde cero
                </h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  No tenés producto todavía. Te guiamos paso a paso para crear tu infoproducto, tu marca, tus creatividades y tu primer funnel.
                </p>

                <div className="space-y-2">
                  {[
                    '🎯 Modelado de oferta con IA',
                    '👥 Investigación de avatares y ángulos',
                    '🎨 Identidad visual y mockups',
                    '✍️ Copys y guiones para ads',
                    '🚀 Landing page y email marketing',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  Crear mi infoproducto
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Path B: Already has product */}
          <Link href="/onboarding">
            <div className="group relative bg-gray-900 border border-gray-800 hover:border-indigo-600/60 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/20 hover:-translate-y-1">
              {/* Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-indigo-900/40 border border-indigo-700/40 flex items-center justify-center text-3xl mb-5">
                  📊
                </div>

                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  Ya tengo producto y campañas
                </h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  Ya vendés pero querés escalar. Conectá Meta Ads y dejá que los agentes de IA optimicen tus campañas, creatividades y finanzas.
                </p>

                <div className="space-y-2">
                  {[
                    '📱 Conectar Meta Ads',
                    '🤖 8 agentes de IA especializados',
                    '📈 Semáforo de métricas en tiempo real',
                    '💰 Control financiero y márgenes',
                    '🎬 TikTok creator — 1 video por día',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                  Conectar y optimizar
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Skip link */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
          >
            Saltear e ir al dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
