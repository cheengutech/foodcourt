# Food Court — project context for Claude Code

## What this is

A real-time ambient presence app. Strangers join a shared space and exist together without agenda. 90s mall food court energy — warm, no pressure, people doing their own thing, nobody alone.

Live at: https://foodcourt-pi.vercel.app

## The one-line pitch

A space for purposeless presence — because not everything needs a goal.

## Stack

- Next.js 15 (App Router, force-dynamic)
- Supabase Realtime (presence channels — no DB writes on status updates)
- Tailwind CSS
- TypeScript
- Vercel deploy

## Project structure

```
app/page.tsx              — main orchestrator (entry vs room)
components/
  EntryScreen.tsx         — onboarding: avatar pick + status
  AvatarPicker.tsx        — character grid + color swatches
  PixelAvatar.tsx         — canvas pixel art renderer
  RoomCanvas.tsx          — the food court room + tables + movement
  StatusBar.tsx           — bottom bar, edit your status
  StatusBubble.tsx        — floating bubble above each avatar
hooks/useRoom.ts          — Supabase Realtime presence hook
lib/supabase.ts           — lazy Supabase client (SSR-safe)
lib/presence.ts           — session ID, localStorage helpers, types
constants/avatars.ts      — 8 pixel art characters + color palettes
supabase/schema.sql       — rooms, sessions tables, upsert_session RPC
```

## How presence works

- Each user joins `foodcourt:main` channel keyed by session ID
- Avatar config, status, position, away state live in the presence payload
- Status updates = `channel.track()` — fast, no DB write
- Position updates (click-to-move) = `channel.track()` with new x/y
- On join: `upsert_session` RPC persists avatar+status for return visit UX
- No auth required — anonymous session ID from localStorage

## The product constitution

These are non-negotiable. Every feature request gets measured against them.

### What Food Court is
- A room you walk into
- Atmosphere and warmth over functionality
- Purposeless presence — no agenda, no goals, no output expected
- A place that feels different at 2am than at noon
- Anonymous by default, identity optional
- Mobile-first eventually

### What Food Court is not
- A productivity tool
- A social network
- A communication platform
- Feature-driven

### The rules

**No chat. Ever.**
The most requested feature. The one most likely to kill what makes this different.
The moment chat exists it becomes a worse Discord. The constraint IS the product.

**No goals, timers, or sessions.**
That's Focusmate. Food Court is the opposite — you're here because you don't need to do anything.

**No forced interaction.**
Users can exist alongside each other without obligation. No "say hi" prompts,
no match-making, no icebreakers. Presence is enough.

**Behavior leads, assumptions don't.**
Don't build rooms based on what you think people want.
Watch what statuses people write. Watch where they cluster.
Let that tell you what rooms to build next.

**Atmosphere is a feature.**
Time-of-day lighting, ambient sound, seasonal touches — these matter as much
as any functional feature. The room should feel like somewhere.

**Mobile is the real unlock.**
The loneliness use case lives on a phone, not a laptop.
Every UI decision should pass a mobile gut-check.

## Current state (as of April 2026)

- [x] Entry screen with avatar picker + status
- [x] 8 pixel art characters, 3 customization axes (skin, hair, outfit)
- [x] Real-time presence via Supabase Realtime
- [x] Click-to-move with smooth animation
- [x] 7 food court tables with chairs
- [x] Idle bob animation, entrance animation, glow pulse
- [x] Away toggle
- [x] Status bubble above avatars
- [x] Visit count tracking (hat unlock at visit 3)
- [x] Deployed to Vercel

## What's next (in rough priority order)

1. Mobile layout — the room needs to work on phone
2. Time-of-day ambient lighting — warmer at night, cooler midday
3. "Someone just joined" subtle notification
4. Avatar faces left/right based on movement direction
5. Ambient sound toggle (lo-fi, optional, off by default)
6. Landing page with live room count for cold start seeding

## What NOT to build (no matter who asks)

- Chat (text, voice, or video)
- User accounts or profiles
- Goals, timers, or sessions
- Leaderboards or streaks
- Notifications or push alerts
- DMs or friend requests
- Reactions or emoji responses to other users

## Cold start plan

- Brian seeds the room every Saturday solo shift at the Legion of Honor
- First post: r/solodev, r/WFH, or r/digitalnomad — one community, one post
- Target metric: does anyone come back a second time without being asked?
- Do NOT open side rooms until main lobby consistently has 15+ people

## Env vars needed

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
