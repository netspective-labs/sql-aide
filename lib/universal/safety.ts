export interface TypeGuard<T> {
  (o: unknown): o is T;
}

export interface TypeGuardCustom<X, T extends X> {
  (o: X): o is T;
}

/**
 * A flexible type guard function that checks if a given object contains specified
 * properties of a particular type.
 *
 * The function generates a TypeGuard for the provided type T and takes a variadic
 * list of keys that exist in T. It then verifies if these keys exist in the tested
 * object. If all specified keys are present, the guard is passed and the object is
 * recognized as of type T within its scope.
 *
 * The keys are optional. If no keys are specified, no check is performed, and the
 * function merely tests if the object is a non-null "object" type.
 *
 * Note: This function does not validate the types of these properties. It only
 * checks for the existence of properties.
 *
 * @template T The type against which to perform the type guard.
 * @template K A subset of the keys of T. Default is all keys in T.
 * @param {...K[]} requireKeysInSingleT The keys required to be in the object.
 *
 * @returns {TypeGuard<T>} A TypeGuard for the provided type T.
 *
 * @example
 *
 * const isPerson = typeGuard<Person>('name', 'age');
 * if (isPerson(myObj)) {
 *   console.log(myObj.name); // myObj is Person in this scope
 * }
 */
export function typeGuard<T, K extends keyof T = keyof T>(
  ...requireKeysInSingleT: K[] // = [...keyof T] TODO: default this to all required keys
): TypeGuard<T> {
  return (o: unknown): o is T => {
    // Make sure that the object passed is a real object and has all required props
    if (o && typeof o === "object") {
      return !requireKeysInSingleT.find((p) => !(p in o));
    }
    return false;
  };
}

/**
 * A strict type guard function that checks if a given object includes all
 * the properties of a specified type.
 *
 * This function generates a TypeGuard for the provided type T. It will check
 * if the tested object has all the properties that exist in type T. The check
 * is strict in the sense that the tested object should contain only and all the
 * properties specified in type T to pass the guard.
 *
 * Note: This function only checks for the existence of properties and does not
 * validate the types of these properties. You should use a library like Zod if
 * you need deeper and more flexible valiation.
 *
 * @template T The type against which to perform the type guard.
 * @returns {TypeGuard<T>} A TypeGuard for the provided type T.
 *
 * @example
 *
 * const isPerson = typeGuardStrict<Person>();
 * if (isPerson(myObj)) {
 *   console.log(myObj.name); // myObj is Person in this scope
 * }
 */
export function typeGuardStrict<T>(): TypeGuard<T> {
  return (o: unknown): o is T => {
    if (o && typeof o === "object") {
      // check that each property in T exists in o
      for (const key in o as T) {
        if (!(key in o)) {
          return false;
        }
      }
      return true;
    }
    return false;
  };
}

export function subTypeGuard<
  Type,
  SubType,
  K extends keyof SubType = keyof SubType,
>(base: TypeGuard<Type>, ...requireKeysInSingleT: K[]): TypeGuard<SubType> {
  return (o: unknown): o is SubType => {
    if (base(o)) {
      // Make sure that the object passed is a real object and has all required props
      if (o && typeof o === "object") {
        return !requireKeysInSingleT.find((p) => !(p in o));
      }
    }
    return false;
  };
}

export function multipleTypesGuard<
  AggregateType,
  ReturnType,
  K extends keyof AggregateType = keyof AggregateType,
>(
  guards: TypeGuard<unknown>[],
  ...requireKeysInSingleT: K[]
): TypeGuard<ReturnType> {
  return (o: unknown): o is ReturnType => {
    for (const guard of guards) {
      if (!guard(o)) return false;
    }
    if (o && typeof o === "object") {
      return !requireKeysInSingleT.find((p) => !(p in o));
    }
    return false;
  };
}

export function typeGuardCustom<X, T extends X, K extends keyof T = keyof T>(
  ...requireKeysInSingleT: K[] // = [...keyof T] TODO: default this to all required keys
): TypeGuardCustom<X, T> {
  return (o: X): o is T => {
    // Make sure that the object passed is a real object and has all required props
    return o && typeof o === "object" &&
      !requireKeysInSingleT.find((p) => !(p in o));
  };
}

export function typeGuardArrayOf<
  T,
  ArrayT extends T[],
  K extends keyof T = keyof T,
>(
  ...requireKeysInSingleT: K[] // = [...keyof T] TODO: default this to all required keys
): TypeGuard<ArrayT> {
  const guard = typeGuard<T>(...requireKeysInSingleT);
  return (o: unknown): o is ArrayT => {
    if (o && Array.isArray(o)) {
      return !o.find((i) => !guard(i));
    }
    return false;
  };
}

export function typeGuards<
  SingleT,
  MultipleT extends SingleT[],
  K extends keyof SingleT = keyof SingleT,
>(
  ...requireKeysInSingleT: K[]
): [TypeGuard<SingleT>, TypeGuard<MultipleT>] {
  return [
    typeGuard<SingleT>(...requireKeysInSingleT),
    typeGuardArrayOf<SingleT, MultipleT>(...requireKeysInSingleT),
  ];
}

/**
 * This type utility enforces at least one property from the given set of keys
 * (`Keys`) in type `T` to be present. All other properties not in `Keys` will
 * retain their original optionality.
 *
 * @template T The object type.
 * @template Keys The keys in T that should have at least one present. Defaults
 * to all keys in T.
 *
 * @typedef RequireAtLeastOne
 *
 * @example
 * type Person = { name: string, age: number, gender?: string }
 * type ValidPerson = RequireAtLeastOne<Person, 'age' | 'gender'>
 * // In ValidPerson, either 'age' or 'gender' must be present.
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  & Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * This type utility enforces exactly one property from the given set of keys
 * (`Keys`) in type `T` to be present. All other properties not in `Keys` will
 * retain their original optionality.
 *
 * @template T The object type.
 * @template Keys The keys in T that should have exactly one present. Defaults
 * to all keys in T.
 *
 * @typedef RequireOnlyOne
 *
 * @example
 * type Person = { name: string, age: number, gender?: string }
 * type ValidPerson = RequireOnlyOne<Person, 'age' | 'gender'>
 * // In ValidPerson, either 'age' or 'gender' must be present but not both.
 */
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
  & Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?:
      & Required<Pick<T, K>>
      & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

/**
 * This type utility transforms a read-only type into a mutable one by
 * removing `readonly` attribute from all its properties.
 *
 * @template T The object type.
 *
 * @typedef Writeable
 *
 * @example
 * type ReadOnlyPerson = { readonly name: string, readonly age: number }
 * type Person = Writeable<ReadOnlyPerson>
 * // Person's properties are all writable.
 */
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * This type utility recursively transforms a read-only type into a mutable one
 * by removing `readonly` attribute from all its properties, including nested
 * objects.
 *
 * @template T The object type.
 *
 * @typedef DeepWriteable
 *
 * @example
 * type ReadOnlyPerson = { readonly name: string, readonly age: number, readonly address: { readonly street: string } }
 * type Person = DeepWriteable<ReadOnlyPerson>
 * // Person and nested objects' properties are all writable.
 */
export type DeepWriteable<T> = {
  -readonly [P in keyof T]: DeepWriteable<T[P]>;
};
