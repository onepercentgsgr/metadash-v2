'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { api } from '@/lib/api';

export default function FinancialsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('records'); // records | upload

  // Form state for new record
  const [newRecord, setNewRecord] = useState({
    periodo: '',
    ingresos: '',
    costos: '',
    ad_spend: '',
    devoluciones: '',
    ordenes: '',
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      setLoading(true);
      const data = await api.getRecords();
      setRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setNewRecord((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleAddRecord(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newRecord.periodo) {
      setError('El período es requerido');
      return;
    }

    try {
      // Note: The API endpoint for creating a single record isn't explicitly shown in main.py
      // We'll create a POST endpoint call similar to the pattern
      const payload = {
        periodo: newRecord.periodo,
        ingresos: newRecord.ingresos ? parseInt(newRecord.ingresos) : null,
        costos: newRecord.costos ? parseInt(newRecord.costos) : null,
        ad_spend: newRecord.ad_spend ? parseInt(newRecord.ad_spend) : null,
        devoluciones: newRecord.devoluciones ? parseInt(newRecord.devoluciones) : null,
        ordenes: newRecord.ordenes ? parseInt(newRecord.ordenes) : null,
      };

      await api.apiFetch('/finance/records', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccess('Registro creado exitosamente');
      setNewRecord({
        periodo: '',
        ingresos: '',
        costos: '',
        ad_spend: '',
        devoluciones: '',
        ordenes: '',
      });
      await fetchRecords();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const result = await api.uploadExcel(file);
      setSuccess(`${result.records_created} registros importados exitosamente`);
      await fetchRecords();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">💰 Registros Financieros</h1>
          <p className="text-gray-400">Gestiona tu información financiera y realiza seguimiento</p>
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

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800">
          <button
            onClick={() => setTab('records')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              tab === 'records'
                ? 'border-indigo-600 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            📊 Registros
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              tab === 'upload'
                ? 'border-indigo-600 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            📤 Importar Excel
          </button>
          <button
            onClick={() => setTab('add')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              tab === 'add'
                ? 'border-indigo-600 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            ➕ Agregar Manual
          </button>
        </div>

        {/* TAB: Records List */}
        {tab === 'records' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Cargando registros...</div>
            ) : records.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400 mb-4">No hay registros financieros aún</p>
                <button
                  onClick={() => setTab('add')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                >
                  Agregar primer registro
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-6 py-3 text-left text-gray-400 font-semibold">Período</th>
                      <th className="px-6 py-3 text-right text-gray-400 font-semibold">Ingresos</th>
                      <th className="px-6 py-3 text-right text-gray-400 font-semibold">Costos</th>
                      <th className="px-6 py-3 text-right text-gray-400 font-semibold">Ad Spend</th>
                      <th className="px-6 py-3 text-right text-gray-400 font-semibold">Devoluciones</th>
                      <th className="px-6 py-3 text-right text-gray-400 font-semibold">Órdenes</th>
                      <th className="px-6 py-3 text-left text-gray-400 font-semibold">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-white font-medium">{record.periodo}</td>
                        <td className="px-6 py-4 text-right text-green-400">
                          ${record.ingresos?.toLocaleString() || '—'}
                        </td>
                        <td className="px-6 py-4 text-right text-red-400">
                          ${record.costos?.toLocaleString() || '—'}
                        </td>
                        <td className="px-6 py-4 text-right text-yellow-400">
                          ${record.ad_spend?.toLocaleString() || '—'}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-400">
                          ${record.devoluciones?.toLocaleString() || '—'}
                        </td>
                        <td className="px-6 py-4 text-right text-blue-400">
                          {record.ordenes || '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {new Date(record.created_at).toLocaleDateString('es-ES')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: Upload Excel */}
        {tab === 'upload' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">📤</div>
                <h3 className="text-lg font-semibold text-white mb-2">Importar desde Excel</h3>
                <p className="text-gray-400 text-sm">
                  Carga un archivo Excel con tus registros financieros
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-indigo-600 transition-colors">
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">📁</span>
                    <span className="text-sm text-gray-300">
                      {uploading ? 'Subiendo...' : 'Haz clic o arrastra tu archivo'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Soporta: Excel (.xlsx, .xls) y CSV. Máximo 5 MB.
                <br />
                Columnas esperadas: Período, Ingresos, Costos, Ad Spend, Devoluciones, Órdenes
              </p>
            </div>
          </div>
        )}

        {/* TAB: Add Manual Record */}
        {tab === 'add' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl">
            <h3 className="text-lg font-semibold text-white mb-6">Agregar Registro Manual</h3>

            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Período * (Ej: 2024-01)
                </label>
                <input
                  type="text"
                  name="periodo"
                  value={newRecord.periodo}
                  onChange={handleInputChange}
                  placeholder="2024-01"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ingresos</label>
                  <input
                    type="number"
                    name="ingresos"
                    value={newRecord.ingresos}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Costos</label>
                  <input
                    type="number"
                    name="costos"
                    value={newRecord.costos}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ad Spend</label>
                  <input
                    type="number"
                    name="ad_spend"
                    value={newRecord.ad_spend}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Devoluciones</label>
                  <input
                    type="number"
                    name="devoluciones"
                    value={newRecord.devoluciones}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Órdenes</label>
                <input
                  type="number"
                  name="ordenes"
                  value={newRecord.ordenes}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                ✅ Guardar Registro
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
