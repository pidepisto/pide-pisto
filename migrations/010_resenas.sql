CREATE TABLE IF NOT EXISTS resenas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id   uuid NOT NULL UNIQUE REFERENCES pedidos(id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estrellas   int NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario  text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;

DO $b1$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='resenas' AND policyname='resenas_own_insert') THEN
    CREATE POLICY "resenas_own_insert" ON resenas FOR INSERT TO authenticated
      WITH CHECK (usuario_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='resenas' AND policyname='resenas_own_select') THEN
    CREATE POLICY "resenas_own_select" ON resenas FOR SELECT TO authenticated
      USING (usuario_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='resenas' AND policyname='resenas_admin_select') THEN
    CREATE POLICY "resenas_admin_select" ON resenas FOR SELECT TO authenticated
      USING (auth_is_admin());
  END IF;
END $b1$;
