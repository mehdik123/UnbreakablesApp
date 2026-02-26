# Logic Test Analysis: Login, Week Creation, Weekly Volume

This document summarizes the flows for **client login**, **week creation**, and **weekly volume** and how to verify they work.

---

## 1. Client Login

### Flow

1. **Share URL**  
   User opens `?client=<id>` (e.g. `?client=el-mehdi-kamal-c621ad4e-4643-496b-a9da-95a0d3d6b7ef`).  
   App extracts UUID: `c621ad4e-4643-496b-a9da-95a0d3d6b7ef`.

2. **Auth check**  
   - If not authenticated → show **ClientLogin** with `clientId={extractedClientId}`.  
   - Clients list is **always loaded** (no early return on share link) so that after login the client can be found.

3. **Login**  
   - User enters username/password.  
   - **authService.loginClient(username, password, clientId)**:
     - Reads `client_credentials` (Supabase): `username`, `password_hash`, `client_id`, `is_active`.
     - Verifies password (hashPassword match).
     - If `clientId` is in the URL, checks `data.client_id === clientId` (access denied if mismatch).
     - Updates `last_login`, then saves session (localStorage): `{ id, type: 'client', clientId: data.client_id }`.
   - Returns `{ success: true, clientId: data.client_id }`.

4. **Post-login (App.handleClientLoginSuccess)**  
   - Sets `isAuthenticated`, `authType: 'client'`.  
   - Tries to find client: `appState.clients.find(c => c.id === clientId)`.  
   - **Fallback**: if not in list (e.g. clients not loaded yet), calls **dbGetClientWithWorkoutAssignment(clientId)** and maps the row to a `Client` (with `workoutAssignment` from first active assignment); adds to `clients` if missing and uses as `foundClient`.  
   - If `foundClient`: sets `currentView: 'client-interface'`, `selectedClient: foundClient`.

5. **Render**  
   With `authType === 'client'` and client link, main content is shown; when `currentView === 'client-interface'` and `selectedClient`, **ModernClientInterface** is rendered with that client.

### What to test

- Open share URL → ClientLogin is shown.  
- Valid credentials + correct clientId → redirect to client interface with that client’s data.  
- Valid credentials + wrong clientId (URL tampered) → “Access denied”.  
- Invalid credentials → “Invalid username or password”.  
- Login before clients list has loaded → fallback fetch runs; client interface still shows correct client.

### Files

- **App.tsx**: share URL handling, client load (no early return), `handleClientLoginSuccess` (find client + fallback fetch).  
- **ClientLogin.tsx**: form, `authService.loginClient`, `onLoginSuccess(clientId)`.  
- **authService.ts**: `loginClient`, `client_credentials` query, password check, session save.  
- **db.ts**: `dbGetClientWithWorkoutAssignment(clientId)` for single-client fallback.

---

## 2. Week Creation

### Flow

1. **Initial assignment (coach)**  
   In **UltraModernWorkoutEditor**, when the coach assigns a program:
   - **createInitialWeek(program)** builds **Week 1** from `program.days` (new IDs per exercise/set, `weekNumber: 1`, `isUnlocked: true`, `days: [...]`).
   - Assignment is saved with `weeks: [week1]` (no future weeks yet).

2. **Adding a new week (coach)**  
   - Coach uses “Create next week” (or equivalent).
   - **createNextWeekFromActuals(previousWeek, nextWeekNumber)** (or **copyWeekData**) copies the previous week’s structure and resets completion; new IDs for days/exercises/sets.
   - **markWeekAsDeployed(week)** sets `isUnlocked: true`, `deployedAt`, `startDate`.
   - New week is appended to `assignment.weeks` and persisted (e.g. **dbUpdateWorkoutAssignment**).

3. **Client view**  
   - **ClientWorkoutView** / **ModernClientInterface** use `assignment.weeks` (deployed weeks).
   - Week navigation shows only deployed weeks; “Waiting for coach” when current week is last deployed and there is no next week yet.

### What to test

- Assign program → only Week 1 exists; client sees Week 1.  
- Create and deploy Week 2 → client sees Week 1 and Week 2; can switch weeks.  
- Volume charts use **that week’s** `assignment.weeks[n].days` (see below).

### Files

- **weekCreation.ts**: `createInitialWeek`, `copyWeekData`, `createNextWeekFromActuals`, `getNextWeekNumber`, `canCreateNextWeek`, `addWeekToAssignment`, `markWeekAsDeployed`.  
- **UltraModernWorkoutEditor.tsx**: assignment creation with `createInitialWeek`, “create next week” and deploy with `markWeekAsDeployed`, persist to DB.  
- **ClientWorkoutView.tsx**: `deployedWeeks` from `localAssignment?.weeks ?? client.workoutAssignment?.weeks`, week selector, “Waiting for coach”.

---

## 3. Weekly Volume Updates

### Flow

1. **Source of truth**  
   Volume for the **Progress** charts comes from the **coach-assigned workout assignment**:  
   `assignment.weeks` and `assignment.program.days` (for template and week-1 fallback).

2. **computeVolumeFromAssignment (volumeCalculator.ts)**  
   - **Input**: `workoutAssignment`, `muscleGroups`.  
   - **Weeks**: `deployedWeeks = assignment.weeks` (sorted by `weekNumber`); x-axis = those week numbers.  
   - **Per week**:  
     - `daysToProcess` = that week’s `week.days` if present; **if week 1 has no days**, use `program.days` (or week 1 days) so week 1 still shows volume.  
   - **Per exercise**:  
     - Muscle group = `exercise.muscleGroup` **or** lookup by **exercise id** or **exercise name** from the program template (`program.days`).  
     - **No position-based fallback** (avoids misattribution, e.g. Back → Abs).  
   - **Volume**: `reps * Math.max(weight, 1)` per set (dropsets: sum over rounds).  
   - **Output**: `MuscleVolumeData[]` (one object per week, keys = muscle group names).

3. **Charts**  
   - **IndependentMuscleGroupCharts** (and any client Progress view using it) gets `client.workoutAssignment` and calls `computeVolumeFromAssignment(client.workoutAssignment, availableMuscleGroups)`.  
   - No async load for chart data; recomputes when assignment or muscle groups change.

4. **Client edits**  
   - Client can log reps/weight in **ClientWorkoutView**; saves update assignment (Supabase/localStorage).  
   - When assignment is updated, charts recompute from the same assignment, so volume reflects saved data.

### What to test

- Week 1 has exercises with muscle groups → chart shows non-zero volume for those groups in Week 1.  
- Week 2 has different exercises (e.g. only Back); Week 1 had Abs → Abs in Week 2 is 0 (no position fallback).  
- Change reps/weight and save → chart updates after assignment is updated.  
- Multiple weeks deployed → each week’s bar/point uses only that week’s `days`.

### Files

- **volumeCalculator.ts**: `computeVolumeFromAssignment` (week fallback, id/name lookup, no position, volume formula).  
- **IndependentMuscleGroupCharts.tsx**: uses `computeVolumeFromAssignment(client.workoutAssignment, availableMuscleGroups)` for chart data.  
- **PerformanceAnalytics.tsx**: uses `computeVolumeFromAssignment` for analytics.  
- **ClientWorkoutView.tsx** / **ModernClientInterface.tsx**: pass assignment to Progress/charts; client saves update assignment.

---

## 4. Quick Checklist

| Area            | Check |
|-----------------|--------|
| Client login    | Share URL → login → client interface with correct client. |
| Client login    | Wrong clientId in URL → access denied. |
| Client login    | Login before clients load → fallback fetch; interface still works. |
| Week creation   | New assignment → only Week 1; client sees Week 1. |
| Week creation   | Deploy Week 2 → client sees Week 1 & 2. |
| Volume          | Chart uses assignment; per-week data only. |
| Volume          | No false “decrease” for a muscle group that wasn’t trained (e.g. Abs). |
| Volume          | Client save (reps/weight) → chart updates from same assignment. |

---

## 5. Summary

- **Login**: Share link always loads clients; post-login finds client from list or via **dbGetClientWithWorkoutAssignment**.  
- **Weeks**: Week 1 from **createInitialWeek**; extra weeks from **createNextWeekFromActuals** / **markWeekAsDeployed**, stored in `assignment.weeks`.  
- **Volume**: Single source, **computeVolumeFromAssignment**, using assignment only; id/name muscle lookup, no position; week 1 can use `program.days` when that week’s days are missing.
