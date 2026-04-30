'use client';

import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icons';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const ANGLES = [
  { id: 'dolor',     label: 'Dolor + agitación',              icon: 'rocket'     },
  { id: 'before',    label: 'Transformación before/after',    icon: 'campaigns'  },
  { id: 'detras',    label: 'Detrás de escena / autenticidad',icon: 'videos'     },
  { id: 'mito',      label: 'Mito vs. realidad del nicho',    icon: 'audit'      },
  { id: 'tutorial',  label: 'Tutorial rápido de valor',       icon: 'agents'     },
  { id: 'testimonio',label: 'Testimonial / resultado real',   icon: 'crown'      },
  { id: 'trend',     label: 'Tendencia + nicho (trend hijack)',icon: 'rocket'    },
];

const CALENDAR_PLAN = [
  ['Día 1', 'dolor + agitación'],
  ['Día 2', 'transformación before/after'],
  ['Día 3', 'detrás de escena'],
  ['Día 4', 'mito vs. realidad'],
  ['Día 5', 'tutorial de valor'],
  ['Día 6', 'testimonial / resultado'],
  ['Día 7', 'trend hijacking'],
];

export default function TikTokPage() {
  const [activeSection, setActiveSection] = useState('video');
  const [angle, setAngle]                 = useState(ANGLES[0].label);
  const [videoOutput, setVideoOutput]     = useState('');
  const [videoLoading, setVideoLoading]   = useState(false);
  const [calendarOutput, setCalendarOutput] = useState('');
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [history, setHistory]             = useState([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const generateVideo = async () => {
    setVideoLoading(true); setVideoOutput('');
    try {
      const res = await fetch(`${API}/agents/tiktok/video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: { angulo: angle } }),
      });
      const data = await res.json();
      const output = res.ok ? (data.content || JSON.stringify(data)) : (data.detail || 'Error');
      setVideoOutput(output);
      if (res.ok) {
        setHistory((prev) => [
          { id: Date.now(), type: 'video', angle, date: new Date().toLocaleString('es'), content: output },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (e) { setVideoOutput(`Error: ${e.message}`); }
    finally { setVideoLoading(false); }
  };

  const generateCalendar = async () => {
    setCalendarLoading(true); setCalendarOutput('');
    try {
      const res = await fetch(`${API}/agents/tiktok/calendar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: {} }),
      });
      const data = await res.json();
      const output = res.ok ? (data.content || JSON.stringify(data)) : (data.detail || 'Error');
      setCalendarOutput(output);
      if (res.ok) {
        setHistory((prev) => [
          { id: Date.now(), type: 'calendar', date: new Date().toLocaleString('es'), content: output },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (e) { setCalendarOutput(`Error: ${e.message}`); }
    finally { setCalendarLoading(false); }
  };

  const TABS = [
    { id: 'video',    label: 'Video de Hoy',                  icon: 'videos'    },
    { id: 'calendar', label: 'Calendario 7 días',             icon: 'calendar'  },
    { id: 'history',  label: `Historial (${history.length})`, icon: 'dashboard' },
  ];

  return (
    <Layout>
      <div className="space-y-7">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#ec4899' }}>
              Contenido Orgánico
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">TikTok — Agencia Orgánica</h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>1 video por día, guionado con IA, adaptado a tu nicho y mercado</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', color: '#f9a8d4' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ec4899' }} />
            Orgánico activo
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#16161a', border: '1px solid #1e1e24', width: 'fit-content' }}>
          {TABS.map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
              style={activeSection === s.id
                ? { background: '#0d0d11', color: '#f9a8d4', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }
                : { color: '#6b7280' }
              }>
              <Icon name={s.icon} size={13} strokeWidth={2} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Video Section */}
        {activeSection === 'video' && (
          <div className="space-y-5">
            <div className="rounded-2xl p-6 space-y-5" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
              <div>
                <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Icon name="videos" size={14} strokeWidth={2} style={{ color: '#ec4899' }} />Video de Hoy</h2>
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  Seleccioná el ángulo y el agente genera hook, guion completo, caption y hashtags.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>
                  Ángulo del video
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {ANGLES.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAngle(a.label)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all"
                      style={angle === a.label
                        ? { background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.35)', color: '#f9a8d4' }
                        : { background: '#0d0d11', border: '1px solid #2a2a35', color: '#9ca3af' }
                      }
                    >
                      <Icon name={a.icon} size={13} strokeWidth={2} />
                      <span className="leading-tight">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateVideo}
                disabled={videoLoading}
                className="w-full py-3 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg,#db2777,#ec4899)',
                  color: 'white',
                  boxShadow: videoLoading ? 'none' : '0 4px 20px rgba(236,72,153,0.25)',
                }}
              >
                {videoLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generando guion...
                  </span>
                ) : <span className="flex items-center justify-center gap-2"><Icon name="play" size={15} strokeWidth={2} />Generar video de hoy</span>}
              </button>
            </div>

            {videoOutput && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#16161a', border: '1px solid rgba(236,72,153,0.2)' }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(236,72,153,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ec4899' }} />
                    <span className="text-xs font-semibold" style={{ color: '#f9a8d4' }}>Guion generado — {angle}</span>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(videoOutput)}
                    className="text-xs rounded-lg px-2 py-1 transition-colors"
                    style={{ background: '#0d0d11', border: '1px solid #2a2a35', color: '#9ca3af' }}>
                    Copiar
                  </button>
                </div>
                <pre className="p-5 text-sm whitespace-pre-wrap font-mono max-h-[600px] overflow-y-auto leading-relaxed"
                  style={{ color: '#d1d5db' }}>
                  {videoOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Calendar Section */}
        {activeSection === 'calendar' && (
          <div className="space-y-5">
            <div className="rounded-2xl p-6 space-y-5" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
              <div>
                <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Icon name="calendar" size={14} strokeWidth={2} style={{ color: '#ec4899' }} />Calendario Semanal</h2>
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  7 videos con ángulos rotativos, hooks, captions y horarios de publicación optimizados.
                  El agente lee tu producto de la memoria compartida.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CALENDAR_PLAN.map(([day, ang]) => (
                  <div key={day} className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                    style={{ background: '#0d0d11', border: '1px solid #1e1e24' }}>
                    <span className="text-xs font-bold w-10 shrink-0" style={{ color: '#6b7280' }}>{day}</span>
                    <span style={{ color: '#ec4899', flexShrink: 0 }}><Icon name="tiktok" size={12} strokeWidth={2} /></span>
                    <span className="text-xs" style={{ color: '#d1d5db' }}>{ang}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={generateCalendar}
                disabled={calendarLoading}
                className="w-full py-3 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg,#db2777,#ec4899)',
                  color: 'white',
                  boxShadow: calendarLoading ? 'none' : '0 4px 20px rgba(236,72,153,0.25)',
                }}
              >
                {calendarLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generando calendario...
                  </span>
                ) : <span className="flex items-center justify-center gap-2"><Icon name="calendar" size={15} strokeWidth={2} />Generar calendario de 7 días</span>}
              </button>
            </div>

            {calendarOutput && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#16161a', border: '1px solid rgba(236,72,153,0.2)' }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(236,72,153,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ec4899' }} />
                    <span className="text-xs font-semibold" style={{ color: '#f9a8d4' }}>Calendario semanal</span>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(calendarOutput)}
                    className="text-xs rounded-lg px-2 py-1"
                    style={{ background: '#0d0d11', border: '1px solid #2a2a35', color: '#9ca3af' }}>
                    Copiar
                  </button>
                </div>
                <pre className="p-5 text-sm whitespace-pre-wrap font-mono max-h-[700px] overflow-y-auto leading-relaxed"
                  style={{ color: '#d1d5db' }}>
                  {calendarOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* History Section */}
        {activeSection === 'history' && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                <div className="text-3xl mb-3">🎬</div>
                <p className="text-sm" style={{ color: '#9ca3af' }}>No hay contenido generado todavía en esta sesión.</p>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Generá un video o calendario para verlo aquí.</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="rounded-2xl overflow-hidden"
                  style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                  <div className="px-5 py-3 flex items-center justify-between"
                    style={{ borderBottom: '1px solid #1e1e24' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.type === 'video' ? '🎬' : '📅'}</span>
                      <div>
                        <span className="text-xs font-semibold text-white">
                          {item.type === 'video' ? `Video — ${item.angle}` : 'Calendario semanal'}
                        </span>
                        <span className="text-xs ml-2" style={{ color: '#6b7280' }}>{item.date}</span>
                      </div>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(item.content)}
                      className="text-xs rounded-lg px-2 py-1"
                      style={{ background: '#0d0d11', border: '1px solid #2a2a35', color: '#9ca3af' }}>
                      Copiar
                    </button>
                  </div>
                  <pre className="p-4 text-xs whitespace-pre-wrap font-mono max-h-[200px] overflow-y-auto"
                    style={{ color: '#9ca3af' }}>
                    {item.content}
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
