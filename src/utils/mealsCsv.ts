import { Meal, Ingredient, Food } from '../types';

// CSV format (header required):
// name,category,image,ingredients
// ingredients example: "Plain Oats, Raw|50;Whole Milk|200;Blueberries|80"
export async function loadMealsFromCSV(csvPath: string, foods: Food[]): Promise<Meal[]> {
  try {
    const res = await fetch(csvPath);
    if (!res.ok) return [];
    const text = await res.text();
    return parseMealsCSV(text, foods);
  } catch {
    return [];
  }
}

export function parseMealsCSV(csv: string, foods: Food[]): Meal[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map(s => s.trim().toLowerCase());
  const idx = {
    name: header.indexOf('name'),
    category: header.indexOf('category'),
    image: header.indexOf('image'),
    ingredients: header.indexOf('ingredients')
  };
  const result: Meal[] = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = splitCsvLine(lines[i]);
    const name = raw[idx.name]?.trim();
    const category = (raw[idx.category]?.trim() || 'breakfast') as Meal['category'];
    const image = raw[idx.image]?.trim() || '';
    const ingredientsField = raw[idx.ingredients]?.trim() || '';
    if (!name) continue;

    const ingredients: Ingredient[] = [];
    if (ingredientsField) {
      for (const token of ingredientsField.split(';')) {
        const [foodName, qtyStr] = token.split('|');
        const food = foods.find(f => f.name === (foodName || '').trim());
        const quantity = parseFloat((qtyStr || '').trim());
        if (food && !isNaN(quantity) && quantity > 0) {
          ingredients.push({ food, quantity });
        }
      }
    }
    if (ingredients.length === 0) continue;

    result.push({
      id: `${i}-${name}`,
      name,
      category,
      image: image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
      cookingInstructions: '',
      ingredients
    });
  }
  return result;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}






