// detectAllFaces — finds every face in every photo
// Filters low-confidence detections (score < 0.7) to reduce noise

let modelsLoaded = false

async function loadModels() {
  if (modelsLoaded) return
  const faceapi = await import('face-api.js')
  const MODEL_URL = '/models'
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])
  modelsLoaded = true
}

export interface FaceDescriptor {
  photoId: string
  photoUrl: string
  descriptor: number[]
  faceIndex: number    // which face in the photo (0, 1, 2...)
  score: number        // confidence score 0-1
}

export async function extractFaceDescriptors(
  photos: { id: string; cloudinary_url: string }[]
): Promise<FaceDescriptor[]> {
  await loadModels()
  const faceapi = await import('face-api.js')
  const results: FaceDescriptor[] = []

  for (const photo of photos) {
    try {
      const img = await createImageElement(photo.cloudinary_url)

      // detectAllFaces finds every face in the photo
      const detections = await faceapi
        .detectAllFaces(img)
        .withFaceLandmarks()
        .withFaceDescriptors()

      detections.forEach((detection, index) => {
        const score = detection.detection.score

        // Filter 1 — skip low confidence detections
        // score < 0.7 = likely background noise, blurry face, partial face
        if (score < 0.5) {
          console.log(`Skipping low confidence face (score: ${score.toFixed(2)}) in photo ${photo.id}`)
          return
        }

        results.push({
          photoId: photo.id,
          photoUrl: photo.cloudinary_url,
          descriptor: Array.from(detection.descriptor),
          faceIndex: index,
          score,
        })
      })

    } catch (err) {
      console.warn(`Could not process photo ${photo.id}:`, err)
    }
  }

  console.log(`Extracted ${results.length} face descriptors from ${photos.length} photos`)
  return results
}

function createImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}