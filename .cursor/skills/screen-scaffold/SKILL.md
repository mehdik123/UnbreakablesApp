---
name: screen-scaffold
description: The repeatable recipe for building any new screen so it comes out consistent, polished, and premium instead of one-off. Use whenever creating a new page, view, tab, or feature screen, or when a screen is missing loading, empty, or error states. Trigger this for "build the X screen", "add a page for Y", "create the workout/profile/progress screen", or "this screen feels unfinished". Web/PWA.
---

# Screen scaffold (web / PWA)

**Unbreakables:** Read `.cursor/rules/project-guardrails.mdc` first. Styling/refactor only unless the user explicitly asks for new data flows. Use `src/index.css` tokens (`--txt-hi`, `--hair`, `--r-lg`, etc.). Match `ModernClientInterface` home patterns where possible.

Run this checklist for every new screen. Skipping the states is what makes an app feel amateur.

## The order to build a screen
1. **Skeleton first.** Render a shimmer skeleton that matches the real layout (same boxes, same sizes) while data loads. Never a centered spinner.
2. **Load data** with TanStack Query (server) or the local IndexedDB store (offline-first data, see pwa-shell). Show the skeleton until the first paint of real data.
3. **Optimistic UI on writes.** When the user logs a set / completes a workout, update the UI immediately and reconcile in the background. The gym has bad signal; the UI must never wait on the network.
4. **Empty state.** When there is no data, show a designed empty state: a simple illustration or large icon, one line of copy, and a primary CTA (for example "Log your first workout"). Not a blank screen.
5. **Error state.** Friendly message plus a retry button. Never a raw error.
6. **Virtualize long lists.** Any list likely to exceed ~30 rows uses `@tanstack/react-virtual`.
7. **Blur-up images.** Load a tiny blurred placeholder (LQIP) then fade in the full image; always set explicit width/height to avoid layout shift.
8. **Sticky animated header** (see premium-motion collapsing header) and safe-area padding.
9. **Use the shared primitives:** one `Card`, one `Section`, one `StatBlock`, one `PrimaryButton`. Do not re-style per screen.

## Skeleton shimmer
```css
.skeleton { background:
  linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 37%, var(--surface-2) 63%);
  background-size: 400% 100%; border-radius: var(--radius-md);
  animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:0 0} }
```

## Virtualized list
```tsx
const parentRef = useRef(null);
const v = useVirtualizer({ count: rows.length, getScrollElement: () => parentRef.current, estimateSize: () => 72, overscan: 8 });
<div ref={parentRef} style={{ overflow:"auto", height:"100%" }}>
  <div style={{ height: v.getTotalSize(), position:"relative" }}>
    {v.getVirtualItems().map(vi => (
      <div key={vi.key} style={{ position:"absolute", top:0, transform:`translateY(${vi.start}px)`, width:"100%" }}>
        <Row data={rows[vi.index]} />
      </div>
    ))}
  </div>
</div>
```

## Canonical card
Use the `.card` class from globals (surface-2, hairline border, soft glow, glassy top edge). Compose screens from cards and sections; keep one dominant element per screen per the design-system rule.

## Transitions
New screens mount through the route transition in premium-motion; internal lists reveal with the staggered pattern.
