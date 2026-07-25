---
name: delight-moments
description: Add the celebratory, memorable moments that make users screenshot and share the app. Use for onboarding sequences, personal-record (PR) celebrations, streak milestones, workout-complete summaries, and first-time moments. Trigger this for "add onboarding", "celebrate a PR", "streak milestone", "workout complete screen", "make it feel rewarding", or "add a wow moment". Keep it tasteful and always respect reduced motion. Web/PWA.
---

# Delight moments (web / PWA)

Big emotional payoffs, used sparingly, are what a creator-led fitness app lives on. Overusing them cheapens the effect, so reserve these for genuine achievements.

Library: **canvas-confetti** for bursts (lazy-load it, per performance-60fps). Everything respects `useReducedMotion()`.

## PR celebration
When a user beats a previous best:
```ts
import confetti from "canvas-confetti";
confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 },
  colors: ["#E11D48", "#FF6A4D", "#F5F5F6"] });
haptic.success();
```
Pair it with a "NEW PR" card that springs in (premium-motion), the number in the brand gradient (`.text-gradient`), and the delta vs the old best.
Reduced-motion path: skip confetti, do a single scale+glow pop on the card instead.

## Workout complete
A summary moment: total volume, sets, duration animated up with the stat counter, a ring filling to 100%, and a subtle confetti burst. Offer a "share" action (this is a 700k-follower creator app; make the summary screenshot-worthy: brand gradient accent, clean stat layout, logo).

## Streak milestones
At 7, 30, 100 days: a full-screen or sheet celebration with the streak number large, brand gradient, and haptic. These are the shareable ones.

## Onboarding
A short 3 to 4 slide carousel (swipeable, skippable) that sets the tone: dark, cinematic, one bold line per slide in the display font, a progress dot row, and a gradient primary CTA on the last slide. Lazy-load it; it only runs once.

## First-time moments
First workout logged, first week completed: a small, warm acknowledgment. First impressions compound.

## Rules
- Never block the user; celebrations are non-modal or quickly dismissible.
- One celebration per event, not stacked.
- Always test the reduced-motion fallback.
