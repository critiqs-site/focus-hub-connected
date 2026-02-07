

# Fix AI, Calendar, Analytics, Responsiveness, and Add PWA

## Issues Found

1. **AI not working**: The edge function uses `max_tokens` which is unsupported by the model. Error: `"Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead."` -- confirmed in the edge function logs.

2. **Yearly Calendar too big / no date numbers**: The `YearlyCalendar.tsx` shows all 12 months as tiny 3x3px dot grids with no date numbers. It needs to show individual months with actual date numbers, like a real calendar.

3. **Analytics calculations**: The analytics code already calculates monthly (uses `startOfMonth`/`endOfMonth` and filters by `isSameMonth`). The streaks are calculated across all time (longest) and from today backwards (current). This is correct. No changes needed here.

4. **Responsiveness**: The app uses `max-w-4xl` (896px max) which looks narrow on desktop. Need to make it wider and responsive.

5. **PWA**: Need manifest.json, service worker, `/download` route with auto-download and fallback button.

---

## Changes

### 1. Fix AI Edge Function

**File:** `supabase/functions/ai-chat/index.ts`

- Change `max_tokens: 1024` to `max_completion_tokens: 1024` (line 72)

### 2. Redesign Yearly Calendar

**File:** `src/components/YearlyCalendar.tsx`

Complete rewrite to show a proper monthly grid layout:
- Show 4 columns on desktop (3 months per row), 2 on tablet, 1 on mobile
- Each month shows day-of-week headers (S M T W T F S)
- Each day cell shows the **date number** (1-31)
- Cells are colored by mood (green for happy, amber for neutral, red for sad, default muted for no entry)
- Clicking a date calls `onSelectDate`
- Responsive sizing: cells are larger and readable

### 3. Improve Responsiveness

**File:** `src/pages/Index.tsx`
- Change `max-w-4xl` to `max-w-6xl` for wider desktop layout

**File:** `src/components/Header.tsx`
- Ensure tabs wrap properly on small screens

**File:** `src/components/AIChat.tsx`
- Change `max-h-[600px]` to `max-h-[700px]` for better desktop use

### 4. PWA Implementation

**New file:** `public/manifest.json`
- App name: "CRITIQS - Daily Focus Hub"
- Theme color: orange (#f97316)
- Icons (use placeholder SVG for now)
- `display: "standalone"`, `start_url: "/"`

**New file:** `public/sw.js`
- Basic service worker with cache-first strategy for static assets
- Network-first for API calls

**File:** `index.html`
- Add `<link rel="manifest" href="/manifest.json">`
- Add `<meta name="theme-color" content="#f97316">`
- Add apple-touch-icon meta tags
- Register service worker via inline script

**New file:** `src/pages/Download.tsx`
- On mount, trigger a `beforeinstallprompt` event listener
- If PWA is installable, auto-trigger the install prompt
- Show text: "Download has started. Click the button below if not."
- Show a "Download CRITIQS" button that triggers the install prompt
- If already installed or not supported, show appropriate message

**File:** `src/App.tsx`
- Add route: `/download` -> `<Download />`

---

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/ai-chat/index.ts` | Fix `max_tokens` to `max_completion_tokens` |
| `src/components/YearlyCalendar.tsx` | Rewrite with proper month grids and date numbers |
| `src/pages/Index.tsx` | Widen container to `max-w-6xl` |
| `src/components/AIChat.tsx` | Increase max height |
| `public/manifest.json` | New PWA manifest |
| `public/sw.js` | New service worker |
| `index.html` | Add manifest, theme-color, SW registration |
| `src/pages/Download.tsx` | New download/install page |
| `src/App.tsx` | Add `/download` route |

---

## Technical Details

**AI Fix**: The `openai/gpt-5-mini` model requires `max_completion_tokens` instead of `max_tokens`. This is a one-line change in the edge function.

**Calendar Redesign**: Each month renders a 7-column grid. Day cells are ~28x28px with the date number inside. Mood colors use background classes. The grid is `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` for responsiveness.

**PWA Service Worker**: Uses the Cache API with a versioned cache name. Caches the app shell on install, serves from cache with network fallback. The `/download` page captures the `beforeinstallprompt` event and provides both auto-prompt and manual button triggers.

**PWA Icons**: Will use a simple generated icon using the existing favicon or placeholder. For production, the user should replace with proper icons.

