import CuentaSidebar from '@/components/tienda/CuentaSidebar'

const BG = 'oklch(0.97 0.012 82)'

export default function PedidosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      <div className="md:max-w-5xl md:mx-auto">
        <div className="md:grid md:grid-cols-[280px_1fr] md:gap-8 md:px-4 md:py-6 md:pb-10">
          <div className="hidden md:block md:sticky md:top-20">
            <CuentaSidebar />
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}
