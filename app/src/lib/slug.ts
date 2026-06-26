import { prisma } from '@/lib/db'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function uniqueSlug(base: string): Promise<string> {
  const slug = slugify(base)
  const existing = await prisma.event.findUnique({ where: { slug } })
  if (!existing) return slug
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${slug}-${suffix}`
}
