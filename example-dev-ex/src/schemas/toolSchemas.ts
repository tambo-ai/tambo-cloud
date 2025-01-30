import { z } from "zod";

export const GetContactsSchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().min(1).max(100).optional(),
});

export const GetCalendarSchema = z.object({
  userId: z.string().uuid(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
});

export type GetContactsInput = z.infer<typeof GetContactsSchema>;
export type GetCalendarInput = z.infer<typeof GetCalendarSchema>;
