

# Scale Up UI for Desktop/Laptop

The current layout uses `max-w-6xl` (1152px) container and mobile-first sizing. On a 1920px desktop screen, the content looks small and cramped. The fix involves scaling up elements specifically for larger screens using responsive Tailwind classes (`lg:` and `xl:` prefixes).

## Changes

### 1. Main Layout (`src/pages/Index.tsx`)
- Increase max container width from `max-w-6xl` to `max-w-7xl` (1280px)
- Increase padding from `px-4 py-6` to `lg:px-8 lg:py-10`

### 2. CompletionBanner (`src/components/CompletionBanner.tsx`)
- Badge container: `120x120px` → `lg:160x160px`
- Badge icon: `w-14 h-14` → `lg:w-20 lg:h-20`
- Percentage text: `text-2xl` → `lg:text-4xl`
- Label text: `text-sm` → `lg:text-base`
- Progress bar max width: `max-w-sm` → `lg:max-w-md`
- Scale glow sizes proportionally on desktop

### 3. Header Tabs (`src/components/Header.tsx`)
- Tab text: `text-sm` → `lg:text-base`
- Tab padding: `px-4 py-2` → `lg:px-6 lg:py-3`
- Bottom margin: `mb-6` → `lg:mb-8`

### 4. TodoItem (`src/components/TodoItem.tsx`)
- Card padding: `p-4` → `lg:p-6`
- Icon button: `md:p-3` → `lg:p-4`
- Icon size: `md:h-6 md:w-6` → `lg:h-8 lg:w-8`
- Percentage text: `md:text-2xl` → `lg:text-3xl`
- Todo name: `text-sm` → `lg:text-base`
- Day circles: `w-8 h-8` → `lg:w-10 lg:h-10` with `lg:text-sm` for day labels
- Progress bar height: `h-1.5` → `lg:h-2`

### 5. TodoDivider (`src/components/TodoDivider.tsx`)
- Section icon: `h-6 w-6` → `lg:h-8 lg:w-8`
- Section title: `text-lg` → `lg:text-xl`
- Icon container padding: `p-2` → `lg:p-3`

### 6. Section Headers in Index (`src/pages/Index.tsx`)
- "Remaining" / "Done" heading: `text-lg` → `lg:text-xl`
- Section icons: `h-5 w-5` → `lg:h-6 lg:w-6`

### 7. Navbar (`src/components/Navbar.tsx`)
- Height: `h-14` → `lg:h-16`
- Logo: `h-8` → `lg:h-10`
- Link text: `text-sm` → `lg:text-base`

All changes use `lg:` breakpoint (1024px+) so mobile/tablet layouts remain untouched.

