-- ─────────────────────────────────────────────
-- Columnas adicionales (idempotente con IF NOT EXISTS)
-- ─────────────────────────────────────────────

-- Repartidor asignado a un pedido
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS repartidor_id uuid REFERENCES perfiles(id),
  ADD COLUMN IF NOT EXISTS cupon_id uuid REFERENCES cupones(id),
  ADD COLUMN IF NOT EXISTS descuento_aplicado numeric(10,2);

-- Precio de oferta en productos
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_oferta numeric(10,2) CHECK (precio_oferta > 0);

-- Campos extra en perfiles
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
  ADD COLUMN IF NOT EXISTS genero text CHECK (genero IN ('masculino','femenino','no_binario','por_definir')),
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Política admin en perfiles (si no existe)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='perfiles' AND policyname='admin_escribe_perfiles') THEN
    CREATE POLICY "admin_escribe_perfiles" ON perfiles FOR ALL TO authenticated
      USING (auth_is_admin()) WITH CHECK (auth_is_admin());
  END IF;
END $$;
