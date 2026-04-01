'use client';

import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { api } from '../lib/api';

export default function SettingsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      setLoading(true);
      const data = await api.getConfig();
      setConfig(data);
      setFormData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await api.updateConfig(formData);
      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">Cargando configuración...</div>
        </div>
      </Layout>
    );
  }

  const sections = [
    {
      title: 'Meta Ads',
      icon: '📱',
      fields: [
        { name: 'meta_access_token', label: 'Access Token', type: 'password' },
        { name: 'meta_ad_account_id', label: 'ID de Cuenta de Anuncios', type: 'text' },
        { name: 'meta_app_id', label: 'App ID', type: 'text' },
        { name: 'meta_app_secret', label: 'App Secret', type: 'password' },
      ],
    },
    {
      title: 'Agentes IA',
      icon: '🤖',
      fields: [
        { name: 'anthropic_api_key', label: 'Clave API Anthropic', type: 'password' },
        { name: 'hf_api_key', label: 'Clave API HuggingFace', type: 'password' },
      ],
    },
    {
      title: 'Información del Negocio',
      icon: '🏪',
      fields: [
        { name: 'negocio_info', label: 'Descripción del Negocio', type: 'textarea' },
        { name: 'landing_page_url', label: 'URL Landing Page', type: 'url' },
      ],
    },
    {
      title: 'Shopify',
      icon: '🛍️',
      fields: [
        { name: 'shopify_store_url', label: 'URL de la Tienda', type: 'url' },
        { name: 'shopify_webhook_secret', label: 'Webhook Secret', type: 'password' },
      ],
    },
    {
      title: 'MercadoPago',
      icon: '💳',
      fields: [
        { name: 'mercadopago_access_token', label: 'Access Token', type: 'password' },
      ],
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">⚙️ Configuración</h1>
          <p className="text-gray-400">Configura tus APIs y credenciales para acceder a todos los servicios</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
            <p className="text-green-200">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4"
            >
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">{section.icon}</span>
                {section.title}
              </h2>

              <div className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        placeholder={`Ingresa ${field.label.toLowerCase()}`}
                        rows={4}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        placeholder={`Ingresa ${field.label.toLowerCase()}`}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {saving ? 'Guardando...' : '💾 Guardar configuración'}
          </button>
        </form>

        {/* Info Box */}
        <div className="bg-indigo-900/20 border border-indigo-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-indigo-300 mb-2">💡 Consejo</h3>
          <p className="text-sm text-gray-300">
            Los tokens y claves sensibles se guardan de forma segura. Por seguridad, solo se muestra los últimos 10 caracteres.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export function getServerSideProps(context) {
  return {
    props: {},
  };
}
