import { z } from "zod";

export const NoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string().min(1)).default([]),
});

export const EmailSchema = z.object({
  to: z.array(z.string().email()).min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
});

export type NoteData = z.infer<typeof NoteSchema>;
export type EmailData = z.infer<typeof EmailSchema>;
