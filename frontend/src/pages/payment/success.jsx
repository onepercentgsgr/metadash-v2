import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function PaymentSuccess() {
  const router = useRouter();
  const { plan, session_id } = router.query;
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      fetchSubscriptionStatus(userId);
    }
  }, []);

  const fetchSubscriptionStatus = async (userId) => {
    try {
      const response = await fetch(`/api/payments/status/${userId}`);
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanName = () => {
    const names = {
      trial: 'Plan de Prueba',
      starter: 'Plan Iniciador',
      pro: 'Plan Profesional',
      enterprise: 'Plan Empresarial',
    };
    return names[plan] || 'Tu Plan';
  };

  const getPlanDuration = () => {
    const durations = {
      trial: '14 días',
      starter: '30 días',
      pro: '30 días',
      enterprise: '30 días',
    };
    return durations[plan] || '30 días';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Verificando tu pago...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <CheckCircleIcon className="w-20 h-20 text-green-500" />
        </div>

        {/* Success Message */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">¡Pago Exitoso!</h1>
          <p className="text-gray-400 mb-6">
            Tu suscripción ha sido activada correctamente
          </p>
        </div>

        {/* Subscription Details */}
        {subscription && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Plan Contratado</p>
              <p className="text-xl font-semibold">{getPlanName()}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Estado</p>
              <p className="text-xl font-semibold capitalize text-green-400">
                {subscription.status === 'active' ? 'Activo' : subscription.status}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Válido por</p>
              <p className="text-xl font-semibold">{getPlanDuration()}</p>
            </div>

            {subscription.expires_at && (
              <div>
                <p className="text-gray-400 text-sm">Vence el</p>
                <p className="text-xl font-semibold">
                  {new Date(subscription.expires_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-900 bg-opacity-50 rounded-lg p-6 border border-blue-700">
          <h3 className="font-semibold mb-3">Próximos Pasos</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">1.</span>
              <span>Tu cuenta ha sido actualizada con el nuevo plan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">2.</span>
              <span>Puedes acceder a todas las características incluidas ahora</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">3.</span>
              <span>Recuerda revisar la configuración de tu cuenta</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Ir al Panel de Control
          </button>
          <button
            onClick={() => router.push('/pricing')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Ver Otros Planes
          </button>
        </div>

        {/* Support */}
        <div className="text-center text-sm text-gray-400">
          <p>¿Necesitas ayuda?{' '}
            <a href="mailto:support@metadash.com" className="text-blue-400 hover:text-blue-300">
              Contacta nuestro soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
