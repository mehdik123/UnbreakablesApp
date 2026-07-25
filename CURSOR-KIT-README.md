# Hybrid Athlete — Cursor kit

> **Unbreakables (this repo):** Tokens live in **`src/index.css`**, not `app-starter/globals.css`.  
> **Baseline commit:** `ef02368` — see `.cursor/DESIGN-BASELINE.md` to roll back.  
> **Safety:** `.cursor/rules/project-guardrails.mdc` — design-only by default; do not touch backend/DB/handlers.  
> **Do not** run the full kickoff prompt on this codebase without a phased plan.

Everything to make Cursor build your fitness PWA to a premium bar. Two always-on **rules** (your visual system + mobile standards) and seven on-demand **skills** (the how-to for motion, native feel, data-viz, screens, performance, PWA, and delight), plus a design-token stylesheet and a kickoff prompt.

## Install (2 minutes)

1. **Drop the `.cursor/` folder at the root of your project.** If you already have a `.cursor/` folder, merge the `rules/` and `skills/` subfolders in.
   - Rules live in `.cursor/rules/*.mdc` and load automatically on every request.
   - Skills live in `.cursor/skills/<name>/SKILL.md` and load on demand when their description matches what you are doing (or type `/skill-name` to invoke one manually).
2. **Reload Cursor** so it picks up the skills: Cmd/Ctrl+Shift+P -> "Developer: Reload Window".
3. **This project:** keep using `src/index.css`. Treat `app-starter/globals.css` as reference only.
4. **Pilot one screen** with skills — do not paste `CURSOR-KICKOFF-PROMPT.md` for a full rebuild.

## What each file does

| File | Type | Loads | Purpose |
|---|---|---|---|
| `rules/design-system.mdc` | rule | always | Colors, type roles, elevation-as-glow, spacing, gradient usage |
| `rules/interaction-standards.mdc` | rule | always | Touch targets, safe-area, reduced motion, contrast, dvh |
| `skills/premium-motion` | skill | on demand | Spring motion, tap feedback, shared-element + route transitions |
| `skills/mobile-native-feel` | skill | on demand | Bottom sheets, haptics, pull-to-refresh, keyboard, standalone |
| `skills/fitness-dataviz` | skill | on demand | Rings, timers, streak heatmap, volume/PR charts, stat counters |
| `skills/screen-scaffold` | skill | on demand | The recipe for every new screen (skeleton/empty/error/optimistic) |
| `skills/performance-60fps` | skill | on demand | 60fps rules, render hygiene, images, Core Web Vitals budget |
| `skills/pwa-shell` | skill | on demand | Manifest, service worker, install prompt, iOS, offline (IndexedDB) |
| `skills/delight-moments` | skill | on demand | Onboarding, PR/streak celebrations, workout-complete |
| `app-starter/globals.css` | asset | — | The actual design tokens as CSS variables |

## Notes
- Tokens are set to a crimson-to-coral gradient on layered dark surfaces, with Saira Condensed / Inter / Space Grotesk. Adjust the hex values in `globals.css` and everything follows.
- Cursor's built-in `/create-skill` can scaffold more skills, and the Customize page lets you manage rules and skills in one place.
- Skills use the open SKILL.md standard, so these also work in Claude Code or Codex if you ever switch.
