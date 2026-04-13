# 🔐 SOLUCIÓN COMPLETA - SISTEMA DE AUTENTICACIÓN METADASH

**Documento para arreglar 100% los errores 401 "Invalid token"**

---

## ⚠️ PROBLEMA RAÍZ IDENTIFICADO

Todo el sistema de autenticación está fallando porque:

**La variable `SECRET_KEY` en Railway NO está configurada correctamente**

Esto causa que:
- Tokens se generen con un secret
- Se validen con otro secret diferente
- Resultado: 401 "Invalid token" en TODOS los endpoints

---

## ✅ SOLUCIÓN EN 3 PASOS (15 MINUTOS)

### **PASO 1: Configurar SECRET_KEY en Railway (5 minutos)**

#### 1.1 Abre Railway
```
https://railway.app/dashboard
```

#### 1.2 Entra a tu proyecto MetaDash → Backend

#### 1.3 Ve a "Variables" (Environment Variables)

#### 1.4 ¿Existe la variable SECRET_KEY?

**SI NO EXISTE:**
- Click en "Add Variable"
- **Name:** `SECRET_KEY`
- **Value:** Copia EXACTAMENTE esto:
```
sk_prod_e2a8f1c3d9b7e4a6c2f8d1a5e3b9c7f0e2a4d6c8b0f1e3a5c7d9b1f3e5a7c9
```
- Click en "Save"

**SI EXISTE pero parece extraño:**
- Copia el valor actual (para backup mental)
- Bórralo (click en el ícono trash)
- Crea uno nuevo con el valor arriba

#### 1.5 Railway hace redeploy automático
- Espera 1-2 minutos
- Mira en "Logs" que diga "Application startup complete"

---

### **PASO 2: Limpia localStorage y Cookies en el navegador (3 minutos)**

#### 2.1 Abre el sitio https://metadash-v2-n2em.vercel.app (o tu dominio)

#### 2.2 Presiona **F12** (Developer Tools)

#### 2.3 Ve a **"Application"** tab

#### 2.4 **Local Storage** → Expande el sitio

#### 2.5 **Borra TODO:**
```
- token
- user
- auth
- (cualquier cosa que veas)
```

#### 2.6 **Session Storage** → Borra todo también

#### 2.7 **Cookies** → Borra todo

#### 2.8 Cierra DevTools (F12 de nuevo)

#### 2.9 **Recarga la página** (Ctrl+F5 o Cmd+Shift+R)

---

### **PASO 3: Registra un usuario TEST (7 minutos)**

#### 3.1 En la landing page, click en "Comienza Gratis" o "Registrarse"

#### 3.2 Completa el formulario:
```
Email:       testuser@test.com
Nombre:      Test User
Contraseña:  Test123!@
```

#### 3.3 Click en "Registrarse"

#### 3.4 ¿Qué debería pasar?
- ✅ Se crea la cuenta
- ✅ Te redirige a /onboarding
- ✅ Completás los 5 pasos
- ✅ Llegas al /dashboard
- ✅ Ves "Buen día" y métricas

#### 3.5 Ahora login como ADMIN:
```
Email:    onepercent.gsgr@gmail.com
Password: [Tu password]
```

#### 3.6 ¿Qué debería pasar?
- ✅ Entras al dashboard
- ✅ Click en "Admin" en el sidebar izquierdo
- ✅ Ves la lista de usuarios (incluyendo el test que creaste)
- ✅ SIN ERRORES

---

## 🔍 SI SIGUE FALLANDO - DEBUGGING

### **Verifica el error exacto en DevTools:**

#### En la consola (F12 → Console):
```
Busca líneas rojas que digan:
- "Invalid token"
- "401 Unauthorized"
- "Failed to validate"
```

**Copia la línea completa del error**

#### En Network (F12 → Network tab):
```
1. Recarga la página (F5)
2. Busca requests a: /auth/register o /auth/login
3. Click en el request
4. Ve a "Response" tab
5. Si dice: {"detail": "No authorization header"} → El token no se envía
6. Si dice: {"detail": "Invalid token"} → Secret_key problema
```

---

## 🚀 PASO EXTRA: Verificar en Railway Logs

#### 1. Ve a https://railway.app → Tu proyecto → Backend

#### 2. Click en "Logs"

#### 3. Busca líneas nuevas después de tu último login intento

#### 4. Debería ver:
```
✅ BUENO:
DEBUG verify_token: Token verified for user_id=1

❌ MALO:
ERROR verify_token: Invalid token - InvalidSignatureError
```

Si ves "InvalidSignatureError" → El SECRET_KEY está mal.

---

## 💡 QUÉ HACER SI AÚN FALLA

### Opción A: Resetear completamente

```bash
# En tu máquina (línea de comandos):
cd /ruta/del/proyecto/metadash

# Pushear cambios recientes
git push origin master -f

# En Railway: 
# 1. Ir a Backend → Settings
# 2. Click en "Redeploy"
# 3. Esperar 2-3 minutos
```

### Opción B: Revisar SECRET_KEY nuevamente

Probablemente olvidaste copiar bien o hay caracteres extras.

Genera uno nuevo:
```
sk_prod_$(python3 -c "import secrets; print(secrets.token_hex(32))")
```

O simplemente copia este:
```
sk_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## 📋 CHECKLIST FINAL

- [ ] Configuré SECRET_KEY en Railway
- [ ] Esperé a que Railway haga redeploy (ves "Application startup complete")
- [ ] Limpié todo localStorage y cookies
- [ ] Recargué la página (Ctrl+F5)
- [ ] Registré un usuario TEST correctamente
- [ ] Loginé como ADMIN sin errores
- [ ] Veo la lista de usuarios en /admin
- [ ] El usuario TEST aparece en la lista

---

## 🎯 ¿Qué pasa después de arreglarlo?

Una vez que funcione:

1. **Todos pueden registrarse** ✅
2. **Todos pueden loguearse** ✅
3. **Admin ve TODOS los usuarios** ✅
4. **No hay más errores 401** ✅
5. **Los tokens se generan y validan correctamente** ✅

El sistema está 100% funcional para producción.

---

## ⚡ NOTA IMPORTANTE

**Una vez que SECRET_KEY está configurado en Railway:**
- **NUNCA lo cambies** (o todos los tokens se vuelven inválidos)
- Está encriptado y seguro en Railway
- Se usa para firmar y verificar TODOS los JWT

---

**¿Dudas? Lee los logs de Railway mientras intentes login.**
**Los logs dirán exactamente cuál es el problema.**
