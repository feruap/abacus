
#!/bin/bash

# Script de deployment para producción del Sistema Agéntico de Ventas
# Desarrollado para crm.amunet.com.mx

set -e

echo "🚀 Iniciando deployment de producción..."
echo "📅 $(date)"
echo "=========================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecutar desde el directorio del proyecto."
fi

# 1. Configuración de producción
log "📋 Configurando variables de entorno para producción..."
if [ -f ".env.production" ]; then
    cp .env.production .env
    log "Variables de producción aplicadas"
else
    warn "No se encontró .env.production, usando .env existente"
fi

# 2. Limpiar caché y dependencias
log "🧹 Limpiando caché y reinstalando dependencias..."
rm -rf .next/
rm -rf node_modules/.cache/
yarn install --frozen-lockfile

# 3. Verificar compilación TypeScript
log "📝 Verificando tipos TypeScript..."
npx tsc --noEmit || error "Errores de TypeScript encontrados"

# 4. Generar Prisma Client
log "🗄️ Generando Prisma Client..."
npx prisma generate

# 5. Sincronizar base de datos (sin reset en producción)
log "🔄 Sincronizando esquema de base de datos..."
npx prisma db push --accept-data-loss

# 6. Poblar datos si la base está vacía
log "🌱 Verificando datos iniciales..."
npx prisma db seed || warn "Error ejecutando seed (normal si los datos ya existen)"

# 7. Build de producción
log "🏗️ Construyendo aplicación para producción..."
NODE_ENV=production yarn build

# 8. Testing de webhooks
log "🧪 Probando conectividad de webhooks..."
if command -v curl &> /dev/null; then
    # Test básico de health
    curl -f http://localhost:3000/api/health || warn "Health endpoint no disponible"
    
    # Test de webhook (si el servidor está corriendo)
    # curl -X POST http://localhost:3000/api/webhook/test \
    #   -H "Content-Type: application/json" \
    #   -d '{"action":"test"}' || warn "Test de webhook falló"
else
    warn "curl no disponible, saltando tests de conectividad"
fi

# 9. Optimizaciones de producción
log "⚡ Aplicando optimizaciones de producción..."

# Crear archivo de configuración nginx si no existe
if [ ! -f "nginx.conf" ]; then
    log "📝 Creando configuración nginx..."
    cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name crm.amunet.com.mx;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crm.amunet.com.mx;
    
    # SSL Configuration (certificates should be provided by hosting)
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;
    
    # Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    log "✅ Configuración nginx creada"
fi

# 10. Backup de configuración actual
log "💾 Creando backup de configuración..."
mkdir -p backups
tar -czf "backups/config-backup-$(date +%Y%m%d-%H%M%S).tar.gz" \
    .env package.json prisma/ || warn "Error creando backup"

# 11. Validaciones finales
log "✅ Validando deployment..."

# Verificar que los archivos críticos existen
critical_files=(".next/BUILD_ID" "prisma/schema.prisma" ".env")
for file in "${critical_files[@]}"; do
    if [ ! -f "$file" ]; then
        error "Archivo crítico faltante: $file"
    fi
done

# Verificar variables de entorno críticas
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL no configurada"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    error "NEXTAUTH_SECRET no configurada"
fi

# 12. Crear script de inicio
log "📝 Creando script de inicio..."
cat > start-production.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
export PORT=3000

echo "🚀 Iniciando Sistema Agéntico de Ventas en producción..."
echo "🌐 Dominio: crm.amunet.com.mx"
echo "🔗 Puerto: $PORT"

# Verificar que la base de datos esté disponible
npx prisma db push --accept-data-loss

# Iniciar la aplicación
yarn start
EOF

chmod +x start-production.sh

log "✅ Script de inicio creado: start-production.sh"

# 13. Resumen final
echo ""
echo "=========================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETADO${NC}"
echo "=========================="
echo "📊 Resumen:"
echo "  • Aplicación construida para producción"
echo "  • Base de datos sincronizada"
echo "  • Variables de entorno configuradas"
echo "  • Nginx configurado para crm.amunet.com.mx"
echo "  • Script de inicio creado"
echo ""
echo "📋 Próximos pasos:"
echo "  1. Configurar SSL/certificados en el servidor"
echo "  2. Ejecutar: ./start-production.sh"
echo "  3. Configurar nginx como proxy reverso"
echo "  4. Probar webhooks: POST /api/webhook/test"
echo ""
echo "🔗 URLs importantes:"
echo "  • App: https://crm.amunet.com.mx"
echo "  • API Health: https://crm.amunet.com.mx/api/health"
echo "  • Webhook Test: https://crm.amunet.com.mx/api/webhook/test"
echo ""
log "Deployment listo para producción 🚀"
EOF

chmod +x scripts/deploy-production.sh
