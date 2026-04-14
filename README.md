# Food Court

> Hang out with strangers. No agenda.

A real-time ambient presence app. Join a shared space, set a status, exist alongside people. No chat, no video, no goals. 90s mall food court energy.

---

## Quick start

### 1. Clone and install

```bash
git clone <your-repo>
cd foodcourt
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Wait for it to provision (~1 min)

### 3. Run the schema

In your Supabase dashboard:

1. Go to **SQL Editor → New query**
2. Paste and run `supabase/schema.sql`
3. Paste and run `supabase/realtime.sql`

### 4. Enable Realtime

1. Go to **Realtime** in the left sidebar
2. Confirm the toggle is **enabled** (it usually is by default)
3. That's it — no table subscriptions needed. Presence runs on channels.

### 5. Get your API keys

Go to **Settings → API**:

- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 6. Set up env vars

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Open a second tab — you should see both avatars appear in the room.

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, add the two environment variables from step 5.

Or connect your GitHub repo in the Vercel dashboard and add env vars under **Settings → Environment Variables**.

---

## Project structure

```
foodcourt/
├── app/
│   ├── page.tsx              # Main orchestrator (entry vs room)
│   └── layout.tsx
├── components/
│   ├── EntryScreen.tsx       # Onboarding: avatar pick + status
│   ├── AvatarPicker.tsx      # Character grid + color swatches
│   ├── PixelAvatar.tsx       # Canvas-based pixel art renderer
│   ├── RoomCanvas.tsx        # The food court room
│   ├── StatusBar.tsx         # Bottom bar — edit your status
│   └── StatusBubble.tsx      # Floating bubble above each avatar
├── hooks/
│   └── useRoom.ts            # Supabase Realtime presence hook
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── presence.ts           # Session ID, localStorage helpers
├── constants/
│   └── avatars.ts            # 8 pixel art characters + palettes
└── supabase/
    ├── schema.sql            # Tables + RLS + upsert_session fn
    └── realtime.sql          # Channel authorization
```

---

## How presence works

Food Court uses **Supabase Realtime Presence** — no database writes on every update.

- Each user joins the `foodcourt:main` channel with their session ID as the key
- Their avatar config, status, position, and away state live in the **presence payload**
- When they update their status, it's a `channel.track()` call — fast, ephemeral
- On join, a single `upsert_session` RPC call persists their avatar/status to the `sessions` table for return visit UX
- When they leave (tab close, ✕ button), the channel automatically removes their presence

This means the DB schema is minimal — the real-time layer does the heavy lifting.

---

## Avatar system

8 pixel art characters (10×12 pixel grid), rendered via `<canvas>`:

| ID | Name |
|---|---|
| wanderer | Wanderer |
| chill | Chill |
| hooded | Hooded |
| beanie | Beanie |
| shades | Shades |
| cap | Cap |
| pony | Ponytail |
| curly | Curly |

**Customization axes:**
- Skin tone (6 options)
- Hair color (8 options)
- Outfit color (8 options)
- Hat color (6 options, unlocks after 3 visits)

Visit count is tracked in `localStorage` — no account required.

---

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

---

## Tech stack

- **Next.js 15** (App Router)
- **Supabase Realtime** (presence channels)
- **Tailwind CSS**
- **Framer Motion** (ready for animations)
- **TypeScript**

---

## Roadmap

- [ ] Side rooms (Deep Work, Wind Down, DJ Room)
- [ ] Avatar accessory slot (visit 3+ unlock)
- [ ] Spotify status integration
- [ ] Room count on landing page
- [ ] Avatar cosmetics (premium)
