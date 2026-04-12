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
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition"
          >
            Ir al Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            MetaDash
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-gray-300 hover:text-white transition">
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            Agentes de IA que{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              escalan tu negocio
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            MetaDash es tu equipo de especialistas en marketing en IA. Optimiza campañas Meta Ads,
            analiza finanzas, audita landing pages y crece sin parar — 24/7, completamente autónomo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl font-semibold text-lg transition transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Comenzar Gratis <ArrowIcon className="w-5 h-5" />
            </Link>

            <button
              onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border border-gray-700 hover:border-indigo-500 rounded-xl font-semibold transition"
            >
              Ver Demo
            </button>
          </div>

          {/* Social proof */}
          <div className="text-sm text-gray-500">
            <p>Únete a{' '}
              <span className="text-indigo-400 font-semibold">100+ agencias y freelancers</span>
            {' '}que ya están escalando</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Tus 8 mejores especialistas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '📊',
                name: 'Campaign Optimizer',
                desc: 'Optimiza automáticamente presupuestos, audiencias y creativas de tus campañas.',
              },
              {
                icon: '💰',
                name: 'Financial Advisor',
                desc: 'Analiza ROI, CPC, CPM y te dice exactamente dónde estás perdiendo dinero.',
              },
              {
                icon: '🎨',
                name: 'Creative Analyzer',
                desc: 'Evalúa tus creatividades y sugiere cambios basados en engagement y CTR.',
              },
              {
                icon: '📈',
                name: 'Growth Strategist',
                desc: 'Crea estrategias de crecimiento escalable para el próximo trimestre.',
              },
              {
                icon: '🔍',
                name: 'Landing Page Auditor',
                desc: 'Audita tu landing page y sugiere cambios para aumentar conversiones.',
              },
              {
                icon: '✍️',
                name: 'Content Generator',
                desc: 'Genera scripts, headlines y copy de ads optimizados con IA.',
              },
              {
                icon: '📱',
                name: 'CRO Specialist',
                desc: 'Optimiza la experiencia de usuario y reduce bounce rate.',
              },
              {
                icon: '📱',
                name: 'Analytics Advisor',
                desc: 'Conecta Google Analytics para recomendaciones basadas en datos reales.',
              },
            ].map((agent, i) => (
              <div
                key={i}
                className="bg-gray-900/60 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-6 transition transform hover:scale-105"
              >
                <div className="text-3xl mb-3">{agent.icon}</div>
                <h3 className="font-bold text-white mb-2">{agent.name}</h3>
                <p className="text-sm text-gray-400">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Cómo funciona en 3 pasos</h2>

          <div className="space-y-12">
            {[
              {
                step: '1',
                title: 'Conecta tu cuenta Meta Ads',
                desc: 'Autoriza acceso seguro a tus campañas. MetaDash nunca ve tu dinero, solo optimiza tus campañas.',
              },
              {
                step: '2',
                title: 'Los agentes comienzan a trabajar',
                desc: 'En tiempo real, los 8 agentes analizan tus campañas, datos de Google Analytics y landing page.',
              },
              {
                step: '3',
                title: 'Recibe recomendaciones o cambios automáticos',
                desc: 'En modo híbrido, aprobarás cambios importantes. En modo autónomo, confía en los agentes.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-600">
                    <span className="text-xl font-bold">{item.step}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">¿Por qué usar MetaDash?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              'Automatiza lo tedioso, enfócate en estrategia',
              'Escala sin contratar un equipo de especialistas',
              'IA que aprende de tus datos y mejora cada día',
              'Soporte 24/7 de agentes inteligentes',
              'Auditoría automática cada 6 horas',
              'Recomendaciones basadas en datos reales',
              'Integraciones con Meta Ads y Google Analytics',
              'Panel de control simple e intuitivo',
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckIcon className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <p className="text-gray-300">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section id="demo" className="py-20 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Planes para cualquier negocio</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { name: 'Trial', price: 'Gratis', period: '14 días' },
              { name: 'Starter', price: '$29', period: 'mes' },
              { name: 'Pro', price: '$79', period: 'mes', popular: true },
              { name: 'Enterprise', price: '$199', period: 'mes' },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-xl p-6 border transition ${
                  plan.popular
                    ? 'bg-indigo-600/20 border-indigo-500 scale-105'
                    : 'bg-gray-900/60 border-gray-800'
                }`}
              >
                {plan.popular && (
                  <div className="text-xs font-bold text-indigo-300 mb-2 uppercase">Más Popular</div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-2">/ {plan.period}</span>
                </div>
                <button className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition text-sm">
                  Elegir Plan
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm">
            <Link href="/pricing" className="text-indigo-400 hover:text-indigo-300">
              Ver detalles completos de planes →
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">¿Listo para escalar tu negocio?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Comienza gratis hoy. Sin tarjeta de crédito, sin sorpresas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2"
            >
              Registrarse Gratis <ArrowIcon className="w-5 h-5" />
            </Link>

            <Link
              href="/pricing"
              className="px-8 py-4 border border-gray-700 hover:border-indigo-500 rounded-xl font-semibold transition"
            >
              Ver Planes Completos
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/pricing" className="hover:text-white transition">
                    Planes
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white transition">
                    Características
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Compañía</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Términos
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Social</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex justify-between items-center">
              <p className="text-gray-500 text-sm">© 2026 MetaDash. All rights reserved.</p>
              <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                MetaDash
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function getServerSideProps(context) {
  return { props: {} };
}
