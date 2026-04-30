'use client';

import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const ANGLES = [
  { id: 'dolor',     label: 'Dolor + agitación',               icon: '😤' },
  { id: 'before',    label: 'Transformación before/after',     icon: '✨' },
  { id: 'detras',    label: 'Detrás de escena / autenticidad', icon: '🎥' },
  { id: 'mito',      label: 'Mito vs. realidad del nicho',     icon: '💡' },
  { id: 'tutorial',  label: 'Tutorial rápido de valor',        icon: '📚' },
  { id: 'testimonio',label: 'Testimonial / resultado real',    icon: '⭐' },
  { id: 'trend',     label: 'Tendencia + nicho (trend hijack)',icon: '🔥' },
];

export default function VideosPage() {
  const [todayVideo, setTodayVideo]   = useState(null);
  const [history, setHistory]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [generating, setGenerating]   = useState(false);
  const [angle, setAngle]             = useState(ANGLES[0].label);
  const [activeTab, setActiveTab]     = useState('today');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [todayRes, histRes] = await Promise.all([
        fetch(`${API}/videos/daily`,   { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/videos/history`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const todayData = await todayRes.json();
      const histData  = await histRes.json();
      setTodayVideo(todayData.video || null);
      setHistory(Array.isArray(histData) ? histData : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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
        const entry = { content, angle, date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() };
        setTodayVideo(entry);
        setHistory((prev) => [entry, ...prev]);
      }
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  const today = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Layout>
      <div className="space-y-7">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#ec4899' }}>
              TikTok · Auto-generación
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Videos del Día</h1>
            <p className="text-sm mt-1 capitalize" style={{ color: '#6b7280' }}>
              {today} — generado automáticamente a las 9 AM
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981', display: 'inline-block' }} />
            Auto-generación activa
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#16161a', border: '1px solid #1e1e24', width: 'fit-content' }}>
          {[
            { id: 'today',   label: 'Hoy' },
            { id: 'history', label: `Historial (${history.length})` },
          ].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-all"
              style={activeTab === t.id
                ? { background: '#0d0d11', color: '#f9a8d4', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }
                : { color: '#6b7280' }
              }>
              {t.label}
            </button>
          ))}
        </div>

        {/* Today Tab */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {loading ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm" style={{ color: '#9ca3af' }}>Cargando video del día...</p>
              </div>
            ) : todayVideo ? (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#16161a', border: '1px solid rgba(236,72,153,0.2)' }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(236,72,153,0.15)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(236,72,153,0.12)' }}>
                      🎬
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">Video de Hoy</span>
                      <span className="text-xs ml-2" style={{ color: '#9ca3af' }}>— {todayVideo.angle}</span>
                    </div>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(todayVideo.content)}
                    className="text-xs rounded-lg px-2 py-1"
                    style={{ background: '#0d0d11', border: '1px solid #2a2a35', color: '#9ca3af' }}>
                    Copiar guion
                  </button>
                </div>
                <pre className="p-5 text-sm whitespace-pre-wrap font-mono max-h-[600px] overflow-y-auto leading-relaxed"
                  style={{ color: '#d1d5db' }}>
                  {todayVideo.content}
                </pre>
              </div>
            ) : (
              <div className="rounded-2xl p-8 text-center" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                <div className="text-4xl mb-3">🎬</div>
                <p className="text-sm mb-1 text-white font-semibold">No hay video generado para hoy todavía</p>
                <p className="text-xs mb-0" style={{ color: '#9ca3af' }}>
                  El scheduler lo genera automáticamente a las 9 AM, o generalo ahora abajo.
                </p>
              </div>
            )}

            {/* Manual Generate */}
            <div className="rounded-2xl p-5 space-y-4" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ec4899' }} />
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Generar video ahora</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ANGLES.map((a) => (
                  <button key={a.id} onClick={() => setAngle(a.label)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all"
                    style={angle === a.label
                      ? { background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.35)', color: '#f9a8d4' }
                      : { background: '#0d0d11', border: '1px solid #2a2a35', color: '#9ca3af' }
                    }>
                    <span>{a.icon}</span>
                    <span className="leading-tight truncate">{a.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={generateNow} disabled={generating}
                className="w-full py-2.5 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg,#db2777,#ec4899)',
                  color: 'white',
                  boxShadow: generating ? 'none' : '0 4px 15px rgba(236,72,153,0.2)',
                }}>
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generando...
                  </span>
                ) : '🎬 Generar ahora'}
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                <div className="text-3xl mb-3">🕐</div>
                <p className="text-sm" style={{ color: '#9ca3af' }}>No hay videos generados todavía.</p>
              </div>
            ) : (
              history.map((v, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                  <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e24' }}>
                    <div className="flex items-center gap-3">
                      <span>🎬</span>
                      <div>
                        <span className="text-xs font-semibold text-white">{v.date}</span>
                        <span className="text-xs ml-2" style={{ color: '#6b7280' }}>— {v.angle}</span>
                      </div>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(v.content)}
                      className="text-xs rounded-lg px-2 py-1"
                      style={{ background: '#0d0d11', border: '1px solid #2a2a35', color: '#9ca3af' }}>
                      Copiar
                    </button>
                  </div>
                  <pre className="p-4 text-xs whitespace-pre-wrap font-mono max-h-[200px] overflow-y-auto"
                    style={{ color: '#9ca3af' }}>
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
