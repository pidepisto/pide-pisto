import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pide Pisto',
    short_name: 'Pide Pisto',
    description: 'Cerveza, vinos y destilados a domicilio en Chalco e Ixtapaluca, Estado de México.',
    start_url: '/catalogo',
    display: 'standalone',
    background_color: '#F7F3EC',
    theme_color: '#8B1A1A',
    orientation: 'portrait',
    lang: 'es-MX',
    scope: '/',
    categories: ['food', 'shopping'],
    icons: [
      { src: '/pwa-icons/72',  sizes: '72x72',   type: 'image/png', purpose: 'any' },
      { src: '/pwa-icons/96',  sizes: '96x96',   type: 'image/png', purpose: 'any' },
      { src: '/pwa-icons/128', sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icons/144', sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icons/152', sizes: '152x152', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icons/192', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/pwa-icons/384', sizes: '384x384', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Catálogo',
        short_name: 'Catálogo',
        description: 'Ver todos los productos',
        url: '/catalogo',
        icons: [{ src: '/pwa-icons/96', sizes: '96x96' }],
      },
      {
        name: 'Mis pedidos',
        short_name: 'Pedidos',
        description: 'Ver mis pedidos',
        url: '/pedidos',
        icons: [{ src: '/pwa-icons/96', sizes: '96x96' }],
      },
    ],
  }
}
