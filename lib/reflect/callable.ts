/**
 * Enum representing the nature of the instance being analyzed.
 */
export enum CallablesNature {
  OBJECT = "OBJECT",
  CLASS = "CLASS",
}

/**
 * Extracts the identifiers of callable methods in a given object or class type `T`
 * that return a specific type `R`.
 *
 * @template T - The type of the object or class instance.
 * @template R - The return type of the methods (not enforceable, merely informative).
 */
export type CallablesOfType<T, R> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => R ? K : never;
}[keyof T];

/**
 * Type representing the different ways identifier of callable methods in a given object
 * or class type `T` that return a specific type `R`.
 *
 * @template T - The type of the object or class instance.
 * @template R - The return type of the methods (not enforceable, merely informative).
 */
export type CallableFilterPattern<T, R> =
  | string
  | RegExp
  | ((
    callable: CallablesOfType<T, R>,
    instance: T,
    searched: unknown,
  ) => boolean);

/**
 * Identifiers, nature, and filter for callable methods in a given object
 * or class type `T` that return a specific type `R`.
 */
export type Callables<T, R> = ReturnType<typeof callables<T, R>>;

/**
 * A single callable method/function in a given object or class type `T` that
 * return a specific type `R`.
 */
export type Callable<T, R> = ReturnType<Callables<T, R>["filter"]>[number];

/**
 * Returns method names ("identifiers"), type information, and a filter function for the provided instance.
 *
 * @template T - The type of the object or class definition.
 * @template R - The return type of the methods (not enforceable, merely informative).
 * @param instance - The object or class instance to analyze.
 * @returns An object containing:
 * - `identifiers`: An array of method names (filtered based on the return type `R` if specified).
 * - `searched`: The target object or prototype from which the method names were extracted.
 * - `instance`: The object or class instance analyzed.
 * - `nature`: An enum value indicating if the instance is an object or a class.
 * - `filter`: A function that filters and returns methods based on `include` and `exclude` criteria, with a callable interface that handles `this` context for class methods.
 * @throws If the instance is not an object or a constructed class instance.
 *
 * @example
 * class MyClass {
 *   foo() { return 42; }
 *   bar() { return "hello"; }
 *   baz = "not a method";
 * }
 *
 * const result = callables(new MyClass());
 * // Result: {
 * //   identifiers: ["foo", "bar"],
 * //   instance: new MyClass(),
 * //   searched: MyClass.prototype,
 * //   nature: CallablesNature.CLASS,
 * //   filter: [Function: filter]
 * // }
 */
export function callables<T, R>(instance: T) {
  if (
    typeof instance !== "object" || instance === null || Array.isArray(instance)
  ) {
    throw new TypeError(
      "The provided instance must be an object or a constructed class instance.",
    );
  }

  const nature = Object.getPrototypeOf(instance) !== Object.prototype
    ? CallablesNature.CLASS
    : CallablesNature.OBJECT;

  const searched =
    (nature === CallablesNature.CLASS
      ? Object.getPrototypeOf(instance)
      : instance) as T;

  const identifiers = (Object.getOwnPropertyNames(searched) as (keyof T)[])
    .filter((name) => {
      return typeof searched[name] === "function" && name !== "constructor";
    }) as CallablesOfType<T, R>[];

  const filter = (
    options?: {
      include?: CallableFilterPattern<T, R> | CallableFilterPattern<T, R>[];
      exclude?: CallableFilterPattern<T, R> | CallableFilterPattern<T, R>[];
    },
  ) => {
    const include = options?.include
      ? (Array.isArray(options.include) ? options.include : [options.include])
      : undefined;
    const exclude = options?.exclude
      ? (Array.isArray(options.exclude) ? options.exclude : [options.exclude])
      : undefined;

    return identifiers.filter((nameSupplied) => {
      const name = String(nameSupplied);
      if (exclude && exclude.length > 0) {
        const excludeMatch = exclude.some((pattern) => {
          if (typeof pattern === "string" && name.includes(pattern)) {
            return true;
          }
          if (pattern instanceof RegExp && pattern.test(name)) return true;
          if (
            typeof pattern === "function" &&
            pattern(nameSupplied, instance, searched)
          ) {
            return true;
          }
          return false;
        });
        if (excludeMatch) return false;
      }

      if (include && include.length > 0) {
        const includeMatch = include.some((pattern) => {
          if (typeof pattern === "string" && name.includes(pattern)) {
            return true;
          }
          if (pattern instanceof RegExp && pattern.test(name)) return true;
          if (
            typeof pattern === "function" &&
            pattern(nameSupplied, instance, searched)
          ) {
            return true;
          }
          return false;
        });
        if (!includeMatch) return false;
      }
      return true;
    }).map((name) => ({
      source: {
        // if you modify this list, update `return` value below, too
        identifiers,
        searched,
        instance,
        nature,
        filter,
      },
      callable: name,
      call: async (...args: unknown[]) => {
        const method = searched[name] as unknown as (...args: unknown[]) => R;
        if (nature === CallablesNature.CLASS) {
          return await method.apply(instance, args);
        }
        return await method(...args);
      },
      callSync: (...args: unknown[]) => {
        const method = searched[name] as unknown as (...args: unknown[]) => R;
        if (nature === CallablesNature.CLASS) {
          return method.apply(instance, args);
        }
        return method(...args);
      },
    }));
  };

  return {
    // if you modify this list, update `source` above, too
    identifiers,
    searched,
    instance,
    nature,
    filter,
  };
}

/**
 * Analyzes multiple instances and returns their callables with a collective filter function.
 *
 * @template T - The type of the objects or class instances.
 * @param instances - The array of objects or class instances to analyze.
 * @returns An object containing:
 * - `callables`: An array of callables from each instance.
 * - `filter`: A function that filters and returns callables across all instances.
 */
export function callablesCollection<T, R>(...instances: T[]) {
  const callablesList = instances.map((instance) => callables<T, R>(instance));
  const filter = (options?: Parameters<Callables<T, R>["filter"]>[0]) => {
    return callablesList.flatMap((c) => c.filter(options));
  };

  return {
    callables: callablesList,
    filter,
  };
}
