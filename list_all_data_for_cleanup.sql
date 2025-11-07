-- ==========================================
-- LIST ALL DATA FOR DATABASE CLEANUP
-- ==========================================
-- Run this script in your Supabase SQL Editor
-- Copy the results to share with the developer

-- ==========================================
-- 1. LIST ALL MEALS WITH DETAILS
-- ==========================================
SELECT 
    m.id,
    m.name,
    m.is_template,
    m.kcal_target,
    m.image,
    LEFT(m.cooking_instructions, 100) as cooking_instructions_preview,
    -- Calculate total nutrition from meal_items
    COALESCE(ROUND(SUM(
        (mi.quantity_g / 100.0) * i.kcal
    ), 0), 0) as total_calories,
    COALESCE(ROUND(SUM(
        (mi.quantity_g / 100.0) * i.protein
    ), 1), 0) as total_protein,
    COALESCE(ROUND(SUM(
        (mi.quantity_g / 100.0) * i.carbs
    ), 1), 0) as total_carbs,
    COALESCE(ROUND(SUM(
        (mi.quantity_g / 100.0) * i.fat
    ), 1), 0) as total_fat,
    -- Count ingredients
    COUNT(mi.id) as ingredient_count
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
LEFT JOIN ingredients i ON mi.ingredient_id = i.id
GROUP BY m.id, m.name, m.is_template, m.kcal_target, m.image, m.cooking_instructions
ORDER BY m.name;

-- ==========================================
-- 2. LIST INGREDIENTS FOR EACH MEAL
-- ==========================================
SELECT 
    m.id as meal_id,
    m.name as meal_name,
    i.name as ingredient_name,
    mi.quantity_g as quantity_grams,
    ROUND((mi.quantity_g / 100.0) * i.kcal, 1) as calories_from_ingredient,
    ROUND((mi.quantity_g / 100.0) * i.protein, 1) as protein_g,
    ROUND((mi.quantity_g / 100.0) * i.carbs, 1) as carbs_g,
    ROUND((mi.quantity_g / 100.0) * i.fat, 1) as fat_g
FROM meals m
JOIN meal_items mi ON m.id = mi.meal_id
JOIN ingredients i ON mi.ingredient_id = i.id
ORDER BY m.name, mi.id;

-- ==========================================
-- 3. LIST ALL WORKOUT TEMPLATES/SPLITS
-- ==========================================
SELECT 
    wt.id,
    wt.name,
    wt.description,
    wt.category,
    wt.days_per_week,
    wt.difficulty,
    wt.duration_weeks,
    wt.is_custom,
    -- Count days and exercises in this template
    (SELECT COUNT(*) FROM template_days td WHERE td.template_id = wt.id) as total_days,
    (SELECT COUNT(*) FROM template_exercises te 
     JOIN template_days td ON te.day_id = td.id 
     WHERE td.template_id = wt.id) as total_exercises
FROM workout_templates wt
ORDER BY wt.name;

-- ==========================================
-- 4. LIST DAYS AND EXERCISES IN EACH WORKOUT TEMPLATE
-- ==========================================
SELECT 
    wt.id as template_id,
    wt.name as template_name,
    td.day_order,
    td.name as day_name,
    e.name as exercise_name,
    e.muscle_group,
    te.exercise_order,
    te.rest_seconds,
    -- Count sets for this exercise
    (SELECT COUNT(*) FROM template_sets ts WHERE ts.template_exercise_id = te.id) as total_sets,
    -- Sample set info (first set)
    (SELECT json_build_object(
        'reps', ts.reps,
        'weight', ts.weight,
        'rest_seconds', ts.rest_seconds
    ) FROM template_sets ts 
     WHERE ts.template_exercise_id = te.id 
     ORDER BY ts.set_order 
     LIMIT 1) as sample_set
FROM workout_templates wt
JOIN template_days td ON wt.id = td.template_id
JOIN template_exercises te ON td.id = te.day_id
JOIN exercises e ON te.exercise_id = e.id
ORDER BY wt.name, td.day_order, te.exercise_order;

-- ==========================================
-- 5. LIST ALL USERS (CLIENTS)
-- ==========================================
SELECT 
    c.id,
    c.email,
    c.full_name,
    c.role,
    -- Count their assignments
    (SELECT COUNT(*) FROM nutrition_plans np WHERE np.client_id = c.id) as nutrition_plans_count,
    (SELECT COUNT(*) FROM workout_assignments wa WHERE wa.client_id = c.id) as workout_assignments_count
FROM clients c
ORDER BY c.role, c.email;

-- ==========================================
-- 6. SUMMARY COUNTS
-- ==========================================
SELECT 
    'Meals' as table_name,
    COUNT(*) as total_count
FROM meals
UNION ALL
SELECT 
    'Ingredients' as table_name,
    COUNT(*) as total_count
FROM ingredients
UNION ALL
SELECT 
    'Exercises' as table_name,
    COUNT(*) as total_count
FROM exercises
UNION ALL
SELECT 
    'Workout Templates' as table_name,
    COUNT(*) as total_count
FROM workout_templates
UNION ALL
SELECT 
    'Template Days' as table_name,
    COUNT(*) as total_count
FROM template_days
UNION ALL
SELECT 
    'Clients (Users)' as table_name,
    COUNT(*) as total_count
FROM clients;

-- ==========================================
-- NOTES:
-- ==========================================
-- After reviewing the results:
-- 1. Note down the IDs of meals you want to DELETE
-- 2. Note down the IDs of workout templates you want to DELETE
-- 3. Note down the IDs of users you want to DELETE
-- 4. Share these IDs with the developer to create deletion scripts

