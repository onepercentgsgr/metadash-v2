import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '../components/Icons';
import { Markdown } from '../components/Markdown';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#09090b';
const CARD    = '#16161a';
const BORDER  = 'rgba(255,255,255,0.06)';
const INDIGO  = 'linear-gradient(135deg,#4f46e5,#7c3aed)';
const INDIGO_SOLID = '#4f46e5';
const INDIGO_HOVER = '#6366f1';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: BG,
    color: '#fff',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  // ── Selector mode ──
  selectorWrap: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '72px 24px 48px',
  },
  selectorHeader: {
    marginBottom: 48,
  },
  selectorTitle: {
    fontSize: 32,
    fontWeight: 700,
    background: 'linear-gradient(to bottom, #fff 0%, rgba(255,255,255,0.5) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    lineHeight: 1.2,
  },
  selectorSub: {
    marginTop: 12,
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  card: (highlighted) => ({
    background: CARD,
    border: highlighted ? 'none' : `1px solid ${BORDER}`,
    borderRadius: 16,
    padding: 32,
    cursor: 'pointer',
    position: 'relative',
    transition: 'transform 0.15s, box-shadow 0.15s',
    outline: 'none',
    ...(highlighted && {
      background: 'linear-gradient(#16161a, #16161a) padding-box, linear-gradient(135deg,#4f46e5,#7c3aed) border-box',
      border: '1px solid transparent',
      boxShadow: '0 0 40px rgba(79,70,229,0.18)',
    }),
  }),
  cardBadge: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    background: INDIGO,
    color: '#fff',
    borderRadius: 6,
    padding: '3px 10px',
    marginBottom: 20,
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 16,
    display: 'block',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 12,
    color: '#fff',
  },
  cardDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  cardCta: (highlighted) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: highlighted ? '#fff' : 'rgba(255,255,255,0.5)',
    background: highlighted ? INDIGO : 'transparent',
    border: highlighted ? 'none' : `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: '10px 18px',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  }),
  // ── Chat mode ──
  chatLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    height: '100vh',
    overflow: 'hidden',
  },
  chatLeft: {
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${BORDER}`,
    height: '100vh',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '18px 24px',
    borderBottom: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  chatHeaderBack: {
    background: 'none',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: '6px 12px',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  chatHeaderSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  messageBubble: (role) => ({
    maxWidth: '78%',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    background: role === 'user' ? 'rgba(79,70,229,0.18)' : CARD,
    border: role === 'user' ? `1px solid rgba(79,70,229,0.35)` : `1px solid ${BORDER}`,
    borderRadius: role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    padding: '12px 16px',
    fontSize: 14,
    lineHeight: 1.6,
    color: '#fff',
  }),
  messageRole: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 4,
  },
  typingDot: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: INDIGO_SOLID,
    margin: '0 2px',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
  inputArea: {
    padding: '16px 24px',
    borderTop: `1px solid ${BORDER}`,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: '12px 16px',
    color: '#fff',
    fontSize: 14,
    lineHeight: 1.5,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    maxHeight: 140,
    overflowY: 'auto',
    transition: 'border-color 0.15s',
  },
  sendBtn: (disabled) => ({
    background: disabled ? 'rgba(79,70,229,0.3)' : INDIGO,
    border: 'none',
    borderRadius: 10,
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: '#fff',
    flexShrink: 0,
    transition: 'opacity 0.15s',
  }),
  // ── Right panel ──
  rightPanel: {
    background: CARD,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  rightHeader: {
    padding: '20px 24px',
    borderBottom: `1px solid ${BORDER}`,
    flexShrink: 0,
  },
  rightTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  rightSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  rightBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  fieldCard: {
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: '12px 16px',
    animation: 'fadeIn 0.3s ease',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 1.4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 10,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  progressDots: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  dot: (done) => ({
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: done ? INDIGO : 'rgba(255,255,255,0.06)',
    border: done ? 'none' : `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: done ? '#fff' : 'rgba(255,255,255,0.2)',
    transition: 'all 0.3s',
  }),
};

// ─── Field display names ───────────────────────────────────────────────────────
const FIELD_LABELS = {
  nicho:     'Nicho',
  problema:  'Problema',
  audiencia: 'Audiencia',
  precio:    'Precio',
  formato:   'Formato',
  pais:      'País',
  nombre:    'Nombre del producto',
  mecanismo: 'Mecanismo único',
};

const STEPS_META = [
  { id: 'nicho_selector',  label: 'Nicho' },
  { id: 'research_avatar', label: 'Avatar' },
  { id: 'oferta',          label: 'Oferta' },
  { id: 'producto',        label: 'Producto' },
  { id: 'copywriting',     label: 'Copy' },
  { id: 'mockups',         label: 'Mockups' },
  { id: 'launch_plan',     label: 'Lanzamiento' },
];

const INITIAL_ASSISTANT_MSG = {
  role: 'assistant',
  content: '¡Hola! Soy tu estratega de lanzamiento. ¿Cuál es la idea o nicho para tu próximo infoproducto?',
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function LanzarPage() {
  const [mode, setMode]         = useState('selector'); // 'selector' | 'chat'
  const [messages, setMessages] = useState([INITIAL_ASSISTANT_MSG]);
  const [inputText, setInputText] = useState('');
  const [productState, setProductState] = useState({});
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [quota, setQuota] = useState(null);

  // Fetch monthly pipeline quota for the badge
  useEffect(() => {
    (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        const res = await fetch(`${API_URL}/me/pipeline-quota`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setQuota(await res.json());
      } catch {}
    })();
  }, []);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  // Build history in Anthropic message format from displayed messages
  const buildHistory = (msgs) =>
    msgs
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

  // Export entire conversation + product state as Markdown file
  const downloadInfoproducto = () => {
    const productName = productState.nombre || 'infoproducto';
    const slug = String(productName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'infoproducto';

    const lines = [];
    lines.push(`# ${productName}`);
    lines.push('');
    lines.push(`_Generado por MetaDash · ${new Date().toLocaleDateString('es-AR')}_`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## 📋 Datos del Infoproducto');
    lines.push('');
    Object.entries(productState).forEach(([k, v]) => {
      if (v) lines.push(`- **${k}**: ${v}`);
    });
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## 💬 Conversación completa con el agente');
    lines.push('');
    messages.forEach((msg) => {
      if (!msg.content) return;
      lines.push(`### ${msg.role === 'user' ? '👤 Vos' : '🤖 Agente IA'}`);
      lines.push('');
      lines.push(msg.content);
      lines.push('');
    });

    const md = lines.join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isStreaming) return;

    const userMsg = { role: 'user', content: inputText.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsStreaming(true);

    // Placeholder for assistant streaming reply
    const assistantIdx = newMessages.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const history = buildHistory(messages); // history before new user msg

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/agents/chat/launch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMsg.content,
          history,
          state: productState,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let parsed;
          try { parsed = JSON.parse(raw); } catch { continue; }

          if (parsed.type === 'text') {
            setMessages((prev) => {
              const updated = [...prev];
              const last    = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: last.content + parsed.content };
              }
              return updated;
            });
          } else if (parsed.type === 'tool') {
            // Update right panel if save_product_info
            if (parsed.name === 'save_product_info' && parsed.input?.field) {
              setProductState((prev) => ({
                ...prev,
                [parsed.input.field]: parsed.input.value,
              }));
            }
            // Mark step completed
            if (parsed.name === 'run_playbook_step' && parsed.input?.step_id) {
              setCompletedSteps((prev) =>
                prev.includes(parsed.input.step_id) ? prev : [...prev, parsed.input.step_id]
              );
            }
          } else if (parsed.type === 'done') {
            // Final state sync
            if (parsed.state) {
              setProductState((prev) => ({ ...prev, ...parsed.state }));
            }
          }
        }
      }

      // Remove streaming flag from last assistant message
      setMessages((prev) => {
        const updated = [...prev];
        const last    = updated[updated.length - 1];
        if (last && last.streaming) {
          updated[updated.length - 1] = { ...last, streaming: false };
        }
        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const last    = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            content: last.content || 'Lo siento, hubo un error. Intentá de nuevo.',
            streaming: false,
            error: true,
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Selector view ──────────────────────────────────────────────────────────
  if (mode === 'selector') {
    return (
      <>
        <style>{`
          @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
          @keyframes pulse  { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
          * { box-sizing: border-box; }
        `}</style>
        <div style={styles.page}>
          <div style={styles.selectorWrap}>
            <div style={styles.selectorHeader}>
              <h1 style={styles.selectorTitle}>Nuevo Lanzamiento</h1>
              <p style={styles.selectorSub}>Elegí cómo querés crear tu infoproducto</p>
            </div>

            <div style={styles.cardsRow}>
              {/* IA card */}
              <button
                style={styles.card(true)}
                onClick={() => setMode('chat')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <span style={styles.cardBadge}>Recomendado</span>
                <span style={styles.cardEmoji}>🤖</span>
                <p style={styles.cardTitle}>Modo IA</p>
                <p style={styles.cardDesc}>
                  Contame tu idea y armamos todo juntos. El agente te hace preguntas y genera tu
                  infoproducto completo usando el Playbook Nivel Dios.
                </p>
                <span style={styles.cardCta(true)}>
                  Empezar chat
                  <Icon name="arrowright" size={14} />
                </span>
              </button>

              {/* Manual card */}
              <Link href="/infoproducto" style={{ textDecoration: 'none' }}>
                <div
                  style={styles.card(false)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                >
                  <span style={styles.cardEmoji}>⚙️</span>
                  <p style={styles.cardTitle}>Modo Manual</p>
                  <p style={styles.cardDesc}>
                    Completá el wizard paso a paso. Ideal si ya tenés todo pensado y querés control total
                    sobre cada sección.
                  </p>
                  <span style={styles.cardCta(false)}>
                    Ir al wizard
                    <Icon name="arrowright" size={14} />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Chat view ──────────────────────────────────────────────────────────────
  const filledFields = Object.entries(productState).filter(
    ([k]) => FIELD_LABELS[k] && productState[k]
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes pulse  { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        textarea::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
      <div style={{ ...styles.page, overflow: 'hidden' }}>
        <div style={styles.chatLayout}>
          {/* ── Left: chat panel ── */}
          <div style={styles.chatLeft}>
            {/* Header */}
            <div style={{ ...styles.chatHeader, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button style={styles.chatHeaderBack} onClick={() => setMode('selector')}>
                  <Icon name="chevronLeft" size={13} />
                  Volver
                </button>
                <div>
                  <p style={styles.chatHeaderTitle}>
                    <Icon name="brain" size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Modo IA — Nivel Dios
                  </p>
                  <p style={styles.chatHeaderSub}>El agente guía tu lanzamiento paso a paso</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {quota && (
                  <span
                    title={`Plan ${quota.plan_display}`}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.55)',
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {quota.limit == null ? 'Ilimitado' : `${quota.used}/${quota.limit} este mes`}
                  </span>
                )}
                <button
                  onClick={downloadInfoproducto}
                  disabled={messages.length < 2}
                  style={{
                    padding: '8px 14px',
                    background: messages.length < 2 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
                    color: messages.length < 2 ? 'rgba(255,255,255,0.3)' : '#fff',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: messages.length < 2 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                  }}
                  title="Descargar la conversación como Markdown"
                >
                  <Icon name="file" size={13} />
                  Descargar chat
                </button>
                <button
                  onClick={() => {
                    // Persist chat-extracted state. Backend's bridge function
                    // maps these flat keys (nicho, problema, precio, etc.) into
                    // the nested pipeline shape, so we send them as-is.
                    try {
                      localStorage.setItem(
                        'metadash_pipeline_seed',
                        JSON.stringify(productState || {}),
                      );
                    } catch {}
                    window.location.href = '/infoproducto/run';
                  }}
                  disabled={Object.keys(productState || {}).length < 3}
                  style={{
                    padding: '8px 14px',
                    background: Object.keys(productState || {}).length < 3
                      ? 'rgba(255,255,255,0.04)'
                      : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    color: Object.keys(productState || {}).length < 3 ? 'rgba(255,255,255,0.3)' : '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: Object.keys(productState || {}).length < 3 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    boxShadow: Object.keys(productState || {}).length >= 3 ? '0 4px 14px rgba(79,70,229,0.4)' : 'none',
                  }}
                  title="Correr el pipeline Nivel Dios: 16 agentes generan tu infoproducto completo"
                >
                  <Icon name="rocket" size={13} />
                  Generar infoproducto completo
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={styles.messagesArea}>
              {messages.map((msg, idx) => (
                <div key={idx} style={styles.messageBubble(msg.role)}>
                  <div style={styles.messageRole}>
                    {msg.role === 'user' ? 'Vos' : 'Agente IA'}
                  </div>
                  {msg.content ? (
                    msg.role === 'assistant' ? (
                      <Markdown compact>{msg.content}</Markdown>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    )
                  ) : (msg.streaming && (
                    <span>
                      <span style={styles.typingDot} />
                      <span style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
                      <span style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
                    </span>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={styles.inputArea}>
              <textarea
                ref={textareaRef}
                rows={1}
                style={styles.textarea}
                placeholder="Escribí tu mensaje… (Enter para enviar)"
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
              />
              <button
                style={styles.sendBtn(isStreaming || !inputText.trim())}
                onClick={sendMessage}
                disabled={isStreaming || !inputText.trim()}
              >
                <Icon name="arrowright" size={16} />
              </button>
            </div>
          </div>

          {/* ── Right: product state panel ── */}
          <div style={styles.rightPanel}>
            <div style={styles.rightHeader}>
              <p style={styles.rightTitle}>
                <Icon name="rocket" size={14} />
                Tu Infoproducto
              </p>
              <p style={styles.rightSub}>
                {filledFields.length === 0
                  ? 'Los campos se irán completando a medida que charlamos'
                  : `${filledFields.length} campo${filledFields.length > 1 ? 's' : ''} completado${filledFields.length > 1 ? 's' : ''}`}
              </p>
            </div>

            <div style={styles.rightBody}>
              {/* Field cards */}
              {filledFields.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 40, color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>
                  <Icon name="brain" size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p>Todavía no hay info guardada.</p>
                  <p>Empezá la conversación para que el agente<br />complete los campos automáticamente.</p>
                </div>
              ) : (
                filledFields.map(([key, value]) => (
                  <div key={key} style={styles.fieldCard}>
                    <div style={styles.fieldLabel}>{FIELD_LABELS[key] || key}</div>
                    <div style={styles.fieldValue}>{String(value)}</div>
                  </div>
                ))
              )}

              {/* Progress dots */}
              {completedSteps.length > 0 && (
                <div style={styles.progressSection}>
                  <div style={styles.progressLabel}>Pasos del playbook</div>
                  <div style={styles.progressDots}>
                    {STEPS_META.map((step) => {
                      const done = completedSteps.includes(step.id);
                      return (
                        <div
                          key={step.id}
                          style={styles.dot(done)}
                          title={step.label}
                        >
                          {done ? <Icon name="check" size={12} /> : null}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {STEPS_META.filter((s) => completedSteps.includes(s.id)).map((s) => (
                      <span
                        key={s.id}
                        style={{
                          fontSize: 11,
                          background: 'rgba(79,70,229,0.15)',
                          border: '1px solid rgba(79,70,229,0.3)',
                          borderRadius: 6,
                          padding: '2px 8px',
                          color: 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
