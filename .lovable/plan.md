

# Analytics Redesign: Weekly/Monthly/Yearly Bar Chart with Progress Tracking

## Overview
Complete redesign of the analytics view to display completion percentage trends over time using bar charts. The system will track daily completion rates (% of todos completed each day) and show improvement/decline metrics comparing periods.

## Current State Analysis

**Existing Implementation** (`src/components/AnalyticsView.tsx`):
- Monthly calendar view with completion heatmap
- Streak tracking (current/longest)
- Individual todo selector
- Stats cards showing completion rate
- Uses `date-fns` for date manipulation

**Data Structure** (`src/types/todo.ts`):
- `Todo.completions`: Array of date strings (yyyy-MM-dd format)
- Each date in the array represents a day the todo was completed

## New Design Architecture

### 1. Time Period System
**Three Views**:
- **Weekly**: Last 7 days, each bar = 1 day
- **Monthly**: Last 30 days, each bar = 1 day  
- **Yearly**: Last 12 months, each bar = 1 month (averaged)

**Tab Selector**: Glass morphism buttons at top (Weekly/Monthly/Yearly)

### 2. Data Calculation Logic

**Daily Completion Percentage**:
```
For each day:
  completedCount = todos.filter(t => t.completions.includes(dateStr)).length
  percentage = (completedCount / todos.length) * 100
```

**Period Aggregation**:
- Weekly: 7 data points (individual days)
- Monthly: 30 data points (individual days)
- Yearly: 12 data points (monthly averages)

**Improvement Metric**:
```
currentPeriodAvg = average of all percentages in current period
previousPeriodAvg = average of all percentages in previous period
improvement = currentPeriodAvg - previousPeriodAvg
```

### 3. Visual Components

**Layout Structure**:
```
┌─────────────────────────────────────┐
│  [Weekly] [Monthly] [Yearly]  ←tabs│
├─────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐        │
│  │  75%     │  │  +12%    │  ←cards│
│  │ Current  │  │Improvement│        │
│  └──────────┘  └──────────┘        │
├─────────────────────────────────────┤
│                                     │
│      Bar Chart                      │
│      ▂▄█▅▇▆▄                       │
│                                     │
└─────────────────────────────────────┘
```

**Bar Chart Design**:
- Recharts `<BarChart>` component
- Gradient fill bars (primary color with opacity)
- X-axis: Dates/labels
- Y-axis: Percentage (0-100%)
- Smooth rounded corners on bars
- Hover tooltips showing exact percentage
- Grid lines with subtle opacity

**Summary Cards** (2 cards):
1. **Average Completion**: Shows current period average percentage
2. **Improvement**: Shows +/- percentage change from previous period
   - Green/positive indicator for improvement
   - Red/negative indicator for decline

**Glass Morphism Styling**:
- Backdrop blur (40px+)
- Semi-transparent backgrounds (hsla with 0.4-0.6 alpha)
- Subtle borders (hsla white with 0.18 alpha)
- Inner glow shadows
- Ambient gradient orbs in background

### 4. Empty States

**No Todos**:
```
"No habits to track yet"
"Add habits to see your progress analytics"
```

**No Data for Period**:
```
"No data available for this period"
"Start completing habits to build your analytics"
```

### 5. Implementation Files

**Modified**:
- `src/components/AnalyticsView.tsx` - Complete rewrite

**New Logic Functions**:
- `getDatesForPeriod(period)` - Returns array of dates for selected period
- `calculateDailyPercentage(date, todos)` - Calculate completion % for a single day
- `getChartData(period, todos)` - Format data for recharts
- `calculatePeriodStats(data)` - Get current period average
- `calculateImprovement(currentData, previousData)` - Compare periods

**Recharts Components Used**:
- `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`
- Custom tooltip with glass morphism styling

### 6. Technical Details

**Date Range Calculation**:
- Weekly: `subDays(today, 6)` to `today`
- Monthly: `subDays(today, 29)` to `today`
- Yearly: `subMonths(today, 11)` to `today` (aggregate by month)

**Performance**:
- Memoize chart data calculations
- Only recalculate when todos or period changes

**Responsive Design**:
- Mobile: Stacked cards, condensed chart
- Desktop: Side-by-side cards, full-width chart

**Error Handling**:
- Handle zero todos gracefully
- Handle missing completion data
- Show empty state for future dates

### 7. Visual Enhancements

**Bar Styling**:
- Gradient from primary to primary/80
- Rounded top corners (`radius={[8, 8, 0, 0]}`)
- Glow effect on hover
- Min height for 0% values (visual indicator)

**Animations**:
- Fade in on mount
- Bar height animation (300ms ease)
- Tab switch transition

**Color Indicators**:
- High completion (80-100%): Primary color with strong glow
- Medium completion (50-79%): Primary color
- Low completion (0-49%): Primary color with reduced opacity

