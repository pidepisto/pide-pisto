-- ─────────────────────────────────────────────
-- Schema base de Pide Pisto (idempotente)
-- ─────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Zonas de cobertura ──────────────────────
CREATE TABLE IF NOT EXISTS zonas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL UNIQUE,
  activa     boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='zonas' AND policyname='zonas_public_read') THEN
    CREATE POLICY "zonas_public_read" ON zonas FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='zonas' AND policyname='zonas_admin_write') THEN
    CREATE POLICY "zonas_admin_write" ON zonas FOR ALL TO authenticated
      USING (auth_is_admin()) WITH CHECK (auth_is_admin());
  END IF;
END $$;

-- ── Tipo enum rol ────────────────────────────
DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM ('cliente','repartidor','inventario','gerente','super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Perfiles ─────────────────────────────────
CREATE TABLE IF NOT EXISTS perfiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre            text,
  telefono          text,
  fecha_nacimiento  date,
  genero            text CHECK (genero IN ('masculino','femenino','no_binario','por_definir')),
  avatar_url        text,
  es_admin          boolean NOT NULL DEFAULT false,
  rol               rol_usuario NOT NULL DEFAULT 'cliente',
  created_at        timestamptz DEFAULT now()
);
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='perfiles' AND policyname='perfiles_own') THEN
    CREATE POLICY "perfiles_own" ON perfiles FOR ALL TO authenticated
      USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='perfiles' AND policyname='admin_escribe_perfiles') THEN
    CREATE POLICY "admin_escribe_perfiles" ON perfiles FOR ALL TO authenticated
      USING (auth_is_admin()) WITH CHECK (auth_is_admin());
  END IF;
END $$;

-- Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nombre')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función helper admin (sin recursión RLS)
CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() AND es_admin = true
  );
$$;

-- ── Categorías ───────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL,
  slug       text NOT NULL UNIQUE,
  imagen_url text,
  orden      int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categorias' AND policyname='categorias_public_read') THEN
    CREATE POLICY "categorias_public_read" ON categorias FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categorias' AND policyname='categorias_admin_write') THEN
    CREATE POLICY "categorias_admin_write" ON categorias FOR ALL TO authenticated
      USING (auth_is_admin()) WITH CHECK (auth_is_admin());
  END IF;
END $$;

-- ── Productos ────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL,
  descripcion   text,
  precio        numeric(10,2) NOT NULL CHECK (precio >= 0),
  precio_oferta numeric(10,2) CHECK (precio_oferta > 0),
  imagen_url    text,
  categoria_id  uuid NOT NULL REFERENCES categorias(id),
  stock         int NOT NULL DEFAULT 0,
  activo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='productos' AND policyname='productos_public_read') THEN
    CREATE POLICY "productos_public_read" ON productos FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='productos' AND policyname='productos_admin_write') THEN
    CREATE POLICY "productos_admin_write" ON productos FOR ALL TO authenticated
      USING (auth_is_admin()) WITH CHECK (auth_is_admin());
  END IF;
END $$;

-- ── Cupones ──────────────────────────────────
CREATE TABLE IF NOT EXISTS cupones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo        text NOT NULL UNIQUE,
  descripcion   text,
  tipo          text NOT NULL CHECK (tipo IN ('porcentaje','fijo')),
  valor         numeric(10,2) NOT NULL,
  minimo_compra numeric(10,2) NOT NULL DEFAULT 0,
  limite_usos   int,
  usos_actuales int NOT NULL DEFAULT 0,
  activo        boolean NOT NULL DEFAULT true,
  fecha_inicio  date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin     date,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cupones' AND policyname='cupones_public_read') THEN
    CREATE POLICY "cupones_public_read" ON cupones FOR SELECT USING (activo = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cupones' AND policyname='cupones_admin_write') THEN
    CREATE POLICY "cupones_admin_write" ON cupones FOR ALL TO authenticated
      USING (auth_is_admin()) WITH CHECK (auth_is_admin());
  END IF;
END $$;

-- ── Pedidos ──────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id         uuid NOT NULL REFERENCES auth.users(id),
  zona_id            uuid REFERENCES zonas(id),
  repartidor_id      uuid REFERENCES perfiles(id),
  direccion          text NOT NULL,
  total              numeric(10,2) NOT NULL,
  estado             text NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente','confirmado','en_camino','entregado','cancelado')),
  metodo_pago        text,
  notas              text,
  cupon_id           uuid REFERENCES cupones(id),
  descuento_aplicado numeric(10,2),
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pedidos' AND policyname='pedidos_own') THEN
    CREATE POLICY "pedidos_own" ON pedidos FOR ALL TO authenticated
      USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
  END IF;
END $$;

-- ── Pedido items ─────────────────────────────
CREATE TABLE IF NOT EXISTS pedido_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     uuid NOT NULL REFERENCES productos(id),
  cantidad        int NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(10,2) NOT NULL,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pedido_items' AND policyname='items_own') THEN
    CREATE POLICY "items_own" ON pedido_items FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM pedidos WHERE id = pedido_id AND usuario_id = auth.uid()));
  END IF;
END $$;

-- ── Direcciones ──────────────────────────────
CREATE TABLE IF NOT EXISTS direcciones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias        text NOT NULL DEFAULT 'Casa',
  calle        text NOT NULL,
  numero       text NOT NULL,
  colonia      text NOT NULL,
  cp           text NOT NULL,
  zona         text NOT NULL,
  referencia   text,
  es_principal boolean NOT NULL DEFAULT false,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE direcciones ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='direcciones' AND policyname='direcciones_own') THEN
    CREATE POLICY "direcciones_own" ON direcciones FOR ALL TO authenticated
      USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
  END IF;
END $$;
