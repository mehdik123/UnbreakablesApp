import {
  COOKING_BY_MEAL,
  translateCookingInstructions,
  translateMealName,
} from '../src/locales/client/mealContent.ts';

const meals = [
  'Scrambled Eggs With Oatmeal and Honey',
  'Scrambled Eggs With Avocado And Philadelphia',
  'Greek Yogurt With Fruits ,Granola, Berries and Dark Chocolate',
  'Beef With Basmati Rice',
  'Ground Beef With Ebly and Green Beans',
  'Salmon With Sweet Potatoes',
  'Tuna & Pasta With Veggies',
  'Beef & Sweet Potatoes with Eggs',
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

for (const name of meals) {
  const stored = COOKING_BY_MEAL[norm(name)]?.en || '';
  const ar = translateCookingInstructions(name, stored, 'ar');
  const fr = translateCookingInstructions(name, stored, 'fr');
  const nameAr = translateMealName(name, 'ar');
  const nameFr = translateMealName(name, 'fr');
  const okAr = /[\u0600-\u06FF]/.test(ar) && ar !== stored;
  const okFr = Boolean(fr && fr !== stored);
  const okName = nameAr !== name && nameFr !== name;
  console.log(
    JSON.stringify({
      name,
      inCatalog: Boolean(COOKING_BY_MEAL[norm(name)]),
      okAr,
      okFr,
      okName,
      nameAr,
      nameFr,
      ar: ar.slice(0, 100),
      fr: fr.slice(0, 100),
    })
  );
}
