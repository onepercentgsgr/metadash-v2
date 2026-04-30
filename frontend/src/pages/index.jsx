'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { Icon } from '../components/Icons';

const FEATURES = [
  { icon: 'videos',     accent: '#ec4899', name: 'Videos TikTok diarios',    desc: 'Un guion nuevo cada día, generado con IA. 7 ángulos probados para máxima conversión orgánica.' },
  { icon: 'rocket',     accent: '#6366f1', name: 'Landing Pages con CRO',    desc: 'Generá y auditá tu landing con IA. Headlines, CTAs y trust signals optimizados para vender.' },
  { icon: 'campaigns',  accent: '#3b82f6', name: 'Meta Ads — 24/7',          desc: 'Agentes que analizan ROAS, CPM y fatiga creativa. Detectan qué pausar, escalar o ajustar.' },
  { icon: 'financials', accent: '#10b981', name: 'Control financiero',        desc: 'MER, breakeven ROAS, márgenes y proyecciones. Sabés exactamente si tu negocio es rentable.' },
  { icon: 'brain',      accent: '#8b5cf6', name: 'IA de nivel pro',          desc: '8 agentes especializados con contexto compartido. Cada uno sabe lo que hacen los demás.' },
  { icon: 'creditcard', accent: '#f59e0b', name: 'Pagos integrados',         desc: 'MercadoPago y Stripe listos para cobrar. Tus clientes pagan, vos recibís.' },
];

const STEPS = [
  { num: '01', title: 'Registrate en 2 minutos',    desc: 'Creá tu cuenta. Sin tarjeta, sin compromiso. 14 días para probar todo.' },
  { num: '02', title: 'Conectá tus herramientas',   desc: 'Meta Ads, GA4 y MercadoPago en un solo lugar. Los agentes empiezan a trabajar solos.' },
  { num: '03', title: 'Generá tu primer contenido', desc: 'TikTok, copys para ads, guiones de video — todo en segundos con contexto de tu producto.' },
  { num: '04', title: 'Vendé y escalá',             desc: 'Los agentes optimizan tus campañas mientras vos dormís. Vos te enfocás en el producto.' },
];

const PLANS = [
  { name: 'Starter', price: 29,  accent: '#3b82f6', desc: 'Para emprendedores que empiezan', features: ['5 agentes de IA', 'Optimización automática', '1 cuenta Meta Ads', 'Historial 30 días', 'GA4 integrado'], cta: 'Elegir Starter' },
  { name: 'Pro',     price: 79,  accent: '#6366f1', desc: 'Para agencias en crecimiento',    popular: true, features: ['Agentes IA ilimitados', 'Agentes autónomos 24/7', 'CRO + Growth + Scripts', '5 cuentas Meta Ads', 'Historial 1 año', 'Soporte prioritario'], cta: 'Elegir Pro' },
  { name: 'Enterprise', price: 199, accent: '#8b5cf6', desc: 'Para alto volumen y equipos', features: ['Todo lo de Pro', 'Cuentas Meta ilimitadas', 'API con SLA', 'Dashboard white-label', 'Gestor dedicado', 'Soporte 24/7'], cta: 'Contactar ventas' },
];

const FAQS = [
  { q: '¿Necesito experiencia en marketing?',        a: 'No. MetaDash está diseñado para que los agentes hagan el trabajo técnico. Vos decidís la estrategia.' },
  { q: '¿Puedo empezar sin producto terminado?',     a: 'Sí. El wizard de Infoproducto te guía en 14 pasos: de la idea al lanzamiento, con todo generado por IA.' },
  { q: '¿Qué pasa cuando termina el trial de 14 días?', a: 'Tu cuenta se pausa. Elegís un plan pago para continuar. Sin cobros automáticos ni sorpresas.' },
  { q: '¿Funciona para infoproductos en cualquier nicho?', a: 'Sí. Los agentes adaptan el tono, modismos y estrategia según tu mercado (Argentina, México, España, LATAM, etc.).' },
];

function CheckSVG({ color = '#10b981' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState(null);

  if (user) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>De vuelta</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 24 }}>
            Hola de nuevo, {user.name?.split(' ')[0]}
          </h1>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 20px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
            Ir al Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', fontFamily: 'inherit' }}>

      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: 1000, height: 500, background: 'radial-gradient(ellipse,rgba(99,102,241,0.12) 0%,transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: 600, height: 600, background: 'radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 11, boxShadow: '0 0 16px rgba(99,102,241,0.35)' }}>MD</div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: 'white' }}>MetaDash</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '7px 14px', borderRadius: 8, transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color='rgba(255,255,255,0.85)'}
              onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.5)'}>
              Login
            </Link>
            <Link href="/register" style={{ fontSize: 13, fontWeight: 700, color: 'white', textDecoration: 'none', padding: '7px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 2px 10px rgba(79,70,229,0.35), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, paddingTop: 140, paddingBottom: 100, textAlign: 'center', padding: '140px 24px 100px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px rgba(99,102,241,0.8)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>14 días gratis · Sin tarjeta</span>
          </div>

          <h1 style={{ fontSize: 'clamp(36px,6vw,68px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 20 }}>
            <span style={{ background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.55) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Lanzá tu infoproducto
            </span>
            <br />
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              con IA de nivel dios
            </span>
          </h1>

          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, maxWidth: 560, margin: '0 auto 36px' }}>
            Agentes que crean tu contenido, optimizan tus campañas 24/7 y analizan tus finanzas — mientras vos te enfocás en escalar.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', maxWidth: 480, margin: '0 auto 40px', textAlign: 'left' }}>
            {['Videos TikTok automáticos diarios', 'Optimización de Meta Ads 24/7', 'Wizard de infoproducto guiado por IA', 'CRO en landing page + análisis', 'Control financiero con MER y ROAS', 'Pagos con MercadoPago y Stripe'].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSVG />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 6px 24px rgba(79,70,229,0.45), inset 0 1px 0 rgba(255,255,255,0.15)', letterSpacing: '-0.01em' }}>
              Empezar gratis <Icon name="arrowright" size={16} strokeWidth={2.5} />
            </Link>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '14px 28px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.4)'; e.currentTarget.style.color='white'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.color='rgba(255,255,255,0.6)'; }}>
              Ver planes
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
            Sin tarjeta de crédito · Acceso inmediato · Cancelá cuando quieras
          </p>
        </div>
      </section>

      {/* Steps */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Cómo funciona</p>
            <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              De cero a ventas en 4 pasos
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ position: 'relative', padding: '28px 24px', background: '#16161a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', marginBottom: 14, letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums' }}>{s.num}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 8, letterSpacing: '-0.01em' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', right: -13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.12)', fontSize: 18, display: 'none' }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Todo incluido</p>
            <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Una plataforma para todo tu negocio
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
            {FEATURES.map((f) => (
              <div key={f.name}
                style={{ padding: '24px', background: '#16161a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, cursor: 'default', transition: 'all 0.2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.border = `1px solid ${f.accent}35`;
                  e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${f.accent}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.accent}15`, border: `1px solid ${f.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.accent, marginBottom: 16 }}>
                  <Icon name={f.icon} size={20} strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 6, letterSpacing: '-0.01em' }}>{f.name}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Planes y Precios</p>
            <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 10 }}>
              Escalá tu negocio con IA
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>14 días de trial gratis en todos los planes</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, alignItems: 'start' }}>
            {PLANS.map((plan) => (
              <div key={plan.name} style={{
                background: plan.popular ? 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))' : '#16161a',
                border: plan.popular ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20, overflow: 'hidden',
                boxShadow: plan.popular ? '0 0 40px rgba(99,102,241,0.12)' : 'none',
                transform: plan.popular ? 'scale(1.02)' : 'none',
              }}>
                {plan.popular && (
                  <div style={{ textAlign: 'center', padding: '8px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', fontSize: 10, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    ✦ Más popular
                  </div>
                )}
                <div style={{ padding: '24px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: plan.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{plan.name}</span>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, margin: '8px 0 4px' }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: 'white', letterSpacing: '-0.04em' }}>${plan.price}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>USD / mes</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>{plan.desc}</p>
                  <Link href="/register" style={{
                    display: 'block', textAlign: 'center', padding: '10px', borderRadius: 12,
                    fontWeight: 700, fontSize: 13, textDecoration: 'none', marginBottom: 20,
                    background: plan.popular ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : `${plan.accent}18`,
                    color: plan.popular ? 'white' : plan.accent,
                    border: plan.popular ? 'none' : `1px solid ${plan.accent}30`,
                    boxShadow: plan.popular ? '0 4px 16px rgba(79,70,229,0.35)' : 'none',
                  }}>
                    {plan.cta}
                  </Link>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <CheckSVG color={plan.accent} />
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 800, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 40, background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Preguntas frecuentes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'white', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', paddingRight: 16 }}>{faq.q}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none', display: 'block' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, marginTop: 14 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 32px rgba(99,102,241,0.45)' }}>
            <Icon name="rocket" size={24} strokeWidth={1.75} />
          </div>
          <h2 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 12 }}>
            ¿Listo para lanzar?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginBottom: 32, lineHeight: 1.6 }}>
            14 días gratis. Sin tarjeta. Cancelá cuando quieras.
          </p>
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 40px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 16, color: 'white', fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 32px rgba(79,70,229,0.45), inset 0 1px 0 rgba(255,255,255,0.15)', letterSpacing: '-0.01em' }}>
            Comenzar gratis <Icon name="arrowright" size={18} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 9 }}>MD</div>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>MetaDash</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>
          © 2025 MetaDash · Todos los derechos reservados · SSL · Backups automáticos
        </p>
      </footer>

    </div>
  );
}
