'use client';

import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';

const TABS = [
  { id: 'records', label: 'Registros',      icon: '📊' },
  { id: 'upload',  label: 'Importar Excel', icon: '📤' },
  { id: 'add',     label: 'Agregar Manual', icon: '➕' },
];

const EMPTY_RECORD = { periodo: '', ingresos: '', costos: '', ad_spend: '', devoluciones: '', ordenes: '' };

export default function FinancialsPage() {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [tab, setTab]           = useState('records');
  const [newRecord, setNewRecord] = useState(EMPTY_RECORD);

  useEffect(() => { fetchRecords(); }, []);

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
    setNewRecord((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddRecord(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!newRecord.periodo) { setError('El período es requerido'); return; }
    try {
      const payload = {
        periodo:      newRecord.periodo,
        ingresos:     newRecord.ingresos     ? parseInt(newRecord.ingresos)     : null,
        costos:       newRecord.costos       ? parseInt(newRecord.costos)       : null,
        ad_spend:     newRecord.ad_spend     ? parseInt(newRecord.ad_spend)     : null,
        devoluciones: newRecord.devoluciones ? parseInt(newRecord.devoluciones) : null,
        ordenes:      newRecord.ordenes      ? parseInt(newRecord.ordenes)      : null,
      };
      await api.apiFetch('/finance/records', { method: 'POST', body: JSON.stringify(payload) });
      setSuccess('Registro creado exitosamente');
      setNewRecord(EMPTY_RECORD);
      await fetchRecords();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setSuccess(''); setUploading(true);
    try {
      const result = await api.uploadExcel(file);
      setSuccess(`${result.records_created} registros importados exitosamente`);
      await fetchRecords();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  }

  const inputClass = "w-full rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none transition-colors text-white";
  const inputStyle = { background: '#0d0d11', border: '1px solid #2a2a35', color: 'white' };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-7">

        {/* Header */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#10b981' }}>
            Gestión Financiera
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Registros Financieros</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Seguimiento de ingresos, costos, ad spend y márgenes</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ color: '#f87171' }}>⚠</span>
            <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ color: '#34d399' }}>✓</span>
            <p className="text-sm" style={{ color: '#6ee7b7' }}>{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#16161a', border: '1px solid #1e1e24', width: 'fit-content' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-all"
              style={tab === t.id
                ? { background: '#0d0d11', color: '#e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }
                : { color: '#6b7280' }
              }
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* TAB: Records */}
        {tab === 'records' && (
          <div>
            {loading ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm" style={{ color: '#6b7280' }}>Cargando registros...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>No hay registros financieros aún</p>
                <button
                  onClick={() => setTab('add')}
                  className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
                >
                  Agregar primer registro
                </button>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e1e24' }}>
                      {['Período', 'Ingresos', 'Costos', 'Ad Spend', 'Devoluciones', 'Órdenes', 'Fecha'].map((h, i) => (
                        <th key={h} className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-widest ${i > 0 && i < 6 ? 'text-right' : 'text-left'}`}
                          style={{ color: '#6b7280' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="transition-colors hover:bg-white/[0.02]"
                        style={{ borderBottom: '1px solid rgba(30,30,36,0.6)' }}>
                        <td className="px-5 py-3.5 font-semibold" style={{ color: '#e5e7eb' }}>{record.periodo}</td>
                        <td className="px-5 py-3.5 text-right font-semibold" style={{ color: '#34d399' }}>
                          {record.ingresos ? `$${record.ingresos.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right" style={{ color: '#f87171' }}>
                          {record.costos ? `$${record.costos.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right" style={{ color: '#fbbf24' }}>
                          {record.ad_spend ? `$${record.ad_spend.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right" style={{ color: '#9ca3af' }}>
                          {record.devoluciones ? `$${record.devoluciones.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right" style={{ color: '#a5b4fc' }}>
                          {record.ordenes || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: '#6b7280' }}>
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

        {/* TAB: Upload */}
        {tab === 'upload' && (
          <div className="rounded-2xl p-8" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  📤
                </div>
                <h3 className="text-base font-bold text-white mb-1">Importar desde Excel</h3>
                <p className="text-sm" style={{ color: '#9ca3af' }}>Carga un archivo Excel con tus registros financieros</p>
              </div>

              <label className="block cursor-pointer">
                <div
                  className="rounded-xl p-8 text-center transition-all"
                  style={{ border: '2px dashed #2a2a35', background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a35'; }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">📁</span>
                    <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>
                      {uploading ? 'Subiendo...' : 'Hacé clic o arrastrá tu archivo'}
                    </span>
                    <span className="text-xs" style={{ color: '#6b7280' }}>XLSX, XLS o CSV · Máx. 5 MB</span>
                  </div>
                </div>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} disabled={uploading} className="hidden" />
              </label>

              <p className="text-xs text-center" style={{ color: '#6b7280' }}>
                Columnas esperadas: Período, Ingresos, Costos, Ad Spend, Devoluciones, Órdenes
              </p>
            </div>
          </div>
        )}

        {/* TAB: Add Manual */}
        {tab === 'add' && (
          <div className="rounded-2xl p-6 max-w-2xl" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
            <h3 className="text-base font-bold text-white mb-5">Agregar Registro Manual</h3>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9ca3af' }}>
                  Período <span style={{ color: '#6366f1' }}>*</span>
                </label>
                <input type="text" name="periodo" value={newRecord.periodo} onChange={handleInputChange}
                  placeholder="2024-01" required className={inputClass} style={inputStyle} />
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Formato: YYYY-MM</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'ingresos',     label: 'Ingresos',     color: '#34d399' },
                  { name: 'costos',       label: 'Costos',       color: '#f87171' },
                  { name: 'ad_spend',     label: 'Ad Spend',     color: '#fbbf24' },
                  { name: 'devoluciones', label: 'Devoluciones', color: '#9ca3af' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: f.color, opacity: 0.8 }}>
                      {f.label}
                    </label>
                    <input type="number" name={f.name} value={newRecord[f.name]} onChange={handleInputChange}
                      placeholder="0" className={inputClass} style={inputStyle} />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#a5b4fc', opacity: 0.8 }}>
                  Órdenes
                </label>
                <input type="number" name="ordenes" value={newRecord.ordenes} onChange={handleInputChange}
                  placeholder="0" className={inputClass} style={inputStyle} />
              </div>

              <button type="submit"
                className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: 'linear-gradient(135deg,#059669,#10b981)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(16,185,129,0.2)',
                }}>
                Guardar Registro
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
