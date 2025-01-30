import { z } from "zod";

export const EmailPropsSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  recipients: z.array(z.string().email()),
});

export const NotePropsSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

export type EmailProps = z.infer<typeof EmailPropsSchema>;
export type NoteProps = z.infer<typeof NotePropsSchema>;
