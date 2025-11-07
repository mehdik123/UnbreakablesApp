-- ==========================================
-- LIST ALL MEALS - SIMPLE VERSION
-- Just names and calories
-- ==========================================

SELECT 
    m.id,
    m.name,
    -- Calculate total calories from ingredients
    COALESCE(ROUND(SUM(
        (mi.quantity_g / 100.0) * i.kcal
    ), 0), 0) as total_calories
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
LEFT JOIN ingredients i ON mi.ingredient_id = i.id
GROUP BY m.id, m.name
ORDER BY m.name;

