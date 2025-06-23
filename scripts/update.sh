
#!/bin/bash

# Script de actualización para Sistema Agéntico de Ventas
set -e

echo "🔄 Iniciando actualización del Sistema Agéntico de Ventas..."

# Hacer backup antes de actualizar
echo "📦 Creando backup antes de la actualización..."
./scripts/backup.sh

# Detener servicios
echo "🛑 Deteniendo servicios..."
docker-compose down

# Rebuild de las imágenes
echo "🔨 Reconstruyendo imágenes..."
docker-compose build --no-cache

# Ejecutar migraciones pendientes
echo "🗄️  Ejecutando migraciones..."
docker-compose up -d postgres
sleep 15
docker-compose run --rm app npx prisma migrate deploy

# Reiniciar todos los servicios
echo "🚀 Reiniciando servicios..."
docker-compose up -d

# Verificar que funcione
echo "🔍 Verificando servicios..."
sleep 30

if curl -f http://localhost:3000/api/health &> /dev/null; then
    echo "✅ Actualización completada exitosamente!"
    echo "🌐 Aplicación disponible en: http://localhost:3000"
else
    echo "❌ Error en la actualización. Revisa los logs:"
    docker-compose logs app
    exit 1
fi

echo "🎉 Actualización completada!"
