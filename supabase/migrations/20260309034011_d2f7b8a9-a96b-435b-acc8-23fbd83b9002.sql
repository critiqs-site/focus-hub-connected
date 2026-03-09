
-- Fix #1: Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- DIVIDERS
DROP POLICY IF EXISTS "Users can create their own dividers" ON public.dividers;
DROP POLICY IF EXISTS "Users can delete their own dividers" ON public.dividers;
DROP POLICY IF EXISTS "Users can update their own dividers" ON public.dividers;
DROP POLICY IF EXISTS "Users can view their own dividers" ON public.dividers;

CREATE POLICY "Users can view their own dividers" ON public.dividers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own dividers" ON public.dividers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dividers" ON public.dividers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dividers" ON public.dividers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- TODOS
DROP POLICY IF EXISTS "Users can create their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos;

CREATE POLICY "Users can view their own todos" ON public.todos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own todos" ON public.todos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own todos" ON public.todos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own todos" ON public.todos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PROFILES
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- SCHEDULED_EVENTS
DROP POLICY IF EXISTS "Users can create their own events" ON public.scheduled_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.scheduled_events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.scheduled_events;
DROP POLICY IF EXISTS "Users can view their own events" ON public.scheduled_events;

CREATE POLICY "Users can view their own events" ON public.scheduled_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own events" ON public.scheduled_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON public.scheduled_events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON public.scheduled_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MOOD_NOTES
DROP POLICY IF EXISTS "Users can create their own mood_notes" ON public.mood_notes;
DROP POLICY IF EXISTS "Users can delete their own mood_notes" ON public.mood_notes;
DROP POLICY IF EXISTS "Users can update their own mood_notes" ON public.mood_notes;
DROP POLICY IF EXISTS "Users can view their own mood_notes" ON public.mood_notes;

CREATE POLICY "Users can view their own mood_notes" ON public.mood_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own mood_notes" ON public.mood_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mood_notes" ON public.mood_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mood_notes" ON public.mood_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix #7: Add unique constraint on profiles.user_id for upsert
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
