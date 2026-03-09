import { z } from "zod";

export const todoSchema = z.object({
  text: z.string().trim().min(1, "Habit name is required").max(200, "Habit name must be under 200 characters"),
  description: z.string().max(500, "Description must be under 500 characters").nullable().optional(),
  icon: z.string().max(50).default("Star"),
});

export const dividerSchema = z.object({
  name: z.string().trim().min(1, "Section name is required").max(100, "Section name must be under 100 characters"),
  icon: z.string().max(50).default("Star"),
});

export const eventSchema = z.object({
  title: z.string().trim().min(1, "Event title is required").max(200, "Event title must be under 200 characters"),
  description: z.string().max(500, "Description must be under 500 characters").optional().default(""),
  time: z.string().max(10),
  timeEnd: z.string().max(10).optional().default(""),
  date: z.string().max(20),
});

export const moodNoteSchema = z.object({
  mood: z.string().min(1).max(50),
  note: z.string().max(1000, "Note must be under 1000 characters").optional().default(""),
  date: z.string().max(20),
});

export function validateOrToast<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    return null;
  }
  return result.data;
}
