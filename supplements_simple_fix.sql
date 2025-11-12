-- ============================================
-- SIMPLE FIX - Drop and Recreate Everything
-- This will fix all issues
-- ============================================

-- Step 1: Drop everything clean
DROP TABLE IF EXISTS client_supplements CASCADE;
DROP TABLE IF EXISTS client_hydration CASCADE;
DROP TABLE IF EXISTS supplements CASCADE;

-- Step 2: Create supplements table (standalone, no FK)
CREATE TABLE supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    benefits TEXT[],
    recommended_timing TEXT NOT NULL,
    dosage_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create client_supplements (with FK to clients and supplements)
CREATE TABLE client_supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
    custom_timing TEXT,
    custom_dosage TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, supplement_id)
);

-- Step 4: Create client_hydration (with FK to clients)
CREATE TABLE client_hydration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    target_water_ml INTEGER NOT NULL DEFAULT 3000,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id)
);

-- Step 5: Create indexes
CREATE INDEX idx_supplements_category ON supplements(category);
CREATE INDEX idx_supplements_timing ON supplements(recommended_timing);
CREATE INDEX idx_client_supplements_client ON client_supplements(client_id);
CREATE INDEX idx_client_supplements_active ON client_supplements(client_id, is_active);
CREATE INDEX idx_client_hydration_client ON client_hydration(client_id);

-- Step 6: Enable RLS
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_hydration ENABLE ROW LEVEL SECURITY;

-- Step 7: Create simple RLS policies (allow all authenticated)
CREATE POLICY "supplements_select_policy" ON supplements FOR SELECT TO authenticated USING (true);
CREATE POLICY "client_supplements_all_policy" ON client_supplements FOR ALL TO authenticated USING (true);
CREATE POLICY "client_hydration_all_policy" ON client_hydration FOR ALL TO authenticated USING (true);

-- Step 8: Populate ALL supplements
INSERT INTO supplements (name, category, description, benefits, recommended_timing, dosage_info) VALUES
('Whey Protein', 'protein', 'Fast-absorbing protein from milk', ARRAY['Muscle recovery', 'Muscle growth', 'Post-workout nutrition'], 'post_workout', '25-30g per serving'),
('Casein Protein', 'protein', 'Slow-digesting protein from milk', ARRAY['Overnight muscle recovery', 'Sustained amino acid release'], 'before_bed', '25-40g before bed'),
('Plant Protein', 'protein', 'Vegan protein blend', ARRAY['Muscle recovery', 'Plant-based nutrition'], 'post_workout', '25-30g per serving'),
('Collagen Protein', 'protein', 'Supports joints and skin', ARRAY['Joint health', 'Skin elasticity', 'Hair and nails'], 'morning', '10-20g daily'),
('BCAAs', 'amino_acids', 'Branched-Chain Amino Acids', ARRAY['Muscle recovery', 'Reduce fatigue', 'Protein synthesis'], 'during_workout', '5-10g during training'),
('EAAs', 'amino_acids', 'Essential Amino Acids', ARRAY['Complete amino profile', 'Muscle recovery', 'Anabolic response'], 'post_workout', '10-15g post-workout'),
('L-Glutamine', 'amino_acids', 'Recovery and gut health amino acid', ARRAY['Muscle recovery', 'Immune support', 'Gut health'], 'post_workout', '5-10g post-workout'),
('Creatine Monohydrate', 'amino_acids', 'Most researched supplement', ARRAY['Strength gains', 'Muscle growth', 'Power output'], 'anytime', '5g daily'),
('Beta-Alanine', 'amino_acids', 'Endurance and performance', ARRAY['Increase endurance', 'Delay fatigue', 'Buffer lactic acid'], 'pre_workout', '3-6g daily'),
('Caffeine', 'pre_workout', 'Energy and focus stimulant', ARRAY['Increased energy', 'Mental focus', 'Performance boost'], 'pre_workout', '200-400mg 30min before'),
('Citrulline Malate', 'pre_workout', 'Nitric oxide booster', ARRAY['Increased blood flow', 'Pump', 'Endurance'], 'pre_workout', '6-8g 30min before'),
('Pre-Workout Complex', 'pre_workout', 'Complete pre-workout formula', ARRAY['Energy', 'Focus', 'Pump', 'Endurance'], 'pre_workout', '1 serving 30min before'),
('Vitamin D3', 'vitamins', 'Bone and immune health', ARRAY['Bone health', 'Immune function', 'Hormone production'], 'with_meal', '2000-5000 IU daily'),
('Vitamin C', 'vitamins', 'Antioxidant and immune support', ARRAY['Immune system', 'Collagen synthesis', 'Antioxidant'], 'morning', '500-1000mg daily'),
('Vitamin B Complex', 'vitamins', 'Energy and metabolism', ARRAY['Energy production', 'Nervous system', 'Metabolism'], 'morning', '1 capsule daily'),
('Vitamin E', 'vitamins', 'Antioxidant protection', ARRAY['Cell protection', 'Skin health', 'Antioxidant'], 'with_meal', '15-30mg daily'),
('Vitamin K2', 'vitamins', 'Bone and cardiovascular health', ARRAY['Bone density', 'Heart health', 'Calcium regulation'], 'with_meal', '100-200mcg daily'),
('Magnesium', 'minerals', 'Muscle and nerve function', ARRAY['Muscle recovery', 'Sleep quality', 'Stress reduction'], 'before_bed', '300-500mg evening'),
('Zinc', 'minerals', 'Immune and testosterone support', ARRAY['Immune function', 'Testosterone', 'Recovery'], 'with_meal', '15-30mg daily'),
('Calcium', 'minerals', 'Bone health and muscle function', ARRAY['Bone density', 'Muscle contraction', 'Nerve function'], 'with_meal', '1000mg daily'),
('Iron', 'minerals', 'Oxygen transport and energy', ARRAY['Energy levels', 'Oxygen transport', 'Red blood cell formation'], 'morning', '18-27mg daily'),
('Potassium', 'minerals', 'Electrolyte balance', ARRAY['Muscle function', 'Hydration', 'Blood pressure'], 'with_meal', '2000-3000mg daily'),
('Omega-3 Fish Oil', 'omega', 'EPA and DHA for health', ARRAY['Heart health', 'Brain function', 'Inflammation reduction', 'Joint health'], 'with_meal', '1-3g daily'),
('Krill Oil', 'omega', 'Superior omega-3 absorption', ARRAY['Heart health', 'Brain function', 'Joint support'], 'with_meal', '500-1000mg daily'),
('MCT Oil', 'omega', 'Medium-chain triglycerides for energy', ARRAY['Quick energy', 'Mental clarity', 'Fat metabolism'], 'morning', '1-2 tbsp daily'),
('CLA', 'omega', 'Conjugated Linoleic Acid', ARRAY['Fat loss', 'Lean muscle', 'Body composition'], 'with_meal', '3-6g daily'),
('Ashwagandha', 'adaptogen', 'Stress and performance adaptogen', ARRAY['Stress reduction', 'Cortisol management', 'Recovery', 'Sleep quality'], 'evening', '300-600mg daily'),
('ZMA', 'recovery', 'Zinc, Magnesium, B6 complex', ARRAY['Sleep quality', 'Recovery', 'Testosterone support'], 'before_bed', '1 serving before bed'),
('Taurine', 'performance', 'Cardiovascular and performance', ARRAY['Endurance', 'Hydration', 'Cardiovascular support'], 'pre_workout', '1-3g before workout'),
('Probiotics', 'digestive', 'Gut health bacteria', ARRAY['Digestive health', 'Immune function', 'Nutrient absorption'], 'morning', '10-50 billion CFU'),
('Digestive Enzymes', 'digestive', 'Improve nutrient absorption', ARRAY['Better digestion', 'Reduce bloating', 'Nutrient uptake'], 'with_meal', '1 capsule with meals'),
('Fiber Supplement', 'digestive', 'Digestive regularity', ARRAY['Digestive health', 'Satiety', 'Blood sugar control'], 'morning', '10-15g daily'),
('Green Tea Extract', 'fat_loss', 'Metabolism and fat oxidation', ARRAY['Metabolism boost', 'Fat oxidation', 'Antioxidants'], 'morning', '300-500mg daily'),
('L-Carnitine', 'fat_loss', 'Fat transport and energy', ARRAY['Fat metabolism', 'Energy', 'Recovery'], 'pre_workout', '1-3g before workout'),
('Garcinia Cambogia', 'fat_loss', 'Appetite and fat production', ARRAY['Appetite control', 'Fat production inhibition'], 'before_meal', '500-1500mg before meals'),
('Glucosamine', 'joint_health', 'Joint cartilage support', ARRAY['Joint health', 'Cartilage repair', 'Flexibility'], 'with_meal', '1500mg daily'),
('Chondroitin', 'joint_health', 'Joint lubrication and flexibility', ARRAY['Joint health', 'Lubrication', 'Mobility'], 'with_meal', '1200mg daily'),
('MSM', 'joint_health', 'Sulfur for connective tissue', ARRAY['Joint health', 'Inflammation', 'Recovery'], 'with_meal', '1000-3000mg daily'),
('Turmeric/Curcumin', 'joint_health', 'Anti-inflammatory powerhouse', ARRAY['Inflammation reduction', 'Joint health', 'Recovery'], 'with_meal', '500-1000mg daily'),
('Complete Multivitamin', 'multivitamin', 'Daily vitamin and mineral complex', ARRAY['Overall health', 'Fill nutrient gaps', 'Immune support'], 'morning', '1-2 capsules with breakfast'),
('Athletic Greens', 'multivitamin', 'Comprehensive superfood blend', ARRAY['Complete nutrition', 'Energy', 'Immune support', 'Gut health'], 'morning', '1 scoop daily');

-- Step 9: Verify
SELECT 
    '✅ SUPPLEMENTS TABLE' as status,
    COUNT(*) as total_supplements,
    COUNT(DISTINCT category) as total_categories
FROM supplements;

