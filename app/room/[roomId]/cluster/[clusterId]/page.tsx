import { supabase } from '@/app/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClusterPhotoGrid from './ClusterPhotoGrid' 

interface Props {
  params: Promise<{ roomId: string; clusterId: string }>
}

export default async function ClusterPage({ params }: Props) {
  const { roomId, clusterId } = await params

  const { data: cluster, error } = await supabase
    .from('clusters')
    .select('*')
    .eq('id', clusterId)
    .eq('room_id', roomId)
    .single()

  if (error || !cluster) notFound()

  const photoUrls: string[] = cluster.photo_ids ?? []

  // Fetch full photo objects matching those URLs
  const { data: photos } = await supabase
    .from('photos')
    .select('id, cloudinary_url, cloudinary_public_id')
    .in('cloudinary_url', photoUrls)
    .eq('room_id', roomId)

  const photoList = photos ?? []

  // Empty state — cluster exists but photos were deleted
  if (photoList.length === 0) {
    return (
      <main className="min-h-screen bg-gray-950 text-white px-4 py-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href={`/room/${roomId}`}
              className="text-gray-400 hover:text-white transition text-sm"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold">People Album</h1>
          </div>
          <div className="text-center text-gray-600 py-16">
            <p className="text-4xl mb-4">🔄</p>
            <p className="text-gray-500 mb-6">
              Photos in this group were removed.
            </p>
            <Link
              href={`/room/${roomId}`}
              className="bg-white text-gray-950 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition"
            >
              Back to Room
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/room/${roomId}`}
            className="text-gray-400 hover:text-white transition text-sm"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-xl font-bold">
              {cluster.name ?? 'People Album'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {photoList.length} photo{photoList.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Photos */}
        <ClusterPhotoGrid photos={photoList} roomId={roomId} />

      </div>
    </main>
  )
}