-- Agregar campos de cupón al pedido
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS cupon_id uuid REFERENCES cupones(id),
  ADD COLUMN IF NOT EXISTS descuento_aplicado numeric(10,2);

-- Tabla de configuración del negocio (1 fila)
CREATE TABLE IF NOT EXISTS configuracion (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_negocio     text NOT NULL DEFAULT 'Pide Pisto',
  telefono_negocio   text,
  hora_apertura      time NOT NULL DEFAULT '10:00',
  hora_cierre        time NOT NULL DEFAULT '23:00',
  tiempo_entrega_min int  NOT NULL DEFAULT 30,
  pedido_minimo      numeric(10,2) NOT NULL DEFAULT 0,
  costo_envio        numeric(10,2) NOT NULL DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='configuracion' AND policyname='admin_todo_configuracion') THEN
    CREATE POLICY "admin_todo_configuracion" ON configuracion
      USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('super_admin','gerente')));
  END IF;
END $$;

-- Insertar fila inicial de configuración
INSERT INTO configuracion (nombre_negocio) VALUES ('Pide Pisto')
ON CONFLICT DO NOTHING;
