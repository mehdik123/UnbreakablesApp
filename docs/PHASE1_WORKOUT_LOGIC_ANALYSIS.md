# Phase 1: Workout Logic – Project Analysis & Current State

This document captures the current project structure, data models, and workout flow so we can refactor toward the **progressive week deployment** model (coach creates/deploys weeks one-by-one; client sees only deployed weeks).

---

## 1. Project Structure Overview

### Tech Stack (inferred)
- **Frontend:** React (Vite), TypeScript
- **Backend/DB:** Supabase (PostgreSQL, real-time)
- **State:** React state + `localStorage` for sync fallback; clients/assignments loaded in `App.tsx`
- **UI:** Tailwind CSS, Lucide icons, custom components

### Entry Points
- **Coach:** `App.tsx` → `ModernClientPlanView` (client plan: nutrition, workout, progress, weight, photos, performance)
- **Client:** `App.tsx` → `ModernClientInterface` (client-facing: nutrition, supplements, workout, progress, performance, weight, photos)
- `ClientInterface` exists but is commented out in `App.tsx`; `ClientWorkoutView` is used from both `ClientInterface` and `ModernClientInterface`.

---

## 2. Files Related to Workout Management

### Coach side
| File | Role |
|------|------|
| `src/components/UltraModernWorkoutEditor.tsx` | Main coach workout UI: template selection, week/day navigation, edit exercises/sets/reps/weights, save to DB. Contains `createWeekBasedWorkout`, week unlock button, `handleWeekChange`. |
| `src/components/WeekProgressionControl.tsx` | Week grid (all weeks), mark week complete, unlock next. Uses `WeekProgressionManager`. |
| `src/components/BulkWorkoutEditor.tsx` | Bulk ops on workout: select exercises, add/subtract/set reps/weight/sets (percentage, fixed). |
| `src/components/ModernClientPlanView.tsx` | Coach plan view: tabs (nutrition, workout, progress, weight, photos, performance). Renders `UltraModernWorkoutEditor` and `IndependentMuscleGroupCharts`. |
| `src/components/WorkoutProgramManager.tsx` | (Present in codebase; used for program/template management.) |
| `src/components/WorkoutBuilder.tsx` | Has its own `createWeekBasedWorkout`; alternate workout build flow. |

### Client side
| File | Role |
|------|------|
| `src/components/ClientWorkoutView.tsx` | Client workout UI: days horizontal scroll, exercises, sets (reps/weight inputs), **exercise-level completion** (`completedExercises` state), save edits to Supabase + localStorage. Gets `currentWeek` from parent. |
| `src/components/ModernClientInterface.tsx` | Client app: tabs, `currentWeek` from assignment, passes `client` + `currentWeek` to `ClientWorkoutView`. Polls Supabase for assignment updates. |
| `src/components/ClientInterface.tsx` | Alternate client UI (not used in App): has **week navigation** (Week 1..N, locked/unlocked), passes `unlockedWeeks` + `currentWeek` to `ClientWorkoutView`. |

### Data / DB / types
| File | Role |
|------|------|
| `src/types/index.ts` | `Client`, `ClientWorkoutAssignment`, `WorkoutProgram`, `WorkoutDay`, `WorkoutExercise`, `WorkoutSet`, `WorkoutWeek`, `Exercise`, `WorkoutTemplate`, etc. |
| `src/lib/db.ts` | Supabase CRUD: clients, exercises, `workout_assignments`, `workout_programs`, `weekly_volume_tracking`, nutrition, photos. |
| `src/lib/supabaseClient.ts` | Supabase client + `isSupabaseReady`. |

### Progress / volume
| File | Role |
|------|------|
| `src/components/IndependentMuscleGroupCharts.tsx` | Volume charts per muscle group; uses `workoutAssignment.weeks` (unlocked/completed). |
| `src/utils/realtimeVolumeTracker.ts` | Volume by week/muscle; `getMuscleGroupFromDatabase` (exercises table), `calculateVolumeForSpecificWeek`. |
| `src/utils/volumeCalculator.ts` | Volume math. |
| `src/hooks/useRealtimeVolumeTracking.ts` | Hook for real-time volume. |
| `src/utils/weekProgressionManager.ts` | `markWeekComplete`, `getCurrentWeek`, `getWeekStatus`, etc. |

### App orchestration
| File | Role |
|------|------|
| `src/App.tsx` | Loads clients + workout assignments from Supabase (`dbListClientsWithWorkoutAssignments`), maps `program_json` → `workoutAssignment`. `handleAssignWorkoutPlan`: create/update assignment with `program_json: { ...program, weeks }`. |

---

## 3. Data Models (Current)

### 3.1 Workouts / templates
- **`WorkoutTemplate`** (types): id, name, description, category, daysPerWeek, difficulty, duration, **days: WorkoutDay[]**, etc.
- **`WorkoutProgram`**: id, name, description, **days: WorkoutDay[]** (no weeks; flat list of days).
- **DB:** `workout_programs` (template metadata), `workout_days`, `workout_exercises`, `workout_sets` for template structure. Coach loads via `dbListWorkoutPrograms()` and maps to `WorkoutProgram` with `days`.

### 3.2 Client assignment (source of truth: Supabase)
- **Table:** `workout_assignments`
  - Columns used: `id`, `client_id`, `program_id`, **`program_json`** (JSONB), `start_date`, `duration_weeks`, `current_week`, `current_day`, `is_active`, `last_modified_by`, `last_modified_at`, optional `version`.
- **`program_json`** holds the full client-specific program in one blob, e.g.:
  - `name`, `description`, **`days`** (same shape as `WorkoutProgram.days` – used when no week-specific override),
  - **`weeks`**: array of `WorkoutWeek`:
    - `weekNumber`, `isUnlocked`, `isCompleted`, `exercises` (legacy?), **`days`** (full `WorkoutDay[]` for that week: exercises, sets, reps, weight).
  - So: **target vs actual** are the same fields (reps/weight in sets); client edits update `program_json.weeks[].days` and that is persisted.

### 3.3 Types (relevant)
- **`ClientWorkoutAssignment`**: id, clientId, clientName, **program: WorkoutProgram**, startDate, **duration**, **currentWeek**, currentDay, **weeks: WorkoutWeek[]**, progressionRules, isActive, lastModifiedBy, lastModifiedAt.
- **`WorkoutWeek`**: weekNumber, **isUnlocked**, **isCompleted**, exercises, **days: WorkoutDay[]**, completedAt?, startDate?.
- **`WorkoutSet`**: id, reps, weight (number or array for dropsets), **completed**, restPeriod?, notes?, rpe?.
- **`WorkoutExercise`**: id, exercise (Exercise), **sets: WorkoutSet[]**, rest, order, etc.

### 3.4 Exercise data
- **DB:** `exercises` table: name, video_url, **muscle_group**, etc. Used for volume charts and enrichment of program display.
- **Types:** `Exercise` (id, name, muscleGroup, equipment, instructions, videoUrl, etc.).

### 3.5 Progress tracking
- **In-app:** Volume is computed from `program_json.weeks[].days` (sets × reps × weight); `weekly_volume_tracking` table exists for persistence.
- **Week completion:** Stored in `program_json.weeks[].isCompleted` and `completedAt`; no separate “progress tracking” table for week completion.

---

## 4. Current System Behavior (Summary)

### 4.1 Coach flow
1. Coach selects a client and opens plan → **ModernClientPlanView**.
2. **UltraModernWorkoutEditor**: Coach picks a template (from DB) or builds custom; on assign, **all weeks are created upfront** via `createWeekBasedWorkout(program, numberOfWeeks)`:
   - For each week 1..N: creates full `days` array (copy of program days with week-based **formula** progression: e.g. `reps + (week - 1) * 2`, `weight + (week - 1) * 2.5`). Only **week 1** has `isUnlocked: true`.
3. Assignment is saved to DB as single `program_json` with **all weeks** in `weeks[]`.
4. Coach can change “current week” via dropdown and edit that week’s exercises/sets/reps/weights.
5. **“Unlock next week”** (button): sets `currentWeek += 1` and sets `weeks[newWeek].isUnlocked = true`. **Does not copy previous week’s actual performance**; the next week already exists with formula-based values.
6. **WeekProgressionControl**: Shows all weeks (1..duration); coach can “Mark [week] complete” (sets `isCompleted` + unlocks next). Again, no copy of actuals.
7. **BulkWorkoutEditor**: Apply bulk changes to current day’s exercises (reps/weight/sets) in the in-memory program; save goes through normal assignment update.

### 4.2 Client flow
1. Client opens **ModernClientInterface**; assignment is loaded from Supabase (or polled); `currentWeek` comes from `assignment.current_week`.
2. **ClientWorkoutView** receives `client` and `currentWeek`. It does **not** receive a week selector in the main app path (ModernClientInterface); client effectively sees only the “current” week for the workout tab.
3. **ClientInterface** (unused) had explicit week nav: buttons for Week 1..N, with locked/unlocked; only weeks with `isUnlocked` were clickable.
4. In ClientWorkoutView:
   - Program for display = **merge** of `assignment.program.days` with `assignment.weeks[currentWeek].days` when that week has `days`; otherwise base program.
   - Client edits reps/weights in sets; **exercise completion** is tracked in local state `completedExercises` (by exercise id). Edits are saved to `program_json` (Supabase + localStorage).
   - There is **no** “Mark Week Done” in the main client flow (ModernClientInterface); week completion is driven from coach side (WeekProgressionControl) or implied by current_week.
5. Real-time: Supabase `postgres_changes` on `workout_assignments` in ClientWorkoutView and ModernClientInterface; coach changes propagate to client.

### 4.3 Volume charts
- **IndependentMuscleGroupCharts**: Reads `workoutAssignment.weeks`; volume is computed from week data (reps × weight per set, muscle from exercises table). Only **unlocked** weeks contribute to chart (or similar). Progress tab currently uses this (Progress tab placeholder was removed earlier; charts live in IndependentMuscleGroupCharts).

### 4.4 Gaps vs new requirements
| Requirement | Current state |
|-------------|----------------|
| Client sees **only** weeks coach has “created and deployed” | Client sees all weeks that are “unlocked”; all weeks exist in DB from day 1. |
| New week = **copy previous week’s actual performance** | New week = formula-based from template; no copy of client actuals. |
| Coach “Create Week 2” then “Deploy to Client” | Coach “Unlock next week” (no create/deploy step; no copy step). |
| Exercise-level completion visible to coach | `completedExercises` is client-side only in ClientWorkoutView; not persisted in `program_json`. |
| Week-level “Done” by client | Not clearly exposed in ModernClientInterface; WeekProgressionManager supports it from coach side. |
| Target vs actual clearly separated | Same fields; “target” = what coach set, “actual” = what client logged (overwrites in same structure). |
| Future weeks not visible until deployed | All weeks exist; visibility is by `isUnlocked`. |

---

## 5. Database Schema (Relevant)

- **clients**: id, full_name, number_of_weeks, goal, start_date, is_active, email, phone, favorites, weight_log, ...
- **workout_assignments**: id, client_id, program_id, **program_json** (JSONB), start_date, duration_weeks, current_week, current_day, is_active, last_modified_by, last_modified_at, (version if present).
- **workout_programs**: id, name, description, is_template, (days_per_week, etc.).
- **workout_days**, **workout_exercises**, **workout_sets**: template structure.
- **exercises**: id, name, video_url, muscle_group, ...
- **weekly_volume_tracking**: client_id, week_number, muscle_group, volume, updated_at.

No separate table for “deployed weeks” or “week creation events”; everything is inside `program_json.weeks`.

---

## 6. Answers to Your Pre-Start Questions

1. **Tech stack:** React (Vite) + TypeScript, Supabase (PostgreSQL + real-time). No separate backend server in this repo.
2. **API endpoints:** All data access via Supabase client (`supabase.from(...).select/insert/update/delete`); helpers in `src/lib/db.ts`.
3. **Template system:** Templates live in `workout_programs` + related tables; loaded with `dbListWorkoutPrograms()` and converted to `WorkoutProgram` (with `days`). Assignment is a **copy** stored in `workout_assignments.program_json` (template not modified).
4. **Auth:** Not analyzed in this pass; app assumes authenticated user (coach or client context).
5. **Design system:** Tailwind; no separate design system doc found; components use ad-hoc gradients and borders.
6. **State management:** React state in App + components; clients/assignments loaded in App and passed down; ClientWorkoutView and ModernClientInterface also use Supabase real-time and localStorage for sync.
7. **Real-time:** Supabase Realtime (`postgres_changes`) on `workout_assignments`; some polling (e.g. 1s/3s) in ModernClientInterface for assignment refresh.

---

## 7. Suggested Next Steps (for refactor)

1. **Data model:** Decide how to represent “deployed” weeks only (e.g. only push week objects into `program_json.weeks` when coach creates/deploys, so client literally has no data for week 2 until it exists). Optionally add a small “week deployment” or “week created at” metadata if needed.
2. **Coach:** Add explicit “Create next week” flow: copy **previous week’s `days`** (with actual reps/weights from client) into a new week object; coach edits (with bulk actions); then “Deploy to client” (push to `program_json.weeks` and set `current_week` / unlock).
3. **Client:** Restrict UI to weeks that **exist** in `program_json.weeks` (no “locked” placeholders for future weeks). Show “Your coach is preparing your next week” when current week is done and no next week yet.
4. **Exercise completion:** Persist exercise-level completion in `program_json` (e.g. per set or per exercise in week data) so coach can see it.
5. **Week “Done”:** Clarify client-driven “Mark Week Done” in ModernClientInterface and persist in `program_json.weeks[i].isCompleted` (+ optional completedAt).
6. **Volume charts:** Keep using `program_json.weeks`; only deployed weeks will exist, so charts will naturally show only those weeks.

---

## 8. Confirmation

This document reflects the current codebase and behavior as of the analysis. No code has been changed yet. If anything above doesn’t match your intent or environment (e.g. auth, which client UI is canonical), we can adjust the plan before Phase 2.

If you confirm, next step is **Phase 2: Backend logic & data model** (week-copy and “deployed weeks only” semantics), then coach UI, then client UI, then charts and polish.

---

## Phase 2 Progress

### Phase 2A – Data model (done)
- **Types:** `WorkoutSet` has `completedAt?: string`; `WorkoutWeek` has `deployedAt?: string`, `completedAt`/`startDate` as `Date | string`.
- **Utils:** `src/utils/weekCreation.ts` added:
  - `createInitialWeek(program)` – creates only Week 1 from program.
  - `copyWeekData(sourceWeek, newWeekNumber)` – deep copy with completion reset and new IDs.
  - `createNextWeekFromActuals(previousWeek, weekNumber)` – wraps copyWeekData.
  - `getNextWeekNumber(assignment)`, `canCreateNextWeek(assignment)`.
  - `addWeekToAssignment(assignment, newWeek)` – returns updated assignment (caller persists).
  - `markWeekAsDeployed(week)` – sets `isUnlocked`, `deployedAt`, `startDate`.

### Phase 2B – DB (done)
- No schema changes. `dbUpdateWorkoutAssignment(id, { program_json })` already overwrites full `program_json`; callers build full object (e.g. with `addWeekToAssignment`) then save.

### Phase 2C – Coach UI (done)
- **Initial assignment:** `handleSelectProgram` and custom “Assign to Client” now use `createInitialWeek(program)` so only Week 1 is created and saved.
- **Week selector:** Dropdowns show only existing weeks from `assignment.weeks` (no placeholders for future weeks).
- **Create Week X:** Replaced “Next Week” with “Create Week {nextNum}”. Button opens a modal that:
  - Shows previous week actuals (read-only) and draft week (editable reps/weight per set).
  - “Deploy to Client” runs `markWeekAsDeployed`, `addWeekToAssignment`, saves to DB, updates local state and `selectedProgram` to the new week.
- **handleWeekChange:** No longer creates a new week when switching; only loads an existing week’s data into `selectedProgram`.
- **Load from DB:** When loading assignment from Supabase, `selectedProgram.days` is set from `program_json.weeks[current_week].days` when that week exists.

### Phase 2D – Client UI (done)
- **Week visibility:** Client sees only deployed weeks. `deployedWeeks` derived from `assignment.weeks`; week nav shows only those weeks. `ModernClientInterface` clamps `currentWeek` to a valid deployed week when syncing from Supabase.
- **Week navigation:** `ClientWorkoutView` accepts `onWeekChange`; week selector (Week 1, Week 2, …) with active/completed styling; parent passes `setCurrentWeek`.
- **Exercise completion persistence:** `completedExercises` initialised from current week’s `set.completed` when week/assignment changes. `completeExercise()` calls `persistExerciseCompletion()` to write `set.completed` and `set.completedAt` into `program_json.weeks` and save to Supabase + localStorage.
- **Mark Week Complete:** Button shown when all exercises in the week are complete and week is not already completed. On click, sets `weeks[currentWeek].isCompleted = true` and `completedAt`, then saves.
- **Waiting state:** When current week is completed and there is no next week in `assignment.weeks`, a banner shows: “Your coach is preparing your next week”.

### Phase 2E – Volume charts (done)
- **IndependentMuscleGroupCharts:** `calculateVolumeFromAssignment` now builds chart data only from **deployed weeks** (`workoutAssignment.weeks`). No more loop over `1..duration` with zeros for future weeks. `weeksToShow` = sorted week numbers from `assignment.weeks`; fallback `[1]` when no weeks (legacy). Removed debug `console.log` and unused `totalWeekVolume`. Charts show one point per deployed week only.

### Phase 2F
- Pending: End-to-end testing, edge cases, polish.
