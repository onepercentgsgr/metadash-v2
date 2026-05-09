'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

const VERDICT_STYLES = {
  rentable:  { bg: 'from-emerald-950/40 to-emerald-900/20', border: 'border-emerald-700/50', text: 'text-emerald-300' },
  riesgoso:  { bg: 'from-amber-950/40 to-amber-900/20',     border: 'border-amber-700/50',  text: 'text-amber-300' },
  evitar:    { bg: 'from-red-950/40 to-red-900/20',         border: 'border-red-700/50',    text: 'text-red-300' },
};
function vstyle(v) {
  if (!v) return VERDICT_STYLES.riesgoso;
  if (/rentable|🟢/i.test(v)) return VERDICT_STYLES.rentable;
  if (/evitar|🔴/i.test(v)) return VERDICT_STYLES.evitar;
  return VERDICT_STYLES.riesgoso;
}

export default function AnalizarPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();

  // Inputs
  const [brand, setBrand] = useState('');
  const [niche, setNiche] = useState('');
  const [landingUrl, setLandingUrl] = useState('');
  const [adText, setAdText] = useState('');
  const [adVisual, setAdVisual] = useState('');
  const [adsLibCount, setAdsLibCount] = useState('');
  const [adsLibOldest, setAdsLibOldest] = useState('');
  const [adsLibNotes, setAdsLibNotes] = useState('');
  const [hypothesis, setHypothesis] = useState('');

  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const runAnalysis = useCallback(async () => {
    setRunning(true); setErrorMsg(''); setResult(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) { setErrorMsg('No estás logueado.'); return; }

      if (!adText.trim() && !landingUrl.trim()) {
        setErrorMsg('Necesito al menos la transcripción del ad o la URL de la landing.');
        return;
      }

      const adsLibManual = (adsLibCount.trim() || adsLibOldest.trim() || adsLibNotes.trim())
        ? {
            ads_count: adsLibCount.trim() || null,
            oldest_active: adsLibOldest.trim() || null,
            notes: adsLibNotes.trim() || null,
          }
        : null;

      const res = await fetch(`${API_URL}/agents/deep-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          competitor_brand: brand,
          niche,
          landing_url: landingUrl,
          ad_transcription: adText,
          ad_visual_description: adVisual,
          ads_library_manual: adsLibManual,
          user_hypothesis: hypothesis,
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
  }, [brand, niche, landingUrl, adText, adVisual, adsLibCount, adsLibOldest, adsLibNotes, hypothesis]);

  const sendToValidator = () => {
    // Pre-fills /validar with this competitor's URL
    if (!landingUrl) return;
    try {
      sessionStorage.setItem('metadash_validator_seed', JSON.stringify({
        urls: landingUrl, niche,
      }));
    } catch {}
    router.push('/validar');
  };

  const sendToPipeline = () => {
    const seed = result?.analysis?.seed_para_pipeline;
    if (!seed) return;
    try {
      localStorage.setItem('metadash_pipeline_seed', JSON.stringify({
        nicho: seed.nicho,
        problema: seed.problema,
        publico: seed.publico,
        diferencial: seed.diferencial,
        precio: seed.precio_objetivo,
        competidor: seed.competidor_principal,
        notas: seed.notas,
      }));
    } catch {}
    router.push('/infoproducto/run');
  };

  if (authLoading) return null;

  const a = result?.analysis;
  const veredicto = a?.fase_4_veredicto;
  const vs = vstyle(veredicto?.verdict);

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans">
      <header className="border-b border-[#1e1e24] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-300 text-sm">← Dashboard</button>
          <div className="h-6 w-px bg-[#27272f]" />
          <h1 className="text-base font-extrabold tracking-tight">
            🔬 Analizador Profundo · <span className="text-rose-400">3 agentes Nivel Dios</span>
          </h1>
        </div>
        {result && (
          <button onClick={() => { setResult(null); setErrorMsg(''); }} className="text-xs text-gray-500 hover:text-gray-300">↺ Nuevo análisis</button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {!result ? (
          <>
            {/* Hero */}
            <div className="bg-gradient-to-br from-rose-950/40 via-purple-950/30 to-indigo-950/30 border border-rose-700/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔬</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-gray-100 mb-1 tracking-tight">
                    Disecá UN competidor a fondo
                  </h2>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Tres personajes adoptados a la vez por el mismo agente:
                    <strong className="text-gray-200"> media buyer +10M USD gastados</strong>,
                    <strong className="text-gray-200"> creador de VSLs</strong> y
                    <strong className="text-gray-200"> estratega de ofertas tipo Hormozi</strong>.
                    Pegale el ad, la landing y los datos de Ads Library.
                    Te devuelve: ángulo de venta · análisis visual+audio+copy · qué buscar
                    en Ads Library · disección de la landing · veredicto 🟢/🟡/🔴 ·
                    el WEDGE explícito · 3 ángulos + 3 hooks + 3 VSL ideas + 3 mejoras
                    de funnel + 3 ofertas irresistibles.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Costo aprox: <strong>$0.30 USD</strong> por análisis. Tip: usá esto sobre el
                    UN ad/competidor que más te llama la atención. Para escaneo amplio del mercado, usá <strong className="text-purple-300">/validar</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold block mb-2">🏷️ Marca / competidor</label>
                  <input type="text" value={brand} onChange={e => setBrand(e.target.value)}
                    placeholder="ej: RestaurantesPro / DigitalBistró"
                    className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:border-rose-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold block mb-2">🎯 Nicho</label>
                  <input type="text" value={niche} onChange={e => setNiche(e.target.value)}
                    placeholder="ej: Afiliados gastronomía LATAM"
                    className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:border-rose-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold block mb-2">🌐 URL de la landing del competidor</label>
                <input type="text" value={landingUrl} onChange={e => setLandingUrl(e.target.value)}
                  placeholder="https://competidor.com/sales-page"
                  className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:border-rose-500 focus:outline-none font-mono" />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold block mb-2">📝 Transcripción / copy del anuncio</label>
                <textarea value={adText} onChange={e => setAdText(e.target.value)} rows={5}
                  placeholder='Pegá lo que el ad dice. Si es video, escribilo o pegá la transcripción ("Hola, soy X y descubrí cómo...")'
                  className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:border-rose-500 focus:outline-none" />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold block mb-2">
                  🎬 Descripción visual del video <span className="text-gray-700">(qué se ve, qué hace el creator, qué pantallas muestra)</span>
                </label>
                <textarea value={adVisual} onChange={e => setAdVisual(e.target.value)} rows={4}
                  placeholder='ej: "Creator joven en su escritorio, fondo oscuro, dashboard con $50k mostrado en pantalla, cortes rápidos cada 2s, subtítulos amarillos, terminada con un CTA: 'Link en bio'..."'
                  className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:border-rose-500 focus:outline-none" />
              </div>

              {/* Ads Library data */}
              <div className="bg-gradient-to-br from-blue-950/20 to-indigo-950/20 border border-blue-700/30 rounded-xl p-4">
                <div className="text-sm font-bold text-gray-100 mb-2">📚 Datos de Facebook Ads Library <span className="text-[10px] uppercase tracking-wider text-blue-400">opcional</span></div>
                <p className="text-xs text-gray-500 mb-3">Si ya entraste a la Ads Library de este competidor y viste cuántos ads tiene activos, contámelo acá.</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <input type="text" value={adsLibCount} onChange={e => setAdsLibCount(e.target.value)}
                    placeholder="Cantidad de ads activos (ej: 47)"
                    className="bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                  <input type="text" value={adsLibOldest} onChange={e => setAdsLibOldest(e.target.value)}
                    placeholder="Más viejo activo desde (ej: octubre 2024)"
                    className="bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <textarea value={adsLibNotes} onChange={e => setAdsLibNotes(e.target.value)} rows={2}
                  placeholder='Notas: "El ad #3 con 50k likes corre desde junio, ángulo X. Link al ganador: ..."'
                  className="w-full mt-2 bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold block mb-2">💭 Hipótesis / notas tuyas</label>
                <textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} rows={3}
                  placeholder='ej: "Creo que el wedge está en X porque nadie habla de eso. Tengo dudas si vale escalar este nicho..."'
                  className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2.5 rounded-lg text-sm focus:border-rose-500 focus:outline-none" />
              </div>

              {errorMsg && <div className="bg-red-950/30 border border-red-700/40 rounded-xl p-3 text-sm text-red-300">⚠ {errorMsg}</div>}

              <button onClick={runAnalysis} disabled={running}
                className="w-full px-5 py-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg shadow-rose-900/40">
                {running ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Disecando competidor… (~30-60s)
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">🔬 Disecar competidor</span>
                )}
              </button>
            </div>
          </>
        ) : (
          <ResultsView a={a} vs={vs} veredicto={veredicto} sendToValidator={sendToValidator} sendToPipeline={sendToPipeline} />
        )}
      </main>
    </div>
  );
}

function Section({ title, icon, children, accent = 'gray' }) {
  return (
    <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5">
      <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-3 flex items-center gap-2">
        <span>{icon}</span><span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function KV({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex flex-col gap-0.5 py-1">
      <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">{label}</span>
      <span className="text-sm text-gray-200">{Array.isArray(value) ? value.join(' · ') : String(value)}</span>
    </div>
  );
}

function ResultsView({ a, vs, veredicto, sendToValidator, sendToPipeline }) {
  if (!a) return <div className="text-gray-400 text-sm">No se obtuvo análisis.</div>;
  if (a.necesito_mas_datos) {
    return (
      <div className="bg-amber-950/20 border border-amber-700/40 rounded-2xl p-6">
        <h2 className="text-base font-bold text-amber-300 mb-3">⚠ Necesito más datos para hacer un análisis serio</h2>
        <ul className="space-y-1 text-sm text-amber-100">
          {a.necesito_mas_datos.map((d, i) => <li key={i}>· {d}</li>)}
        </ul>
      </div>
    );
  }
  if (a.error) {
    return (
      <div className="bg-red-950/20 border border-red-700/40 rounded-2xl p-6">
        <h2 className="text-base font-bold text-red-300 mb-2">⚠ El analizador no devolvió un JSON válido</h2>
        <pre className="text-xs text-gray-400 whitespace-pre-wrap max-h-96 overflow-y-auto">{a.raw_preview}</pre>
      </div>
    );
  }

  const f1 = a.fase_1_anuncio || {};
  const f2 = a.fase_2_library_recon || {};
  const f3 = a.fase_3_landing || {};
  const wedge = a.wedge || {};
  const ideas = a.ideas_para_atacar || {};
  const seed = a.seed_para_pipeline || {};

  return (
    <>
      {/* VERDICT HERO */}
      <div className={`bg-gradient-to-br ${vs.bg} border ${vs.border} rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-1">Veredicto</div>
            <h2 className={`text-3xl font-extrabold ${vs.text} tracking-tight`}>{veredicto?.verdict || 'Análisis listo'}</h2>
          </div>
          {veredicto?.score != null && (
            <div className="text-right">
              <div className={`text-5xl font-black ${vs.text} tabular-nums`}>{veredicto.score}<span className="text-2xl text-gray-600">/10</span></div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{veredicto?.explicacion_estrategica}</p>

        {veredicto?.scores_detallados && (
          <div className="mt-5 pt-5 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">Scores detallados</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(veredicto.scores_detallados).map(([k, v]) => (
                <div key={k} className="bg-black/20 rounded-lg px-3 py-2">
                  <div className="text-[9px] uppercase text-gray-500 truncate">{k.replace(/_/g, ' ')}</div>
                  <div className={`text-sm font-bold ${vs.text}`}>{v}/10</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {seed?.nicho && (
            <button onClick={sendToPipeline}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30">
              🚀 Generar infoproducto con este wedge →
            </button>
          )}
          <button onClick={sendToValidator}
            className="px-4 py-2 rounded-lg bg-purple-600/30 border border-purple-600/40 hover:bg-purple-600/40 text-purple-200 font-bold text-xs flex items-center gap-2">
            🧪 Validar mercado completo →
          </button>
        </div>
      </div>

      {/* WEDGE */}
      {wedge.angulo_libre && (
        <div className="bg-[#16161a] border border-rose-700/40 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🎯</div>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-widest text-rose-400 font-semibold mb-1">El wedge — tu hueco</div>
              <h3 className="text-lg font-bold text-gray-100 mb-2">{wedge.angulo_libre}</h3>
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                <KV label="Emoción subutilizada" value={wedge.emocion_subutilizada} />
                <KV label="Promesa que falta" value={wedge.promesa_que_falta} />
                <KV label="Subnicho abandonado" value={wedge.subnicho_abandonado} />
                <KV label="Mecanismo único que dominaría" value={wedge.mecanismo_unico_que_dominaria} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IDEAS PARA ATACAR */}
      {ideas && (Object.keys(ideas).length > 0) && (
        <Section title="Ideas para atacar — listas para usar" icon="⚡">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ['3 nuevos ángulos', ideas['3_nuevos_angulos'], '🎭'],
              ['3 hooks virales', ideas['3_hooks_virales'], '🪝'],
              ['3 ideas de VSL', ideas['3_ideas_de_vsl'], '🎬'],
              ['3 mejoras al funnel', ideas['3_mejoras_al_funnel'], '🔧'],
              ['3 ofertas irresistibles', ideas['3_ofertas_irresistibles'], '💎'],
            ].map(([title, list, icon]) => list?.length > 0 && (
              <div key={title} className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-4">
                <div className="text-xs font-bold text-gray-200 mb-2 flex items-center gap-2"><span>{icon}</span>{title}</div>
                <ul className="space-y-1.5">
                  {list.map((item, i) => (
                    <li key={i} className="text-xs text-gray-300 leading-relaxed flex gap-2">
                      <span className="text-rose-500 font-mono shrink-0">{i + 1}.</span><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* FASE 1 — ANUNCIO */}
      {f1.angulo_de_venta && (
        <Section title="Fase 1 · Análisis del anuncio" icon="📺">
          <div className="space-y-4">
            <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">A) Ángulo de venta</div>
              <div className="grid md:grid-cols-2 gap-2">
                <KV label="Deseo" value={f1.angulo_de_venta.deseo_principal} />
                <KV label="Dolor" value={f1.angulo_de_venta.dolor_principal} />
                <KV label="Mecanismo único" value={f1.angulo_de_venta.mecanismo_unico} />
                <KV label="Promesa explícita" value={f1.angulo_de_venta.promesa_explicita} />
                <KV label="Promesa implícita" value={f1.angulo_de_venta.promesa_implicita} />
                <KV label="Enemigo común" value={f1.angulo_de_venta.enemigo_comun} />
                <KV label="Tipo de oportunidad" value={f1.angulo_de_venta.tipo_de_oportunidad} />
                <KV label="Emoción que vende" value={f1.angulo_de_venta.emocion_que_vende} />
                <KV label="Creencia que rompe" value={f1.angulo_de_venta.creencia_que_rompe} />
                <KV label="Transformación" value={f1.angulo_de_venta.transformacion_que_promete} />
                <KV label="Público targeteado" value={f1.angulo_de_venta.publico_targeteado} />
              </div>
            </div>
            {f1.analisis_visual && (
              <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">B) Análisis visual</div>
                <div className="grid md:grid-cols-2 gap-2">
                  <KV label="Hook 3s" value={f1.analisis_visual.hook_3_segundos} />
                  <KV label="Calidad producción" value={f1.analisis_visual.calidad_produccion} />
                  <KV label="Tipo edición" value={f1.analisis_visual.tipo_edicion} />
                  <KV label="Ritmo cortes" value={f1.analisis_visual.ritmo_cortes} />
                  <KV label="Dopamina" value={f1.analisis_visual.elementos_dopamina} />
                  <KV label="Confianza" value={f1.analisis_visual.elementos_confianza} />
                  <KV label="FOMO" value={f1.analisis_visual.elementos_fomo} />
                  <KV label="Es UGC" value={f1.analisis_visual.es_ugc != null ? String(f1.analisis_visual.es_ugc) : null} />
                  <KV label="Parece escalado" value={f1.analisis_visual.parece_escalado != null ? String(f1.analisis_visual.parece_escalado) : null} />
                  <KV label="Autoridad real" value={f1.analisis_visual.autoridad_real} />
                </div>
              </div>
            )}
            {f1.analisis_audio && (
              <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">C) Análisis audio</div>
                <div className="grid md:grid-cols-2 gap-2">
                  <KV label="Tipo voz" value={f1.analisis_audio.tipo_voz} />
                  <KV label="Energía" value={f1.analisis_audio.energia} />
                  <KV label="Música" value={f1.analisis_audio.musica} />
                  <KV label="Apunta a" value={f1.analisis_audio.apunta_a} />
                </div>
              </div>
            )}
            {f1.analisis_copy && (
              <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">D) Análisis copy</div>
                <div className="grid md:grid-cols-2 gap-2">
                  <KV label="Hook" value={f1.analisis_copy.hook} />
                  <KV label="Big promise" value={f1.analisis_copy.big_promise} />
                  <KV label="Open loops" value={f1.analisis_copy.open_loops} />
                  <KV label="Curiosity gaps" value={f1.analisis_copy.curiosity_gaps} />
                  <KV label="CTAs" value={f1.analisis_copy.ctas} />
                  <KV label="Social proof" value={f1.analisis_copy.social_proof_usado} />
                  <KV label="Fórmula" value={f1.analisis_copy.formula_psicologica} />
                  <KV label="Agresividad" value={f1.analisis_copy.agresividad} />
                  <KV label="Escalabilidad" value={f1.analisis_copy.escalabilidad_aparente} />
                  <KV label="Sofisticación mercado" value={f1.analisis_copy.nivel_sofisticacion_mercado} />
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* FASE 2 — LIBRARY RECON */}
      {f2 && (f2.keywords_a_buscar?.length > 0 || f2.que_revisar?.length > 0) && (
        <Section title="Fase 2 · Recon en Facebook Ads Library" icon="🔭">
          <div className="space-y-3">
            {f2.instrucciones_para_el_usuario && (
              <p className="text-sm text-gray-300 leading-relaxed bg-blue-950/20 border border-blue-700/30 rounded-lg p-3">{f2.instrucciones_para_el_usuario}</p>
            )}
            <KV label="Keywords a buscar" value={f2.keywords_a_buscar} />
            <KV label="Competidores relacionados" value={f2.competidores_relacionados_a_buscar} />
            <KV label="Claims y promesas a buscar" value={f2.claims_y_promesas_a_buscar} />
            {f2.que_revisar?.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-1">Qué revisar</div>
                <ul className="space-y-1">
                  {f2.que_revisar.map((q, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-blue-400">·</span>{q}</li>)}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* FASE 3 — LANDING */}
      {f3 && Object.keys(f3).length > 0 && (
        <Section title="Fase 3 · Disección de la landing" icon="🌐">
          <div className="grid md:grid-cols-2 gap-2">
            <KV label="Above the fold" value={f3.above_the_fold} />
            <KV label="Oferta" value={f3.oferta} />
            <KV label="Pricing" value={f3.pricing} />
            <KV label="Garantía" value={f3.garantia} />
            <KV label="Storytelling" value={f3.storytelling} />
            <KV label="Prueba social" value={f3.prueba_social} />
            <KV label="Autoridad" value={f3.autoridad} />
            <KV label="CTAs" value={f3.ctas} />
            <KV label="Bonuses" value={f3.bonuses} />
            <KV label="Stack de valor" value={f3.stack_de_valor} />
            <KV label="Scarcity / Urgency" value={f3.scarcity_urgency} />
            <KV label="Objection handling" value={f3.objection_handling} />
            <KV label="Lead capture" value={f3.lead_capture} />
            <KV label="Checkout" value={f3.checkout} />
            <KV label="Upsells" value={f3.upsells} />
            <KV label="Nivel copywriting" value={f3.nivel_copywriting} />
          </div>
          {(f3.fortalezas?.length > 0 || f3.debilidades?.length > 0) && (
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              {f3.fortalezas?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold mb-1">✓ Fortalezas</div>
                  <ul className="space-y-1">
                    {f3.fortalezas.map((s, i) => <li key={i} className="text-xs text-gray-300">· {s}</li>)}
                  </ul>
                </div>
              )}
              {f3.debilidades?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-red-500 font-semibold mb-1">✗ Debilidades</div>
                  <ul className="space-y-1">
                    {f3.debilidades.map((s, i) => <li key={i} className="text-xs text-gray-300">· {s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Section>
      )}
    </>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
