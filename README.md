# 📸 SnapShare

A frictionless AI-powered temporary photo-sharing app. Create a room, share the QR code, and everyone uploads instantly — no login, no app install, no friction.

🌐 **Live Demo:** https://snap-share-theta.vercel.app/

---

## 🚀 Features

**Core**

- Create temporary photo-sharing rooms
- Instant room joining via QR code scan
- Upload photos without authentication
- Client-side image compression before upload
- Responsive masonry photo gallery
- Click to preview photos fullscreen
- Individual photo download
- Download all photos as ZIP in one click
- Remove wrongly uploaded photos
- Automatic room expiration after 24 hours
- Automatic cleanup of images and database records
- Mobile-first UI

**AI-Powered**

- Content moderation — every photo checked for safety before saving
- Face detection and clustering via face-api.js — groups photos by the same person, like Google Photos
- AI-generated names for each person cluster
- Auto room title generated after 3 uploads
- AI-generated room recap when the room expires

---

## 🏗️ Tech Stack

|Layer|Technology|
|---|---|
|Frontend + Backend|Next.js 15 App Router (TypeScript)|
|Database|Supabase|
|Image Storage|Cloudinary|
|Styling|Tailwind CSS|
|QR Generation|`qrcode` npm package|
|Face Detection + Clustering|face-api.js + custom DBSCAN (client-side, zero server cost)|
|AI / Vision|Google Gemini API (provider-agnostic, swappable to Claude)|
|ZIP Download|jszip|
|Cron / Cleanup|cron-job.org|
|Hosting|Vercel|

---

## 📌 Product Philosophy

SnapShare is intentionally designed as a production-grade MVP.

The goal:
- Ship fast
- Learn real production engineering
- Avoid overengineering
- Focus on simplicity
- Build maintainable systems

---

## 👨‍💻 Core User Flow

**1. Create Room**

- User visits homepage → clicks Create Room
- Backend generates a unique room ID
- Room stored in Supabase with 24hr expiry
- QR code generated + shareable link shown

**2. Join Room**

- Others scan QR code → room opens instantly
- No login required

**3. Upload Photos**

- Images compressed client-side
- Moderated by Gemini Vision before saving
- Uploaded to Cloudinary under `rooms/{roomId}/`
- URL saved to Supabase → appears in gallery instantly

**4. View & Download**

- Masonry photo grid
- Click to preview fullscreen
- Download individually or all as ZIP

**5. Face Clustering (AI)**

- face-api.js detects all faces in every photo — runs entirely in the browser
- Custom DBSCAN algorithm groups the same person across photos
- Gemini Vision names each group automatically
- Click a person card → see all their photos in a dedicated album

**6. Room Expiry**

- Cron job runs every hour via cron-job.org
- Gemini generates a warm AI recap before deletion
- Photos deleted from Cloudinary + Supabase
- Recap card shown to anyone visiting the expired room link

---

## 🔐 Security

- File type restrictions (jpg, jpeg, png, webp, heic)
- Client-side compression + server-side Cloudinary upload
- API keys never exposed to the browser
- Cron endpoint protected by `CRON_SECRET`
- Delete operations verify photo belongs to the room
- RLS policies on all Supabase tables

---

## ⚡ Performance

- Images compressed client-side before upload
- Face detection runs in the browser — no server round-trip
- Clusters cached in Supabase — AI only runs once per room
- Lazy image loading in gallery
- Optimized image sizes via Cloudinary

---

## 🌍 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
GEMINI_API_KEY=
```

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:3000
```

---

## 💰 Cost

Currently it runs entirely on free tiers — $0/month. Face detection runs in the browser so there is zero AI server cost per user. AI calls are cached per room so Gemini is only called once per room, not on every page load.

---

## 📁 Folder Structure

```bash
app/
├── api/
│   ├── rooms/
│   │   ├── create/                  # POST — create room
│   │   └── [roomId]/
│   │       ├── upload/              # POST — upload photo
│   │       ├── photos/[photoId]/    # DELETE — delete photo
│   │       ├── clusters/            # GET/POST — face clusters
│   │       │   └── name/            # POST — AI cluster naming
│   │       └── title/               # POST — AI room title
│   ├── cron/
│   │   └── cleanup/                 # GET — hourly cleanup + recap
│   └── moderate/                    # POST — content moderation
├── room/
│   └── [roomId]/
│       ├── page.tsx                 # Room page + expired recap card
│       ├── PhotoGrid.tsx            # Masonry grid + ZIP download
│       └── cluster/
│           └── [clusterId]/
│               ├── page.tsx         # Person album page
│               └── ClusterPhotoGrid.tsx
├── components/
│   ├── Logo.tsx
│   ├── CopyButton.tsx
│   ├── UploadButton.tsx
│   └── gallery/
│       └── ClusterGrid.tsx          # People section + clustering UI
├── lib/
│   ├── supabase.ts
│   ├── cloudinary.ts
│   ├── ai.ts                        # Provider-agnostic AI wrapper
│   ├── gemini.ts                    # Gemini implementation
│   ├── faceExtract.ts               # face-api.js wrapper
│   └── clustering.ts                # Custom DBSCAN algorithm
└── public/
    └── models/                      # face-api.js model weights
```

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

---

## 📄 License

MIT License

---

## ✨ SnapShare Vision

Simple. Fast. Temporary. Zero friction photo sharing — now with AI.