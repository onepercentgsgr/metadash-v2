'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { Markdown } from '../components/Markdown';

const VERDICT_STYLES = {
  '🟢 RENTABLE':       { bg: 'from-emerald-950/40 to-emerald-900/20', border: 'border-emerald-700/50', text: 'text-emerald-300' },
  '🟡 RIESGOSO':       { bg: 'from-amber-950/40 to-amber-900/20',     border: 'border-amber-700/50',  text: 'text-amber-300' },
  '🔴 EVITAR':         { bg: 'from-red-950/40 to-red-900/20',         border: 'border-red-700/50',    text: 'text-red-300' },
};

function getVerdictStyle(v) {
  if (!v) return VERDICT_STYLES['🟡 RIESGOSO'];
  for (const key of Object.keys(VERDICT_STYLES)) {
    if (v.includes(key.replace(/[^a-zA-Z]/g, ''))) return VERDICT_STYLES[key];
  }
  // best-effort fallback
  if (v.includes('🟢') || /rentab/i.test(v)) return VERDICT_STYLES['🟢 RENTABLE'];
  if (v.includes('🔴') || /evitar/i.test(v)) return VERDICT_STYLES['🔴 EVITAR'];
  return VERDICT_STYLES['🟡 RIESGOSO'];
}

export default function ValidarPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();

  const [urls, setUrls] = useState('');
  const [ads, setAds] = useState('');
  const [niche, setNiche] = useState('');
  const [notes, setNotes] = useState('');
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const runValidation = useCallback(async () => {
    setRunning(true);
    setErrorMsg('');
    setResult(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setErrorMsg('No estás logueado. Volvé a entrar a la cuenta.');
        return;
      }
      const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
      const adList  = ads.split('\n---\n').map(a => a.trim()).filter(Boolean);
      if (urlList.length === 0 && adList.length === 0) {
        setErrorMsg('Pegá al menos una URL de competidor o un texto de ad.');
        return;
      }
      const res = await fetch(`${API_URL}/agents/validate-market`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          urls: urlList,
          ads: adList,
          niche,
          notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }
      setResult(await res.json());
    } catch (e) {
      setErrorMsg(e?.message || String(e));
    } finally {
      setRunning(false);
    }
  }, [urls, ads, niche, notes]);

  const sendToPipeline = () => {
    const seed = result?.synthesis?.seed_para_pipeline;
    if (!seed) return;
    const piped = {
      nicho: seed.nicho,
      problema: seed.problema,
      publico: seed.publico,
      precio: seed.precio_objetivo,
      diferencial: seed.diferencial,
      competidor: seed.competidor_principal,
      notas: seed.notas,
    };
    try {
      localStorage.setItem('metadash_pipeline_seed', JSON.stringify(piped));
    } catch {}
    router.push('/infoproducto/run');
  };

  if (authLoading) return null;

  const synth = result?.synthesis;
  const verdict = synth?.veredicto?.verdict;
  const verdictStyle = getVerdictStyle(verdict);
  const score = synth?.veredicto?.score;

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans">
      {/* Header */}
      <header className="border-b border-[#1e1e24] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-500 hover:text-gray-300 text-sm"
          >
            ← Dashboard
          </button>
          <div className="h-6 w-px bg-[#27272f]" />
          <h1 className="text-base font-extrabold tracking-tight">
            🧪 Validador de Mercado · <span className="text-indigo-400">Nivel Dios</span>
          </h1>
        </div>
        {result && (
          <button
            onClick={() => { setResult(null); setErrorMsg(''); }}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            ↺ Nueva validación
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {!result ? (
          <>
            {/* Hero / pitch */}
            <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-emerald-950/30 border border-indigo-700/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🧪</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-gray-100 mb-1 tracking-tight">
                    Antes de generar nada, validá si el nicho rinde
                  </h2>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Pegá <strong className="text-gray-200">URLs de páginas de ventas</strong> de
                    posibles competidores y/o <strong className="text-gray-200">textos de ads</strong> que
                    viste en Meta/TikTok. Tres agentes especializados van a desarmar cada uno como expertos
                    en marketing de respuesta directa, cruzar todo, y darte un veredicto:
                    <strong className="text-emerald-300"> 🟢 RENTABLE</strong>,
                    <strong className="text-amber-300"> 🟡 RIESGOSO</strong> o
                    <strong className="text-red-300"> 🔴 EVITAR</strong> — con el WEDGE (el ángulo que
                    nadie está atacando) listo para vos.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Costo aprox: <strong>$0.20 USD</strong> por validación. ROI: te ahorra meses de
                    construir el producto equivocado.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-6 space-y-5">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold block mb-2">
                  🎯 Nicho que estás evaluando <span className="text-gray-700">(opcional pero recomendado)</span>
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="ej: Afiliados gastronomía Argentina · Cursos de finanzas personales · Coaching de productividad"
                  className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold block mb-2">
                  🌐 URLs de páginas de ventas competidoras <span className="text-gray-700">(una por línea — recomendado 3-5)</span>
                </label>
                <textarea
                  value={urls}
                  onChange={e => setUrls(e.target.value)}
                  rows={5}
                  placeholder={`https://competidor1.com/ventas
https://competidor2.com/sales-page
https://competidor3.com/landing`}
                  className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold block mb-2">
                  📱 Textos / descripciones de ads que viste <span className="text-gray-700">(separá cada ad con una línea con ---)</span>
                </label>
                <textarea
                  value={ads}
                  onChange={e => setAds(e.target.value)}
                  rows={6}
                  placeholder={`Texto del ad 1: "Cansado de pagar 30% a Rappi? Mirá cómo..."
---
Texto del ad 2: "Convertí 5 horas semanales en $300k ARS..."
---
Reel que vi en IG: testimonio de creator con before/after`}
                  className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold block mb-2">
                  📝 Notas extra para el estratega <span className="text-gray-700">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Cualquier contexto que valga la pena: tu hipótesis del wedge, qué viste que no estaba cubierto, etc."
                  className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {errorMsg && (
                <div className="bg-red-950/30 border border-red-700/40 rounded-xl p-3 text-sm text-red-300">
                  ⚠ {errorMsg}
                </div>
              )}

              <button
                onClick={runValidation}
                disabled={running}
                className="w-full px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg shadow-indigo-900/40"
              >
                {running ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analizando mercado… (~30-60s)
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🧪 Validar mercado
                  </span>
                )}
              </button>
            </div>
          </>
        ) : (
          <ResultsView result={result} verdictStyle={verdictStyle} verdict={verdict} score={score} synth={synth} sendToPipeline={sendToPipeline} />
        )}
      </main>
    </div>
  );
}

function ResultsView({ result, verdictStyle, verdict, score, synth, sendToPipeline }) {
  if (!synth) {
    return (
      <div className="bg-red-950/20 border border-red-700/40 rounded-2xl p-6">
        <h2 className="text-base font-bold text-red-300 mb-2">⚠ El validador no devolvió un análisis válido</h2>
        <pre className="text-xs text-gray-400 whitespace-pre-wrap mt-2">{JSON.stringify(result, null, 2).slice(0, 1500)}</pre>
      </div>
    );
  }

  return (
    <>
      {/* VERDICT */}
      <div className={`bg-gradient-to-br ${verdictStyle.bg} border ${verdictStyle.border} rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-1">Veredicto</div>
            <h2 className={`text-3xl font-extrabold ${verdictStyle.text} tracking-tight`}>
              {verdict || 'Análisis listo'}
            </h2>
          </div>
          {score != null && (
            <div className="text-right">
              <div className={`text-5xl font-black ${verdictStyle.text} tabular-nums`}>{score}<span className="text-2xl text-gray-600">/10</span></div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Score</div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{synth.veredicto?.razonamiento}</p>

        {synth.go_no_go && (
          <div className="mt-5 pt-5 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">Recomendación</div>
            <div className={`text-base font-extrabold ${verdictStyle.text} mb-3`}>
              {synth.go_no_go.recomendacion}
            </div>
            {synth.go_no_go.next_steps?.length > 0 && (
              <ol className="space-y-1.5">
                {synth.go_no_go.next_steps.map((s, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-3">
                    <span className="text-gray-500 font-mono shrink-0">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      {/* ACTION: send to pipeline */}
      {synth.seed_para_pipeline && (
        <div className="bg-gradient-to-r from-emerald-950/30 to-indigo-950/20 border border-emerald-700/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="text-3xl">🚀</div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-100 mb-0.5">¿Vas con este nicho?</div>
            <div className="text-xs text-gray-500">El seed ya está pre-cargado con el nicho, problema, wedge y precio. Cero pensar.</div>
          </div>
          <button
            onClick={sendToPipeline}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition"
          >
            Generar infoproducto →
          </button>
        </div>
      )}

      {/* WEDGE */}
      {synth.wedge && (
        <div className="bg-[#16161a] border border-indigo-700/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🎯</div>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-widest text-indigo-400 font-semibold mb-1">El wedge — tu hueco en el mercado</div>
              <h3 className="text-lg font-bold text-gray-100 mb-2">{synth.wedge.angulo}</h3>
              <p className="text-sm text-gray-400 mb-3"><strong className="text-gray-300">Por qué está libre:</strong> {synth.wedge.razonamiento}</p>
              <div className="bg-indigo-950/30 border border-indigo-700/30 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold mb-1">Cómo atacarlo</div>
                <p className="text-sm text-gray-200">{synth.wedge.como_atacarlo}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MARKET STATE + PRICING + ANGLES */}
      <div className="grid md:grid-cols-2 gap-4">
        {synth.estado_del_mercado && (
          <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5">
            <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-3">📊 Estado del mercado</div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Saturación</dt><dd className="text-gray-200 font-semibold">{synth.estado_del_mercado.saturacion}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Tendencia</dt><dd className="text-gray-200 font-semibold">{synth.estado_del_mercado.tendencia}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Competidores activos</dt><dd className="text-gray-200 font-semibold">{synth.estado_del_mercado.competidores_activos}</dd></div>
            </dl>
            {synth.estado_del_mercado.competidores_escalados && (
              <p className="text-xs text-gray-400 mt-3 leading-relaxed border-t border-[#1e1e24] pt-3">
                <strong className="text-gray-300">Escalados: </strong>{synth.estado_del_mercado.competidores_escalados}
              </p>
            )}
          </div>
        )}

        {synth.pricing_recomendado && (
          <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5">
            <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-3">💰 Pricing</div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Rango mercado</dt><dd className="text-gray-200 font-semibold">{synth.pricing_recomendado.rango_mercado}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Tu precio sugerido</dt><dd className="text-emerald-300 font-extrabold">{synth.pricing_recomendado.tu_precio_sugerido}</dd></div>
            </dl>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed border-t border-[#1e1e24] pt-3">{synth.pricing_recomendado.razonamiento}</p>
          </div>
        )}
      </div>

      {/* ANGLES + PAINS */}
      <div className="grid md:grid-cols-2 gap-4">
        {synth.angulos_dominantes?.length > 0 && (
          <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5">
            <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-3">🎭 Ángulos que TODOS usan</div>
            <ul className="space-y-1.5 text-sm">
              {synth.angulos_dominantes.map((a, i) => (
                <li key={i} className="text-gray-300 flex gap-2"><span className="text-gray-600">·</span>{a}</li>
              ))}
            </ul>
            <p className="text-[11px] text-amber-400/70 mt-3 italic">⚠ No compitas en estos. Buscá el wedge ↑.</p>
          </div>
        )}

        {synth.puntos_de_dolor_top?.length > 0 && (
          <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5">
            <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-3">💢 Puntos de dolor validados</div>
            <ul className="space-y-1.5 text-sm">
              {synth.puntos_de_dolor_top.map((d, i) => (
                <li key={i} className="text-gray-300 flex gap-2"><span className="text-red-400">→</span>{d}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* AVATAR */}
      {synth.avatar_consolidado && (
        <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-2">👤 Avatar consolidado del mercado</div>
          <p className="text-sm text-gray-300 leading-relaxed">{synth.avatar_consolidado}</p>
        </div>
      )}

      {/* COPY WINNERS */}
      {synth.copy_winners?.length > 0 && (
        <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-3">✍️ Copy que está funcionando</div>
          <ul className="space-y-2 text-sm">
            {synth.copy_winners.map((c, i) => (
              <li key={i} className="text-gray-300 bg-[#111114] border border-[#27272f] rounded-lg p-3">{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* INDIVIDUAL PAGE ANALYSES (collapsible-ish via summary) */}
      {result.pages?.length > 0 && (
        <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-3">🔍 Análisis por competidor ({result.pages.length})</div>
          <div className="space-y-3">
            {result.pages.map((p, i) => (
              <details key={i} className="bg-[#111114] border border-[#27272f] rounded-lg p-3 group">
                <summary className="cursor-pointer flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-gray-200 truncate flex-1">
                    {p.error ? `⚠ ${p.url || 'URL'} — ${p.error.slice(0, 60)}` : `${p.marca || p.url} — ${p.angulo_principal || ''}`}
                  </span>
                  {!p.error && p.score_calidad != null && (
                    <span className="text-[10px] text-gray-500 font-mono shrink-0">score {p.score_calidad}/10</span>
                  )}
                  <span className="text-gray-600 text-xs group-open:hidden">▼</span>
                  <span className="text-gray-600 text-xs hidden group-open:inline">▲</span>
                </summary>
                {!p.error && (
                  <div className="mt-3 pt-3 border-t border-[#27272f] space-y-2 text-xs text-gray-400">
                    {p.promesa_principal && <p><strong className="text-gray-300">Promesa:</strong> {p.promesa_principal}</p>}
                    {p.precio && <p><strong className="text-gray-300">Precio:</strong> {p.precio}</p>}
                    {p.publico_objetivo && <p><strong className="text-gray-300">Público:</strong> {p.publico_objetivo}</p>}
                    {p.que_copiarle && <p><strong className="text-emerald-400">Copiar:</strong> {p.que_copiarle}</p>}
                    {p.que_evitar && <p><strong className="text-red-400">Evitar:</strong> {p.que_evitar}</p>}
                    {p.tecnicas_de_copy?.length > 0 && (
                      <p><strong className="text-gray-300">Técnicas:</strong> {p.tecnicas_de_copy.join(' · ')}</p>
                    )}
                  </div>
                )}
              </details>
            ))}
          </div>
        </div>
      )}

      {/* INDIVIDUAL AD ANALYSES */}
      {result.ads?.length > 0 && (
        <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-3">🎬 Análisis de ads ({result.ads.length})</div>
          <div className="space-y-3">
            {result.ads.map((a, i) => (
              <details key={i} className="bg-[#111114] border border-[#27272f] rounded-lg p-3 group">
                <summary className="cursor-pointer flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-gray-200 truncate flex-1">
                    {a.error ? `⚠ Ad ${i + 1} — error` : `Ad ${i + 1} · ${a.angulo || a.tipo || ''}`}
                  </span>
                  {!a.error && a.score_efectividad != null && (
                    <span className="text-[10px] text-gray-500 font-mono shrink-0">score {a.score_efectividad}/10</span>
                  )}
                  <span className="text-gray-600 text-xs group-open:hidden">▼</span>
                  <span className="text-gray-600 text-xs hidden group-open:inline">▲</span>
                </summary>
                {!a.error && (
                  <div className="mt-3 pt-3 border-t border-[#27272f] space-y-2 text-xs text-gray-400">
                    {a.hook_inicial && <p><strong className="text-gray-300">Hook:</strong> {a.hook_inicial}</p>}
                    {a.promesa && <p><strong className="text-gray-300">Promesa:</strong> {a.promesa}</p>}
                    {a.cta && <p><strong className="text-gray-300">CTA:</strong> {a.cta}</p>}
                    {a.porque_funciona && <p><strong className="text-emerald-400">Por qué funciona:</strong> {a.porque_funciona}</p>}
                    {a.como_mejorarlo && <p><strong className="text-amber-400">Cómo mejorarlo:</strong> {a.como_mejorarlo}</p>}
                  </div>
                )}
              </details>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
