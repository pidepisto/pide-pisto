CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint    text NOT NULL,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (usuario_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='push_insert') THEN
    CREATE POLICY "push_insert" ON push_subscriptions FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='push_delete') THEN
    CREATE POLICY "push_delete" ON push_subscriptions FOR DELETE TO authenticated USING (usuario_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='push_select_own') THEN
    CREATE POLICY "push_select_own" ON push_subscriptions FOR SELECT TO authenticated USING (usuario_id = auth.uid());
  END IF;
END $$;
