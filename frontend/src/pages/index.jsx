'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/Icons';

const PAINS = [
  'Gastás en Meta Ads y no sabés si estás ganando o perdiendo plata',
  'Tardás horas creando contenido que tal vez no funciona',
  'No tenés idea si tu negocio es rentable de verdad o te estás mintiendo',
  'Cada día es improvisar — sin sistema, sin datos, sin claridad',
  'Querés escalar pero no sabés qué palanca tocar',
];

const BENEFITS = [
  { icon: 'agents',     accent: '#8b5cf6', name: 'Guerra Room diaria',     desc: 'Cada mañana 4 agentes en cadena analizan tu cuenta y te dan el plan del día. Media Buyer + CFO + CRO + Commander. Vos aprobás, ellos ejecutan.' },
  { icon: 'campaigns',  accent: '#3b82f6', name: 'Meta Ads sin adivinar',   desc: 'ROAS, CPA y fatiga creativa monitoreados 24/7. Saben exactamente qué pausar, qué escalar y cuándo — con tu margen real, no un 2x genérico.' },
  { icon: 'videos',     accent: '#ec4899', name: 'Contenido TikTok diario', desc: 'Un guion nuevo cada día con 7 ángulos probados. Nunca más "¿de qué hablo hoy?". La IA lo genera con el contexto de tu producto.' },
  { icon: 'rocket',     accent: '#6366f1', name: 'Wizard de lanzamiento',   desc: '14 pasos guiados por IA: oferta, avatares, mockups, copys para ads, landing, guiones. De idea a infoproducto listo para vender.' },
  { icon: 'financials', accent: '#10b981', name: 'Finanzas en tiempo real', desc: 'MER, breakeven ROAS a tu margen real, proyecciones. Por fin sabés si tu negocio crece o se funde — sin esperar el contador.' },
  { icon: 'audit',      accent: '#f59e0b', name: 'Auditoría de landing',    desc: 'La IA lee tu página, detecta qué falla en el copy, los CTAs y la estructura — y te da cambios concretos para subir la conversión.' },
];

const STEPS = [
  { num: '01', title: 'Registrate gratis',        desc: 'Sin tarjeta. 7 días para probar todo sin límites artificiales de funciones.' },
  { num: '02', title: 'Conectá Meta Ads',         desc: 'En 2 minutos conectás tu cuenta. Los agentes empiezan a analizar solos.' },
  { num: '03', title: 'Arrancá la Guerra Room',   desc: 'Hacés click en "Arrancar sesión" y en minutos tenés el plan del día con acciones concretas.' },
  { num: '04', title: 'Aprobás y escalan solos',  desc: 'Vos decidís qué ejecutar. Los agentes registran cada acción y miden el resultado.' },
];

const PLANS = [
  {
    name: 'Emprendedor',
    price: 19,
    accent: '#3b82f6',
    desc: 'Para lanzar y vender tu primer infoproducto',
    badge: null,
    features: [
      '1 infoproducto activo',
      '8 agentes de IA especializados',
      'Guerra Room — sesión diaria',
      'Meta Ads con breakeven ROAS real',
      'Wizard de lanzamiento 14 pasos',
      'Videos TikTok diarios generados con IA',
      'Auditoría de landing page',
      'Soporte por email',
    ],
    cta: 'Empezar por $19/mes',
    ctaNote: '7 días gratis · Sin tarjeta',
  },
  {
    name: 'Master',
    price: 49,
    accent: '#6366f1',
    desc: 'Para escalar con múltiples infoproductos',
    badge: '✦ MÁS POPULAR',
    popular: true,
    features: [
      'Infoproductos ilimitados',
      'Agentes autónomos 24/7',
      'Generaciones IA ilimitadas',
      '5 cuentas Meta Ads',
      'Historial de decisiones con delta ROAS/CPA',
      'Alertas críticas por email antes de que explote',
      'Spy de competidores con IA',
      'Soporte prioritario',
    ],
    cta: 'Empezar con Master',
    ctaNote: '7 días gratis · Sin tarjeta',
  },
];

const FAQS = [
  {
    q: '¿Necesito saber de marketing o tecnología?',
    a: 'No. Los agentes hacen el trabajo técnico. Vos respondés preguntas sobre tu producto y tomás decisiones. Si sabés usar WhatsApp, podés usar MetaDash.',
  },
  {
    q: '¿Qué es exactamente la Guerra Room?',
    a: '4 agentes que se leen entre sí: el Media Buyer analiza tus campañas, el CFO calcula si sos rentable, el CRO revisa tu landing, y el Commander te da un plan de 5 acciones ordenadas por impacto. Tardás 3 minutos en leerlo y tomar la decisión.',
  },
  {
    q: '¿Funciona si todavía no tengo un infoproducto?',
    a: 'Perfecto para eso. El wizard de 14 pasos te guía desde la idea: nombre, oferta, avatares, mockups, copys para ads y plan de lanzamiento — todo generado con IA.',
  },
  {
    q: '¿Qué pasa si llego al límite del trial?',
    a: 'Tu cuenta se pausa. Elegís si seguir con Emprendedor ($19/mes) o Master ($49/mes). Sin cobros automáticos, sin sorpresas. Si no te sirvió, no pagás nada.',
  },
  {
    q: '¿Funciona para cualquier nicho de infoproducto?',
    a: 'Sí. Los agentes adaptan tono, modismos y estrategia a tu mercado: Argentina, México, España o cualquier país de LATAM. El contexto de tu negocio define todo.',
  },
  {
    q: '¿Cuánto cuesta la API de Claude que usan los agentes?',
    a: 'Nada extra. El costo de la IA está incluido en tu plan. No necesitás cuenta de Anthropic propia si no querés — aunque podés conectar la tuya para más control.',
  },
];

function Check({ color = '#10b981' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function XMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  if (user) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Ya tenés cuenta</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 24 }}>
            Bienvenido de vuelta, {user.name?.split(' ')[0] || 'crack'}.
          </h1>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 20px rgba(79,70,229,0.4)' }}>
            Ir al Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', fontFamily: 'inherit' }}>

      {/* ── Ambient background ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 1200, height: 600, background: 'radial-gradient(ellipse,rgba(99,102,241,0.14) 0%,transparent 65%)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      {/* ── Nav ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 11, boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>MD</div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>MetaDash</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', padding: '7px 14px', borderRadius: 8 }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.85)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}>
              Iniciar sesión
            </Link>
            <Link href="/register" style={{ fontSize: 13, fontWeight: 700, color: 'white', textDecoration: 'none', padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 2px 12px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
              Probar gratis →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '150px 24px 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block', boxShadow: '0 0 8px rgba(99,102,241,0.9)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Sistema de infoproductores que venden en piloto automático</span>
          </div>

          <h1 style={{ fontSize: 'clamp(38px,6.5vw,72px)', fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1.02, marginBottom: 24 }}>
            <span style={{ background: 'linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Tu equipo de marketing
            </span>
            <br />
            <span style={{ background: 'linear-gradient(135deg,#818cf8 0%,#a78bfa 50%,#c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              de nivel dios. Por $19/mes.
            </span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, maxWidth: 600, margin: '0 auto 40px' }}>
            8 agentes de IA que analizan tus campañas, crean contenido diario, auditan tu landing y te dan el plan exacto para crecer — sin contratar nadie, sin adivinar.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 28px rgba(79,70,229,0.5), inset 0 1px 0 rgba(255,255,255,0.2)', letterSpacing: '-0.01em' }}>
              Empezar gratis — 7 días
              <Icon name="arrowright" size={18} strokeWidth={2.5} />
            </Link>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '16px 28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
              Ver planes →
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.02em' }}>
            Sin tarjeta de crédito · Sin contrato · Cancelá cuando quieras
          </p>
        </div>
      </section>

      {/* ── PAIN SECTION ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>El problema real</p>
            <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ¿Te pasa alguno de estos?
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PAINS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 14 }}>
                <span style={{ marginTop: 1, flexShrink: 0 }}><XMark /></span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, padding: '20px 24px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#a5b4fc', marginBottom: 4 }}>MetaDash existe para resolver exactamente esto.</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Sin contratar equipo. Sin cursos de meses. Sin adivinar qué funciona.</p>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '60px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 2 }}>
            {[
              { num: '8',    label: 'Agentes especializados', accent: '#6366f1' },
              { num: '14',   label: 'Pasos de lanzamiento guiado', accent: '#8b5cf6' },
              { num: '4',    label: 'Agentes en la Guerra Room', accent: '#ec4899' },
              { num: '24/7', label: 'Monitoreo de campañas', accent: '#3b82f6' },
              { num: '$19',  label: 'Al mes. Todo incluido.', accent: '#10b981' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '28px 16px', background: '#16161a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
                <div style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, letterSpacing: '-0.04em', color: s.accent, marginBottom: 6 }}>{s.num}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUERRA ROOM SPOTLIGHT ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>La diferencia que cambia todo</p>
              <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16, background: 'linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                La Guerra Room.<br />Tu sesión diaria de estrategia.
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 24 }}>
                Cada mañana hacés click en "Arrancar sesión". En minutos, 4 agentes analizaron todo y te dan un plan de 5 acciones ordenadas por impacto — con botón para ejecutar directo en Meta.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '⚡', label: 'Media Buyer', desc: 'Analiza campañas, adsets y creativos' },
                  { icon: '💰', label: 'CFO',         desc: 'Calcula si sos rentable con tu margen real' },
                  { icon: '🎯', label: 'CRO',         desc: 'Revisa dónde perdés conversión en la landing' },
                  { icon: '🎖️', label: 'Commander',   desc: 'Junta todo y te da el plan del día' },
                ].map((a) => (
                  <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>{a.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.06))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '28px', boxShadow: '0 0 60px rgba(99,102,241,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Guerra Room — Sesión de hoy</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 10 }}>EN RIESGO</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'white', lineHeight: 1.5, marginBottom: 6 }}>
                  Tu ROAS bajó de 3.2x a 1.8x en 3 días. Estás gastando $240/día por debajo del breakeven.
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>Acción prioritaria disponible →</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { num: 1, texto: 'Pausar conjunto "Intereses frío" — ROAS 0.9x', tipo: 'ejecutar', riesgo: 'bajo' },
                  { num: 2, texto: 'Escalar "Lookalike 3%" — ROAS 4.1x', tipo: 'revisar', riesgo: 'medio' },
                  { num: 3, texto: 'Probar headline nuevo en landing (CTR 1.2%)', tipo: 'revisar', riesgo: 'medio' },
                ].map((ac) => (
                  <div key={ac.num} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', width: 16, flexShrink: 0 }}>{ac.num}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', flex: 1, lineHeight: 1.4 }}>{ac.texto}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, flexShrink: 0,
                      background: ac.tipo === 'ejecutar' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.15)',
                      color: ac.tipo === 'ejecutar' ? '#a5b4fc' : '#fbbf24',
                    }}>
                      {ac.tipo === 'ejecutar' ? '⚡ Ejecutar' : '👁 Revisar'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Todo lo que necesitás</p>
            <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Una plataforma. Cero fricción.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
            {BENEFITS.map((f) => (
              <div key={f.name}
                style={{ padding: '24px', background: '#16161a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.border = `1px solid ${f.accent}35`; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${f.accent}15`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.accent}15`, border: `1px solid ${f.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.accent, marginBottom: 16 }}>
                  <Icon name={f.icon} size={20} strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 8, letterSpacing: '-0.01em' }}>{f.name}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Cómo funciona</p>
            <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Empezás hoy. Resultados esta semana.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 2 }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ position: 'relative', padding: '28px 24px', background: '#16161a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#4f46e5', marginBottom: 12, letterSpacing: '-0.04em', opacity: 0.6 }}>{s.num}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.55 }}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', right: -1, top: '50%', transform: 'translateY(-50%)', width: 1, height: 40, background: 'linear-gradient(180deg,transparent,rgba(99,102,241,0.3),transparent)' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>La diferencia real</p>
            <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Antes vs. Con MetaDash
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 20, padding: '28px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>❌ Antes</div>
              {[
                'Horas revisando Meta Ads sin saber qué tocar',
                'Contenido TikTok improvisado o inexistente',
                'No sabés si sos rentable hasta que llega el contador',
                'Cada campaña es un experimento caro',
                'El equipo cuesta más de lo que facturás',
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: '#f87171', fontSize: 12, marginTop: 2, flexShrink: 0 }}>✕</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '28px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>✓ Con MetaDash</div>
              {[
                'La Guerra Room te dice exactamente qué hacer en 3 minutos',
                'Un guion TikTok nuevo cada día, listo para grabar',
                'Breakeven ROAS calculado a tu margen real, siempre visible',
                'Los agentes detectan problemas antes de que exploten',
                'Todo por $19/mes. Sin equipo. Sin sorpresas.',
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: '#a5b4fc', fontSize: 12, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Precios simples</p>
            <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 10 }}>
              Menos que un café por día
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>7 días de prueba gratis. Sin tarjeta. Sin compromisos.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, alignItems: 'start' }}>
            {PLANS.map((plan) => (
              <div key={plan.name} style={{
                background: plan.popular ? 'linear-gradient(135deg,rgba(99,102,241,0.13),rgba(139,92,246,0.08))' : '#16161a',
                border: plan.popular ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20, overflow: 'hidden',
                boxShadow: plan.popular ? '0 0 60px rgba(99,102,241,0.14), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
                transform: plan.popular ? 'scale(1.02)' : 'none',
              }}>
                {plan.badge && (
                  <div style={{ textAlign: 'center', padding: '9px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', fontSize: 10, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ padding: '28px 24px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: plan.accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 42, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>${plan.price}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', paddingBottom: 5 }}>USD / mes</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>{plan.desc}</p>

                  <Link href="/register" style={{
                    display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12,
                    fontWeight: 800, fontSize: 14, textDecoration: 'none', marginBottom: 8,
                    background: plan.popular ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : `${plan.accent}18`,
                    color: plan.popular ? 'white' : plan.accent,
                    border: plan.popular ? 'none' : `1px solid ${plan.accent}30`,
                    boxShadow: plan.popular ? '0 6px 20px rgba(79,70,229,0.4)' : 'none',
                  }}>
                    {plan.cta}
                  </Link>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginBottom: 20 }}>{plan.ctaNote}</p>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {plan.features.map((f) => (
                        <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <span style={{ marginTop: 1, flexShrink: 0 }}><Check color={plan.accent} /></span>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
              ¿Tenés más de 3 productos o necesitás algo a medida? <a href="mailto:hola@metadash.app" style={{ color: '#6366f1', textDecoration: 'none' }}>Hablemos →</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 800, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 40, background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Preguntas frecuentes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: '#16161a', border: `1px solid ${openFaq === i ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'white', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: openFaq === i ? 'white' : 'rgba(255,255,255,0.8)', paddingRight: 16 }}>{faq.q}</span>
                  <span style={{ color: openFaq === i ? '#6366f1' : 'rgba(255,255,255,0.25)', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none', display: 'block' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginTop: 14 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '120px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%,rgba(99,102,241,0.12) 0%,transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 40px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            <Icon name="rocket" size={28} strokeWidth={1.75} />
          </div>
          <h2 style={{ fontSize: 'clamp(30px,5vw,48px)', fontWeight: 900, letterSpacing: '-0.045em', background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 14 }}>
            El mejor momento<br />era ayer. El segundo es ahora.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginBottom: 36, lineHeight: 1.6 }}>
            7 días gratis. Sin tarjeta. Si no es para vos, no pagás nada.<br />Si es para vos, $19/mes cambia todo.
          </p>
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 44px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 16, color: 'white', fontWeight: 800, fontSize: 17, textDecoration: 'none', boxShadow: '0 12px 40px rgba(79,70,229,0.55), inset 0 1px 0 rgba(255,255,255,0.2)', letterSpacing: '-0.01em' }}>
            Empezar gratis ahora
            <Icon name="arrowright" size={20} strokeWidth={2.5} />
          </Link>
          <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
            Sin tarjeta · Sin contrato · Cancelás cuando querés
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 9 }}>MD</div>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>MetaDash</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>
            © 2026 MetaDash · SSL · Backups automáticos · Hecho para infoproductores de LATAM
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacidad', 'Términos', 'Contacto'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.2)'}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
