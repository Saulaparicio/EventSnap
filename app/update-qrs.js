const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const QRCode = require('qrcode')
const dotenv = require('dotenv')

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) {
    console.error('Error: NEXT_PUBLIC_APP_URL no está definido en .env.local')
    process.exit(1)
  }

  console.log(`Regenerando códigos QR usando la URL base: ${baseUrl}\n`)

  const events = await prisma.event.findMany()
  console.log(`Se encontraron ${events.length} eventos en la base de datos.`)

  for (const event of events) {
    const eventUrl = `${baseUrl}/e/${event.slug}`
    const qrCodeUrl = await QRCode.toDataURL(eventUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })

    await prisma.event.update({
      where: { id: event.id },
      data: { qrCodeUrl },
    })

    console.log(`✓ QR actualizado para: "${event.name}" (URL: ${eventUrl})`)
  }

  console.log('\nTodos los códigos QR fueron actualizados con éxito.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
