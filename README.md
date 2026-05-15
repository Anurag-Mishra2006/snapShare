# SnapShare

A frictionless temporary photo-sharing web app built for instant sharing.
Users create a room, get a QR code, and others can instantly join to upload/view photos — no login, no app install, no friction

🌐 Live Demo: https://snap-share-theta.vercel.app/  

---
# 🚀 Features

- Create temporary photo-sharing rooms
- Instant room joining via QR code
- Upload photos without authentication
- Responsive photo gallery
- Individual photo download
- Remove wrongly uploaded photos
- Automatic room expiration after 24 hours
- Automatic cleanup of images and database records
- Mobile-first UI
---
# 🏗️ Tech Stack

## Frontend + Backend
- Next.js App Router
## Database
- Supabase
## Image Storage
- Cloudinary
## Styling
- Tailwind CSS
## QR Generation
- qrcode npm package
## Hosting
- Vercel

---
# 📌 Product Philosophy

SnapShare is intentionally designed as an MVP.

The goal is:
- ship fast
- learn production engineering
- avoid overengineering
- focus on simplicity
- build maintainable systems

We intentionally DO NOT include:
- authentication
- social systems
- reactions
- ZIP downloads
- advanced realtime systems
- enterprise-level abstractions

---
# 👨‍💻 Core User Flow

## 1. Create Room
- User visits homepage
- Clicks "Create Room"
- Backend generates unique room ID
- Room stored in database
- QR code generated
- User receives shareable room link
---
## 2. Join Room
- Other users scan QR code
- Room opens instantly in browser
No login required.
---
## 3. Upload Photos
- Users select images
- Images compressed client-side
- Uploaded to Cloudinary:

```bash

rooms/{roomId}/

```

- URLs stored in Supabase

---
## 4. View Photos

- Photos displayed in responsive grid
- Click image to preview
- Download individually
---
## 5. Remove Uploaded Photos

If a user uploads the wrong image:
- Click remove/delete button
- Image removed from:
- Cloudinary
- Supabase
- UI instantly updates
---
## 6. Cleanup System

Rooms expire automatically after 24 hours.
Cron job deletes:
- Cloudinary images
- Cloudinary folders
- Database records
---
# 📁 Suggested Folder Structure

```bash

src/

│

├── app/

│ ├── api/

│ │ ├── rooms/

│ │ ├── upload/

│ │ ├── delete-photo/

│ │ └── cleanup/

│ │

│ ├── room/[id]/

│ └── page.js

│

├── components/

│ ├── ui/

│ ├── room/

│ ├── upload/

│ └── gallery/

│

├── lib/

│ ├── supabase.js

│ ├── cloudinary.js

│ ├── qr.js

│ └── utils.js

│

├── validators/

│

└── styles/

```

---

# 🔐 Security Considerations

Even for an MVP, important protections include:

- restrict file types
- limit upload size
- sanitize room IDs
- rate limit APIs
- avoid exposing secret keys
- use server-side Cloudinary operations
- validate delete operations carefully
---
# ⚡ Performance Considerations
- compress images client-side
- lazy load gallery images
- use optimized image sizes
- paginate later only if needed
- avoid unnecessary realtime systems
---
# 🌍 Environment Variables
Create:
```bash

.env.local

```
Example:

```env

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CRON_SECRET=your_cron_secret
```

---
# ☁️ Deployment
## Frontend Hosting
Deploy using:
- Vercel
## Database
Setup using:
- Supabase
## Image Storage
Setup using:
- Cloudinary
---
# 🔄 Cleanup Cron Job

Use a scheduled API route.
Example flow:
```bash

Vercel Cron

↓

/api/cleanup

↓

Find expired rooms

↓

Delete Cloudinary assets

↓

Delete DB records

```
---
# 🛠️ Local Development
## Install dependencies

```bash

npm install

```

---
## Start development server

```bash

npm run dev

```

---
## Open in browser

```bash

http://localhost:3000

```
---
# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

---
# 📄 License
MIT License

---
# ✨ SnapShare Vision
Simple.
Fast.
Temporary.
Zero friction photo sharing.
