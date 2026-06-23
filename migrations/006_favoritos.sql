CREATE TABLE IF NOT EXISTS favoritos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  producto_id uuid REFERENCES productos(id)  ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (usuario_id, producto_id)
);

ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='favoritos' AND policyname='fav_select') THEN
    CREATE POLICY "fav_select" ON favoritos FOR SELECT TO authenticated USING (usuario_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='favoritos' AND policyname='fav_insert') THEN
    CREATE POLICY "fav_insert" ON favoritos FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='favoritos' AND policyname='fav_delete') THEN
    CREATE POLICY "fav_delete" ON favoritos FOR DELETE TO authenticated USING (usuario_id = auth.uid());
  END IF;
END $$;
