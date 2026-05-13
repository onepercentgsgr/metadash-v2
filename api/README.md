# Metadash API (Vercel Serverless)

This directory contains Vercel serverless functions for Metadash. The main
endpoint is the Mercado Pago subscription webhook, which sends a monthly PDF
to subscribers via Resend after a payment is authorized.

## Files

- `mp-webhook.js` - POST handler for Mercado Pago notifications.
- `package.json` - declares the `resend` dependency (Node 18+ has native
  `fetch` and `crypto`).

## Environment variables

Set these in **Vercel Project Settings -> Environment Variables** (Production
and Preview):

| Name                | Required | Description                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| `MP_ACCESS_TOKEN`   | yes      | Mercado Pago access token (Bearer). Found in MP Developer panel.            |
| `MP_WEBHOOK_SECRET` | yes      | Webhook secret string configured in the MP webhook UI (used for signature). |
| `RESEND_API_KEY`    | yes      | Resend API key (`re_...`).                                                  |
| `RESEND_FROM`       | no       | From address. Defaults to `Metadash <onboarding@resend.dev>`.               |

After changing env vars, redeploy the project so the new values are picked up.

## Registering the webhook in Mercado Pago

1. Log in to <https://www.mercadopago.com.br/developers/panel>.
2. Open your application -> **Webhooks / Notifications**.
3. Add the production URL: `https://<your-vercel-domain>/api/mp-webhook`.
4. Select the events you care about - at minimum **Payments** (`payment`).
   Subscription (`preapproval`) payments also trigger a `payment` event when
   the recurring charge is captured.
5. Generate (or paste) a **Secret** and copy it into the Vercel env var
   `MP_WEBHOOK_SECRET`. The secret is what we HMAC the request manifest with
   to validate the `x-signature` header.
6. Save and use **Simulate** in the MP panel to send a test event.

### Signature validation

Mercado Pago signs a manifest of the form:

```
id:<data.id>;request-id:<x-request-id>;ts:<ts>;
```

with HMAC-SHA256 using your secret. The result is sent in the `x-signature`
header as `ts=...,v1=<hex>`. `mp-webhook.js` recomputes this and rejects with
`401` on mismatch.

## Monthly PDF map

`mp-webhook.js` contains a `MONTHLY_PDFS` object at the top of the file keyed
by `YYYY-MM`. Replace each placeholder URL (May 2026 - December 2026) with the
real signed PDF URL before going live. Add more months as needed; if the
current month is not in the map the function logs an error and does **not**
send an email.

## Testing locally

You need the Vercel CLI:

```bash
npm i -g vercel
cd /home/user/metadash-v3.5
vercel dev
```

This serves `api/mp-webhook.js` at `http://localhost:3000/api/mp-webhook`.

### Manual signature test

```bash
SECRET="your_mp_webhook_secret"
TS=$(date +%s)
DATA_ID="123456789"
REQ_ID="test-req-1"
MANIFEST="id:${DATA_ID};request-id:${REQ_ID};ts:${TS};"
SIG=$(printf "%s" "$MANIFEST" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $2}')

curl -i -X POST "http://localhost:3000/api/mp-webhook?data.id=${DATA_ID}&type=payment" \
  -H "Content-Type: application/json" \
  -H "x-request-id: ${REQ_ID}" \
  -H "x-signature: ts=${TS},v1=${SIG}" \
  -d "{\"type\":\"payment\",\"data\":{\"id\":\"${DATA_ID}\"}}"
```

You should get `200 {"received":true}`. The function will then call the MP
API with `MP_ACCESS_TOKEN` to load the payment - use a real payment ID from
your sandbox or expect a `MP payment fetch failed` log line.

### Inspecting logs

```bash
vercel logs <deployment-url> --follow
```

Every step (signature OK, payment status, Resend send id, errors) is prefixed
with `[mp-webhook]`.

## Behavior summary

1. Validate `x-signature` against `MP_WEBHOOK_SECRET`. Reject `401` if invalid.
2. Respond `200 {received:true}` immediately so MP doesn't retry.
3. Continue async: fetch payment from `GET /v1/payments/{id}` with the access
   token.
4. If `status` is `approved` or `authorized`, look up this month's PDF URL.
5. Send an HTML email via Resend using `../resend-email-template.html` if it
   exists, otherwise an inline fallback. Placeholders: `{{PDF_URL}}`,
   `{{MONTH_LABEL}}`, `{{SUBSCRIPTION_ID}}`.
6. Log Resend message id (or errors) for debugging.
