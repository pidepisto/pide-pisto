import Link from 'next/link'
import { ChevronLeft, FileText } from 'lucide-react'

export const metadata = { title: 'Términos y Condiciones — Pide Pisto' }

const RED = 'oklch(0.50 0.22 24)'
const BG  = 'oklch(0.97 0.012 82)'

export default function TerminosPage() {
  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh' }}>
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <Link href="/cuenta">
          <button className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ border: '1px solid oklch(0.88 0.03 70)', backgroundColor: 'oklch(1 0 0)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: 'oklch(0.35 0.03 30)' }} />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" style={{ color: RED }} />
          <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
            Términos y Condiciones
          </h1>
        </div>
      </div>

      <div className="px-4 pb-32 max-w-2xl mx-auto">
        <div className="rounded-2xl p-6 flex flex-col gap-6"
          style={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.02 75)' }}>

          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.8rem', color: 'oklch(0.55 0.02 40)' }}>
            Última actualización: junio 2025
          </p>

          {[
            {
              titulo: '1. Aceptación de los términos',
              contenido: `Al acceder y utilizar la plataforma Pide Pisto (en adelante "la Plataforma"), disponible en pidepisto.com, aceptas quedar obligado por estos Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, te pedimos que no utilices la Plataforma.`,
            },
            {
              titulo: '2. Mayoría de edad',
              contenido: `Pide Pisto es un servicio de venta y entrega de bebidas alcohólicas. De conformidad con las leyes de los Estados Unidos Mexicanos, la venta de alcohol a personas menores de 18 años está estrictamente prohibida. Al usar la Plataforma confirmas que tienes 18 años o más. Nos reservamos el derecho de solicitar identificación oficial en el momento de la entrega y cancelar el pedido si el comprador es menor de edad, sin reembolso.`,
            },
            {
              titulo: '3. Descripción del servicio',
              contenido: `Pide Pisto ofrece un servicio de entrega a domicilio de bebidas alcohólicas en las zonas de Chalco e Ixtapaluca, Estado de México. Los pedidos están sujetos a disponibilidad de productos y cobertura geográfica. Los horarios de servicio, precios y zonas pueden cambiar sin previo aviso.`,
            },
            {
              titulo: '4. Registro y cuenta',
              contenido: `Para realizar pedidos puedes hacerlo como invitado o creando una cuenta. Al registrarte, eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran en tu cuenta. Pide Pisto no será responsable por el uso no autorizado de tu cuenta.`,
            },
            {
              titulo: '5. Pedidos y pagos',
              contenido: `Al realizar un pedido aceptas pagar el precio indicado más cualquier cargo de envío aplicable. Los precios están expresados en pesos mexicanos (MXN) e incluyen IVA. Actualmente aceptamos pago en efectivo al momento de la entrega. Nos reservamos el derecho de cancelar pedidos en caso de error en precios o disponibilidad.`,
            },
            {
              titulo: '6. Entregas',
              contenido: `Los tiempos de entrega son estimados y pueden variar según la demanda, condiciones climáticas o situaciones fuera de nuestro control. No garantizamos tiempos exactos de entrega. El cliente es responsable de proporcionar una dirección correcta y estar disponible para recibir su pedido.`,
            },
            {
              titulo: '7. Cancelaciones y devoluciones',
              contenido: `Puedes cancelar tu pedido dentro de los primeros 5 minutos de haberlo realizado, siempre que no haya sido confirmado por el repartidor. Una vez que el pedido está en camino, no se aceptan cancelaciones. Si recibes un producto dañado o incorrecto, contáctanos por WhatsApp dentro de las 24 horas siguientes a la entrega.`,
            },
            {
              titulo: '8. Conducta del usuario',
              contenido: `Te comprometes a usar la Plataforma únicamente para fines legales y de conformidad con estos términos. Queda prohibido usar la Plataforma para actividades fraudulentas, proporcionar información falsa o interferir con el funcionamiento del servicio.`,
            },
            {
              titulo: '9. Limitación de responsabilidad',
              contenido: `Pide Pisto no será responsable por daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la Plataforma. Nuestra responsabilidad máxima se limita al monto del pedido involucrado.`,
            },
            {
              titulo: '10. Modificaciones',
              contenido: `Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios entrarán en vigor al ser publicados en la Plataforma. El uso continuado del servicio después de los cambios constituye tu aceptación de los nuevos términos.`,
            },
            {
              titulo: '11. Contacto',
              contenido: `Para cualquier duda sobre estos Términos y Condiciones, contáctanos a través de WhatsApp o al correo hola@pidepisto.com.`,
            },
          ].map(({ titulo, contenido }) => (
            <div key={titulo}>
              <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: RED, marginBottom: '0.5rem' }}>
                {titulo}
              </h2>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)', lineHeight: 1.7 }}>
                {contenido}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
