// Vercel serverless function: Mercado Pago subscription webhook -> Resend email
// Path: /api/mp-webhook
//
// Required env vars:
//   - MP_ACCESS_TOKEN     Mercado Pago access token (Bearer)
//   - MP_WEBHOOK_SECRET   Secret configured in MP webhook panel (for x-signature)
//   - RESEND_API_KEY      Resend API key
//   - RESEND_FROM         (optional) From address, defaults to onboarding@resend.dev
//
// MP signature reference:
//   https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks#signature-validation

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Resend } = require('resend');

// ---------------------------------------------------------------------------
// Monthly PDF map. Replace the placeholder URLs with the real signed URLs.
// Keys are "YYYY-MM" so we can extend across years without collisions.
// ---------------------------------------------------------------------------
const MONTHLY_PDFS = {
  '2026-05': 'https://example.com/pdfs/2026-05-metadash.pdf', // TODO replace
  '2026-06': 'https://example.com/pdfs/2026-06-metadash.pdf', // TODO replace
  '2026-07': 'https://example.com/pdfs/2026-07-metadash.pdf', // TODO replace
  '2026-08': 'https://example.com/pdfs/2026-08-metadash.pdf', // TODO replace
  '2026-09': 'https://example.com/pdfs/2026-09-metadash.pdf', // TODO replace
  '2026-10': 'https://example.com/pdfs/2026-10-metadash.pdf', // TODO replace
  '2026-11': 'https://example.com/pdfs/2026-11-metadash.pdf', // TODO replace
  '2026-12': 'https://example.com/pdfs/2026-12-metadash.pdf', // TODO replace
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(...args) {
  // Vercel captures stdout in runtime logs
  console.log('[mp-webhook]', ...args);
}

function logError(...args) {
  console.error('[mp-webhook]', ...args);
}

function currentMonthKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Parse the x-signature header from Mercado Pago.
 * Format: "ts=1700000000,v1=hexdigest"
 */
function parseSignatureHeader(header) {
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(',').map((s) => s.trim());
  const out = {};
  for (const p of parts) {
    const idx = p.indexOf('=');
    if (idx === -1) continue;
    out[p.slice(0, idx).trim()] = p.slice(idx + 1).trim();
  }
  if (!out.ts || !out.v1) return null;
  return { ts: out.ts, v1: out.v1 };
}

/**
 * Validate Mercado Pago webhook signature.
 *
 * MP signs a manifest string of the form:
 *   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 * using HMAC-SHA256 with the webhook secret.
 */
function verifyMpSignature({ signatureHeader, requestId, dataId, secret }) {
  if (!secret) {
    logError('MP_WEBHOOK_SECRET not configured; skipping signature check is unsafe.');
    return false;
  }
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) {
    logError('Could not parse x-signature header:', signatureHeader);
    return false;
  }
  const manifest = `id:${dataId ?? ''};request-id:${requestId ?? ''};ts:${parsed.ts};`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(parsed.v1, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    logError('Signature comparison failed:', err);
    return false;
  }
}

/**
 * Fetch payment details from Mercado Pago.
 * Returns { payerEmail, subscriptionId, status, raw }.
 */
async function fetchPayment(paymentId, accessToken) {
  const url = `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`MP payment fetch failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  const payerEmail = data?.payer?.email ?? null;
  // For subscription/recurring payments MP returns metadata.preapproval_id or external_reference.
  const subscriptionId =
    data?.metadata?.preapproval_id ??
    data?.point_of_interaction?.transaction_data?.subscription_id ??
    data?.external_reference ??
    null;
  return {
    payerEmail,
    subscriptionId,
    status: data?.status ?? null,
    raw: data,
  };
}

/**
 * Load the email HTML template. Falls back to a minimal inline template.
 */
let _cachedTemplate = null;
function loadEmailTemplate() {
  if (_cachedTemplate !== null) return _cachedTemplate;
  try {
    const templatePath = path.join(__dirname, '..', 'resend-email-template.html');
    if (fs.existsSync(templatePath)) {
      _cachedTemplate = fs.readFileSync(templatePath, 'utf8');
      return _cachedTemplate;
    }
  } catch (err) {
    logError('Failed to load template file, using inline fallback:', err);
  }
  _cachedTemplate = `<!doctype html>
<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <h1>Your Metadash report is ready</h1>
  <p>Hi,</p>
  <p>Thanks for subscribing to Metadash. Your report for <strong>{{MONTH_LABEL}}</strong> is available:</p>
  <p><a href="{{PDF_URL}}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;border-radius:6px;text-decoration:none;">Download PDF</a></p>
  <p>Or copy this link: <a href="{{PDF_URL}}">{{PDF_URL}}</a></p>
  <hr/>
  <p style="color:#888;font-size:12px;">Subscription: {{SUBSCRIPTION_ID}}</p>
</body></html>`;
  return _cachedTemplate;
}

function renderTemplate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : `{{${key}}}`
  );
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

async function sendEmail({ to, pdfUrl, monthKey, subscriptionId }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');
  const resend = new Resend(apiKey);
  const [year, mm] = monthKey.split('-');
  const monthLabel = `${MONTH_LABELS[parseInt(mm, 10) - 1]} ${year}`;
  const html = renderTemplate(loadEmailTemplate(), {
    PDF_URL: pdfUrl,
    MONTH_LABEL: monthLabel,
    SUBSCRIPTION_ID: subscriptionId ?? 'n/a',
  });
  const from = process.env.RESEND_FROM || 'Metadash <onboarding@resend.dev>';
  const subject = `Your Metadash report - ${monthLabel}`;
  const { data, error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
  return data;
}

// ---------------------------------------------------------------------------
// Body parsing (Vercel may or may not pre-parse depending on runtime config)
// ---------------------------------------------------------------------------
async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch { /* fallthrough */ }
  }
  return await new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
module.exports = async function handler(req, res) {
  // Always log incoming request shape
  log('Incoming', req.method, 'url=', req.url);

  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.status(200).json({ ok: true, service: 'mp-webhook' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    logError('Body parse error:', err);
    return res.status(400).json({ error: 'invalid_json' });
  }

  log('Headers x-signature=', req.headers['x-signature'], 'x-request-id=', req.headers['x-request-id']);
  log('Body=', JSON.stringify(body));

  // MP sends id either in query (?data.id=...) or in body.data.id
  const dataId =
    body?.data?.id ??
    (req.query && (req.query['data.id'] || req.query.id)) ??
    null;
  const topic = body?.type ?? body?.topic ?? (req.query && req.query.type) ?? null;
  const requestId = req.headers['x-request-id'] || '';

  // 1) Validate signature
  const sigOk = verifyMpSignature({
    signatureHeader: req.headers['x-signature'],
    requestId,
    dataId,
    secret: process.env.MP_WEBHOOK_SECRET,
  });
  if (!sigOk) {
    logError('Invalid MP signature. Rejecting.');
    return res.status(401).json({ error: 'invalid_signature' });
  }
  log('Signature OK. topic=', topic, 'dataId=', dataId);

  // Quick-ack: respond 200 immediately, then continue work.
  // Vercel will keep the function alive while there are unresolved promises
  // initiated before res.end as long as we await them; here we want to ack
  // FAST and continue. We'll do the work inline but return early on errors
  // that aren't actionable so MP doesn't retry forever.
  res.status(200).json({ received: true });

  // 2) Only act on payment notifications (subscriptions also trigger 'payment')
  if (topic && !String(topic).includes('payment')) {
    log('Ignoring non-payment topic:', topic);
    return;
  }
  if (!dataId) {
    logError('No data.id in notification; nothing to do.');
    return;
  }

  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

    // 3) Fetch payment details
    const payment = await fetchPayment(dataId, accessToken);
    log('Payment status=', payment.status, 'email=', payment.payerEmail, 'sub=', payment.subscriptionId);

    if (payment.status !== 'approved' && payment.status !== 'authorized') {
      log('Payment not approved/authorized; skipping email.');
      return;
    }
    if (!payment.payerEmail) {
      logError('No payer email on payment; cannot send.');
      return;
    }

    // 4) Resolve this month's PDF
    const monthKey = currentMonthKey();
    const pdfUrl = MONTHLY_PDFS[monthKey];
    if (!pdfUrl) {
      logError(`No PDF mapped for ${monthKey}. Update MONTHLY_PDFS in mp-webhook.js.`);
      return;
    }

    // 5) Send email
    const result = await sendEmail({
      to: payment.payerEmail,
      pdfUrl,
      monthKey,
      subscriptionId: payment.subscriptionId,
    });
    log('Resend send OK id=', result?.id);
  } catch (err) {
    logError('Processing error:', err && err.stack ? err.stack : err);
  }
};
