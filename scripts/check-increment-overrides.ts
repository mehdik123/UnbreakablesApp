import { getStandardIncrement } from '../src/utils/autoProgression.ts';

const cases: [string, string, number][] = [
  ['Barbell Skull Crushers', 'Barbell', 2.5],
  ['Barbell Skull Crushers Smith Machine', 'Smith Machine', 2.5],
  ['Cable Lateral Raises', 'Cable Machine', 2.5],
  ['Chest Flyes', 'Dumbbells', 2.5],
  ['Close Grip EZ Bar Curls', 'EZ Bar', 2.5],
  ['Leg Press', 'Leg Press Machine', 10],
  ['Machine Leg Extensions', 'Machine', 10],
  ['Seated Calf Raises', 'Machine', 10],
];

let failed = 0;
for (const [name, equipment, want] of cases) {
  const got = getStandardIncrement(equipment, name);
  const ok = got === want;
  if (!ok) failed += 1;
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}: got ${got}, want ${want}`);
}
process.exit(failed ? 1 : 0);
