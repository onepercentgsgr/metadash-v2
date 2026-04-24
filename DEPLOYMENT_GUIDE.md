# MetaDash Deployment Guide

**Version**: 2.0.0  
**Last Updated**: April 24, 2026

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Security
- [ ] Generate strong `SECRET_KEY` (32+ characters)
- [ ] Generate `ENCRYPTION_KEY` using Fernet
- [ ] Set secure `ADMIN_PASSWORD`
- [ ] Configure `ALLOWED_ORIGINS` (only trusted domains)
- [ ] Enable HTTPS on domain
- [ ] Set up SSL certificates (Let's Encrypt recommended)
- [ ] Configure firewall rules
- [ ] Review security headers in `security_middleware.py`

### Infrastructure
- [ ] Provision PostgreSQL database
- [ ] Provision Redis cache
- [ ] Setup object storage (S3 or equivalent for backups)
- [ ] Configure DNS records
- [ ] Setup load balancer/reverse proxy
- [ ] Configure auto-scaling policies

### Application
- [ ] Run all tests: `pytest -v`
- [ ] Check test coverage: `pytest --cov`
- [ ] Run security audit: `bandit -r backend/`
- [ ] Update dependencies: `pip install --upgrade -r requirements.txt`
- [ ] Verify email configuration
- [ ] Test payment webhooks in sandbox mode

### Documentation
- [ ] Update Terms of Service with your company info
- [ ] Update Privacy Policy with your company info
- [ ] Create runbook for common operations
- [ ] Document emergency procedures

---

## Environment Setup

### 1. Create Production .env File

```bash
cp backend/.env.example backend/.env.production
```

### 2. Generate Secure Keys

**SECRET_KEY**:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**ENCRYPTION_KEY**:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Set Environment Variables

```bash
# Security
SECRET_KEY=<generated-key>
ENCRYPTION_KEY=<generated-key>
ADMIN_PASSWORD=<strong-password>

# CORS
ALLOWED_ORIGINS=https://app.metadash.com,https://www.metadash.com

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/metadash

# Redis
REDIS_URL=redis://:password@redis-host:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@metadash.com

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_WEBHOOK_TOKEN=...

# Third-party APIs
ANTHROPIC_API_KEY=sk-ant-...
META_ACCESS_TOKEN=...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...

# Environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info
```

---

## Database Setup

### 1. Initialize PostgreSQL

```bash
# Connect to PostgreSQL
psql -U postgres -d postgres

# Create database
CREATE DATABASE metadash;
CREATE USER metadash_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE metadash TO metadash_user;
```

### 2. Run Migrations

```bash
cd backend
alembic upgrade head
```

### 3. Create Admin User (optional)

```bash
python
>>> from main import app, get_db
>>> from models import User
>>> from database import SessionLocal
>>> 
>>> db = SessionLocal()
>>> admin = User(
...     email="admin@metadash.com",
...     hashed_password="<bcrypted-password>",
...     name="Admin",
...     role="admin",
...     is_active=True
... )
>>> db.add(admin)
>>> db.commit()
```

### 4. Setup Backups

```bash
# Daily PostgreSQL backup
0 2 * * * pg_dump -U metadash_user metadash | gzip > /backups/metadash_$(date +\%Y\%m\%d).sql.gz

# Keep 30 days of backups
find /backups -name "metadash_*.sql.gz" -mtime +30 -delete
```

---

## Backend Deployment

### Option 1: Docker Compose (Recommended for Dev/Small Production)

```bash
cd deploy
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### Option 2: Railway.app (Recommended for Quick Deploy)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link environment variables
railway variables

# Deploy
railway up

# View logs
railway logs -f
```

**Connect Database**:
1. Create PostgreSQL plugin in Railway
2. Copy connection string to `DATABASE_URL`

### Option 3: Heroku

```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create metadash-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0 --app metadash-api

# Set environment variables
heroku config:set SECRET_KEY=... --app metadash-api
heroku config:set ENCRYPTION_KEY=... --app metadash-api
# ... set all variables

# Deploy
git push heroku main

# View logs
heroku logs -f --app metadash-api
```

### Option 4: AWS ECS + RDS

```bash
# Push Docker image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker tag metadash:latest <account>.dkr.ecr.us-east-1.amazonaws.com/metadash:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/metadash:latest

# Create ECS service
aws ecs create-service --cluster metadash --service-name metadash-api ...
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod

# Configure environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://api.metadash.com
# NEXT_PUBLIC_STRIPE_KEY=pk_live_...
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod

# Connect git for automatic deploys
```

### Option 3: AWS CloudFront + S3

```bash
# Build
cd frontend
npm run build

# Upload to S3
aws s3 sync .next/out/ s3://metadash-frontend/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E1234 --paths "/*"
```

---

## Post-Deployment Verification

```bash
# 1. Health checks
curl https://api.metadash.com/docs
curl https://app.metadash.com

# 2. Database connectivity
curl -X GET https://api.metadash.com/auth/me \
  -H "Authorization: Bearer <token>"

# 3. Payment webhooks
# Test in Stripe/MercadoPago dashboard

# 4. Email sending
# Trigger verification email to test email

# 5. Third-party integrations
# Test Meta Ads API connection
# Test Anthropic API
# Test Stripe API
```

---

## Monitoring and Maintenance

### 1. Setup Error Tracking (Sentry)

```bash
# Install Sentry SDK
pip install sentry-sdk

# Add to main.py
import sentry_sdk
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENVIRONMENT"),
    traces_sample_rate=1.0
)
```

### 2. Setup Application Monitoring

Use Datadog, New Relic, or similar:
- Monitor CPU, memory, disk usage
- Track request latency and errors
- Monitor database query performance

### 3. Setup Logs

Configure centralized logging:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- CloudWatch (AWS)
- Datadog Logs
- Papertrail

### 4. Regular Maintenance

**Weekly**:
- Review error logs
- Check database size and indexes
- Verify backups

**Monthly**:
- Update dependencies: `pip install --upgrade -r requirements.txt`
- Run security audit: `bandit -r backend/`
- Review and optimize slow queries
- Check SSL certificate expiration

**Quarterly**:
- Security audit
- Performance optimization
- Dependency updates and testing

---

## Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL connectivity
psql -h <host> -U metadash_user -d metadash -c "SELECT 1;"

# Check connection string
echo $DATABASE_URL

# Reset connection pool
# Restart backend application
```

### Payment Webhook Issues

```bash
# Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Test webhook
stripe trigger payment_intent.succeeded

# Check webhook logs in dashboard
```

### Email Not Sending

```bash
# Verify SMTP credentials
python -c "
import smtplib
server = smtplib.SMTP('$SMTP_HOST', $SMTP_PORT)
server.starttls()
server.login('$SMTP_USER', '$SMTP_PASSWORD')
server.quit()
print('Success!')
"
```

### High Response Times

```bash
# Check database query performance
# Enable slow query log in PostgreSQL
# Analyze with EXPLAIN ANALYZE

# Check Redis connectivity
redis-cli -h <host> ping

# Monitor application metrics
# Review recent deployments for changes
```

---

## Rollback Procedure

### If deployment fails:

```bash
# Option 1: Revert git commit
git revert <commit-hash>
git push origin main

# Option 2: Rollback in Railway
railway services

# Option 3: Redeploy previous version
git checkout <previous-commit>
git push -f origin main
```

---

## Production Runbook

### Daily Checks
- [ ] Application is responding
- [ ] No critical errors in logs
- [ ] Database size is stable
- [ ] Payment webhooks are working

### Emergency Contacts
- DevOps: devops@metadash.com
- Security: security@metadash.com
- Support: support@metadash.com

---

**For support or questions, contact: devops@metadash.com**
