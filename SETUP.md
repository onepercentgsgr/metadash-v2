# MetaDash — Guía de Setup

## Stack
- **Frontend**: Next.js → deploy en Vercel (gratis)
- **Backend**: Python FastAPI → deploy en tu VPS Hostinger
- **Agentes IA**: Claude (Anthropic API)
- **Meta API**: facebook-business SDK oficial

---

## PASO 1 — Backend en Hostinger VPS

```bash
# Conectarse al VPS
ssh root@TU_IP_VPS

# Instalar Docker (si no lo tenés)
curl -fsSL https://get.docker.com | sh

# Clonar / subir el proyecto
# Opción A: git clone de tu repo privado
# Opción B: scp -r metadash/ root@TU_IP:/root/

cd /root/metadash/backend

# Copiar y completar el .env
cp .env.example .env
nano .env   # completar todos los valores

# Volver al directorio deploy y levantar
cd /root/metadash/deploy
docker-compose up -d

# Verificar que funciona
curl http://localhost:8000/health
# Respuesta esperada: {"status":"ok","version":"1.0.0"}
```

---

## PASO 2 — Nginx + SSL (HTTPS para el backend)

```bash
apt install nginx certbot python3-certbot-nginx -y

# Crear config nginx
nano /etc/nginx/sites-available/metadash

# Pegar esto (reemplazá api.tudominio.com):
server {
    server_name api.tudominio.com;
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

ln -s /etc/nginx/sites-available/metadash /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL gratis con Let's Encrypt
certbot --nginx -d api.tudominio.com
```

---

## PASO 3 — Frontend en Vercel

```bash
# En tu computadora local (no el VPS)
cd metadash/frontend

# Instalar dependencias
npm install

# Crear el .env.local
cp .env.local.example .env.local
# Editar: NEXT_PUBLIC_API_URL=https://api.tudominio.com
#         NEXT_PUBLIC_API_PASS=tu_password

# Deploy a Vercel
npx vercel --prod
# Seguir los pasos, elegir el dominio que tenés alpedo
```

---

## PASO 4 — Conectar dominio a Vercel

1. En tu registrar (donde compraste el dominio), apuntar el DNS a Vercel
2. En Vercel dashboard → tu proyecto → Settings → Domains → agregar tu dominio
3. Listo. El dashboard va a estar en tudominio.com

---

## Cómo conseguir el Meta Access Token

1. Ir a: https://developers.facebook.com/
2. Crear una app → tipo "Business"
3. Agregar "Marketing API" como producto
4. En "Tools" → "Graph API Explorer" → generar token con permisos: `ads_read`, `ads_management`
5. Para token de larga duración (60 días): usar el endpoint de exchange de token
6. `META_AD_ACCOUNT_ID`: va a ser algo como `act_123456789` (está en el Business Manager)

---

## Estructura del proyecto

```
metadash/
├── backend/
│   ├── main.py              ← API FastAPI (todos los endpoints)
│   ├── meta_api.py          ← Conexión a Meta Marketing API
│   ├── config.py            ← Variables de entorno
│   ├── agents/
│   │   ├── optimizer.py     ← Agente 1: decisiones de campaña
│   │   ├── script_gen.py    ← Agente 2: generador de guiones
│   │   └── finance.py       ← Agente 3: márgenes y presupuesto
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/index.jsx  ← Dashboard principal
│   │   ├── components/      ← MetricCard, CampaignTable
│   │   └── lib/api.js       ← Cliente HTTP
│   └── package.json
└── deploy/
    └── docker-compose.yml
```
