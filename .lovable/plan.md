

# Comprehensive Fix & Owner Page Plan

## 1. Analytics Completion Rate Fix

**Bug**: Completion rate shows 17% instead of ~3% because it divides by only elapsed days in the current month (e.g., 6 days in April = 1/6 = 17%). User expects it over the full month (30 days).

**Fix** in `src/components/AnalyticsView.tsx`:
- Change `totalPossible` to use `calendarData.days.length * todos.length` (full month, e.g., 30 days) instead of `monthDays.length * todos.length` (only elapsed days)
- This makes 1 completed day out of 30 = 3.3% as expected
- Also review streak logic and bar chart to ensure correctness

## 2. Auto-Update (Discord-style Refresh)

**Problem**: Service worker caches old assets. Users must Ctrl+F5 to see updates.

**Fix** in `src/main.tsx`:
- After registering SW, listen for `controllerchange` event and auto-reload
- On every page load, call `registration.update()` to check for new SW
- When a new SW is waiting, post `SKIP_WAITING` message to activate it immediately
- This triggers `controllerchange` which auto-reloads the page — seamless update like Discord

**Fix** in `public/sw.js`:
- The `CACHE_NAME = "critiqs-v" + Date.now()` already ensures new caches on install
- Add version-check: on activate, post message to all clients to reload if stale

## 3. Remove Color Tint from Schedule Stream

**Fix** in `src/components/EventsView.tsx`:
- Remove the `EVENT_COLORS` object and `getEventColors()` usage from timeline event cards
- Use only the neutral glass style for all events (no green/yellow/red tinting)
- Keep the color picker in the add form and details panel for future use (stored in DB) but don't apply visual tinting in the stream
- Active events still get the primary-color glow

## 4. Owner Page (`/owner`)

### 4a. Security Design
- When user navigates to `/owner`, show a generic 404 page initially
- Use `visibilitychange` event: when user leaves tab and returns after 5+ seconds, show a password + pet name form
- Password and pet name are hardcoded as hashed values (or stored as secrets) — validated client-side against a simple hash
- On correct entry, show the admin dashboard
- Session stored in `sessionStorage` (cleared on tab close)

### 4b. Admin Dashboard Features
- **User List**: Create an edge function `admin-stats` that uses the service role key to query `auth.users` and aggregate data. Returns: list of users (email, created_at, last_sign_in_at), total registered count, total guest count (from profiles or approximation)
- **Todo Analytics**: Query `todos` table aggregate stats: total todos created (excluding defaults from premade list), completion rates
- **Tool Usage**: Since tool usage isn't tracked, add a simple counter in localStorage/DB (future). For now show available tools count
- **Announcements**: Create an `announcements` table (id, message, active, created_at). Owner can create/delete announcements. Active announcements show as a banner at the top of the app for all users
- **Refresh button** to re-fetch all stats
- **Charts**: Simple bar charts for user signups over time, todo creation trends

### 4c. Announcement Banner
- In `src/pages/Index.tsx`: fetch active announcements from `announcements` table (public SELECT policy)
- Display as a dismissible banner at the top with the announcement text

### 4d. Database Changes
- New table `announcements` with columns: `id` (uuid), `message` (text), `active` (boolean, default true), `created_at` (timestamptz)
- RLS: public SELECT for all (even anon), INSERT/UPDATE/DELETE restricted (no public policy — only via service role from edge function)

### 4e. Edge Function: `admin-stats`
- Validates a shared admin secret (not user auth — owner uses password)
- Uses service role to query `auth.admin.listUsers()`, aggregate `todos`, `scheduled_events`, `mood_notes` counts
- Returns: user list, total todos, total events, total journal entries

### 4f. Edge Function: `admin-announce`
- Validates admin secret
- CRUD for announcements table using service role

## 5. General Code Quality Checks
- Verify all tools (Pomodoro, Stopwatch, Breathing) render without errors — they are self-contained React components, should work
- Verify journal loads entries correctly
- Ensure daily reminders persist across sessions

---

## Files Summary

| Action | File |
|--------|------|
| Edit | `src/components/AnalyticsView.tsx` (fix completion rate denominator) |
| Edit | `src/main.tsx` (SW auto-update logic) |
| Edit | `src/components/EventsView.tsx` (remove color tints from stream) |
| Create | `src/pages/Owner.tsx` (admin dashboard with 404 disguise + auth) |
| Edit | `src/App.tsx` (add /owner route) |
| Edit | `src/pages/Index.tsx` (announcement banner) |
| Create | `supabase/functions/admin-stats/index.ts` (user & usage stats) |
| Create | `supabase/functions/admin-announce/index.ts` (announcement CRUD) |
| Create | Migration for `announcements` table |

