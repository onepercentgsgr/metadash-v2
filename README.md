# 🚀 MetaDash SaaS

**Una plataforma completa SaaS para gestionar campañas de Marketing con IA integrada, múltiples agentes especializados y integración de pagos.**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.10+-blue)
![Node.js](https://img.shields.io/badge/node-18+-green)

---

## 📋 Características

### 🔐 Autenticación & Usuarios
- Registro e login con JWT
- Gestión de perfiles
- Sistema de roles (admin/client)
- Trials gratis de 14 días

### 🤖 Agentes IA Especializados (6 agentes)
- **Advisor**: Asesoramiento estratégico
- **Optimizer**: Optimización de campañas
- **Creative Director**: Generación de contenido creativo
- **Script Generator**: Scripts para Meta Ads
- **Finance Agent**: Análisis financiero
- **Landing Auditor**: Auditoría de landing pages

### 💰 Pagos Integrados
- **MercadoPago**: Pagos locales con webhook
- **Stripe**: Pagos internacionales
- Planes: Trial (gratis), Starter ($29/mes), Pro ($79/mes), Enterprise ($199/mes)
- Portal de cliente para gestionar suscripción

### 📊 Dashboard Admin
- Ver todos los usuarios y sus suscripciones
- Cambiar roles y estado de usuarios
- Extender períodos de trial
- Gestionar planes de suscripción
- Ver estadísticas y KPIs

### ⚙️ Configuración de Tenant
- Integración con Meta Ads API
- API keys de Anthropic
- HuggingFace tokens
- Shopify Store integration
- MercadoPago credentials

### 📈 Registros Financieros
- Tabla de ingresos/costos
- Upload de Excel
- Análisis de rentabilidad

---

## 🏗️ Arquitectura

### Backend (FastAPI + Python)
```
backend/
├── main.py                 # FastAPI app con todos los endpoints
├── models.py              # SQLAlchemy models (User, Subscription, etc.)
├── database.py            # Conexión PostgreSQL/SQLite
├── config.py              # Variables de configuración
├── payments.py            # MercadoPago integration
├── stripe_payments.py     # Stripe integration
├── payment_routes.py      # Endpoints de pagos
├── meta_api.py            # Meta Ads API wrapper
├── agents/                # 6 agentes IA + orchestrator
│   ├── advisor.py
│   ├── optimizer.py
│   ├── creative_director.py
│   ├── script_gen.py
│   ├── finance.py
│   ├── landing_auditor.py
│   └── orchestrator.py
├── requirements.txt
└── Dockerfile
```

### Frontend (Next.js + React)
```
frontend/
├── src/pages/
│   ├── _app.jsx           # App wrapper con auth
│   ├── index.jsx          # Dashboard principal
│   ├── login.jsx          # Login
│   ├── register.jsx       # Registro
│   ├── settings.jsx       # Config de tenant
│   ├── agents.jsx         # Panel de agentes IA
│   ├── financials.jsx     # Registros financieros
│   ├── pricing.jsx        # Planes de precio
│   ├── admin/
│   │   ├── index.jsx      # Gestión de usuarios
│   │   └── subscriptions.jsx
│   └── payment/
│       ├── success.jsx
│       └── cancel.jsx
├── src/components/
│   ├── Layout.jsx
│   ├── ProtectedRoute.jsx
│   └── ...
├── src/context/
│   └── AuthContext.jsx
├── src/lib/
│   └── api.js            # Cliente HTTP con JWT
├── package.json
└── next.config.js
```

### Deploy
```
deploy/
├── docker-compose.yml     # PostgreSQL + Backend
└── Dockerfile            # Backend container
```

---

## 🚀 Quick Start

### Requisitos
- Python 3.10+
- Node.js 18+
- PostgreSQL 12+ (o SQLite para desarrollo)
- Git

### 1. Clonar repositorio
```bash
git clone https://github.com/onepercentsgr/metadash.git
cd metadash
```

### 2. Backend Setup

```bash
cd backend

# Crear venv
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Crear .env
cp .env.example .env
# Editar .env con tus credenciales

# Correr migraciones (si usas Alembic)
# alembic upgrade head

# Iniciar servidor
uvicorn main:app --reload
# El backend estará en http://localhost:8000
```

### 3. Frontend Setup

```bash
cd frontend

# Instalar dependencias
npm install

# Crear .env.local
cp .env.local.example .env.local
# Editar con NEXT_PUBLIC_API_URL=http://localhost:8000

# Iniciar dev server
npm run dev
# El frontend estará en http://localhost:3000
```

### 4. Acceder
- Frontend: http://localhost:3000
- Backend Docs: http://localhost:8000/docs

---

## 🔑 Variables de Entorno

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost/metadash
# O SQLite para dev: sqlite:///./metadash.db

# JWT
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256

# APIs
ANTHROPIC_API_KEY=sk-ant-...
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
MERCADOPAGO_ACCESS_TOKEN=your-mp-token

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
NEXT_PUBLIC_MP_PUBLIC_KEY=your-mp-public-key
```

---

## 📚 API Endpoints (Principales)

### Autenticación
- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Login
- `GET /auth/me` - Usuario actual

### Tenant Config
- `GET /tenant-config` - Get config
- `PUT /tenant-config` - Update config

### Agentes IA
- `POST /agent/run` - Ejecutar agente (advisor, optimizer, etc.)
- `GET /agent/logs` - Ver logs

### Financias
- `GET /financials` - Listar registros
- `POST /financials` - Crear registro
- `POST /financials/upload` - Upload Excel

### Pagos
- `GET /payments/plans` - Listar planes
- `POST /payments/create-checkout` - Crear checkout MercadoPago
- `POST /payments/stripe/create-checkout` - Crear checkout Stripe
- `POST /payments/webhook` - Webhook MercadoPago
- `POST /payments/stripe/webhook` - Webhook Stripe

### Admin (requiere role='admin')
- `GET /admin/users` - Listar usuarios
- `PUT /admin/users/{id}` - Actualizar usuario
- `GET /admin/subscriptions` - Listar suscripciones
- `PUT /admin/subscriptions/{id}` - Actualizar suscripción
- `POST /admin/users/{id}/extend-trial` - Extender trial

Ver documentación completa en `/docs` cuando el backend esté corriendo.

---

## 💳 Integración de Pagos

### MercadoPago
1. Ir a [MercadoPago](https://www.mercadopago.com.ar/developers)
2. Crear aplicación y obtener credentials
3. Configurar webhook en `https://tu-domain.com/payments/webhook`
4. Agregar a `.env`: `MERCADOPAGO_ACCESS_TOKEN`

### Stripe
1. Ir a [Stripe](https://stripe.com/)
2. Obtener API keys
3. Configurar webhooks para `payment_intent.succeeded` y `customer.subscription.deleted`
4. Apuntar a `https://tu-domain.com/payments/stripe/webhook`
5. Agregar a `.env`: `STRIPE_SECRET_KEY` y `STRIPE_PUBLISHABLE_KEY`

---

## 🐳 Docker Deploy

```bash
cd deploy

# Con docker-compose (requiere PostgreSQL)
docker-compose up -d

# Backend estará en http://localhost:8000
# Database en localhost:5432
```

---

## 📦 Deploy a Producción

### Vercel (Frontend)
```bash
cd frontend
npm run build
# Conectar repo a Vercel y hacer push
git push origin main
```

### Railway/Heroku (Backend)
```bash
# Railway
npx railway link
npx railway up

# O Heroku
heroku create metadash-api
git push heroku main
```

---

## 🧪 Testing

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

---

## 📝 Estructura de Datos

### Users
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "client",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Subscription
```json
{
  "id": 1,
  "user_id": 1,
  "plan": "starter",
  "status": "active",
  "trial_end": "2024-02-14T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Plans
| Plan | Precio | Trial | Features |
|------|--------|-------|----------|
| Trial | Gratis | 14 días | 3 agentes |
| Starter | $29/mes | No | 6 agentes, 100 execuciones |
| Pro | $79/mes | No | Unlimited, prioridad |
| Enterprise | $199/mes | No | Unlimited, soporte prioritario |

---

## 🔒 Seguridad

- ✅ JWT para autenticación
- ✅ Contraseñas hasheadas con bcrypt
- ✅ CORS configurado
- ✅ Validación de entrada (Pydantic)
- ✅ Rate limiting recomendado en producción
- ✅ HTTPS en producción

---

## 📞 Soporte

Para problemas o sugerencias:
1. Abre un Issue en GitHub
2. Revisa la documentación en `/docs`
3. Contacta al equipo

---

## 📄 Licencia

MIT License - Ver LICENSE.md

---

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI model fine-tuning
- [ ] Marketplace de agentes
- [ ] Webhooks custom
- [ ] API v2 con GraphQL

---

**Hecho con ❤️ por Sky Team**
