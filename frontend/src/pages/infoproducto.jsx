'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Icon } from '../components/Icons';

const COUNTRIES = [
  { v: 'LATAM|USD|neutro latinoamericano', l: 'LATAM (USD)' },
  { v: 'Argentina|ARS|argento', l: 'Argentina (ARS)' },
  { v: 'México|MXN|mexicano', l: 'México (MXN)' },
  { v: 'Colombia|COP|colombiano', l: 'Colombia (COP)' },
  { v: 'Chile|CLP|chileno', l: 'Chile (CLP)' },
  { v: 'Uruguay|UYU|uruguayo', l: 'Uruguay (UYU)' },
  { v: 'Perú|PEN|peruano', l: 'Perú (PEN)' },
  { v: 'España|EUR|español peninsular', l: 'España (EUR)' },
  { v: 'Internacional|USD|inglés neutro', l: 'Internacional (USD)' },
];

const STEPS = [
  { id: 'oferta',         num: '0',   icon: '🎯', name: 'Modelado de Oferta',      agent: 'EL INVESTIGADOR',  tag: 'Fundación' },
  { id: 'investigacion',  num: '1',   icon: '🔍', name: 'Investigación de Mercado',agent: 'EL INVESTIGADOR',  tag: 'Fundación' },
  { id: 'avatares',       num: '2',   icon: '👥', name: 'Avatares + Ángulos',      agent: 'COPYWRITER DR',    tag: 'Fundación' },
  { id: 'brand',          num: '3',   icon: '🎨', name: 'Identidad Visual',        agent: 'DIRECTOR DE ARTE', tag: 'Marca' },
  { id: 'mockup',         num: '4',   icon: '📸', name: 'Mockup Principal',        agent: 'DIRECTOR DE ARTE', tag: 'Visual' },
  { id: 'ads',            num: '5',   icon: '🖼️', name: 'Prompts de ADS',          agent: 'DIRECTOR DE ARTE', tag: 'Visual' },
  { id: 'bonus_mockups',  num: '5.1', icon: '🎁', name: 'Bonus Mockups',           agent: 'DIRECTOR DE ARTE', tag: 'Visual' },
  { id: 'bundle',         num: '5.2', icon: '📦', name: 'Bundle Completo',         agent: 'DIRECTOR DE ARTE', tag: 'Visual' },
  { id: 'landing',        num: '6',   icon: '🚀', name: 'Landing Page',            agent: 'DEVELOPER',        tag: 'Conversión' },
  { id: 'copys',          num: '7',   icon: '✍️', name: 'Copys para Ads',          agent: 'COPYWRITER DR',    tag: 'Conversión' },
  { id: 'guiones',        num: '8',   icon: '🎬', name: 'Guiones Video Ads',       agent: 'COPYWRITER DR',    tag: 'Contenido' },
  { id: 'ugc',            num: '9',   icon: '📱', name: 'UGC Realistas',           agent: 'DIRECTOR DE ARTE', tag: 'Contenido' },
  { id: 'producto',       num: '10',  icon: '📖', name: 'Generador de Producto',   agent: 'EL INVESTIGADOR',  tag: 'Producto' },
  { id: 'upsells',        num: '11',  icon: '💎', name: 'Upsells + AOV',           agent: 'COPYWRITER DR',    tag: 'Monetización' },
  { id: 'email',          num: '12',  icon: '📧', name: 'Email Marketing',         agent: 'COPYWRITER DR',    tag: 'Retención' },
  { id: 'lanzamiento',    num: '13',  icon: '🚀', name: 'Plan de Lanzamiento',     agent: 'ESTRATEGA',        tag: 'Lanzamiento' },
];

const FIELDS_BY_STEP = {
  oferta: [
    { k: 'nombre', label: 'Nombre de la oferta', type: 'text' },
    { k: 'tipo', label: 'Tipo', type: 'select', options: ['ebook','curso','membresía','plantilla','servicio','coaching','comunidad'] },
    { k: 'problema', label: '¿Qué problema resuelve?', type: 'textarea' },
    { k: 'publico', label: 'Público objetivo (avatar)', type: 'textarea' },
    { k: 'incluye', label: '¿Qué incluye?', type: 'textarea' },
    { k: 'precio', label: 'Precio objetivo', type: 'text' },
    { k: 'diferencial', label: 'Diferencial clave', type: 'textarea' },
    { k: 'prueba_social', label: 'Prueba social disponible', type: 'textarea' },
    { k: 'competidor', label: 'Competidor principal', type: 'text' },
    { k: 'bonus_count', label: 'Cantidad de bonus planeados', type: 'text' },
    { k: 'notas', label: 'Notas adicionales', type: 'textarea' },
  ],
  investigacion: [{ k: 'notas', label: 'Notas de investigación que ya tenés', type: 'textarea' }],
  avatares:      [{ k: 'notas', label: 'Notas sobre tu cliente ideal', type: 'textarea' }],
  brand: [
    { k: 'paleta', label: 'Paleta', type: 'select', options: ['Índigo Premium','Jade & Negro','Crimson Power','Ocean Blue','Rose Gold','Amber Dark','Purple Storm','Teal Pro','Slate Elite','Green Money','Sky Premium','Neutral Black'] },
    { k: 'estilo', label: 'Estilo visual', type: 'select', options: ['Profesional','Minimalista','Bold/Punk','Lujoso','Friendly','Editorial','Tech','Orgánico'] },
    { k: 'tono', label: 'Tono de comunicación', type: 'select', options: ['Directo & Honesto','Mentor/Maestro','Amigo/Cercano','Provocador','Inspirador','Científico'] },
    { k: 'fuentes', label: 'Fuentes preferidas', type: 'text' },
    { k: 'referencias', label: 'Marcas que admirás', type: 'text' },
    { k: 'evitar', label: 'Qué evitar', type: 'textarea' },
    { k: 'notas', label: 'Notas adicionales', type: 'textarea' },
  ],
  mockup: [
    { k: 'estilo', label: 'Estilo del mockup', type: 'select', options: ['Realista 3D','Flat moderno','Editorial revista','Cinematográfico','Apple-style'] },
    { k: 'contexto', label: 'Contexto', type: 'select', options: ['escritorio','manos','minimalista','lifestyle','dispositivos múltiples'] },
    { k: 'plataforma', label: 'Plataforma destino', type: 'select', options: ['hotmart','kajabi','shopify','propia','instagram'] },
    { k: 'notas', label: 'Notas', type: 'textarea' },
  ],
  ads: [
    { k: 'plataforma', label: 'Plataforma de ads', type: 'select', options: ['Meta','TikTok','Google','YouTube','Multi'] },
    { k: 'cantidad', label: '¿Cuántos prompts querés? (típico: 29)', type: 'text' },
    { k: 'notas', label: 'Estilo o moods preferidos', type: 'textarea' },
  ],
  bonus_mockups: [
    { k: 'cantidad', label: 'Cantidad de bonus', type: 'text' },
    { k: 'notas', label: 'Estilo y notas', type: 'textarea' },
  ],
  bundle: [{ k: 'notas', label: 'Notas del bundle (qué incluir, qué destacar)', type: 'textarea' }],
  landing: [
    { k: 'plataforma', label: 'Plataforma', type: 'select', options: ['hotmart','shopify','wordpress','kajabi','propia (HTML)','funnels (clickfunnels/funnelytics)'] },
    { k: 'objetivo', label: 'Objetivo principal', type: 'select', options: ['venta directa','captura de leads','VSL + venta','webinar','tripwire'] },
    { k: 'notas', label: 'Notas / requisitos', type: 'textarea' },
  ],
  copys: [
    { k: 'plataformas', label: 'Plataformas (separá por coma)', type: 'text' },
    { k: 'formatos', label: 'Formatos (separá por coma — single image, carousel, reel, etc)', type: 'text' },
    { k: 'notas', label: 'Notas / variantes que querés', type: 'textarea' },
  ],
  guiones: [
    { k: 'duraciones', label: 'Duraciones (ej: 15s, 30s, 60s)', type: 'text' },
    { k: 'angulos', label: 'Ángulos a usar', type: 'textarea' },
    { k: 'notas', label: 'Notas', type: 'textarea' },
  ],
  ugc: [
    { k: 'cantidad', label: '¿Cuántos UGC?', type: 'text' },
    { k: 'notas', label: 'Estilo (creator F 25a, M 35a serio, etc)', type: 'textarea' },
  ],
  producto: [
    { k: 'formato', label: 'Formato del producto', type: 'select', options: ['ebook','curso video','workbook','plantillas','membresía','mix'] },
    { k: 'capitulos', label: '¿Cuántos capítulos / módulos?', type: 'text' },
    { k: 'tono_contenido', label: 'Tono del contenido interno', type: 'text' },
    { k: 'notas', label: 'Notas / outline', type: 'textarea' },
  ],
  upsells: [
    { k: 'modelo', label: 'Modelo (OTO, downsell, bump)', type: 'text' },
    { k: 'precio_up', label: 'Precio upsell', type: 'text' },
    { k: 'precio_down', label: 'Precio downsell', type: 'text' },
    { k: 'notas', label: 'Notas', type: 'textarea' },
  ],
  email: [
    { k: 'secuencia', label: '¿Cuántos emails?', type: 'text' },
    { k: 'trigger', label: 'Trigger', type: 'select', options: ['compra','abandono carrito','lead nuevo','postventa','reactivación'] },
    { k: 'notas', label: 'Notas', type: 'textarea' },
  ],
  lanzamiento: [
    { k: 'modo', label: '¿Cómo querés grabar tus videos?', type: 'select', options: ['Faceless (voz en off + b-roll)', 'A cámara', 'Mix (3 faceless + 2 cámara)'] },
    { k: 'duracion', label: 'Duración promedio por video', type: 'select', options: ['15-30s', '30-60s', '60-90s'] },
    { k: 'plataforma_principal', label: 'Plataforma principal', type: 'select', options: ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Multi'] },
    { k: 'angulos', label: 'Ángulos a cubrir (opcional)', type: 'textarea' },
    { k: 'notas', label: 'Notas / restricciones', type: 'textarea' },
  ],
};

function emptyState() {
  return {
    pais: 'LATAM', moneda: 'USD', modismo: 'neutro latinoamericano',
    paso_actual: 0, pasos_completos: [],
    oferta: { nombre:'', tipo:'ebook', problema:'', publico:'', incluye:'', precio:'', diferencial:'', prueba_social:'', competidor:'', bonus_count:'3', notas:'', output:'' },
    investigacion: { notas:'', output:'' },
    avatares: { notas:'', output:'' },
    brand: { paleta:'Índigo Premium', estilo:'Profesional', tono:'Directo & Honesto', fuentes:'Montserrat + Open Sans', referencias:'Apple, Hotmart', evitar:'', notas:'', output:'' },
    mockup: { estilo:'Realista 3D', contexto:'escritorio', plataforma:'hotmart', notas:'', output:'' },
    ads: { plataforma:'Meta', cantidad:'29', notas:'', output:'' },
    bonus_mockups: { cantidad:'6', notas:'', output:'' },
    bundle: { notas:'', output:'' },
    landing: { plataforma:'hotmart', objetivo:'venta directa', notas:'', output:'' },
    copys: { plataformas:'Meta, TikTok', formatos:'single image, carousel, reel', notas:'', output:'' },
    guiones: { duraciones:'15s, 30s, 60s', angulos:'', notas:'', output:'' },
    ugc: { cantidad:'5', notas:'', output:'' },
    producto: { formato:'ebook', capitulos:'', tono_contenido:'', notas:'', output:'' },
    upsells: { modelo:'OTO + bump', precio_up:'', precio_down:'', notas:'', output:'' },
    email: { secuencia:'7', trigger:'compra', notas:'', output:'' },
    lanzamiento: { modo: 'Faceless (voz en off + b-roll)', duracion: '30-60s', plataforma_principal: 'TikTok', angulos: '', notas: '', output: '' },
  };
}

export default function InfoproductoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [PS, setPS] = useState(emptyState);
  const [running, setRunning] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // load from shared memory backend
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      try {
        const remote = await api.apiFetch('/memory/infoproducto');
        if (remote && remote.state) {
          setPS({ ...emptyState(), ...remote.state });
          return;
        }
      } catch {}
      try {
        const local = localStorage.getItem('metadash_infoproducto');
        if (local) setPS({ ...emptyState(), ...JSON.parse(local) });
      } catch {}
    })();
  }, [authLoading, user]);

  // debounced save (local + backend shared memory)
  useEffect(() => {
    const t = setTimeout(async () => {
      try { localStorage.setItem('metadash_infoproducto', JSON.stringify(PS)); } catch {}
      try {
        await api.apiFetch('/memory/infoproducto', {
          method: 'POST',
          body: JSON.stringify({ state: PS }),
          headers: { 'Content-Type': 'application/json' },
        });
        setSavedAt(Date.now());
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [PS]);

  const step = STEPS[PS.paso_actual];
  const stepData = PS[step.id] || {};
  const fields = FIELDS_BY_STEP[step.id] || [];
  const progressPct = Math.round((PS.pasos_completos.length / STEPS.length) * 100);

  const updateField = useCallback((stepId, fieldKey, value) => {
    setPS(prev => ({ ...prev, [stepId]: { ...prev[stepId], [fieldKey]: value } }));
  }, []);

  const navigate = (i) => setPS(prev => ({ ...prev, paso_actual: i }));

  const markDone = () => setPS(prev => ({
    ...prev,
    pasos_completos: prev.pasos_completos.includes(prev.paso_actual)
      ? prev.pasos_completos
      : [...prev.pasos_completos, prev.paso_actual],
  }));

  const setCountry = (v) => {
    const [p, m, mo] = v.split('|');
    setPS(prev => ({ ...prev, pais: p, moneda: m, modismo: mo }));
  };

  async function runAgent(opts = {}) {
    const { calendario = false } = opts;
    setRunning(true);
    try {
      let stateToSend = PS;
      if (calendario && step.id === 'lanzamiento') {
        stateToSend = {
          ...PS,
          lanzamiento: { ...PS.lanzamiento, modo_calendario: true },
        };
        setPS(stateToSend);
      } else if (step.id === 'lanzamiento' && PS.lanzamiento?.modo_calendario) {
        stateToSend = {
          ...PS,
          lanzamiento: { ...PS.lanzamiento, modo_calendario: false },
        };
        setPS(stateToSend);
      }
      const res = await api.apiFetch('/agents/infoproducto/run', {
        method: 'POST',
        body: JSON.stringify({ step_id: step.id, state: stateToSend }),
        headers: { 'Content-Type': 'application/json' },
      });
      const output = res?.output || res?.content || '';
      setPS(prev => ({ ...prev, [step.id]: { ...prev[step.id], output } }));
      markDone();
    } catch (e) {
      alert('Error ejecutando agente: ' + (e?.message || e));
    } finally {
      setRunning(false);
    }
  }

  function copyOutput() {
    const out = stepData.output || '';
    if (!out) return;
    navigator.clipboard.writeText(out);
  }

  if (authLoading) return null;

  return (
    <div className="flex h-screen bg-[#09090b] text-gray-100 font-sans">
      {/* SIDEBAR */}
      <aside className="w-72 min-w-[18rem] bg-[#0c0c0f] border-r border-[#1e1e24] flex flex-col">
        <div className="p-4 border-b border-[#1e1e24]">
          <div className="text-lg font-black text-indigo-400 tracking-tight">
            Meta<span className="text-amber-400">Dash</span> <span className="text-gray-500 font-normal text-sm">3.0</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Infoproducto · Nivel Dios</div>
        </div>

        <div className="p-3 border-b border-[#1e1e24]">
          <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Mercado objetivo</label>
          <select
            value={`${PS.pais}|${PS.moneda}|${PS.modismo}`}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            {COUNTRIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
          </select>
        </div>

        <div className="p-3 border-b border-[#1e1e24]">
          <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
            <span>Paso {PS.paso_actual} de {STEPS.length - 1}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1 bg-[#27272f] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {STEPS.map((s, i) => {
            const active = PS.paso_actual === i;
            const done = PS.pasos_completos.includes(i);
            return (
              <button
                key={s.id}
                onClick={() => navigate(i)}
                className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition ${
                  active ? 'bg-indigo-600/15 border border-indigo-700/40' : 'hover:bg-[#111114] border border-transparent'
                }`}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${
                  done ? 'bg-green-600 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-[#27272f] text-gray-500'
                }`}>
                  {s.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-semibold truncate ${active ? 'text-indigo-300' : 'text-gray-200'}`}>
                    {s.icon} {s.name}
                  </div>
                  <div className="text-[9px] text-gray-500 truncate">{s.agent}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#27272f] text-gray-500 shrink-0">{s.tag}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#1e1e24] space-y-2">
          <button
            onClick={() => router.push('/campaigns')}
            className="w-full px-3 py-2 bg-indigo-600/20 border border-indigo-700/40 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-lg transition"
          >
            Lanzar campañas →
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-3 py-2 bg-[#111114] hover:bg-[#1e1e24] text-gray-400 text-xs rounded-lg transition"
          >
            ← Dashboard
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 pb-32">

          {/* HEADER */}
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}><Icon name="agents" size={18} strokeWidth={1.75} /></div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">PASO {step.num}</div>
                <h1 className="text-2xl font-extrabold text-gray-100 tracking-tight">{step.name}</h1>
              </div>
              <span className="ml-auto text-[11px] px-3 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-600/30 text-indigo-300 font-bold">
                {step.agent}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Mercado: <strong className="text-gray-300">{PS.pais}</strong> · Moneda: <strong className="text-gray-300">{PS.moneda}</strong> · Tono: <strong className="text-gray-300">{PS.modismo}</strong>
            </p>
          </div>

          {/* INPUT FIELDS */}
          <div className="bg-[#16161a] border border-[#1e1e24] rounded-2xl p-5 mb-5">
            <h2 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-4 flex items-center gap-2"><Icon name="file" size={12} strokeWidth={2} />Datos para este paso</h2>
            <div className={`grid gap-3 ${fields.length > 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {fields.map((f) => (
                <div key={f.k} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1.5">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={stepData[f.k] || ''}
                      onChange={(e) => updateField(step.id, f.k, e.target.value)}
                      className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2 rounded-lg text-sm focus:border-indigo-500 focus:outline-none min-h-[80px]"
                    />
                  ) : f.type === 'select' ? (
                    <select
                      value={stepData[f.k] || ''}
                      onChange={(e) => updateField(step.id, f.k, e.target.value)}
                      className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={stepData[f.k] || ''}
                      onChange={(e) => updateField(step.id, f.k, e.target.value)}
                      className="w-full bg-[#111114] border border-[#27272f] text-gray-100 px-3 py-2 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RUN AGENT */}
          <div className="bg-[#0c0c0f] border border-indigo-700/30 rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs uppercase tracking-widest font-bold text-indigo-300 flex items-center gap-2"><Icon name="brain" size={12} strokeWidth={2} />Agente IA · Nivel Dios</h2>
              {savedAt && (
                <span className="text-[10px] text-green-400 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  Guardado
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              El agente lee toda tu memoria compartida (todos los pasos anteriores, datos del producto, métricas si tenés campañas, etc.) y genera el output completo para este paso. Listo para copiar y usar.
            </p>
            <button
              onClick={() => runAgent()}
              disabled={running}
              className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg shadow-indigo-900/30"
            >
              {running ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ejecutando agente...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="play" size={15} strokeWidth={2} />
                  Ejecutar {step.agent}
                </span>
              )}
            </button>
            {step.id === 'lanzamiento' && (
              <>
                <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
                  El estratega genera hooks + script + b-roll + caption + hashtags. Si elegís Faceless, también te tira keywords para buscar b-roll en Pexels/Pixabay y sugerencias de música trending.
                </p>
                <button
                  onClick={() => runAgent({ calendario: true })}
                  disabled={running}
                  className="w-full mt-3 px-5 py-2.5 bg-transparent border border-amber-600/50 hover:bg-amber-600/10 hover:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-amber-300 font-bold text-sm rounded-xl transition"
                >
                  {running ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin" />
                  Generando calendario...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="calendar" size={14} strokeWidth={2} />
                  Generar calendario completo de 7 videos
                </span>
              )}
                </button>
              </>
            )}
          </div>

          {/* OUTPUT */}
          {stepData.output && (
            <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2"><Icon name="copy" size={12} strokeWidth={2} />Output del agente</h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyOutput}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                  >
                    <Icon name="copy" size={11} strokeWidth={2} />Copiar
                  </button>
                  <button
                    onClick={() => runAgent()}
                    disabled={running}
                    className="px-3 py-1.5 bg-transparent border border-[#27272f] hover:border-indigo-600 text-gray-400 hover:text-indigo-300 text-xs font-bold rounded-lg transition"
                  >
                    ↺ Re-ejecutar
                  </button>
                </div>
              </div>
              <div className="bg-[#09090b] border border-[#1e1e24] rounded-xl p-4 text-xs font-mono leading-relaxed text-gray-300 whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                {stepData.output}
              </div>
            </div>
          )}

          {/* NAV */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => navigate(Math.max(0, PS.paso_actual - 1))}
              disabled={PS.paso_actual === 0}
              className="px-5 py-2.5 bg-[#16161a] hover:bg-[#1e1e24] disabled:opacity-40 text-gray-300 text-sm font-semibold rounded-lg border border-[#27272f] transition"
            >
              ← Anterior
            </button>
            <button
              onClick={() => navigate(Math.min(STEPS.length - 1, PS.paso_actual + 1))}
              disabled={PS.paso_actual === STEPS.length - 1}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition"
            >
              Siguiente →
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
