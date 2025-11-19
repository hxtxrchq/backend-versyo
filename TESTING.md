# 🧪 Guía de Pruebas - Nuevas Funcionalidades

## 🚀 Configuración Inicial

### 1. Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores reales:
# - RESEND_API_KEY (obtener en https://resend.com/api-keys)
# - JWT_SECRET (generar uno seguro)
# - DATABASE_URL (tu conexión PostgreSQL)
# - FRONTEND_URL (URL de tu frontend)
```

### 2. Iniciar Servidor
```bash
npm run start:dev
```

---

## 🧪 Tests con Postman/Insomnia

### 1️⃣ Registro con Verificación de Email

**Request:**
```http
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "contrasena": "Test1234",
  "telefono": "123456789"
}
```

**Response Esperado:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "abc123...",
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "email_verificado": false,
    "rol": "usuario"
  }
}
```

**✅ Verificar:**
- Email recibido con botón "Valida aquí tu cuenta"
- Link contiene token único: `/auth/verify-email/abc123...`

---

### 2️⃣ Verificar Email

**Request:**
```http
GET http://localhost:3001/auth/verify-email/{TOKEN_DEL_EMAIL}
```

**Response Esperado:**
```json
{
  "mensaje": "Email verificado exitosamente",
  "email_verificado": true
}
```

**✅ Verificar:**
- Email de bienvenida recibido
- Usuario puede acceder a todas las funcionalidades

---

### 3️⃣ Login

**Request:**
```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "contrasena": "Test1234"
}
```

**Response Esperado:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "xyz789...",
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "email_verificado": true,
    "rol": "usuario"
  }
}
```

**🔒 Rate Limiting:**
- Intenta hacer login 6 veces en 1 minuto
- El 6to intento debe devolver: `429 Too Many Requests`

---

### 4️⃣ Recuperación de Contraseña

**Paso 1: Solicitar Token**
```http
POST http://localhost:3001/auth/forgot-password
Content-Type: application/json

{
  "email": "juan@example.com"
}
```

**Response:**
```json
{
  "mensaje": "Si el email existe, recibirás instrucciones para recuperar tu contraseña"
}
```

**✅ Verificar:**
- Email recibido con botón "Restablecer Contraseña"
- Token válido por 1 hora

**Paso 2: Restablecer Contraseña**
```http
POST http://localhost:3001/auth/reset-password/{TOKEN_DEL_EMAIL}
Content-Type: application/json

{
  "contrasena": "NuevaPass123",
  "confirmarContrasena": "NuevaPass123"
}
```

**Response:**
```json
{
  "mensaje": "Contraseña restablecida exitosamente"
}
```

**✅ Verificar:**
- Todos los refresh tokens anteriores fueron revocados
- Debe hacer login nuevamente con la nueva contraseña

---

### 5️⃣ Refresh Token

**Request:**
```http
POST http://localhost:3001/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "xyz789..."
}
```

**Response:**
```json
{
  "accessToken": "nuevo_access_token...",
  "refreshToken": "nuevo_refresh_token..."
}
```

**✅ Verificar:**
- El refresh token antiguo ya no funciona (rotación implementada)
- El nuevo accessToken es válido

---

### 6️⃣ Perfil de Usuario

**Obtener Perfil:**
```http
GET http://localhost:3001/usuario/perfil
Authorization: Bearer {ACCESS_TOKEN}
```

**Actualizar Perfil:**
```http
PATCH http://localhost:3001/usuario/perfil
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "nombre": "Juan Carlos Pérez",
  "dni": "12345678A",
  "direccion": "Calle Principal 123, Madrid",
  "telefono": "987654321"
}
```

**✅ Verificar:**
- Datos actualizados correctamente
- Si cambias el email, `email_verificado` vuelve a `false`

---

### 7️⃣ Cambiar Contraseña

**Request:**
```http
PATCH http://localhost:3001/usuario/cambiar-contrasena
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "contrasenaActual": "NuevaPass123",
  "nuevaContrasena": "OtraPass456",
  "confirmarContrasena": "OtraPass456"
}
```

**✅ Verificar:**
- Todos los refresh tokens fueron revocados
- Debe hacer login nuevamente

---

### 8️⃣ Checkout con Cupón

**Paso 1: Agregar productos al carrito**
```http
POST http://localhost:3001/carrito/agregar
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "variacion_id": 1,
  "cantidad": 2
}
```

**Paso 2: Crear cupón (como admin)**
```http
POST http://localhost:3001/cupon
Authorization: Bearer {ADMIN_ACCESS_TOKEN}
Content-Type: application/json

{
  "codigo": "VERANO2024",
  "tipo_descuento": "porcentaje",
  "valor_descuento": 20,
  "monto_minimo": 50,
  "descuento_maximo": 30,
  "usos_maximos": 100,
  "fecha_inicio": "2024-01-01T00:00:00Z",
  "fecha_fin": "2024-12-31T23:59:59Z",
  "activo": true
}
```

**Paso 3: Checkout con cupón**
```http
POST http://localhost:3001/pedido/checkout
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "nombre_receptor": "Juan Pérez",
  "direccion_envio": "Calle Principal 123",
  "ciudad": "Madrid",
  "region": "Comunidad de Madrid",
  "pais": "España",
  "telefono_contacto": "987654321",
  "cupon_codigo": "VERANO2024"
}
```

**✅ Verificar:**
- Descuento aplicado correctamente
- `usos_actuales` del cupón incrementado
- Stock descontado
- Carrito limpiado

---

### 9️⃣ Cancelar Pedido

**Request:**
```http
PATCH http://localhost:3001/pedido/1/cancelar
Authorization: Bearer {ACCESS_TOKEN}
```

**Response:**
```json
{
  "mensaje": "Pedido cancelado exitosamente",
  "pedido_id": 1,
  "estado": "cancelado"
}
```

**✅ Verificar:**
- Stock restaurado correctamente
- Estado del pedido cambiado a "cancelado"
- Solo funciona si estado es "pendiente" o "confirmado"

---

### 🔟 Actualizar Estado y Tracking (Admin)

**Confirmar Pedido:**
```http
PATCH http://localhost:3001/pedido/1/estado
Authorization: Bearer {ADMIN_ACCESS_TOKEN}
Content-Type: application/json

{
  "estado": "confirmado"
}
```

**✅ Verificar:**
- Email de confirmación enviado al usuario
- Pedido ya no se puede cancelar

**Agregar Tracking:**
```http
PATCH http://localhost:3001/pedido/1/tracking
Authorization: Bearer {ADMIN_ACCESS_TOKEN}
Content-Type: application/json

{
  "codigo_tracking": "ABC123456789",
  "agencia_envio": "DHL Express",
  "tiempo_estimado_entrega": "2-3 días hábiles"
}
```

**✅ Verificar:**
- Email de envío recibido con tracking
- Estado cambiado a "enviado"

---

## 🔒 Tests de Seguridad

### Rate Limiting
1. **Login**: Intenta 6 veces → 6to debe fallar
2. **Registro**: Intenta 4 veces → 4to debe fallar
3. **Forgot Password**: Intenta 4 veces → 4to debe fallar

### Tokens
1. **Token expirado**: Espera 24h para email verification → debe fallar
2. **Token usado**: Usa token de password reset 2 veces → 2da debe fallar
3. **Token revocado**: Usa refresh token después de cambiar contraseña → debe fallar

### Autorización
1. **Sin JWT**: Intenta acceder a `/usuario/perfil` sin token → 401
2. **Usuario normal**: Intenta crear cupón sin rol admin → 403
3. **Pedido ajeno**: Usuario A intenta cancelar pedido de Usuario B → 403

---

## 📧 Tests de Emails

### Verificar que lleguen:
1. ✅ Email de verificación de cuenta (registro)
2. ✅ Email de bienvenida (después de verificar)
3. ✅ Email de recuperación de contraseña
4. ✅ Email de confirmación de pedido
5. ✅ Email de envío con tracking

### Verificar contenido:
- Botones funcionan y redirigen correctamente
- Token en URL es el correcto
- Diseño HTML se ve bien en diferentes clientes
- Footer con año dinámico

---

## 🐛 Tests de Edge Cases

### Cupones
- ❌ Cupón inválido → Error
- ❌ Cupón expirado → Error
- ❌ Cupón sin usos disponibles → Error
- ❌ Monto menor al mínimo → Error

### Cancelación
- ❌ Pedido en estado "enviado" → Error
- ❌ Pedido de otro usuario → 403
- ❌ Pedido inexistente → 404

### Stock
- ❌ Stock insuficiente en checkout → Error
- ❌ Race condition: 2 usuarios compran último stock → Uno falla

---

## 📊 Checklist de Funcionalidades

- [ ] Registro con email de verificación
- [ ] Verificación de email con token
- [ ] Email de bienvenida
- [ ] Login con rate limiting (5/min)
- [ ] Refresh token con rotación
- [ ] Logout revoca refresh token
- [ ] Recuperación de contraseña
- [ ] Cambio de contraseña revoca tokens
- [ ] Actualizar perfil
- [ ] Eliminar cuenta con confirmación
- [ ] Checkout con cupón opcional
- [ ] Validaciones de cupón (fechas, monto, usos)
- [ ] Cancelación de pedido con restauración de stock
- [ ] Email de confirmación de pedido
- [ ] Email de envío con tracking
- [ ] Rate limiting global (5/min)
- [ ] Operaciones atómicas en stock
- [ ] Validación de seguridad en contraseñas

---

**Fecha:** 18 de Noviembre, 2025  
**Estado:** 🎯 Ready for Testing
