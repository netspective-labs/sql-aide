export interface TypeGuard<T> {
  (o: unknown): o is T;
}

export interface TypeGuardCustom<X, T extends X> {
  (o: X): o is T;
}

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

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  & Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
  & Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?:
      & Required<Pick<T, K>>
      & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type DeepWriteable<T> = {
  -readonly [P in keyof T]: DeepWriteable<T[P]>;
};
