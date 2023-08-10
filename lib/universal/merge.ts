// deno-lint-ignore no-explicit-any
type Any = any;

interface Mergable {
  [key: string]: Any;
  length?: never;
}

type MergeIntersection<U> = (
  U extends Any ? (k: U) => void : never
) extends (k: infer I) => void ? I
  : never;

// istanbul ignore next
const isObject = (obj: Any) => {
  if (typeof obj === "object" && obj !== null) {
    if (typeof Object.getPrototypeOf === "function") {
      const prototype = Object.getPrototypeOf(obj);
      return prototype === Object.prototype || prototype === null;
    }

    return Object.prototype.toString.call(obj) === "[object Object]";
  }

  return false;
};

const mergeArrays = true;

/**
 * Safely (type-safe) merge objects and maintain types so that the caller
 * still knows each of the component types
 * @param objects Typed objects to merge
 * @returns Single typed object after merge
 */
export const safeMerge = <T extends Mergable[]>(
  ...objects: T
): MergeIntersection<T[number]> =>
  objects.reduce((result, current) => {
    Object.keys(current).forEach((key) => {
      if (Array.isArray(result[key]) && Array.isArray(current[key])) {
        result[key] = mergeArrays
          ? Array.from(new Set((result[key] as unknown[]).concat(current[key])))
          : current[key];
      } else if (isObject(result[key]) && isObject(current[key])) {
        result[key] = safeMerge(
          result[key] as Mergable,
          current[key] as Mergable,
        );
      } else {
        result[key] = current[key];
      }
    });

    return result;
  }, {}) as Any;
