export function publicLookupWhere(
  param: string | undefined,
): { id: number } | { slug: string } | null {
  if (!param) return null;
  if (/^\d+$/.test(param)) return { id: parseInt(param, 10) };
  return { slug: param };
}
