'use client';

import { useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CopyIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125h-9.75" />
  </svg>
);

const phases = [
  {
    id: 0,
    title: 'Selección de Nicho',
    duration: '30 min',
    description: 'Encuentra el nicho perfecto validado con data real',
    icon: '🎯',
  },
  {
    id: 1,
    title: 'Research + Avatar',
    duration: '2h',
    description: 'Analiza el mercado y crea tu mecanismo único',
    icon: '🔍',
  },
  {
    id: 2,
    title: 'Stack de Oferta',
    duration: '3-4h',
    description: 'Diseña la oferta irresistible con bonos',
    icon: '🎁',
  },
  {
    id: 3,
    title: 'Landing Page',
    duration: '1h',
    description: 'Crea copy persuasivo con respuesta directa',
    icon: '📄',
  },
  {
    id: 4,
    title: 'Mockups + Tienda',
    duration: '1h',
    description: 'Diseña mockups y crea tienda Shopify',
    icon: '🏪',
  },
  {
    id: 5,
    title: 'TikTok Orgánico',
    duration: 'Día 1-3',
    description: 'Valida hooks gratis en TikTok',
    icon: '🎬',
  },
  {
    id: 6,
    title: 'Meta Ads Escala',
    duration: 'Día 3+',
    description: 'Escala con creativos probados',
    icon: '📊',
  },
  {
    id: 7,
    title: 'Decisión 72hs',
    duration: 'Análisis',
    description: 'RPV > CPV → Imprimir dinero',
    icon: '💰',
  },
];

const PromptBox = ({ prompt, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-mono text-sm text-indigo-400">{title}</h4>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white transition"
        >
          {copied ? '✓ Copiado' : <CopyIcon className="w-4 h-4" />}
        </button>
      </div>
      <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
        {prompt}
      </pre>
    </div>
  );
};

export default function PlaybookPage() {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseData, setPhaseData] = useState({});
  const [loading, setLoading] = useState(false);

  const phase = phases[currentPhase];

  // Prompts para cada fase
  const phasePrompts = {
    0: {
      title: 'PROMPT: Evaluación de Nichos',
      content: `Actúa como analista de oportunidades de mercado digital para infoproductos en LATAM.

Contexto:
Tengo [3-5] ideas de nicho para evaluar RÁPIDO. Mi modelo: 2 tiendas Shopify/semana, valido con ads + TikTok orgánico en 72hs, escalo las ganadoras.

Ideas:
1. [NICHO A]
2. [NICHO B]
3. [NICHO C]
4. [NICHO D]
5. [NICHO E]

País target: [PAÍS]

Para CADA nicho dame:
1. 5 keywords para Meta Ads Library
2. Qué espero encontrar si es viable
3. Banderas rojas
4. Ticket promedio estimado
5. Potencial en TikTok orgánico
6. Score 1-10

Al final:
- Ranking de mejor a peor
- Los 2 que ejecuto esta semana
- El que descarto y por qué`,
    },
    1: {
      title: 'PROMPT: Research de Mercado',
      content: `Actúa como un funnel hacker y copywriter de respuesta directa.

Contexto:
Nicho ganador: [NICHO]
Datos encontrados:
- Ads activos: [NÚMERO]
- Tiempo corriendo: [MESES]
- Ticket promedio: USD [RANGO]
- Tipo de producto: [PDF/VIDEO/TEMPLATES]

Necesito:
1. Tamaño del mercado en [PAÍS]: cuánta gente tiene este problema
2. Tendencia: subiendo/estable/bajando
3. Keywords con volumen transaccional
4. Competencia orgánica en IG/TikTok/YT
5. Si capturo 0.1% del mercado a USD [PRECIO], cuánto facturo
6. DECISIÓN: SÍ/NO en 3 líneas

Crea tu MECANISMO ÚNICO:
- Nombre del mecanismo: [ej: "El Protocolo de 15 minutos"]
- Por qué es diferente: [describe tu ángulo único]
- Beneficio principal: [qué logra el usuario]`,
    },
    2: {
      title: 'PROMPT: Stack de Oferta Irresistible',
      content: `Voy a vender [NOMBRE DEL PRODUCTO] a USD [PRECIO].

Diseña un "Stack de Oferta" que incluya:

1. Producto Principal: [Nombre atractivo, no "curso" o "guía"]
2. Bono 1: [Resuelve objeción específica]
   Valor percibido: USD [estimado]
   Beneficio: [1 frase]

3. Bono 2: [Otra objeción]
   Valor percibido: USD [estimado]
   Beneficio: [1 frase]

4. Bono 3: [Urgencia/scarcity]
   Valor percibido: USD [estimado]
   Beneficio: [1 frase]

VALOR TOTAL DEL STACK: USD [suma de todos]
PRECIO DE HOY: USD [PRECIO] (Descuento del X%)

Para CADA bono, responde:
- ¿Qué objeción resuelve?
- ¿Por qué lo valúo en USD X?
- ¿Cómo hago que parezca "gratis"?`,
    },
    3: {
      title: 'PROMPT: Copy de Landing Page',
      content: `Escribe el copy para una Landing Page de una sola página.

Necesito:
1. Headline magnético (máximo 12 palabras):
   Fórmula: [Resultado] + [Tiempo] + [Sin el dolor]

2. Lead (conectar con el problema):
   Historia que valida el dolor

3. Presentación del mecanismo:
   - Qué es
   - Por qué funciona
   - Por qué es diferente
   - Quién debería usarlo

4. Stack de oferta:
   [Bono 1]: [Beneficio] - Valor USD X
   [Bono 2]: [Beneficio] - Valor USD X
   [Bono 3]: [Beneficio] - Valor USD X
   VALOR TOTAL: USD X
   PRECIO HOY: USD [PRECIO]

5. Garantía de 7 días
6. Preguntas frecuentes (5-6)
7. CTA final fuerte

TONO: [cercano, humilde, motivador]`,
    },
    4: {
      title: 'PROMPT: Mockups y Diseño Visual',
      content: `Eres especialista en mockups para infoproductos digitales.

Tu objetivo: Hacer que lo DIGITAL parezca TANGIBLE.

Tipo de producto: [PDF/VIDEO/TEMPLATE/CURSO]
Nombre: [PRODUCTO]
Nicho: [NICHO]
Precio: USD [PRECIO]

Genera para CADA mockup:
1. DESCRIPCIÓN: ¿Qué muestra? ¿Dónde en la landing?
2. HERRAMIENTAS: Canva/Figma/MockFlow
3. COPY VISUAL: Títulos y elementos clave
4. IMPACTO: Cómo afecta valor percibido
5. TIEMPO: Cuánto tarda crear

Orden:
1. Principal (hero mockup)
2. Secundarios (3-4 variaciones)
3. Bonus mockups (si hay ofertas especiales)

PALETA DE COLORES:
- Color primario: #XXXXXX (psicología)
- Color secundario: #XXXXXX
- Color CTA: #XXXXXX (debe contrastar)

TIPOGRAFÍA:
- Headline: [Google Font]
- Body: [Google Font]
- Tamaños: [especifica]`,
    },
    5: {
      title: 'PROMPT: Estrategia TikTok Orgánico',
      content: `Eres especialista en TikTok para infoproductos.

Objetivo: Generar TRÁFICO GRATIS en 7 días testando hooks.

Nicho: [NICHO]
Dolor del usuario: [DOLOR]
Mecanismo: [MECANISMO]
Audiencia: [AUDIENCIA TARGET]

Genera para CADA DÍA (7 días):

DÍA 1-2: CONTENT FOUNDATION
- 3 videos (15-60 seg cada uno)
- Para CADA video: Hook | Propósito | CTA | Métrica

DÍA 3-4: SCALE & TEST
- Analizar cuáles funcionan
- Replicar hook ganador en 3 variaciones
- Meter CTA más fuerte

DÍA 5-6: MOMENTUM
- Contenido basado en lo que funcionó
- Nuevo ángulo de venta
- Test diferentes CTAs

DÍA 7: DECISIÓN
- ¿El hook funciona?
- ¿Hay tráfico al landing?
- ¿Cuántos clics?

PARA CADA VIDEO:
- Hook (3 seg): Detiene scroll
- Cuerpo (10-15 seg): Valida problema
- CTA: "Link en bio" o "Ver comentario fijado"
- Visual recomendado
- Audio: Música trending o calma
- Métrica clave

POSTING SCHEDULE:
- Cuándo postear (horas que funcionan)
- Cuántos/día
- Responder comentarios en primeros 30 min`,
    },
    6: {
      title: 'PROMPT: Variaciones de Creativos Meta Ads',
      content: `Eres especialista en creative testing para Meta Ads.

Tu hook ganador funciona. Ahora genera 10 VARIACIONES testando UNA cosa a la vez.

Hook ganador: [COPY DEL HOOK]
Ángulo: [PAIN/RESULT/MECHANISM]
Formato: [9x16/1x1/3x4/CAROUSEL]

PRINCIPIO: Si funciona, no cambies TODO. Cambia 1 variable.

GRUPO 1: VARIAR VISUALES (mismo guión y música)
1. Visual A: [describe]
2. Visual B: [describe]
3. Visual C: [describe]

GRUPO 2: VARIAR VOZ
4. Voz Masculina Deep
5. Voz Femenina Energética
6. Voz Rápida Directa

GRUPO 3: VARIAR MÚSICA
7. Música Energética: [bpm/estilo]
8. Música Calma: [bpm/estilo]
9. Sin música, solo voiceover

GRUPO 4: NUEVO ÁNGULO
10. Mantener hook, cambiar contexto visual

TESTING PROTOCOL:
- Lanzar CADA variación a $5 USD
- Dejar correr 24 horas
- 3 ganadores: aumentar presupuesto
- 7 perdedores: pausar y aprender

PLAN DE ESCALA:
- Semana 1: Testear 10 variaciones
- Semana 2: 10 nuevas del ganador
- Semana 3: Cambiar ángulo completamente
- Semana 4: Si funciona, ESCALAR PRESUPUESTO`,
    },
    7: {
      title: 'PROMPT: Análisis RPV vs CPV',
      content: `Análisis de matemática para scaling.

MÉTRICAS ACTUALES:
- RPV (Revenue per Visitor): USD [X]
- CPV (Cost per Visitor): USD [X]
- CTR: [X%]
- Conversion Rate: [X%]
- Presupuesto actual: USD [X]/día
- Target ROAS: [X]x

FÓRMULA DE ORO:
RPV > CPV = ESCALA ✓
RPV ≤ CPV = CAMBIA CREATIVO ✗

DECISIÓN:
¿ESCALO O CAMBIO?

SI ESCALO:
1. Nuevo presupuesto sugerido (+20%, +50%, +100%)
2. Visitantes esperados
3. Ventas esperadas
4. Ganancia neta

CAMBIOS ESTRUCTURALES:
- ¿Mantener creativo?
- ¿Agregar variaciones?
- ¿Expandir audiencia?

MILESTONES:
- Día 1-3: Presupuesto X, objetivo Y
- Día 4-7: Presupuesto Y, objetivo Z
- Semana 2: Presupuesto Z, objetivo final

SI NO ESCALO:
1. ¿Por qué no funciona? (desglose del problema)
2. Qué cambio PRIMERO: Creativo / Landing / Precio / Audiencia
3. A/B test recomendado

MÉTRICAS DIARIAS A MONITOREAR:
- CPV
- RPV
- CTR
- Conversion rate
- ROAS
- Spend
- Revenue`,
    },
  };

  const handleRunAgent = async (agentType) => {
    setLoading(true);
    try {
      let response;
      if (agentType === 'copywriter') {
        response = await api.runPlaybookCopywriter(phaseData);
      } else if (agentType === 'design') {
        response = await api.runPlaybookDesign(phaseData);
      } else if (agentType === 'social') {
        response = await api.runPlaybookSocialMedia(phaseData);
      }
      console.log('Agent response:', response);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">📚 Playbook Nivel Dios v3</h1>
          <p className="text-gray-400">La máquina completa: 2 tiendas/semana | Valida en 72hs | Meta Ads + TikTok Orgánico</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {phases.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPhase(idx)}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition flex-shrink-0 ${
                  currentPhase === idx
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <div className="text-xl">{p.icon}</div>
                <div className="text-xs font-medium text-center whitespace-nowrap">{p.title}</div>
                <div className="text-xs opacity-75">{p.duration}</div>
              </button>
            ))}
          </div>

          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-300"
              style={{ width: `${((currentPhase + 1) / phases.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Phase Content */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-8 space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{phase.icon} {phase.title}</h2>
            <p className="text-gray-400">{phase.description}</p>
          </div>

          {/* Prompt Section */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">📋 Prompt Listo para Copiar & Pegar</h3>
            <PromptBox
              title={phasePrompts[currentPhase].title}
              prompt={phasePrompts[currentPhase].content}
            />
            <p className="text-xs text-gray-500 mt-2">
              ✓ Completa los [CORCHETES] con tus datos y pega en Claude/ChatGPT/Gemini
            </p>
          </div>

          {/* AI Agents Section */}
          {currentPhase === 3 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4">🤖 O usa nuestros agentes IA</h3>
              <button
                onClick={() => handleRunAgent('copywriter')}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                {loading ? 'Generando...' : 'Generar Landing Page Copy'}
              </button>
            </div>
          )}

          {currentPhase === 4 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4">🤖 O usa nuestros agentes IA</h3>
              <button
                onClick={() => handleRunAgent('design')}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                {loading ? 'Generando...' : 'Generar Estrategia de Diseño'}
              </button>
            </div>
          )}

          {(currentPhase === 5 || currentPhase === 6) && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4">🤖 O usa nuestros agentes IA</h3>
              <button
                onClick={() => handleRunAgent('social')}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                {loading ? 'Generando...' : 'Generar Estrategia TikTok + Meta Ads'}
              </button>
            </div>
          )}

          {/* Checklist */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">✅ Checklist Antes de Avanzar</h3>
            <ul className="space-y-2">
              {currentPhase === 0 && (
                <>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">Analicé 3-5 nichos con Ads Library</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">Validé con Google Research y data demográfica</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">Ranking claro de mejor a peor nicho</span>
                  </li>
                </>
              )}
              {currentPhase === 1 && (
                <>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">Research completo del mercado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">Avatar cliente detallado (dolor, deseos, objeciones)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">Mecanismo Único nombrado y diferenciado</span>
                  </li>
                </>
              )}
              {currentPhase === 2 && (
                <>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">Stack de 3 bonos diseñado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">Valor total del stack {'>'} 2x precio final</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">Cada bono resuelve objeción específica</span>
                  </li>
                </>
              )}
              {currentPhase === 3 && (
                <>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">Landing copy generado y revisado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">Email sequence de 4 emails lista</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-300">3 variaciones de anuncios generadas</span>
                  </li>
                </>
              )}
              {currentPhase >= 4 && (
                <li className="flex items-start gap-3 text-gray-500">
                  <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Continúa con los siguientes pasos</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => setCurrentPhase(Math.max(0, currentPhase - 1))}
            disabled={currentPhase === 0}
            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
          >
            ← Anterior
          </button>
          <button
            onClick={() => setCurrentPhase(Math.min(phases.length - 1, currentPhase + 1))}
            disabled={currentPhase === phases.length - 1}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
          >
            Siguiente →
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/30 border border-blue-700/40 rounded-lg p-4">
          <p className="text-blue-200 text-sm">
            💡 <strong>Pro Tip:</strong> Completa cada fase en orden. El Playbook está diseñado para ejecutarse en 48 horas y validar tu producto en 72 horas con TikTok orgánico.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export function getServerSideProps(context) {
  return { props: {} };
}
