-- Políticas admin para pedidos, perfiles y pedido_items (idempotente)

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pedidos' AND policyname='admin_lee_pedidos') THEN
    CREATE POLICY "admin_lee_pedidos" ON pedidos FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM perfiles
        WHERE id = auth.uid() AND rol IN ('super_admin','gerente','inventario','repartidor')
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pedidos' AND policyname='admin_actualiza_pedidos') THEN
    CREATE POLICY "admin_actualiza_pedidos" ON pedidos FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM perfiles
        WHERE id = auth.uid() AND rol IN ('super_admin','gerente','repartidor')
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='perfiles' AND policyname='admin_lee_perfiles') THEN
    CREATE POLICY "admin_lee_perfiles" ON perfiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM perfiles p2
          WHERE p2.id = auth.uid() AND p2.rol IN ('super_admin','gerente','inventario')
        )
        OR id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pedido_items' AND policyname='admin_lee_pedido_items') THEN
    CREATE POLICY "admin_lee_pedido_items" ON pedido_items FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM perfiles
        WHERE id = auth.uid() AND rol IN ('super_admin','gerente','inventario','repartidor')
      ));
  END IF;
END $$;
