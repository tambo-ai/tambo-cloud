export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function validateISODate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(date);
}
