

# Fix SPA Routing + Improve Download Page

## Problem

The 404 errors on `/auth` and `/download` happen because there is no server-side rewrite configuration. When someone directly visits these URLs (not via client-side navigation), the server looks for a real file and returns 404.

## Solution

### 1. Add `vercel.json` for Vercel deployments

Create `vercel.json` in the project root with SPA rewrites. This ensures all routes serve `index.html`.

### 2. Add `_redirects` for Netlify (just in case)

Create `public/_redirects` with `/* /index.html 200` as a safety net.

### 3. Improve Download page for PC users

Update `src/pages/Download.tsx`:
- When `beforeinstallprompt` is not supported (PC Safari, Firefox), show **specific browser instructions**:
  - Chrome/Edge: "Look for the install icon in the address bar"
  - Safari: "Use File > Add to Dock (macOS)"
  - Firefox: "Firefox does not support PWA install. Use Chrome or Edge."
- Add browser detection to show the right instructions

## Deployment Clarification

Lovable hosts your app at `thought-haven-link.lovable.app`. If you also deploy to Vercel or GitHub Pages, the `vercel.json` / `_redirects` files will handle routing there. Lovable's own hosting already handles SPA routing -- so if you're only using Lovable, the 404 should not happen on the Lovable URLs.

If you're seeing 404 on the Lovable preview URL, it may be a caching issue -- try a hard refresh (Ctrl+Shift+R).

---

## Files

| File | Action |
|------|--------|
| `vercel.json` | Create -- SPA rewrite rules |
| `public/_redirects` | Create -- Netlify fallback |
| `src/pages/Download.tsx` | Update -- add browser-specific install instructions for PC |

---

## Technical Details

**vercel.json:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**_redirects:**
```
/* /index.html 200
```

**Browser detection** in Download.tsx will use `navigator.userAgent` to detect Chrome, Edge, Safari, or Firefox and show tailored instructions when the `beforeinstallprompt` event is not available.

