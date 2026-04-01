import React, { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function Pricing() {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('mercadopago');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get user ID from localStorage or auth context
    const uid = localStorage.getItem('user_id');
    setUserId(uid);
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/payments/plans');
      const data = await response.json();
      setPlans(data.plans || {});
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (plan) => {
    if (!userId) {
      alert('Por favor inicia sesión para continuar');
      return;
    }

    try {
      let endpoint = '/api/payments/create-checkout';
      if (selectedPayment === 'stripe') {
        endpoint = '/api/payments/stripe/create-checkout';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan,
          user_id: parseInt(userId),
        }),
      });

      const data = await response.json();

      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert('Error al crear el checkout: ' + data.detail);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error al procesar el pago');
    }
  };

  const planFeatures = {
    trial: [
      'Acceso a 2 agentes de IA',
      'Análisis básico de datos',
      'Soporte por email',
      'Válido por 14 días',
    ],
    starter: [
      'Hasta 5 agentes de IA',
      'Análisis básico de datos',
      'Soporte por email',
      '1 integración externa',
      'Historial de 30 días',
    ],
    pro: [
      'Agentes de IA ilimitados',
      'Análisis avanzado y reportes',
      'Soporte prioritario',
      'Webhooks y API',
      'Integraciones ilimitadas',
      'Historial de 1 año',
      'Equipo colaborativo',
    ],
    enterprise: [
      'Agentes de IA ilimitados',
      'Análisis empresarial personalizado',
      'Soporte 24/7 dedicado',
      'API completa con SLA garantizado',
      'Integraciones y personalizaciones ilimitadas',
      'Historial ilimitado',
      'Equipo colaborativo ilimitado',
      'Gestor de cuenta dedicado',
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Cargando planes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Planes de Suscripción</h1>
          <p className="text-xl text-gray-400 mb-8">
            Elige el plan perfecto para tu negocio
          </p>

          {/* Payment Method Selection */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setSelectedPayment('mercadopago')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                selectedPayment === 'mercadopago'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              MercadoPago
            </button>
            <button
              onClick={() => setSelectedPayment('stripe')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                selectedPayment === 'stripe'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Stripe
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Trial Plan */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{plans.trial?.name || 'Plan de Prueba'}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">Gratis</span>
                <span className="text-gray-400 ml-2">/ 14 días</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">{plans.trial?.description}</p>

              <button
                onClick={() => handleCheckout('trial')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition mb-6"
              >
                Comenzar Prueba Gratis
              </button>

              <ul className="space-y-3">
                {planFeatures.trial.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Starter Plan */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{plans.starter?.name || 'Plan Iniciador'}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">${plans.starter?.price || 29}</span>
                <span className="text-gray-400 ml-2">/ mes</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">{plans.starter?.description}</p>

              <button
                onClick={() => handleCheckout('starter')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition mb-6"
              >
                Elegir Plan
              </button>

              <ul className="space-y-3">
                {planFeatures.starter.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro Plan - Highlighted */}
          <div className="bg-gray-800 rounded-lg border border-blue-500 overflow-hidden shadow-lg shadow-blue-500/50 transform lg:scale-105">
            <div className="bg-blue-600 text-center py-2">
              <span className="text-sm font-semibold">MÁS POPULAR</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{plans.pro?.name || 'Plan Profesional'}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">${plans.pro?.price || 79}</span>
                <span className="text-gray-400 ml-2">/ mes</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">{plans.pro?.description}</p>

              <button
                onClick={() => handleCheckout('pro')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition mb-6"
              >
                Elegir Plan
              </button>

              <ul className="space-y-3">
                {planFeatures.pro.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{plans.enterprise?.name || 'Plan Empresarial'}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">${plans.enterprise?.price || 199}</span>
                <span className="text-gray-400 ml-2">/ mes</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">{plans.enterprise?.description}</p>

              <button
                onClick={() => handleCheckout('enterprise')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition mb-6"
              >
                Contactar Ventas
              </button>

              <ul className="space-y-3">
                {planFeatures.enterprise.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-2">¿Puedo cambiar de plan?</h3>
              <p className="text-gray-400">
                Sí, puedes actualizar o cambiar tu plan en cualquier momento desde tu panel de control.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-2">¿Hay período de prueba?</h3>
              <p className="text-gray-400">
                Sí, ofrecemos un plan de prueba gratuito de 14 días sin necesidad de tarjeta de crédito.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-2">¿Puedo cancelar en cualquier momento?</h3>
              <p className="text-gray-400">
                Claro, puedes cancelar tu suscripción en cualquier momento. No hay contratos a largo plazo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
