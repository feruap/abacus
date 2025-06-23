
#!/bin/bash

# Script de deployment para Sistema Agéntico de Ventas
set -e

echo "🚀 Iniciando deployment del Sistema Agéntico de Ventas..."

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado. Copiando desde .env.example..."
    cp .env.example .env
    echo "📝 Por favor edita el archivo .env con tus configuraciones antes de continuar."
    echo "🔑 Variables importantes a configurar:"
    echo "   - ABACUSAI_API_KEY"
    echo "   - MYALICE_API_KEY"
    echo "   - WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET"
    echo "   - NEXTAUTH_SECRET (genera uno seguro)"
    echo "   - Cambia las contraseñas por defecto"
    read -p "Presiona Enter cuando hayas configurado el archivo .env..."
fi

# Limpiar containers previos
echo "🧹 Limpiando containers previos..."
docker-compose down --remove-orphans || true

# Construir las imágenes
echo "🔨 Construyendo imágenes Docker..."
docker-compose build --no-cache

# Iniciar los servicios
echo "🚀 Iniciando servicios..."
docker-compose up -d

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 30

# Ejecutar migraciones de base de datos
echo "🗄️  Ejecutando migraciones de base de datos..."
docker-compose exec app npx prisma migrate deploy || echo "⚠️  Las migraciones pueden fallar en el primer intento"

# Generar cliente Prisma
echo "🔧 Generando cliente Prisma..."
docker-compose exec app npx prisma generate

# Ejecutar seed de la base de datos
echo "🌱 Ejecutando seed de la base de datos..."
docker-compose exec app npx prisma db seed || echo "⚠️  El seed puede fallar si ya hay datos"

# Verificar que los servicios estén funcionando
echo "🔍 Verificando servicios..."
sleep 10

if curl -f http://localhost:3000/api/health &> /dev/null; then
    echo "✅ Aplicación desplegada exitosamente!"
    echo "🌐 Accede a la aplicación en: http://localhost:3000"
    echo "📊 Logs en tiempo real: docker-compose logs -f"
    echo "🛑 Para detener: docker-compose down"
else
    echo "❌ Error en el deployment. Revisa los logs:"
    docker-compose logs app
    exit 1
fi

echo "🎉 Deployment completado!"
