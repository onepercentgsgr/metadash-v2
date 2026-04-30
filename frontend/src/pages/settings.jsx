'use client';

import { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icons';
import { api } from '../lib/api';

const SECTIONS = [
  {
    id: 'meta',
    title: 'Meta Ads',
    icon: 'campaigns',
    accent: '#3b82f6',
    description: 'Conecta tu cuenta de Meta Business para acceder a campañas y métricas',
    fields: [
      { name: 'meta_access_token',  label: 'Access Token',             type: 'password', help: 'Token de acceso de la API de Meta Marketing' },
      { name: 'meta_ad_account_id', label: 'ID de Cuenta de Anuncios', type: 'text',     help: 'Formato: act_XXXXXXXXX' },
      { name: 'meta_app_id',        label: 'App ID',                   type: 'text',     help: 'ID de tu aplicación en Meta Developers' },
      { name: 'meta_app_secret',    label: 'App Secret',               type: 'password', help: 'Secret de tu aplicación' },
    ],
  },
  {
    id: 'ai',
    title: 'Agentes IA',
    icon: 'brain',
    accent: '#8b5cf6',
    description: 'Claves API para los agentes de inteligencia artificial',
    fields: [
      { name: 'anthropic_api_key', label: 'Clave API Anthropic (Claude)', type: 'password', help: 'Necesaria para todos los agentes IA' },
      { name: 'hf_api_key',        label: 'Clave API HuggingFace',        type: 'password', help: 'Opcional — para funciones avanzadas' },
    ],
  },
  {
    id: 'negocio',
    title: 'Información del Negocio',
    icon: 'store',
    accent: '#f59e0b',
    description: 'Contexto que los agentes usan para personalizar sus análisis',
    fields: [
      { name: 'negocio_info',    label: 'Descripción del Negocio', type: 'textarea', help: 'Describe tu negocio, productos, público objetivo, etc. Cuanto más detalle, mejores los análisis.' },
      { name: 'landing_page_url',label: 'URL Landing Page',        type: 'url',      help: 'URL principal de tu landing — el auditor la analiza automáticamente' },
    ],
  },
  {
    id: 'ga4',
    title: 'Google Analytics 4',
    icon: 'financials',
    accent: '#f97316',
    description: 'Conecta GA4 para análisis de tráfico, conversiones y comportamiento',
    fields: [
      { name: 'ga4_property_id', label: 'GA4 Property ID', type: 'text', help: 'ID numérico de tu propiedad GA4 (ej: 123456789)' },
    ],
    customContent: 'ga4_upload',
  },
  {
    id: 'shopify',
    title: 'Shopify',
    icon: 'shopify',
    accent: '#10b981',
    description: 'Integración con tu tienda Shopify',
    fields: [
      { name: 'shopify_store_url',       label: 'URL de la Tienda', type: 'url',      help: 'Ej: https://mi-tienda.myshopify.com' },
      { name: 'shopify_webhook_secret',  label: 'Webhook Secret',   type: 'password' },
    ],
  },
  {
    id: 'pagos',
    title: 'Pagos',
    icon: 'creditcard',
    accent: '#6366f1',
    description: 'Integración de pagos con MercadoPago',
    fields: [
      { name: 'mercadopago_access_token', label: 'MercadoPago Access Token', type: 'password' },
    ],
  },
];

export default function SettingsPage() {
  const [config, setConfig]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const modifiedFields            = useRef(new Set());
  const [ga4File, setGa4File]     = useState(null);
  const [formData, setFormData]   = useState({
    meta_access_token: '', meta_ad_account_id: '', meta_app_id: '', meta_app_secret: '',
    anthropic_api_key: '', hf_api_key: '', negocio_info: '', landing_page_url: '',
    shopify_store_url: '', shopify_webhook_secret: '', mercadopago_access_token: '',
    ga4_property_id: '',
  });

  useEffect(() => { fetchConfig(); }, []);

  async function fetchConfig() {
    try {
      setLoading(true);
      const data = await api.getConfig();
      setConfig(data);
      setFormData(data);
      modifiedFields.current.clear();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    modifiedFields.current.add(name);
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleGa4FileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        setGa4File(json);
        modifiedFields.current.add('ga4_credentials_json');
        setSuccess('Archivo de credenciales GA4 cargado');
        setTimeout(() => setSuccess(''), 3000);
      } catch { setError('El archivo no es un JSON válido'); }
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const payload = {};
      modifiedFields.current.forEach(field => {
        if (field === 'ga4_credentials_json') payload.ga4_credentials_json = ga4File;
        else payload[field] = formData[field];
      });
      if (Object.keys(payload).length === 0) {
        setSuccess('No hay cambios para guardar');
        setSaving(false);
        return;
      }
      await api.updateConfig(payload);
      setSuccess('Configuración guardada exitosamente');
      modifiedFields.current.clear();
      setGa4File(null);
      await fetchConfig();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  function isMasked(value) {
    return typeof value === 'string' && value.includes('***');
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-sm" style={{ color: '#9ca3af' }}>Cargando configuración...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const inputBase = "w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-7">

        {/* Header */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#6366f1' }}>
            Integraciones &amp; APIs
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Configuración</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Conecta tus servicios y configura los agentes IA</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ color: '#f87171' }}><Icon name="warning" size={14} strokeWidth={2} /></span>
            <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ color: '#34d399' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>
            <p className="text-sm" style={{ color: '#6ee7b7' }}>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.id} className="rounded-2xl overflow-hidden"
              style={{ background: '#16161a', border: '1px solid #1e1e24' }}>

              {/* Section header */}
              <div className="px-5 pt-5 pb-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${section.accent}15`, border: `1px solid ${section.accent}25`, color: section.accent }}>
                  <Icon name={section.icon} size={17} strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-none mb-1">{section.title}</h2>
                  {section.description && (
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{section.description}</p>
                  )}
                </div>
              </div>

              <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid #1e1e24', paddingTop: '1.25rem' }}>
                {section.customContent === 'ga4_upload' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>
                      Credenciales Service Account (JSON)
                      {config?.ga4_credentials_json && (
                        <span className="ml-2 text-[10px] font-bold" style={{ color: '#34d399' }}>● Configurado</span>
                      )}
                    </label>
                    <label className="block cursor-pointer">
                      <div className="rounded-xl p-4 text-center transition-all"
                        style={{ border: '1px dashed #2a2a35', background: '#0d0d11' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = section.accent; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a35'; }}
                      >
                        <span className="text-xs font-medium flex items-center gap-2" style={{ color: ga4File ? '#34d399' : '#9ca3af' }}>
                          {ga4File ? '✓ Archivo cargado' : 'Subir archivo JSON de Service Account'}
                        </span>
                        <input type="file" accept=".json" onChange={handleGa4FileChange} className="hidden" />
                      </div>
                    </label>
                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                      Creá una Service Account en Google Cloud Console con acceso a GA4 y descargá el JSON
                    </p>
                  </div>
                )}

                {section.fields.map((field) => {
                  const val    = formData[field.name] || '';
                  const masked = isMasked(val) && !modifiedFields.current.has(field.name);
                  return (
                    <div key={field.name}>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9ca3af' }}>
                        {field.label}
                        {masked && (
                          <span className="ml-2 text-[10px] font-bold normal-case tracking-normal" style={{ color: '#34d399' }}>
                            ● Configurado
                          </span>
                        )}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          value={val}
                          onChange={handleChange}
                          placeholder={field.help || `Ingresa ${field.label.toLowerCase()}`}
                          rows={4}
                          className={inputBase}
                          style={{ background: '#0d0d11', border: '1px solid #2a2a35', color: 'white', resize: 'none' }}
                        />
                      ) : (
                        <input
                          type={field.type === 'password' && masked ? 'text' : field.type}
                          name={field.name}
                          value={val}
                          onChange={handleChange}
                          onFocus={() => {
                            if (masked) {
                              setFormData(prev => ({ ...prev, [field.name]: '' }));
                              modifiedFields.current.add(field.name);
                            }
                          }}
                          placeholder={field.help || `Ingresa ${field.label.toLowerCase()}`}
                          className={inputBase}
                          style={masked
                            ? { background: '#0d0d11', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }
                            : { background: '#0d0d11', border: '1px solid #2a2a35', color: 'white' }
                          }
                        />
                      )}
                      {field.help && !masked && (
                        <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{field.help}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit */}
          <div className="flex items-center gap-3 pb-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                color: 'white',
                boxShadow: saving ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
            <button
              type="button"
              onClick={fetchConfig}
              className="px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: '#16161a', color: '#9ca3af', border: '1px solid #2a2a35' }}
            >
              Restablecer
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
