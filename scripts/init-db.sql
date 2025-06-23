
-- Script de inicialización de base de datos para PostgreSQL
-- Sistema Agéntico de Ventas

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Crear índices adicionales para optimización
-- (Prisma manejará las tablas principales)

-- Configurar timezone por defecto
SET timezone = 'America/Mexico_City';

-- Crear usuario adicional para backups (opcional)
-- CREATE USER backup_user WITH PASSWORD 'backup_password_here';
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;

-- Configuraciones de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;

-- Configurar logging para desarrollo/debug
ALTER SYSTEM SET log_min_messages = 'warning';
ALTER SYSTEM SET log_min_error_statement = 'error';

SELECT 'Database initialized successfully for Sistema Agéntico de Ventas' as status;
