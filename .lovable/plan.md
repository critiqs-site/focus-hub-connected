

# Phase 2 Implementation Plan

## 1. Show All / Show Fewer Toggle for Todos

**What**: Add a toggle above the "Remaining" section. Default = "Show All". When "Show Fewer" is selected, only show top 3 remaining todos. When one is completed, the next one slides in.

**Changes**:
- Edit `src/pages/Index.tsx`: Add state `showFewer` (default false). When true, slice `remainingTodos` to first 3. Add a small toggle button row ("Show All" / "Show Fewer") above the Remaining header.

## 2. Daily Reminders Rework — Random Motivational Quote

**What**: Completely rework DailyReminders. It becomes its own section. Users can add as many reminder notes as they want. On every app open, one random reminder is picked and shown as a big motivational quote. A refresh button picks a new random one.

**Changes**:
- Edit `src/components/DailyReminders.tsx`:
  - When reminders exist: show a large glass-card with a random reminder as a quote (bigger text, quotation marks, centered)
  - Add a refresh (🔄) button to re-randomize
  - Below the quote, show "Manage Reminders" expand to see full list with add/remove
  - When no reminders: show the "Add Daily Reminder" button which navigates to the reminder manager
- Edit `src/pages/Index.tsx`: Keep DailyReminders in its current position above todos

## 3. Fix Light Theme Appearance

**What**: The white/light themes look bad because `glass-card` uses hardcoded dark HSL values (`hsla(240, 8%, 10%, 0.6)`). Need to make glass-card and other components adapt to light mode.

**Changes**:
- Edit `src/index.css`:
  - Add `.light-theme .glass-card` override with light-appropriate glass: `background: hsla(0, 0%, 100%, 0.7)`, `border: 1px solid hsla(0,0%,0%,0.08)`, lighter shadow
  - Add `.light-theme body` background with softer gradients suitable for white
  - Add `.light-theme .spin-ring::before` with appropriate border colors
- Edit `src/hooks/useTheme.ts`: Fine-tune the LIGHT_BASE values — make muted-foreground darker for better readability, adjust border contrast
- Edit `src/components/Header.tsx`: Replace hardcoded `hsla(240, 8%, 10%, 0.5)` background with a CSS class that adapts to theme

## 4. Fix Non-Orange Dark Themes

**What**: Purple and Maroon dark themes may have hardcoded orange/maroon references (e.g., Header tab glow `hsla(0, 60%, 35%, 0.2)`). Audit and replace with `var(--primary)` references.

**Changes**:
- Edit `src/components/Header.tsx`: Replace `hsla(0, 60%, 35%, 0.2)` in boxShadow with `hsl(var(--primary) / 0.2)` via template literal or CSS variable

## 5. Tools View — Separate Manual & AI Sections

**What**: Split tools into two sections: "Manual Tools" (Pomodoro, Stopwatch, Breathing) and "AI Tools" (Physique Rater, Outfit Rater, Food Scanner). Add "AI can make mistakes. Please double check." disclaimer under AI tools section header.

**Changes**:
- Edit `src/components/ToolsView.tsx`:
  - Add section headers: "⚙️ Manual Tools" and "🤖 AI Tools"
  - Group Pomodoro + Stopwatch + Breathing under Manual
  - Group Physique + Outfit + Food under AI
  - Add disclaimer text under AI header
  - Accept `isGuest` prop — if guest, show "Sign in to use AI tools" instead of rendering the AI tool components

- Edit `src/pages/Index.tsx`: Pass `isGuest` prop to ToolsView

## 6. AI Disclaimer + Guest AI Restriction

**What**: For guests, disable the floating AI chat button entirely. Add "AI can make mistakes. Please double check." to every AI tool result and the chat window.

**Changes**:
- Edit `src/pages/Index.tsx`: Only render `<FloatingAIChat>` when `!isGuest`
- Edit `src/components/FloatingAIChat.tsx`: Add small disclaimer text at bottom of chat area: "AI can make mistakes. Please double check."
- Edit `src/components/PhysiqueRater.tsx`, `src/components/OutfitRater.tsx`, `src/components/FoodScanner.tsx`: Add disclaimer below results

---

## Files Summary

| Action | File |
|--------|------|
| Edit | `src/pages/Index.tsx` (show fewer toggle, pass isGuest to tools, hide AI chat for guests) |
| Edit | `src/components/DailyReminders.tsx` (random quote display, refresh, manage UI) |
| Edit | `src/index.css` (light theme glass-card, body bg overrides) |
| Edit | `src/hooks/useTheme.ts` (tune light base values) |
| Edit | `src/components/Header.tsx` (remove hardcoded colors) |
| Edit | `src/components/ToolsView.tsx` (manual vs AI sections, guest restriction) |
| Edit | `src/components/FloatingAIChat.tsx` (disclaimer) |
| Edit | `src/components/PhysiqueRater.tsx` (disclaimer) |
| Edit | `src/components/OutfitRater.tsx` (disclaimer) |
| Edit | `src/components/FoodScanner.tsx` (disclaimer) |

