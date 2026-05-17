// src/lib/faceExtract.ts
// Runs entirely in the browser — no server, no API call
// Loads face-api.js models once, then extracts a 128-number
// "descriptor" from each photo. Same face = similar numbers.

// WHY dynamic import? face-api.js uses browser APIs (canvas, HTMLImageElement)
// that don't exist on the server. 'import' at top of file runs on server too.
// dynamic import with { ssr: false } ensures it only runs in browser.

let modelsLoaded = false

async function loadModels() {
  if (modelsLoaded) return // load once, reuse forever (browser caches)

  const faceapi = await import('face-api.js')
  const MODEL_URL = '/models' // served from public/models/

  // Load all 3 models we downloaded
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),      // detects faces
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),   // finds 68 face points
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),  // makes 128-float descriptor
  ])

  modelsLoaded = true
}

export interface FaceDescriptor {
  photoId: string
  photoUrl: string
  descriptor: number[] // the 128 floats
}

export async function extractFaceDescriptors(
  photos: { id: string; cloudinary_url: string }[]
): Promise<FaceDescriptor[]> {
  await loadModels()

  const faceapi = await import('face-api.js')
  const results: FaceDescriptor[] = []

  for (const photo of photos) {
    try {
      // Create an HTML image element — face-api.js needs this to read pixel data
      const img = await createImageElement(photo.cloudinary_url)

      // detectSingleFace finds the most prominent face
      // .withFaceLandmarks() aligns it
      // .withFaceDescriptor() generates the 128-float vector
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (detection) {
        results.push({
          photoId: photo.id,
          photoUrl: photo.cloudinary_url,
          descriptor: Array.from(detection.descriptor), // Float32Array → regular array
        })
      }
      // If no face detected, we just skip this photo (no push)

    } catch (err) {
      console.warn(`Could not process photo ${photo.id}:`, err)
      // Skip this photo, continue with others
    }
  }

  return results
}

// Helper: loads an image URL into an HTMLImageElement
// face-api.js needs a real DOM element, not just a URL string
function createImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // needed for Cloudinary URLs (CORS)
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}