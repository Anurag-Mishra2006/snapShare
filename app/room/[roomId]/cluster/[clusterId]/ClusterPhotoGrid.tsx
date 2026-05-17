'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Photo {
  id: string
  cloudinary_url: string
  cloudinary_public_id: string
}

interface Props {
  photos: Photo[]
  roomId: string
}

export default function ClusterPhotoGrid({ photos, roomId }: Props) {
  const router = useRouter()
  const [photoList, setPhotoList] = useState<Photo[]>(photos)
  const [preview, setPreview] = useState<Photo | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(photo: Photo) {
    setDeleting(photo.id)
    setPhotoList(prev => prev.filter(p => p.id !== photo.id))

    try {
      const res = await fetch(`/api/rooms/${roomId}/photos/${photo.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!data.success) {
        setPhotoList(prev => [photo, ...prev])
        alert('Failed to delete. Try again.')
      } else if (photoList.length === 1) {
        router.push(`/room/${roomId}`)
      }
    } catch {
      setPhotoList(prev => [photo, ...prev])
      alert('Failed to delete. Try again.')
    } finally {
      setDeleting(null)
    }
  }

  async function handleDownload(url: string) {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = 'snapshare-photo.jpg'
    a.click()
    URL.revokeObjectURL(blobUrl)
  }

  if (photoList.length === 0) {
    return (
      <div className="text-center text-gray-600 py-16">
        <p className="text-4xl mb-4">📷</p>
        <p>No photos in this group.</p>
      </div>
    )
  }

  return (
    <>
      {/* Masonry grid */}
      <div className="columns-2 gap-3 space-y-3">
        {photoList.map((photo) => (
          <div
            key={photo.id}
            className="break-inside-avoid rounded-xl overflow-hidden relative group cursor-pointer"
            onClick={() => setPreview(photo)}
          >
            <img
              src={photo.cloudinary_url}
              alt="Photo"
              className="w-full h-auto block group-hover:brightness-75 transition duration-200"
            />

            {/* Delete — top right */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(photo)
              }}
              disabled={deleting === photo.id}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-bold shadow-lg"
            >
              ×
            </button>

            {/* Download — bottom right */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDownload(photo.cloudinary_url)
              }}
              className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm shadow-lg"
            >
              ↓
            </button>
          </div>
        ))}
      </div>

      {/* Fullscreen preview modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-3xl w-full flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 text-gray-400 hover:text-white text-sm transition"
            >
              ✕ Close
            </button>

            <img
              src={preview.cloudinary_url}
              alt="Preview"
              className="w-full rounded-2xl max-h-[80vh] object-contain shadow-2xl"
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => handleDownload(preview.cloudinary_url)}
                className="bg-white text-gray-950 font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition"
              >
                ↓ Download
              </button>
              <button
                onClick={() => setPreview(null)}
                className="bg-gray-800 text-white font-semibold px-8 py-3 rounded-xl hover:bg-gray-700 transition"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}