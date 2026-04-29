'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ArrowIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Bienvenido de vuelta, {user.name}</h1>
          <Link href="/dashboard" className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition">
            Ir al Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">MetaDash</div>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-gray-300 hover:text-white transition">Login</Link>
            <Link href="/register" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">Prueba Gratis 7 días</Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-indigo-500/20 border border-indigo-500/50 rounded-full text-sm font-semibold text-indigo-300">
            ⚡ Lanza tu infoproducto en 4 horas
          </div>
          <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
            Crea y vende tu{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">primer infoproducto</span>
            {' '}sin experiencia
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            MetaDash genera automáticamente videos TikTok diarios, optimiza tus landing pages con IA,
            administra tus campañas de ads, y te conecta con MercadoPago.
            Todo lo que necesitas para vender en línea, ahora integrado en una plataforma.
          </p>
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <p className="text-sm text-gray-300 mb-3">Lo que obtienes:</p>
            <div className="grid grid-cols-2 gap-3 text-left">
              {['Videos TikTok automatizados', 'Landing pages optimizadas', 'Gestión de campañas Meta Ads', 'Pagos con MercadoPago', 'Panel de análisis completo', 'Soporte 24/7'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/register" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl font-bold text-lg transition transform hover:scale-105 flex items-center justify-center gap-2">
              Comienza Gratis por 7 Días <ArrowIcon className="w-5 h-5" />
            </Link>
            <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 border border-gray-700 hover:border-indigo-500 rounded-xl font-semibold transition">
              Ver Precios
            </button>
          </div>
          <div className="text-sm text-gray-500">
            <p>✓ Sin tarjeta de crédito • ✓ Acceso inmediato • ✓ Cancela cuando quieras</p>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Lanza en 4 pasos</h2>
          <div className="space-y-12">
            {[
              { step: '1', title: 'Regístrate en 2 minutos', desc: 'Crea tu cuenta con email y contraseña. No necesitas tarjeta de crédito para la prueba gratis.' },
              { step: '2', title: 'Conecta tus herramientas', desc: 'Integra Meta Ads, Google Analytics y MercadoPago. MetaDash genera todo automáticamente.' },
              { step: '3', title: 'Genera tu primer video', desc: 'MetaDash crea un video TikTok cada día con IA. Elige entre 7 ángulos de contenido comprobados.' },
              { step: '4', title: 'Vende y cobra', desc: 'Tus clientes compran tu infoproducto, MercadoPago cobra, MetaDash te da el dinero. Simple.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-8">
                <div className="flex-shrink-0"><div className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-600"><span className="text-xl font-bold">{item.step}</span></div></div>
                <div><h3 className="text-xl font-bold text-white mb-2">{item.title}</h3><p className="text-gray-400">{item.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Todo lo que necesitas para vender</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📹', name: 'Videos Automáticos', desc: 'Un video TikTok nuevo cada día, generado con IA. 7 ángulos probados para máxima conversión.' },
              { icon: '🚀', name: 'Landing Pages', desc: 'Crea y optimiza landing pages sin código. IA analiza y mejora automáticamente.' },
              { icon: '📊', name: 'Análisis Completo', desc: 'Dashboard con métricas de ventas, conversiones, ROI y más. Todo en un solo lugar.' },
              { icon: '💳', name: 'MercadoPago Integrado', desc: 'Cobra en ARS directamente. Sin comisiones ocultas. Recibe tu dinero cada mes.' },
              { icon: '🤖', name: 'IA Automática', desc: 'Agentes de IA que trabajan 24/7. Generan contenido, optimizan campañas, analizan datos.' },
              { icon: '🔗', name: 'Integraciones', desc: 'Conecta Meta Ads, Google Analytics, TikTok, Shopify y más en segundos.' },
            ].map((feature) => (
              <div key={feature.name} className="bg-gray-900/60 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-6 transition transform hover:scale-105">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-white mb-2 text-lg">{feature.name}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4">Planes simples y transparentes</h2>
          <p className="text-center text-gray-400 mb-16">Todas las funciones en todos los planes. Cancela cuando quieras.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '19.900', description: 'Perfecto para comenzar', features: ['1 video TikTok por día', '1 landing page', 'Análisis básico', 'Soporte por email'] },
              { name: 'Pro', price: '29.900', description: 'Recomendado para creadores', featured: true, features: ['Videos TikTok ilimitados', 'Landing pages ilimitadas', 'Análisis avanzado', 'Agentes IA 24/7', 'Soporte prioritario'] },
              { name: 'Enterprise', price: '79.900', description: 'Para agencias', features: ['Todo en Pro', 'Múltiples usuarios', 'API personalizada', 'Gestor de cuenta dedicado', 'Integraciones personalizadas'] },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 transition transform hover:scale-105 ${ plan.featured ? 'bg-gradient-to-b from-indigo-600/20 to-blue-600/20 border-2 border-indigo-500 relative' : 'bg-gray-900/60 border border-gray-800' }`}>
                {plan.featured && (<div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 px-4 py-1 rounded-full text-sm font-semibold">Más popular</div>)}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                <div className="mb-6"><span className="text-4xl font-bold">${plan.price}</span><span className="text-gray-400 ml-2">/mes</span></div>
                <Link href="/register" className={`w-full py-3 rounded-lg font-semibold transition block text-center mb-8 ${ plan.featured ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white' : 'border border-gray-700 hover:border-indigo-500 text-white' }`}>Empezar Ahora</Link>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Preguntas frecuentes</h2>
          <div className="space-y-6">
            {[
              { q: '¿Necesito experiencia en marketing?', a: 'No. MetaDash es diseñado para principiantes. Solo conecta tus cuentas y deja que la IA haga el trabajo.' },
              { q: '¿Qué pasa después de los 7 días gratis?', a: 'Tu suscripción se activa automáticamente según el plan que elegiste. Puedes cancelar en cualquier momento sin penalidades.' },
              { q: '¿Puedo usar MetaDash para varias personas?', a: 'Sí. Los planes Pro y Enterprise incluyen múltiples usuarios. Cada uno tiene su propio dashboard.' },
              { q: '¿Cómo retiro mis ganancias?', a: 'MercadoPago deposita directamente en tu cuenta bancaria. Tienes acceso inmediato a todas tus ventas.' },
              { q: '¿Qué pasa si algo se daña?', a: 'Tenemos soporte 24/7. Responden en menos de 2 horas. Plus, puedes revisar todos los cambios antes de aplicarlos.' },
            ].map((item) => (
              <div key={item.q} className="bg-gray-900/60 border border-gray-800 rounded-lg p-6">
                <h3 className="font-bold text-white mb-2">{item.q}</h3>
                <p className="text-gray-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">¿Listo para lanzar?</h2>
          <p className="text-xl text-gray-400 mb-8">7 días gratis. Sin tarjeta de crédito. Cancela cuando quieras.</p>
          <Link href="/register" className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl font-bold text-lg transition transform hover:scale-105">
            Comenzar Ahora →
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-12 text-center text-gray-500">
        <p>&copy; 2024 MetaDash. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
