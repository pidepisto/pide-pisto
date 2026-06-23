INSERT INTO storage.buckets (id, name, public)
VALUES ('categorias', 'categorias', true)
ON CONFLICT (id) DO NOTHING;

DO $b1$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='cat_img_insert') THEN
    CREATE POLICY "cat_img_insert" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'categorias' AND EXISTS (
        SELECT 1 FROM perfiles WHERE id = auth.uid() AND es_admin = true
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='cat_img_update') THEN
    CREATE POLICY "cat_img_update" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'categorias' AND EXISTS (
        SELECT 1 FROM perfiles WHERE id = auth.uid() AND es_admin = true
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='cat_img_delete') THEN
    CREATE POLICY "cat_img_delete" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'categorias' AND EXISTS (
        SELECT 1 FROM perfiles WHERE id = auth.uid() AND es_admin = true
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='cat_img_public') THEN
    CREATE POLICY "cat_img_public" ON storage.objects FOR SELECT
      USING (bucket_id = 'categorias');
  END IF;
END $b1$;
