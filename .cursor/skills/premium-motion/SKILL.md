---
name: premium-motion
description: The motion language for the app. Use this whenever building or touching ANY UI that moves: page and route transitions, list and card reveals, button and tap feedback, shared-element transitions between list and detail, collapsing scroll headers, modals and sheets, or any micro-interaction. Trigger this even when the user only says "make it feel smooth", "add animation", "polish this screen", or "it feels static" without naming motion explicitly. Web/PWA using Motion (Framer Motion).
---

# Premium motion (web / PWA)

Library: **Motion** (formerly Framer Motion). Import as `import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion, useSpring } from "motion/react"` (older projects: `"framer-motion"`).

The difference between "cheap" and "premium" is spring physics and restraint. Follow these rules.

## Golden rules
1. Animate **only `transform` and `opacity`** (translate, scale, rotate). Never animate `width`, `height`, `top`, `left`, `margin` in motion loops; use `scale`/`translate` or Motion `layout` instead. This is what keeps it at 60fps.
2. Use **springs, not linear easing**, for anything interactive. Reserve `ease-out` (`cubic-bezier(0.22,1,0.36,1)`) for simple fades.
3. Keep it **fast and subtle**: 150 to 360ms. If an animation is noticeable as "an animation", it is usually too slow.
4. Always gate on `const reduce = useReducedMotion()` and drop movement to a plain fade when true.

## Spring presets (standardize on these)
```ts
export const spring = {
  snappy: { type: "spring", stiffness: 400, damping: 30 },   // buttons, toggles, chips
  smooth: { type: "spring", stiffness: 260, damping: 26 },   // cards, sheets, page content
  gentle: { type: "spring", stiffness: 180, damping: 24 },   // large hero elements
};
```

## Tap feedback (every button / pressable)
```tsx
<motion.button
  whileTap={{ scale: 0.96 }}
  transition={spring.snappy}
  onTapStart={() => navigator.vibrate?.(8)}  // light haptic, see mobile-native-feel
>
```

## Staggered list reveal
```tsx
const list = { show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
<motion.ul variants={list} initial="hidden" animate="show">
  {rows.map(r => <motion.li key={r.id} variants={item} transition={spring.smooth} />)}
</motion.ul>
```

## Shared-element transition (list card -> detail hero)
Give the same `layoutId` to the card in the list and the hero on the detail screen. Motion tweens between them automatically.
```tsx
<motion.div layoutId={`exercise-${id}`} />
```

## Route / screen transitions
Wrap the router outlet so screens cross-fade and lift, not hard-cut.
```tsx
<AnimatePresence mode="wait">
  <motion.main key={pathname}
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }} transition={spring.smooth}>
    {children}
  </motion.main>
</AnimatePresence>
```

## Collapsing / parallax header on scroll
```tsx
const { scrollY } = useScroll();
const height  = useTransform(scrollY, [0, 120], [220, 72]);
const opacity = useTransform(scrollY, [0, 90], [1, 0]);
<motion.header style={{ height }}>...<motion.div style={{ opacity }}>subtitle</motion.div></motion.header>
```

## What to reach for when
- Number changing (weight, reps, streak): use the count-up in the fitness-dataviz skill, not a raw jump.
- Modal / bottom sheet: animate from the edge with `spring.smooth`; back the entrance with a fading scrim.
- Success / PR moment: hand off to the delight-moments skill.
