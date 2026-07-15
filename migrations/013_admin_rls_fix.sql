-- Fix: política RLS de pedidos para admins con es_admin=true pero rol='cliente'
-- La política antigua chequeaba `rol IN ('gerente','super_admin')`, lo que excluía
-- a usuarios con es_admin=true y rol='cliente'.
-- La función auth_is_admin() ya existe y revisa es_admin=true.

DROP POLICY IF EXISTS admin_lee_pedidos    ON pedidos;
DROP POLICY IF EXISTS admin_escribe_pedidos ON pedidos;

CREATE POLICY admin_lee_pedidos
  ON pedidos FOR SELECT
  USING (auth_is_admin());

CREATE POLICY admin_escribe_pedidos
  ON pedidos FOR UPDATE
  USING (auth_is_admin());
