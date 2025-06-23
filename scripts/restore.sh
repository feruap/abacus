
#!/bin/bash

# Script de restauración para Sistema Agéntico de Ventas
set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Debes especificar el archivo de backup"
    echo "📋 Uso: ./scripts/restore.sh backup_file.sql"
    echo "📁 Backups disponibles:"
    ls -la ./backups/*.sql 2>/dev/null || echo "   No hay backups disponibles"
    exit 1
fi

BACKUP_FILE=$1
BACKUP_DIR="./backups"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Archivo de backup no encontrado: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Iniciando restauración desde: $BACKUP_FILE"

# Confirmar antes de proceder
read -p "⚠️  Esta operación reemplazará todos los datos actuales. ¿Continuar? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Restauración cancelada"
    exit 1
fi

# Detener la aplicación
echo "🛑 Deteniendo aplicación..."
docker-compose down

# Iniciar solo PostgreSQL
echo "🚀 Iniciando PostgreSQL..."
docker-compose up -d postgres

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 15

# Eliminar base de datos existente y recrear
echo "🗄️  Recreando base de datos..."
docker-compose exec postgres psql -U sistema_user -d postgres -c "DROP DATABASE IF EXISTS sistema_agentico;"
docker-compose exec postgres psql -U sistema_user -d postgres -c "CREATE DATABASE sistema_agentico;"

# Restaurar desde backup
echo "📥 Restaurando datos desde backup..."
docker-compose exec -T postgres psql -U sistema_user -d sistema_agentico < "$BACKUP_FILE"

# Reiniciar todos los servicios
echo "🚀 Reiniciando todos los servicios..."
docker-compose up -d

# Esperar a que la aplicación esté lista
echo "⏳ Esperando a que la aplicación esté lista..."
sleep 30

# Verificar que funcione
if curl -f http://localhost:3000/api/health &> /dev/null; then
    echo "✅ Restauración completada exitosamente!"
    echo "🌐 Aplicación disponible en: http://localhost:3000"
else
    echo "❌ Error en la restauración. Revisa los logs:"
    docker-compose logs app
    exit 1
fi

echo "🎉 Restauración completada!"
