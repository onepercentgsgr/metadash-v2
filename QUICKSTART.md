# MetaDash Backend - Quick Start Guide

## Local Development

### 1. Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env if needed (default SQLite is fine for local)
```

### 3. Run
```bash
uvicorn main:app --reload
```

Open http://localhost:8000/docs for interactive API documentation

### 4. Test
```bash
# Register new user
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get current user
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer <your_token_here>"
```

## Production Deployment

### Railway.app

1. Create Railway account and project
2. Connect GitHub repo
3. Set environment variables:
   ```
   DATABASE_URL=postgresql://user:pass@host/metadash
   SECRET_KEY=your-random-secret-key
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your-strong-password
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
4. Deploy!

### Environment Variables Required

```bash
# Database (PostgreSQL or SQLite)
DATABASE_URL=postgresql://user:pass@localhost:5432/metadash

# Security
SECRET_KEY=your-secret-key-here

# Admin account created on startup
ADMIN_EMAIL=admin@metadash.com
ADMIN_PASSWORD=your-admin-password

# CORS - Frontend URL
FRONTEND_URL=https://metadash.vercel.app
```

## Key Endpoints

### Public
- `GET /health` - Health check

### Auth (no token needed)
- `POST /auth/register` - Create account (auto 7-day trial)
- `POST /auth/login` - Get JWT token

### Protected (need token)
- `GET /auth/me` - Current user
- `GET /config` - Get config
- `POST /config` - Update config
- `POST /agent/optimize` - Run campaign optimizer
- `POST /agent/finance` - Run finance analyzer
- `POST /agent/scripts` - Generate scripts
- `POST /agent/creatives` - Analyze creatives
- `POST /agent/growth` - Growth strategy
- `POST /agent/cro` - CRO advice
- `POST /agent/landing-audit` - Audit landing page
- `POST /agent/full-audit` - Full business audit
- `POST /finance/upload` - Upload Excel data
- `GET /finance/records` - Get financial records
- `GET /campaigns` - List campaigns
- `POST /campaigns/{id}/toggle` - Pause/resume
- `GET /orders` - List Shopify orders
- `POST /orders/webhook` - Shopify webhook

### Admin Only
- `GET /admin/users` - List all users
- `POST /admin/users/{id}/toggle` - Activate/deactivate
- `POST /admin/users/{id}/extend-trial` - Extend trial
- `POST /admin/users/{id}/set-plan` - Change plan
- `GET /admin/stats` - Get revenue/user stats

## Database

Auto-created tables:
- users
- tenant_configs
- subscriptions
- agent_logs
- financial_records
- shopify_orders

All relationships properly configured.

## Subscription Flow

1. User registers → Auto 7-day trial
2. After 7 days → Trial expires unless upgraded
3. Admin can extend trial or upgrade to paid plan
4. All agent endpoints check subscription is active
5. Admin users bypass subscription check

## Common Tasks

### Add a new user (via API)
```bash
POST /auth/register
```

### Promote user to admin (manually in DB)
```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

### Extend user trial
```bash
POST /admin/users/{user_id}/extend-trial?days=7
```

### Check admin stats
```bash
GET /admin/stats
Authorization: Bearer <admin_token>
```

### Upload financial data
```bash
POST /finance/upload
Authorization: Bearer <user_token>
Content-Type: multipart/form-data

[Excel file with columns: periodo, ingresos, costos, ad_spend, devoluciones, ordenes]
```

## Troubleshooting

### Port already in use
```bash
# Use different port
uvicorn main:app --port 8001
```

### Database errors
```bash
# Check DATABASE_URL is correct
# For SQLite: sqlite:///./metadash.db
# For PostgreSQL: postgresql://user:pass@host:5432/metadash
```

### No admin user created
```bash
# Manually create in database:
INSERT INTO users (email, hashed_password, name, role, is_active)
VALUES ('admin@example.com', '<hashed>', 'Admin', 'admin', true);
```

### CORS errors
```bash
# Check FRONTEND_URL env var matches your frontend domain
# Or add domain to cors_origins in main.py
```

## Next Steps

1. Connect frontend to API (use JWT tokens)
2. Configure Meta Ads API credentials for users
3. Add Anthropic API keys to tenant config
4. Implement actual agent integrations
5. Set up Shopify webhook webhooks
6. Configure Mercado Pago for payments
7. Deploy to production (Railway + Vercel)
