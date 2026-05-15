// src/app/room/[roomId]/PhotoGrid.tsx
'use client'

import { useState } from 'react'
import UploadButton from '@/app/components/UploadButton'

interface Props {
  initialPhotos: string[]
  roomId: string
}

export default function PhotoGrid({ initialPhotos, roomId }: Props) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [preview, setPreview] = useState<string | null>(null)

  function addPhoto(url: string) {
    setPhotos(prev => [url, ...prev])
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
      {/* Upload Button */}
      <UploadButton roomId={roomId} onUploadComplete={addPhoto} />

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="text-center text-gray-600 py-16">
          <p className="text-5xl mb-4">📷</p>
          <p className="text-gray-500">No photos yet. Be the first to upload!</p>
        </div>
      )}

      {/* Masonry Grid */}
      {photos.length > 0 && (
        <div className="columns-2 sm:columns-3 gap-3 mt-6 space-y-3">
          {photos.map((url, index) => (
            <div
              key={index}
              className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer relative group"
              onClick={() => setPreview(url)}
            >
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-auto block group-hover:brightness-90 transition duration-200"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition duration-200 rounded-xl" />
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
            {/* Close button top right */}
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 text-gray-400 hover:text-white text-sm transition"
            >
              ✕ Close
            </button>

            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-2xl max-h-[80vh] object-contain shadow-2xl"
            />

            {/* Download + Close buttons below image */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => handleDownload(preview)}
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