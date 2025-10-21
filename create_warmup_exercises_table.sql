-- Create warmup exercises table
CREATE TABLE IF NOT EXISTS warmup_exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  duration_seconds integer NOT NULL, -- Duration in seconds
  muscle_groups text[] NOT NULL, -- Array of muscle groups this warmup targets
  instructions text[] NOT NULL, -- Array of step-by-step instructions
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  equipment text DEFAULT 'bodyweight', -- Equipment needed (bodyweight, resistance band, etc.)
  image_url text, -- Optional image URL
  video_url text, -- Optional video URL
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for muscle groups for faster queries
CREATE INDEX IF NOT EXISTS idx_warmup_exercises_muscle_groups ON warmup_exercises USING GIN (muscle_groups);

-- Insert warmup exercises based on the actual muscle groups from exercises table
-- These muscle groups are: CHEST, BACK, SHOULDERS, ARMS, LEGS, ABS, CALVES, FOREARMS, TRICEPS, BICEPS

-- CHEST WARMUPS
INSERT INTO warmup_exercises (name, description, duration_seconds, muscle_groups, instructions, difficulty, equipment) VALUES
('Arm Circles', 'Dynamic warmup for chest and shoulders', 30, ARRAY['CHEST', 'SHOULDERS'], 
 ARRAY['Stand with feet shoulder-width apart', 'Extend arms out to sides at shoulder height', 'Make small circles forward for 15 seconds', 'Reverse direction for 15 seconds', 'Keep core engaged throughout'], 
 'beginner', 'bodyweight'),

('Wall Push-ups', 'Gentle chest activation', 60, ARRAY['CHEST', 'TRICEPS', 'SHOULDERS'], 
 ARRAY['Stand 2-3 feet from a wall', 'Place hands on wall at chest height', 'Perform 10-15 controlled push-ups', 'Keep body straight and core tight', 'Focus on chest muscle engagement'], 
 'beginner', 'bodyweight'),

('Chest Opener Stretch', 'Dynamic chest and shoulder stretch', 45, ARRAY['CHEST', 'SHOULDERS'], 
 ARRAY['Stand with feet hip-width apart', 'Clasp hands behind back', 'Lift arms up and back to open chest', 'Hold for 2-3 seconds, release', 'Repeat 10-12 times'], 
 'beginner', 'bodyweight'),

('Incline Push-ups', 'Progressive chest warmup', 45, ARRAY['CHEST', 'TRICEPS', 'SHOULDERS'], 
 ARRAY['Place hands on elevated surface (bench, step)', 'Keep body straight from head to heels', 'Lower chest toward surface', 'Push back up to start position', 'Perform 8-12 repetitions'], 
 'intermediate', 'bodyweight');

-- BACK WARMUPS
INSERT INTO warmup_exercises (name, description, duration_seconds, muscle_groups, instructions, difficulty, equipment) VALUES
('Cat-Cow Stretch', 'Spinal mobility and back activation', 60, ARRAY['BACK', 'ABS'], 
 ARRAY['Start on hands and knees', 'Arch back and look up (cow)', 'Round spine and tuck chin (cat)', 'Alternate slowly for 30 seconds', 'Focus on spinal movement'], 
 'beginner', 'bodyweight'),

('Band Pull-aparts', 'Rhomboid and rear delt activation', 45, ARRAY['BACK', 'SHOULDERS'], 
 ARRAY['Hold resistance band with both hands', 'Arms extended at chest height', 'Pull band apart squeezing shoulder blades', 'Return to start position slowly', 'Perform 12-15 repetitions'], 
 'intermediate', 'resistance band'),

('Superman Hold', 'Lower back and glute activation', 30, ARRAY['BACK', 'ABS'], 
 ARRAY['Lie face down on floor', 'Extend arms forward and legs back', 'Lift chest and legs off ground', 'Hold position for 3-5 seconds', 'Lower and repeat 8-10 times'], 
 'beginner', 'bodyweight'),

('Thoracic Spine Rotation', 'Upper back mobility', 45, ARRAY['BACK', 'SHOULDERS'], 
 ARRAY['Sit on floor with legs crossed', 'Place one hand behind head', 'Rotate upper body to one side', 'Hold for 2-3 seconds', 'Return to center and repeat other side'], 
 'intermediate', 'bodyweight');

-- SHOULDERS WARMUPS
INSERT INTO warmup_exercises (name, description, duration_seconds, muscle_groups, instructions, difficulty, equipment) VALUES
('Arm Swings', 'Dynamic shoulder mobility', 30, ARRAY['SHOULDERS'], 
 ARRAY['Stand with feet shoulder-width apart', 'Swing arms forward and backward', 'Gradually increase range of motion', 'Keep movements controlled', 'Switch to side-to-side swings'], 
 'beginner', 'bodyweight'),

('Wall Slides', 'Shoulder blade mobility', 45, ARRAY['SHOULDERS', 'BACK'], 
 ARRAY['Stand with back against wall', 'Arms at 90 degrees, elbows touching wall', 'Slide arms up wall slowly', 'Keep contact with wall throughout', 'Return to start position'], 
 'intermediate', 'bodyweight'),

('Pendulum Swings', 'Gentle shoulder joint mobility', 30, ARRAY['SHOULDERS'], 
 ARRAY['Hold onto support with one hand', 'Let other arm hang freely', 'Swing arm in small circles', 'Gradually increase circle size', 'Switch arms after 30 seconds'], 
 'beginner', 'bodyweight'),

('Shoulder Dislocations', 'Full shoulder mobility', 45, ARRAY['SHOULDERS', 'BACK'], 
 ARRAY['Hold resistance band or towel with both hands', 'Start with hands wide apart', 'Bring band over head and behind back', 'Return to start position', 'Perform 8-10 repetitions'], 
 'intermediate', 'resistance band');

-- TRICEPS WARMUPS
INSERT INTO warmup_exercises (name, description, duration_seconds, muscle_groups, instructions, difficulty, equipment) VALUES
('Overhead Tricep Stretch', 'Tricep and shoulder flexibility', 30, ARRAY['TRICEPS', 'SHOULDERS'], 
 ARRAY['Reach one arm overhead', 'Bend elbow, hand behind head', 'Use other hand to gently pull elbow', 'Hold stretch for 15 seconds', 'Switch arms and repeat'], 
 'beginner', 'bodyweight'),

('Assisted Tricep Dips', 'Tricep activation with support', 60, ARRAY['TRICEPS', 'SHOULDERS'], 
 ARRAY['Sit on edge of chair or bench', 'Place hands beside hips', 'Slide forward off edge', 'Lower body by bending elbows', 'Push back up to start position'], 
 'intermediate', 'bodyweight'),

('Tricep Extensions', 'Light tricep activation', 45, ARRAY['TRICEPS'], 
 ARRAY['Stand with feet hip-width apart', 'Extend arms overhead', 'Bend elbows to lower hands behind head', 'Extend arms back to start position', 'Perform 10-15 repetitions'], 
 'beginner', 'bodyweight');

-- BICEPS WARMUPS
INSERT INTO warmup_exercises (name, description, duration_seconds, muscle_groups, instructions, difficulty, equipment) VALUES
('Bicep Circles', 'Bicep and forearm warmup', 30, ARRAY['BICEPS', 'FOREARMS'], 
 ARRAY['Extend arms straight out', 'Make small circles with fists', 'Focus on bicep engagement', 'Reverse direction halfway through', 'Keep movements controlled'], 
 'beginner', 'bodyweight'),

('Band Bicep Curls', 'Light bicep activation', 45, ARRAY['BICEPS'], 
 ARRAY['Stand on resistance band', 'Hold handles with palms up', 'Perform light bicep curls', 'Focus on controlled movement', 'Use light resistance'], 
 'beginner', 'resistance band'),

('Bicep Stretch', 'Bicep flexibility warmup', 30, ARRAY['BICEPS'], 
 ARRAY['Stand facing a wall', 'Place palm flat against wall', 'Rotate body away from wall', 'Feel stretch in bicep', 'Hold for 15 seconds each arm'], 
 'beginner', 'bodyweight');

-- FOREARMS WARMUPS
INSERT INTO warmup_exercises (name, description, duration_seconds, muscle_groups, instructions, difficulty, equipment) VALUES
('Wrist Circles', 'Forearm and wrist mobility', 30, ARRAY['FOREARMS'], 
 ARRAY['Extend arms straight out', 'Make circles with wrists', 'Rotate in both directions', 'Keep arms stationary', 'Focus on wrist movement'], 
 'beginner', 'bodyweight'),

('Finger Stretches', 'Hand and forearm flexibility', 30, ARRAY['FOREARMS'], 
 ARRAY['Extend one arm straight out', 'Use other hand to gently pull fingers back', 'Hold stretch for 10 seconds', 'Switch hands and repeat', 'Feel stretch in forearm'], 
 'beginner', 'bodyweight'),

('Wrist Flexor Stretch', 'Forearm muscle stretch', 30, ARRAY['FOREARMS'], 
 ARRAY['Extend one arm straight out', 'Bend wrist down with other hand', 'Hold stretch for 15 seconds', 'Switch arms and repeat', 'Keep elbow straight'], 
 'beginner', 'bodyweight');

-- LEGS WARMUPS
INSERT INTO warmup_exercises (name, description, duration_seconds, muscle_groups, instructions, difficulty, equipment) VALUES
('Leg Swings', 'Hip mobility and leg activation', 30, ARRAY['LEGS', 'ABS'], 
 ARRAY['Hold onto support for balance', 'Swing one leg forward and back', 'Keep leg straight during swing', 'Switch to side-to-side swings', 'Repeat with other leg'], 
 'beginner', 'bodyweight'),

('Bodyweight Squats', 'Leg and glute activation', 60, ARRAY['LEGS', 'ABS'], 
 ARRAY['Stand with feet shoulder-width apart', 'Lower into squat position slowly', 'Keep chest up and core engaged', 'Return to standing position', 'Perform 10-15 repetitions'], 
 'beginner', 'bodyweight'),

('Walking Lunges', 'Dynamic leg warmup', 60, ARRAY['LEGS', 'ABS'], 
 ARRAY['Step forward into lunge position', 'Lower back knee toward ground', 'Push off front leg to next lunge', 'Alternate legs with each step', 'Keep torso upright'], 
 'intermediate', 'bodyweight'),

('Leg Circles', 'Hip joint mobility', 30, ARRAY['LEGS', 'ABS'], 
 ARRAY['Hold onto support for balance', 'Lift one leg slightly off ground', 'Make small circles with leg', 'Gradually increase circle size', 'Switch directions and legs'], 
 'beginner', 'bodyweight');

-- CALVES WARMUPS
INSERT INTO warmup_exercises (name, description, duration_seconds, muscle_groups, instructions, difficulty, equipment) VALUES
('Calf Raises', 'Calf muscle activation', 45, ARRAY['CALVES'], 
 ARRAY['Stand with feet hip-width apart', 'Rise up onto balls of feet', 'Lower back down slowly', 'Perform 15-20 repetitions', 'Keep core engaged throughout'], 
 'beginner', 'bodyweight'),

('Calf Stretch', 'Calf flexibility warmup', 30, ARRAY['CALVES'], 
 ARRAY['Step one foot forward', 'Keep back leg straight', 'Lean forward to feel stretch', 'Hold for 15 seconds each leg', 'Keep heel on ground'], 
 'beginner', 'bodyweight'),

('Ankle Circles', 'Ankle and calf mobility', 30, ARRAY['CALVES'], 
 ARRAY['Sit or stand with one leg extended', 'Make circles with ankle', 'Rotate in both directions', 'Switch legs after 15 seconds', 'Keep movements controlled'], 
 'beginner', 'bodyweight');

-- ABS WARMUPS
INSERT INTO warmup_exercises (name, description, duration_seconds, muscle_groups, instructions, difficulty, equipment) VALUES
('Dead Bug', 'Core stability and coordination', 45, ARRAY['ABS'], 
 ARRAY['Lie on back with arms up', 'Knees bent at 90 degrees', 'Extend opposite arm and leg', 'Return to start position', 'Alternate sides slowly'], 
 'intermediate', 'bodyweight'),

('Bird Dog', 'Core and back stability', 60, ARRAY['ABS', 'BACK'], 
 ARRAY['Start on hands and knees', 'Extend opposite arm and leg', 'Hold for 2-3 seconds', 'Return to start position', 'Alternate sides'], 
 'beginner', 'bodyweight'),

('Plank Hold', 'Core activation', 30, ARRAY['ABS', 'SHOULDERS'], 
 ARRAY['Start in push-up position', 'Lower to forearms', 'Keep body straight from head to heels', 'Engage core throughout', 'Hold position for 30 seconds'], 
 'intermediate', 'bodyweight'),

('Russian Twists', 'Rotational core warmup', 45, ARRAY['ABS'], 
 ARRAY['Sit with knees bent, feet off ground', 'Lean back slightly', 'Rotate torso side to side', 'Keep core engaged', 'Perform 20-30 repetitions'], 
 'intermediate', 'bodyweight');

-- CARDIO WARMUPS
INSERT INTO warmup_exercises (name, description, duration_seconds, muscle_groups, instructions, difficulty, equipment) VALUES
('Jumping Jacks', 'Full body cardio warmup', 60, ARRAY['CARDIO'], 
 ARRAY['Start with feet together, arms at sides', 'Jump feet apart while raising arms', 'Jump back to start position', 'Maintain steady rhythm', 'Land softly on balls of feet'], 
 'beginner', 'bodyweight'),

('Mountain Climbers', 'Dynamic full body warmup', 45, ARRAY['CARDIO', 'ABS'], 
 ARRAY['Start in plank position', 'Bring one knee toward chest', 'Quickly switch legs', 'Maintain plank position', 'Keep core engaged throughout'], 
 'intermediate', 'bodyweight'),

('High Knees', 'Cardio and leg warmup', 30, ARRAY['CARDIO', 'LEGS'], 
 ARRAY['Stand with feet hip-width apart', 'Run in place bringing knees high', 'Pump arms naturally', 'Maintain steady rhythm', 'Land softly on balls of feet'], 
 'beginner', 'bodyweight'),

('Burpees', 'Full body explosive warmup', 60, ARRAY['CARDIO', 'ABS'], 
 ARRAY['Start standing', 'Drop into squat position', 'Jump feet back to plank', 'Perform push-up', 'Jump feet back to squat', 'Jump up with arms overhead'], 
 'advanced', 'bodyweight');

-- MULTI-MUSCLE WARMUPS
INSERT INTO warmup_exercises (name, description, duration_seconds, muscle_groups, instructions, difficulty, equipment) VALUES
('Dynamic Warm-up Circuit', 'Comprehensive full body warmup', 120, ARRAY['CHEST', 'BACK', 'SHOULDERS', 'TRICEPS', 'BICEPS', 'LEGS', 'ABS'], 
 ARRAY['Perform arm circles for 15 seconds', 'Do 10 bodyweight squats', 'Complete 5 push-ups', 'Hold plank for 15 seconds', 'Finish with 10 jumping jacks'], 
 'intermediate', 'bodyweight'),

('Sun Salutation', 'Yoga-inspired full body flow', 90, ARRAY['BACK', 'SHOULDERS', 'TRICEPS', 'BICEPS', 'LEGS', 'ABS'], 
 ARRAY['Start standing with arms at sides', 'Reach arms up overhead', 'Fold forward at hips', 'Step back to plank position', 'Lower to floor and push up', 'Return to standing position'], 
 'beginner', 'bodyweight'),

('Dynamic Stretching Sequence', 'Comprehensive mobility warmup', 150, ARRAY['CHEST', 'BACK', 'SHOULDERS', 'TRICEPS', 'BICEPS', 'LEGS', 'ABS'], 
 ARRAY['Start with arm circles and swings', 'Progress to leg swings and lunges', 'Include torso rotations', 'Finish with gentle jumping jacks', 'Focus on smooth, controlled movements'], 
 'intermediate', 'bodyweight');

-- Create a view for easy querying of warmup exercises by muscle group
CREATE OR REPLACE VIEW warmup_exercises_by_muscle AS
SELECT 
  we.*,
  unnest(we.muscle_groups) as muscle_group
FROM warmup_exercises we;

-- Create a function to get warmup exercises for specific muscle groups
CREATE OR REPLACE FUNCTION get_warmup_exercises_for_muscles(target_muscles text[])
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  duration_seconds integer,
  muscle_groups text[],
  instructions text[],
  difficulty text,
  equipment text,
  image_url text,
  video_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    we.id,
    we.name,
    we.description,
    we.duration_seconds,
    we.muscle_groups,
    we.instructions,
    we.difficulty,
    we.equipment,
    we.image_url,
    we.video_url
  FROM warmup_exercises we
  WHERE we.muscle_groups && target_muscles  -- Overlap with target muscle groups
  ORDER BY we.difficulty, we.name;
END;
$$ LANGUAGE plpgsql;
