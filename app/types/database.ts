// src/types/database.ts
// Mirrors your Supabase table schema
// Use these types across the app for type-safe DB operations
export type Room = {
  id: string
  created_at: string
  expires_at: string
  is_expired: boolean
}

export type Photo = {
  id: string
  room_id: string
  cloudinary_url: string
  cloudinary_public_id: string
  uploaded_at: string
}