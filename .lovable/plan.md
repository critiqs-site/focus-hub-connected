

# Full A-to-Z Audit: Issues & Improvements

## CRITICAL BUGS

### 1. RLS Policies Are All RESTRICTIVE — Data Access Is Broken
All 19 RLS policies across all 5 tables are `RESTRICTIVE` type. PostgreSQL requires at least one `PERMISSIVE` policy for any access. With only RESTRICTIVE policies, **no authenticated user can read/write their own data**. The app only works if it's somehow bypassing RLS (e.g., the anon key grants access by default, or data only loads for guests via localStorage).

**Fix**: Drop all 19 policies and recreate as PERMISSIVE, scoped to `authenticated` role.

### 2. Edge Functions Open to Abuse (No Auth on 3/5)
`ai-chat`, `food-scanner`, `outfit-rater` have `verify_jwt = false` and zero auth checks. Anyone can POST to these endpoints and burn your Pollinations API credits.

**Fix**: Add auth validation to `food-scanner` and `outfit-rater` (copy the pattern from `physique-rater`). For `ai-chat`, add rate limiting or at minimum validate a session exists (guest users get anonymous Supabase sessions).

### 3. `schedule-ai` Missing from `config.toml`
Not listed, so it defaults to `verify_jwt = true`. This means guest users can't use it at all — they'll get 401 errors when trying "Create from AI" in the Schedule tab.

**Fix**: Add `[functions.schedule-ai]` with `verify_jwt = false` + add manual auth check inside, OR keep JWT verification and handle the guest case in the frontend.

---

## FUNCTIONAL BUGS

### 4. Fixed Week Can Show Future Dates as Uncompletable
If today is March 8, `getFixedWeekDays` returns days 8-14. Days 9-14 are in the future but appear as empty circles with `cursor-default opacity-60`. Users see 7 circles but can only complete 1 (today), making it impossible to reach high percentages until the end of the week block. This is by design per the user's request, but the **analytics "weekly" view shows 0% for future days**, dragging down the average.

**Fix**: In analytics, only calculate averages up to today's date within the fixed week (filter out future days).

### 5. Analytics "Previous Period" Still Broken for Monthly/Yearly
The monthly comparison uses `subDays(today, 59-i)` — a rolling 30-day window 30-60 days ago. If user only started recently, this always shows "No Previous Data". The yearly view compares months 12-23 months ago.

**Fix**: For monthly, compare to the actual previous calendar month. For yearly, this is fine as-is.

### 6. Events: No Date Picker — Can Only Schedule for Today
`onAddEvent` hardcodes `todayStr` as the date. Users can't plan events for tomorrow or future days. The AI also hardcodes `todayStr` for all generated events.

### 7. Onboarding `upsert` May Fail Without Unique Constraint
`OnboardingDialog` uses `supabase.from("profiles").upsert(...)` but there's no visible unique constraint on `user_id` in the profiles table schema. If `user_id` isn't unique, upsert won't work as expected.

### 8. Delete Section Doesn't Confirm
`handleDeleteDivider` deletes a section AND all its todos immediately without confirmation. One misclick loses all data.

---

## UX IMPROVEMENTS

### 9. No Undo for Destructive Actions
Deleting a todo or section is instant and permanent. No undo/toast with "Undo" button.

### 10. Mobile: Day Circles Overflow & Action Buttons Cramped
On mobile, the 7 day circles + 3 action buttons (pin, edit, delete) are all in one horizontal row. With fixed weeks potentially showing 7+ circles, this overflows and requires scrolling.

### 11. Description Only Visible on Desktop
`todo.description` has `hidden md:block` — mobile users never see descriptions they add.

### 12. No Loading State for Schedule AI on First Use
When "Create from AI" is clicked, the textarea appears but there's no indication of what "Create from AI" does if the user has never used it.

### 13. Guest Mode Data Never Migrates
If a guest signs up, their localStorage data (todos, events) is lost. No migration path from guest → authenticated.

---

## SECURITY ISSUES

### 14. Physique-Uploads Bucket Is Public
Anyone with the URL can access uploaded physique images. These are sensitive personal photos.

### 15. Leaked Password Protection Disabled
Supabase can check passwords against breached databases. Currently off.

### 16. CORS is `*` on All Functions
Any website can call your edge functions.

---

## CODE QUALITY

### 17. `(t as any)` Casts in `useTodos.ts`
Lines 42-43 use `(t as any).description`, `(t as any).pinned` — indicating the Supabase types are out of sync with the actual schema. These columns exist in DB but not in the generated types.

### 18. Event Details Panel Fires `onEditEvent` on Every Keystroke
In `EventsView.tsx` line 422-423, the title input calls `onEditEvent` on every `onChange` (each keystroke). This fires a Supabase update per character typed. Should debounce.

### 19. `DateDisplay` Component Accepts `weekStart` Prop But Ignores It
`DateDisplay` takes a `weekStart` prop but internally uses `getFixedWeekDays(today)` — the prop is unused.

---

## SUMMARY OF RECOMMENDED FIXES (Priority Order)

| # | Issue | Priority |
|---|---|---|
| 1 | Convert all RLS policies to PERMISSIVE + authenticated | CRITICAL |
| 2 | Add auth to `food-scanner`, `outfit-rater`, `ai-chat` | CRITICAL |
| 3 | Add `schedule-ai` to config.toml | HIGH |
| 4 | Fix analytics to exclude future days from averages | HIGH |
| 5 | Make physique-uploads bucket private | HIGH |
| 6 | Debounce event title editing | MEDIUM |
| 7 | Add delete confirmation for sections | MEDIUM |
| 8 | Enable leaked password protection (dashboard) | MEDIUM |
| 9 | Show descriptions on mobile | LOW |
| 10 | Remove unused `weekStart` prop | LOW |
| 11 | Fix `as any` casts by regenerating types | LOW |

