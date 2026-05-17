// DBSCAN clustering algorithm — pure math, no library needed
//
// HOW IT WORKS:
// For each face descriptor (128 numbers), find all other descriptors
// within "epsilon" distance. If enough neighbors exist → same cluster.
//
// epsilon = 0.5 means: if the "distance" between two face vectors
// is less than 0.5, they're probably the same person.
// (face-api.js uses euclidean distance, 0–2 range, lower = more similar)

// DBSCAN with minPoints = 1 — allows single photo clusters
// Deduplicates photos per cluster (group photo appears once per cluster)

import type { FaceDescriptor } from './faceExtract'

export interface Cluster {
  id: string
  photoIds: string[]
  photoUrls: string[]
  coverPhotoUrl: string
}

export function clusterFaces(
  descriptors: FaceDescriptor[],
  epsilon = 0.45,
  minPoints = 1    // ← changed from 2 to 1
): Cluster[] {
  const n = descriptors.length
  if (n === 0) return []

  const labels = new Array(n).fill(-1)
  let clusterIndex = 0

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue

    const neighbors = getNeighbors(descriptors, i, epsilon)

    // minPoints = 1 means even a lone face forms a cluster
    if (neighbors.length < minPoints - 1) {
      labels[i] = -2 // noise — only happens if minPoints > 1
      continue
    }

    labels[i] = clusterIndex
    const queue = [...neighbors]

    while (queue.length > 0) {
      const j = queue.shift()!
      if (labels[j] === -2) labels[j] = clusterIndex
      if (labels[j] !== -1) continue
      labels[j] = clusterIndex
      const more = getNeighbors(descriptors, j, epsilon)
      if (more.length >= minPoints) queue.push(...more)
    }

    clusterIndex++
  }

  const clusterMap = new Map<number, FaceDescriptor[]>()
  for (let i = 0; i < n; i++) {
    if (labels[i] < 0) continue
    if (!clusterMap.has(labels[i])) clusterMap.set(labels[i], [])
    clusterMap.get(labels[i])!.push(descriptors[i])
  }

  return Array.from(clusterMap.entries()).map(([id, faces]) => {

    // Filter 2 — deduplicate photos per cluster
    // Group photo with 3 people → each person's cluster
    // gets the photo once, not 3 times
    const seen = new Set<string>()
    const uniquePhotos = faces.filter(f => {
      if (seen.has(f.photoId)) return false
      seen.add(f.photoId)
      return true
    })

    // Filter 3 — use highest confidence face as cover
    // Sorts by score desc → best quality photo is the thumbnail
    const sortedByScore = [...uniquePhotos].sort((a, b) => b.score - a.score)

    return {
      id: `cluster_${id}`,
      photoIds: uniquePhotos.map(f => f.photoId),
      photoUrls: uniquePhotos.map(f => f.photoUrl),
      coverPhotoUrl: sortedByScore[0].photoUrl, // best quality as cover
    }
  })
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return Math.sqrt(sum)
}

function getNeighbors(
  descriptors: FaceDescriptor[],
  idx: number,
  epsilon: number
): number[] {
  return descriptors
    .map((d, i) => ({
      i,
      dist: euclideanDistance(descriptors[idx].descriptor, d.descriptor)
    }))
    .filter(({ i, dist }) => i !== idx && dist <= epsilon)
    .map(({ i }) => i)
}