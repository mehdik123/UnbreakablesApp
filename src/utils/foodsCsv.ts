import { Food } from '../types';

export async function loadFoodsFromCSV(csvPath: string): Promise<Food[]> {
  try {
    const res = await fetch(csvPath);
    if (!res.ok) return [];
    const text = await res.text();
    return parseFoodsCSV(text);
  } catch {
    return [];
  }
}

export function parseFoodsCSV(csv: string): Food[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  // skip header
  const out: Food[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i]);
    const name = clean(row[0]);
    const kcal = toNum(row[1]);
    const protein = toNum(row[2]);
    const fat = toNum(row[3]);
    const carbs = toNum(row[4]);
    if (!name) continue;
    out.push({ name, kcal, protein, fat, carbs });
  }
  return out;
}

function clean(s?: string) { return (s || '').replace(/(^\")|(\"$)/g, '').trim(); }
function toNum(s?: string) { const n = parseFloat((s || '0').trim()); return isNaN(n) ? 0 : n; }

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; } else { cur += ch; }
  }
  out.push(cur);
  return out.map(s => s.trim());
}






