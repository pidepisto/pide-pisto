export type Banner = {
  id: string
  titulo: string
  subtitulo: string | null
  badge_texto: string | null
  badge_color: string
  boton_texto: string | null
  boton_url: string | null
  imagen_url: string | null
  color_fondo: string
  color_texto: string
  activo: boolean
  orden: number
  created_at: string
}

export type Zona = {
  id: string
  nombre: string
  activa: boolean
  costo_envio: number
  envio_gratis_desde: number | null
  created_at: string
}

export type Categoria = {
  id: string
  nombre: string
  slug: string
  imagen_url: string | null
  orden: number
  created_at: string
}

export type Producto = {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  precio_promocion: number | null
  imagen_url: string | null
  categoria_id: string
  categoria?: Categoria
  stock: number
  activo: boolean
  created_at: string
}

export type RolUsuario = 'cliente' | 'repartidor' | 'inventario' | 'gerente' | 'super_admin'

export type Perfil = {
  id: string
  nombre: string | null
  telefono: string | null
  fecha_nacimiento: string | null
  genero: 'masculino' | 'femenino' | 'no_binario' | 'por_definir' | null
  avatar_url: string | null
  es_admin: boolean
  rol: RolUsuario
  created_at: string
}

export type Cupon = {
  id: string
  codigo: string
  descripcion: string | null
  tipo: 'porcentaje' | 'fijo'
  valor: number
  minimo_compra: number
  limite_usos: number | null
  usos_actuales: number
  activo: boolean
  fecha_inicio: string
  fecha_fin: string | null
  created_at: string
}

export type EstadoPedido = 'pendiente' | 'confirmado' | 'en_camino' | 'entregado' | 'cancelado'

export type Pedido = {
  id: string
  usuario_id: string
  zona_id: string
  zona?: Zona
  direccion: string
  total: number
  costo_envio: number
  estado: EstadoPedido
  metodo_pago: string | null
  notas: string | null
  items?: PedidoItem[]
  created_at: string
  confirmado_en?: string | null
  en_camino_desde?: string | null
  entregado_en?: string | null
}

export type PedidoItem = {
  id: string
  pedido_id: string
  producto_id: string
  producto?: Producto
  cantidad: number
  precio_unitario: number
}

export type ItemCarrito = {
  producto: Producto
  cantidad: number
}
