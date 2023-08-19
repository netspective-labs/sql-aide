// converted to Deno Typescript from github.com/gustavoam-asdf/object-inspector

export function isBoolean(any: unknown): any is boolean {
  return typeof any === "boolean";
}

export function isNull(any: unknown): any is null {
  return any === null;
}

export function isUndefined(any: unknown): any is undefined {
  return typeof any === "undefined";
}

// deno-lint-ignore ban-types
export function isNumber(any: unknown): any is Number {
  return typeof any === "number";
}

export function isString(any: unknown): any is string {
  return typeof any === "string";
}

export function isSymbol(any: unknown): any is symbol {
  return typeof any === "symbol";
}

// deno-lint-ignore ban-types
export function isFunction(any: unknown): any is Function {
  return typeof any === "function";
}

export function isObject(any: unknown): any is object {
  return typeof any === "object";
}

export type PrimitiveType =
  | boolean
  | null
  | undefined
  | number
  | string
  | symbol;

export type NonPrimitiveType =
  | Date
  | RegExp
  | Error
  // deno-lint-ignore no-explicit-any
  | Promise<any>
  // deno-lint-ignore no-explicit-any
  | Map<any, any>
  // deno-lint-ignore no-explicit-any
  | Set<any>
  // deno-lint-ignore no-explicit-any
  | WeakMap<any, any>
  // deno-lint-ignore no-explicit-any
  | WeakSet<any>
  // deno-lint-ignore no-explicit-any
  | Array<any>
  // deno-lint-ignore no-explicit-any
  | ArrayLike<any>
  | typeof Intl;

// deno-lint-ignore ban-types
export type BasicType = PrimitiveType | Function | object;

export type ExcludePrimitiveType<OmittedType extends PrimitiveType> = Exclude<
  PrimitiveType,
  OmittedType
>;

export type ExcludeBasicType<OmittedType extends BasicType> =
  | ExcludePrimitiveType<OmittedType extends PrimitiveType ? OmittedType : 0>
  // deno-lint-ignore ban-types
  | Exclude<Function | object, OmittedType>;

export interface PrimitiveTypeInfo {
  key?: string | number | symbol;
  // deno-lint-ignore no-explicit-any
  value: any;
  type: string;
  description?: string;
}

export interface FunctionTypeInfo extends PrimitiveTypeInfo {
  name: string;
  stringify: string;
}

export interface ObjectTypeInfo extends PrimitiveTypeInfo {
  properties: Array<PrimitiveTypeInfo | FunctionTypeInfo | ObjectTypeInfo>;
  symbols: PrimitiveTypeInfo[];
  stringify: string;
  propertyDescription: PropertyDescriptor;
}

export type TypeInfo = PrimitiveTypeInfo | FunctionTypeInfo | ObjectTypeInfo;

// deno-lint-ignore no-explicit-any
export function reflect(any: any, ancestors?: any[], options?: {
  // deno-lint-ignore no-explicit-any
  readonly enhanceScalar?: (ti: TypeInfo, ancestors?: any[]) => TypeInfo;
  // deno-lint-ignore no-explicit-any
  readonly enhanceFunction?: (ti: TypeInfo, ancestors?: any[]) => TypeInfo;
  // deno-lint-ignore no-explicit-any
  readonly objPropsFilter?: (propName: string, any: any) => boolean;
  // deno-lint-ignore no-explicit-any
  readonly enhanceObject?: (ti: TypeInfo, ancestors?: any[]) => TypeInfo;
}): TypeInfo {
  if (
    isBoolean(any) ||
    isNull(any) ||
    isUndefined(any) ||
    isNumber(any) ||
    isString(any) ||
    isSymbol(any)
  ) {
    const enhanceScalar = options?.enhanceScalar;
    const response: PrimitiveTypeInfo = {
      value: any,
      type: typeof any,
    };
    if (isSymbol(any)) {
      response.description = any.description;
    }
    return enhanceScalar ? enhanceScalar(response, ancestors) : response;
  }

  if (isFunction(any)) {
    const enhanceFunction = options?.enhanceFunction;
    const fn: FunctionTypeInfo = {
      value: any,
      name: any.name,
      type: typeof any,
      stringify: any.toString(),
    };
    return enhanceFunction ? enhanceFunction(fn, ancestors) : fn;
  }

  const enhanceObject = options?.enhanceObject;
  let propertiesNames = Object.getOwnPropertyNames(any);
  if (options?.objPropsFilter) {
    propertiesNames = propertiesNames.filter(options?.objPropsFilter);
  }
  const symbols = Object.getOwnPropertySymbols(any);

  const obj: TypeInfo = {
    value: any,
    type: typeof any,
    properties: propertiesNames.map((prop) => ({
      ...reflect(any[prop], ancestors ? [...ancestors, any] : [any], options),
      key: prop,
      propertyDescription: Object.getOwnPropertyDescriptor(any, prop),
    })),
    symbols: symbols.map((sym) => ({
      ...reflect(any[sym], ancestors ? [...ancestors, any] : [any], options),
      key: sym,
    })),
    stringify: any.toString(),
  };
  return enhanceObject ? enhanceObject(obj) : obj;
}
