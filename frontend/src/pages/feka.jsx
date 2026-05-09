'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';

// =====================================================================
// FEKA · Programa de Afiliados — Landing high-converting (Next.js port)
// Alineado al mockup de referencia. Image slots con data-feka-slot
// listos para pegar los mockups del usuario.
// =====================================================================

const GOLD = '#C8A24B';
const GOLD_SOFT = '#E8C77A';
const GOLD_BRIGHT = '#F4D27A';
const NAVY_0 = '#05080F';
const NAVY_1 = '#0A0F1C';
const NAVY_2 = '#0F1628';
const NAVY_3 = '#161D32';
const TEXT = '#F4F1EA';
const TEXT_DIM = 'rgba(244,241,234,0.62)';
const HAIRLINE = 'rgba(232,199,122,0.18)';
const GREEN = '#5CD9A0';
const RED = '#F26B6B';

const SERIF = "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const BREAKPOINT = 860;

function useViewport() {
  const [w, setW] = useState(1280);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    onR();
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return { width: w, isMobile: w < BREAKPOINT };
}

// ---------------------------------------------------------------------
// Image slot — replace `src` with the user's mockup paths when uploaded
// (e.g. /images/feka/hero.png inside frontend/public/images/feka/)
// ---------------------------------------------------------------------
function ImageSlot({ src, alt, label, ratio = '4 / 3', radius = 18, style }) {
  if (src) {
    return (
      <div style={{ position: 'relative', width: '100%', aspectRatio: ratio, borderRadius: radius, overflow: 'hidden', border: `1px solid ${HAIRLINE}`, background: NAVY_2, ...style }}>
        <img src={src} alt={alt || label || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }
  return (
    <div data-feka-slot={label} style={{
      position: 'relative', width: '100%', aspectRatio: ratio, borderRadius: radius,
      border: `1px dashed ${HAIRLINE}`,
      background: `linear-gradient(135deg, rgba(15,22,40,0.9), rgba(5,8,15,0.9))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(232,199,122,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(232,199,122,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div style={{ position: 'relative', textAlign: 'center', padding: 20 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, color: GOLD_SOFT, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>Mockup</div>
        <div style={{ marginTop: 6, fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: TEXT_DIM }}>{label || 'imagen'}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------
function GIcon({ name, size = 22, color = GOLD }) {
  const s = { width: size, height: size, stroke: color, fill: 'none', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'rocket':   return <svg viewBox="0 0 24 24" {...s}><path d="M14 4c4 0 6 2 6 6-2 0-3 .5-4 1.5L9 18l-3-3 6.5-7C13.5 7 14 6 14 4z"/><path d="M9 18l-3 3M14 4l-3 3"/><circle cx="15" cy="9" r="1.5"/></svg>;
    case 'shield':   return <svg viewBox="0 0 24 24" {...s}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>;
    case 'lock':     return <svg viewBox="0 0 24 24" {...s}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>;
    case 'star':     return <svg viewBox="0 0 24 24" fill={color} stroke="none"><path d="M12 2l3 6.5 7 1-5 5 1.5 7L12 18l-6.5 3.5L7 14.5l-5-5 7-1L12 2z"/></svg>;
    case 'check':    return <svg viewBox="0 0 24 24" {...s}><path d="M5 12l5 5L20 7"/></svg>;
    case 'check-fill': return <svg viewBox="0 0 24 24" fill={color} stroke="none"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 14l-4-4 1.4-1.4L11 13.2l5.6-5.6L18 9l-7 7z"/></svg>;
    case 'x':        return <svg viewBox="0 0 24 24" {...s}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'x-fill':   return <svg viewBox="0 0 24 24" fill={color} stroke="none"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4 13.4L14.4 17 12 14.6 9.6 17 8 15.4 10.4 13 8 10.6 9.6 9 12 11.4 14.4 9 16 10.6 13.6 13 16 15.4z"/></svg>;
    case 'arrow':    return <svg viewBox="0 0 24 24" {...s}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'plus':     return <svg viewBox="0 0 24 24" {...s}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus':    return <svg viewBox="0 0 24 24" {...s}><path d="M5 12h14"/></svg>;
    case 'cloud':    return <svg viewBox="0 0 24 24" {...s}><path d="M7 18a4 4 0 010-8 5 5 0 0110-1 4 4 0 011 8H7z"/><path d="M12 13v5M9 16l3 3 3-3"/></svg>;
    case 'truck':    return <svg viewBox="0 0 24 24" {...s}><path d="M2 7h12v10H2zM14 11h5l3 3v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>;
    case 'badge':    return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="10" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/></svg>;
    case 'q':        return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4M12 17h.01"/></svg>;
    case 'handshake':return <svg viewBox="0 0 24 24" {...s}><path d="M3 12l4-4 3 2 4-4 7 6-4 4-3-2-4 4z"/><path d="M9 16l3-3"/></svg>;
    case 'phone':    return <svg viewBox="0 0 24 24" {...s}><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>;
    case 'cash':     return <svg viewBox="0 0 24 24" {...s}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 9v6M19 9v6"/></svg>;
    default: return null;
  }
}

// ---------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------

function GoldButton({ children, full, size = 'md', icon = 'arrow', onClick, leftIcon }) {
  const sizes = {
    sm: { pad: '12px 22px', font: 12 },
    md: { pad: '16px 30px', font: 13 },
    lg: { pad: '20px 38px', font: 14 },
    xl: { pad: '22px 44px', font: 15 },
  };
  const sz = sizes[size];
  return (
    <button
      onClick={onClick || (() => { if (typeof window !== 'undefined') document.getElementById('final-offer')?.scrollIntoView({ behavior: 'smooth' }); })}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        width: full ? '100%' : 'auto',
        padding: sz.pad,
        background: `linear-gradient(180deg, ${GOLD_BRIGHT} 0%, ${GOLD} 100%)`,
        color: '#1A1407',
        border: 'none',
        borderRadius: 14,
        fontFamily: SANS, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        fontSize: sz.font, cursor: 'pointer',
        boxShadow: '0 14px 40px rgba(200,162,75,0.28), inset 0 1px 0 rgba(255,255,255,0.45)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 18px 48px rgba(200,162,75,0.4), inset 0 1px 0 rgba(255,255,255,0.5)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(200,162,75,0.28), inset 0 1px 0 rgba(255,255,255,0.45)'; }}
    >
      {leftIcon && <GIcon name={leftIcon} size={16} color="#1A1407" />}
      {children}
      {icon && <GIcon name={icon} size={16} color="#1A1407" />}
    </button>
  );
}

function Eyebrow({ children, dot = true }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 999, border: `1px solid ${HAIRLINE}`, background: 'rgba(200,162,75,0.04)' }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: GOLD, boxShadow: `0 0 12px ${GOLD}` }} />}
      <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD_SOFT }}>{children}</span>
    </div>
  );
}

function Stars({ rating = 4.9, size = 14 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'inline-flex', gap: 2 }}>
        {[0, 1, 2, 3, 4].map((i) => <GIcon key={i} name="star" size={size} color={GOLD_BRIGHT} />)}
      </div>
      <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT }}>{rating}/5</span>
    </div>
  );
}

function FekaLogo({ size = 'md' }) {
  const isLg = size === 'lg';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: isLg ? 38 : 32, height: isLg ? 38 : 32, borderRadius: 9, background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 600, color: '#1A1407', fontSize: isLg ? 20 : 17 }}>F</div>
      <div style={{ fontFamily: SERIF, fontSize: isLg ? 28 : 22, color: TEXT, letterSpacing: '0.1em', fontWeight: 500 }}>FEKA</div>
    </div>
  );
}

// ---------------------------------------------------------------------
// SECTION 1 — HERO
// ---------------------------------------------------------------------
function Hero({ isMobile }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: NAVY_0 }}>
      {/* Backdrop */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(1100px 700px at 80% 5%, rgba(200,162,75,0.14), transparent 60%), radial-gradient(900px 600px at 0% 90%, rgba(20,40,90,0.55), transparent 55%), linear-gradient(180deg, ${NAVY_0} 0%, ${NAVY_1} 100%)` }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(232,199,122,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,199,122,0.04) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 70%)' }} />

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: isMobile ? '20px 22px' : '26px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <FekaLogo />
          {!isMobile && <span style={{ fontFamily: SANS, fontSize: 11, color: GOLD_SOFT, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>· Programa de Afiliados</span>}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, border: `1px solid ${HAIRLINE}`, background: 'rgba(200,162,75,0.06)' }}>
          <GIcon name="rocket" size={14} color={GOLD_SOFT} />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: SANS, fontSize: 11, color: GOLD_SOFT, fontWeight: 700, letterSpacing: '0.18em' }}>LANZAMIENTO</div>
            {!isMobile && <div style={{ fontFamily: SANS, fontSize: 9, color: TEXT_DIM, letterSpacing: '0.14em', marginTop: 2 }}>ACCESO POR TIEMPO LIMITADO</div>}
          </div>
        </div>
      </div>

      {/* Main hero */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: isMobile ? '12px 22px 60px' : '24px 40px 110px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.05fr 0.95fr', gap: isMobile ? 40 : 60, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 11, color: GOLD_SOFT, letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 600 }}>Sistema de Ingresos Recurrentes</div>

          <h1 style={{ marginTop: 18, fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 46 : 78, lineHeight: 1.0, letterSpacing: '-0.025em', color: TEXT }}>
            Ingresos que<br />
            no dependen<br />
            de un <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>jefe.</span><br />
            Ni de un <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>producto.</span><br />
            Ni de inventar <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>nada.</span>
          </h1>

          <p style={{ marginTop: 26, fontFamily: SANS, fontSize: isMobile ? 15 : 17, lineHeight: 1.6, color: TEXT_DIM, maxWidth: 520 }}>
            Un sistema real para generar comisiones recurrentes conectando restaurantes con tecnología que ya necesitan.
          </p>

          {/* Bullet list */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '28px 0 0', display: 'grid', gap: 12 }}>
            {['Sin inversión inicial', 'Sin producto propio', 'En uno de los mercados más grandes y menos digitalizados de Argentina.'].map((b) => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <GIcon name="check-fill" size={20} color={GOLD_SOFT} />
                <span style={{ fontFamily: SANS, fontSize: 14, color: TEXT, lineHeight: 1.5 }}>{b}</span>
              </li>
            ))}
          </ul>

          {/* Price */}
          <div style={{ marginTop: 36 }}>
            <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_DIM, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>Antes</div>
            <div style={{ marginTop: 4, position: 'relative', display: 'inline-block' }}>
              <span style={{ fontFamily: SERIF, fontSize: isMobile ? 28 : 34, color: 'rgba(244,241,234,0.55)', fontWeight: 500 }}>$157.000 ARS</span>
              <span aria-hidden style={{ position: 'absolute', left: -4, right: -4, top: '52%', height: 2, background: GOLD_SOFT, transform: 'rotate(-6deg)' }} />
            </div>

            <div style={{ marginTop: 16, padding: isMobile ? '20px 22px' : '24px 28px', borderRadius: 18, border: `1px solid ${HAIRLINE}`, background: `linear-gradient(180deg, rgba(200,162,75,0.08), rgba(200,162,75,0.02))`, position: 'relative', maxWidth: 480 }}>
              <span style={{ position: 'absolute', top: -12, left: 22, padding: '5px 12px', borderRadius: 999, background: `linear-gradient(180deg, ${GOLD_BRIGHT}, ${GOLD})`, color: '#1A1407', fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em' }}>HOY SOLO</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: SERIF, fontSize: isMobile ? 56 : 76, fontWeight: 600, color: GOLD_BRIGHT, letterSpacing: '-0.025em', lineHeight: 1 }}>$14.900</span>
                <span style={{ fontFamily: SANS, fontSize: 16, color: GOLD_SOFT, fontWeight: 600, letterSpacing: '0.06em' }}>ARS</span>
              </div>
              <div style={{ marginTop: 10, fontFamily: SANS, fontSize: 11, color: TEXT_DIM, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                Acceso lanzamiento por tiempo limitado
              </div>
            </div>
          </div>

          {/* Stars + affiliates */}
          <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, maxWidth: 540 }}>
            <div style={{ padding: '14px 18px', borderRadius: 14, border: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.02)' }}>
              <Stars />
              <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 11, color: TEXT_DIM, lineHeight: 1.4 }}>Más de 1.200 restaurantes activos en FEKA</div>
            </div>
            <div style={{ padding: '14px 18px', borderRadius: 14, border: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: 999, marginLeft: i === 0 ? 0 : -8, background: `linear-gradient(135deg, ${GOLD_SOFT}, ${NAVY_2})`, border: `2px solid ${NAVY_0}` }} />
                ))}
                <div style={{ marginLeft: -8, padding: '4px 8px', borderRadius: 999, background: NAVY_2, border: `2px solid ${NAVY_0}`, fontFamily: SANS, fontSize: 11, color: TEXT, fontWeight: 600 }}>+1.200</div>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_DIM, lineHeight: 1.4 }}>Afiliados activos generando ingresos recurrentes</div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 28 }}>
            <GoldButton size="lg" leftIcon="lock" full={isMobile}>Quiero acceder al sistema</GoldButton>
            <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, border: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.02)' }}>
              <GIcon name="shield" size={14} color={GOLD_SOFT} />
              <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Garantía total de 7 días</span>
            </div>
            <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 12, color: TEXT_DIM }}>Probalo sin riesgos. Si no te convence, te devolvemos tu dinero.</div>
          </div>
        </div>

        {/* Right: hero image slot */}
        <div style={{ position: 'relative' }}>
          <div aria-hidden style={{ position: 'absolute', inset: '-30px', background: `radial-gradient(closest-side, rgba(200,162,75,0.20), transparent 70%)`, filter: 'blur(20px)' }} />
          <ImageSlot
            label="hero — emprendedor + dashboard FEKA"
            ratio={isMobile ? '4 / 5' : '4 / 5'}
            radius={20}
            style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.65)' }}
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// SECTION 2 — TRUST BAR
// ---------------------------------------------------------------------
const TRUST = [
  { icon: 'rocket', title: 'Acceso inmediato',     desc: 'Descargá y empezá hoy mismo.' },
  { icon: 'lock',   title: 'Pago seguro',          desc: 'Tus datos y pagos 100% protegidos.' },
  { icon: 'badge',  title: 'Garantía 7 días',      desc: 'Probalo sin riesgos. Te devolvemos tu dinero.' },
  { icon: 'cloud',  title: 'Sistema completo',     desc: '6 documentos premium listos para usar.' },
];

function TrustBar({ isMobile }) {
  return (
    <section style={{ background: NAVY_1, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '36px 22px' : '44px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 18 : 28 }}>
          {TRUST.map((t) => (
            <div key={t.title} style={{ textAlign: 'center', padding: '6px 12px' }}>
              <div style={{ width: 48, height: 48, margin: '0 auto', borderRadius: 12, border: `1px solid ${HAIRLINE}`, background: 'rgba(200,162,75,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GIcon name={t.icon} size={20} />
              </div>
              <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 12, color: GOLD_SOFT, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{t.title}</div>
              <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 12, color: TEXT_DIM, lineHeight: 1.5, maxWidth: 200, marginLeft: 'auto', marginRight: 'auto' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// SECTION 3 — MARKET OPPORTUNITY (180.000 + 1.200)
// ---------------------------------------------------------------------
function ArgentinaMap({ size = 180 }) {
  return (
    <svg viewBox="0 0 100 200" width={size} height={size * 2} style={{ display: 'block' }}>
      <path
        d="M52 8 C58 14 60 22 56 30 C62 36 64 48 60 56 C66 62 68 76 62 86 C68 92 68 108 60 116 C66 124 64 138 56 144 C60 154 56 166 48 172 C52 180 46 190 40 192 C36 184 32 176 30 168 C26 160 22 150 24 142 C20 132 24 122 28 114 C24 104 28 92 32 84 C28 74 32 62 36 54 C32 46 36 34 40 26 C44 18 48 12 52 8 Z"
        fill="rgba(200,162,75,0.10)" stroke={GOLD_SOFT} strokeWidth="0.6"
      />
      <circle cx="42" cy="60" r="2" fill={GOLD_BRIGHT} />
      <circle cx="44" cy="84" r="2" fill={GOLD_BRIGHT} />
      <circle cx="40" cy="110" r="2" fill={GOLD_BRIGHT} />
      <circle cx="36" cy="140" r="2" fill={GOLD_BRIGHT} />
      <circle cx="48" cy="40" r="2.5" fill={GOLD_BRIGHT} />
    </svg>
  );
}

function MarketOpportunity({ isMobile }) {
  return (
    <section style={{ background: NAVY_0, position: 'relative', padding: isMobile ? '90px 22px' : '140px 40px', borderTop: `1px solid ${HAIRLINE}` }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(700px 500px at 50% 0%, rgba(200,162,75,0.08), transparent 60%)` }} />
      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <Eyebrow>El mercado gastronómico en Argentina</Eyebrow>
        </div>

        <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr', gap: isMobile ? 30 : 60, alignItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: isMobile ? 60 : 96, fontWeight: 500, color: GOLD_BRIGHT, letterSpacing: '-0.03em', lineHeight: 1 }}>180.000+</div>
            <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 13, color: TEXT, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>Locales Gastronómicos</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_DIM, marginTop: 6 }}>en Argentina</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ArgentinaMap size={isMobile ? 110 : 140} />
          </div>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: isMobile ? 60 : 96, fontWeight: 500, color: GOLD_BRIGHT, letterSpacing: '-0.03em', lineHeight: 1 }}>1.200+</div>
            <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 13, color: TEXT, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>Restaurantes Activos</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_DIM, marginTop: 6 }}>ya confían en FEKA</div>
          </div>
        </div>

        <div style={{ marginTop: 60, padding: isMobile ? '24px' : '32px 40px', borderRadius: 18, border: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, border: `1px solid ${HAIRLINE}`, background: 'rgba(200,162,75,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GIcon name="badge" size={22} />
          </div>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 14, color: TEXT_DIM, lineHeight: 1.55 }}>Un mercado gigante. Un problema real. Una solución que ya funciona.</div>
            <div style={{ marginTop: 4, fontFamily: SERIF, fontSize: isMobile ? 18 : 22, color: TEXT, fontWeight: 500 }}>Tu rol es conectar. Nosotros hacemos el resto.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// SECTION 4 — PUNTO DE DOLOR (oportunidades que estás dejando pasar)
// ---------------------------------------------------------------------
const PAIN_POINTS = [
  { icon: 'cash',  t: 'Regalas hasta el 35% de cada venta a Rappi o PedidosYa', s: 'Tu esfuerzo. Su ganancia.' },
  { icon: 'truck', t: 'Tu carta física cuesta caro, se desactualiza y da una mala imagen', s: 'Perdés tiempo y dinero.' },
  { icon: 'q',     t: 'No tenés datos propios de tus clientes', s: 'Rappi los tiene. Vos no.' },
];

function PainPoints({ isMobile }) {
  return (
    <section style={{ background: NAVY_1, padding: isMobile ? '90px 22px' : '140px 40px', borderTop: `1px solid ${HAIRLINE}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 50 : 80, alignItems: 'center' }}>
          <div>
            <Eyebrow>Punto de dolor</Eyebrow>
            <h2 style={{ marginTop: 22, fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 38 : 56, lineHeight: 1.05, letterSpacing: '-0.02em', color: TEXT }}>
              ¿Cuántas <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>oportunidades</span> estás dejando pasar por no tener un sistema propio?
            </h2>

            <div style={{ marginTop: 36, display: 'grid', gap: 18 }}>
              {PAIN_POINTS.map((p) => (
                <div key={p.t} style={{ display: 'flex', gap: 16, padding: '18px 20px', borderRadius: 14, border: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${HAIRLINE}`, background: 'rgba(242,107,107,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GIcon name={p.icon} size={20} color={GOLD_SOFT} />
                  </div>
                  <div>
                    <div style={{ fontFamily: SANS, fontSize: 14, color: TEXT, fontWeight: 600, lineHeight: 1.5 }}>{p.t}</div>
                    <div style={{ marginTop: 4, fontFamily: SANS, fontSize: 12, color: TEXT_DIM }}>{p.s}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 32, padding: '16px 20px', borderRadius: 12, border: `1px solid rgba(242,107,107,0.25)`, background: 'rgba(242,107,107,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT, lineHeight: 1.5 }}>El mercado gastronómico argentino está dolido. Y nadie lo está resolviendo de verdad.</div>
            </div>
          </div>

          <ImageSlot label="emprendedor frustrado / mockup punto de dolor" ratio="3 / 4" radius={20} />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// SECTION 5 — ANTES / DESPUÉS
// ---------------------------------------------------------------------
const BEFORE_AFTER = [
  { before: 'Paga comisiones altas (20%–35%)',     after: 'Ahorra y aumenta sus ganancias' },
  { before: 'Carta física cara y desactualizada',   after: 'Carta digital siempre actualizada' },
  { before: 'Errores en pedidos y clientes molestos', after: 'Pedidos en tiempo real y sin errores' },
  { before: 'No factura o lo hace mal (riesgo ARCA)', after: 'Facturación electrónica correcta y automática' },
  { before: 'Rappi tiene los datos de sus clientes',  after: 'Él tiene sus datos y sus clientes' },
];

function BeforeAfter({ isMobile }) {
  return (
    <section style={{ background: NAVY_0, padding: isMobile ? '90px 22px' : '140px 40px', borderTop: `1px solid ${HAIRLINE}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <Eyebrow>Beneficios</Eyebrow>
          <h2 style={{ marginTop: 22, fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 38 : 56, lineHeight: 1.05, letterSpacing: '-0.02em', color: TEXT }}>
            Transformá su problema en <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>tu oportunidad.</span>
          </h2>
        </div>

        <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr', gap: isMobile ? 14 : 24, alignItems: 'stretch' }}>
          {/* ANTES col header */}
          {!isMobile && (
            <>
              <div style={{ padding: '14px 22px', borderRadius: 12, background: 'rgba(242,107,107,0.10)', border: `1px solid rgba(242,107,107,0.25)`, textAlign: 'center', fontFamily: SANS, fontSize: 12, color: RED, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Antes</div>
              <div />
              <div style={{ padding: '14px 22px', borderRadius: 12, background: 'rgba(92,217,160,0.10)', border: `1px solid rgba(92,217,160,0.25)`, textAlign: 'center', fontFamily: SANS, fontSize: 12, color: GREEN, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Después</div>
            </>
          )}

          {BEFORE_AFTER.map((row, i) => (
            <BeforeAfterRow key={i} before={row.before} after={row.after} isMobile={isMobile} />
          ))}
        </div>

        <div style={{ marginTop: 56, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center', padding: '16px 28px', borderRadius: 999, border: `1px solid rgba(92,217,160,0.25)`, background: 'rgba(92,217,160,0.06)' }}>
            {['+ AHORRA', '+ VENDE', '+ CRECE'].map((t) => (
              <span key={t} style={{ fontFamily: SANS, fontSize: 13, color: GREEN, fontWeight: 700, letterSpacing: '0.18em' }}>{t}</span>
            ))}
          </div>
          <div style={{ marginTop: 20, fontFamily: SERIF, fontStyle: 'italic', fontSize: isMobile ? 20 : 26, color: TEXT, fontWeight: 500 }}>
            Vos ganás. Ellos ganan. Todos ganan.
          </div>
        </div>
      </div>
    </section>
  );
}

function BeforeAfterRow({ before, after, isMobile }) {
  return (
    <>
      <div style={{ padding: isMobile ? '16px 18px' : '20px 22px', borderRadius: 14, border: `1px solid rgba(242,107,107,0.18)`, background: 'rgba(242,107,107,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <GIcon name="x-fill" size={20} color={RED} />
        <span style={{ fontFamily: SANS, fontSize: 14, color: TEXT, lineHeight: 1.45 }}>{before}</span>
      </div>
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GIcon name="arrow" size={22} color={GOLD_SOFT} />
        </div>
      )}
      <div style={{ padding: isMobile ? '16px 18px' : '20px 22px', borderRadius: 14, border: `1px solid rgba(92,217,160,0.18)`, background: 'rgba(92,217,160,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <GIcon name="check-fill" size={20} color={GREEN} />
        <span style={{ fontFamily: SANS, fontSize: 14, color: TEXT, lineHeight: 1.45, fontWeight: 500 }}>{after}</span>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------
// SECTION 6 — TECH (TECNOLOGÍA QUE CONECTA. SISTEMA QUE GENERA.)
// ---------------------------------------------------------------------
const TECH_BENEFITS = [
  { icon: 'badge',     title: 'Facturación ARCA',  desc: 'Cumplimiento fiscal real, sin riesgo.' },
  { icon: 'truck',     title: 'Delivery propio 0% comisión',   desc: 'El cliente es tuyo, no de la app.' },
  { icon: 'handshake', title: 'Tus datos, tus clientes',         desc: 'Construí relaciones que te pertenecen.' },
];

function TechSection({ isMobile }) {
  return (
    <section style={{ background: NAVY_1, padding: isMobile ? '90px 22px' : '140px 40px', borderTop: `1px solid ${HAIRLINE}`, position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(800px 500px at 50% 50%, rgba(200,162,75,0.10), transparent 60%)` }} />
      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <Eyebrow>Características</Eyebrow>
          <h2 style={{ marginTop: 22, fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 38 : 56, lineHeight: 1.05, letterSpacing: '-0.02em', color: TEXT }}>
            Tecnología que <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>conecta.</span><br/>
            Sistema que <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>genera.</span>
          </h2>
        </div>

        <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center' }}>
          <ImageSlot label="GIF / mockup del producto FEKA" ratio="16 / 10" radius={22} style={{ maxWidth: 880 }} />
        </div>

        <div style={{ marginTop: 50, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 16 : 22 }}>
          {TECH_BENEFITS.map((b) => (
            <div key={b.title} style={{ padding: '28px', borderRadius: 18, border: `1px solid ${HAIRLINE}`, background: `linear-gradient(180deg, rgba(22,29,50,0.7), rgba(10,15,28,0.7))`, textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, margin: '0 auto', borderRadius: 999, border: `1px solid ${HAIRLINE}`, background: 'rgba(200,162,75,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GIcon name={b.icon} size={22} />
              </div>
              <h3 style={{ marginTop: 18, fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT, letterSpacing: '-0.01em' }}>{b.title}</h3>
              <p style={{ marginTop: 8, fontFamily: SANS, fontSize: 13, color: TEXT_DIM, lineHeight: 1.6 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// SECTION 7 — RESEÑAS DE AFILIADOS (testimonials)
// ---------------------------------------------------------------------
const TESTIMONIALS = [
  { name: 'Martín González',  city: 'Córdoba, Córdoba',           rating: '4.9/5', t: 'En mi primer mes activé 6 locales y ya estoy generando ingresos recurrentes. El sistema es oro puro, todo está explicado.' },
  { name: 'Florencia Duarte',  city: 'Rosario, Santa Fe',          rating: '4.8/5', t: 'Me encanta que no dependés de redes ni de crear contenido. Acá vas directo a lo que importa: conectar y ganar.' },
  { name: 'Lucas Peralta',     city: 'Mendoza, Mendoza',           rating: '4.9/5', t: 'El workbook de 90 días me mantuvo enfocado. Hoy tengo 20 locales activos y los ingresos siguen subiendo.' },
  { name: 'Nicolás Romero',    city: 'Mar del Plata, Bs As',       rating: '4.8/5', t: 'Los scripts son brutales, te dan confianza para hablar con cualquier dueño. Totalmente recomendado.' },
  { name: 'Lautaro Silva',     city: 'Salta, Salta',               rating: '5/5',   t: 'Arranqué sin experiencia y hoy tengo 8 locales activos. El cerrador es una locura, te da seguridad total.' },
];

function Testimonials({ isMobile }) {
  const [idx, setIdx] = useState(0);
  const visible = isMobile ? 1 : 4;
  const max = Math.max(0, TESTIMONIALS.length - visible);

  return (
    <section style={{ background: NAVY_0, padding: isMobile ? '90px 22px' : '140px 40px', borderTop: `1px solid ${HAIRLINE}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <Eyebrow>Reseñas de Afiliados</Eyebrow>
            <h2 style={{ marginTop: 18, fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 32 : 44, lineHeight: 1.1, letterSpacing: '-0.02em', color: TEXT }}>
              Argentinos comunes.<br /><span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>Aplicando el método.</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button aria-label="anterior" onClick={() => setIdx((i) => Math.max(0, i - 1))} style={navBtn(idx === 0, true)}>
              <GIcon name="arrow" size={16} color={GOLD_SOFT} />
            </button>
            <button aria-label="siguiente" onClick={() => setIdx((i) => Math.min(max, i + 1))} style={navBtn(idx >= max)}>
              <GIcon name="arrow" size={16} color={GOLD_SOFT} />
            </button>
          </div>
        </div>

        <div style={{ marginTop: 40, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 18, transform: `translateX(calc(${-idx} * (${100 / visible}% + ${18 - 18 / visible}px)))`, transition: 'transform 380ms cubic-bezier(0.22,0.61,0.36,1)' }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{ flex: `0 0 calc(${100 / visible}% - ${(18 * (visible - 1)) / visible}px)`, padding: '24px', borderRadius: 18, border: `1px solid ${HAIRLINE}`, background: `linear-gradient(180deg, rgba(22,29,50,0.7), rgba(10,15,28,0.7))` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: `linear-gradient(135deg, ${GOLD_SOFT}, ${NAVY_3})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, color: NAVY_0, fontSize: 18, fontWeight: 600, flexShrink: 0 }}>{t.name.charAt(0)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{t.city}</div>
                  </div>
                </div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {[0, 1, 2, 3, 4].map((i) => <GIcon key={i} name="star" size={12} color={GOLD_BRIGHT} />)}
                  <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT, fontWeight: 600 }}>{t.rating}</span>
                </div>
                <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 6, background: 'rgba(92,217,160,0.10)', border: `1px solid rgba(92,217,160,0.2)` }}>
                  <GIcon name="check" size={11} color={GREEN} />
                  <span style={{ fontFamily: SANS, fontSize: 10, color: GREEN, fontWeight: 600, letterSpacing: '0.1em' }}>VERIFICADO</span>
                </div>
                <p style={{ marginTop: 18, fontFamily: SANS, fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, color: TEXT_DIM }}>“{t.t}”</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function navBtn(disabled, flip) {
  return {
    width: 46, height: 46, borderRadius: 999,
    border: `1px solid ${HAIRLINE}`,
    background: 'rgba(255,255,255,0.02)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    transform: flip ? 'scaleX(-1)' : 'none',
  };
}

// ---------------------------------------------------------------------
// SECTION 8 — CÓMO FUNCIONA
// ---------------------------------------------------------------------
const STEPS = [
  { n: '1', title: 'Conectás', desc: 'Identificás restaurantes que necesitan digitalizarse y les mostrás la solución FEKA.', img: 'paso 1 — handshake / conexión' },
  { n: '2', title: 'Activás',  desc: 'Ellos activan FEKA y vos ganás tu comisión todos los meses mientras sigan activos.', img: 'paso 2 — activación / setup' },
  { n: '3', title: 'Cobrás',   desc: 'Ingresos recurrentes, sin techo y sin depender de un jefe.', img: 'paso 3 — comisión recibida' },
];

function HowItWorks({ isMobile }) {
  return (
    <section style={{ background: NAVY_1, padding: isMobile ? '90px 22px' : '140px 40px', borderTop: `1px solid ${HAIRLINE}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <Eyebrow>Cómo funciona</Eyebrow>
          <h2 style={{ marginTop: 22, fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 38 : 56, lineHeight: 1.05, letterSpacing: '-0.02em', color: TEXT }}>
            3 pasos para generar <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>ingresos recurrentes.</span>
          </h2>
        </div>

        <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 22 : 28 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ borderRadius: 20, border: `1px solid ${HAIRLINE}`, background: `linear-gradient(180deg, rgba(22,29,50,0.7), rgba(10,15,28,0.7))`, overflow: 'hidden' }}>
              <ImageSlot label={s.img} ratio="4 / 3" radius={0} style={{ borderRadius: 0, border: 'none', borderBottom: `1px solid ${HAIRLINE}` }} />
              <div style={{ padding: '24px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, color: '#1A1407', fontSize: 18, fontWeight: 700 }}>{s.n}</div>
                  <h3 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, color: TEXT, letterSpacing: '-0.01em', margin: 0 }}>{s.title}</h3>
                </div>
                <p style={{ marginTop: 14, fontFamily: SANS, fontSize: 14, color: TEXT_DIM, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: isMobile ? 18 : 22, color: TEXT_DIM }}>
          Sin inversión. Sin stock. Sin complicaciones.<br/>
          <span style={{ color: TEXT, fontStyle: 'normal', fontWeight: 500 }}>Solo conexión y resultados.</span>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// SECTION 9 — QUÉ INCLUYE
// ---------------------------------------------------------------------
const INCLUDED = [
  { title: 'Manual del Afiliado FEKA', sub: '12 capítulos' },
  { title: 'Workbook 90 días',         sub: 'Plan operativo paso a paso' },
  { title: 'Lab de Prompts IA',        sub: '21 prompts probados' },
  { title: 'Scripts listos',           sub: 'Para copiar y adaptar' },
  { title: '10 Cierres Reales',        sub: 'Conversaciones disecadas' },
];

function WhatsIncluded({ isMobile }) {
  return (
    <section style={{ background: NAVY_0, padding: isMobile ? '90px 22px' : '140px 40px', borderTop: `1px solid ${HAIRLINE}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <Eyebrow>¿Qué incluye?</Eyebrow>
          <h2 style={{ marginTop: 22, fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 38 : 56, lineHeight: 1.05, letterSpacing: '-0.02em', color: TEXT }}>
            Todo lo que necesitás para empezar <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>hoy.</span>
          </h2>
        </div>

        <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr 1fr', gap: 28, alignItems: 'center' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {INCLUDED.slice(0, 3).map((i) => <IncludedItem key={i.title} {...i} align="right" isMobile={isMobile} />)}
          </div>
          <div>
            <ImageSlot label="bundle FEKA — todos los activos" ratio="1 / 1" radius={20} />
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {INCLUDED.slice(3).map((i) => <IncludedItem key={i.title} {...i} align="left" isMobile={isMobile} />)}
          </div>
        </div>

        <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { icon: 'rocket', t: 'Acceso Inmediato' },
            { icon: 'lock',   t: 'Pago Seguro' },
            { icon: 'shield', t: 'Garantía 7 Días' },
            { icon: 'cloud',  t: 'Descarga Inmediata' },
          ].map((c) => (
            <div key={c.t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, border: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.02)' }}>
              <GIcon name={c.icon} size={16} color={GOLD_SOFT} />
              <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{c.t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IncludedItem({ title, sub, align, isMobile }) {
  return (
    <div style={{ padding: '18px 20px', borderRadius: 14, border: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.02)', textAlign: isMobile ? 'left' : align }}>
      <div style={{ fontFamily: SERIF, fontSize: 19, color: TEXT, fontWeight: 500, letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ marginTop: 4, fontFamily: SANS, fontSize: 12, color: GOLD_SOFT, fontWeight: 600, letterSpacing: '0.06em' }}>{sub}</div>
    </div>
  );
}

// ---------------------------------------------------------------------
// SECTION 10 — POR QUÉ CON NOSOTROS (comparison)
// ---------------------------------------------------------------------
const COMPARE_ROWS = [
  { ours: 'Garantía 7 días sin riesgos',          theirs: 'Sin garantía o garantías limitadas' },
  { ours: 'Calidad garantizada',                  theirs: 'Contenido genérico y desactualizado' },
  { ours: 'Acceso inmediato a todo el sistema',   theirs: 'Entregas lentas o accesos manuales' },
  { ours: 'Soporte real por personas',            theirs: 'Atención automatizada o inexistente' },
  { ours: 'Acompañamiento durante tu activación', theirs: 'Te dejan solo después de la compra' },
];

function ComparisonTable({ isMobile }) {
  return (
    <section style={{ background: NAVY_1, padding: isMobile ? '90px 22px' : '140px 40px', borderTop: `1px solid ${HAIRLINE}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <Eyebrow>¿Por qué con nosotros?</Eyebrow>
          <h2 style={{ marginTop: 22, fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 38 : 56, lineHeight: 1.05, letterSpacing: '-0.02em', color: TEXT }}>
            Elegí inteligente. <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>Elegí tu libertad.</span>
          </h2>
        </div>

        <div style={{ marginTop: 56, borderRadius: 22, overflow: 'hidden', border: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 0.4fr 1fr' : '1fr 0.18fr 1fr' }}>
            <div style={{ padding: isMobile ? '18px 16px' : '22px 26px', background: 'rgba(200,162,75,0.07)', borderBottom: `1px solid ${HAIRLINE}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, background: NAVY_0, border: `1px solid ${HAIRLINE}` }} />
              <span style={{ fontFamily: SANS, fontSize: 12, color: GOLD_SOFT, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Nuestra tienda</span>
            </div>
            <div style={{ padding: '22px 0', background: 'rgba(0,0,0,0.2)', borderBottom: `1px solid ${HAIRLINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 11, color: TEXT_DIM, fontWeight: 700, letterSpacing: '0.18em' }}>VS</div>
            <div style={{ padding: isMobile ? '18px 16px' : '22px 26px', background: 'rgba(0,0,0,0.18)', borderBottom: `1px solid ${HAIRLINE}`, fontFamily: SANS, fontSize: 12, color: TEXT_DIM, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Otras opciones</div>

            {COMPARE_ROWS.map((row, i) => (
              <CompareRowParts key={i} row={row} last={i === COMPARE_ROWS.length - 1} isMobile={isMobile} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CompareRowParts({ row, last, isMobile }) {
  const cellPad = isMobile ? '14px 16px' : '18px 26px';
  const borderB = last ? 'none' : `1px solid ${HAIRLINE}`;
  return (
    <>
      <div style={{ padding: cellPad, borderBottom: borderB, display: 'flex', alignItems: 'center', gap: 12 }}>
        <GIcon name="check-fill" size={20} color={GREEN} />
        <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT, lineHeight: 1.45, fontWeight: 500 }}>{row.ours}</span>
      </div>
      <div style={{ padding: cellPad, borderBottom: borderB, background: 'rgba(0,0,0,0.15)' }} />
      <div style={{ padding: cellPad, borderBottom: borderB, background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <GIcon name="x-fill" size={20} color={RED} />
        <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT_DIM, lineHeight: 1.45 }}>{row.theirs}</span>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------
// SECTION 11 — FAQ
// ---------------------------------------------------------------------
const FAQ = [
  { q: '¿Necesito experiencia previa?',         a: 'No. El sistema está diseñado para que cualquier persona pueda empezar desde cero.' },
  { q: '¿Cuánto tiempo tarda en dar resultados?', a: 'Hay afiliados que activan sus primeros locales en la primera semana. Depende de tu enfoque.' },
  { q: '¿Cómo recibo mis comisiones?',           a: 'Todos los meses, de forma automática por transferencia bancaria.' },
  { q: '¿Qué pasa si no me gusta?',              a: 'Tenés 7 días de garantía. Si no es para vos, te devolvemos tu dinero.' },
  { q: '¿El acceso es de por vida?',             a: 'Sí, y además recibís todas las actualizaciones sin costo adicional.' },
];

function FAQSection({ isMobile }) {
  const [open, setOpen] = useState(0);
  return (
    <section style={{ background: NAVY_0, padding: isMobile ? '90px 22px' : '140px 40px', borderTop: `1px solid ${HAIRLINE}` }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <Eyebrow>Preguntas Frecuentes</Eyebrow>
        </div>

        <div style={{ marginTop: 50, display: 'grid', gap: 12 }}>
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} style={{ borderRadius: 14, border: `1px solid ${HAIRLINE}`, background: isOpen ? 'rgba(200,162,75,0.05)' : 'rgba(255,255,255,0.02)', overflow: 'hidden', transition: 'background 200ms ease' }}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '18px 20px' : '22px 26px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <GIcon name="q" size={18} color={GOLD_SOFT} />
                    <span style={{ fontFamily: SANS, fontSize: isMobile ? 14 : 15, color: TEXT, fontWeight: 600 }}>{item.q}</span>
                  </span>
                  <GIcon name={isOpen ? 'minus' : 'plus'} size={18} color={GOLD_SOFT} />
                </button>
                <div style={{ maxHeight: isOpen ? 300 : 0, overflow: 'hidden', transition: 'max-height 320ms ease' }}>
                  <div style={{ padding: isMobile ? '0 20px 18px 52px' : '0 26px 22px 60px', fontFamily: SANS, fontSize: 13, color: TEXT_DIM, lineHeight: 1.7 }}>{item.a}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 32, padding: '20px 24px', borderRadius: 14, border: `1px solid ${HAIRLINE}`, background: 'rgba(200,162,75,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <GIcon name="shield" size={22} color={GOLD_SOFT} />
          <div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: GOLD_SOFT, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>7 días de garantía total</div>
            <div style={{ marginTop: 4, fontFamily: SANS, fontSize: 13, color: TEXT_DIM }}>Probalo sin riesgo. Si no te convence, te devolvemos tu dinero.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// SECTION 12 — ENTREGA / FINAL OFFER
// ---------------------------------------------------------------------
function FinalOffer({ isMobile }) {
  return (
    <section id="final-offer" style={{ position: 'relative', overflow: 'hidden', background: NAVY_1, padding: isMobile ? '110px 22px' : '160px 40px', borderTop: `1px solid ${HAIRLINE}` }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(900px 600px at 50% 100%, rgba(200,162,75,0.18), transparent 60%), radial-gradient(700px 500px at 50% 0%, rgba(20,40,90,0.5), transparent 60%)` }} />

      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(232,199,122,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,199,122,0.04) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse at 50% 50%, black 0%, transparent 65%)' }} />

      <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        <Eyebrow>Acceso lanzamiento</Eyebrow>
        <h2 style={{ marginTop: 26, fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 40 : 64, lineHeight: 1.04, letterSpacing: '-0.025em', color: TEXT }}>
          Los primeros consultores en cada zona<br/>
          <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>tienen ventaja.</span>
        </h2>
        <p style={{ marginTop: 22, fontFamily: SANS, fontSize: isMobile ? 15 : 17, color: TEXT_DIM, lineHeight: 1.65, maxWidth: 640, margin: '22px auto 0' }}>
          El sistema está abierto. La oportunidad de ser el primero en una ciudad o un barrio, no.
        </p>

        <div style={{ marginTop: 50, padding: isMobile ? '28px 22px' : '40px 48px', borderRadius: 22, border: `1px solid ${HAIRLINE}`, background: `linear-gradient(180deg, rgba(15,22,40,0.85), rgba(5,8,15,0.95))`, backdropFilter: 'blur(20px)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 18 }}>
            <span style={{ fontFamily: SANS, fontSize: 11, padding: '6px 14px', borderRadius: 999, border: `1px solid ${HAIRLINE}`, background: 'rgba(200,162,75,0.06)', color: GOLD_SOFT, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
              Por tiempo limitado
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(244,241,234,0.5)', textDecoration: 'line-through' }}>Antes $157.000</span>
            <span style={{ fontFamily: SERIF, fontSize: isMobile ? 60 : 96, fontWeight: 600, color: GOLD_BRIGHT, letterSpacing: '-0.03em', lineHeight: 1 }}>$14.900</span>
            <span style={{ fontFamily: SANS, fontSize: 14, color: GOLD_SOFT, letterSpacing: '0.1em', fontWeight: 600 }}>ARS</span>
          </div>

          <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}>
            <GoldButton size="xl" leftIcon="lock">Acceder al sistema</GoldButton>
          </div>

          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 14 : 26, flexWrap: 'wrap', fontFamily: SANS, fontSize: 11, color: TEXT_DIM, letterSpacing: '0.08em' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><GIcon name="shield" size={14} /> Garantía 7 días</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><GIcon name="rocket" size={14} /> Acceso inmediato</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><GIcon name="lock" size={14} /> Pago seguro</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// SECTION 13 — FOOTER
// ---------------------------------------------------------------------
function Footer({ isMobile }) {
  return (
    <footer style={{ background: NAVY_0, padding: isMobile ? '50px 22px 32px' : '64px 40px 40px', borderTop: `1px solid ${HAIRLINE}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr 1fr', gap: 40, alignItems: 'flex-start' }}>
        <div>
          <FekaLogo />
          <div style={{ marginTop: 10, fontFamily: SANS, fontSize: 11, color: GOLD_SOFT, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>· Afiliados</div>
          <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 13, color: TEXT_DIM, letterSpacing: '0.04em' }}>FEKA.CLICK / AFILIADOS</div>
        </div>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 11, color: GOLD_SOFT, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Enlaces</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10, fontFamily: SANS, fontSize: 13, color: TEXT_DIM }}>
            <li>El programa</li><li>Precio</li><li>WhatsApp</li><li>Instagram</li>
          </ul>
        </div>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 11, color: GOLD_SOFT, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Información</div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_DIM, lineHeight: 1.7 }}>
            © {new Date().getFullYear()} — Sistema de Ingresos Recurrentes FEKA<br/>
            Producto digital, sin envíos físicos.<br/>
            Resultados variables según ejecución individual.<br/>
            Garantía de 7 días vigente.
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------
// Sticky mobile CTA
// ---------------------------------------------------------------------
function StickyMobileCTA({ isMobile, visible }) {
  if (!isMobile || !visible) return null;
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', background: 'linear-gradient(180deg, rgba(5,8,15,0) 0%, rgba(5,8,15,0.95) 30%)', backdropFilter: 'blur(12px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderRadius: 14, border: `1px solid ${HAIRLINE}`, background: 'rgba(15,22,40,0.92)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontFamily: SANS, fontSize: 9, color: GOLD_SOFT, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Hoy solo</span>
          <span style={{ fontFamily: SERIF, fontSize: 22, color: GOLD_BRIGHT, fontWeight: 600, lineHeight: 1 }}>$14.900 ARS</span>
        </div>
        <GoldButton size="sm">Acceder</GoldButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------
export default function FekaLandingPage() {
  const { isMobile } = useViewport();
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <Head>
        <title>FEKA · Programa de Afiliados — Ingresos recurrentes en gastronomía</title>
        <meta name="description" content="Sistema operativo de comisiones recurrentes. Conectá restaurantes con tecnología que ya necesitan y construí ingresos que no dependen de un jefe." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta property="og:title" content="FEKA · Programa de Afiliados" />
        <meta property="og:description" content="Sistema real para generar comisiones recurrentes conectando restaurantes con tecnología que ya necesitan." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <main style={{ background: NAVY_0, color: TEXT, fontFamily: SANS, minHeight: '100vh' }}>
        <Hero isMobile={isMobile} />
        <TrustBar isMobile={isMobile} />
        <MarketOpportunity isMobile={isMobile} />
        <PainPoints isMobile={isMobile} />
        <BeforeAfter isMobile={isMobile} />
        <TechSection isMobile={isMobile} />
        <Testimonials isMobile={isMobile} />
        <HowItWorks isMobile={isMobile} />
        <WhatsIncluded isMobile={isMobile} />
        <ComparisonTable isMobile={isMobile} />
        <FAQSection isMobile={isMobile} />
        <FinalOffer isMobile={isMobile} />
        <Footer isMobile={isMobile} />
      </main>

      <StickyMobileCTA isMobile={isMobile} visible={stickyVisible} />
    </>
  );
}
