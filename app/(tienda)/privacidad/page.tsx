import Link from 'next/link'
import { ChevronLeft, Shield } from 'lucide-react'

export const metadata = { title: 'Política de Privacidad — Pide Pisto' }

const RED = 'oklch(0.50 0.22 24)'
const BG  = 'oklch(0.97 0.012 82)'

export default function PrivacidadPage() {
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
          <Shield className="h-5 w-5" style={{ color: RED }} />
          <h1 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', letterSpacing: '0.05em', color: 'oklch(0.2 0.03 30)' }}>
            Política de Privacidad
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
              titulo: '1. Responsable del tratamiento',
              contenido: `Pide Pisto (en adelante "nosotros") es el responsable del tratamiento de los datos personales que recopilamos a través de pidepisto.com. Operamos en Chalco e Ixtapaluca, Estado de México, México.`,
            },
            {
              titulo: '2. Datos que recopilamos',
              contenido: `Recopilamos la siguiente información cuando usas nuestra Plataforma:\n\n• Datos de registro: nombre, correo electrónico, contraseña (cifrada), teléfono, fecha de nacimiento y género.\n• Direcciones de entrega: calle, número, colonia, código postal y referencias.\n• Datos de pedidos: productos solicitados, monto, historial de compras y estado de entrega.\n• Datos técnicos: dirección IP, tipo de dispositivo, navegador y páginas visitadas.\n• Preferencias: favoritos, notificaciones activadas.`,
            },
            {
              titulo: '3. Finalidad del tratamiento',
              contenido: `Utilizamos tus datos para:\n\n• Procesar y entregar tus pedidos.\n• Verificar tu mayoría de edad (obligatorio por ley).\n• Enviarte notificaciones sobre el estado de tu pedido.\n• Mejorar nuestros productos y servicios.\n• Enviarte promociones y ofertas (solo si lo autorizas).\n• Cumplir con obligaciones legales y fiscales.`,
            },
            {
              titulo: '4. Base legal',
              contenido: `El tratamiento de tus datos se basa en: (a) la ejecución del contrato de compraventa que celebras al realizar un pedido; (b) tu consentimiento para el envío de comunicaciones comerciales; (c) el cumplimiento de obligaciones legales, en particular la verificación de mayoría de edad establecida en la Ley General de Salud.`,
            },
            {
              titulo: '5. Compartición de datos',
              contenido: `No vendemos ni rentamos tus datos personales a terceros. Podemos compartir información con:\n\n• Repartidores: nombre y dirección para realizar la entrega.\n• Proveedores de tecnología: Supabase (base de datos y autenticación), Vercel (hosting). Todos bajo acuerdos de confidencialidad.\n• Autoridades: cuando lo exija la ley.`,
            },
            {
              titulo: '6. Almacenamiento y seguridad',
              contenido: `Tus datos se almacenan en servidores seguros con cifrado en tránsito (TLS) y en reposo. Las contraseñas se almacenan de forma cifrada y nunca en texto plano. Implementamos medidas técnicas y organizativas para proteger tu información contra acceso no autorizado.`,
            },
            {
              titulo: '7. Retención de datos',
              contenido: `Conservamos tus datos mientras tengas una cuenta activa o sea necesario para prestarte el servicio. Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento. Los datos de pedidos pueden retenerse hasta 5 años por obligaciones fiscales.`,
            },
            {
              titulo: '8. Tus derechos (ARCO)',
              contenido: `De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), tienes derecho a:\n\n• Acceso: conocer qué datos tenemos sobre ti.\n• Rectificación: corregir datos incorrectos.\n• Cancelación: eliminar tus datos cuando ya no sean necesarios.\n• Oposición: oponerte al tratamiento de tus datos.\n\nEjerce tus derechos escribiéndonos a hola@pidepisto.com con el asunto "Derechos ARCO".`,
            },
            {
              titulo: '9. Cookies',
              contenido: `Utilizamos cookies técnicas necesarias para el funcionamiento de la Plataforma (sesión, preferencias) y cookies analíticas para entender cómo se usa el servicio. No utilizamos cookies de rastreo publicitario de terceros.`,
            },
            {
              titulo: '10. Notificaciones push',
              contenido: `Si autorizas las notificaciones push, almacenamos un token de suscripción en nuestros servidores para enviarte avisos sobre tus pedidos y, si lo consientes, sobre promociones. Puedes revocar este permiso desde la configuración de tu navegador o desde la sección de Notificaciones en la app en cualquier momento.`,
            },
            {
              titulo: '11. Cambios a esta política',
              contenido: `Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre cambios significativos a través de la Plataforma. El uso continuado del servicio implica la aceptación de la política actualizada.`,
            },
            {
              titulo: '12. Contacto',
              contenido: `Si tienes preguntas sobre cómo manejamos tus datos, contáctanos:\n\n• Correo: hola@pidepisto.com\n• WhatsApp: disponible en la sección de Ayuda\n• Dominio: pidepisto.com`,
            },
          ].map(({ titulo, contenido }) => (
            <div key={titulo}>
              <h2 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.1rem', letterSpacing: '0.04em', color: RED, marginBottom: '0.5rem' }}>
                {titulo}
              </h2>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'oklch(0.35 0.03 30)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {contenido}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
