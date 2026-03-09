-- Add pinned column to todos table
ALTER TABLE public.todos
ADD COLUMN pinned boolean NOT NULL DEFAULT false;