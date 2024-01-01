/**
 * Filter unique values from an object array. Stringifies each object row
 * to create a single comparison and returns only the records in the array
 * that are unique.
 * @param objects an array of objects
 * @returns distinct array entries
 */
export function distinctEntries<T extends Record<string, unknown>>(
  objects: T[],
): T[] {
  const seen = new Set<string>();
  return objects.filter((obj) => {
    const signature = JSON.stringify(
      Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0])),
    );
    if (seen.has(signature)) {
      return false;
    } else {
      seen.add(signature);
      return true;
    }
  });
}
