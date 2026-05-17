// DBSCAN clustering algorithm — pure math, no library needed
//
// HOW IT WORKS:
// For each face descriptor (128 numbers), find all other descriptors
// within "epsilon" distance. If enough neighbors exist → same cluster.
//
// epsilon = 0.5 means: if the "distance" between two face vectors
// is less than 0.5, they're probably the same person.
// (face-api.js uses euclidean distance, 0–2 range, lower = more similar)

import type { FaceDescriptor } from './faceExtract'

export interface Cluster {
  id: string           // e.g. "cluster_0"
  photoIds: string[]
  photoUrls: string[]
  coverPhotoUrl: string // first photo = cover
}

export function clusterFaces(
  descriptors: FaceDescriptor[],
  epsilon = 0.5,   // max distance to be "same person" — tune if needed
  minPoints = 2    // min photos to form a cluster (ignore lone photos)
): Cluster[] {
  const n = descriptors.length
  if (n === 0) return []

  const labels = new Array(n).fill(-1) // -1 = unvisited
  let clusterIndex = 0

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue // already assigned

    // Find all neighbors within epsilon distance
    const neighbors = getNeighbors(descriptors, i, epsilon)

    if (neighbors.length < minPoints) {
      labels[i] = -2 // mark as noise (lone face, no cluster)
      continue
    }

    // Start a new cluster
    labels[i] = clusterIndex
    const queue = [...neighbors]

    while (queue.length > 0) {
      const j = queue.shift()!
      if (labels[j] === -2) labels[j] = clusterIndex // noise → add to cluster
      if (labels[j] !== -1) continue // already processed
      labels[j] = clusterIndex

      const moreNeighbors = getNeighbors(descriptors, j, epsilon)
      if (moreNeighbors.length >= minPoints) {
        queue.push(...moreNeighbors)
      }
    }

    clusterIndex++
  }

  // Build Cluster objects from labels
  const clusterMap = new Map<number, FaceDescriptor[]>()

  for (let i = 0; i < n; i++) {
    if (labels[i] < 0) continue // skip noise
    if (!clusterMap.has(labels[i])) clusterMap.set(labels[i], [])
    clusterMap.get(labels[i])!.push(descriptors[i])
  }

  return Array.from(clusterMap.entries()).map(([id, faces]) => ({
    id: `cluster_${id}`,
    photoIds: faces.map(f => f.photoId),
    photoUrls: faces.map(f => f.photoUrl),
    coverPhotoUrl: faces[0].photoUrl,
  }))
}

// Euclidean distance between two 128-float descriptors
// Lower = more similar faces
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2
  }
  return Math.sqrt(sum)
}

function getNeighbors(
  descriptors: FaceDescriptor[],
  idx: number,
  epsilon: number
): number[] {
  return descriptors
    .map((d, i) => ({ i, dist: euclideanDistance(descriptors[idx].descriptor, d.descriptor) }))
    .filter(({ i, dist }) => i !== idx && dist <= epsilon)
    .map(({ i }) => i)
}