/**
 * List every seed exercise with current auto-progression classification.
 * Run: npx --yes tsx scripts/list-exercise-progression-class.ts
 */
import { exercises } from '../src/data/exercises.ts';
import { classifyEquipment, getStandardIncrement } from '../src/utils/autoProgression.ts';

type Row = {
  name: string;
  equipment: string;
  classFilled: string;
  incFilled: number;
  classEmpty: string;
  incEmpty: number;
};

const rows: Row[] = exercises.map((ex) => {
  const equipment = ex.equipment || '';
  return {
    name: ex.name,
    equipment: equipment || '(empty)',
    classFilled: classifyEquipment(equipment, ex.name),
    incFilled: getStandardIncrement(equipment, ex.name),
    classEmpty: classifyEquipment('', ex.name),
    incEmpty: getStandardIncrement('', ex.name),
  };
});

const byClass = new Map<string, Row[]>();
for (const row of rows) {
  const list = byClass.get(row.classFilled) || [];
  list.push(row);
  byClass.set(row.classFilled, list);
}

const order = ['dumbbell', 'barbell', 'cable', 'machine', 'bodyweight'] as const;

for (const cls of order) {
  const list = (byClass.get(cls) || []).sort((a, b) => a.name.localeCompare(b.name));
  const inc = list[0]?.incFilled ?? '?';
  console.log(`\n=== ${cls.toUpperCase()} (+${inc} kg) — ${list.length} exercises ===`);
  for (const r of list) {
    const emptyNote =
      r.classEmpty !== r.classFilled
        ? ` | EMPTY-EQ FALLBACK WRONG: ${r.classEmpty} (+${r.incEmpty})`
        : ` | empty-eq ok (+${r.incEmpty})`;
    console.log(`  - ${r.name} | equipment="${r.equipment}"${emptyNote}`);
  }
}

console.log('\n=== REGRESSION CHECK: empty equipment must still resolve via name ===');
let mismatches = 0;
for (const r of rows.sort((a, b) => a.name.localeCompare(b.name))) {
  if (r.classFilled !== r.classEmpty || r.incFilled !== r.incEmpty) {
    mismatches += 1;
    console.log(
      `  FAIL ${r.name}: filled ${r.classFilled}(+${r.incFilled}) vs empty ${r.classEmpty}(+${r.incEmpty})`
    );
  }
}
if (mismatches === 0) {
  console.log('  All exercises: empty equipment + name matches filled equipment classification.');
}

console.log('\n=== CLIENT BUG CASE ===');
console.log(
  `Seated Lateral Raises empty eq: ${classifyEquipment('', 'Seated Lateral Raises')} +${getStandardIncrement('', 'Seated Lateral Raises')}`
);
console.log(
  `Flat Dumbbell Bench Press empty eq: ${classifyEquipment('', 'Flat Dumbbell Bench Press')} +${getStandardIncrement('', 'Flat Dumbbell Bench Press')}`
);
console.log(`2.5 + dumbbell step = ${2.5 + getStandardIncrement('', 'Seated Lateral Raises')}`);

console.log(`\nTOTAL seed exercises: ${rows.length}`);
