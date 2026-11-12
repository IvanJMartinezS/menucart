/**
 * Warm tones from the chosen sketch, used as the cover of a menu until it has a photo.
 * Dark text (`ink`) keeps at least 4.5:1 contrast on every one of them.
 */
export const coverColors = [
  '#f2d3b8',
  '#ead9a8',
  '#d8e2bd',
  '#cfe0e3',
  '#ecd2d8',
  '#e3d5c3',
] as const

/** Always the same color for the same menu, so covers do not change between visits. */
export function coverColorFor(menuId: string) {
  let hash = 0
  for (const char of menuId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return coverColors[hash % coverColors.length]!
}
