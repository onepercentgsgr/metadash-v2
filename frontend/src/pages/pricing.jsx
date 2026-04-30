'use client';

import { useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

const PLANS = [
  {
    id: 'trial', name: 'Trial', price: 0, period: '14 días',
    desc: 'Probá sin compromiso, sin tarjeta',
    accent: '#f59e0b',
    features: ['2 agentes de IA', 'Dashboard con métricas', 'Conexión Meta Ads', 'Soporte por email'],
    cta: 'Comenzar gratis',
  },
  {
    id: 'starter', name: 'Starter', price: 29, period: 'mes',
    desc: 'Para emprendedores que escalan',
    accent: '#3b82f6',
    features: ['5 agentes de IA', 'Optimización automática', 'Análisis financiero', 'GA4 integrado', '1 cuenta Meta Ads', 'Historial 30 días'],
    cta: 'Elegir Starter',
  },
  {
    id: 'pro', name: 'Pro', price: 79, period: 'mes',
    desc: 'Para agencias en crecimiento',
    accent: '#6366f1',
    popular: true,
    features: ['Agentes IA ilimitados', 'Agentes autónomos 24/7', 'CRO + Growth + Scripts', 'GA4 avanzado', 'Auditoría de landing', '5 cuentas Meta Ads', 'Historial 1 año', 'Soporte prioritario'],
    cta: 'Elegir Pro',
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 199, period: 'mes',
    desc: 'Para alto volumen y equipos',
    accent: '#8b5cf6',
    features: ['Todo lo de Pro', 'Cuentas Meta ilimitadas', 'API con SLA', 'Agentes personalizados', 'Dashboard white-label', 'Gestor dedicado', 'Onboarding personalizado', 'Soporte 24/7'],
    cta: 'Contactar ventas',
  },
];

const FAQS = [
  { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Los cambios se aplican en el próximo ciclo de facturación.' },
  { q: '¿Necesito tarjeta para el trial?', a: 'No, 14 días completamente gratis sin método de pago.' },
  { q: '¿Qué pasa cuando termina mi trial?', a: 'Tu cuenta se pausa. Elegís un plan pago para continuar.' },
  { q: '¿Puedo cancelar?', a: 'Sí, en cualquier momento. Seguís con acceso hasta fin del período facturado.' },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [payment, setPayment]         = useState('mercadopago');
  const [processing, setProcessing]   = useState(null);
  const [error, setError]             = useState('');
  const currentPlan = user?.subscription_plan || 'trial';

  async function checkout(planId) {
    if (!user) { router.push('/login?redirect=/pricing'); return; }
    if (planId === 'trial') { router.push('/dashboard'); return; }
    if (planId === currentPlan) return;
    setProcessing(planId); setError('');
    try {
      const endpoint = payment === 'stripe' ? '/payments/stripe/create-checkout' : '/payments/create-checkout';
      const data = await api.apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ plan: planId, user_id: user.id }) });
      if (data.checkout_url) window.location.href = data.checkout_url;
      else setError('No se pudo crear la sesión de pago.');
    } catch (err) { setError(err.message || 'Error al procesar el pago'); }
    finally { setProcessing(null); }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3"
            style={{ color: 'rgba(255,255,255,0.25)' }}>Planes y Precios</p>
          <h1 style={{
            fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1,
            background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: 12,
          }}>
            Escalá tu negocio con IA
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', maxWidth: 480, margin: '0 auto' }}>
            Agentes que optimizan tus campañas 24/7 para que vos te enfoques en escalar
          </p>
        </div>

        {/* Payment toggle */}
        <div className="flex justify-center">
          <div className="flex gap-1 p-1 rounded-xl"
            style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { id: 'mercadopago', label: '🇦🇷 MercadoPago' },
              { id: 'stripe',      label: '🌎 Stripe (USD)' },
            ].map((m) => (
              <button key={m.id} onClick={() => setPayment(m.id)}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                style={payment === m.id
                  ? { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', boxShadow: '0 2px 8px rgba(79,70,229,0.3)' }
                  : { color: 'rgba(255,255,255,0.4)' }
                }>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto rounded-xl p-4 text-center text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isProcessing = processing === plan.id;

            return (
              <div key={plan.id}
                className="relative rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: plan.popular ? `linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))` : '#16161a',
                  border: plan.popular ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: plan.popular ? '0 0 40px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.3)',
                  transform: plan.popular ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {plan.popular && (
                  <div className="text-center py-2 text-[10px] font-black uppercase tracking-widest"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white' }}>
                    ✦ Más popular
                  </div>
                )}

                <div className="p-6">
                  {/* Plan header */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: plan.accent }}>
                        {plan.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                          Tu plan
                        </span>
                      )}
                    </div>
                    <div className="flex items-end gap-1.5 mb-1">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-black tracking-tight text-white">Gratis</span>
                      ) : (
                        <>
                          <span className="text-3xl font-black tracking-tight text-white">${plan.price}</span>
                          <span className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>USD / {plan.period}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{plan.desc}</p>
                  </div>

                  {/* CTA */}
                  <button onClick={() => checkout(plan.id)}
                    disabled={isCurrent || isProcessing}
                    className="w-full py-2.5 rounded-xl text-sm font-bold mb-5 transition-all"
                    style={isCurrent
                      ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)', cursor: 'default' }
                      : plan.popular
                      ? { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', boxShadow: '0 4px 16px rgba(79,70,229,0.35)', cursor: 'pointer', border: 'none' }
                      : { background: `${plan.accent}18`, color: plan.accent, border: `1px solid ${plan.accent}30`, cursor: 'pointer' }
                    }
                  >
                    {isProcessing ? 'Procesando...' : isCurrent ? 'Plan actual' : plan.cta}
                  </button>

                  {/* Features */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <ul className="space-y-2.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="flex-shrink-0 mt-0.5" style={{ color: plan.accent }}>
                            <CheckIcon />
                          </span>
                          <span className="text-sm leading-tight" style={{ color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Todos los planes incluyen SSL, backups automáticos y actualizaciones.
          {payment === 'mercadopago' && ' · Pagás en pesos al tipo de cambio del día.'}
        </p>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-3 pb-8">
          <h2 className="text-lg font-bold text-white text-center tracking-tight mb-6">Preguntas frecuentes</h2>
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-2xl p-5"
              style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-sm font-semibold text-white mb-1.5">{faq.q}</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
