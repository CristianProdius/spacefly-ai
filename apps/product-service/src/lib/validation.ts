export const parsePositiveInteger = (value: unknown) => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export const parsePositiveIntegerWithDefault = (value: unknown, fallback: number, max?: number) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = parsePositiveInteger(String(value));
  if (parsed === null) return null;
  return max ? Math.min(parsed, max) : parsed;
};

export const isDateOnlyOrIsoDate = (value: unknown) => {
  if (typeof value !== "string" || value.trim() === "") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const parseRating = (value: unknown) => {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value >= 1 && value <= 5 ? value : null;
};
