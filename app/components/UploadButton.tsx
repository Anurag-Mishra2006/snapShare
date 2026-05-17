'use client'

import { useState } from 'react'
import imageCompression from 'browser-image-compression'

interface Photo {
    id: string
    cloudinary_url: string
    cloudinary_public_id: string
}

interface Props {
    roomId: string
    onUploadComplete: (photo: Photo) => void  // ← changed
}

export default function UploadButton({ roomId, onUploadComplete }: Props) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState('')

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        setUploading(true)

        for (const file of files) {
            try {
                // Step 1 — Compress
                setProgress(`Compressing ${file.name}...`)
                const compressed = await imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                })

                // Step 2 — Upload + Moderate
                setProgress(`Checking image...`)  // ← shown during moderation
                const formData = new FormData()
                formData.append('file', compressed)

                const res = await fetch(`/api/rooms/${roomId}/upload`, {
                    method: 'POST',
                    body: formData,
                })

                const data = await res.json()

                if (!data.success) {
                    if (data.rejected) {
                        // Moderation rejection — clear message
                        alert(`⚠️ Photo rejected: ${data.error}`)
                    } else {
                        alert(`Failed to upload ${file.name}`)
                    }
                    continue
                }

                onUploadComplete({
                    id: data.id,
                    cloudinary_url: data.url,
                    cloudinary_public_id: data.publicId,
                })

            } catch (err) {
                console.error('Upload error:', err)
                alert(`Error uploading ${file.name}`)
            }
        }

        setUploading(false)
        setProgress('')
        // Reset input so same file can be uploaded again if needed
        e.target.value = ''
    }

    return (
        <div className="w-full">
            <label className={`
        flex items-center justify-center w-full py-4 px-6
        bg-white text-gray-950 font-semibold rounded-2xl
        cursor-pointer hover:bg-gray-200 transition
        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
                {uploading ? progress || 'Uploading...' : '+ Upload Photos'}
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </label>
        </div>
    )
}