import { Food } from '../types';
import foodCsvRaw from '../data/Badr Idbourass Coaching - Food Database.csv?raw';

/** Reject Vercel 404 bodies / junk that used to wipe the real food list. */
export function isPlausibleFood(food: Pick<Food, 'name'> | null | undefined): boolean {
  const name = String(food?.name || '').trim();
  if (!name || name.length > 120) return false;
  if (/NOT_FOUND/i.test(name)) return false;
  if (/::/.test(name)) return false; // e.g. cdg1::mz9mz-…
  if (/^404\b/i.test(name)) return false;
  if (/^code:/i.test(name)) return false;
  if (/^id:/i.test(name)) return false;
  if (/<!doctype|<html/i.test(name)) return false;
  return true;
}

export const parseCSVFoodData = (csvContent: string): Food[] => {
  const text = String(csvContent || '').trim();
  if (!text) return [];

  // Hosted 404 pages (Vercel) look like: NOT_FOUND / Code: NOT_FOUND / ID: cdg1::…
  const head = text.slice(0, 280);
  if (/NOT_FOUND/i.test(head) || /^\s*</.test(text) || /<!doctype|<html/i.test(head)) {
    return [];
  }

  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(',').map((value) => value.trim().replace(/"/g, ''));
      return {
        name: values[0],
        kcal: parseFloat(values[1]) || 0,
        protein: parseFloat(values[2]) || 0,
        fat: parseFloat(values[3]) || 0,
        carbs: parseFloat(values[4]) || 0,
      };
    })
    .filter((food) => isPlausibleFood(food) && !isNaN(food.kcal));
};

/** Bundled CSV — never fetch `/src/data/...` (404 on Vercel replaces foods with NOT_FOUND). */
export const loadFoodDatabase = async (): Promise<Food[]> => {
  try {
    const foods = parseCSVFoodData(foodCsvRaw);
    // Guard: a real DB has dozens of rows; tiny results are treated as invalid
    if (foods.length < 10) {
      console.warn('Food CSV produced too few rows; keeping static fallback');
      return [];
    }
    return foods;
  } catch (error) {
    console.error('Error loading food database:', error);
    return [];
  }
};
