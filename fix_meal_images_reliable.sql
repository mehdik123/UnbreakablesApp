-- =====================================================
-- RELIABLE MEAL IMAGES FIX
-- Using verified working image URLs with proper parameters
-- =====================================================

-- Update all meals with reliable, working image URLs
-- Using Unsplash with proper parameters for better loading

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Cheesy Scrambled Eggs';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Scrambled Eggs With Oatmeal';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Oatmeal With Milk and Banana';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Oatmeal And Eggs Pancakes';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Egg Omlet With Bread And Avocado';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Oatmeal And Eggs With Whey Protein';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Scrambled Eggs With Avocado And Cheese';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Egg & Bacon Omelet';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Quinoa and Chicken Breast Salad';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Oatmeal & Fruits';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1621996346565-e326e22e3824?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Ground Beef With Pasta And Avocado';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Ground Beef With Rice And Avocado';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1598103442345-02627b0b0758?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Rice & Chicken Breast With Green Beans';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1631100989904-a2d807a016f4?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Sweet Potatoes With Chicken Breast';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Rice & Chicken Breast With Broccoli';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1540420773420-28507da66d68?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Chicken Breast Salad';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1598515213692-5f282436df20?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Tuna With Ebly And Cheese';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1607584196443-c05244519782?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Salmon With Sweet Potatoes';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1584515933487-be72835aa71f?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Greek Yogurt & Toast';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1552010292-56414343e3d9?w=400&h=300&fit=crop&q=80&auto=format&fm=webp'
WHERE name = 'Greek Yogurt & Fruit Salad';

-- Verify all images are updated
SELECT name, image FROM meals WHERE is_template = true ORDER BY name;
