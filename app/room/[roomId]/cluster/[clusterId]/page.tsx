// src/app/room/[roomId]/cluster/[clusterId]/page.tsx
// Dedicated page for a person's photos
// Shows all photos in that cluster with download + delete

import { supabase } from '@/app/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClusterPhotoGrid from './ClusterPhotoGrid';
// import ClusterPhotoGrid from './ClusterPhotoGrid'


interface Props {
  params: Promise<{ roomId: string; clusterId: string }>
}

export default async function ClusterPage({ params }: Props) {
  const { roomId, clusterId } = await params

  // Fetch the cluster from Supabase
  const { data: cluster, error } = await supabase
    .from('clusters')
    .select('*')
    .eq('id', clusterId)
    .eq('room_id', roomId)
    .single()

  if (error || !cluster) notFound()

  // photo_ids is an array of cloudinary URLs (we stored URLs not IDs)
  const photoUrls: string[] = cluster.photo_ids ?? []

  // Fetch full photo objects so we have id + public_id for delete
  const { data: photos } = await supabase
    .from('photos')
    .select('id, cloudinary_url, cloudinary_public_id')
    .in('cloudinary_url', photoUrls)
    .eq('room_id', roomId)

  const photoList = photos ?? []

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

        {/* Photos with delete + download */}
        <ClusterPhotoGrid photos={photoList} roomId={roomId} />

      </div>
    </main>
  )
}