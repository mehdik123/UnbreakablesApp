---
name: performance-60fps
description: Keep the app silky at 60fps and fast to load, which is what actually reads as "premium". Use when building anything animated or scrollable, when adding images or charts, when the app feels janky/laggy, when bundle size or load time is a concern, or before shipping a screen. Trigger this for "it's laggy", "make it faster", "optimize", "reduce jank", "improve load time", or any performance review. Web/PWA.
---

# 60fps and fast loads (web / PWA)

Premium is inseparable from smooth. Enforce these.

## Animation performance
- Animate only `transform` and `opacity`. Movement via `translate`/`scale`, never `top/left/width/height`.
- Apply `will-change: transform` only for the duration of an animation, then remove it. Leaving it on hurts.
- Prefer `requestAnimationFrame` over `setInterval` for timers and scroll work; batch DOM reads then writes to avoid layout thrash.

## React render hygiene
- `React.memo` list rows; `useMemo`/`useCallback` for values and handlers passed into hot lists.
- Stable `key`s; no inline object/array/style literals as props inside frequently re-rendered lists.
- Split routes with `React.lazy` + `<Suspense>`; lazy-load heavy, rarely-first-seen modules (charts, confetti, the onboarding carousel).
- Keep global state lean (Zustand slices). Do not re-render the whole tree on every tick; subscribe narrowly.

## Images
- Serve AVIF/WebP, responsive `srcset` + `sizes`, `loading="lazy"` for below-the-fold, `decoding="async"`.
- Always set explicit `width`/`height` (or aspect-ratio) to keep CLS at 0.
- Use LQIP/blur-up (see screen-scaffold) so nothing pops in harshly.

## Lists and data
- Virtualize anything over ~30 rows.
- Paginate or window server data; do not hold huge arrays in memory.

## Budget (verify on a throttled mobile Lighthouse run)
- LCP < 2.5s, INP < 200ms, CLS < 0.1.
- Initial JS payload small: code-split, tree-shake, and analyze the bundle. Charts and confetti must be lazy chunks.
- Fonts: preconnect + `display=swap` (already in the font link); subset if possible.

## PWA specifics
- Precache the app shell so repeat loads are instant offline (see pwa-shell).
- Avoid long tasks on the main thread during startup; defer non-critical work with `requestIdleCallback`.
