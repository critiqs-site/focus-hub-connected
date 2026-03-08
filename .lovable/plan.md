# Logo & Favicon Setup Plan

## What We'll Do

1. **Remove backgrounds** from both images using the Gemini image editing API, then save the transparent versions
2. **Favicon** (first image): Copy to `public/favicon.png`, update `index.html` and `manifest.json` to reference it
3. **Logo icon** (second image): Copy to `src/assets/logo-icon.png`, use it in:
  - **Navbar** — replace the text "CRITI" with the logo icon + "critiqs" text beside it [No need to put extra critiqs site the favicon have critiqs text so use that
  - **Auth page** — display the logo prominently above the login form
  - **PWA manifest** — update icon references

## Files to Modify


| File                        | Change                                      |
| --------------------------- | ------------------------------------------- |
| `public/favicon.png`        | New — processed favicon with transparent bg |
| `src/assets/logo-icon.png`  | New — processed logo with transparent bg    |
| `index.html`                | Update favicon link to `/favicon.png`       |
| `public/manifest.json`      | Update icon references                      |
| `src/components/Navbar.tsx` | Replace text logo with icon + text          |
| `src/pages/Auth.tsx`        | Add logo above auth form                    |
