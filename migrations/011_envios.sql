-- Costo de envío y envío gratis por zona
ALTER TABLE zonas
  ADD COLUMN IF NOT EXISTS costo_envio       numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS envio_gratis_desde numeric(10,2) DEFAULT NULL;

-- Guardar cuánto se cobró de envío en cada pedido
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS costo_envio numeric(10,2) NOT NULL DEFAULT 0;
