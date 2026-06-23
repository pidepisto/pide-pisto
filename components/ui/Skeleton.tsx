'use client'

export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ backgroundColor: 'oklch(0.88 0.02 75)', ...style }}
    />
  )
}

export function SkeletonPedidoCard() {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-4"
      style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}>
      <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton style={{ height: '0.875rem', width: '45%' }} />
        <Skeleton style={{ height: '0.75rem', width: '65%' }} />
      </div>
      <Skeleton style={{ height: '1.5rem', width: '3rem' }} />
    </div>
  )
}

export function SkeletonProductoCard() {
  return (
    <div className="rounded-2xl overflow-hidden flex-shrink-0" style={{ width: '9rem', backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}>
      <Skeleton style={{ height: '9rem', borderRadius: 0 }} />
      <div className="p-2.5 flex flex-col gap-1.5">
        <Skeleton style={{ height: '0.75rem', width: '80%' }} />
        <Skeleton style={{ height: '0.875rem', width: '40%' }} />
      </div>
    </div>
  )
}

export function SkeletonDetallePedido() {
  return (
    <div className="flex flex-col gap-5 px-4 py-6 max-w-2xl mx-auto">
      <Skeleton className="rounded-2xl" style={{ height: '5rem' }} />
      <Skeleton className="rounded-2xl" style={{ height: '7rem' }} />
      <Skeleton className="rounded-2xl" style={{ height: '4rem' }} />
      <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.03 70)' }}>
        <Skeleton style={{ height: '1rem', width: '40%' }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between">
            <Skeleton style={{ height: '0.875rem', width: '55%' }} />
            <Skeleton style={{ height: '0.875rem', width: '20%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
