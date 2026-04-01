# Guía de Integración de Pagos - MetaDash

Esta guía describe la integración de pagos en MetaDash usando MercadoPago y Stripe.

## Estructura de Archivos Creados

### Backend

#### 1. `backend/payments.py`
Módulo principal de integración con MercadoPago.

**Funciones principales:**
- `create_checkout()` - Crea una preferencia de pago en MercadoPago
- `handle_webhook()` - Procesa notificaciones de webhooks de MercadoPago
- `check_subscription_status()` - Verifica el estado de la suscripción del usuario
- `cancel_subscription()` - Cancela la suscripción de un usuario
- `get_available_plans()` - Retorna los planes disponibles

**Planes definidos:**
- Trial (Gratis, 14 días)
- Starter ($29/mes, 5 agentes de IA)
- Pro ($79/mes, agentes ilimitados)
- Enterprise ($199/mes, todas las características)

#### 2. `backend/stripe_payments.py`
Módulo de integración con Stripe como alternativa de pagos.

**Funciones principales:**
- `create_checkout_session()` - Crea una sesión de checkout en Stripe
- `handle_webhook()` - Procesa eventos de webhooks de Stripe
- `get_customer_portal_url()` - Obtiene URL del portal de cliente de Stripe
- `check_subscription_status()` - Verifica el estado de la suscripción
- `cancel_subscription()` - Cancela la suscripción

#### 3. `backend/payment_routes.py`
Rutas FastAPI para los endpoints de pago.

**Endpoints:**
```
POST /payments/create-checkout
  - Crear checkout de MercadoPago
  - Parámetros: plan, user_id

POST /payments/webhook
  - Webhook de MercadoPago

POST /payments/stripe/create-checkout
  - Crear sesión de checkout de Stripe
  - Parámetros: plan, user_id

POST /payments/stripe/webhook
  - Webhook de Stripe

GET /payments/plans
  - Listar todos los planes disponibles

GET /payments/status/{user_id}
  - Obtener estado de suscripción de usuario

POST /payments/cancel/{user_id}
  - Cancelar suscripción

GET /payments/stripe/portal/{user_id}
  - Obtener URL del portal de cliente de Stripe
```

### Frontend

#### 1. `frontend/src/pages/pricing.jsx`
Página de precios con planes de suscripción.

**Características:**
- Muestra los 4 planes disponibles (Trial, Starter, Pro, Enterprise)
- Selector de método de pago (MercadoPago o Stripe)
- Botones para contratar planes
- Sección de preguntas frecuentes
- Tema oscuro (bg-gray-900)

#### 2. `frontend/src/pages/payment/success.jsx`
Página de éxito de pago.

**Muestra:**
- Confirmación de pago exitoso
- Detalles de la suscripción contratada
- Próximos pasos
- Botones para ir al dashboard o ver otros planes

#### 3. `frontend/src/pages/payment/cancel.jsx`
Página de cancelación de pago.

**Muestra:**
- Confirmación de cancelación
- Razones comunes de cancelación
- Información sobre no haber sido cobrado
- Opciones para reintentar o contactar soporte

## Configuración

### 1. Instalar dependencias

```bash
cd backend
pip install -r requirements.txt
```

Las siguientes librerías han sido añadidas:
- `mercadopago==2.3.0`
- `stripe==10.0.0`

### 2. Variables de entorno

Crear archivo `.env` en la raíz del proyecto (copiar de `.env.example`):

```env
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TU_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_TOKEN=TU_WEBHOOK_TOKEN

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Otros
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:3000
JWT_SECRET=tu-clave-secreta
```

### 3. Configurar MercadoPago

1. Crear cuenta en [mercadopago.com](https://www.mercadopago.com)
2. Ir a Cuenta > Configuración > Credenciales
3. Copiar el Access Token
4. Configurar Webhook:
   - URL: `https://tu-dominio.com/payments/webhook`
   - Seleccionar eventos: payment.created, payment.updated

### 4. Configurar Stripe

1. Crear cuenta en [stripe.com](https://www.stripe.com)
2. Ir a Dashboard > API Keys
3. Copiar Secret Key y Publishable Key
4. Crear productos y precios:
   - Starter: $29/mes
   - Pro: $79/mes
   - Enterprise: $199/mes
5. Configurar Webhook:
   - URL: `https://tu-dominio.com/payments/stripe/webhook`
   - Seleccionar eventos: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted

## Integración en main.py

Añadir las siguientes líneas a `backend/main.py`:

```python
from payment_routes import router as payment_router

# Incluir router de pagos
app.include_router(payment_router)
```

## Flujo de pago

### MercadoPago

1. Usuario elige plan en `/pricing`
2. Selecciona MercadoPago como método de pago
3. Se crea preferencia de pago con `create_checkout()`
4. Usuario es redirigido a MercadoPago
5. Después de pagar, MercadoPago envía webhook
6. `handle_webhook()` procesa la notificación
7. Suscripción se actualiza en la BD
8. Usuario es redirigido a `/payment/success`

### Stripe

1. Usuario elige plan en `/pricing`
2. Selecciona Stripe como método de pago
3. Se crea sesión de checkout con `create_checkout_session()`
4. Usuario es redirigido a Stripe Checkout
5. Después de pagar, Stripe envía evento a webhook
6. `handle_webhook()` procesa el evento
7. Suscripción se actualiza en la BD
8. Usuario es redirigido a `/payment/success`

## Modelo de datos

### Tabla: subscriptions

```python
class Subscription(Base):
    __tablename__ = "subscriptions"

    id: int (Primary Key)
    user_id: int (Foreign Key -> users)
    plan: str ("trial", "starter", "pro", "enterprise")
    status: str ("active", "expired", "cancelled")
    trial_start: datetime (cuando inició la prueba)
    trial_end: datetime (cuando vence la suscripción)
    created_at: datetime
    updated_at: datetime
```

## Pruebas locales

### Usar modo sandbox de MercadoPago

En desarrollo, MercadoPago automáticamente usa modo sandbox si usas un Access Token de sandbox.

Tarjetas de prueba:
- Visa: 4111 1111 1111 1111
- Mastercard: 5555 5555 5555 4444

### Usar modo test de Stripe

Usar claves de test (comienzan con `pk_test_` y `sk_test_`).

Tarjetas de prueba:
- Visa: 4242 4242 4242 4242
- Mastercard: 5555 5555 5555 4444
- Amex: 3782 822463 10005

## Seguridad

1. **Tokens**: No expongas tokens en el frontend
2. **Webhooks**: Verifica la firma del webhook
3. **HTTPS**: Usa HTTPS en producción
4. **Variables de entorno**: No subas `.env` a Git
5. **CORS**: Configura CORS correctamente
6. **Validación**: Valida todos los datos del usuario

## Testing

Para probar los endpoints:

```bash
# Crear checkout de MercadoPago
curl -X POST http://localhost:8000/payments/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"plan": "starter", "user_id": 1}'

# Crear checkout de Stripe
curl -X POST http://localhost:8000/payments/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro", "user_id": 1}'

# Obtener planes
curl http://localhost:8000/payments/plans

# Obtener estado de suscripción
curl http://localhost:8000/payments/status/1
```

## Despliegue en Vercel

El archivo `vercel.json` actualizado incluye:
- Rutas para `/payments/*` dirigidas al backend
- Variables de entorno configuradas
- Soporte para Python en el backend

Paso a paso:
1. Configurar variables de entorno en Vercel
2. Push del código a GitHub
3. Conectar repositorio en Vercel
4. Despliegue automático

## Troubleshooting

### "MercadoPago token inválido"
- Verificar que `MERCADOPAGO_ACCESS_TOKEN` esté correcto
- En desarrollo, debe ser token de sandbox

### "Stripe webhook falla"
- Verificar que `STRIPE_WEBHOOK_SECRET` sea correcto
- Asegurar que la URL del webhook es accesible publicamente

### "El usuario no se redirige a success"
- Verificar que `FRONTEND_URL` sea correcta
- Revisar los logs del navegador

## Próximos pasos

1. Implementar renovación automática de suscripciones
2. Añadir system de facturas/recibos
3. Crear página de gestión de suscripciones
4. Implementar descuentos y códigos promocionales
5. Añadir soporte para múltiples monedas

## Soporte

Para problemas con la integración:
- MercadoPago: [docs.mercadopago.com](https://docs.mercadopago.com)
- Stripe: [stripe.com/docs](https://stripe.com/docs)
