// Change the room query — remove .eq('is_expired', false)
// so expired rooms still load for the recap

import QRCode from 'qrcode'
import { supabase } from '@/app/lib/supabase'
import { notFound } from 'next/navigation'
import CopyButton from '@/app/components/CopyButton'
import PhotoGrid from './PhotoGrid'
import Logo from '@/app/components/Logo'
import ClusterGrid from '@/app/components/gallery/ClusterGrid'
import Link from 'next/link'
import ShareButtons from '@/app/components/ShareButton'
// import ShareButtons from '@/app/components/ShareButtons'

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params

  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single() // ← removed is_expired filter

  if (error || !room) notFound()

  // Show recap page if room is expired
  if (room.is_expired) {
    return (
      <main className="min-h-screen bg-gray-950 text-white px-4 py-10 flex items-center justify-center">
        <div className="max-w-sm w-full mx-auto">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          {/* Recap Card */}
          <div className="bg-gray-900 rounded-3xl p-8 text-center">

            {/* Title */}
            <h1 className="text-xl font-bold mb-1">
              {room.title ?? 'Shared Moments'}
            </h1>
            <p className="text-xs text-gray-500 mb-6">This room has expired</p>

            {/* AI Recap */}
            {room.recap && (
              <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">
                "{room.recap}"
              </p>
            )}

            {/* Divider */}
            <div className="h-px bg-gray-800 mb-6" />

            {/* CTA */}
            <Link
              href="/"
              className="block w-full bg-white text-gray-950 font-semibold py-3 rounded-xl hover:bg-gray-100 transition text-sm"
            >
              Create a New Room
            </Link>
          </div>

          <p className="text-center text-xs text-gray-700 mt-6">
            Photos are permanently deleted after 24 hours
          </p>

        </div>
      </main>
    )
  }

  // Normal active room below — rest of your existing code unchanged
  const { data: photos } = await supabase
    .from('photos')
    .select('id, cloudinary_url, cloudinary_public_id')
    .eq('room_id', roomId)
    .order('uploaded_at', { ascending: false })

  const photoList = photos ?? []

  const roomUrl = `${process.env.NEXT_PUBLIC_APP_URL}/room/${roomId}`
  const qrCodeDataUrl = await QRCode.toDataURL(roomUrl, {
    width: 200,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Logo />
            {room.title && (
              <p className="text-xs text-gray-500 mt-1 ml-1">{room.title}</p>
            )}
          </div>
          <div className="text-xs text-gray-600 bg-gray-900 px-3 py-1.5 rounded-full">
            ⏳ Expires in 24h
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 flex flex-col items-center gap-4 mb-8">
          <p className="text-sm text-gray-400 font-medium">
            Scan to join this room
          </p>
          <div className="bg-white p-3 rounded-xl shadow-lg">
            <img src={qrCodeDataUrl} alt="Room QR Code" width={160} height={160} />
          </div>
          <p className="text-xs text-gray-600 font-mono break-all text-center px-2">
            {roomUrl}
          </p>
          <CopyButton url={roomUrl} />
          <ShareButtons url={roomUrl} title="Join my SnapShare room and upload photos!" />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-800" />
          <p className="text-xs text-gray-600">
            {photoList.length} photo{photoList.length !== 1 ? 's' : ''} shared
          </p>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <ClusterGrid photos={photoList} roomId={roomId} />
        <PhotoGrid initialPhotos={photoList} roomId={roomId} />
      </div>
    </main>
  )
}