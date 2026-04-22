

# Multi-Feature Polish & UX Improvements

## 1. Restrict Announcements to Registered Users Only
**File**: `src/pages/Index.tsx`
- Only fetch/show announcement banner when `user` is authenticated (not guest mode)
- Wrap announcement query and banner render in `if (user && !isGuest)` check

## 2. Keep AI Tools Available for Guests (Demo Access)
**Files**: `src/components/EventsView.tsx` (CREATE FROM AI), `src/components/AddTodoDialog.tsx` (auto-detect icon)
- Verify both features call edge functions without requiring auth gating on the client
- Edge functions `schedule-ai` and icon detection already use Lovable AI Gateway — confirm guests can invoke them
- Remove any client-side `if (!user) return` guards on these two specific actions
- Other guest restrictions (sync, cloud save) remain intact

## 3. Update Guest Banner Copy
**File**: `src/pages/Index.tsx`
- Replace current text: "Guest mode — data is saved locally only. Sign up to sync"
- New text: `Guest users cannot use the full version of this app. <a>Register now!</a> It's free.`
- "Register now!" is an underlined link routing to `/auth`
- Keep the same banner styling/position

## 4. Onboarding for New Guest Users
**File**: `src/components/OnboardingDialog.tsx` (existing)
- Confirm the existing two-step flow (name + 10 premade habits checklist, "pick at least one") also triggers for guest mode users on first visit
- If currently auth-only, extend trigger to fire when guest mode is first activated and no todos exist
- Use same persistence pattern (localStorage flag `onboarding_completed_guest`)

## 5. Add Sound Effects to Manual Tools
**Files**: `src/components/PomodoroTimer.tsx`, `src/components/Stopwatch.tsx`, `src/components/BreathingExercise.tsx`
- Use Web Audio API (`AudioContext`) to generate simple tones — no external audio files needed (keeps bundle small)
- **Pomodoro**: bell tone (800Hz, 0.5s) when focus session ends, lower tone (400Hz) when break ends
- **Stopwatch**: short click (1000Hz, 50ms) on start/pause, double-beep on lap
- **Breathing**: soft sine wave tones cued to inhale (rising 200→400Hz) / exhale (falling 400→200Hz) phases
- Add a mute toggle button (speaker icon) in each tool header, persisted to localStorage

## 6. Enhanced Navbar Design
**File**: `src/components/Navbar.tsx`
- Current navbar is cluttered with three external links + logo
- Redesign:
  - Left: Logo (slightly larger, with subtle glow on hover)
  - Right: Group external links into a compact dropdown menu ("More" button with ChevronDown) containing TERMS / PRIVACY / DONATE
  - Add a primary CTA button on the right: "Register" (for guests) or user avatar/menu (for authenticated users)
  - Improve spacing, add subtle bottom border with primary color accent
  - Smooth backdrop-blur with refined glass effect

---

## Files Summary

| Action | File |
|--------|------|
| Edit | `src/pages/Index.tsx` (gate announcements, update guest banner copy) |
| Edit | `src/components/OnboardingDialog.tsx` (trigger for guests) |
| Edit | `src/components/PomodoroTimer.tsx` (sound + mute toggle) |
| Edit | `src/components/Stopwatch.tsx` (sound + mute toggle) |
| Edit | `src/components/BreathingExercise.tsx` (sound + mute toggle) |
| Edit | `src/components/Navbar.tsx` (cleaner layout, dropdown for links, register CTA) |
| Verify | `src/components/EventsView.tsx`, `src/components/AddTodoDialog.tsx` (AI features unblocked for guests) |

