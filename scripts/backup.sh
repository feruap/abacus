
#!/bin/bash

# Script de backup para Sistema Agéntico de Ventas
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="sistema_agentico_backup_$TIMESTAMP"

echo "📦 Iniciando backup del Sistema Agéntico de Ventas..."

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Backup de la base de datos
echo "🗄️  Haciendo backup de la base de datos..."
docker-compose exec -T postgres pg_dump -U sistema_user sistema_agentico > "$BACKUP_DIR/${BACKUP_NAME}.sql"

# Backup de archivos de configuración
echo "📁 Haciendo backup de archivos de configuración..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" \
    .env \
    docker-compose.yml \
    nginx.conf \
    prisma/schema.prisma

# Backup de volúmenes de Docker (opcional)
echo "💾 Haciendo backup de volúmenes..."
docker run --rm -v sistema_agentico_postgres_data:/data -v $PWD/$BACKUP_DIR:/backup alpine tar -czf /backup/${BACKUP_NAME}_postgres_volume.tar.gz -C /data .
docker run --rm -v sistema_agentico_redis_data:/data -v $PWD/$BACKUP_DIR:/backup alpine tar -czf /backup/${BACKUP_NAME}_redis_volume.tar.gz -C /data .

echo "✅ Backup completado en: $BACKUP_DIR"
echo "📋 Archivos creados:"
echo "   - ${BACKUP_NAME}.sql (base de datos)"
echo "   - ${BACKUP_NAME}_config.tar.gz (configuración)"
echo "   - ${BACKUP_NAME}_postgres_volume.tar.gz (volumen PostgreSQL)"
echo "   - ${BACKUP_NAME}_redis_volume.tar.gz (volumen Redis)"

# Limpiar backups antiguos (mantener solo los últimos 7 días)
echo "🧹 Limpiando backups antiguos..."
find $BACKUP_DIR -name "sistema_agentico_backup_*" -mtime +7 -delete

echo "🎉 Backup completado exitosamente!"
