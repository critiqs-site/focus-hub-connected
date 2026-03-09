

# Replace Notes Tab with Events/Schedule System

## Overview
Remove the entire Notes/Mood tracking system and replace the "Notes" tab with an "Events" tab featuring a 3-panel layout: **Left** (What to do now), **Middle** (Daily task scheduler), **Right** (Task detail view). All panels use full glassmorphism styling consistent with the existing aesthetic.

## What Gets Removed
- `NotesSection` component and its usage in Index.tsx
- `NoteEntry` component
- `MoodSelector` component
- `YearlyCalendar` component
- `useNotes` hook and all notes-related state in Index.tsx
- The auto-save daily completion to notes logic (lines 64-83 in Index.tsx)
- The `MoodNote` and `MoodType` types from `types/todo.ts`

## What Gets Built

### 1. New Types (`src/types/todo.ts`)
- `ScheduledEvent` type: `{ id, title, description, time (HH:mm), date (yyyy-MM-dd), completed, createdAt }`
- Keep existing Todo/Divider types

### 2. New Hook (`src/hooks/useEvents.ts`)
- Guest mode support via localStorage (same pattern as useTodos/useNotes)
- Supabase CRUD for authenticated users (will need a new `scheduled_events` table)
- Functions: `addEvent`, `editEvent`, `deleteEvent`, `toggleComplete`
- Auto-detect user timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`

### 3. New Supabase Table: `scheduled_events`
- Columns: `id (uuid)`, `user_id (uuid)`, `title (text)`, `description (text)`, `time (text, HH:mm)`, `date (text, yyyy-MM-dd)`, `completed (boolean)`, `created_at`, `updated_at`
- RLS policies matching existing pattern (users can only CRUD their own rows)

### 4. New Component: `EventsView` (`src/components/EventsView.tsx`)
Three-panel glassmorphism layout (responsive: stacks vertically on mobile):

**Left Panel — "Right Now"**
- Glass card showing the current/next upcoming event based on user's timezone
- Large time display, event title, countdown to next event
- If no event is active, shows "You're free!" message

**Middle Panel — "Today's Schedule"**
- Scrollable list of today's events sorted by time
- Each event shows time + title, click to select
- "Add Event" button with inline form (title + time picker)
- Completed events shown with strikethrough

**Right Panel — "Details"**
- Shows selected event's full details
- Editable title, time, and rich description (textarea)
- Delete and mark-complete buttons
- Empty state when nothing is selected

### 5. Glassmorphism Styling
All three panels use the existing `.glass-card` class foundation but enhanced:
- No hard borders — uses `hsla(0, 0%, 100%, 0.06)` subtle glass edges
- `backdrop-filter: blur(40px) saturate(180%)`
- Inner glow via `inset box-shadow`
- Consistent with the app's orange primary color and dark theme

### 6. Wire Up in Index.tsx
- Replace `activeTab === "notes"` branch with `<EventsView />`
- Rename tab from "Notes" to "Events" in Header.tsx
- Remove all notes-related imports, state, and the auto-save useEffect
- Pass events data to FloatingAIChat if needed

## File Changes Summary
| File | Action |
|------|--------|
| `src/types/todo.ts` | Remove mood types, add `ScheduledEvent` |
| `src/hooks/useEvents.ts` | New — CRUD hook with guest + Supabase support |
| `src/components/EventsView.tsx` | New — 3-panel schedule UI |
| `src/components/Header.tsx` | Rename "Notes" → "Events" |
| `src/pages/Index.tsx` | Remove notes imports/state/logic, wire EventsView |
| `src/components/NotesSection.tsx` | Delete |
| `src/components/NoteEntry.tsx` | Delete |
| `src/components/MoodSelector.tsx` | Delete |
| `src/components/YearlyCalendar.tsx` | Delete |
| `src/hooks/useNotes.ts` | Delete |
| Supabase migration | New table `scheduled_events` with RLS |

