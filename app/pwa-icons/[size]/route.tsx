import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeStr } = await params
  const size = Math.min(Math.max(parseInt(sizeStr) || 192, 16), 512)

  const fontSize   = Math.round(size * 0.38)
  const labelSize  = Math.round(size * 0.13)
  const gap        = Math.round(size * 0.03)
  const radius     = Math.round(size * 0.18)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#8B1A1A',
          borderRadius: radius,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap,
        }}
      >
        <span style={{ color: '#F7F3EC', fontSize, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1 }}>
          PP
        </span>
        {size >= 96 && (
          <span style={{ color: '#F7F3EC', fontSize: labelSize, fontWeight: 600, letterSpacing: '2px', opacity: 0.82 }}>
            PIDE PISTO
          </span>
        )}
      </div>
    ),
    { width: size, height: size }
  )
}
