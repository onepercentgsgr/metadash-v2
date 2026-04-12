'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const steps = [
  { id: 1, name: 'Bienvenida', icon: '👋' },
  { id: 2, name: 'Meta Ads', icon: '📊' },
  { id: 3, name: 'Google Analytics', icon: '📈' },
  { id: 4, name: 'Preferencias', icon: '⚙️' },
  { id: 5, name: 'Completado', icon: '🎉' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    meta_access_token: '',
    meta_ad_account_id: '',
    ga4_property_id: '',
    ga4_file: null,
    autonomousMode: 'hybrid',
    emailNotifications: true,
  });

  useEffect(() => {
    if (user?.onboarded_at) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileUpload = (e) => {
    setFormData((prev) => ({
      ...prev,
      ga4_file: e.target.files[0],
    }));
  };

  const handleNext = async () => {
    if (currentStep === 5) {
      // Complete onboarding
      setLoading(true);
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('meta_access_token', formData.meta_access_token);
        formDataToSend.append('meta_ad_account_id', formData.meta_ad_account_id);
        formDataToSend.append('ga4_property_id', formData.ga4_property_id);
        if (formData.ga4_file) {
          formDataToSend.append('ga4_file', formData.ga4_file);
        }
        formDataToSend.append('autonomousMode', formData.autonomousMode);
        formDataToSend.append('emailNotifications', formData.emailNotifications);

        await api.apiFetch('/auth/complete-onboarding', {
          method: 'POST',
          body: formDataToSend,
        });

        router.push('/dashboard');
      } catch (error) {
        console.error('Error completing onboarding:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const isStepValid = () => {
    if (currentStep === 2) {
      return formData.meta_access_token && formData.meta_ad_account_id;
    }
    if (currentStep === 3) {
      return formData.ga4_property_id;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenido a MetaDash</h1>
          <p className="text-gray-400">Vamos a configurar tu cuenta en {steps.length - 1} pasos</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center cursor-pointer transition-all ${
                  step.id <= currentStep ? 'opacity-100' : 'opacity-50'
                }`}
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                    step.id < currentStep
                      ? 'bg-green-600 text-white'
                      : step.id === currentStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {step.id < currentStep ? '✓' : step.icon}
                </div>
                <span className="text-xs text-gray-400 mt-2 text-center max-w-12">
                  {step.name}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 backdrop-blur">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  ¡Hola, {user?.name || 'Usuario'}!
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  MetaDash es una plataforma de IA que optimiza tus campañas publicitarias de Meta Ads
                  automáticamente, analiza tus métricas y te da recomendaciones para escalar tu negocio.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                {[
                  '🤖 8 agentes de IA especializados trabajando 24/7',
                  '📊 Análisis de campañas, finanzas y creatividades',
                  '📈 Google Analytics integrado',
                  '🔒 Conexión segura con Meta Ads',
                  '⚡ Auditoría automática de landing pages',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Conecta Meta Ads</h2>
                <p className="text-gray-400 text-sm">
                  MetaDash necesita acceso a tu cuenta de Meta Ads para analizar y optimizar tus campañas.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Access Token de Meta Ads
                  </label>
                  <input
                    type="password"
                    name="meta_access_token"
                    value={formData.meta_access_token}
                    onChange={handleInputChange}
                    placeholder="Pega tu access token aquí"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Obtén tu token en{' '}
                    <a
                      href="https://developers.facebook.com/tools/accesstoken"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      Facebook Graph API
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ID de Cuenta de Ads
                  </label>
                  <input
                    type="text"
                    name="meta_ad_account_id"
                    value={formData.meta_ad_account_id}
                    onChange={handleInputChange}
                    placeholder="Ej: act_123456789"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lo encontrás en Ads Manager → Configuración
                  </p>
                </div>
              </div>

              <div className="bg-blue-900/30 border border-blue-700/40 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  💡 Estos datos se encriptan y se almacenan de forma segura. Solo se usan para conectar
                  con Meta Ads.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Google Analytics (Opcional)</h2>
                <p className="text-gray-400 text-sm">
                  Conecta tu GA4 para que los agentes vean el comportamiento de tus usuarios y den
                  mejores recomendaciones.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ID de Propiedad de GA4
                  </label>
                  <input
                    type="text"
                    name="ga4_property_id"
                    value={formData.ga4_property_id}
                    onChange={handleInputChange}
                    placeholder="Ej: 123456789"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lo encontrás en Google Analytics → Admin → Propiedades
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Archivo JSON de Credenciales (Opcional)
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-indigo-600 transition cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="ga4-file"
                    />
                    <label htmlFor="ga4-file" className="cursor-pointer">
                      <div className="text-2xl mb-2">📄</div>
                      <p className="text-sm text-white font-medium">
                        {formData.ga4_file?.name || 'Sube tu archivo de credenciales JSON'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Descárgalo desde Google Cloud Console
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700/40 rounded-lg p-4">
                <p className="text-sm text-yellow-300">
                  ⚠️ Paso opcional pero recomendado. Sin GA4, los agentes tendrán recomendaciones más
                  básicas.
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Preferencias</h2>
                <p className="text-gray-400 text-sm">Elige cómo quieres que trabajen los agentes.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Modo de Agentes Autónomos
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        value: 'hybrid',
                        label: 'Híbrido (Recomendado)',
                        desc: 'Los agentes optimizan automáticamente, pero te piden aprobación para cambios grandes',
                      },
                      {
                        value: 'manual',
                        label: 'Manual',
                        desc: 'Los agentes solo dan recomendaciones, tú decides si aplicarlas',
                      },
                      {
                        value: 'full',
                        label: 'Completamente Autónomo',
                        desc: 'Los agentes hacen cambios sin tu aprobación (solo para expertos)',
                      },
                    ].map((mode) => (
                      <label key={mode.value} className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-indigo-600 cursor-pointer transition">
                        <input
                          type="radio"
                          name="autonomousMode"
                          value={mode.value}
                          checked={formData.autonomousMode === mode.value}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{mode.label}</p>
                          <p className="text-xs text-gray-500">{mode.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={formData.emailNotifications}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">Recibir notificaciones por email</p>
                      <p className="text-xs text-gray-500">
                        Alertas sobre cambios importantes y resúmenes semanales
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">¡Todo configurado!</h2>
                <p className="text-gray-400 leading-relaxed">
                  Tu cuenta está lista. Los agentes de IA comenzarán a analizar tus campañas en tiempo
                  real y te darán recomendaciones dentro de poco.
                </p>
              </div>

              <div className="bg-green-900/30 border border-green-700/40 rounded-lg p-4 text-left mt-6">
                <h3 className="text-sm font-semibold text-green-300 mb-2">Próximos pasos:</h3>
                <ul className="text-sm text-green-300/80 space-y-1">
                  <li>✓ Los agentes comenzarán el análisis automáticamente</li>
                  <li>✓ Verás resultados en el dashboard en 2-3 minutos</li>
                  <li>✓ Recibiras notificaciones cuando haya recomendaciones nuevas</li>
                  <li>✓ Puedes ajustar configuraciones en cualquier momento</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
          >
            Atrás
          </button>
          <button
            onClick={handleNext}
            disabled={!isStepValid() || loading}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Completando...
              </>
            ) : currentStep === steps.length ? (
              <>Ir al Dashboard →</>
            ) : (
              <>Siguiente →</>
            )}
          </button>
        </div>

        {/* Skip onboarding link */}
        {currentStep < 5 && (
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-400 transition"
            >
              Saltear y ir al dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function getServerSideProps(context) {
  return { props: {} };
}
