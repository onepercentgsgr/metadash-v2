'use client';

import { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { api } from '../lib/api';

export default function SettingsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResults, setTestResults] = useState({});

  // Track which fields user has actually modified
  const modifiedFields = useRef(new Set());

  const [ga4File, setGa4File] = useState(null);

  const [formData, setFormData] = useState({
    meta_access_token: '',
    meta_ad_account_id: '',
    meta_app_id: '',
    meta_app_secret: '',
    anthropic_api_key: '',
    hf_api_key: '',
    negocio_info: '',
    landing_page_url: '',
    shopify_store_url: '',
    shopify_webhook_secret: '',
    mercadopago_access_token: '',
    ga4_property_id: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      setLoading(true);
      const data = await api.getConfig();
      setConfig(data);
      // Set form data but DON'T mark fields as modified
      setFormData(data);
      modifiedFields.current.clear();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    modifiedFields.current.add(name);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      } catch {
        setError('El archivo no es un JSON válido');
      }
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Only send fields that the user actually modified
      const payload = {};
      modifiedFields.current.forEach(field => {
        if (field === 'ga4_credentials_json') {
          payload.ga4_credentials_json = ga4File;
        } else {
          payload[field] = formData[field];
        }
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
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function isMasked(value) {
    return typeof value === 'string' && value.includes('***');
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando configuración...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const sections = [
    {
      title: 'Meta Ads',
      icon: '📱',
      description: 'Conecta tu cuenta de Meta Business para acceder a campañas y métricas',
      fields: [
        { name: 'meta_access_token', label: 'Access Token', type: 'password', help: 'Token de acceso de la API de Meta Marketing' },
        { name: 'meta_ad_account_id', label: 'ID de Cuenta de Anuncios', type: 'text', help: 'Formato: act_XXXXXXXXX' },
        { name: 'meta_app_id', label: 'App ID', type: 'text', help: 'ID de tu aplicación en Meta Developers' },
        { name: 'meta_app_secret', label: 'App Secret', type: 'password', help: 'Secret de tu aplicación' },
      ],
    },
    {
      title: 'Agentes IA',
      icon: '🤖',
      description: 'Claves API para los agentes de inteligencia artificial',
      fields: [
        { name: 'anthropic_api_key', label: 'Clave API Anthropic (Claude)', type: 'password', help: 'Necesaria para todos los agentes IA' },
        { name: 'hf_api_key', label: 'Clave API HuggingFace', type: 'password', help: 'Opcional — para funciones avanzadas' },
      ],
    },
    {
      title: 'Información del Negocio',
      icon: '🏪',
      description: 'Contexto que los agentes usan para personalizar sus análisis',
      fields: [
        { name: 'negocio_info', label: 'Descripción del Negocio', type: 'textarea', help: 'Describe tu negocio, productos, público objetivo, etc. Cuanto más detalle, mejores los análisis.' },
        { name: 'landing_page_url', label: 'URL Landing Page', type: 'url', help: 'URL principal de tu landing — el auditor la analiza automáticamente' },
      ],
    },
    {
      title: 'Google Analytics 4',
      icon: '📊',
      description: 'Conecta GA4 para que los agentes analicen tráfico, conversiones y comportamiento de usuarios',
      fields: [
        { name: 'ga4_property_id', label: 'GA4 Property ID', type: 'text', help: 'ID numérico de tu propiedad GA4 (ej: 123456789)' },
      ],
      customContent: 'ga4_upload',
    },
    {
      title: 'Shopify',
      icon: '🛍️',
      description: 'Integración con tu tienda Shopify',
      fields: [
        { name: 'shopify_store_url', label: 'URL de la Tienda', type: 'url', help: 'ejemplo: https://mi-tienda.myshopify.com' },
        { name: 'shopify_webhook_secret', label: 'Webhook Secret', type: 'password' },
      ],
    },
    {
      title: 'Pagos',
      icon: '💳',
      description: 'Integración de pagos',
      fields: [
        { name: 'mercadopago_access_token', label: 'MercadoPago Access Token', type: 'password' },
      ],
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Configuración</h1>
          <p className="text-gray-400 mt-1">Conecta tus servicios y configura los agentes IA</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 flex items-center gap-3">
            <span className="text-red-400 text-lg">⚠️</span>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 flex items-center gap-3">
            <span className="text-green-400 text-lg">✓</span>
            <p className="text-green-200 text-sm">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden"
            >
              <div className="p-5 pb-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">{section.icon}</span>
                  <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                </div>
                {section.description && (
                  <p className="text-sm text-gray-500 ml-11 mb-4">{section.description}</p>
                )}
              </div>

              <div className="p-5 pt-2 space-y-4">
                {section.customContent === 'ga4_upload' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Credenciales de Service Account (JSON)
                      {config?.ga4_credentials_json && (
                        <span className="ml-2 text-xs text-green-400 font-normal">Configurado</span>
                      )}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer bg-gray-800/80 border border-dashed border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors text-center">
                        {ga4File ? '✓ Archivo cargado' : 'Subir archivo JSON de Service Account'}
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleGa4FileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Creá una Service Account en Google Cloud Console con acceso a GA4 y descargá el JSON
                    </p>
                  </div>
                )}
                {section.fields.map((field) => {
                  const val = formData[field.name] || '';
                  const masked = isMasked(val) && !modifiedFields.current.has(field.name);
                  return (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        {field.label}
                        {masked && (
                          <span className="ml-2 text-xs text-green-400 font-normal">Configurado</span>
                        )}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          value={val}
                          onChange={handleChange}
                          placeholder={field.help || `Ingresa ${field.label.toLowerCase()}`}
                          rows={4}
                          className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                        />
                      ) : (
                        <input
                          type={field.type === 'password' && masked ? 'text' : field.type}
                          name={field.name}
                          value={val}
                          onChange={handleChange}
                          onFocus={() => {
                            // Clear masked value when user focuses to type a new one
                            if (masked) {
                              setFormData(prev => ({ ...prev, [field.name]: '' }));
                              modifiedFields.current.add(field.name);
                            }
                          }}
                          placeholder={field.help || `Ingresa ${field.label.toLowerCase()}`}
                          className={`w-full bg-gray-800/80 border rounded-lg px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 ${
                            masked
                              ? 'border-green-700/40 text-green-300/70 focus:border-green-500 focus:ring-green-500'
                              : 'border-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500'
                          }`}
                        />
                      )}
                      {field.help && !masked && (
                        <p className="text-xs text-gray-600 mt-1">{field.help}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:hover:from-indigo-600 disabled:hover:to-purple-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 text-sm"
            >
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
            <button
              type="button"
              onClick={fetchConfig}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors text-sm font-medium border border-gray-700"
            >
              Restablecer
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export function getServerSideProps(context) {
  return {
    props: {},
  };
}
