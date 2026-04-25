'use client';

import { useState } from 'react';
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

export default function TikTokPage() {
  const [activeSection, setActiveSection] = useState('video');
  const [angle, setAngle] = useState(ANGLES[0]);
  const [videoOutput, setVideoOutput] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const [calendarOutput, setCalendarOutput] = useState('');
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const generateVideo = async () => {
    setVideoLoading(true);
    setVideoOutput('');
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
    } catch (e) {
      setVideoOutput(`Error: ${e.message}`);
    } finally {
      setVideoLoading(false);
    }
  };

  const generateCalendar = async () => {
    setCalendarLoading(true);
    setCalendarOutput('');
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
    } catch (e) {
      setCalendarOutput(`Error: ${e.message}`);
    } finally {
      setCalendarLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">TikTok — Agencia Orgánica</h1>
          <p className="text-gray-400 text-sm mt-1">1 video por día, guionado con IA, adaptado a tu nicho y mercado</p>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 border-b border-gray-800">
          {[
            { id: 'video', label: '🎬 Video de Hoy' },
            { id: 'calendar', label: '📅 Calendario Semanal' },
            { id: 'history', label: '🕐 Historial' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeSection === s.id
                  ? 'text-pink-300 border-pink-500'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Video Section */}
        {activeSection === 'video' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-white font-semibold mb-1">🎬 Video de Hoy</h2>
                <p className="text-gray-400 text-sm">Seleccioná el ángulo y el agente genera hook, guion completo, caption y hashtags.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ángulo del video</label>
                <select
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                >
                  {ANGLES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={generateVideo}
                disabled={videoLoading}
                className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                {videoLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Generando guion...
                  </span>
                ) : (
                  '🎬 Generar video de hoy'
                )}
              </button>
            </div>

            {videoOutput && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Guion generado — {angle}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(videoOutput)}
                    className="text-xs text-gray-500 hover:text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1"
                  >
                    Copiar
                  </button>
                </div>
                <pre className="p-5 text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-[600px] overflow-y-auto">
                  {videoOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Calendar Section */}
        {activeSection === 'calendar' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-white font-semibold mb-1">📅 Calendario Semanal</h2>
                <p className="text-gray-400 text-sm">
                  7 videos con ángulos rotativos, hooks, captions y horarios de publicación optimizados para tu mercado.
                  El agente lee tu producto de la memoria compartida.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ['Día 1', 'dolor + agitación'],
                  ['Día 2', 'transformación before/after'],
                  ['Día 3', 'detrás de escena'],
                  ['Día 4', 'mito vs. realidad'],
                  ['Día 5', 'tutorial de valor gratuito'],
                  ['Día 6', 'testimonial/resultado'],
                  ['Día 7', 'trend hijacking'],
                ].map(([day, angle]) => (
                  <div key={day} className="flex items-center gap-3 bg-gray-800/40 rounded-lg px-3 py-2 text-sm">
                    <span className="font-semibold text-gray-400 w-12">{day}</span>
                    <span className="text-gray-300">{angle}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={generateCalendar}
                disabled={calendarLoading}
                className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                {calendarLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Generando calendario...
                  </span>
                ) : (
                  '📅 Generar calendario de 7 días'
                )}
              </button>
            </div>

            {calendarOutput && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Calendario semanal</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(calendarOutput)}
                    className="text-xs text-gray-500 hover:text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1"
                  >
                    Copiar
                  </button>
                </div>
                <pre className="p-5 text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-[700px] overflow-y-auto">
                  {calendarOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* History Section */}
        {activeSection === 'history' && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm">No hay contenido generado todavía en esta sesión.</p>
                <p className="text-gray-600 text-xs mt-2">Generá un video o calendario para verlo aquí.</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.type === 'video' ? '🎬' : '📅'}</span>
                      <div>
                        <span className="text-sm font-medium text-white">
                          {item.type === 'video' ? `Video — ${item.angle}` : 'Calendario semanal'}
                        </span>
                        <span className="text-xs text-gray-500 ml-3">{item.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(item.content)}
                      className="text-xs text-gray-500 hover:text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1"
                    >
                      Copiar
                    </button>
                  </div>
                  <pre className="p-4 text-xs text-gray-400 whitespace-pre-wrap font-mono max-h-[200px] overflow-y-auto">
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
