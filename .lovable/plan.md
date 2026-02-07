

# Full UI/UX Overhaul Plan

This plan covers all your requested changes across the Auth page, main app layout, edge function, profile menu, and toast notifications.

---

## 1. Edge Function: Switch from Gemini to OpenAI-fast

**File:** `supabase/functions/ai-chat/index.ts`

Change `model: "google/gemini-2.5-flash"` to `model: "openai-fast"` (or `"claude-fast"` as fallback).

---

## 2. Auth Page (`src/pages/Auth.tsx`) -- Major Overhaul

### Welcome Screen Changes:
- Remove the "Let's Go!" speech bubble/border entirely (lines 88-90)
- Remove ALL floating dots/blobs (lines 71-78, and the dot indicators lines 106-109)
- Remove `animate-wave` from the wave emoji -- keep it as a static 👋
- Remove `animate-bounce-gentle` from mascot
- Remove floating background blobs from auth step too (lines 117-121)

### Auth Form Changes:
- Default to **Register** (`isLogin` starts as `false` instead of `true`)
- Login heading: "Welcome Back!" (no sparkle emoji) / subtitle: "Great to see you again"
- Register heading: "Register!" / subtitle: "One step away from being the beast!"
- Email placeholder: `name@domain.com` instead of `you@example.com`
- Add **"Continue with Google"** and **"Continue with GitHub"** buttons above the email form with OAuth via `supabase.auth.signInWithOAuth` using `skipBrowserRedirect: true` for custom domain support
- Add **"Guest Mode"** button -- navigates directly to Index, stores a `guestMode: true` flag in localStorage

### OAuth Redirect Fix:
- Use `skipBrowserRedirect: true` + manual redirect with URL validation (as described in the stack overflow solution) to prevent redirecting to `localhost:3000`
- The user also needs to set their **Site URL** to `https://www.critiqs.site` and add it as a **Redirect URL** in Supabase Dashboard > Authentication > URL Configuration

---

## 3. Guest Mode Support

**Files:** `src/pages/Auth.tsx`, `src/pages/Index.tsx`, `src/hooks/useTodos.ts`, `src/hooks/useNotes.ts`

- Auth page gets a "Continue as Guest" button that sets `localStorage.setItem("guestMode", "true")` and navigates to `/`
- `Index.tsx` updated: if no user but `guestMode` is set, allow access (don't redirect to `/auth`)
- `useTodos` and `useNotes` hooks: if no userId, fall back to localStorage for storing/retrieving data
- Guest mode shows a banner or indicator that data is local-only

---

## 4. Toast Notifications -- Show in Form, Not Bottom-Right

**File:** `src/pages/Auth.tsx`

- Replace `toast.error()` / `toast.success()` with inline state-based messages
- Add a `formMessage` state: `{ type: "success" | "error", text: string } | null`
- Display it as a colored banner inside the form card (green for success, red for error)
- Remove sonner toast calls from the auth flow

---

## 5. Profile Menu -- Remove Change Password

**File:** `src/components/UserProfileMenu.tsx`

- Remove the "Change Password" menu item (lines 76-82)
- Remove the entire password dialog (lines 93-139)
- Remove unused state variables and imports (`KeyRound`, `Dialog`, etc.)

---

## 6. Navbar Restructure

### New Top Navbar (`src/components/Navbar.tsx` -- new file)
- Full-width bar at the very top
- Left: "CRITIQS" logo text
- Right: External links -- DOCS (docs.critiqs.site), GITHUB (https://github.com/critiqs-site), DONATE (donate.critiqs.site)

### Updated Header (`src/components/Header.tsx`)
- Remove the "CRITIQS" title (it moves to navbar)
- Keep only the section tabs (Todos, Analytics, Notes, Therapist)
- Profile icon moves here (passed as prop or rendered alongside)

### Updated Index (`src/pages/Index.tsx`)
- Render `<Navbar />` at the top (outside the max-w-4xl container, full width)
- Below that, the existing content with Header (tabs + profile) and sections

---

## 7. Clean Up Animations in `src/index.css`

Remove or keep but stop using:
- `animate-float`, `animate-float-delayed` -- no longer used after auth cleanup
- `animate-bounce-gentle` -- no longer used
- Keep `animate-fade-in`, `animate-slide-up`, `animate-scale-in` as they're used in the main app

---

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/ai-chat/index.ts` | Change model to `openai-fast` |
| `src/pages/Auth.tsx` | Major rewrite: remove animations, add OAuth, Guest Mode, inline toasts, default to Register |
| `src/pages/Index.tsx` | Add Navbar, support guest mode |
| `src/components/Navbar.tsx` | New -- top navbar with CRITIQS + external links |
| `src/components/Header.tsx` | Remove CRITIQS title, keep tabs only, add profile icon |
| `src/components/UserProfileMenu.tsx` | Remove change password option and dialog |
| `src/hooks/useTodos.ts` | Add localStorage fallback for guest mode |
| `src/hooks/useNotes.ts` | Add localStorage fallback for guest mode |
| `src/index.css` | Clean up unused animation classes |

---

## User Action Required

Before OAuth (Google/GitHub) login works:
1. Go to **Supabase Dashboard > Authentication > URL Configuration**
2. Set **Site URL** to: `https://www.critiqs.site` (or your preview URL for testing)
3. Add **Redirect URLs**: `https://www.critiqs.site/**` and your Lovable preview URL
4. Ensure Google and GitHub providers are enabled under **Authentication > Providers**

