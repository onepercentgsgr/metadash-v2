'use client';

import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const ANGLES = [
  'dolor + agitación',
  'transformación before/after',
  'detrás de escena / autenticidad',
  'mito vs. realidad del nicho',
  'tutorial rápido de valor gratuito',
  'testimonial/resultado real',
  'tendencia + nicho (trend hijacking)',
];

export default function VideosPage() {
  const [todayVideo, setTodayVideo] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [angle, setAngle] = useState(ANGLES[0]);
  const [activeTab, setActiveTab] = useState('today');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [todayRes, histRes] = await Promise.all([
        fetch(`${API}/videos/daily`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/videos/history`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const todayData = await todayRes.json();
      const histData = await histRes.json();
      setTodayVideo(todayData.video || null);
      setHistory(Array.isArray(histData) ? histData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const generateNow = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API}/agents/tiktok/video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: { angulo: angle } }),
      });
      const data = await res.json();
      if (res.ok) {
        const content = data.content || JSON.stringify(data);
        setTodayVideo({ content, angle, date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() });
        setHistory((prev) => [{ content, angle, date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() }, ...prev]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const today = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Videos del Día</h1>
            <p className="text-gray-400 text-sm mt-1 capitalize">{today} — generado automáticamente a las 9 AM</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-700/30 rounded-lg px-3 py-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Auto-generación activa
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800">
          {[
            { id: 'today', label: 'Hoy' },
            { id: 'history', label: `Historial (${history.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? 'text-pink-300 border-pink-500'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Today Tab */}
        {activeTab === 'today' && (
          <div className="space-y-5">
            {loading ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm">Cargando video del día...</p>
              </div>
            ) : todayVideo ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎬</span>
                    <div>
                      <span className="text-sm font-semibold text-white">Video de Hoy</span>
                      <span className="text-xs text-gray-500 ml-2">— {todayVideo.angle}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(todayVideo.content)}
                    className="text-xs text-gray-500 hover:text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1"
                  >
                    Copiar guion
                  </button>
                </div>
                <pre className="p-5 text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-[600px] overflow-y-auto">
                  {todayVideo.content}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center space-y-4">
                <p className="text-gray-400 text-sm">
                  No hay video generado para hoy todavía.<br />
                  El scheduler lo genera automáticamente a las 9 AM, o podés generarlo ahora.
                </p>
              </div>
            )}

            {/* Manual Generate */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Generar video ahora</h3>
              <div className="flex gap-3">
                <select
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                >
                  {ANGLES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <button
                  onClick={generateNow}
                  disabled={generating}
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  {generating ? 'Generando...' : 'Generar ahora'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm">No hay videos generados todavía.</p>
              </div>
            ) : (
              history.map((v, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🎬</span>
                      <div>
                        <span className="text-sm font-medium text-white">{v.date}</span>
                        <span className="text-xs text-gray-500 ml-2">— {v.angle}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(v.content)}
                      className="text-xs text-gray-500 hover:text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1"
                    >
                      Copiar
                    </button>
                  </div>
                  <pre className="p-4 text-xs text-gray-400 whitespace-pre-wrap font-mono max-h-[200px] overflow-y-auto">
                    {v.content}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
