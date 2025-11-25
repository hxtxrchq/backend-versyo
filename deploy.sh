#!/bin/bash
# Script de deploy para backend Versyo
# Ejecutar en el servidor: bash deploy.sh

echo "🚀 Iniciando deploy del backend..."

# Navegar al directorio del proyecto
cd /var/www/backversyoend/backend-versyo || exit 1

echo "📥 Descargando últimos cambios..."
git pull origin main

echo "📦 Instalando dependencias..."
npm install

echo "🔨 Compilando proyecto..."
npm run build

echo "🔄 Reiniciando servicio PM2..."
pm2 restart versyo-backend

echo "✅ Deploy completado!"
echo "📊 Estado del servicio:"
pm2 status versyo-backend

echo ""
echo "📋 Últimos logs:"
pm2 logs versyo-backend --lines 20 --nostream
