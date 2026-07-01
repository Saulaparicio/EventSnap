import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const org = await prisma.organization.findUnique({
          where: { email: credentials.email as string },
        })
        if (!org) return null

        const valid = await bcrypt.compare(credentials.password as string, org.password)
        if (!valid) return null

        return { id: org.id, email: org.email, name: org.name }
      },
    }),
  ],
})
