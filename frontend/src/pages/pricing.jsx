'use client';

import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const plans = [
  {
    id: 'trial',
    name: 'Trial',
    price: 0,
    period: '14 días',
    description: 'Ideal para probar la plataforma sin compromiso',
    color: 'yellow',
    features: [
      'Acceso a 2 agentes de IA',
      'Dashboard con métricas básicas',
      'Conexión Meta Ads',
      'Soporte por email',
      'Válido por 14 días',
    ],
    cta: 'Comenzar Gratis',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: 'mes',
    description: 'Para emprendedores y pequeños negocios',
    color: 'blue',
    features: [
      'Hasta 5 agentes de IA',
      'Optimización automática de campañas',
      'Análisis financiero básico',
      'Google Analytics integrado',
      '1 cuenta de Meta Ads',
      'Historial de 30 días',
      'Soporte por email prioritario',
    ],
    cta: 'Elegir Starter',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    period: 'mes',
    description: 'Para agencias y negocios en crecimiento',
    color: 'indigo',
    features: [
      'Agentes de IA ilimitados',
      'Agentes autónomos 24/7',
      'Optimización + CRO + Growth',
      'Google Analytics avanzado',
      'Auditoría de landing pages',
      'Scripts y creativos con IA',
      'Hasta 5 cuentas de Meta Ads',
      'Historial de 1 año',
      'Soporte prioritario',
    ],
    cta: 'Elegir Pro',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'mes',
    description: 'Para agencias y empresas con alto volumen',
    color: 'purple',
    features: [
      'Todo lo del plan Pro',
      'Cuentas de Meta Ads ilimitadas',
      'API completa con SLA',
      'Agentes personalizados',
      'Dashboard white-label',
      'Gestor de cuenta dedicado',
      'Onboarding personalizado',
      'Soporte 24/7 dedicado',
      'Historial ilimitado',
    ],
    cta: 'Contactar Ventas',
    popular: false,
  },
];

const colorMap = {
  yellow: {
    badge: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/40',
    border: 'border-yellow-700/30 hover:border-yellow-600/60',
    btn: 'bg-yellow-600 hover:bg-yellow-500',
    glow: '',
  },
  blue: {
    badge: 'bg-blue-900/30 text-blue-300 border-blue-700/40',
    border: 'border-blue-700/30 hover:border-blue-600/60',
    btn: 'bg-blue-600 hover:bg-blue-500',
    glow: '',
  },
  indigo: {
    badge: 'bg-indigo-900/30 text-indigo-300 border-indigo-700/40',
    border: 'border-indigo-500/60 hover:border-indigo-400',
    btn: 'bg-indigo-600 hover:bg-indigo-500',
    glow: 'shadow-lg shadow-indigo-500/20',
  },
  purple: {
    badge: 'bg-purple-900/30 text-purple-300 border-purple-700/40',
    border: 'border-purple-700/30 hover:border-purple-600/60',
    btn: 'bg-purple-600 hover:bg-purple-500',
    glow: '',
  },
};

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState('mercadopago');
  const [processingPlan, setProcessingPlan] = useState(null);
  const [error, setError] = useState('');

  const currentPlan = user?.subscription_plan || 'trial';

  async function handleCheckout(planId) {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }

    if (planId === 'trial') {
      router.push('/dashboard');
      return;
    }

    if (planId === currentPlan) return;

    setProcessingPlan(planId);
    setError('');

    try {
      const endpoint = selectedPayment === 'stripe'
        ? '/payments/stripe/create-checkout'
        : '/payments/create-checkout';

      const data = await api.apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ plan: planId, user_id: user.id }),
      });

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError('No se pudo crear la sesión de pago. Intenta de nuevo.');
      }
    } catch (err) {
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setProcessingPlan(null);
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Planes y Precios</h1>
          <p className="text-gray-400 mt-2 max-w-xl mx-auto">
            Escala tu negocio con agentes de IA que optimizan tus campañas 24/7
          </p>
        </div>

        {/* Payment Method Toggle */}
        <div className="flex justify-center">
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setSelectedPayment('mercadopago')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPayment === 'mercadopago'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              MercadoPago
            </button>
            <button
              onClick={() => setSelectedPayment('stripe')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPayment === 'stripe'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Stripe (USD)
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto bg-red-900/30 border border-red-700 rounded-xl p-4 text-center">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const colors = colorMap[plan.color];
            const isCurrentPlan = currentPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative bg-gray-900/80 border rounded-xl overflow-hidden transition-all duration-300 ${colors.border} ${colors.glow} ${plan.popular ? 'xl:scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="bg-indigo-600 text-center py-1.5">
                    <span className="text-xs font-bold tracking-wider uppercase">Más Popular</span>
                  </div>
                )}

                <div className="p-6 space-y-5">
                  {/* Plan name & badge */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-900/40 text-green-300 border border-green-700/40">
                        Tu plan
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    {plan.price === 0 ? (
                      <div>
                        <span className="text-3xl font-bold text-white">Gratis</span>
                        <span className="text-gray-500 text-sm ml-2">/ {plan.period}</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-white">${plan.price}</span>
                        <span className="text-gray-500 text-sm ml-1">USD / {plan.period}</span>
                      </div>
                    )}
                    <p className="text-gray-500 text-xs mt-1">{plan.description}</p>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={isCurrentPlan || processingPlan === plan.id}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : processingPlan === plan.id
                        ? 'bg-gray-700 text-gray-400 cursor-wait'
                        : `${colors.btn} text-white`
                    }`}
                  >
                    {processingPlan === plan.id
                      ? 'Procesando...'
                      : isCurrentPlan
                      ? 'Plan actual'
                      : plan.cta}
                  </button>

                  {/* Features */}
                  <ul className="space-y-2.5 pt-2 border-t border-gray-800">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckIcon className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison note */}
        <div className="text-center text-gray-500 text-xs">
          Todos los planes incluyen SSL, backups automáticos y actualizaciones.
          {selectedPayment === 'mercadopago' && ' Precios en USD, pagás en pesos al tipo de cambio del día.'}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-4 pt-4">
          <h2 className="text-xl font-bold text-white text-center">Preguntas Frecuentes</h2>

          {[
            {
              q: '¿Puedo cambiar de plan en cualquier momento?',
              a: 'Sí, podés actualizar o bajar tu plan desde el panel de control. Los cambios se aplican en el próximo ciclo de facturación.',
            },
            {
              q: '¿Necesito tarjeta de crédito para el trial?',
              a: 'No, el período de prueba de 14 días es completamente gratuito y no requiere método de pago.',
            },
            {
              q: '¿Qué pasa cuando termina mi trial?',
              a: 'Tu cuenta se pausa automáticamente. Podés elegir un plan pago para continuar usando todos los agentes y funcionalidades.',
            },
            {
              q: '¿Puedo cancelar mi suscripción?',
              a: 'Sí, podés cancelar en cualquier momento sin penalidad. Seguís teniendo acceso hasta el final del período facturado.',
            },
          ].map((faq, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-1.5">{faq.q}</h3>
              <p className="text-gray-400 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export function getServerSideProps(context) {
  return { props: {} };
}
