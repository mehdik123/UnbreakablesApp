# Cursor kickoff prompt

Paste the block below into Cursor's Agent chat at the root of your project after you have dropped the `.cursor/` folder in place. It sets the goal, the stack, and points the agent at your rules and skills. Edit anything in [brackets].

---

You are building **Hybrid Athlete**, a premium mobile-first PWA for a 12-week hybrid training program by a fitness creator with a large audience. This app has to feel outstanding: ultra-modern, silky at 60fps, dark, cinematic, and genuinely native, not a website in a browser. Screenshot-worthy.

**Design and standards are already installed.** Two always-on rules in `.cursor/rules/` define the visual system and the mobile interaction standards. Follow them at all times. Seven on-demand skills in `.cursor/skills/` cover motion, native feel, fitness data-viz, screen scaffolding, performance, PWA setup, and delight moments. Consult the relevant skill for each task by name; do not improvise patterns the skills already define.

**Stack (use exactly this unless I say otherwise):**
- React + TypeScript + Vite
- Tailwind CSS, wired to the tokens in `app-starter/globals.css` (copy that file in as the global stylesheet and expose the CSS variables to Tailwind's theme)
- Motion (framer-motion) for all animation
- vaul for bottom sheets
- @tanstack/react-virtual for long lists, TanStack Query for any server data
- Zustand for local state
- visx (or Recharts) for charts
- vite-plugin-pwa + Workbox for the PWA, idb for offline storage
- canvas-confetti (lazy) for celebrations
- React Router (or TanStack Router)

**Build order:**
1. Scaffold the Vite + React + TS + Tailwind project. Install the deps above. Wire `globals.css` and the fonts (Saira Condensed, Inter, Space Grotesk).
2. Set up the app shell: bottom tab navigation (safe-area aware), the route transition wrapper, and the shared primitives (Card, Section, StatBlock, PrimaryButton). Use the design-system rule and the premium-motion skill.
3. Make it a real PWA now, not later: manifest, icons (incl. maskable), iOS meta tags, service worker, install prompt, and IndexedDB offline storage. Use the pwa-shell skill. It must run a full workout offline.
4. Build the core screens using the screen-scaffold skill (skeleton, empty, error, optimistic writes every time): Today / Workout, Program (12-week overview with phase accents), Log a set, Progress (rings, volume + PR charts, streak heatmap), Profile.
5. Layer in fitness-dataviz for every stat and timer, and delight-moments for PR / streak / workout-complete celebrations.
6. Run the performance-60fps pass and a mobile Lighthouse audit before calling anything done.

**Quality bar / acceptance:**
- Feels native: bottom sheets, haptics, pull-to-refresh, safe-area, 100dvh, no tap flash.
- Every screen has loading, empty, and error states. No spinners; use skeletons.
- Animation is spring-based, only transform/opacity, 60fps, and respects reduced motion.
- Installable, passes the Lighthouse PWA audit, works fully offline in the gym.
- One dominant element per screen; brand gradient used sparingly.

Start with step 1. Before building each screen, briefly tell me which skills you are applying, then build.

---

## Handy per-task follow-ups
- "Build the Progress screen. Use screen-scaffold and fitness-dataviz. Rings for weekly targets, a volume bar chart, a PR line chart, and a streak heatmap."
- "Add a rest timer bottom sheet. Use mobile-native-feel and fitness-dataviz."
- "Celebrate a new PR. Use delight-moments."
- "This screen feels static, add motion. Use premium-motion."
- "Do a performance pass on the workout screen. Use performance-60fps."
