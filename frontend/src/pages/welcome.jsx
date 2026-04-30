'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

const PATH_A = {
  href: '/infoproducto',
  accent: '#10b981',
  title: 'Empezar desde cero',
  subtitle: 'Creá tu infoproducto con IA — de idea a lanzamiento en 14 pasos',
  badge: 'Wizard guiado',
  features: [
    'Modelado de oferta y avatar',
    'Identidad visual y mockups',
    'Copys + guiones de video ads',
    'Landing page completa',
    'Plan de lanzamiento 7 días',
  ],
  cta: 'Crear mi infoproducto',
};

const PATH_B = {
  href: '/onboarding',
  accent: '#6366f1',
  title: 'Ya tengo producto',
  subtitle: 'Conectá Meta Ads y dejá que los agentes IA escalen tus campañas',
  badge: '8 agentes IA',
  features: [
    'Semáforo de métricas en tiempo real',
    'Optimización automática 24/7',
    'Control financiero y márgenes',
    'CRO en landing page',
    'TikTok orgánico — 1 video/día',
  ],
  cta: 'Conectar y optimizar',
};

function PathCard({ path, onNavigate }) {
  return (
    <div
      className="group relative rounded-2xl p-7 cursor-pointer transition-all duration-200"
      style={{
        background: '#16161a',
        border: `1px solid rgba(255,255,255,0.06)`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
      onClick={() => onNavigate(path.href)}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = `1px solid ${path.accent}35`;
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${path.accent}18`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%,${path.accent}10 0%,transparent 60%)` }} />

      <div className="relative">
        {/* Icon + badge */}
        <div className="flex items-start justify-between mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: `${path.accent}15`, border: `1px solid ${path.accent}25` }}>
            <div className="w-5 h-5 rounded-full" style={{ background: path.accent, opacity: 0.9 }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{ background: `${path.accent}15`, color: path.accent, border: `1px solid ${path.accent}25` }}>
            {path.badge}
          </span>
        </div>

        <h2 className="text-lg font-extrabold text-white tracking-tight mb-1">{path.title}</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{path.subtitle}</p>

        <ul className="space-y-2.5 mb-7">
          {path.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: path.accent }} />
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{f}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all"
          style={{ color: path.accent }}>
          {path.cta}
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.onboarded_at) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 font-sans"
      style={{ background: '#09090b' }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 400,
          background: 'radial-gradient(ellipse,rgba(99,102,241,0.1) 0%,transparent 60%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
      </div>

      <div className="relative w-full max-w-3xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div style={{
            width: 44, height: 44, borderRadius: 12, margin: '0 auto 20px',
            background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
            boxShadow: '0 0 28px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: 14,
          }}>
            MD
          </div>
          <h1 style={{
            fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1,
            background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', marginBottom: 10,
          }}>
            Bienvenido a MetaDash
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', fontWeight: 450 }}>
            ¿Cómo querés empezar?
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PathCard path={PATH_A} onNavigate={(href) => router.push(href)} />
          <PathCard path={PATH_B} onNavigate={(href) => router.push(href)} />
        </div>

        <div className="text-center mt-8">
          <button onClick={() => router.push('/dashboard')}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={(e) => { e.target.style.color = 'rgba(255,255,255,0.5)'; }}
            onMouseLeave={(e) => { e.target.style.color = 'rgba(255,255,255,0.2)'; }}
          >
            Ir al dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
