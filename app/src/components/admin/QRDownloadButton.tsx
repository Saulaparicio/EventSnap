'use client'

interface Props {
  eventId: string
  slug: string
}

export default function QRDownloadButton({ eventId, slug }: Props) {
  const filename = `qr-${slug}.png`
  const href = `/api/admin/events/${eventId}/qr/${filename}`

  return (
    <a
      href={href}
      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#f6f3f5] transition-colors border border-[#e5e3dc] text-center w-full"
    >
      <span className="material-symbols-outlined text-md text-black">qr_code</span>
      <span className="text-[9px] font-bold text-[#45464d]">Código QR</span>
    </a>
  )
}
