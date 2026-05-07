'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/Icons';

const STATUS_BADGE = {
  running:  { label: 'En curso',   cls: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300' },
  complete: { label: 'Completo',   cls: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' },
  done:     { label: 'Completo',   cls: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' },
  error:    { label: 'Error',      cls: 'bg-red-500/15 border-red-500/40 text-red-300' },
};

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDuration(secs) {
  if (secs == null) return '—';
  if (secs < 60) return `${Math.round(secs)}s`;
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}m ${s}s`;
}

export default function RunsHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [runs, setRuns] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setErrorMsg('No estás logueado. Volvé a entrar a la cuenta.');
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      const [runsRes, quotaRes] = await Promise.all([
        fetch(`${API_URL}/agents/infoproducto/runs`, { headers }),
        fetch(`${API_URL}/me/pipeline-quota`, { headers }),
      ]);

      if (runsRes.ok) {
        setRuns(await runsRes.json());
      } else if (runsRes.status === 401) {
        setErrorMsg('Sesión expirada. Volvé a iniciar sesión.');
      } else {
        const detail = await runsRes.json().catch(() => ({}));
        setErrorMsg(detail.detail || `Error ${runsRes.status} cargando los runs`);
      }
      if (quotaRes.ok) {
        setQuota(await quotaRes.json());
      }
    } catch (e) {
      setErrorMsg(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    // Don't gate on `user` being non-null — the AuthContext can race.
    // We fetch using the token directly; the API will 401 if it's invalid.
    fetchAll();
  }, [authLoading, fetchAll]);

  const downloadBundle = async (runId) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const tokRes = await fetch(`${API_URL}/agents/infoproducto/bundle/${runId}/download-token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!tokRes.ok) throw new Error('No se pudo generar el token de descarga');
      const { token: dlToken } = await tokRes.json();
      window.location.href = `${API_URL}/agents/infoproducto/bundle/${runId}/by-token?token=${encodeURIComponent(dlToken)}`;
    } catch (e) {
      alert('Error descargando bundle: ' + (e?.message || e));
    }
  };

  if (authLoading) return null;

  const quotaText = quota
    ? (quota.limit == null
        ? `Plan ${quota.plan_display} · ilimitado`
        : `Has usado ${quota.used} de ${quota.limit} este mes · Plan ${quota.plan_display}`)
    : '—';

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans">
      {/* Header */}
      <header className="border-b border-[#1e1e24] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/infoproducto')}
            className="text-gray-500 hover:text-gray-300 text-sm"
          >
            ← Volver a Infoproducto
          </button>
          <div className="h-6 w-px bg-[#27272f]" />
          <h1 className="text-base font-extrabold tracking-tight">
            🎬 Mis infoproductos generados
          </h1>
        </div>
        <button
          onClick={() => router.push('/infoproducto/run')}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-900/30"
        >
          <Icon name="rocket" size={13} />
          Nuevo infoproducto
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Quota panel */}
        <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-1">
              Cuota mensual
            </div>
            <div className="text-sm text-gray-200 font-semibold">{quotaText}</div>
            {quota && quota.limit != null && (
              <div className="mt-2 h-1.5 w-64 bg-[#1e1e24] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${Math.min(100, Math.round((quota.used / Math.max(1, quota.limit)) * 100))}%` }}
                />
              </div>
            )}
          </div>
          {quota && quota.remaining != null && (
            <div className="text-right">
              <div className="text-2xl font-extrabold text-indigo-400">{quota.remaining}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500">restantes</div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="bg-red-950/20 border border-red-700/40 rounded-xl p-4 mb-6 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-500 text-sm py-20">⏳ Cargando…</div>
        ) : runs.length === 0 ? (
          <div className="bg-gradient-to-br from-indigo-950/30 to-[#16161a] border border-[#1e1e24] rounded-2xl p-12 text-center">
            <div className="text-5xl mb-3">🎬</div>
            <h2 className="text-xl font-extrabold text-gray-100 mb-2">Todavía no generaste ningún infoproducto</h2>
            <p className="text-sm text-gray-400 mb-6">
              Lanzá el pipeline Nivel Dios y en ~2 minutos tenés todo listo.
            </p>
            <button
              onClick={() => router.push('/infoproducto/run')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-900/40 hover:scale-105 transition"
            >
              Generá tu primer infoproducto
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((r) => {
              const badge = STATUS_BADGE[r.status] || { label: r.status, cls: 'bg-[#27272f] border-[#1e1e24] text-gray-300' };
              const isComplete = r.status === 'complete' || r.status === 'done';
              return (
                <div
                  key={r.run_id}
                  className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-700/40 transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-700/30 flex items-center justify-center text-base shrink-0">
                    🎬
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-100 truncate">
                        {r.product_name || 'Infoproducto sin nombre'}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-3">
                      <span>📅 {formatDate(r.started_at)}</span>
                      <span>⏱ {formatDuration(r.duration_seconds)}</span>
                      <span className="text-gray-600 font-mono">{r.run_id?.slice(0, 8)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isComplete && (
                      <>
                        <button
                          onClick={() => downloadBundle(r.run_id)}
                          className="px-3 py-2 rounded-lg bg-emerald-600/15 border border-emerald-600/40 hover:bg-emerald-600/25 text-emerald-300 text-xs font-semibold transition"
                          title="Descargar el ZIP con todos los entregables"
                        >
                          📦 Descargar bundle
                        </button>
                        <button
                          onClick={() => router.push(`/infoproducto/run/${r.run_id}`)}
                          className="px-3 py-2 rounded-lg bg-[#111114] border border-[#27272f] hover:bg-[#1e1e24] text-gray-300 text-xs font-semibold transition"
                        >
                          👀 Ver detalle
                        </button>
                      </>
                    )}
                    {r.status === 'running' && (
                      <span className="text-xs text-yellow-400/80">en progreso…</span>
                    )}
                    {r.status === 'error' && (
                      <span className="text-xs text-red-400/80">falló</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
