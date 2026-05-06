import { useState, useMemo } from 'react';
import { Markdown } from './Markdown';

/**
 * Post-pipeline "Centro de Lanzamiento" — re-presents the deliverables from
 * a completed pipeline run as actionable cards (preview + copy + export).
 *
 * Pure frontend: zero extra Anthropic calls. The data (deliverables) is
 * already in the run record. We only render and add smart copy/export
 * helpers per component.
 */

// Maps step_id → card config. Order matters: first to last in the launch flow.
const CARD_CONFIG = [
  {
    step: 'oferta',
    icon: '🎯',
    title: 'Modelado de Oferta',
    subtitle: 'La definición de tu producto',
    accent: 'indigo',
    actions: ['copy_full'],
  },
  {
    step: 'producto',
    icon: '📘',
    title: 'Documento del Producto',
    subtitle: 'Lo que el cliente recibe — tu PDF para vender',
    accent: 'emerald',
    actions: ['copy_full', 'download_md'],
    hint: 'Pegalo en Google Docs y exportalo como PDF. Subilo a Hotmart/Gumroad.',
  },
  {
    step: 'avatares',
    icon: '👥',
    title: 'Avatares + Ángulos de Campaña',
    subtitle: 'Tu público objetivo y los ángulos para hablarle',
    accent: 'purple',
    actions: ['copy_full'],
    hint: 'Usá esto para segmentar tus campañas de Meta/TikTok.',
  },
  {
    step: 'investigacion',
    icon: '🔍',
    title: 'Investigación de Mercado',
    subtitle: 'Datos del mercado — para tu pitch y sales page',
    accent: 'cyan',
    actions: ['copy_full'],
  },
  {
    step: 'brand',
    icon: '🎨',
    title: 'Identidad Visual',
    subtitle: 'Paleta, tono, estilo — pasale esto a tu diseñador',
    accent: 'pink',
    actions: ['copy_full'],
    hint: 'Con esto usás Canva en 10 minutos.',
  },
  {
    step: 'mockup',
    icon: '📸',
    title: 'Mockup Principal',
    subtitle: 'Prompt listo para Midjourney / Ideogram / Flux',
    accent: 'amber',
    actions: ['copy_full', 'open_midjourney'],
    hint: 'Copiá el prompt y pegalo en Midjourney v6.1 o Ideogram.',
  },
  {
    step: 'ads',
    icon: '🖼️',
    title: 'Prompts de Ads',
    subtitle: 'Imágenes para tus campañas Meta/TikTok',
    accent: 'amber',
    actions: ['copy_full'],
    hint: 'Generá las imágenes en Midjourney/Flux y subilas al Ads Manager.',
  },
  {
    step: 'bonus_mockups',
    icon: '🎁',
    title: 'Bonus Mockups',
    subtitle: 'Mockups adicionales para tus bonuses',
    accent: 'amber',
    actions: ['copy_full'],
  },
  {
    step: 'bundle',
    icon: '📦',
    title: 'Bundle Completo',
    subtitle: 'Layout del bundle (producto + bonuses)',
    accent: 'indigo',
    actions: ['copy_full'],
  },
  {
    step: 'landing',
    icon: '🚀',
    title: 'Landing Page',
    subtitle: 'Estructura completa para construir en Carrd / Hotmart / Webflow',
    accent: 'rose',
    actions: ['copy_full'],
    hint: 'Sección por sección. Construilo en Carrd.co (gratis) o Hotmart Pages.',
  },
  {
    step: 'copys',
    icon: '✍️',
    title: 'Copys para Ads (Meta + TikTok)',
    subtitle: 'Copys listos para copiar al Ads Manager',
    accent: 'sky',
    actions: ['copy_full'],
  },
  {
    step: 'guiones',
    icon: '🎬',
    title: 'Guiones de Video Ads',
    subtitle: 'Scripts 15s / 30s / 60s — listos para grabar',
    accent: 'sky',
    actions: ['copy_full'],
  },
  {
    step: 'ugc',
    icon: '📱',
    title: 'UGC Realistas',
    subtitle: 'Briefs para creators o para HeyGen / avatares AI',
    accent: 'sky',
    actions: ['copy_full'],
  },
  {
    step: 'upsells',
    icon: '💎',
    title: 'Upsells + AOV',
    subtitle: 'Estrategia de ticket promedio',
    accent: 'emerald',
    actions: ['copy_full'],
  },
  {
    step: 'email',
    icon: '📧',
    title: 'Secuencia de Email Marketing',
    subtitle: '7 emails — pegalos en Mailchimp / MailerLite / ActiveCampaign',
    accent: 'cyan',
    actions: ['copy_full'],
    hint: 'Cada email tiene asunto + body. Configurá triggers en tu plataforma.',
  },
  {
    step: 'lanzamiento',
    icon: '🗓️',
    title: 'Plan de Lanzamiento — 7 videos',
    subtitle: 'Calendario completo + hooks + scripts + b-roll',
    accent: 'violet',
    actions: ['copy_full'],
    hint: 'Tu hoja de ruta día a día. Imprimila o pegala en Notion.',
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
  if (!text) return;
  navigator.clipboard.writeText(text);
}

function ComponentCard({ config, content }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const accent = ACCENT_STYLES[config.accent] || ACCENT_STYLES.indigo;

  const wordCount = useMemo(() => (content ? String(content).trim().split(/\s+/).length : 0), [content]);

  const handleCopy = () => {
    copy(content);
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

  return (
    <div className={`rounded-2xl border ${accent.border} ${accent.bg} overflow-hidden transition-all`}>
      {/* Header */}
      <div className="p-5 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl ${accent.iconBg} flex items-center justify-center text-xl shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-bold ${accent.text} mb-0.5`}>{config.title}</h3>
          <p className="text-xs text-gray-500">{config.subtitle}</p>
          {config.hint && (
            <p className="text-[11px] text-gray-600 mt-1.5 italic">💡 {config.hint}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide font-semibold">Listo</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{wordCount.toLocaleString()} palabras</div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-3 flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-lg ${accent.iconBg} ${accent.text} hover:brightness-125 text-[11px] font-bold flex items-center gap-1.5 transition`}
        >
          {copied ? '✓ Copiado' : '📋 Copiar todo'}
        </button>
        <button
          onClick={downloadAsMd}
          className="px-3 py-1.5 rounded-lg bg-[#1e1e24] hover:bg-[#27272f] text-gray-300 text-[11px] font-bold flex items-center gap-1.5 transition"
        >
          ⬇ Descargar .md
        </button>
        {config.actions?.includes('open_midjourney') && (
          <a
            href="https://www.midjourney.com/imagine"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#1e1e24] hover:bg-[#27272f] text-gray-300 text-[11px] font-bold flex items-center gap-1.5 transition"
          >
            🎨 Abrir Midjourney →
          </a>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 text-[11px] font-bold transition"
        >
          {expanded ? 'Ocultar ▲' : 'Ver preview ▼'}
        </button>
      </div>

      {/* Preview (collapsible) */}
      {expanded && (
        <div className="border-t border-[#1e1e24] bg-[#09090b] p-5 max-h-[500px] overflow-y-auto">
          <Markdown>{content}</Markdown>
        </div>
      )}
    </div>
  );
}

export default function LaunchDashboard({ run, onDownloadBundle }) {
  const deliverables = run?.deliverables || {};
  const stepsAvailable = CARD_CONFIG.filter((c) => deliverables[c.step]);
  const productName = run?.product_name || run?.state_snapshot?.oferta?.nombre || 'Tu Infoproducto';

  // Smart export: full bundle as one giant markdown document
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

  // Build a printable launch checklist
  const checklistMd = useMemo(() => {
    return [
      `# Checklist de Lanzamiento — ${productName}`,
      '',
      '## Antes del lanzamiento',
      '- [ ] Generar mockup principal en Midjourney usando el prompt del card "Mockup Principal"',
      '- [ ] Generar 5 imágenes de ads en Midjourney/Flux',
      '- [ ] Construir landing en Carrd.co o Hotmart Pages siguiendo el card "Landing Page"',
      '- [ ] Crear producto en Hotmart/Gumroad con el documento del producto',
      '- [ ] Configurar la secuencia de 7 emails en Mailchimp/MailerLite',
      '',
      '## Día 1 — Lanzamiento',
      '- [ ] Publicar el primer video del plan de lanzamiento',
      '- [ ] Activar primera campaña de ads en Meta',
      '- [ ] Mandar email 1 (anuncio) a la lista',
      '',
      '## Día 2 al 7',
      '- [ ] Seguir el calendario del card "Plan de Lanzamiento" día a día',
      '- [ ] Publicar 1 video por día siguiendo los guiones generados',
      '- [ ] Mandar emails de la secuencia según el plan',
      '',
      '## Métricas a trackear',
      '- [ ] CTR de ads (objetivo > 1.5%)',
      '- [ ] CPA / CPL',
      '- [ ] Ratio de conversión de la landing (objetivo > 2%)',
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
    <div className="space-y-5">
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
            <p className="text-xs text-gray-500 mt-2">
              Cada tarjeta abajo es un componente de tu lanzamiento. Click en "Ver preview" para revisar el contenido,
              "Copiar todo" para llevarlo a la herramienta correspondiente, o descargarlo como `.md` individual.
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
          <ComponentCard key={c.step} config={c} content={deliverables[c.step]} />
        ))}
      </div>

      {/* Footer help */}
      <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-2xl p-5 text-center">
        <p className="text-xs text-gray-500 leading-relaxed">
          💡 <strong className="text-gray-300">Recomendación de uso:</strong> empezá por el documento del producto (Hotmart),
          después la landing (Carrd.co), después los mockups (Midjourney), y por último los ads.
          Seguí el "Checklist de lanzamiento" arriba para no perderte ningún paso.
        </p>
      </div>
    </div>
  );
}
