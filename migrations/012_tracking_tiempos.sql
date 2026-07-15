-- Tracking de tiempos por estado del pedido (para "en camino desde hace X min")
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS confirmado_en    timestamptz,
  ADD COLUMN IF NOT EXISTS en_camino_desde  timestamptz,
  ADD COLUMN IF NOT EXISTS entregado_en     timestamptz;

-- Tiempo estimado de entrega por zona (override del global en `configuracion`)
ALTER TABLE zonas
  ADD COLUMN IF NOT EXISTS tiempo_entrega_min int;
