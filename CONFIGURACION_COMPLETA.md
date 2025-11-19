# ✅ Configuración Completa - Backend Versyo

## 📋 Estado: CONFIGURACIÓN COMPLETA Y LISTA

---

## 🔐 Variables de Entorno Configuradas

### `.env` - Todas las credenciales están activas ✅

```env
# Database
DATABASE_URL="postgresql://postgres:qq18857267@localhost:5432/versyo_db?schema=public"

# JWT
JWT_SECRET="f366b0462571b1bb12cdb5ec69df3460cb9fb6c774c3f53641809bcd4f6110d45ced7f74d0ed6a9280c16003b50cb3a0adf05b02bb569dc968d96c9db5fd2b69"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Cloudinary
CLOUDINARY_CLOUD_NAME="ddwohvsft"
CLOUDINARY_API_KEY="547129623785454"
CLOUDINARY_API_SECRET="c6ZgbA-wO5rRS5J3UnEiu-C8lWs"
CLOUDINARY_URL="cloudinary://547129623785454:c6ZgbA-wO5rRS5J3UnEiu-C8lWs@ddwohvsft"

# Resend Email
RESEND_API_KEY="re_QwbPhfsf_7MhyYN95ZbuZdte25GgUbSsq"
RESEND_FROM_EMAIL="noreply@versyo.com"

# Frontend
FRONTEND_URL="http://localhost:3000"

# Backend
PORT=3001
```

---

## 🚀 Configuraciones Implementadas

### 1. **CORS** (main.ts) ✅
```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',      // Frontend local
    'https://versyo.chiqo.site',  // Dominio producción
    'http://localhost:5173',      // Vite dev server
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
```

### 2. **Validación Global de DTOs** (main.ts) ✅
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,                    // Elimina propiedades no definidas
    forbidNonWhitelisted: true,         // Error en propiedades no permitidas
    transform: true,                     // Transforma tipos automáticamente
    transformOptions: {
      enableImplicitConversion: true,    // Convierte strings a números
    },
  }),
);
```

### 3. **Rate Limiting Global** (app.module.ts) ✅
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,  // 60 segundos
  limit: 5,    // 5 solicitudes por minuto
}])
```

**Aplicado globalmente con excepciones:**
- Login: 5 intentos/minuto
- Registro: 3 intentos/minuto
- Forgot password: 3 intentos/minuto
- Reset password: 3 intentos/minuto
- Endpoints públicos de lectura: Sin límite

### 4. **Cloudinary Upload Service** ✅

#### **Configuración Automática**
- Cloud Name: `ddwohvsft`
- API Key: `547129623785454`
- Carpeta: `versyo/productos`

#### **Características:**
- ✅ Validación de tipo de archivo (JPEG, PNG, WEBP)
- ✅ Límite de tamaño: 5MB por archivo
- ✅ Optimización automática:
  - Redimensión máxima: 1200x1200px
  - Calidad: auto:good
  - Formato: auto (WebP si es compatible)
- ✅ Máximo 10 imágenes simultáneas
- ✅ Eliminación de imágenes

#### **Endpoints de Upload:**
```
POST /upload/image           - Subir una imagen (admin)
POST /upload/images          - Subir múltiples imágenes (admin)
DELETE /upload/image         - Eliminar una imagen (admin)
DELETE /upload/images        - Eliminar múltiples imágenes (admin)
```

**Ejemplo de uso:**
```bash
# Subir una imagen
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer {TOKEN}" \
  -F "file=@imagen.jpg"

# Respuesta:
{
  "url": "https://res.cloudinary.com/ddwohvsft/image/upload/v1234567890/versyo/productos/abc123.jpg"
}
```

### 5. **Resend Email Service** ✅
- API Key activa: `re_QwbPhfsf_7MhyYN95ZbuZdte25GgUbSsq`
- Email de envío: `noreply@versyo.com`
- 5 templates HTML implementados

---

## 📦 Nuevas Dependencias Instaladas

```json
"streamifier": "^0.1.1"           // Manejo de streams para Cloudinary
"@types/streamifier": "^0.1.2"   // Tipos TypeScript
"@types/multer": "^1.4.12"        // Tipos para upload de archivos
```

---

## 🔒 Seguridad Implementada

### ✅ Protecciones Activas:

1. **Rate Limiting Global**
   - Previene ataques de fuerza bruta
   - Límite de 5 solicitudes por minuto por IP
   - Configuraciones personalizadas por endpoint

2. **Validación Estricta de Inputs**
   - class-validator en todos los DTOs
   - Whitelist de propiedades permitidas
   - Rechazo automático de datos no válidos

3. **CORS Configurado**
   - Solo dominios permitidos
   - Credentials habilitado para cookies/tokens
   - Headers específicos permitidos

4. **Upload Seguro**
   - Solo admin puede subir imágenes
   - Validación de tipo MIME
   - Límite de tamaño: 5MB
   - Máximo 10 archivos por request

5. **JWT Robusto**
   - Secret de 128 caracteres
   - Expiración de 7 días (access token)
   - Refresh tokens con rotación (30 días)

6. **Operaciones Atómicas**
   - Transacciones en Prisma
   - Prevención de race conditions en stock
   - Rollback automático en errores

---

## 🌐 CORS - Dominios Permitidos

```typescript
✅ http://localhost:3000         // Frontend local React/Next.js
✅ http://localhost:5173         // Frontend local Vite
✅ https://versyo.chiqo.site    // Dominio producción
```

**Para agregar más dominios:**
```typescript
// En src/main.ts
origin: [
  process.env.FRONTEND_URL,
  'https://versyo.chiqo.site',
  'https://otro-dominio.com',  // Agregar aquí
],
```

---

## 📊 Arquitectura de Upload

```
Cliente → Backend → Cloudinary
         ↓
    Validaciones:
    - Tipo MIME
    - Tamaño < 5MB
    - Máx. 10 archivos
         ↓
    Transformaciones:
    - Resize: 1200x1200
    - Quality: auto:good
    - Format: auto (WebP)
         ↓
    CDN Cloudinary
    (URL pública)
```

---

## 🧪 Testing de Upload

### Test 1: Subir Imagen (Admin)
```bash
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -F "file=@producto.jpg"
```

**Response esperado:**
```json
{
  "url": "https://res.cloudinary.com/.../versyo/productos/abc123.jpg"
}
```

### Test 2: Subir Múltiples Imágenes
```bash
curl -X POST http://localhost:3001/upload/images \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -F "files=@imagen1.jpg" \
  -F "files=@imagen2.jpg" \
  -F "files=@imagen3.jpg"
```

**Response esperado:**
```json
{
  "urls": [
    "https://res.cloudinary.com/.../versyo/productos/img1.jpg",
    "https://res.cloudinary.com/.../versyo/productos/img2.jpg",
    "https://res.cloudinary.com/.../versyo/productos/img3.jpg"
  ]
}
```

### Test 3: Error - Archivo muy grande
```bash
# Subir archivo > 5MB
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -F "file=@imagen-grande.jpg"
```

**Response esperado:**
```json
{
  "statusCode": 400,
  "message": "El archivo es demasiado grande. Tamaño máximo: 5MB"
}
```

### Test 4: Error - Tipo no permitido
```bash
# Subir PDF
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -F "file=@documento.pdf"
```

**Response esperado:**
```json
{
  "statusCode": 400,
  "message": "Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, WEBP)"
}
```

---

## 🎯 Checklist de Configuración

### Variables de Entorno
- [x] DATABASE_URL configurada
- [x] JWT_SECRET generado (128 chars)
- [x] CLOUDINARY_CLOUD_NAME configurado
- [x] CLOUDINARY_API_KEY configurado
- [x] CLOUDINARY_API_SECRET configurado
- [x] RESEND_API_KEY configurado
- [x] RESEND_FROM_EMAIL configurado
- [x] FRONTEND_URL configurado
- [x] PORT configurado

### Backend
- [x] CORS habilitado con dominios permitidos
- [x] Validación global de DTOs
- [x] Rate limiting configurado (5 req/min)
- [x] Cloudinary service implementado
- [x] Upload endpoints creados
- [x] Seguridad en uploads (admin only)
- [x] Tipos TypeScript para Multer
- [x] Streamifier instalado

### Servicios Externos
- [x] Cuenta de Cloudinary activa
- [x] Cuenta de Resend activa
- [x] Base de datos PostgreSQL conectada

---

## 🚀 Iniciar el Servidor

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

**Salida esperada:**
```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 Backend Versyo Store                        ║
║                                                   ║
║   ✅ Servidor corriendo en: http://localhost:3001  ║
║   ✅ CORS configurado                            ║
║   ✅ Rate Limiting activo (5 req/min)            ║
║   ✅ Validación global habilitada                ║
║   ✅ Cloudinary configurado                      ║
║   ✅ Resend Email configurado                    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## 📝 Notas Importantes

### 1. Cloudinary - Límites del Plan Gratuito
- ✅ Almacenamiento: 25 GB
- ✅ Bandwidth: 25 GB/mes
- ✅ Transformaciones: 25,000/mes
- ✅ Admin API: 500 calls/hora

**Recomendación:** Monitorear uso en [dashboard de Cloudinary](https://cloudinary.com/console)

### 2. Resend - Límites del Plan Gratuito
- ✅ 100 emails/día
- ✅ 3,000 emails/mes
- ✅ Dominios personalizados: Ilimitados

**Recomendación:** Configurar dominio personalizado para evitar spam filters

### 3. Rate Limiting - Producción
Para producción, considera aumentar límites según carga:
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,
  limit: 100,  // 100 req/min en producción
}])
```

### 4. CORS - Producción
Asegúrate de agregar todos los dominios de producción:
```typescript
origin: [
  'https://versyo.chiqo.site',
  'https://www.versyo.chiqo.site',
  'https://api.versyo.chiqo.site',
],
```

---

## 🔧 Troubleshooting

### Error: "Cloudinary configuration is missing"
**Solución:** Verificar que `.env` tenga todas las variables de Cloudinary

### Error: "Rate limit exceeded"
**Solución:** Esperar 1 minuto o aumentar límite en `app.module.ts`

### Error: "CORS policy blocked"
**Solución:** Agregar dominio del frontend a `origin` en `main.ts`

### Error: "File too large"
**Solución:** Comprimir imagen o aumentar límite en `upload.service.ts` (línea 36)

---

## 📚 Documentación Adicional

- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Resend Docs**: https://resend.com/docs
- **NestJS Throttler**: https://docs.nestjs.com/security/rate-limiting
- **Multer**: https://github.com/expressjs/multer

---

**Fecha:** 18 de Noviembre, 2025  
**Estado:** ✅ CONFIGURACIÓN COMPLETA Y SEGURA  
**Versión:** Backend Versyo v2.1.0
