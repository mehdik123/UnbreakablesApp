---
name: fitness-dataviz
description: Build the training-specific data visuals that make a fitness app feel alive. Use whenever creating progress rings, rest/workout timers, streak calendars or heatmaps, volume and PR charts, animated stat counters, set-completion indicators, week-over-week comparisons, or any number that should animate rather than snap. Trigger this for "show progress", "add a timer", "streak", "PR chart", "volume graph", "animate this number", or any workout-stat display. Web/PWA.
---

# Fitness data-viz (web / PWA)

Numbers are the emotional core of a training app. Always render them in `--font-stat` (Space Grotesk) with `tabular-nums`, and animate change instead of hard-swapping.

Libraries: **SVG + Motion** for rings, timers, counters, checkmarks (no dependency needed). For real charts, use **visx** (`@visx/*`) for custom/branded, or **Recharts** for speed. Animate chart entrances with Motion.

## Progress ring (close-the-ring style)
```tsx
const R = 52, C = 2 * Math.PI * R;
<svg viewBox="0 0 120 120">
  <defs>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#E11D48" /><stop offset="100%" stopColor="#FF6A4D" />
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r={R} stroke="var(--surface-3)" strokeWidth="10" fill="none" />
  <motion.circle cx="60" cy="60" r={R} stroke="url(#ring)" strokeWidth="10" fill="none"
    strokeLinecap="round" transform="rotate(-90 60 60)"
    strokeDasharray={C}
    initial={{ strokeDashoffset: C }}
    animate={{ strokeDashoffset: C * (1 - pct) }}
    transition={{ type: "spring", stiffness: 120, damping: 20 }} />
</svg>
```

## Rest / workout timer
Reuse the ring, drive it from a countdown (store `endsAt`, tick with `requestAnimationFrame`, not `setInterval`, for smoothness). Center shows the time in `--font-stat`. At zero: pulse the ring, fire `haptic.success()`, and hand a celebration to delight-moments if it is the final set.

## Animated stat counter (weight, reps, streak, volume)
```tsx
const mv = useSpring(0, { stiffness: 120, damping: 24 });
useEffect(() => { mv.set(value); }, [value]);
const text = useTransform(mv, v => Math.round(v).toLocaleString());
<motion.span className="stat">{text}</motion.span>
```

## Streak heatmap (GitHub-style)
CSS grid of day cells; intensity maps to opacity/scale of the brand color. Animate the current day with a subtle pulse.
```tsx
<div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:"var(--space-1)" }}>
  {days.map(d => <div key={d.date} style={{ aspectRatio:1, borderRadius:4,
    background:`rgba(225,29,72,${0.15 + d.intensity * 0.85})` }} />)}
</div>
```

## Volume / PR charts
- Weekly volume: visx or Recharts bar chart, bars filled with the brand gradient, entrance staggered via Motion (`staggerChildren`).
- PR trend: line/area chart, area filled with `--gradient-brand-soft`, a glowing dot on the latest point.
- Keep axes quiet: muted labels (`--text-3`), no gridlines or hairline only, generous padding.

## Set-completion checkmark
Draw the check with an animated SVG path (`pathLength` 0 -> 1, spring), plus a quick scale pop and `haptic.light()`.

## Week 0 vs Week 12 comparison
Side-by-side or overlaid bars; animate the "after" bar growing from the "before" value, and label the delta in the brand gradient.
