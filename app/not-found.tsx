import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 text-center gap-6"
      style={{ backgroundColor: 'oklch(0.97 0.012 82)' }}
    >
      <div>
        <p style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: 'clamp(5rem, 25vw, 9rem)',
          letterSpacing: '0.06em',
          lineHeight: 1,
          color: 'oklch(0.50 0.22 24)',
        }}>
          404
        </p>
        <p style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: 'clamp(1.4rem, 5vw, 2rem)',
          letterSpacing: '0.04em',
          color: 'oklch(0.2 0.03 30)',
          marginTop: '-0.25rem',
        }}>
          Página no encontrada
        </p>
        <p className="text-sm mt-2 max-w-xs mx-auto" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
          Lo que buscas se fue de parranda. Regresa al catálogo.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <Link href="/catalogo" className="w-full">
          <button
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]"
            style={{ backgroundColor: 'oklch(0.50 0.22 24)', color: 'oklch(0.97 0.012 82)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Ir al catálogo
          </button>
        </Link>
        <Link href="/" className="text-sm font-medium" style={{ color: 'oklch(0.55 0.02 40)', fontFamily: 'var(--font-dm-sans)' }}>
          Inicio
        </Link>
      </div>
    </div>
  )
}
