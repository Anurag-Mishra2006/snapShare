'use client'

interface Props {
  qrDataUrl: string
  roomId: string
}

export default function QRDownloadButton({ qrDataUrl, roomId }: Props) {
  function handleDownload() {
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `snapshare-${roomId}.png`
    a.click()
  }

  return (
    <button
      onClick={handleDownload}
      className="text-xs text-gray-500 hover:text-white transition mt-1"
    >
      ↓ Save QR Code
    </button>
  )
}