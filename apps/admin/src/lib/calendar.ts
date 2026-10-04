// Day pickers work with local Dates; the agenda uses "YYYY-MM-DD" keys

const pad = (n: number) => String(n).padStart(2, "0");

export const keyToDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const dateToKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** "YYYY-MM" of a local Date */
export const monthOf = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
