import {
  type GetCalendarInput,
  type GetContactsInput,
} from "../schemas/toolSchemas";

export const getContacts = async (
  input: GetContactsInput,
): Promise<unknown> => {
  const response = await fetch(
    `/api/contacts?userId=${input.userId}&limit=${input.limit || 10}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch contacts");
  }

  return response.json();
};

export const getCalendar = async (
  input: GetCalendarInput,
): Promise<unknown> => {
  const response = await fetch(
    `/api/calendar?userId=${input.userId}&start=${input.dateRange.start}&end=${input.dateRange.end}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch calendar");
  }

  return response.json();
};
