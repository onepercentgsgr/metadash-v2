# MetaDash Backend - File Index

## Directory Structure

```
backend/
├── main.py                 # FastAPI application (1,103 lines)
├── models.py              # Database models (6 tables)
├── database.py            # SQLAlchemy setup
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── Dockerfile             # Container image
├── .env.example          # Environment template
└── README.md             # Full documentation
```

## File Descriptions

### main.py (CORE APPLICATION)
The main FastAPI application with 27 endpoints organized into 8 sections:

**Request/Response Models:**
- UserRegister, UserLogin, TokenResponse
- UserResponse, TenantConfigUpdate, TenantConfigResponse
- AgentRequest, AgentResponse
- AdminUserResponse, AdminStats
- FinancialRecordResponse, ShopifyOrderResponse

**Utility Functions:**
- hash_password() - Bcrypt password hashing
- verify_password() - Verify hashed password
- create_access_token() - JWT token generation
- verify_token() - JWT token validation
- get_current_user() - Extract user from token
- get_current_user_from_header() - Extract from Authorization header
- get_tenant_config() - Get user's configuration
- get_active_subscription() - Verify subscription is active
- check_subscription() - Middleware dependency for subscription check

**Startup Event:**
- Creates admin user if doesn't exist
- Creates admin tenant config
- Creates admin trial subscription

**Endpoints by Group:**
1. Health Check (2 endpoints)
2. Auth (3 endpoints)
3. Config (2 endpoints)
4. Subscriptions (1 endpoint)
5. Admin (5 endpoints)
6. Campaigns (2 endpoints)
7. Agents (8 endpoints)
8. Finance (2 endpoints)
9. Orders (2 endpoints)

### models.py (DATABASE SCHEMA)

**User Table:**
- id (primary key)
- email (unique)
- hashed_password
- name
- role (admin/client)
- is_active
- created_at
- Relationships: tenant_config, subscriptions, agent_logs, financial_records, shopify_orders

**TenantConfig Table:**
- id (primary key)
- user_id (foreign key, unique)
- meta_access_token
- meta_ad_account_id
- meta_app_id
- meta_app_secret
- anthropic_api_key
- hf_api_key
- negocio_info
- landing_page_url
- shopify_store_url
- shopify_webhook_secret
- mercadopago_access_token
- Relationship: user

**Subscription Table:**
- id (primary key)
- user_id (foreign key)
- plan (trial/starter/pro/enterprise)
- status (active/expired/cancelled)
- trial_start
- trial_end
- created_at
- updated_at
- Relationship: user

**AgentLog Table:**
- id (primary key)
- user_id (foreign key)
- agent_type
- input_summary
- output (Text)
- created_at
- Relationship: user

**FinancialRecord Table:**
- id (primary key)
- user_id (foreign key)
- periodo
- ingresos
- costos
- ad_spend
- devoluciones
- ordenes
- created_at
- Relationship: user

**ShopifyOrder Table:**
- id (primary key)
- user_id (foreign key)
- order_id (unique)
- order_number
- email
- total_price
- subtotal_price
- total_tax
- currency
- financial_status
- fulfillment_status
- customer_first_name
- customer_last_name
- line_items_json
- created_at
- Relationship: user

### database.py (DATABASE CONNECTION)
- DATABASE_URL configuration
- PostgreSQL auto-conversion
- SQLAlchemy engine setup
- SessionLocal session factory
- Base declarative model
- get_db() dependency for FastAPI

### config.py (CONFIGURATION)
- SECRET_KEY (JWT signing)
- ALGORITHM (HS256)
- ACCESS_TOKEN_EXPIRE_MINUTES (1440 = 24 hours)
- ADMIN_EMAIL (default: admin@metadash.com)
- ADMIN_PASSWORD (default: admin2024)

### requirements.txt (DEPENDENCIES)
```
fastapi==0.111.0              # Web framework
uvicorn[standard]==0.29.0     # ASGI server
python-dotenv==1.0.1          # Environment variables
anthropic>=0.28.0             # Anthropic API
sqlalchemy==2.0.30            # Database ORM
httpx==0.27.0                 # HTTP client
pydantic==2.7.1               # Data validation
python-jose[cryptography]==3.3.0  # JWT tokens
passlib[bcrypt]==1.7.4        # Password hashing
python-multipart==0.0.9       # File upload support
psycopg2-binary==2.9.9        # PostgreSQL driver
beautifulsoup4==4.12.3        # HTML parsing
openpyxl==3.1.2               # Excel file handling
requests==2.32.3              # HTTP requests
```

### Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${PORT:-8000}
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
```

### .env.example
```
DATABASE_URL=postgresql://user:pass@host:5432/metadash
SECRET_KEY=your-secret-key-here
ADMIN_EMAIL=admin@metadash.com
ADMIN_PASSWORD=your-admin-password
FRONTEND_URL=https://metadash.vercel.app
```

## Usage Quick Reference

### Start Application
```bash
uvicorn main:app --reload
```

### Access API
- Base URL: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Test Registration
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test"}'
```

### Test Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

### Access Protected Endpoint
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Deployment Checklist

- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Configure .env with production values
- [ ] Set DATABASE_URL to PostgreSQL/Supabase
- [ ] Generate strong SECRET_KEY
- [ ] Set ADMIN_EMAIL and ADMIN_PASSWORD
- [ ] Configure FRONTEND_URL for CORS
- [ ] Build Docker image if using containers
- [ ] Test all endpoints
- [ ] Set up logging and monitoring
- [ ] Configure SSL/TLS
- [ ] Deploy to Railway/Vercel/server

## Key Concepts

### Multi-Tenancy
- Each user has isolated configuration
- No data shared between users
- API keys stored per tenant

### JWT Authentication
- Tokens issued on registration/login
- 24-hour expiration
- Bearer token in Authorization header

### Subscription System
- Automatic 7-day trial on registration
- Paid plans: $29, $99, $299
- Admin can manage plans and extend trials

### Subscription Middleware
- All protected endpoints verify subscription
- Trial users: 7 days from registration
- Paid users: must have active status
- Admin users: always allowed

### Agent Endpoints
- All check subscription is active
- All use tenant's Anthropic API key
- All log results to database
- Support custom prompt and context

## Common Tasks

### Create Admin User (on startup)
```python
# Automatically created from env vars
ADMIN_EMAIL=admin@metadash.com
ADMIN_PASSWORD=admin2024
```

### Add New API Key to TenantConfig
```python
# POST /config with new key
{
  "anthropic_api_key": "sk-..."
}
```

### Extend User Trial
```bash
POST /admin/users/{user_id}/extend-trial?days=7
```

### Change User Plan
```bash
POST /admin/users/{user_id}/set-plan
{"plan": "pro"}
```

### Upload Financial Data
```bash
POST /finance/upload
# Excel file with: periodo, ingresos, costos, ad_spend, devoluciones, ordenes
```

## Error Handling

All endpoints return standard HTTP status codes:
- 200 OK - Success
- 201 Created - Resource created
- 400 Bad Request - Invalid input
- 401 Unauthorized - Missing/invalid token
- 403 Forbidden - No subscription/admin access
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server error

## Database Notes

### PostgreSQL (Production)
```
postgresql://user:pass@host:5432/metadash
```

### SQLite (Development)
```
sqlite:///./metadash.db
```

### Supabase
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

## Performance

- Database pooling enabled
- Indexed queries on id, email, user_id
- Pagination-ready endpoints
- Efficient JSON serialization
- Async/await throughout

## Security

- Passwords: bcrypt hashing
- Tokens: JWT with secret key
- API keys: masked in responses
- CORS: controlled origin list
- SQL: prepared statements via SQLAlchemy
- Admin: role-based access control

---

For complete documentation, see README.md
For quick start, see QUICKSTART.md
For architecture details, see IMPLEMENTATION_SUMMARY.md
