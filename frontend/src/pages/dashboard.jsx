'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icons';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const WIZARD_STEPS = [
  { id: 'oferta',        num: 0,  name: 'Modelado de Oferta'     },
  { id: 'investigacion', num: 1,  name: 'Investigación de Mercado'},
  { id: 'avatares',      num: 2,  name: 'Avatares + Ángulos'      },
  { id: 'brand',         num: 3,  name: 'Identidad Visual'        },
  { id: 'mockup',        num: 4,  name: 'Mockup Principal'        },
  { id: 'ads',           num: 5,  name: 'Prompts de ADS'          },
  { id: 'bonus_mockups', num: 6,  name: 'Bonus Mockups'           },
  { id: 'bundle',        num: 7,  name: 'Bundle Completo'         },
  { id: 'landing',       num: 8,  name: 'Landing Page'            },
  { id: 'copys',         num: 9,  name: 'Copys para Ads'          },
  { id: 'guiones',       num: 10, name: 'Guiones Video Ads'       },
  { id: 'ugc',           num: 11, name: 'UGC Realistas'           },
  { id: 'producto',      num: 12, name: 'Generador de Producto'   },
  { id: 'lanzamiento',   num: 13, name: 'Plan de Lanzamiento'     },
];

const QUICK = [
  { href: '/infoproducto', icon: 'rocket',     label: 'Infoproducto', desc: 'Wizard 14 pasos con IA',       accent: '#6366f1' },
  { href: '/tiktok',       icon: 'tiktok',     label: 'TikTok',       desc: 'Guiones orgánicos con IA',     accent: '#ec4899' },
  { href: '/audit',        icon: 'audit',      label: 'Auditoría',    desc: 'Análisis integral IA',         accent: '#10b981' },
  { href: '/settings',     icon: 'settings',   label: 'Configurar',   desc: 'APIs y conexiones',            accent: '#f59e0b' },
];

const CONNECTIONS = [
  { key: 'meta',      icon: 'campaigns', label: 'Meta Ads'           },
  { key: 'anthropic', icon: 'agents',    label: 'Anthropic / Claude' },
  { key: 'ga4',       icon: 'audit',     label: 'Google Analytics 4' },
  { key: 'landing',   icon: 'rocket',    label: 'Landing Page'       },
];

function StatusDot({ status }) {
  const s = {
    connected:    { color: '#22c55e', shadow: 'rgba(34,197,94,0.5)',  label: 'Conectado'    },
    partial:      { color: '#f59e0b', shadow: 'rgba(245,158,11,0.5)', label: 'Parcial'      },
    disconnected: { color: 'rgba(255,255,255,0.15)', shadow: 'none',  label: 'Desconectado' },
  }[status] || { color: 'rgba(255,255,255,0.15)', shadow: 'none', label: 'Desconectado' };

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: s.color, boxShadow: s.shadow !== 'none' ? `0 0 6px ${s.shadow}` : 'none' }} />
      <span className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: status === 'connected' ? '#4ade80' : status === 'partial' ? '#fbbf24' : 'rgba(255,255,255,0.25)' }}>
        {s.label}
      </span>
    </div>
  );
}

function BreakevenModal({ onClose, onSave }) {
  const [form, setForm] = useState({ precio: '', comision: '4', costosFijos: '', ventas: '' });
  const [saving, setSaving] = useState(false);

  const precio   = parseFloat(form.precio)   || 0;
  const comision = parseFloat(form.comision) || 0;
  const fijos    = parseFloat(form.costosFijos) || 0;
  const ventas   = parseFloat(form.ventas)   || 0;

  const costoComision   = precio * (comision / 100);
  const costoFijoUnit   = ventas > 0 ? fijos / ventas : 0;
  const costoTotal      = costoComision + costoFijoUnit;
  const ganancia        = precio - costoTotal;
  const margen          = precio > 0 ? (ganancia / precio) * 100 : 0;
  const breakevenRoas   = margen > 0 ? (100 / margen).toFixed(2) : '—';
  const isValid         = precio > 0 && ventas > 0 && margen > 0;

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      await api.updateConfig({ target_margin: margen.toFixed(2) });
      onSave(margen.toFixed(2));
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, background: '#16161a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', margin: 0 }}>Calculá tu breakeven</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>Los agentes usarán tu margen real, no un 2x genérico</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Precio de venta promedio (USD)', key: 'precio', placeholder: 'ej. 97' },
            { label: '% comisión plataforma (MP, Stripe, Hotmart...)', key: 'comision', placeholder: 'ej. 4' },
            { label: 'Costos fijos mensuales (USD)', key: 'costosFijos', placeholder: 'ej. 500 — editor, apps, impuestos' },
            { label: 'Ventas estimadas por mes', key: 'ventas', placeholder: 'ej. 30' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>{label}</label>
              <input type="number" min="0" step="any" placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={inp}
              />
            </div>
          ))}
        </div>

        {precio > 0 && ventas > 0 && (
          <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: margen > 0 ? 'rgba(99,102,241,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${margen > 0 ? 'rgba(99,102,241,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Tu margen real</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: margen > 0 ? '#a5b4fc' : '#f87171', letterSpacing: '-0.03em' }}>
                  {margen > 0 ? `${margen.toFixed(1)}%` : 'Negativo'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Breakeven ROAS</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: margen > 0 ? '#34d399' : '#f87171', letterSpacing: '-0.03em' }}>{breakevenRoas}x</div>
              </div>
            </div>
            {margen > 0 && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 10, lineHeight: 1.5 }}>
                Ganás <strong style={{ color: 'rgba(255,255,255,0.7)' }}>${ganancia.toFixed(2)}</strong> por venta · Necesitás al menos <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{breakevenRoas}x ROAS</strong> para no perder
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!isValid || saving}
            style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: isValid ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(255,255,255,0.05)', color: isValid ? 'white' : 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700, cursor: isValid ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: isValid ? '0 4px 14px rgba(79,70,229,0.35)' : 'none' }}>
            {saving ? 'Guardando...' : `Guardar — ${margen > 0 ? `${margen.toFixed(1)}% de margen` : 'completá los campos'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [wizardState, setWizardState] = useState(null);
  const [configStatus, setConfigStatus] = useState({
    meta: 'disconnected', anthropic: 'disconnected',
    landing: 'disconnected', ga4: 'disconnected',
  });
  const [showBreakeven, setShowBreakeven] = useState(false);
  const [savedMargin, setSavedMargin] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const c = await api.getConfig().catch(() => null);
        if (c) {
          setConfigStatus({
            meta:      (c.meta_access_token && c.meta_ad_account_id) ? 'connected' : (c.meta_access_token || c.meta_ad_account_id) ? 'partial' : 'disconnected',
            anthropic: c.anthropic_api_key ? 'connected' : 'disconnected',
            landing:   c.landing_page_url  ? 'connected' : 'disconnected',
            ga4:       (c.ga4_property_id && c.ga4_credentials_json) ? 'connected' : 'disconnected',
          });
          if (c.target_margin) setSavedMargin(parseFloat(c.target_margin));
        }
        try {
          const raw = localStorage.getItem('metadash_infoproducto');
          if (raw) setWizardState(JSON.parse(raw));
        } catch (e) {}
      } finally { setLoading(false); }
    })();
  }, []);

  const completedSteps  = Array.isArray(wizardState?.pasos_completos) ? wizardState.pasos_completos.length : 0;
  const currentIdx      = wizardState?.paso_actual ?? null;
  const currentStep     = currentIdx !== null ? WIZARD_STEPS[currentIdx] : null;
  const progressPct     = Math.round((completedSteps / WIZARD_STEPS.length) * 100);
  const hasProgress     = currentIdx !== null;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Buen día' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  })();
  const dateStr = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {showBreakeven && (
        <BreakevenModal
          onClose={() => setShowBreakeven(false)}
          onSave={(margin) => { setSavedMargin(parseFloat(margin)); setShowBreakeven(false); }}
        />
      )}
      <div className="space-y-8 max-w-5xl">

        {/* ── Hero ── */}
        <header>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                {dateStr}
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight leading-none"
                style={{
                  background: 'linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.55) 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {greeting}{firstName ? `, ${firstName}` : ''}.
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Tu plataforma de lanzamiento de infoproductos. Una misión, cero distracción.
              </p>
            </div>
            <button onClick={() => setShowBreakeven(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shrink-0 transition-all"
              style={{
                background: savedMargin ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                border: savedMargin ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: savedMargin ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#c7d2fe'; }}
              onMouseLeave={e => { e.currentTarget.style.background = savedMargin ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = savedMargin ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = savedMargin ? '#a5b4fc' : 'rgba(255,255,255,0.4)'; }}
            >
              <Icon name="financials" size={13} />
              {savedMargin ? `Breakeven ${(100 / savedMargin).toFixed(2)}x ROAS · ${savedMargin.toFixed(1)}% margen` : '¿No sabés tu breakeven?'}
            </button>
          </div>
        </header>

        {/* ── Lanzamiento card ── */}
        <section>
          <SectionLabel>Tu lanzamiento de hoy</SectionLabel>
          {hasProgress ? (
            <div className="relative overflow-hidden rounded-2xl p-7"
              style={{
                background: 'linear-gradient(135deg,rgba(79,70,229,0.18) 0%,rgba(124,58,237,0.12) 100%)',
                border: '1px solid rgba(99,102,241,0.25)',
                boxShadow: '0 0 40px rgba(79,70,229,0.1)',
              }}>
              {/* Ambient blobs */}
              <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full"
                style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)' }} />
              <div className="pointer-events-none absolute -bottom-20 -left-10 w-48 h-48 rounded-full"
                style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)' }} />
              <div className="relative flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: '#818cf8' }}>
                      Paso {currentIdx + 1} / {WIZARD_STEPS.length}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                      {progressPct}% completado
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white mb-1">
                    {currentStep?.name || 'Continuá tu lanzamiento'}
                  </h2>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Retomá donde lo dejaste. Cada paso te acerca al lanzamiento.
                  </p>
                  <div className="mt-5 max-w-sm">
                    <div className="flex justify-between text-[10px] font-semibold mb-1.5"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>
                      <span>Progreso</span><span>{completedSteps}/{WIZARD_STEPS.length} pasos</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${progressPct}%`,
                          background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                          boxShadow: '0 0 8px rgba(99,102,241,0.6)',
                        }} />
                    </div>
                  </div>
                </div>
                <Link href="/infoproducto"
                  className="self-start md:self-center shrink-0 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    boxShadow: '0 4px 20px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(79,70,229,0.55), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
                >
                  Continuar →
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl p-10 text-center"
              style={{
                background: 'linear-gradient(135deg,rgba(79,70,229,0.12) 0%,rgba(124,58,237,0.08) 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(99,102,241,0.15) 0%,transparent 60%)' }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg,rgba(79,70,229,0.3),rgba(124,58,237,0.2))',
                    border: '1px solid rgba(99,102,241,0.35)',
                  }}>
                  <Icon name="rocket" size={24} className="text-indigo-300" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
                  Empezá tu primer lanzamiento
                </h2>
                <p className="text-sm max-w-md mx-auto mb-7" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Un wizard guiado de 14 pasos. De idea a infoproducto listo para vender —
                  copy, ads, landing y plan de lanzamiento incluidos.
                </p>
                <Link href="/infoproducto"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white"
                  style={{
                    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    boxShadow: '0 4px 24px rgba(79,70,229,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  <Icon name="rocket" size={16} />
                  Empezar ahora
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ── Quick actions ── */}
        <section>
          <SectionLabel>Acciones rápidas</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK.map((q) => (
              <Link key={q.href} href={q.href}
                className="group flex flex-col gap-4 rounded-2xl p-5 transition-all duration-150"
                style={{
                  background: '#16161a',
                  border: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1c1c22';
                  e.currentTarget.style.border = `1px solid ${q.accent}30`;
                  e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${q.accent}20`;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#16161a';
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${q.accent}18`, border: `1px solid ${q.accent}28`, color: q.accent }}>
                    <Icon name={q.icon} size={16} strokeWidth={2} />
                  </div>
                  <span className="text-xs transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    style={{ color: 'rgba(255,255,255,0.2)' }}>↗</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white tracking-tight mb-0.5">{q.label}</div>
                  <div className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>{q.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Connections ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Conexiones</SectionLabel>
            <Link href="/settings"
              className="text-[11px] font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={(e) => { e.target.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={(e) => { e.target.style.color = 'rgba(255,255,255,0.3)'; }}
            >
              Gestionar →
            </Link>
          </div>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.05)' }}>
            {CONNECTIONS.map((c, i) => (
              <div key={c.key}
                className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    <Icon name={c.icon} size={13} />
                  </div>
                  <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {c.label}
                  </span>
                </div>
                <StatusDot status={configStatus[c.key]} />
              </div>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3"
      style={{ color: 'rgba(255,255,255,0.25)' }}>
      {children}
    </p>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
