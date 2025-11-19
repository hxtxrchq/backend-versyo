# Script para probar el envío de correos
# Asegúrate de que el servidor esté corriendo antes de ejecutar este script

$baseUrl = "http://localhost:3001"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   TEST DE EMAILS - VERSYO" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test 1: Email de Confirmación de Pedido
Write-Host "[1/4] Enviando email de confirmación de pedido..." -ForegroundColor Yellow
$body1 = @{
    email = "alonsxito123@gmail.com"
    nombreCliente = "Carlos Alonso Paredes Quiroz"
    numeroPedido = "VER-001"
} | ConvertTo-Json

try {
    $result1 = Invoke-RestMethod -Method POST -Uri "$baseUrl/email/test/confirmacion" -ContentType "application/json" -Body $body1
    Write-Host "✅ Email de confirmación enviado exitosamente" -ForegroundColor Green
    Write-Host "   Mensaje: $($result1.message)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error al enviar email de confirmación" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 2: Email de Notificación de Envío
Write-Host "[2/4] Enviando email de notificación de envío..." -ForegroundColor Yellow
$body2 = @{
    email = "alonsxito123@gmail.com"
    nombreCliente = "Carlos Alonso Paredes Quiroz"
    numeroPedido = "VER-001"
    codigoTracking = "OLVA-2024-12345"
} | ConvertTo-Json

try {
    $result2 = Invoke-RestMethod -Method POST -Uri "$baseUrl/email/test/envio" -ContentType "application/json" -Body $body2
    Write-Host "✅ Email de envío enviado exitosamente" -ForegroundColor Green
    Write-Host "   Mensaje: $($result2.message)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error al enviar email de envío" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 3: Email de Verificación
Write-Host "[3/4] Enviando email de verificación de cuenta..." -ForegroundColor Yellow
$body3 = @{
    email = "alonsxito123@gmail.com"
    nombreCliente = "Carlos Alonso Paredes Quiroz"
    token = "test-token-123456"
} | ConvertTo-Json

try {
    $result3 = Invoke-RestMethod -Method POST -Uri "$baseUrl/email/test/verificacion" -ContentType "application/json" -Body $body3
    Write-Host "✅ Email de verificación enviado exitosamente" -ForegroundColor Green
    Write-Host "   Mensaje: $($result3.message)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error al enviar email de verificación" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 4: Email de Bienvenida
Write-Host "[4/4] Enviando email de bienvenida..." -ForegroundColor Yellow
$body4 = @{
    email = "alonsxito123@gmail.com"
    nombreCliente = "Carlos Alonso Paredes Quiroz"
} | ConvertTo-Json

try {
    $result4 = Invoke-RestMethod -Method POST -Uri "$baseUrl/email/test/bienvenida" -ContentType "application/json" -Body $body4
    Write-Host "✅ Email de bienvenida enviado exitosamente" -ForegroundColor Green
    Write-Host "   Mensaje: $($result4.message)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error al enviar email de bienvenida" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "   PRUEBAS COMPLETADAS" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "`nRevisa tu bandeja de entrada: alonsxito123@gmail.com`n" -ForegroundColor White
