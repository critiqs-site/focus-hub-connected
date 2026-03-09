-- Add order column to todos table
ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 0;