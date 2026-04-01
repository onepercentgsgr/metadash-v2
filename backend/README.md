# MetaDash SaaS Backend

A complete FastAPI backend for a multi-tenant SaaS dashboard for Meta Ads with 6 AI agents.

## Architecture Overview

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL via SQLAlchemy (Supabase compatible, SQLite fallback)
- **Authentication**: JWT tokens
- **Multi-tenancy**: Each user has isolated configuration and data
- **Subscription System**: Trial (7 days free), Starter ($29), Pro ($99), Enterprise ($299)

## Key Features

### Authentication
- User registration with automatic 7-day trial
- JWT-based login
- Token-based API access
- Admin user creation on startup

### Multi-Tenant Configuration
Each tenant can configure:
- Meta Ads API credentials (access token, ad account ID, app ID, secret)
- Anthropic API key (for AI agents)
- Hugging Face API key
- Business info (negocio_info)
- Landing page URL
- Shopify integration (store URL, webhook secret)
- Mercado Pago integration

### Subscription Management
- Trial: 7 days from registration
- Paid plans: Starter, Pro, Enterprise
- Admin endpoints to extend trials, change plans, view revenue

### AI Agents (6 integrated)
1. **Campaign Optimizer** - `/agent/optimize`
2. **Finance Analyst** - `/agent/finance`
3. **Script Generator** - `/agent/scripts`
4. **Creative Director** - `/agent/creatives`
5. **Growth Advisor** - `/agent/growth`
6. **CRO Advisor** - `/agent/cro`
7. **Landing Page Auditor** - `/agent/landing-audit`
8. **Orchestrator** - `/agent/full-audit` (runs all agents coordinated)

All agent endpoints:
- Require active subscription
- Use tenant's Anthropic API key
- Log results to database
- Accept custom prompt/context

### Additional Features
- Campaign management (Meta API integration)
- Financial record management (Excel upload)
- Shopify order tracking
- Admin dashboard with user/revenue stats
- CORS support for Vercel preview URLs

## Installation

```bash
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file (see `.env.example`):

```
DATABASE_URL=postgresql://user:pass@localhost:5432/metadash
SECRET_KEY=your-secret-key-here
ADMIN_EMAIL=admin@metadash.com
ADMIN_PASSWORD=your-admin-password
FRONTEND_URL=https://metadash.vercel.app
```

For local development with SQLite:
```
DATABASE_URL=sqlite:///./metadash.db
```

## Running

```bash
uvicorn main:app --reload
```

API available at: http://localhost:8000
Docs available at: http://localhost:8000/docs

## Docker

```bash
docker build -t metadash-backend .
docker run -e DATABASE_URL=postgresql://... -p 8000:8000 metadash-backend
```

## Database Models

### User
- id, email, hashed_password, name, role (admin/client), is_active, created_at

### TenantConfig
- User's API keys and configuration (per-user isolation)

### Subscription
- Track user's plan, status, trial dates

### AgentLog
- Log all agent executions and results

### FinancialRecord
- Store uploaded financial data

### ShopifyOrder
- Track Shopify orders for users

## API Endpoints

### Auth
- `POST /auth/register` - Create account + 7-day trial
- `POST /auth/login` - Login and get JWT
- `GET /auth/me` - Current user info

### Configuration
- `GET /config` - Get tenant configuration (masked)
- `POST /config` - Update configuration

### Admin
- `GET /admin/users` - List all users with subscription status
- `POST /admin/users/{id}/toggle` - Activate/deactivate user
- `POST /admin/users/{id}/extend-trial` - Extend trial by N days
- `POST /admin/users/{id}/set-plan` - Change user's plan
- `GET /admin/stats` - User count, active trials, revenue

### Campaigns
- `GET /campaigns` - List campaigns (via Meta API)
- `POST /campaigns/{id}/toggle` - Pause/activate campaign

### Agents
All require active subscription and tenant config:
- `POST /agent/optimize` - Campaign optimization
- `POST /agent/finance` - Financial analysis
- `POST /agent/scripts` - Script generation
- `POST /agent/creatives` - Creative analysis
- `POST /agent/growth` - Growth strategy
- `POST /agent/cro` - CRO recommendations
- `POST /agent/landing-audit` - Landing page audit
- `POST /agent/full-audit` - Full business audit (all agents)

### Finance
- `POST /finance/upload` - Upload Excel financial data
- `GET /finance/records` - Get user's financial records

### Orders
- `POST /orders/webhook` - Shopify webhook endpoint
- `GET /orders` - Get user's Shopify orders

## Authentication

All protected endpoints require `Authorization: Bearer <token>` header.

Token obtained from:
- `POST /auth/register` - Initial registration
- `POST /auth/login` - User login

Tokens expire after 24 hours.

## Subscription Check

Most endpoints (except auth and admin) require active subscription:
- Trial users: Access within 7 days of registration
- Paid users: Access if plan status is "active"
- Admin users: Always have access (bypass subscription check)

## Notes

- All sensitive fields (API keys) are masked in API responses
- Agent endpoints are currently placeholder implementations
- Integration with actual agent modules requires imports from agents/ directory
- CORS enabled for localhost:3000, metadash.vercel.app, and dynamic FRONTEND_URL

## Production Deployment

1. Set strong `SECRET_KEY`
2. Use PostgreSQL (not SQLite)
3. Set `DATABASE_URL` to Supabase or managed PostgreSQL
4. Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD`
5. Set `FRONTEND_URL` to your production domain
6. Use environment variable management (Railway, Vercel, etc.)
