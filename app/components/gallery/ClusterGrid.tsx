'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractFaceDescriptors } from '@/app/lib/faceExtract'
import { clusterFaces, Cluster } from '@/app/lib/clustering'

interface Props {
  photos: { id: string; cloudinary_url: string }[]
  roomId: string
}

interface NamedCluster extends Cluster {
  dbId: string
  name: string | null
}

export default function ClusterGrid({ photos, roomId }: Props) {
  const router = useRouter()
  const [clusters, setClusters] = useState<NamedCluster[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  useEffect(() => {
    if (photos.length < 1) return

    async function runClustering() {
      setLoading(true)
      setProgress('Loading groups...')

      try {
        // Step 1 — Check if clusters already exist in DB
        const existingRes = await fetch(`/api/rooms/${roomId}/clusters`)
        const existingData = await existingRes.json()

        if (existingData.clusters && existingData.clusters.length > 0) {
          // Already clustered — load from DB, skip re-clustering
          const loaded: NamedCluster[] = existingData.clusters.map((c: any) => ({
            id: c.id,
            dbId: c.id,
            name: c.name,
            photoIds: c.photo_ids ?? [],
            photoUrls: c.photo_ids ?? [],
            coverPhotoUrl: c.cover_photo_id,
          }))
          setClusters(loaded)
          setLoading(false)
          setProgress('')
          return
        }

        // Step 2 — No existing clusters, run fresh
        setProgress('Loading face detection models...')
        const descriptors = await extractFaceDescriptors(photos)

        if (descriptors.length === 0) {
          setLoading(false)
          return
        }

        setProgress('Grouping matching faces...')
        const found = clusterFaces(descriptors)

        if (found.length === 0) {
          setLoading(false)
          return
        }

        // Step 3 — Save clusters to Supabase
        setProgress('Saving groups...')
        await fetch(`/api/rooms/${roomId}/clusters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clusters: found }),
        })

        const namedClusters: NamedCluster[] = found.map(c => ({
          ...c,
          dbId: `${roomId}_${c.id}`,
          name: null,
        }))

        setClusters(namedClusters)
        setLoading(false)
        setProgress('')

        // Step 4 — Name each cluster async (don't block UI)
        for (const cluster of namedClusters) {
          try {
            const res = await fetch(`/api/rooms/${roomId}/clusters/name`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clusterId: cluster.dbId,
                coverPhotoUrl: cluster.coverPhotoUrl,
                photoCount: cluster.photoIds.length,
              }),
            })

            // If quota hit or any error — skip naming, don't crash
            if (!res.ok) {
              console.warn(`Naming skipped for ${cluster.dbId} — quota or server error`)
              continue
            }

            const data = await res.json()
            if (data.name) {
              setClusters(prev =>
                prev.map(c =>
                  c.dbId === cluster.dbId ? { ...c, name: data.name } : c
                )
              )
            }
          } catch {
            console.warn('Cluster naming failed — skipping silently')
          }
        }

      } catch (err) {
        console.error('Clustering failed:', err)
        setLoading(false)
        setProgress('')
      }
    }

    runClustering()
  }, [photos.length, roomId])

  function handleClusterClick(cluster: NamedCluster) {
    router.push(`/room/${roomId}/cluster/${cluster.dbId}`)
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
              {cluster.name ? (
                <p className="text-xs text-white text-center font-medium truncate px-1">
                  {cluster.name}
                </p>
              ) : (
                <p className="text-xs text-gray-400 text-center">
                  {cluster.photoIds.length} photo{cluster.photoIds.length !== 1 ? 's' : ''}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}