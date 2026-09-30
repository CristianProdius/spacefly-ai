export function reorderImages(
  images: string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= images.length ||
    toIndex >= images.length
  ) {
    return images;
  }
  const next = [...images];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return images;
  next.splice(toIndex, 0, moved);
  return next;
}
