import { useState, useMemo } from 'react';
import { Markdown } from './Markdown';

/**
 * Post-pipeline "Centro de Lanzamiento" — re-presents the deliverables from
 * a completed pipeline run as actionable cards with HANDOFF buttons that
 * generate tool-specific prompts (Claude Design, Midjourney, etc.) and
 * copy them to clipboard while opening the destination tool in a new tab.
 *
 * Pure frontend: zero extra Anthropic calls.
 */

// ──────────────────────── Handoff prompt builders ────────────────────────
// Each builder receives the deliverable content + run context and returns
// a fully-formatted prompt ready to paste into the destination tool.

const HANDOFFS = {
  // Claude.ai chat → makes premium PDFs from text via Design mode
  claude_pdf: {
    label: 'Diseñar PDF en Claude',
    icon: '🎨',
    accent: 'from-orange-600 to-amber-600',
    url: 'https://claude.ai/new',
    helpText: 'Pegá el prompt en Claude (Ctrl+V) y te genera el PDF con diseño editorial.',
    build: (content, ctx) => `Necesito que generes un PDF de diseño editorial premium para este infoproducto.

**Producto:** ${ctx.productName || 'Mi Infoproducto'}
**Estilo deseado:** moderno, profesional, tipografía elegante, layout tipo revista de negocios
**Objetivo:** que el cliente final lo abra y sienta que pagó algo de calidad

INSTRUCCIONES PARA EL DISEÑO:
- Portada con título grande, subtítulo y autor
- Índice con números de página
- Headers de capítulo destacados (gran tipografía + número de capítulo)
- Body text legible (16-18px)
- Bloques de cita destacados (border-left + bg distinto)
- Tablas con bordes prolijos
- Footer con número de página + nombre del producto
- Paleta: dark/elegante o limpia editorial (vos elegís lo mejor para el contenido)
- Formato A4, márgenes generosos

CONTENIDO:

${content}`,
  },

  claude_landing: {
    label: 'Diseñar Landing en Claude',
    icon: '🌐',
    accent: 'from-rose-600 to-pink-600',
    url: 'https://claude.ai/new',
    helpText: 'Pegá el prompt en Claude y te genera la landing HTML lista para subir.',
    build: (content, ctx) => `Generá una LANDING PAGE en HTML+CSS puro (sin frameworks) lista para deployar a Vercel/Carrd/Hotmart.

**Producto:** ${ctx.productName || 'Mi Infoproducto'}
**Audiencia:** Argentina/LATAM, comprador de infoproductos online
**Objetivo:** conversión a venta directa

REQUISITOS TÉCNICOS:
- HTML5 semántico, CSS en <style> en el head (un solo archivo)
- Mobile-first, responsive
- Dark mode con acentos vivos (gradient indigo-violeta o similar)
- Tipografía: Inter o similar de Google Fonts
- Carga rápida (sin librerías pesadas)
- Pixel de Meta listo para insertar (placeholder con comentario)
- Botón de pago con placeholder href="#" (yo lo cambio por Hotmart/MercadoPago después)

ESTRUCTURA DE LA LANDING (segui el copy abajo):
1. Hero con headline + subheadline + CTA principal
2. Problema / agitación
3. Solución (qué incluye)
4. Bonuses (con mockups placeholder)
5. Testimonios / prueba social
6. Garantía
7. Precio con tachado
8. Urgencia / escasez
9. FAQ
10. CTA final
11. Footer

COPY COMPLETO A USAR:

${content}`,
  },

  midjourney: {
    label: 'Generar en Midjourney',
    icon: '🖼️',
    accent: 'from-purple-600 to-fuchsia-600',
    url: 'https://www.midjourney.com/imagine',
    helpText: 'Pegá los prompts en Midjourney/Ideogram, uno a la vez.',
    build: (content, ctx) => content,
  },

  ideogram: {
    label: 'Generar en Ideogram',
    icon: '✨',
    accent: 'from-purple-600 to-pink-600',
    url: 'https://ideogram.ai/t/explore',
    helpText: 'Pegá los prompts en Ideogram. Ideal cuando tu mockup tiene texto.',
    build: (content, ctx) => content,
  },

  meta_ads: {
    label: 'Subir a Meta Ads',
    icon: '📘',
    accent: 'from-blue-600 to-indigo-600',
    url: 'https://business.facebook.com/adsmanager',
    helpText: 'Abrí Ads Manager → creá campaña → pegá copy en cada anuncio.',
    build: (content, ctx) => content,
  },

  tiktok_ads: {
    label: 'Subir a TikTok Ads',
    icon: '🎵',
    accent: 'from-rose-600 to-fuchsia-600',
    url: 'https://ads.tiktok.com/i18n/dashboard',
    helpText: 'Abrí TikTok Ads Manager y pegá el copy.',
    build: (content, ctx) => content,
  },

  mailchimp: {
    label: 'Cargar a Mailchimp',
    icon: '📧',
    accent: 'from-yellow-600 to-amber-600',
    url: 'https://login.mailchimp.com/',
    helpText: 'Creá una Customer Journey y pegá cada email del bundle.',
    build: (content, ctx) => content,
  },

  hotmart: {
    label: 'Crear en Hotmart',
    icon: '🛒',
    accent: 'from-orange-600 to-red-600',
    url: 'https://app.hotmart.com/products',
    helpText: 'Hotmart → Crear producto → subí el PDF generado y pegá el copy.',
    build: (content, ctx) => content,
  },

  heygen: {
    label: 'Generar UGC en HeyGen',
    icon: '🎙️',
    accent: 'from-emerald-600 to-teal-600',
    url: 'https://app.heygen.com/avatars',
    helpText: 'HeyGen → elegí avatar → pegá el script de cada video.',
    build: (content, ctx) => content,
  },

  notion: {
    label: 'Pegar en Notion',
    icon: '📓',
    accent: 'from-gray-600 to-zinc-600',
    url: 'https://www.notion.so/',
    helpText: 'Creá una página en Notion y pegá el plan completo.',
    build: (content, ctx) => content,
  },
};

// Maps step_id → card config + which handoffs aplican.
const CARD_CONFIG = [
  {
    step: 'oferta',
    icon: '🎯',
    title: 'Modelado de Oferta',
    subtitle: 'La definición de tu producto',
    accent: 'indigo',
    handoffs: [],
  },
  {
    step: 'producto',
    icon: '📘',
    title: 'Documento del Producto',
    subtitle: 'El contenido del PDF que el cliente recibe',
    accent: 'emerald',
    handoffs: ['claude_pdf', 'hotmart'],
  },
  {
    step: 'avatares',
    icon: '👥',
    title: 'Avatares + Ángulos de Campaña',
    subtitle: 'Tu público objetivo y los ángulos para hablarle',
    accent: 'purple',
    handoffs: [],
  },
  {
    step: 'investigacion',
    icon: '🔍',
    title: 'Investigación de Mercado',
    subtitle: 'Datos del mercado para tu pitch y sales page',
    accent: 'cyan',
    handoffs: [],
  },
  {
    step: 'brand',
    icon: '🎨',
    title: 'Identidad Visual',
    subtitle: 'Paleta, tono, estilo — para tu diseñador o Canva',
    accent: 'pink',
    handoffs: [],
  },
  {
    step: 'mockup',
    icon: '📸',
    title: 'Mockup Principal',
    subtitle: 'Prompt listo para Midjourney / Ideogram',
    accent: 'amber',
    handoffs: ['midjourney', 'ideogram'],
  },
  {
    step: 'ads',
    icon: '🖼️',
    title: 'Prompts de Imágenes para Ads',
    subtitle: 'Imágenes para tus campañas Meta/TikTok',
    accent: 'amber',
    handoffs: ['midjourney', 'ideogram'],
  },
  {
    step: 'bonus_mockups',
    icon: '🎁',
    title: 'Bonus Mockups',
    subtitle: 'Mockups adicionales para tus bonuses',
    accent: 'amber',
    handoffs: ['midjourney', 'ideogram'],
  },
  {
    step: 'bundle',
    icon: '📦',
    title: 'Bundle Completo',
    subtitle: 'Layout del bundle (producto + bonuses)',
    accent: 'indigo',
    handoffs: ['claude_pdf'],
  },
  {
    step: 'landing',
    icon: '🚀',
    title: 'Landing Page',
    subtitle: 'Copy + estructura completa lista para HTML',
    accent: 'rose',
    handoffs: ['claude_landing'],
  },
  {
    step: 'copys',
    icon: '✍️',
    title: 'Copys para Ads (Meta + TikTok)',
    subtitle: 'Texto listo para pegar al Ads Manager',
    accent: 'sky',
    handoffs: ['meta_ads', 'tiktok_ads'],
  },
  {
    step: 'guiones',
    icon: '🎬',
    title: 'Guiones de Video Ads',
    subtitle: 'Scripts 15s / 30s / 60s para grabar',
    accent: 'sky',
    handoffs: [],
  },
  {
    step: 'ugc',
    icon: '📱',
    title: 'UGC Realistas',
    subtitle: 'Briefs para creators o avatares AI',
    accent: 'sky',
    handoffs: ['heygen'],
  },
  {
    step: 'upsells',
    icon: '💎',
    title: 'Upsells + AOV',
    subtitle: 'Estrategia de ticket promedio',
    accent: 'emerald',
    handoffs: ['hotmart'],
  },
  {
    step: 'email',
    icon: '📧',
    title: 'Secuencia de Email Marketing',
    subtitle: '7 emails listos para tu plataforma',
    accent: 'cyan',
    handoffs: ['mailchimp'],
  },
  {
    step: 'lanzamiento',
    icon: '🗓️',
    title: 'Plan de Lanzamiento',
    subtitle: 'Calendario 7 días + hooks + scripts',
    accent: 'violet',
    handoffs: ['notion'],
  },
];

const ACCENT_STYLES = {
  indigo:  { bg: 'bg-indigo-600/10',  border: 'border-indigo-700/40',  text: 'text-indigo-300',  iconBg: 'bg-indigo-600/20' },
  emerald: { bg: 'bg-emerald-600/10', border: 'border-emerald-700/40', text: 'text-emerald-300', iconBg: 'bg-emerald-600/20' },
  purple:  { bg: 'bg-purple-600/10',  border: 'border-purple-700/40',  text: 'text-purple-300',  iconBg: 'bg-purple-600/20' },
  cyan:    { bg: 'bg-cyan-600/10',    border: 'border-cyan-700/40',    text: 'text-cyan-300',    iconBg: 'bg-cyan-600/20' },
  pink:    { bg: 'bg-pink-600/10',    border: 'border-pink-700/40',    text: 'text-pink-300',    iconBg: 'bg-pink-600/20' },
  amber:   { bg: 'bg-amber-600/10',   border: 'border-amber-700/40',   text: 'text-amber-300',   iconBg: 'bg-amber-600/20' },
  rose:    { bg: 'bg-rose-600/10',    border: 'border-rose-700/40',    text: 'text-rose-300',    iconBg: 'bg-rose-600/20' },
  sky:     { bg: 'bg-sky-600/10',     border: 'border-sky-700/40',     text: 'text-sky-300',     iconBg: 'bg-sky-600/20' },
  violet:  { bg: 'bg-violet-600/10',  border: 'border-violet-700/40',  text: 'text-violet-300',  iconBg: 'bg-violet-600/20' },
};

function copy(text) {
  if (!text) return Promise.resolve(false);
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}

function ComponentCard({ config, content, ctx, onToast }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const accent = ACCENT_STYLES[config.accent] || ACCENT_STYLES.indigo;

  const wordCount = useMemo(() => (content ? String(content).trim().split(/\s+/).length : 0), [content]);

  const handleCopy = async () => {
    await copy(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadAsMd = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.step}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleHandoff = async (handoffKey) => {
    const handoff = HANDOFFS[handoffKey];
    if (!handoff) return;
    const prompt = handoff.build(content, ctx);
    const ok = await copy(prompt);
    if (ok && onToast) {
      onToast(`✓ Prompt copiado. Abriendo ${handoff.label.replace(/^[^ ]+ /, '')} — pegá con Ctrl+V`);
    }
    window.open(handoff.url, '_blank', 'noopener,noreferrer');
  };

  const handoffs = (config.handoffs || []).map((k) => ({ key: k, ...HANDOFFS[k] })).filter((h) => h.label);

  return (
    <div className={`rounded-2xl border ${accent.border} ${accent.bg} overflow-hidden transition-all`}>
      <div className="p-5 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl ${accent.iconBg} flex items-center justify-center text-xl shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-bold ${accent.text} mb-0.5`}>{config.title}</h3>
          <p className="text-xs text-gray-500">{config.subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide font-semibold">Listo</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{wordCount.toLocaleString()} palabras</div>
        </div>
      </div>

      {/* Handoff buttons — the killer feature */}
      {handoffs.length > 0 && (
        <div className="px-5 pb-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">
            ⚡ Pasarlo directo a:
          </div>
          <div className="flex flex-wrap gap-2">
            {handoffs.map((h) => (
              <button
                key={h.key}
                onClick={() => handleHandoff(h.key)}
                title={h.helpText}
                className={`px-3.5 py-2 rounded-lg bg-gradient-to-r ${h.accent} hover:brightness-110 text-white text-[11px] font-bold flex items-center gap-2 shadow-md transition`}
              >
                <span>{h.icon}</span>
                <span>{h.label}</span>
                <span className="opacity-60 text-[10px]">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Secondary actions */}
      <div className="px-5 pb-3 flex flex-wrap gap-2 border-t border-[#1e1e24]/50 pt-3 mt-1">
        <button
          onClick={handleCopy}
          className="px-2.5 py-1.5 rounded-lg bg-[#1e1e24] hover:bg-[#27272f] text-gray-300 text-[11px] font-semibold flex items-center gap-1.5 transition"
        >
          {copied ? '✓ Copiado' : '📋 Copiar texto'}
        </button>
        <button
          onClick={downloadAsMd}
          className="px-2.5 py-1.5 rounded-lg bg-[#1e1e24] hover:bg-[#27272f] text-gray-300 text-[11px] font-semibold flex items-center gap-1.5 transition"
        >
          ⬇ .md
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 text-[11px] font-semibold transition"
        >
          {expanded ? 'Ocultar ▲' : 'Ver preview ▼'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[#1e1e24] bg-[#09090b] p-5 max-h-[500px] overflow-y-auto">
          <Markdown>{content}</Markdown>
        </div>
      )}
    </div>
  );
}

export default function LaunchDashboard({ run, onDownloadBundle }) {
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const deliverables = run?.deliverables || {};
  const productName = run?.product_name || run?.state_snapshot?.oferta?.nombre || 'Tu Infoproducto';
  const stepsAvailable = CARD_CONFIG.filter((c) => deliverables[c.step]);

  const ctx = { productName };

  const exportFullBundle = () => {
    const lines = [`# ${productName}`, '', `_Lanzamiento generado por MetaDash_`, '', '---', ''];
    stepsAvailable.forEach((c) => {
      lines.push(`## ${c.icon} ${c.title}`);
      lines.push('');
      lines.push(deliverables[c.step]);
      lines.push('');
      lines.push('---');
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName.toLowerCase().replace(/\s+/g, '-')}-completo.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const checklistMd = useMemo(() => {
    return [
      `# Checklist de Lanzamiento — ${productName}`,
      '',
      '## Antes del lanzamiento',
      '- [ ] PDF del producto generado en Claude.ai/Design',
      '- [ ] Mockup principal generado en Midjourney/Ideogram',
      '- [ ] 5 imágenes de ads generadas',
      '- [ ] Landing page armada (Carrd/Hotmart Pages o HTML de Claude)',
      '- [ ] Producto creado en Hotmart con el PDF',
      '- [ ] Secuencia de 7 emails configurada en Mailchimp',
      '- [ ] Pixel de Meta instalado en la landing',
      '',
      '## Día 1 — Lanzamiento',
      '- [ ] Publicar el primer video del plan',
      '- [ ] Activar primera campaña de ads en Meta',
      '- [ ] Mandar email 1 (anuncio) a la lista',
      '',
      '## Día 2 al 7',
      '- [ ] Seguir el calendario del plan de lanzamiento',
      '- [ ] 1 video por día siguiendo los guiones generados',
      '- [ ] Mandar emails de la secuencia según trigger',
      '',
      '## Métricas a trackear',
      '- [ ] CTR de ads (objetivo > 1.5%)',
      '- [ ] CPA / CPL',
      '- [ ] Conversión de la landing (objetivo > 2%)',
      '- [ ] Open rate de emails (objetivo > 25%)',
    ].join('\n');
  }, [productName]);

  const downloadChecklist = () => {
    const blob = new Blob([checklistMd], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'checklist-lanzamiento.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-bold animate-pulse">
          {toast}
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-emerald-950/30 border border-indigo-700/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🎬</div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-gray-100 mb-1 tracking-tight">
              Centro de Lanzamiento
            </h1>
            <p className="text-sm text-gray-400">
              <strong className="text-gray-200">{productName}</strong> · {stepsAvailable.length} entregables listos
            </p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Cada componente abajo tiene un botón <strong className="text-indigo-300">"Pasarlo directo a [herramienta]"</strong> que copia
              un prompt bien armado al portapapeles y abre la app correspondiente. Pegás con Ctrl+V y la herramienta
              ya sabe qué hacer. <strong className="text-gray-300">Cero pensar.</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {onDownloadBundle && (
            <button
              onClick={onDownloadBundle}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition"
            >
              📦 Bundle ZIP completo
            </button>
          )}
          <button
            onClick={exportFullBundle}
            className="px-4 py-2 rounded-lg bg-indigo-600/20 border border-indigo-700/40 hover:bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center gap-2 transition"
          >
            📄 Documento único (.md)
          </button>
          <button
            onClick={downloadChecklist}
            className="px-4 py-2 rounded-lg bg-amber-600/15 border border-amber-700/40 hover:bg-amber-600/25 text-amber-300 font-bold text-xs flex items-center gap-2 transition"
          >
            ✅ Checklist de lanzamiento
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {stepsAvailable.map((c) => (
          <ComponentCard key={c.step} config={c} content={deliverables[c.step]} ctx={ctx} onToast={showToast} />
        ))}
      </div>

      {/* Footer help */}
      <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-2xl p-5">
        <p className="text-xs text-gray-500 leading-relaxed">
          💡 <strong className="text-gray-300">Flujo recomendado:</strong> Producto → Claude (PDF) ·
          Mockups → Midjourney · Landing → Claude (HTML) · Copys → Meta Ads · Emails → Mailchimp ·
          Plan de lanzamiento → Notion. Cada botón te abre la herramienta y deja el prompt listo en
          el portapapeles. <strong className="text-gray-300">Pegás y avanzás.</strong>
        </p>
      </div>
    </div>
  );
}
