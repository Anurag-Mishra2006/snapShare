// src/app/room/[roomId]/PhotoGrid.tsx
'use client'

import { useState } from 'react'
import UploadButton from '@/app/components/UploadButton'

interface Photo {
  id: string
  cloudinary_url: string
  cloudinary_public_id: string
}

interface Props {
  initialPhotos: Photo[]
  roomId: string
}

export default function PhotoGrid({ initialPhotos, roomId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [preview, setPreview] = useState<Photo | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  function addPhoto(photo: Photo) {
    setPhotos(prev => [photo, ...prev])
  }

  async function handleDelete(photo: Photo) {
    // Optimistically remove from UI first
    setDeleting(photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))

    try {
      const res = await fetch(
        `/api/rooms/${roomId}/photos/${photo.id}`,
        { method: 'DELETE' }
      )
      const data = await res.json()

      if (!data.success) {
        // Put it back if delete failed
        setPhotos(prev => [photo, ...prev])
        alert('Failed to delete photo. Try again.')
      }
    } catch (err) {
      // Put it back on network error
      setPhotos(prev => [photo, ...prev])
      alert('Failed to delete photo. Try again.')
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

  return (
    <>
      <UploadButton roomId={roomId} onUploadComplete={addPhoto} />

      {photos.length === 0 && (
        <div className="text-center text-gray-600 py-16">
          <p className="text-5xl mb-4">📷</p>
          <p className="text-gray-500">No photos yet. Be the first to upload!</p>
        </div>
      )}

      {/* Masonry Grid */}
      {photos.length > 0 && (
        <div className="columns-2 sm:columns-3 gap-3 mt-6 space-y-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer relative group"
            >
              <img
                src={photo.cloudinary_url}
                alt="Shared photo"
                className="w-full h-auto block group-hover:brightness-75 transition duration-200"
                onClick={() => setPreview(photo)}
              />

              {/* Delete button — appears on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(photo)
                }}
                disabled={deleting === photo.id}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-bold shadow-lg"
                title="Delete photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Preview Modal */}
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
                className="bg-white text-gray-950 font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-150"
              >
                ↓ Download
              </button>
              <button
                onClick={() => setPreview(null)}
                className="bg-gray-800 text-white font-semibold px-8 py-3 rounded-xl hover:bg-gray-700 active:scale-95 transition-all duration-150"
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