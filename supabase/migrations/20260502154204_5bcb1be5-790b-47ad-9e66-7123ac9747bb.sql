-- Notes table (short, simple)
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  pinned BOOLEAN NOT NULL DEFAULT false,
  locked BOOLEAN NOT NULL DEFAULT false,
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notes" ON public.notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notes" ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notes" ON public.notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Docs table (long-form, rich text as HTML)
CREATE TABLE public.docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  pinned BOOLEAN NOT NULL DEFAULT false,
  locked BOOLEAN NOT NULL DEFAULT false,
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own docs" ON public.docs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own docs" ON public.docs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own docs" ON public.docs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own docs" ON public.docs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER docs_updated_at BEFORE UPDATE ON public.docs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Master PIN per user (hashed)
CREATE TABLE public.notebook_pins (
  user_id UUID PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notebook_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own pin" ON public.notebook_pins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pin" ON public.notebook_pins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pin" ON public.notebook_pins FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own pin" ON public.notebook_pins FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER notebook_pins_updated_at BEFORE UPDATE ON public.notebook_pins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();