

# Logo & Favicon Placement Plan

## Assets

- **Image 1** (CE icon only) → `src/assets/logo-icon.png` — used as the **logo** in Navbar and Auth page
- **Image 2** (critiqs full logo with text) → `public/favicon.png` — used as the **favicon** and PWA icon

## Changes

| File | Change |
|------|--------|
| `src/assets/logo-icon.png` | Copy image 1 (CE icon) |
| `public/favicon.png` | Copy image 2 (critiqs text logo) |
| `src/components/Navbar.tsx` | Show CE icon logo, ~32px height, with `mix-blend-screen` for dark bg |
| `src/pages/Auth.tsx` | Welcome screen: large CE icon (~140px). Auth form: smaller CE icon (~96px). Both with `mix-blend-screen` |
| `index.html` | Already references `/favicon.png` — no change needed |
| `public/manifest.json` | Already references `/favicon.png` — no change needed |

Both images already have transparent/white backgrounds. Using `mix-blend-screen` will make white areas invisible on the dark theme.

