CREATE TABLE IF NOT EXISTS banners (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo      text NOT NULL,
  subtitulo   text,
  badge_texto text,
  badge_color text DEFAULT '#CC2200',
  boton_texto text,
  boton_url   text,
  imagen_url  text,
  color_fondo text DEFAULT '#1a1a2e',
  color_texto text DEFAULT '#ffffff',
  activo      boolean DEFAULT true,
  orden       int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DO $b1$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='banners' AND policyname='banners_public_read') THEN
    CREATE POLICY "banners_public_read" ON banners FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='banners' AND policyname='banners_admin_write') THEN
    CREATE POLICY "banners_admin_write" ON banners FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND es_admin = true))
      WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND es_admin = true));
  END IF;
END $b1$;

INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

DO $b2$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='banners_img_public') THEN
    CREATE POLICY "banners_img_public" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='banners_img_admin') THEN
    CREATE POLICY "banners_img_admin" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'banners' AND EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND es_admin = true));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='banners_img_admin_u') THEN
    CREATE POLICY "banners_img_admin_u" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'banners' AND EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND es_admin = true));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='banners_img_admin_d') THEN
    CREATE POLICY "banners_img_admin_d" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'banners' AND EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND es_admin = true));
  END IF;
END $b2$;
