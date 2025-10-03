-- =====================================================
-- FIX MISSING MEAL IMAGES WITH WORKING URLs
-- =====================================================

-- Update meals with missing images using verified working Unsplash URLs
UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1557088421-ee4fa299e52c?w=400&h=300&fit=crop&q=80'
WHERE name = 'Oatmeal And Eggs Pancakes';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1596799562445-53865611052b?w=400&h=300&fit=crop&q=80'
WHERE name = 'Oatmeal And Eggs With Whey Protein';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1506128183184-207d8b0b5e40?w=400&h=300&fit=crop&q=80'
WHERE name = 'Oatmeal With Milk and Banana';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1540420773420-28507da66d68?w=400&h=300&fit=crop&q=80'
WHERE name = 'Chicken Breast Salad';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1582512422033-4ab34b4044b7?w=400&h=300&fit=crop&q=80'
WHERE name = 'Egg & Bacon Omelet';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1541544453-66444983a50a?w=400&h=300&fit=crop&q=80'
WHERE name = 'Egg Omlet With Bread And Avocado';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1594998703358-13a48c6a6f13?w=400&h=300&fit=crop&q=80'
WHERE name = 'Quinoa and Chicken Breast Salad';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1598103442345-02627b0b0758?w=400&h=300&fit=crop&q=80'
WHERE name = 'Rice & Chicken Breast With Green Beans';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1607584196443-c05244519782?w=400&h=300&fit=crop&q=80'
WHERE name = 'Salmon With Sweet Potatoes';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1584515933487-be72835aa71f?w=400&h=300&fit=crop&q=80'
WHERE name = 'Greek Yogurt & Toast';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1552010292-56414343e3d9?w=400&h=300&fit=crop&q=80'
WHERE name = 'Greek Yogurt & Fruit Salad';

UPDATE meals 
SET image = 'https://images.unsplash.com/photo-1621996346565-e326e22e3824?w=400&h=300&fit=crop&q=80'
WHERE name = 'Ground Beef With Pasta And Avocado';

-- Verify all images are updated
SELECT name, image FROM meals WHERE is_template = true ORDER BY name;
