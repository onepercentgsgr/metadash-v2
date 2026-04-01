# Inicio Rápido - Integración de Pagos

## 5 Pasos Rápidos para Empezar

### 1. Instalar Dependencias (2 minutos)

```bash
cd backend
pip install -r requirements.txt
```

Verifica que se instalaron:
```bash
pip show mercadopago stripe
```

### 2. Configurar Variables de Entorno (5 minutos)

```bash
# Copiar template
cp .env.example .env

# Editar .env con tus valores
nano .env
```

Variables **mínimas** requeridas:
```env
DATABASE_URL=tu_db_url
FRONTEND_URL=http://localhost:3000
MERCADOPAGO_ACCESS_TOKEN=APP_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### 3. Integrar en main.py (1 minuto)

En `backend/main.py`, después de los imports:

```python
from payment_routes import router as payment_router

# Después de crear app = FastAPI(...)
app.include_router(payment_router)
```

### 4. Iniciar el Backend (1 minuto)

```bash
python -m uvicorn main:app --reload
```

Verifica en: http://localhost:8000/docs

Deberías ver `/payments/*` endpoints en Swagger.

### 5. Abrir Pricing en Frontend (1 minuto)

```bash
cd frontend
npm run dev
```

Abre: http://localhost:3000/pricing

¡Listo! Ahora puedes probar pagos.

---

## Testing Rápido

### MercadoPago
1. En `/pricing`, selecciona MercadoPago
2. Elige cualquier plan
3. Tarjeta test: `4111 1111 1111 1111`
4. Vencimiento: cualquier fecha futura
5. Deberías ver `/payment/success`

### Stripe
1. En `/pricing`, selecciona Stripe
2. Elige cualquier plan
3. Tarjeta test: `4242 4242 4242 4242`
4. Deberías ver `/payment/success`

---

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `backend/payments.py` | Lógica de MercadoPago |
| `backend/stripe_payments.py` | Lógica de Stripe |
| `backend/payment_routes.py` | Endpoints FastAPI |
| `frontend/src/pages/pricing.jsx` | Página de precios |
| `PAYMENT_SETUP_CHECKLIST.md` | Guía completa |

---

## Comandos Útiles

```bash
# Ver endpoints de pago
curl http://localhost:8000/payments/plans

# Ver estado de suscripción
curl http://localhost:8000/payments/status/1

# Ver documentación interactiva
# http://localhost:8000/docs
```

---

## Siguientes Pasos

1. ✅ Instalar dependencias
2. ✅ Configurar `.env`
3. ✅ Integrar payment_routes en main.py
4. ✅ Probar localmente
5. 🔄 Obtener credenciales reales de MercadoPago y Stripe
6. 🔄 Configurar webhooks
7. 🔄 Desplegar en Vercel

---

## Errores Comunes

| Error | Solución |
|-------|----------|
| `ImportError: No module named 'mercadopago'` | Ejecuta `pip install -r requirements.txt` |
| `401 Unauthorized` | Verifica `MERCADOPAGO_ACCESS_TOKEN` en `.env` |
| `/payments endpoints no aparecen en Swagger` | Verifica que `app.include_router()` está en main.py |
| `Error al crear checkout` | Verifica `FRONTEND_URL` en `.env` |
| `Webhook no recibe eventos` | Usa ngrok o Stripe CLI para tunnel local |

---

## Obtener Credenciales

### MercadoPago (5 minutos)
1. Ir a: https://www.mercadopago.com
2. Cuenta > Configuración > Credenciales
3. Copiar Access Token (APP_xxxxx)
4. Pegar en `.env` como `MERCADOPAGO_ACCESS_TOKEN`

### Stripe (5 minutos)
1. Ir a: https://dashboard.stripe.com
2. API Keys
3. Copiar Secret Key (sk_test_xxxxx)
4. Pegar en `.env` como `STRIPE_SECRET_KEY`

---

## Preguntas Frecuentes

**¿Necesito ambos proveedores?**
No, puedes usar solo MercadoPago o solo Stripe. El código soporta ambos.

**¿Puedo cambiar los precios?**
Sí, edita los diccionarios `PLANS` en `payments.py` y `STRIPE_PLANS` en `stripe_payments.py`.

**¿Cómo testo sin tarjeta real?**
Usa las tarjetas de prueba de cada proveedor (incluidas arriba).

**¿Los webhooks funcionan en localhost?**
No directamente. Usa:
- MercadoPago: ngrok
- Stripe: Stripe CLI

**¿Qué pasa en modo Trial?**
No se cobra nada, simplemente se crea una suscripción válida por 14 días.

---

## Documentación Completa

Para más detalles, ver:
- `PAYMENT_INTEGRATION_GUIDE.md` - Guía completa
- `PAYMENT_SETUP_CHECKLIST.md` - Checklist detallado
- `PAYMENT_IMPLEMENTATION_SUMMARY.md` - Resumen técnico

---

## Soporte

- Email: support@metadash.com
- Docs: Ver carpeta `/docs` o `PAYMENT_*.md`
- Issues: GitHub Issues
