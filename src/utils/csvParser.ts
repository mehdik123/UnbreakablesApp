import { Food } from '../types';

export const parseCSVFoodData = (csvContent: string): Food[] => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
    
    return {
      name: values[0],
      kcal: parseFloat(values[1]) || 0,
      protein: parseFloat(values[2]) || 0,
      fat: parseFloat(values[3]) || 0,
      carbs: parseFloat(values[4]) || 0
    };
  }).filter(food => food.name && !isNaN(food.kcal));
};

export const loadFoodDatabase = async (): Promise<Food[]> => {
  try {
    const response = await fetch('/src/data/Badr Idbourass Coaching - Food Database.csv');
    const csvContent = await response.text();
    return parseCSVFoodData(csvContent);
  } catch (error) {
    console.error('Error loading food database:', error);
    return [];
  }
}; 