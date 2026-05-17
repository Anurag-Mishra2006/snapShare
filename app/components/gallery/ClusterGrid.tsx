// src/components/gallery/ClusterGrid.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractFaceDescriptors } from '@/app/lib/faceExtract'
import { clusterFaces, Cluster } from '@/app/lib/clustering'

interface Props {
  photos: { id: string; cloudinary_url: string }[]
  roomId: string  // ← add this prop
}

export default function ClusterGrid({ photos, roomId }: Props) {
  const router = useRouter()
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (photos.length < 2) return

    async function runClustering() {
      setLoading(true)
      setProgress('Loading face detection models...')

      try {
        setProgress(`Scanning ${photos.length} photos for faces...`)
        const descriptors = await extractFaceDescriptors(photos)

        if (descriptors.length < 2) {
          setLoading(false)
          return
        }

        setProgress('Grouping matching faces...')
        const found = clusterFaces(descriptors)

        if (found.length === 0) {
          setLoading(false)
          return
        }

        // Save clusters to Supabase
        setSaving(true)
        setProgress('Saving groups...')
        await fetch(`/api/rooms/${roomId}/clusters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clusters: found }),
        })

        setClusters(found)
      } catch (err) {
        console.error('Clustering failed:', err)
      } finally {
        setLoading(false)
        setSaving(false)
        setProgress('')
      }
    }

    runClustering()
  }, [photos.length, roomId])

  // Navigate to dedicated cluster page on click
  function handleClusterClick(cluster: Cluster) {
    const clusterId = `${roomId}_${cluster.id}` // matches what we saved
    router.push(`/room/${roomId}/cluster/${clusterId}`)
  }

  if (!loading && clusters.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-widest">
        People
      </h2>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500 py-4">
          <span className="w-4 h-4 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
          {progress}
        </div>
      )}

      {!loading && clusters.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {clusters.map((cluster) => (
            <button
              key={cluster.id}
              onClick={() => handleClusterClick(cluster)}
              className="flex-shrink-0 w-32 text-left group"
            >
              <div className="w-32 h-32 rounded-2xl overflow-hidden mb-2 border-2 border-gray-700 group-hover:border-white transition-all duration-200 group-hover:scale-105">
                <img
                  src={cluster.coverPhotoUrl}
                  alt="Person"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                {cluster.photoIds.length} photo{cluster.photoIds.length !== 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}