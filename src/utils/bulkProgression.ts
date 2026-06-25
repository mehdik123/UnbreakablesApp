import { Client, ClientWorkoutAssignment, WorkoutWeek } from '../types';
import {
  createNextWeekFromActuals,
  getNextWeekNumber,
  addWeekToAssignment,
  markWeekAsDeployed,
} from './weekCreation';
import { applyAutoProgression, applyDeload } from './autoProgression';

/**
 * Bulk progression — create the next training week for many clients at once.
 *
 * Each client keeps their own program, number of weeks, and actual performance:
 * the next week is built from THAT client's latest week (their actuals/stats),
 * then progressed / kept / deloaded according to the chosen mode. Clients who
 * have no program, no weeks, or who already reached their final week are skipped.
 *
 * The actual persistence is delegated to the existing single-client
 * `onAssignWorkoutPlan(clientId, assignment)` handler so behaviour stays
 * identical to the per-client "Deploy to Client" flow.
 */

export type ProgressionMode = 'progress' | 'copy' | 'deload';

export type BulkPlanStatus = 'ready' | 'skipped';

export interface BulkPlanEntry {
  clientId: string;
  clientName: string;
  status: BulkPlanStatus;
  /** Present when skipped. */
  reason?: string;
  /** Latest existing week (the one we progress from). */
  fromWeekNumber?: number;
  /** The week that will be created. */
  nextWeekNumber?: number;
  /** Total weeks in this client's program. */
  totalWeeks?: number;
  /** Full assignment with the new week appended (ready entries only). */
  updatedAssignment?: ClientWorkoutAssignment;
}

function buildNextWeek(
  prevWeek: WorkoutWeek,
  nextNum: number,
  mode: ProgressionMode
): WorkoutWeek {
  const base = createNextWeekFromActuals(prevWeek, nextNum);
  if (mode === 'deload') return applyDeload(base);
  if (mode === 'copy') return base;
  return applyAutoProgression(base);
}

/** Compute what would happen for a single client (no side effects). */
export function planClientProgression(
  client: Client,
  mode: ProgressionMode
): BulkPlanEntry {
  const base = { clientId: client.id, clientName: client.name };
  const assignment = client.workoutAssignment;

  if (!assignment || !assignment.program) {
    return { ...base, status: 'skipped', reason: 'No workout program' };
  }

  const weeks = assignment.weeks || [];
  if (weeks.length === 0) {
    return { ...base, status: 'skipped', reason: 'No weeks created yet' };
  }

  const totalWeeks =
    assignment.duration || client.numberOfWeeks || weeks.length;
  const nextNum = getNextWeekNumber(assignment); // max existing week + 1
  const fromWeekNumber = nextNum - 1;

  if (nextNum > totalWeeks) {
    return {
      ...base,
      status: 'skipped',
      reason: 'Program complete',
      fromWeekNumber,
      totalWeeks,
    };
  }

  const prevWeek =
    weeks.find((w) => w.weekNumber === fromWeekNumber) ||
    weeks[weeks.length - 1];

  if (!prevWeek || !(prevWeek.days && prevWeek.days.length)) {
    return {
      ...base,
      status: 'skipped',
      reason: 'Latest week has no exercises',
      fromWeekNumber,
      totalWeeks,
    };
  }

  const deployed = markWeekAsDeployed(buildNextWeek(prevWeek, nextNum, mode));
  const updatedAssignment = addWeekToAssignment(assignment, deployed);

  return {
    ...base,
    status: 'ready',
    fromWeekNumber,
    nextWeekNumber: nextNum,
    totalWeeks,
    updatedAssignment,
  };
}

/** Build the full plan for a set of clients. */
export function planBulkProgression(
  clients: Client[],
  mode: ProgressionMode
): BulkPlanEntry[] {
  return clients.map((c) => planClientProgression(c, mode));
}
