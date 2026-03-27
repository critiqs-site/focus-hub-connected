ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS goal_days_per_week integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS target_amount integer,
  ADD COLUMN IF NOT EXISTS target_unit text,
  ADD COLUMN IF NOT EXISTS color text;