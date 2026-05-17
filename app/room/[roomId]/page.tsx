import QRCode from 'qrcode'
import { supabase } from '@/app/lib/supabase'
import { notFound } from 'next/navigation'
import CopyButton from '@/app/components/CopyButton'
import PhotoGrid from './PhotoGrid'
import Logo from '@/app/components/Logo'
import ClusterGrid from '@/app/components/gallery/ClusterGrid'

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params

  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .eq('is_expired', false)
    .single()

  if (error || !room) notFound()

  // Fetch full photo objects — need id and public_id for delete feature
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

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Logo />
          <div className="text-xs text-gray-600 bg-gray-900 px-3 py-1.5 rounded-full">
            ⏳ Expires in 24h
          </div>
        </div>

        {/* QR Card */}
        <div className="bg-gray-900 rounded-2xl p-6 flex flex-col items-center gap-4 mb-8">
          <p className="text-sm text-gray-400 font-medium">
            Scan to join this room
          </p>
          <div className="bg-white p-3 rounded-xl shadow-lg">
            <img
              src={qrCodeDataUrl}
              alt="Room QR Code"
              width={160}
              height={160}
            />
          </div>
          <p className="text-xs text-gray-600 font-mono break-all text-center px-2">
            {roomUrl}
          </p>
          <CopyButton url={roomUrl} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-800" />
          <p className="text-xs text-gray-600">
            {photoList.length} photo{photoList.length !== 1 ? 's' : ''} shared
          </p>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Photos */}
        <ClusterGrid photos={photoList} roomId={roomId} />
        <PhotoGrid initialPhotos={photoList} roomId={roomId} />

      </div>
    </main>
  )
}