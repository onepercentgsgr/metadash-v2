import React from 'react';
import { useRouter } from 'next/router';

const ExclamationTriangleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

export default function PaymentCancel() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Cancel Icon */}
        <div className="flex justify-center">
          <ExclamationTriangleIcon className="w-20 h-20 text-red-500" />
        </div>

        {/* Cancel Message */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Pago Cancelado</h1>
          <p className="text-gray-400 mb-6">
            Tu pago no fue procesado. Tu suscripción no ha sido activada.
          </p>
        </div>

        {/* Reasons */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="font-semibold mb-3">Razones Comunes</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span>Cerró la ventana de pago</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span>Cambió de opinión durante el proceso</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span>Hubo un problema técnico con el proveedor de pagos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span>Su tarjeta fue rechazada</span>
            </li>
          </ul>
        </div>

        {/* What Happens */}
        <div className="bg-blue-900 bg-opacity-50 rounded-lg p-6 border border-blue-700">
          <h3 className="font-semibold mb-3">¿Qué sucede ahora?</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">✓</span>
              <span>No se le ha cobrado dinero</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">✓</span>
              <span>Puede continuar con el plan gratuito</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">✓</span>
              <span>Puede intentar contratar un plan en cualquier momento</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/pricing')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Volver a Intentar
          </button>
          <button
            onClick={() => router.push('/agents')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Ir al Panel de Control
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Volver al Inicio
          </button>
        </div>

        {/* Help Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>¿Necesitas Ayuda?</span>
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Si experimentas problemas al realizar el pago, nuestro equipo de soporte está aquí para ayudarte.
          </p>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Email:</span>{' '}
              <a href="mailto:support@metadash.com" className="text-blue-400 hover:text-blue-300">
                support@metadash.com
              </a>
            </p>
            <p>
              <span className="text-gray-500">Teléfono:</span>{' '}
              <a href="tel:+1234567890" className="text-blue-400 hover:text-blue-300">
                +1 (234) 567-8900
              </a>
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="text-center text-xs text-gray-500">
          <p>Documentación de ayuda:{' '}
            <a href="/docs/payment" className="text-blue-400 hover:text-blue-300">
              Preguntas sobre pagos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
