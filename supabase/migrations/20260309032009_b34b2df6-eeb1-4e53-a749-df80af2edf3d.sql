
ALTER TABLE public.todos ADD CONSTRAINT todos_text_length CHECK (char_length(text) <= 200);
ALTER TABLE public.todos ADD CONSTRAINT todos_description_length CHECK (description IS NULL OR char_length(description) <= 500);
ALTER TABLE public.todos ADD CONSTRAINT todos_icon_length CHECK (char_length(icon) <= 50);
ALTER TABLE public.dividers ADD CONSTRAINT dividers_name_length CHECK (char_length(name) <= 100);
ALTER TABLE public.dividers ADD CONSTRAINT dividers_icon_length CHECK (char_length(icon) <= 50);
ALTER TABLE public.scheduled_events ADD CONSTRAINT events_title_length CHECK (char_length(title) <= 200);
ALTER TABLE public.scheduled_events ADD CONSTRAINT events_description_length CHECK (char_length(description) <= 500);
ALTER TABLE public.mood_notes ADD CONSTRAINT mood_notes_note_length CHECK (char_length(note) <= 1000);
ALTER TABLE public.mood_notes ADD CONSTRAINT mood_notes_mood_length CHECK (char_length(mood) <= 50);
