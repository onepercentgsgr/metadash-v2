# Checklist de Configuración de Pagos - MetaDash

Sigue esta lista para implementar completamente la integración de pagos en MetaDash.

## Fase 1: Instalación y Configuración Base

### Backend
- [ ] Instalar dependencias: `pip install -r requirements.txt`
  - [ ] Verificar que mercadopago==2.3.0 está instalado
  - [ ] Verificar que stripe==10.0.0 está instalado

- [ ] Crear archivo `.env` basado en `.env.example`
  - [ ] Llenar `DATABASE_URL` con tu base de datos PostgreSQL
  - [ ] Llenar `JWT_SECRET` con una clave aleatoria segura
  - [ ] Llenar `FRONTEND_URL` (ej: `http://localhost:3000` para desarrollo)

- [ ] Verificar estructura de archivos del backend
  - [ ] `/backend/payments.py` creado
  - [ ] `/backend/stripe_payments.py` creado
  - [ ] `/backend/payment_routes.py` creado
  - [ ] `/backend/requirements.txt` actualizado

### Frontend
- [ ] Verificar estructura de archivos del frontend
  - [ ] `/frontend/src/pages/pricing.jsx` creado
  - [ ] `/frontend/src/pages/payment/success.jsx` creado
  - [ ] `/frontend/src/pages/payment/cancel.jsx` creado

## Fase 2: Configuración de MercadoPago

### Crear cuenta
- [ ] Ir a [mercadopago.com](https://www.mercadopago.com)
- [ ] Crear o acceder a tu cuenta
- [ ] Verificar que tienes acceso a Merchant Tools

### Obtener credenciales
- [ ] Ir a Cuenta > Configuración > Credenciales
- [ ] Copiar Access Token (debe comenzar con `APP_`)
- [ ] Pegar en `.env` como `MERCADOPAGO_ACCESS_TOKEN`
- [ ] Generar Webhook Token
- [ ] Pegar en `.env` como `MERCADOPAGO_WEBHOOK_TOKEN`

### Configurar Webhook
- [ ] Ir a Integraciones > Webhooks
- [ ] Añadir nueva URL: `https://tu-dominio.com/payments/webhook`
- [ ] Para desarrollo local: usar ngrok
  - [ ] Instalar ngrok: `npm install -g ngrok`
  - [ ] Exponer puerto: `ngrok http 8000`
  - [ ] URL será: `https://xxxx-xxx-xxx-xxx.ngrok-free.app/payments/webhook`

- [ ] Seleccionar eventos:
  - [ ] `payment.created`
  - [ ] `payment.updated`
  - [ ] `charge.created` (opcional)

### Probar modo sandbox
- [ ] Usar tarjetas de prueba de MercadoPago:
  - [ ] Visa: 4111 1111 1111 1111
  - [ ] Mastercard: 5555 5555 5555 4444
  - [ ] DNI: 12345678
  - [ ] Nombre: cualquiera

## Fase 3: Configuración de Stripe

### Crear cuenta
- [ ] Ir a [stripe.com](https://www.stripe.com)
- [ ] Crear o acceder a tu cuenta
- [ ] Pasar verificación (modo restringido/test)

### Obtener credenciales
- [ ] Ir a Dashboard > API Keys
- [ ] Copiar Secret Key (comienza con `sk_test_`)
- [ ] Pegar en `.env` como `STRIPE_SECRET_KEY`
- [ ] Copiar Publishable Key (comienza con `pk_test_`)
- [ ] Pegar en `.env` como `STRIPE_PUBLISHABLE_KEY`

### Crear productos y precios
- [ ] Ir a Products
- [ ] Crear producto "MetaDash Starter"
  - [ ] Nombre: "Plan Iniciador"
  - [ ] Descripción: "5 agentes de IA, análisis básico, soporte por email"
  - [ ] Precio: $29 USD / mes
  - [ ] Copiar Price ID (comienza con `price_`)
  - [ ] Pegar en `.env` como `STRIPE_STARTER_PRICE_ID`

- [ ] Crear producto "MetaDash Pro"
  - [ ] Nombre: "Plan Profesional"
  - [ ] Descripción: "Agentes ilimitados, análisis avanzado, webhooks, soporte prioritario"
  - [ ] Precio: $79 USD / mes
  - [ ] Copiar Price ID
  - [ ] Pegar en `.env` como `STRIPE_PRO_PRICE_ID`

- [ ] Crear producto "MetaDash Enterprise"
  - [ ] Nombre: "Plan Empresarial"
  - [ ] Descripción: "Todo incluido, API dedicada, SLA garantizado, gestor de cuenta"
  - [ ] Precio: $199 USD / mes
  - [ ] Copiar Price ID
  - [ ] Pegar en `.env` como `STRIPE_ENTERPRISE_PRICE_ID`

### Configurar Webhook
- [ ] Ir a Developers > Webhooks
- [ ] Añadir endpoint: `https://tu-dominio.com/payments/stripe/webhook`
- [ ] Para desarrollo local: usar Stripe CLI
  - [ ] Descargar Stripe CLI: [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
  - [ ] Ejecutar: `stripe listen --forward-to localhost:8000/payments/stripe/webhook`
  - [ ] Copiar webhook signing secret
  - [ ] Pegar en `.env` como `STRIPE_WEBHOOK_SECRET`

- [ ] Seleccionar eventos:
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `payment_intent.succeeded`

### Probar modo test
- [ ] Usar tarjetas de prueba de Stripe:
  - [ ] Visa: 4242 4242 4242 4242
  - [ ] Mastercard: 5555 5555 5555 4444
  - [ ] American Express: 3782 822463 10005
  - [ ] Vencimiento: cualquier fecha futura
  - [ ] CVC: cualquier número de 3 dígitos

## Fase 4: Integración en Backend

### Actualizar main.py
- [ ] Abrir `/backend/main.py`
- [ ] Añadir import: `from payment_routes import router as payment_router`
- [ ] Añadir después de crear la app: `app.include_router(payment_router)`
- [ ] Verificar que no hay conflictos de rutas

### Verificar modelos de base de datos
- [ ] Verificar que tabla `subscriptions` existe en modelos
- [ ] Campos requeridos:
  - [ ] `id` (Primary Key)
  - [ ] `user_id` (Foreign Key)
  - [ ] `plan` (string)
  - [ ] `status` (string)
  - [ ] `trial_start` (datetime)
  - [ ] `trial_end` (datetime)
  - [ ] `created_at` (datetime)
  - [ ] `updated_at` (datetime)

### Migrar base de datos
- [ ] Ejecutar migraciones de Alembic (si usas)
- [ ] O crear tabla manualmente ejecutando:
  ```sql
  CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    plan VARCHAR(50) DEFAULT 'trial',
    status VARCHAR(50) DEFAULT 'active',
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```

## Fase 5: Integración en Frontend

### Actualizar rutas de Next.js
- [ ] Verificar que `/frontend/src/pages/pricing.jsx` existe
- [ ] Verificar que `/frontend/src/pages/payment/success.jsx` existe
- [ ] Verificar que `/frontend/src/pages/payment/cancel.jsx` existe

### Conectar frontend con backend
- [ ] En `pricing.jsx`, verificar URL de API:
  - [ ] Cambiar `/api/payments/plans` si tu backend está en otro puerto
  - [ ] Actualizar según tu deploy (Vercel, Railway, etc.)

- [ ] En `success.jsx` y `cancel.jsx`, verificar redirecciones:
  - [ ] `/dashboard` debe existir
  - [ ] `/pricing` debe existir

### Añadir navegación
- [ ] Añadir link a `/pricing` en el menú principal
- [ ] Verificar que usuarios no autenticados pueden ver pricing
- [ ] Verificar que usuarios autenticados pueden hacer checkout

## Fase 6: Pruebas Locales

### Backend
- [ ] Instalar dependencias: `pip install -r requirements.txt`
- [ ] Ejecutar backend: `python -m uvicorn main:app --reload`
- [ ] Verificar en http://localhost:8000/docs
- [ ] Verificar endpoint `/payments/plans`:
  ```bash
  curl http://localhost:8000/payments/plans
  ```

### Frontend
- [ ] Instalar dependencias: `npm install`
- [ ] Ejecutar frontend: `npm run dev`
- [ ] Verificar en http://localhost:3000/pricing
- [ ] Prueba cada botón de "Elegir Plan"

### Flujo de pago MercadoPago
- [ ] En pricing, seleccionar MercadoPago
- [ ] Elegir un plan (preferiblemente Trial o Starter)
- [ ] Click en "Elegir Plan"
- [ ] Ser redirigido a MercadoPago
- [ ] Usar tarjeta de prueba
- [ ] Completar pago
- [ ] Ser redirigido a `/payment/success`
- [ ] Verificar que suscripción se creó en la BD

### Flujo de pago Stripe
- [ ] En pricing, seleccionar Stripe
- [ ] Elegir un plan
- [ ] Click en "Elegir Plan"
- [ ] Ser redirigido a Stripe Checkout
- [ ] Usar tarjeta de prueba
- [ ] Completar pago
- [ ] Ser redirigido a `/payment/success`
- [ ] Verificar que suscripción se creó en la BD

### Webhooks
- [ ] Para MercadoPago:
  - [ ] Usar ngrok: `ngrok http 8000`
  - [ ] Copiar URL ngrok
  - [ ] Actualizar webhook en MercadoPago con URL ngrok

- [ ] Para Stripe:
  - [ ] Usar Stripe CLI: `stripe listen --forward-to localhost:8000/payments/stripe/webhook`
  - [ ] CLI mostrará eventos en tiempo real

## Fase 7: Despliegue en Producción

### Variables de entorno en Vercel
- [ ] Ir a Vercel > Settings > Environment Variables
- [ ] Añadir todas las variables de `.env.example`:
  - [ ] `DATABASE_URL`
  - [ ] `MERCADOPAGO_ACCESS_TOKEN` (cambiar a production token)
  - [ ] `MERCADOPAGO_WEBHOOK_TOKEN`
  - [ ] `STRIPE_SECRET_KEY` (cambiar a live key)
  - [ ] `STRIPE_PUBLISHABLE_KEY` (cambiar a live key)
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] Todos los `STRIPE_*_PRICE_ID`
  - [ ] `FRONTEND_URL` = tu dominio de producción

### Actualizar webhooks en producción
- [ ] MercadoPago:
  - [ ] URL del webhook: `https://tu-dominio.com/payments/webhook`
  - [ ] Cambiar a modo Production

- [ ] Stripe:
  - [ ] URL del webhook: `https://tu-dominio.com/payments/stripe/webhook`
  - [ ] Cambiar a claves Live (comenzarán con `sk_live_` y `pk_live_`)

### Actualizar vercel.json
- [ ] Verificar que routes están configurados correctamente
- [ ] `/payments/*` debe apuntar al backend
- [ ] `/api/*` debe apuntar al backend

### Hacer deploy
- [ ] Push a GitHub: `git push origin main`
- [ ] Vercel debería desplegar automáticamente
- [ ] Verificar en Dashboard > Deployments
- [ ] Verificar que API está disponible en: `https://tu-dominio.com/payments/plans`

## Fase 8: Monitoreo y Mantenimiento

### Monitoreo
- [ ] Verificar logs en Vercel
- [ ] Revisar webhooks exitosos en MercadoPago
- [ ] Revisar eventos en Stripe Dashboard
- [ ] Configurar alertas en Stripe para pagos fallidos

### Base de datos
- [ ] Realizar backup regular de PostgreSQL
- [ ] Monitorear uso de espacio en BD
- [ ] Limpiar logs antiguos si es necesario

### Seguridad
- [ ] Cambiar tokens regularmente (mensual)
- [ ] Verificar que no hay tokens en logs
- [ ] Auditar acceso a webhooks
- [ ] Verificar HTTPS en todas las URLs

## Fase 9: Características Adicionales (Futuro)

- [ ] Implementar renovación automática de suscripciones
- [ ] Crear página de gestión de suscripciones
- [ ] Implementar códigos promocionales y descuentos
- [ ] Añadir soporte para múltiples monedas
- [ ] Crear sistema de facturas/recibos
- [ ] Implementar cancelación automática después de X días impagos

---

## Notas Importantes

1. **Desarrollo vs Producción**: Asegúrate de usar tokens de sandbox/test en desarrollo
2. **HTTPS**: Los webhooks requieren HTTPS en producción
3. **Documentación**: Lee la documentación oficial de MercadoPago y Stripe
4. **Soporte**: Contacca al equipo de soporte si tienes problemas
5. **Testing**: Siempre prueba con datos reales antes de lanzar

## Contacto y Soporte

- Email de soporte: support@metadash.com
- Documentación: Ver `PAYMENT_INTEGRATION_GUIDE.md`
- Issues: GitHub Issues del proyecto
