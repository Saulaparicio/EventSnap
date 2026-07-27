import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFile } from '@/lib/storage'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return Response.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() ?? 'png'
    const key = `organizations/${session.user.id}/logos/${timestamp}.${fileExtension}`

    const logoUrl = await uploadFile(key, buffer, file.type)

    return Response.json({ url: logoUrl }, { status: 200 })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return Response.json({ error: 'Error al subir el logo' }, { status: 500 })
  }
}
