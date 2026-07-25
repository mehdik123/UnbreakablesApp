# Design & feature baseline

Use this if a skills-driven redesign goes wrong and you want the app back to how it was.

## Last known-good commit

| Field | Value |
|-------|--------|
| Hash | `ef02368` |
| Message | feat(client): redesign home dashboard with hero, accent tiles, and coach note |
| Branch | `v0V1` |
| Date | Pushed before hybrid-athlete cursor kit import |

## What this baseline includes

- Home dashboard (hero, stats, explore tiles, coach note)
- Simplified cardio (`cardio_plans` table, coach + client views)
- Superset/dropset editor, workout template `program_json`
- Hub-and-spoke client navigation
- Design tokens in **`src/index.css`** (Saira, Space Grotesk, home CSS classes)
- Light/dark theme via `.theme-light`

## What is NOT in git yet (safe to delete)

These were copied locally and do not affect production until committed:

- `.cursor/rules/` and `.cursor/skills/`
- `app-starter/globals.css`
- `CURSOR-KICKOFF-PROMPT.md`, `CURSOR-KIT-README.md`

## Rollback commands

**Revert only source code** (keeps kit files):

```bash
git checkout ef02368 -- src/
```

**See diff since baseline:**

```bash
git diff ef02368 -- src/
```

**Full repo reset** (only if you mean it — loses uncommitted work):

```bash
git reset --hard ef02368
```

## Rules for future AI work

See `.cursor/rules/project-guardrails.mdc` — backend and handlers are off-limits for design tasks.
