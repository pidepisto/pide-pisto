-- Agregar columna mp_access_token a configuracion
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS mp_access_token TEXT;
