---
name: mobile-native-feel
description: Make the PWA feel like a native app rather than a website in a browser. Use whenever adding bottom sheets, haptics, pull-to-refresh, swipe actions, safe-area handling, keyboard-aware inputs, full-height layouts, or standalone-mode behavior. Trigger this for any request like "make it feel native", "add a bottom sheet", "it feels like a webpage", "handle the notch", or "add swipe to delete". Web/PWA (no React Native).
---

# Native feel on the web (PWA)

The goal is that a user forgets it is a browser. These are the ingredients.

## Bottom sheets (use instead of centered modals on mobile)
Use **vaul** (`import { Drawer } from "vaul"`). Supports drag-to-dismiss, snap points, and inertia.
```tsx
<Drawer.Root snapPoints={[0.4, 0.9]}>
  <Drawer.Trigger>Open</Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Overlay className="scrim" />
    <Drawer.Content className="sheet pad-safe-bottom">...</Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

## Haptics (make one util, use everywhere)
```ts
export const haptic = {
  light:   () => navigator.vibrate?.(8),
  medium:  () => navigator.vibrate?.(14),
  success: () => navigator.vibrate?.([8, 40, 8]),
  warning: () => navigator.vibrate?.([20, 40, 20]),
};
```
Note: `navigator.vibrate` works on Android/Chrome. iOS Safari does not support it, so always call it optionally (`?.`) and never depend on it for meaning. Fire on: set completed, timer done, PR hit, tab switch, destructive confirm.

## Pull to refresh
Add `overscroll-behavior-y: contain` to the scroll container, then implement a custom pull indicator with a Motion `drag="y"` wrapper (constrain downward, snap back with `spring.smooth`, trigger the refresh past a threshold). Do not rely on the browser's native reload.

## Swipe-to-action rows (e.g. delete a set / log)
```tsx
<motion.div drag="x" dragConstraints={{ left: -96, right: 0 }} dragElastic={0.1}>
  {/* row content; reveal actions underneath */}
</motion.div>
```

## Safe areas and full height
- App shell must set `viewport-fit=cover` in the viewport meta (see pwa-shell).
- Fixed header pads `--safe-top`; bottom nav and sheets pad `--safe-bottom`.
- Use `100dvh` for full-screen layouts, never `100vh`.

## Keyboard-aware inputs (stop the layout jump on iOS)
```ts
const vv = window.visualViewport;
vv?.addEventListener("resize", () => {
  document.documentElement.style.setProperty("--kb", `${window.innerHeight - vv.height}px`);
});
// then offset a sticky footer/input by var(--kb)
```
Keep the focused input in view; inputs must be >=16px font to prevent iOS zoom.

## Standalone-mode awareness
```ts
const installed = window.matchMedia("(display-mode: standalone)").matches
  || (navigator as any).standalone === true;
```
Use this to hide the browser-only "install" hint once installed, and to enable app-like behaviors.

## Scroll feel
Momentum scroll on scroll containers, no accidental horizontal scroll, and disable text selection on tappable UI (`user-select: none`) while keeping it on real content.
