import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json()

  if (!name || !email || !password) {
    return Response.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  }

  const existing = await prisma.organization.findUnique({ where: { email } })
  if (existing) {
    return Response.json({ error: 'El email ya está registrado' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const org = await prisma.organization.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, plan: true },
  })

  return Response.json(org, { status: 201 })
}
