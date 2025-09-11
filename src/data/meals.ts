import { Meal } from '../types';
import { foods } from './foods';

const findFood = (name: string) => foods.find(f => f.name === name) || foods[0];

// Function to calculate total calories for a meal
const calculateMealCalories = (ingredients: any[]) => {
  return ingredients.reduce((total, ingredient) => {
    const food = ingredient.food;
    const quantity = ingredient.quantity;
    const caloriesPer100g = food.kcal;
    return total + (caloriesPer100g * quantity / 100);
  }, 0);
};

// Function to adjust meal to 800 kcal
const adjustMealTo800kcal = (ingredients: any[]) => {
  const currentCalories = calculateMealCalories(ingredients);
  const targetCalories = 800;
  const multiplier = targetCalories / currentCalories;
  
  return ingredients.map(ingredient => ({
    ...ingredient,
    quantity: Math.round(ingredient.quantity * multiplier)
  }));
};

export const meals: Meal[] = [
  // Breakfast Meals
  {
    id: '1',
    name: 'Protein Oatmeal Bowl',
    category: 'breakfast',
    image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Cook oats with milk until creamy, then mix in protein powder while warm. Top with fresh blueberries and chopped almonds for crunch. Serve immediately for best texture and flavor.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Plain Oats, Raw'), quantity: 50 },
      { food: findFood('Protein Powder'), quantity: 25 },
      { food: findFood('Whole Milk'), quantity: 200 },
      { food: findFood('Blueberries'), quantity: 80 },
      { food: findFood('Almonds'), quantity: 15 }
    ])
  },
  {
    id: '2',
    name: 'Greek Yogurt Berry Parfait',
    category: 'breakfast',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Layer Greek yogurt in a bowl and add mixed berries on top. Sprinkle with crushed walnuts and drizzle with honey if desired. Serve chilled for a refreshing breakfast.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Plain Low-Fat Greek Yoghurt'), quantity: 200 },
      { food: findFood('Strawberries'), quantity: 100 },
      { food: findFood('Blueberries'), quantity: 50 },
      { food: findFood('Walnuts'), quantity: 20 }
    ])
  },
  {
    id: '3',
    name: 'Scrambled Eggs with Avocado Toast',
    category: 'breakfast',
    image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Scramble eggs with butter in a pan until fluffy. Toast whole wheat bread and mash avocado with salt and pepper. Spread avocado on toast and serve with scrambled eggs.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Egg'), quantity: 120 },
      { food: findFood('Avocado'), quantity: 80 },
      { food: findFood('Whole-Wheat Bread'), quantity: 60 },
      { food: findFood('Butter'), quantity: 8 }
    ])
  },
  {
    id: '4',
    name: 'Cottage Cheese Pancakes',
    category: 'breakfast',
    image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Mix cottage cheese with eggs and add oats, then blend until smooth. Cook pancakes in a non-stick pan until golden brown. Top with fresh berries and serve warm.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Cottage Cheese, 1% milkfat'), quantity: 150 },
      { food: findFood('Egg'), quantity: 60 },
      { food: findFood('Plain Oats, Raw'), quantity: 30 },
      { food: findFood('Raspberries'), quantity: 80 }
    ])
  },

  // Lunch Meals
  {
    id: '5',
    name: 'Grilled Chicken Quinoa Bowl',
    category: 'lunch',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Cook quinoa according to package instructions and grill chicken breast with olive oil until cooked through. Steam broccoli until tender and combine all ingredients in a bowl. Season with salt and pepper to taste.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Chicken Breast, Raw'), quantity: 150 },
      { food: findFood('Quinoa, Raw'), quantity: 60 },
      { food: findFood('Broccoli'), quantity: 150 },
      { food: findFood('Olive Oil'), quantity: 12 }
    ])
  },
  {
    id: '6',
    name: 'Tuna Salad with Mixed Greens',
    category: 'lunch',
    image: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Drain tuna and flake with a fork, then mix spinach and arugula in a bowl. Add cherry tomatoes and cucumber, toss with olive oil dressing, and top with tuna. Serve immediately.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Canned Tuna in Water'), quantity: 120 },
      { food: findFood('Spinach'), quantity: 100 },
      { food: findFood('Arugula'), quantity: 50 },
      { food: findFood('Tomatoes'), quantity: 100 },
      { food: findFood('Cucumber'), quantity: 80 },
      { food: findFood('Olive Oil'), quantity: 15 }
    ])
  },
  {
    id: '7',
    name: 'Turkey and Vegetable Wrap',
    category: 'lunch',
    image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Cook ground turkey with seasonings until browned and sauté bell peppers and onions until tender. Warm whole wheat wrap and fill with turkey and vegetables. Roll tightly and serve.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Ground Turkey, Raw'), quantity: 120 },
      { food: findFood('Whole-Wheat Wrap'), quantity: 80 },
      { food: findFood('Bell Pepper, raw'), quantity: 100 },
      { food: findFood('Onions'), quantity: 50 },
      { food: findFood('Olive Oil'), quantity: 10 }
    ])
  },
  {
    id: '8',
    name: 'Lentil and Vegetable Soup',
    category: 'lunch',
    image: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Cook lentils until tender and sauté carrots, celery, and onions until softened. Combine with cooked lentils, add vegetable broth and simmer for 20 minutes. Season and serve hot.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Lentils, Raw'), quantity: 80 },
      { food: findFood('Carrots, raw'), quantity: 100 },
      { food: findFood('Celery'), quantity: 80 },
      { food: findFood('Onions'), quantity: 60 },
      { food: findFood('Olive Oil'), quantity: 12 }
    ])
  },

  // Dinner Meals
  {
    id: '9',
    name: 'Baked Salmon with Sweet Potato',
    category: 'dinner',
    image: 'https://images.pexels.com/photos/1516415/pexels-photo-1516415.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Season salmon with herbs and olive oil, then bake at 400°F for 15-20 minutes until flaky. Roast sweet potato wedges alongside salmon and steam asparagus until tender. Serve together with lemon.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Salmon Fillet, Raw'), quantity: 150 },
      { food: findFood('Sweet Potato, Raw'), quantity: 200 },
      { food: findFood('Asparagus'), quantity: 150 },
      { food: findFood('Olive Oil'), quantity: 15 }
    ])
  },
  {
    id: '10',
    name: 'Lean Beef Stir-Fry',
    category: 'dinner',
    image: 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Cut lean steak into strips and stir-fry in hot pan with oil until browned. Add mixed vegetables and cook until crisp-tender. Serve over cooked rice and garnish with fresh herbs.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Lean Steak, Raw'), quantity: 150 },
      { food: findFood('Rice, Raw'), quantity: 60 },
      { food: findFood('Broccoli'), quantity: 100 },
      { food: findFood('Bell Pepper, raw'), quantity: 80 },
      { food: findFood('Olive Oil'), quantity: 12 }
    ])
  },
  {
    id: '11',
    name: 'Grilled Chicken with Roasted Vegetables',
    category: 'dinner',
    image: 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Marinate chicken breast with herbs and grill until cooked through. Roast mixed vegetables with olive oil until caramelized and cook quinoa as a side. Serve hot with fresh herbs.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Chicken Breast, Raw'), quantity: 150 },
      { food: findFood('Zucchini'), quantity: 120 },
      { food: findFood('Eggplant'), quantity: 100 },
      { food: findFood('Quinoa, Raw'), quantity: 50 },
      { food: findFood('Olive Oil'), quantity: 15 }
    ])
  },
  {
    id: '12',
    name: 'Cod with Cauliflower Mash',
    category: 'dinner',
    image: 'https://images.pexels.com/photos/1516415/pexels-photo-1516415.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Season cod fillets with lemon and herbs, then bake at 375°F for 12-15 minutes until flaky. Steam cauliflower until very tender and mash with a little milk. Serve cod over cauliflower mash.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Cod, Raw'), quantity: 150 },
      { food: findFood('Cauliflower, raw'), quantity: 200 },
      { food: findFood('Milk'), quantity: 50 },
      { food: findFood('Green Beans'), quantity: 150 },
      { food: findFood('Olive Oil'), quantity: 10 }
    ])
  },

  // Snack Meals
  {
    id: '13',
    name: 'Apple with Almond Butter',
    category: 'snack',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Wash and slice apple into wedges and serve with almond butter for dipping. Sprinkle with cinnamon if desired and enjoy fresh for a healthy snack.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Apples'), quantity: 150 },
      { food: findFood('Almond Butter'), quantity: 20 }
    ])
  },
  {
    id: '14',
    name: 'Mixed Nuts and Berries',
    category: 'snack',
    image: 'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Mix almonds and walnuts in a bowl and add fresh blueberries. Portion into small containers and store in refrigerator. Enjoy as needed for a nutritious snack.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Almonds'), quantity: 20 },
      { food: findFood('Walnuts'), quantity: 15 },
      { food: findFood('Blueberries'), quantity: 80 }
    ])
  },
  {
    id: '15',
    name: 'Greek Yogurt with Honey',
    category: 'snack',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Add Greek yogurt to a small bowl and drizzle with honey. Top with chopped pistachios and serve chilled for a protein-rich snack.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Plain Low-Fat Greek Yoghurt'), quantity: 150 },
      { food: findFood('Honey'), quantity: 15 },
      { food: findFood('Pistachio Nuts'), quantity: 15 }
    ])
  },
  {
    id: '16',
    name: 'Protein Smoothie',
    category: 'snack',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
    cookingInstructions: 'Blend protein powder with almond milk and add frozen strawberries and banana. Blend until smooth and add ice if needed. Serve immediately for best texture.',
    ingredients: adjustMealTo800kcal([
      { food: findFood('Protein Powder'), quantity: 25 },
      { food: findFood('Almond Milk (unsweetened)'), quantity: 250 },
      { food: findFood('Strawberries'), quantity: 100 },
      { food: findFood('Bananas'), quantity: 80 }
    ])
  }
];