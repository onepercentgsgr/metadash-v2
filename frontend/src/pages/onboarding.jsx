'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Icon } from '../components/Icons';

const STEPS = [
  { id: 1, name: 'Bienvenida',    icon: 'rocket'    },
  { id: 2, name: 'Meta Ads',      icon: 'campaigns' },
  { id: 3, name: 'Analytics',     icon: 'financials'},
  { id: 4, name: 'Preferencias',  icon: 'settings'  },
  { id: 5, name: 'Completado',    icon: 'check'     },
];

const FEATURES = [
  '8 agentes de IA especializados trabajando 24/7',
  'Análisis de campañas, finanzas y creatividades',
  'Google Analytics integrado',
  'Conexión segura con Meta Ads',
  'Auditoría automática de landing pages',
];

const MODES = [
  { value: 'hybrid', label: 'Híbrido (Recomendado)', desc: 'Los agentes optimizan automáticamente, pero te piden aprobación para cambios grandes' },
  { value: 'manual', label: 'Manual',                desc: 'Los agentes solo dan recomendaciones, vos decidís si aplicarlas' },
  { value: 'full',   label: 'Completamente Autónomo',desc: 'Los agentes hacen cambios sin tu aprobación (solo para expertos)' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading]         = useState(false);
  const [formData, setFormData]       = useState({
    meta_access_token: '', meta_ad_account_id: '',
    ga4_property_id: '', ga4_file: null,
    autonomousMode: 'hybrid', emailNotifications: true,
  });

  useEffect(() => {
    if (user?.onboarded_at) router.push('/dashboard');
  }, [user, router]);

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleFileUpload(e) {
    setFormData(prev => ({ ...prev, ga4_file: e.target.files[0] }));
  }

  async function handleNext() {
    if (currentStep === 5) {
      setLoading(true);
      try {
        const fd = new FormData();
        fd.append('meta_access_token',   formData.meta_access_token);
        fd.append('meta_ad_account_id',  formData.meta_ad_account_id);
        fd.append('ga4_property_id',     formData.ga4_property_id);
        if (formData.ga4_file) fd.append('ga4_file', formData.ga4_file);
        fd.append('autonomousMode',      formData.autonomousMode);
        fd.append('emailNotifications',  formData.emailNotifications);
        await api.apiFetch('/auth/complete-onboarding', { method: 'POST', body: fd });
        router.push('/dashboard');
      } catch (err) {
        console.error('Error completing onboarding:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  }

  function handleBack() {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }

  function isStepValid() {
    if (currentStep === 2) return formData.meta_access_token && formData.meta_ad_account_id;
    if (currentStep === 3) return formData.ga4_property_id;
    return true;
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, color: 'white', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.15s, background 0.15s',
    boxSizing: 'border-box',
  };
  const onFocus = (e) => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.background = 'rgba(99,102,241,0.04)'; };
  const onBlur  = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.background = 'rgba(255,255,255,0.04)'; };

  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 font-sans"
      style={{ background: '#09090b' }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 400, background: 'radial-gradient(ellipse,rgba(99,102,241,0.1) 0%,transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div className="relative w-full max-w-xl">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)', boxShadow: '0 0 28px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 14, letterSpacing: '-0.02em', marginBottom: 16 }}>
            MD
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8 }}>
            Configurá tu cuenta
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 450 }}>
            4 pasos — menos de 2 minutos
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ marginBottom: 28 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
            {STEPS.map((step, i) => {
              const done    = step.id < currentStep;
              const active  = step.id === currentStep;
              return (
                <div key={step.id} className="flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
                  <div
                    className="flex items-center justify-center transition-all"
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: done ? '#10b981' : active ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(255,255,255,0.06)',
                      border: done ? 'none' : active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: done || active ? 'white' : 'rgba(255,255,255,0.25)',
                      boxShadow: active ? '0 0 16px rgba(99,102,241,0.45)' : 'none',
                    }}
                  >
                    {done ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    ) : (
                      <Icon name={step.icon} size={14} strokeWidth={2} />
                    )}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: active ? 'rgba(255,255,255,0.7)' : done ? '#34d399' : 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress line */}
          <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: 2, transition: 'width 0.4s ease', width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(22,22,26,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '32px', backdropFilter: 'blur(20px)', boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)', marginBottom: 16 }}>

          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6, letterSpacing: '-0.02em' }}>
                ¡Hola, {user?.name?.split(' ')[0] || 'bienvenido'}!
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, marginBottom: 24 }}>
                MetaDash es tu plataforma de IA para optimizar campañas de Meta Ads automáticamente, analizar métricas y escalar tu negocio.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {FEATURES.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#10b981', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 2: Meta Ads */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6, letterSpacing: '-0.02em' }}>Conectá Meta Ads</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, marginBottom: 24 }}>
                MetaDash necesita acceso a tu cuenta de Meta Ads para analizar y optimizar tus campañas.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Access Token de Meta Ads</label>
                  <input type="password" name="meta_access_token" value={formData.meta_access_token} onChange={handleInputChange}
                    placeholder="Pegá tu access token aquí" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
                    Obtené tu token en{' '}
                    <a href="https://developers.facebook.com/tools/accesstoken" target="_blank" rel="noopener noreferrer"
                      style={{ color: '#a5b4fc', textDecoration: 'none' }}>Facebook Graph API</a>
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>ID de Cuenta de Ads</label>
                  <input type="text" name="meta_ad_account_id" value={formData.meta_ad_account_id} onChange={handleInputChange}
                    placeholder="Ej: act_123456789" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
                    Lo encontrás en Ads Manager → Configuración
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 20, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }}><Icon name="lock" size={14} /></span>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Estos datos se encriptan y se almacenan de forma segura. Solo se usan para conectar con Meta Ads.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: GA4 */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6, letterSpacing: '-0.02em' }}>Google Analytics 4 <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>(Opcional)</span></h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, marginBottom: 24 }}>
                Conectá GA4 para que los agentes vean el comportamiento de tus usuarios y den mejores recomendaciones.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>ID de Propiedad de GA4</label>
                  <input type="text" name="ga4_property_id" value={formData.ga4_property_id} onChange={handleInputChange}
                    placeholder="Ej: 123456789" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
                    Google Analytics → Admin → Propiedades
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>Credenciales Service Account (JSON)</label>
                  <label htmlFor="ga4-file" style={{ display: 'block', cursor: 'pointer' }}>
                    <div style={{ ...inputStyle, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}><Icon name="file" size={15} /></span>
                      <span style={{ fontSize: 13, color: formData.ga4_file ? '#34d399' : 'rgba(255,255,255,0.35)' }}>
                        {formData.ga4_file?.name || 'Subir archivo JSON de Service Account'}
                      </span>
                    </div>
                    <input id="ga4-file" type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
                    Descargalo desde Google Cloud Console
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 20, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: '#fbbf24', flexShrink: 0, marginTop: 1 }}><Icon name="warning" size={14} /></span>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Paso opcional pero recomendado. Sin GA4, los agentes tendrán recomendaciones más básicas.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Preferences */}
          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6, letterSpacing: '-0.02em' }}>Preferencias</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, marginBottom: 24 }}>
                Elegí cómo querés que trabajen los agentes.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <label style={{ ...labelStyle, marginBottom: 10 }}>Modo de Agentes Autónomos</label>
                {MODES.map(mode => (
                  <label key={mode.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${formData.autonomousMode === mode.value ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, background: formData.autonomousMode === mode.value ? 'rgba(99,102,241,0.06)' : 'transparent', transition: 'all 0.15s' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${formData.autonomousMode === mode.value ? '#6366f1' : 'rgba(255,255,255,0.2)'}`, background: formData.autonomousMode === mode.value ? '#6366f1' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      {formData.autonomousMode === mode.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <input type="radio" name="autonomousMode" value={mode.value} checked={formData.autonomousMode === mode.value} onChange={handleInputChange} style={{ display: 'none' }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>{mode.label}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{mode.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
                <div
                  onClick={() => setFormData(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                  style={{ width: 40, height: 22, borderRadius: 11, background: formData.emailNotifications ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(255,255,255,0.1)', transition: 'all 0.2s', position: 'relative', cursor: 'pointer', flexShrink: 0, boxShadow: formData.emailNotifications ? '0 0 8px rgba(99,102,241,0.4)' : 'none' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: formData.emailNotifications ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 1 }}>Notificaciones por email</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Alertas importantes y resúmenes semanales</p>
                </div>
              </label>
            </div>
          )}

          {/* Step 5: Done */}
          {currentStep === 5 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 32px rgba(16,185,129,0.2)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8, letterSpacing: '-0.02em' }}>¡Todo configurado!</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, marginBottom: 24 }}>
                Tu cuenta está lista. Los agentes de IA comenzarán a analizar tus campañas y te darán recomendaciones dentro de poco.
              </p>
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '16px 20px', textAlign: 'left' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#34d399', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Próximos pasos</p>
                {[
                  'Los agentes comenzarán el análisis automáticamente',
                  'Verás resultados en el dashboard en 2-3 minutos',
                  'Recibirás notificaciones cuando haya recomendaciones nuevas',
                  'Podés ajustar configuraciones en cualquier momento',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 3 ? 8 : 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleBack} disabled={currentStep === 1}
            style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: currentStep === 1 ? 'not-allowed' : 'pointer', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', opacity: currentStep === 1 ? 0.4 : 1, transition: 'all 0.15s' }}>
            Atrás
          </button>
          <button onClick={handleNext} disabled={!isStepValid() || loading}
            style={{ flex: 2, padding: '11px', background: (!isStepValid() || loading) ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: 'none', borderRadius: 10, cursor: (!isStepValid() || loading) ? 'not-allowed' : 'pointer', color: 'white', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', boxShadow: (!isStepValid() || loading) ? 'none' : '0 4px 20px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Completando...</>
            ) : currentStep === STEPS.length ? 'Ir al Dashboard →' : 'Siguiente →'}
          </button>
        </div>

        {currentStep < 5 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={(e) => { e.target.style.color = 'rgba(255,255,255,0.45)'; }}
              onMouseLeave={(e) => { e.target.style.color = 'rgba(255,255,255,0.2)'; }}>
              Saltear y ir al dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
