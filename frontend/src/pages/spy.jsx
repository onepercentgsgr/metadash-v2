'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icons';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const VERDICT_COLOR = {
  'DUPLICAR': '#10b981',
  'DUPLICAR CON MEJORAS': '#f59e0b',
  'NO DUPLICAR': '#ef4444',
  'ANALIZAR MÁS': '#6366f1',
};

function verdictColor(decision) {
  if (!decision) return '#6b7280';
  const key = Object.keys(VERDICT_COLOR).find((k) => decision.toUpperCase().includes(k));
  return key ? VERDICT_COLOR[key] : '#6b7280';
}

function ScoreRing({ score }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
      <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={40} cy={40} r={r} fill="none" stroke="#1e1e24" strokeWidth={6} />
        <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-black" style={{ color }}>{score?.toFixed(1)}</span>
        <span className="text-[9px] font-semibold" style={{ color: '#6b7280' }}>/ 10</span>
      </div>
    </div>
  );
}

function Section({ title, color, icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#16161a', border: `1px solid ${color}22` }}>
      <button onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
        style={{ borderBottom: open ? `1px solid ${color}18` : 'none' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}14`, color }}>
            <Icon name={icon} size={15} strokeWidth={2} />
          </div>
          <span className="text-sm font-bold text-white">{title}</span>
        </div>
        <span style={{ color: '#6b7280', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

function Tag({ text, color }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}>
      {text}
    </span>
  );
}

function Field({ label, value, mono }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6b7280' }}>{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : ''}`} style={{ color: '#e5e7eb' }}>{value}</p>
    </div>
  );
}

function ListField({ label, items, color = '#6366f1' }) {
  if (!items || !items.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6b7280' }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => <Tag key={i} text={item} color={color} />)}
      </div>
    </div>
  );
}

export default function SpyPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const [file, setFile] = useState(null);
  const [niche, setNiche] = useState('');
  const [brand, setBrand] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('upload');
  const [dragOver, setDragOver] = useState(false);
  const [libraryData, setLibraryData] = useState('');
  const [libraryInterp, setLibraryInterp] = useState('');
  const [interpretingLibrary, setInterpretingLibrary] = useState(false);
  const [bibReport, setBibReport] = useState(null);
  const [bibError, setBibError] = useState('');
  const [bibSort, setBibSort] = useState({ key: 'start_date_iso', dir: 'asc' });
  const [bibFilter, setBibFilter] = useState('all');
  const [bibVarMin, setBibVarMin] = useState(0);
  const bibFileRef = useRef(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      setError('Solo se aceptan archivos de video (MP4, MOV, AVI, WebM)');
      return;
    }
    if (f.size > 150 * 1024 * 1024) {
      setError('El archivo pesa más de 150 MB. Grabá en menor resolución o recortá el video.');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError('');
    setResult(null);

    const steps = [
      'Subiendo video al servidor...',
      'Extrayendo frames con ffmpeg...',
      'Leyendo subtítulos y elementos visuales...',
      'Analizando hook, cuerpo y cierre...',
      'Detectando ángulo y estrategia...',
      'Generando guía de Biblioteca de Anuncios...',
      'Preparando veredicto y WEDGE...',
    ];
    let stepIdx = 0;
    setProgress(steps[0]);
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setProgress(steps[stepIdx]);
    }, 4000);

    try {
      const fd = new FormData();
      fd.append('file', file);
      if (niche) fd.append('niche', niche);
      if (brand) fd.append('brand', brand);
      if (hypothesis) fd.append('hypothesis', hypothesis);

      const res = await fetch(`${API}/agents/analyze-video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }

      const data = await res.json();
      setResult(data.analysis);
      setAnalysisId(data.analysis_id);
      setLibraryData('');
      setLibraryInterp('');
      setTab('result');
    } catch (e) {
      clearInterval(interval);
      setError(e.message || 'Error inesperado. Intentá de nuevo.');
    } finally {
      setAnalyzing(false);
      setProgress('');
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API}/agents/analyze-video/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnalysis = async (id) => {
    try {
      const res = await fetch(`${API}/agents/analyze-video/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResult(data.analysis);
      setAnalysisId(data.analysis_id);
      setLibraryData('');
      setLibraryInterp('');
      setTab('result');
    } catch (e) {
      console.error(e);
    }
  };

  const interpretLibrary = async () => {
    if (!libraryData.trim() || !analysisId) return;
    setInterpretingLibrary(true);
    setLibraryInterp('');
    try {
      const res = await fetch(`${API}/agents/analyze-video/${analysisId}/interpret-library`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_data: libraryData }),
      });
      const data = await res.json();
      setLibraryInterp(data.interpretation || 'Sin respuesta');
    } catch (e) {
      setLibraryInterp('Error al interpretar. Intentá de nuevo.');
    } finally {
      setInterpretingLibrary(false);
    }
  };

  const handleLibraryJsonFile = (f) => {
    setBibError('');
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.json')) {
      setBibError('Subí el archivo JSON exportado por la extensión MetaDash Spy.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.ads || !Array.isArray(parsed.ads)) {
          setBibError('El JSON no parece de MetaDash Spy — falta el array "ads".');
          return;
        }
        try {
          localStorage.setItem('mdspy_last_library', JSON.stringify(parsed));
        } catch (_) {}
        setBibReport(parsed);
      } catch (e) {
        setBibError('No pude parsear el JSON. Verificá que sea el archivo exportado por la extensión.');
      }
    };
    reader.readAsText(f);
  };

  const goToInvestigadorWithLibrary = () => {
    if (!bibReport) return;
    try {
      sessionStorage.setItem('mdspy_library_for_validar', JSON.stringify(bibReport));
      if (analysisId) sessionStorage.setItem('mdspy_video_analysis_id', analysisId);
    } catch (_) {}
    router.push('/validar?source=spy');
  };

  // Carga de biblioteca persistida — si entrás a la tab y antes habías subido un JSON
  if (typeof window !== 'undefined' && !bibReport && tab === 'biblioteca') {
    try {
      const cached = localStorage.getItem('mdspy_last_library');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.ads) setBibReport(parsed);
      }
    } catch (_) {}
  }

  const sortedBibAds = (() => {
    if (!bibReport?.ads) return [];
    let arr = [...bibReport.ads];
    if (bibFilter !== 'all') arr = arr.filter((a) => a.media_type === bibFilter);
    if (bibVarMin > 0) arr = arr.filter((a) => (a.variation_count || 1) >= bibVarMin);
    const k = bibSort.key;
    const dir = bibSort.dir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let av = a[k];
      let bv = b[k];
      if (k === 'variation_count' || k === 'days_active') {
        av = av || 0;
        bv = bv || 0;
        return (av - bv) * dir;
      }
      if (typeof av !== 'string') av = av == null ? '' : String(av);
      if (typeof bv !== 'string') bv = bv == null ? '' : String(bv);
      return av.localeCompare(bv) * dir;
    });
    return arr;
  })();

  const toggleSort = (key) => {
    setBibSort((prev) => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' });
  };

  const goToPipeline = () => {
    const seed = result?.pipeline_seed || {};
    const params = new URLSearchParams({
      nicho: seed.nicho || niche || '',
      problema: seed.problema_principal || '',
      wedge: seed.wedge || '',
      angulo: seed.angulo_hook || '',
      precio_competidor: seed.precio_competidor || '',
      notas: seed.notas_estrategicas || '',
    });
    router.push(`/lanzar?${params.toString()}`);
  };

  const goToAnalyzer = () => {
    const seed = result?.pipeline_seed || {};
    const analisis = result?.analisis_estrategico || {};
    const params = new URLSearchParams({
      landing_url: '',
      niche: seed.nicho || analisis.nicho_exacto || niche || '',
      brand: analisis.marca_detectada || brand || '',
      wedge: seed.wedge || '',
    });
    router.push(`/analizar?${params.toString()}`);
  };

  const a = result;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#8b5cf6' }}>
              Inteligencia Competitiva
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Spy de Ads</h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
              Subí un video de ad del competidor — extraemos todo: hook, copy, estrategia, WEDGE y script listo para superar.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6', display: 'inline-block' }} />
            Claude Vision
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#16161a', border: '1px solid #1e1e24', width: 'fit-content' }}>
          {[
            { id: 'upload', label: 'Analizar Video' },
            { id: 'result', label: 'Resultado', disabled: !result },
            { id: 'biblioteca', label: 'Biblioteca' },
            { id: 'history', label: 'Historial' },
          ].map((t) => (
            <button key={t.id}
              onClick={() => { setTab(t.id); if (t.id === 'history') loadHistory(); }}
              disabled={t.disabled}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-30"
              style={tab === t.id
                ? { background: '#0d0d11', color: '#c4b5fd', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }
                : { color: '#6b7280' }
              }>
              {t.label}
            </button>
          ))}
        </div>

        {/* Upload Tab */}
        {tab === 'upload' && (
          <div className="space-y-5">

            {/* Drop zone */}
            <div
              ref={dropRef}
              onClick={() => !file && fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className="rounded-2xl p-8 text-center transition-all cursor-pointer"
              style={{
                background: dragOver ? 'rgba(139,92,246,0.06)' : '#16161a',
                border: `2px dashed ${dragOver || file ? '#8b5cf6' : '#2a2a35'}`,
              }}>
              {file ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                    <Icon name="videos" size={22} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{file.name}</p>
                    <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: '#0d0d11', border: '1px solid #2a2a35', color: '#9ca3af' }}>
                    Cambiar video
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}>
                    <Icon name="videos" size={22} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Arrastrá el video acá o hacé click</p>
                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                      MP4, MOV, AVI, WebM — máx. 150 MB
                    </p>
                    <p className="text-xs mt-2" style={{ color: '#4b5563' }}>
                      Tip: grabá la pantalla del celu con la Story/Reel, o descargá el Reel antes de subirlo
                    </p>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>

            {/* Context fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: '#9ca3af' }}>
                  Nicho / industria <span style={{ color: '#6b7280' }}>(opcional)</span>
                </label>
                <input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="ej: restaurantes, fitness, infoproductos"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-transparent outline-none"
                  style={{ background: '#16161a', border: '1px solid #2a2a35', color: '#e5e7eb' }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: '#9ca3af' }}>
                  Marca o anunciante <span style={{ color: '#6b7280' }}>(opcional)</span>
                </label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="ej: Negocio de Elite, FEKA, etc."
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-transparent outline-none"
                  style={{ background: '#16161a', border: '1px solid #2a2a35', color: '#e5e7eb' }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: '#9ca3af' }}>
                Hipótesis o contexto adicional <span style={{ color: '#6b7280' }}>(opcional)</span>
              </label>
              <textarea
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                rows={2}
                placeholder="ej: creo que están vendiendo un curso de automatización de restaurantes a $297, usan UGC con creadores gastronómicos"
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-transparent outline-none resize-none"
                style={{ background: '#16161a', border: '1px solid #2a2a35', color: '#e5e7eb' }}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            {analyzing ? (
              <div className="rounded-2xl p-6 text-center space-y-4" style={{ background: '#16161a', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-white">Analizando...</p>
                  <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>{progress}</p>
                </div>
                <p className="text-xs" style={{ color: '#4b5563' }}>
                  Esto puede tardar 30-60 segundos — Claude está leyendo frame a frame
                </p>
              </div>
            ) : (
              <button
                onClick={analyze}
                disabled={!file}
                className="w-full py-3 text-sm font-bold rounded-xl transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
                  color: 'white',
                  boxShadow: file ? '0 4px 20px rgba(139,92,246,0.25)' : 'none',
                }}>
                <span className="flex items-center justify-center gap-2">
                  <Icon name="audit" size={16} strokeWidth={2} />
                  Analizar Ad Nivel Dios
                </span>
              </button>
            )}
          </div>
        )}

        {/* Result Tab */}
        {tab === 'result' && a && (
          <div className="space-y-4">

            {/* Top card: veredicto */}
            {a.veredicto_duplicacion && (
              <div className="rounded-2xl p-5" style={{ background: '#16161a', border: `1px solid ${verdictColor(a.veredicto_duplicacion.decision)}30` }}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={a.veredicto_duplicacion.score_general} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>Veredicto</p>
                      <p className="text-lg font-black" style={{ color: verdictColor(a.veredicto_duplicacion.decision) }}>
                        {a.veredicto_duplicacion.decision}
                      </p>
                      {a.veredicto_duplicacion.wedge && (
                        <p className="text-xs mt-1.5 font-medium" style={{ color: '#d1d5db' }}>
                          <span style={{ color: '#8b5cf6' }}>WEDGE: </span>
                          {a.veredicto_duplicacion.wedge}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={goToAnalyzer}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all"
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
                      <Icon name="audit" size={12} strokeWidth={2} />
                      → Analizador Profundo
                    </button>
                    <button onClick={goToPipeline}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all"
                      style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
                      <Icon name="rocket" size={12} strokeWidth={2} />
                      → Generar mi versión
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transcripción */}
            {a.transcripcion_completa && (
              <Section title="Transcripción completa" color="#10b981" icon="dashboard">
                <div className="rounded-xl p-4 font-mono text-sm leading-relaxed"
                  style={{ background: '#0d0d11', color: '#d1d5db', border: '1px solid #1e1e24' }}>
                  {a.transcripcion_completa}
                </div>
              </Section>
            )}

            {/* Estructura temporal */}
            {a.estructura_temporal && (
              <Section title="Estructura del Ad (segundo a segundo)" color="#f59e0b" icon="rocket">
                <div className="space-y-3">
                  {[
                    { label: 'HOOK (0-3s)', value: a.estructura_temporal.hook_0_3s, color: '#ef4444' },
                    { label: 'DESARROLLO (3-20s)', value: a.estructura_temporal.desarrollo_3_20s, color: '#f59e0b' },
                    { label: 'CIERRE', value: a.estructura_temporal.cierre_ultimos_5s, color: '#10b981' },
                    { label: 'Momento de decisión del viewer', value: a.estructura_temporal.momento_clave, color: '#6366f1' },
                  ].map((item) => item.value && (
                    <div key={item.label} className="flex gap-3">
                      <div className="w-1 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: item.color }}>
                          {item.label}
                        </p>
                        <p className="text-sm" style={{ color: '#d1d5db' }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Visual */}
            {a.analisis_visual && (
              <Section title="Análisis Visual" color="#ec4899" icon="videos">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Field label="Tipo de contenido" value={a.analisis_visual.tipo_contenido} />
                    <Field label="Ritmo de edición" value={a.analisis_visual.ritmo_edicion} />
                    <Field label="Tipo de hook visual" value={a.analisis_visual.tipo_hook_visual} />
                    <Field label="Calidad de producción" value={a.analisis_visual.calidad_produccion} />
                    <Field label="¿Parece escalado?" value={a.analisis_visual.parece_escalado ? 'Sí' : 'No'} />
                    <Field label="¿UGC orgánico?" value={a.analisis_visual.parece_ugc_organico ? 'Sí' : 'No'} />
                  </div>
                  <ListField label="Texto en pantalla" items={a.analisis_visual.texto_en_pantalla} color="#ec4899" />
                  <ListField label="Elementos dopamina" items={a.analisis_visual.elementos_dopamina} color="#f59e0b" />
                  <ListField label="Elementos de confianza" items={a.analisis_visual.elementos_confianza} color="#10b981" />
                </div>
              </Section>
            )}

            {/* Copy */}
            {a.analisis_copy && (
              <Section title="Análisis de Copy" color="#6366f1" icon="campaigns">
                <div className="space-y-4">
                  {a.analisis_copy.hook_frase_exacta && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6366f1' }}>Hook exacto</p>
                      <p className="text-sm font-semibold" style={{ color: '#c7d2fe' }}>
                        "{a.analisis_copy.hook_frase_exacta}"
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Field label="Estructura" value={a.analisis_copy.estructura} />
                    <Field label="Promesa principal" value={a.analisis_copy.promesa_principal} />
                    <Field label="Mecanismo único" value={a.analisis_copy.mecanismo_unico} />
                    <Field label="CTA exacto" value={a.analisis_copy.cta_exacto} />
                    <Field label="Urgencia / Escasez" value={a.analisis_copy.urgencia_escasez} />
                    <Field label="Score copywriting" value={`${a.analisis_copy.score_copywriting}/10`} />
                  </div>
                  <ListField label="Palabras de poder" items={a.analisis_copy.palabras_poder_usadas} color="#6366f1" />
                  <ListField label="Open loops" items={a.analisis_copy.open_loops_creados} color="#8b5cf6" />
                  <ListField label="Objeciones manejadas" items={a.analisis_copy.objeciones_manejadas} color="#10b981" />
                </div>
              </Section>
            )}

            {/* Psicología */}
            {a.analisis_psicologico && (
              <Section title="Análisis Psicológico" color="#f59e0b" icon="agents">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Emoción principal activada" value={a.analisis_psicologico.emocion_principal_activada} />
                    <Field label="Dolor específico tocado" value={a.analisis_psicologico.dolor_especifico_tocado} />
                    <Field label="Avatar implícito" value={a.analisis_psicologico.avatar_implicito} />
                    <Field label="Nivel de sofisticación del mercado" value={a.analisis_psicologico.nivel_sofisticacion_mercado} />
                    <Field label="Identidad que apela" value={a.analisis_psicologico.identidad_que_apela} />
                    <Field label="Creencia que rompe" value={a.analisis_psicologico.creencia_que_rompe} />
                  </div>
                  <ListField label="Gatillos psicológicos usados" items={a.analisis_psicologico.gatillos_psicologicos} color="#f59e0b" />
                </div>
              </Section>
            )}

            {/* Estrategia */}
            {a.analisis_estrategico && (
              <Section title="Análisis Estratégico" color="#10b981" icon="financials">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Marca detectada" value={a.analisis_estrategico.marca_detectada} />
                  <Field label="Producto detectado" value={a.analisis_estrategico.producto_detectado} />
                  <Field label="Precio implícito" value={a.analisis_estrategico.precio_implicito} />
                  <Field label="Nicho exacto" value={a.analisis_estrategico.nicho_exacto} />
                  <Field label="Ángulo central" value={a.analisis_estrategico.angulo_central} />
                  <Field label="Por qué funciona" value={a.analisis_estrategico.por_que_funciona_este_angulo} />
                  <Field label="Qué está testeando" value={a.analisis_estrategico.que_esta_testeando} />
                  <Field label="Tipo de funnel" value={a.analisis_estrategico.funnel_detectado} />
                </div>
              </Section>
            )}

            {/* Biblioteca de Anuncios */}
            {a.biblioteca_anuncios && (
              <Section title="Biblioteca de Anuncios — Qué buscar" color="#6366f1" icon="audit">
                <div className="space-y-4">
                  {a.biblioteca_anuncios.terminos_busqueda?.map((t, i) => (
                    <div key={i} className="rounded-xl p-4 space-y-2"
                      style={{ background: '#0d0d11', border: '1px solid #1e1e24' }}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-xs font-bold text-white">{t.termino}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{t.razon}</p>
                        </div>
                        {t.url_sugerida && (
                          <a href={t.url_sugerida} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0"
                            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
                            Abrir biblioteca →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6366f1' }}>Qué observar cuando entrés</p>
                    <ul className="space-y-1.5">
                      {a.biblioteca_anuncios.que_observar?.map((item, i) => (
                        <li key={i} className="flex gap-2 text-xs" style={{ color: '#d1d5db' }}>
                          <span style={{ color: '#6366f1', flexShrink: 0 }}>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {a.biblioteca_anuncios.como_interpretar_los_datos && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                      <p className="text-xs" style={{ color: '#c4b5fd' }}>
                        {a.biblioteca_anuncios.como_interpretar_los_datos}
                      </p>
                    </div>
                  )}

                  {/* Pegar datos de biblioteca */}
                  <div className="rounded-xl p-4 space-y-3" style={{ background: '#0d0d11', border: '1px solid rgba(99,102,241,0.25)' }}>
                    <div>
                      <p className="text-xs font-bold text-white mb-0.5">Pegá lo que encontraste en la Biblioteca</p>
                      <p className="text-[11px]" style={{ color: '#6b7280' }}>
                        Ej: "tienen 23 ads activos, el más viejo es de octubre 2024, esta semana subieron 3 nuevos"
                      </p>
                    </div>
                    <textarea
                      value={libraryData}
                      onChange={(e) => setLibraryData(e.target.value)}
                      rows={3}
                      placeholder="Contame qué viste: cuántos ads tienen, cuándo arrancaron, qué tan activos están últimamente..."
                      className="w-full px-3 py-2.5 rounded-xl text-sm bg-transparent outline-none resize-none"
                      style={{ background: '#16161a', border: '1px solid #2a2a35', color: '#e5e7eb' }}
                    />
                    <button
                      onClick={interpretLibrary}
                      disabled={!libraryData.trim() || interpretingLibrary}
                      className="w-full py-2.5 text-sm font-bold rounded-xl transition-all disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: 'white' }}>
                      {interpretingLibrary ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Interpretando...
                        </span>
                      ) : '🔍 Interpretar estos datos'}
                    </button>
                    {libraryInterp && (
                      <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6366f1' }}>Interpretación</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#e5e7eb' }}>{libraryInterp}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* Veredicto detallado */}
            {a.veredicto_duplicacion && (
              <Section title="Veredicto de Duplicación" color={verdictColor(a.veredicto_duplicacion.decision)} icon="crown">
                <div className="space-y-4">
                  {a.veredicto_duplicacion.por_que_funciona?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#10b981' }}>Por qué funciona</p>
                      <ul className="space-y-1.5">
                        {a.veredicto_duplicacion.por_que_funciona.map((r, i) => (
                          <li key={i} className="flex gap-2 text-sm" style={{ color: '#d1d5db' }}>
                            <span style={{ color: '#10b981' }}>✓</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {a.veredicto_duplicacion.puntos_debiles?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#f59e0b' }}>Puntos débiles (explotables)</p>
                      <ul className="space-y-1.5">
                        {a.veredicto_duplicacion.puntos_debiles.map((r, i) => (
                          <li key={i} className="flex gap-2 text-sm" style={{ color: '#d1d5db' }}>
                            <span style={{ color: '#f59e0b' }}>◆</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {a.veredicto_duplicacion.que_mejorar_exactamente?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#8b5cf6' }}>Qué mejorar exactamente</p>
                      <ul className="space-y-1.5">
                        {a.veredicto_duplicacion.que_mejorar_exactamente.map((r, i) => (
                          <li key={i} className="flex gap-2 text-sm" style={{ color: '#d1d5db' }}>
                            <span style={{ color: '#8b5cf6' }}>→</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {a.veredicto_duplicacion.diferenciador_que_te_gana && (
                    <div className="rounded-xl p-4"
                      style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#8b5cf6' }}>
                        Cómo construís el ad que lo gana
                      </p>
                      <p className="text-sm" style={{ color: '#c4b5fd' }}>
                        {a.veredicto_duplicacion.diferenciador_que_te_gana}
                      </p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Script Template */}
            {a.script_template && (
              <Section title="Script Template — Tu versión lista para producir" color="#ec4899" icon="rocket">
                <div className="space-y-3">
                  {[
                    { label: 'HOOK (0-3s)', key: 'hook_0_3s', color: '#ef4444' },
                    { label: 'PROBLEMA (3-8s)', key: 'problema_3_8s', color: '#f59e0b' },
                    { label: 'SOLUCIÓN (8-18s)', key: 'solucion_8_18s', color: '#10b981' },
                    { label: 'PRUEBA (18-23s)', key: 'prueba_18_23s', color: '#6366f1' },
                    { label: 'CTA (23-27s)', key: 'cta_23_27s', color: '#ec4899' },
                  ].map(({ label, key, color }) => a.script_template[key] && (
                    <div key={key} className="flex gap-3">
                      <div className="w-1 rounded-full flex-shrink-0" style={{ background: color }} />
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>
                          {label}
                        </p>
                        <div className="rounded-lg p-3 font-mono text-sm leading-relaxed"
                          style={{ background: '#0d0d11', color: '#e5e7eb', border: '1px solid #1e1e24' }}>
                          {a.script_template[key]}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const t = a.script_template;
                      const parts = ['HOOK:', t.hook_0_3s, '\nPROBLEMA:', t.problema_3_8s, '\nSOLUCIÓN:', t.solucion_8_18s, '\nPRUEBA:', t.prueba_18_23s, '\nCTA:', t.cta_23_27s];
                      navigator.clipboard.writeText(parts.filter(Boolean).join('\n'));
                    }}
                    className="w-full py-2 text-xs font-semibold rounded-xl transition-all mt-2"
                    style={{ background: '#0d0d11', border: '1px solid #2a2a35', color: '#9ca3af' }}>
                    Copiar script completo
                  </button>
                </div>
              </Section>
            )}

            {/* Pipeline CTA */}
            <div className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4"
              style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(99,102,241,0.06))', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div>
                <p className="text-sm font-bold text-white">¿Listo para crear tu versión que lo supera?</p>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                  El pipeline arranca con el WEDGE y contexto de este análisis pre-cargados
                </p>
              </div>
              <button onClick={goToPipeline}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', color: 'white', boxShadow: '0 4px 15px rgba(139,92,246,0.25)' }}>
                <Icon name="rocket" size={15} strokeWidth={2} />
                Generar infoproducto con este WEDGE
              </button>
            </div>
          </div>
        )}

        {/* Biblioteca Tab */}
        {tab === 'biblioteca' && (
          <div className="space-y-4">

            {/* Header + cómo conseguir el JSON */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <p className="text-sm font-bold text-white">Importar Biblioteca de Anuncios</p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                Usá la extensión <strong style={{ color: '#c7d2fe' }}>MetaDash Spy</strong> en Chrome → buscá tu competidor en facebook.com/ads/library → "Escanear" → "Exportar JSON". Subí ese archivo acá.
              </p>
            </div>

            {/* Upload de JSON */}
            <div
              onClick={() => bibFileRef.current?.click()}
              className="rounded-2xl p-6 text-center transition-all cursor-pointer"
              style={{
                background: bibReport ? 'rgba(99,102,241,0.06)' : '#16161a',
                border: `2px dashed ${bibReport ? '#6366f1' : '#2a2a35'}`,
              }}>
              {bibReport ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">
                    {bibReport.meta?.page_name || bibReport.meta?.search_query || 'Biblioteca cargada'}
                  </p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>
                    {bibReport.meta?.total_detected || bibReport.ads?.length || 0} ads · scaneado el{' '}
                    {bibReport.meta?.scraped_at ? new Date(bibReport.meta.scraped_at).toLocaleDateString('es') : '—'}
                  </p>
                  <p className="text-[11px] mt-2" style={{ color: '#6b7280' }}>Click para cambiar el archivo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Subir JSON de la extensión</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Click para seleccionar el archivo</p>
                </div>
              )}
              <input ref={bibFileRef} type="file" accept="application/json,.json" className="hidden"
                onChange={(e) => handleLibraryJsonFile(e.target.files?.[0])} />
            </div>

            {bibError && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                {bibError}
              </div>
            )}

            {bibReport && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total', value: bibReport.meta?.total_detected || bibReport.ads?.length || 0, color: '#8b5cf6' },
                    { label: 'Videos', value: bibReport.summary?.videos || 0, color: '#ec4899' },
                    { label: 'Imágenes', value: bibReport.summary?.images || 0, color: '#10b981' },
                    { label: 'Max variaciones', value: bibReport.summary?.max_variations || 0, color: '#f59e0b' },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl p-3 text-center"
                      style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>{m.label}</p>
                      <p className="text-2xl font-black" style={{ color: m.color }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {bibReport.summary?.oldest_ad_date && (
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
                    <span className="text-sm" style={{ color: '#fcd34d' }}>
                      <strong>Ad más viejo activo:</strong> {bibReport.summary.oldest_ad_date}
                      {bibReport.summary.oldest_ad_days ? ` (${bibReport.summary.oldest_ad_days} días corriendo)` : ''}
                    </span>
                  </div>
                )}

                {/* Señales de scaling */}
                {bibReport.analysis?.scaling_signals?.length > 0 && (
                  <Section title="Señales de scaling" color="#10b981" icon="financials">
                    <ul className="space-y-1.5">
                      {bibReport.analysis.scaling_signals.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ color: '#d1d5db' }}>
                          <span style={{ color: '#10b981' }}>●</span>{s}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Winner probable */}
                {bibReport.analysis?.probable_winner && (
                  <Section title="Winner probable" color="#f59e0b" icon="crown">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold" style={{ color: '#fcd34d' }}>
                        "{bibReport.analysis.probable_winner.hook}"
                      </p>
                      <p className="text-xs" style={{ color: '#9ca3af' }}>
                        ID {bibReport.analysis.probable_winner.library_id} · {bibReport.analysis.probable_winner.variation_count} variaciones
                        {bibReport.analysis.probable_winner.days_active != null ? ` · ${bibReport.analysis.probable_winner.days_active}d activo` : ''}
                      </p>
                      <p className="text-xs" style={{ color: '#d1d5db' }}>{bibReport.analysis.probable_winner.reason}</p>
                    </div>
                  </Section>
                )}

                {/* Hook patterns */}
                {bibReport.analysis?.hook_patterns?.length > 0 && (
                  <Section title="Hooks repetidos" color="#ec4899" icon="campaigns">
                    <ul className="space-y-2">
                      {bibReport.analysis.hook_patterns.slice(0, 8).map((h, i) => (
                        <li key={i} className="rounded-lg p-2.5"
                          style={{ background: '#0d0d11', border: '1px solid #1e1e24' }}>
                          <p className="text-xs font-medium" style={{ color: '#e5e7eb' }}>"{h.hook}"</p>
                          <p className="text-[10px] mt-1" style={{ color: '#6b7280' }}>
                            frecuencia: {h.frequency} · max variaciones: {h.max_variations}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Prioridad de descarga */}
                {bibReport.analysis?.download_priority?.length > 0 && (
                  <Section title="Prioridad de descarga (videos a analizar primero)" color="#6366f1" icon="rocket">
                    <ul className="space-y-2">
                      {bibReport.analysis.download_priority.map((p, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="text-lg font-black flex-shrink-0" style={{ color: '#8b5cf6', minWidth: 24 }}>{i + 1}.</span>
                          <div>
                            <p className="text-sm font-semibold text-white">ID {p.library_id}</p>
                            <p className="text-xs" style={{ color: '#9ca3af' }}>{p.reason}</p>
                            {p.hook_preview && <p className="text-xs mt-1" style={{ color: '#d1d5db' }}>"{p.hook_preview}"</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Filtros + tabla */}
                <div className="rounded-2xl overflow-hidden" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                  <div className="px-4 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid #1e1e24' }}>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>
                      Tabla de Ads ({sortedBibAds.length})
                    </span>
                    <select
                      value={bibFilter}
                      onChange={(e) => setBibFilter(e.target.value)}
                      className="text-xs rounded-lg px-2 py-1.5 outline-none"
                      style={{ background: '#0d0d11', border: '1px solid #2a2a35', color: '#d1d5db' }}>
                      <option value="all">Todos</option>
                      <option value="video">Videos</option>
                      <option value="image">Imágenes</option>
                      <option value="carousel">Carruseles</option>
                    </select>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6b7280' }}>Min var.</span>
                      <input
                        type="number"
                        min="0"
                        value={bibVarMin}
                        onChange={(e) => setBibVarMin(parseInt(e.target.value, 10) || 0)}
                        className="w-14 text-xs rounded-lg px-2 py-1.5 outline-none"
                        style={{ background: '#0d0d11', border: '1px solid #2a2a35', color: '#d1d5db' }}
                      />
                    </div>
                  </div>
                  <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                    <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#0d0d11', position: 'sticky', top: 0 }}>
                        <tr style={{ color: '#9ca3af', textAlign: 'left' }}>
                          {[
                            { k: 'library_id', l: 'ID' },
                            { k: 'media_type', l: 'Tipo' },
                            { k: 'start_date_iso', l: 'Desde' },
                            { k: 'days_active', l: 'Días' },
                            { k: 'variation_count', l: 'Var.' },
                            { k: 'cta_text', l: 'CTA' },
                            { k: 'ad_text', l: 'Hook' },
                          ].map((c) => (
                            <th key={c.k}
                              onClick={() => toggleSort(c.k)}
                              className="px-3 py-2 cursor-pointer font-semibold uppercase tracking-wide"
                              style={{ fontSize: 10 }}>
                              {c.l} {bibSort.key === c.k ? (bibSort.dir === 'asc' ? '↑' : '↓') : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedBibAds.map((ad) => {
                          const hook = (ad.ad_text || '').split('\n')[0].slice(0, 70);
                          return (
                            <tr key={ad.library_id} style={{ color: '#d1d5db', borderTop: '1px solid #1e1e24' }}>
                              <td className="px-3 py-2 font-mono" style={{ color: '#9ca3af' }}>{ad.library_id}</td>
                              <td className="px-3 py-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                                  style={{
                                    background: ad.media_type === 'video' ? 'rgba(236,72,153,0.12)' : ad.media_type === 'image' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
                                    color: ad.media_type === 'video' ? '#f9a8d4' : ad.media_type === 'image' ? '#86efac' : '#a5b4fc',
                                  }}>
                                  {ad.media_type || '?'}
                                </span>
                              </td>
                              <td className="px-3 py-2">{ad.start_date_iso || '—'}</td>
                              <td className="px-3 py-2 font-semibold">{ad.days_active != null ? `${ad.days_active}d` : '—'}</td>
                              <td className="px-3 py-2 font-bold"
                                style={{ color: (ad.variation_count || 0) >= 10 ? '#fcd34d' : (ad.variation_count || 0) >= 5 ? '#a5b4fc' : '#d1d5db' }}>
                                {ad.variation_count || 1}
                              </td>
                              <td className="px-3 py-2" style={{ color: '#9ca3af' }}>{ad.cta_text || '—'}</td>
                              <td className="px-3 py-2" style={{ maxWidth: 260 }}>
                                <div title={ad.ad_text} style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>{hook}</div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CTA Investigar mercado */}
                <div className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4"
                  style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <div>
                    <p className="text-sm font-bold text-white">Cruzar con landings + video → Reporte completo</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                      El Investigador va a recibir esta biblioteca + landings que pegues + el último análisis de video, y genera el veredicto integrado con WEDGE y script template.
                    </p>
                  </div>
                  <button onClick={goToInvestigadorWithLibrary}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: 'white', boxShadow: '0 4px 15px rgba(99,102,241,0.25)' }}>
                    <Icon name="audit" size={15} strokeWidth={2} />
                    Investigar mercado completo
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b7280' }}>
                  <Icon name="audit" size={20} strokeWidth={1.5} />
                </div>
                <p className="text-sm" style={{ color: '#9ca3af' }}>No hay análisis de video todavía.</p>
              </div>
            ) : history.map((h) => (
              <button key={h.analysis_id}
                onClick={() => loadAnalysis(h.analysis_id)}
                className="w-full rounded-2xl px-5 py-4 flex items-center justify-between text-left transition-all"
                style={{ background: '#16161a', border: '1px solid #1e1e24' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                    <Icon name="videos" size={15} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{h.filename || 'Video sin nombre'}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      {h.niche || h.brand || 'Sin contexto'} — {h.created_at ? new Date(h.created_at).toLocaleDateString('es') : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {h.score && (
                    <span className="text-sm font-bold" style={{ color: h.score >= 8 ? '#10b981' : h.score >= 6 ? '#f59e0b' : '#ef4444' }}>
                      {h.score}/10
                    </span>
                  )}
                  {h.verdict && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                      style={{ background: `${verdictColor(h.verdict)}14`, color: verdictColor(h.verdict), border: `1px solid ${verdictColor(h.verdict)}30` }}>
                      {h.verdict}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
