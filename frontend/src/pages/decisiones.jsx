'use client';

import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const FILTERS = [
  { id: 'all',      label: 'Todas' },
  { id: 'executed', label: 'Ejecutadas' },
  { id: 'pending',  label: 'Pendientes' },
  { id: 'failed',   label: 'Fallidas' },
];

const STATUS_STYLE = {
  executed: { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  color: '#34d399',  label: 'Ejecutada' },
  pending:  { bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.2)',   color: '#fbbf24',  label: 'Pendiente' },
  failed:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   color: '#f87171',  label: 'Fallida'   },
};

const TRIGGERED_STYLE = {
  war_room: { bg: 'rgba(99,102,241,0.1)',  color: '#a5b4fc',  label: 'Guerra Room' },
  manual:   { bg: 'rgba(107,114,128,0.1)', color: '#9ca3af',  label: 'Manual'      },
  agent:    { bg: 'rgba(139,92,246,0.1)',  color: '#c4b5fd',  label: 'Agente'      },
};

function MetricCell({ before, after, measuring }) {
  if (measuring) {
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
        style={{ background: 'rgba(107,114,128,0.1)', color: '#9ca3af' }}>
        Midiendo resultado...
      </span>
    );
  }
  if (!before) return <span style={{ color: '#4b5563' }}>—</span>;
  return (
    <div className="space-y-0.5">
      {before.roas !== undefined && (
        <div className="text-[11px]" style={{ color: '#9ca3af' }}>ROAS {before.roas?.toFixed(2)}x</div>
      )}
      {before.cpa !== undefined && (
        <div className="text-[11px]" style={{ color: '#9ca3af' }}>CPA ${before.cpa}</div>
      )}
      {before.spend !== undefined && (
        <div className="text-[11px]" style={{ color: '#9ca3af' }}>Gasto ${before.spend}</div>
      )}
    </div>
  );
}

function DeltaCell({ before, after, measuring }) {
  if (measuring) return <span style={{ color: '#4b5563' }}>—</span>;
  if (!after) return <span style={{ color: '#4b5563' }}>—</span>;

  const roasDelta = before?.roas !== undefined && after.roas !== undefined
    ? after.roas - before.roas
    : null;

  return (
    <div className="space-y-0.5">
      {roasDelta !== null && (
        <div className="text-[11px] font-semibold" style={{ color: roasDelta >= 0 ? '#34d399' : '#f87171' }}>
          {roasDelta >= 0 ? `+${roasDelta.toFixed(2)}x ↑` : `${roasDelta.toFixed(2)}x ↓`}
        </div>
      )}
      {after.cpa !== undefined && before?.cpa !== undefined && (() => {
        const d = after.cpa - before.cpa;
        return (
          <div className="text-[11px]" style={{ color: d <= 0 ? '#34d399' : '#f87171' }}>
            CPA {d <= 0 ? `−$${Math.abs(d).toFixed(0)} ↓` : `+$${d.toFixed(0)} ↑`}
          </div>
        );
      })()}
      {after.spend !== undefined && (
        <div className="text-[11px]" style={{ color: '#9ca3af' }}>Gasto ${after.spend}</div>
      )}
    </div>
  );
}

export default function DecisionesPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [decisions, setDecisions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('all');

  useEffect(() => {
    async function load() {
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${API}/decisions?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setDecisions(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const filtered = filter === 'all' ? decisions : decisions.filter((d) => d.status === filter);

  const card = { background: '#16161a', border: '1px solid #1e1e24', borderRadius: '1rem' };

  return (
    <Layout>
      <div className="space-y-7">

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#6366f1' }}>
            Historial
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Decisiones</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Registro de todas las acciones ejecutadas con comparativa de resultados antes/después
          </p>
        </div>

        {error && (
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-4 py-1.5 text-xs font-semibold rounded-full transition-all"
              style={filter === f.id
                ? { background: '#6366f1', color: '#fff' }
                : { background: '#1e1e24', color: '#6b7280', border: '1px solid #2a2a35' }
              }
            >
              {f.label}
              {f.id === 'all' && decisions.length > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">{decisions.length}</span>
              )}
              {f.id !== 'all' && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {decisions.filter((d) => d.status === f.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ ...card, padding: '3rem', textAlign: 'center' }}>
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm" style={{ color: '#6b7280' }}>Cargando decisiones...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ ...card, padding: '3rem', textAlign: 'center' }}>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              {filter === 'all'
                ? 'No hay decisiones registradas aún. Ejecutá acciones desde la tabla o la Guerra Room.'
                : `No hay decisiones con estado "${FILTERS.find((f) => f.id === filter)?.label}".`}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ ...card, overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e1e24', background: '#0d0d11' }}>
                    {['Fecha', 'Descripción', 'Tipo de acción', 'Estado', 'Métricas antes', 'Métricas después', 'Origen'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => {
                    const ss = STATUS_STYLE[d.status] || { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)', color: '#9ca3af', label: d.status };
                    const ts = TRIGGERED_STYLE[d.triggered_by] || { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: d.triggered_by || '—' };
                    const before = d.details?.before_metrics;
                    const after  = d.details?.after_metrics;
                    const measuring = (d.details?.days_since ?? 99) < 3 && !after;
                    const dateStr = d.created_at
                      ? new Date(d.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : '—';

                    return (
                      <tr key={d.id || i}
                        style={{ borderBottom: '1px solid rgba(30,30,36,0.7)' }}
                        className="transition-colors hover:bg-white/[0.015]">
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#9ca3af' }}>{dateStr}</td>
                        <td className="px-4 py-3 text-xs max-w-[200px]" style={{ color: '#d1d5db' }}>{d.description || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                            style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc' }}>
                            {d.action_type || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                            style={{ background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>
                            {ss.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <MetricCell before={before} after={after} measuring={false} />
                        </td>
                        <td className="px-4 py-3">
                          <DeltaCell before={before} after={after} measuring={measuring} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                            style={{ background: ts.bg, color: ts.color }}>
                            {ts.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
