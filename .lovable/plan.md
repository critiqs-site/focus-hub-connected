

# Theme Upgrade — Premium Dark Aesthetic with Atmospheric Glows

Inspired by the 3 reference images, the goal is to transform the current flat dark theme into a rich, atmospheric dark UI with deep background gradients, colored glow orbs, refined glassmorphism, and subtle depth — while keeping the black + orange color scheme.

## Key Visual Elements from References

- **Deep gradient backgrounds** with subtle purple/blue-tinted dark tones (we'll use warm orange-tinted darks instead)
- **Atmospheric glow orbs** — large, blurred colored circles in the background creating depth
- **Refined glass cards** — slightly more visible borders with subtle inner glow
- **Gradient mesh background** on the body instead of flat black
- **Cards with subtle gradient borders** and softer shadows

## Changes

### 1. `src/index.css` — Core Theme Overhaul
- Change `--background` from flat `0 0% 4%` to a richer dark tone `240 10% 4%` (slight blue-black)
- Change `--card` to `240 8% 8%` for depth
- Update `--secondary`, `--muted`, `--border` with slight blue undertones
- Add a new `body::before` pseudo-element with a radial gradient mesh (dark with subtle orange/warm spots)
- Update `.glass-card` with stronger `backdrop-blur`, subtle `shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`, and refined border
- Add new utility `.ambient-glow` for atmospheric orb elements

### 2. `src/pages/Index.tsx` — Background Glow Orbs
- Upgrade the existing `pointer-events-none` background div with more atmospheric orbs:
  - Top-left: warm orange glow (larger, more diffuse)
  - Bottom-right: subtle secondary warm glow
  - Center-top: very faint wide ambient light
- Add a subtle noise/grain texture overlay via CSS

### 3. `src/pages/Auth.tsx` — Atmospheric Auth Pages
- Add background glow orbs similar to Index
- Welcome screen: subtle radial gradient behind the logo
- Auth form card: enhanced glassmorphism with deeper blur and glow border

### 4. `src/components/Navbar.tsx` — Refined Nav
- Slightly more transparent background with stronger backdrop-blur
- Subtle bottom border glow effect

### 5. `src/components/Header.tsx` — Tabs Enhancement
- Active tab gets a subtle glow shadow matching primary color
- Tab bar background slightly more glass-like

### 6. `src/components/TodoItem.tsx` — Card Depth
- Enhanced glass-card hover state with subtle orange glow on hover
- Progress bar gets a subtle glow effect

### 7. `src/components/TodoDivider.tsx` — Divider Line
- Gradient line gets a subtle glow/shimmer

## Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Richer dark tones, gradient body background, refined glass-card, ambient utilities |
| `src/pages/Index.tsx` | Upgraded atmospheric background orbs |
| `src/pages/Auth.tsx` | Add background orbs, enhance card glassmorphism |
| `src/components/Navbar.tsx` | Stronger blur, subtle glow border |
| `src/components/Header.tsx` | Active tab glow, glassier tab bar |
| `src/components/TodoItem.tsx` | Hover glow, progress bar glow |
| `src/components/TodoDivider.tsx` | Subtle gradient glow on divider line |

