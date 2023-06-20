/**
 * This code defines a system for creating, formatting, and outputting PostgreSQL
 * `psql` source code from TypeScript string template literals. The input can be
 * complex TypeScript but the output should be `psql`-ready code that can be used
 * without SQLa dependencies.
 */
import { zod as z } from "../../deps.ts";
import * as safety from "../universal/safety.ts";
import * as ws from "../universal/whitespace.ts";

export { zod } from "../../deps.ts";
export * as safety from "../universal/safety.ts";
export * as ws from "../universal/whitespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

// `use` helps with complex decisions in string template literals;
// see: https://maxgreenwald.me/blog/do-more-with-run
export const use = <T>(fn: () => T): T => fn();

export type DiagnosticsSupplier = {
  readonly diagnostics: (defaultV: (() => string) | Any) => string;
};
export const isDiagnosticsSupplier = safety.typeGuard<DiagnosticsSupplier>(
  "diagnostics",
);

/**
 * The `Setable` type represents a named `set` expr that should be included
 * in a SQL format string. It includes a name, a type (represented by a Zod
 * type) and three methods (`s`, `L`, `I`) that return the format string for the
 * argument in different PostgreSQL format modes: normal, literal, and
 * identifier.
 */
export type Setable<
  Name,
  Type extends Setable<Name, z.ZodTypeAny> | z.ZodTypeAny,
> = {
  readonly name: Name;
  readonly index: number;
  readonly type: Type;
  readonly set: (
    options?: {
      value?: string;
      echo?: (supplied: string, setable: Setable<Name, Type>) => string;
    },
  ) => string;
  readonly s: () => string;
  readonly L: () => string;
  readonly I: () => string;
};

export function isSetable<
  Name,
  Type extends Setable<Name, z.ZodTypeAny> | z.ZodTypeAny,
>(
  o: unknown,
): o is Setable<Name, Type> {
  const iss = safety.typeGuard<Setable<Name, Type>>(
    "name",
    "type",
    "set",
    "s",
    "L",
    "I",
  );
  return iss(o);
}

export const setable = <
  Name,
  Type extends Setable<Name, z.ZodTypeAny> | z.ZodTypeAny,
>(
  name: Name,
  type: Type,
  index: number,
): Setable<Name, Type> => {
  const defaultValue = ("safeParse" in type)
    ? type.safeParse(undefined)
    : undefined;
  function wrapDiagnostics(defaultFn: () => string) {
    return function () {
      if (
        arguments.length > 0 && isDiagnosticsSupplier(arguments[0]) &&
        arguments[0].diagnostics != undefined
      ) {
        return arguments[0].diagnostics(defaultValue ?? defaultFn);
      }
      return defaultFn();
    };
  }
  const instance: Setable<Name, Type> = {
    name,
    type,
    index,
    set: function (options) {
      if (isDiagnosticsSupplier(options)) {
        return `-- \set ${name} ${options?.value ?? defaultValue ?? "??"}`;
      }
      return ws.unindentWhitespace(`
        \\if :{?${name}}
        \\else
          \\set ${name} ${
        options?.value ?? (defaultValue
          ? ("data" in defaultValue ? defaultValue.data : "??value-no-data")
          : "??value-undefined")
      }
        \\endif${
        options?.echo?.(
          `\n        \\echo ${name} is :'${name}'`,
          instance,
        ) ?? ""
      }`);
    },
    s: wrapDiagnostics(() => `:'${name}'`),
    L: wrapDiagnostics(() => `${name}`),
    I: wrapDiagnostics(() => `:"${name}"`),
  };
  return instance;
};

export const clonedSetable = <Name, Type extends z.ZodTypeAny>(
  s: Setable<Name, Type>,
): Setable<Name, Type> => setable(s.name, s.type, s.index);

/**
 * The `FormatArgument` type represents a named argument that should be included in
 * a SQL format string. It includes a name, a type (represented by a Zod type), an
 * index (indicating the argument's position), and three methods (`s`, `L`, `I`)
 * that return the format string for the argument in different PostgreSQL format
 * modes: normal, literal, and identifier.
 */
export type FormatArgument<
  ArgName,
  ArgType extends Setable<ArgName, z.ZodTypeAny> | z.ZodTypeAny,
> = {
  readonly name: ArgName;
  readonly index: number;
  readonly type: ArgType;
  readonly s: () => string;
  readonly L: () => string;
  readonly I: () => string;
};

export const formatArg = <
  ArgName,
  ArgType extends Setable<ArgName, z.ZodTypeAny> | z.ZodTypeAny,
>(
  name: ArgName,
  type: ArgType,
  index: number,
): FormatArgument<ArgName, ArgType> => {
  const defaultValue = ("safeParse" in type)
    ? type.safeParse(undefined)
    : undefined;
  function wrapDiagnostics(defaultFn: () => string) {
    return function () {
      if (
        arguments.length > 0 && isDiagnosticsSupplier(arguments[0]) &&
        arguments[0].diagnostics != undefined
      ) {
        return arguments[0].diagnostics(defaultValue ?? defaultFn);
      }
      return defaultFn();
    };
  }
  return {
    name: name as ArgName,
    type,
    index,
    s: wrapDiagnostics(() => `%${index + 1}$s`),
    L: wrapDiagnostics(() => `%${index + 1}$L`),
    I: wrapDiagnostics(() => `%${index + 1}$I`),
  };
};

export type Injectable<Name, Type extends z.ZodTypeAny> =
  | Setable<Name, Type>
  | FormatArgument<Name, Setable<Name, Type> | Type>;

export const injectable = <Name, Type extends z.ZodTypeAny>(
  i: Injectable<Name, Type>,
) => i;

export type InjectablesArgsShape = {
  [k in string]: z.ZodTypeAny | Setable<k, z.ZodTypeAny>;
};

export function injectables<
  InjectablesShape extends InjectablesArgsShape,
  InjectableName extends keyof InjectablesShape = keyof InjectablesShape,
>(shape: InjectablesShape) {
  type Setables = {
    [Property in keyof InjectablesShape]: InjectablesShape[Property] extends
      z.ZodType<infer O, infer D, infer I>
      ? Setable<Property, z.ZodType<O, D, I>>
      : Setable<Property, z.ZodNever>;
  };
  type Injectables = {
    [Property in keyof InjectablesShape]: InjectablesShape[Property] extends
      z.ZodType<infer O, infer D, infer I>
      ? Injectable<Property, z.ZodType<O, D, I>>
      : Injectable<Property, z.ZodNever>;
  };

  const setables: Setables = {} as Any;
  const injectables: Injectables = Object
    .fromEntries(
      Object.entries(shape).map(([name, type], index) => {
        const instance = injectable(setable(name, type, index));
        (setables[name as InjectableName] as Any) = instance;
        return [name as InjectableName, instance];
      }),
    ) as Injectables;
  return { shape, injectables, setables };
}

export function formatArgs<
  ArgsShape extends InjectablesArgsShape,
  ArgName extends keyof ArgsShape = keyof ArgsShape,
>(argsShape: ArgsShape) {
  type SetableArgs = {
    [Property in keyof ArgsShape]: ArgsShape[Property] extends
      z.ZodType<infer O, infer D, infer I>
      ? Setable<Property, z.ZodType<O, D, I>>
      : Setable<Property, z.ZodNever>;
  };
  type Injectables = {
    [Property in keyof ArgsShape]: ArgsShape[Property] extends
      z.ZodType<infer O, infer D, infer I>
      ? Injectable<Property, z.ZodType<O, D, I>>
      : Injectable<Property, z.ZodNever>;
  };

  const setables: SetableArgs = {} as Any;
  const argNames: ArgName[] = [];
  const args: Injectables = Object.fromEntries(
    Object.entries(argsShape).map(([name, type], index) => {
      const fa = injectable(formatArg(name, type, index));
      argNames.push(name as ArgName);
      if ("set" in type) {
        (setables[name as ArgName] as Any) = type;
      }
      return [name as ArgName, fa];
    }),
  ) as Injectables;
  return { shape: argsShape, args, injectables: args, argNames, setables };
}

export type InjectableExprScalar =
  | Setable<Any, Any>
  | FormatArgument<Any, Any>
  | string
  | number
  | bigint;

/**
 * The `InjectableExpr` type represents an expression that can be included in
 * psql text. It can be a `Setable`, a string, a number, a bigint, or a
 * function that takes an index and an array of expressions and returns a
 * `Setable` or primitive.
 */
export type InjectableExpr =
  | InjectableExprScalar
  | ((
    options?: {
      readonly expr: InjectableExpr;
      readonly exprIndex: number;
      readonly expressions: InjectableExpr[];
    } & Partial<DiagnosticsSupplier>,
  ) => InjectableExprScalar);

/**
 * The `psqlAide` function is a factory function that creates an instance of the
 * psql generation system. It takes a `ZodRawShape`, a `resolve` function that
 * uses the `Injectables` and a template function to generate psql text and an
 * optional `paOptions` argument that provides a custom literal supplier for the
 * `resolve` function's template function.
 *
 * TODO: show example
 *
 * This factory function uses a custom interpolation function that takes template
 * string literals and an array of expressions, and generates psql text. This
 * function resolves any functions in the expressions array before interpolation.
 * The interpolated string is then passed to the `resolve` function to generate
 * the final SQL format string.
 *
 * The `psql` function of the returned object creates a PostgreSQL format string
 * using the `body` and `injectables` properties.
 *
 * @param injShape the names and types of the arguments
 * @param resolve a string template literal that the caller should use to provide their psql body
 * @param paOptions options
 * @returns the body of the `resolve` result along with utility properties
 */
export function psqlAideCustom<InjectablesShape extends InjectablesArgsShape>(
  injShape: InjectablesShape,
  resolve: (
    injs: ReturnType<typeof injectables<InjectablesShape>>,
    template: (
      literals: TemplateStringsArray,
      ...suppliedExprs: InjectableExpr[]
    ) => { readonly body: string },
  ) => void,
  paOptions?: {
    readonly injectables?: (injShape: InjectablesShape) => ReturnType<
      typeof injectables<InjectablesShape>
    >;
    readonly literalSupplier?: (
      literals: TemplateStringsArray,
      suppliedExprs: unknown[],
    ) => ws.TemplateLiteralIndexedTextSupplier;
  } & Partial<DiagnosticsSupplier>,
) {
  const interpolate: (
    literals: TemplateStringsArray,
    ...suppliedExprs: InjectableExpr[]
  ) => string = (literals, ...suppliedExprs) => {
    const literalSupplier = paOptions?.literalSupplier
      ? paOptions?.literalSupplier(literals, suppliedExprs)
      : (index: number) => literals[index];

    // if any expressions are functions, resolve them so that the preprocessor
    // can see them as values; when you see ${Setable.s} or Setable.I or .L
    // or ${FormatArgument.s} or FormatArgument.I or .L those will all be
    // handled in here because they're functions. Each function will be passed
    // in an optional "context" of the expression details so it can return
    // whatever makes sense.
    const diagnostics = paOptions?.diagnostics;
    const expressions = suppliedExprs.map((expr, exprIndex, expressions) =>
      typeof expr === "function"
        ? expr({ expr, exprIndex, expressions, diagnostics })
        : expr
    );

    // after all expressions are handled then their final results will be
    // appended to the interpolated text
    let interpolated = "";
    const interpolateSingleExpr = (
      expr: InjectableExprScalar,
      _exprIndex: number,
      _inArray?: boolean,
      _isLastArrayEntry?: boolean,
    ) => {
      switch (typeof expr) {
        case "string":
        case "number":
        case "bigint":
          interpolated += expr;
          break;

        default:
          interpolated += Deno.inspect(expr);
      }
    };

    let activeLiteral: string;
    for (let i = 0; i < expressions.length; i++) {
      activeLiteral = literalSupplier(i);
      interpolated += activeLiteral;
      const expr = expressions[i];
      if (Array.isArray(expr)) {
        const lastIndex = expr.length - 1;
        for (let eIndex = 0; eIndex < expr.length; eIndex++) {
          interpolateSingleExpr(
            expr[eIndex],
            eIndex,
            true,
            eIndex == lastIndex,
          );
        }
      } else {
        interpolateSingleExpr(expr, i);
      }
    }
    activeLiteral = literalSupplier(literals.length - 1);
    interpolated += activeLiteral;
    return interpolated;
  };

  const injs = paOptions?.injectables?.(injShape) ?? injectables(injShape);
  let body: string;
  resolve(injs, (literals, ...suppliedExprs) => {
    body = interpolate(literals, ...suppliedExprs);
    return { body };
  });

  const indentedText = (text: string, indentation: string | number) => {
    const indent = typeof indentation === "string"
      ? indentation
      : " ".repeat(indentation);

    return text
      .split("\n")
      .map((line, index) => index === 0 ? line : indent + line)
      .join("\n");
  };
  return {
    ...injs,
    body: body!,
    indentedText,
    indentedBody: (indentation: string | number) =>
      indentedText(body!, indentation),
    paOptions,
  };
}

export function psqlAide<ArgsShape extends InjectablesArgsShape>(
  argsShape: ArgsShape,
  resolve: (
    injs: ReturnType<typeof injectables<ArgsShape>>,
    template: (
      literals: TemplateStringsArray,
      ...suppliedExprs: InjectableExpr[]
    ) => { readonly body: string },
  ) => void,
  paOptions?: Partial<DiagnosticsSupplier>,
) {
  return psqlAideCustom(argsShape, resolve, {
    ...paOptions,
    literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
  });
}

export function formatAideCustom<ArgsShape extends InjectablesArgsShape>(
  argsShape: ArgsShape,
  resolve: (
    fa: ReturnType<typeof injectables<ArgsShape>>,
    template: (
      literals: TemplateStringsArray,
      ...suppliedExprs: InjectableExpr[]
    ) => { readonly body: string },
  ) => void,
  faOptions?: {
    readonly literalSupplier?: (
      literals: TemplateStringsArray,
      suppliedExprs: unknown[],
    ) => ws.TemplateLiteralIndexedTextSupplier;
  } & Partial<DiagnosticsSupplier>,
) {
  const pa = psqlAideCustom(argsShape, resolve, {
    ...faOptions,
    injectables: (shape) => formatArgs(shape),
  });
  return {
    ...pa,
    args: pa.injectables,
    argNames: Object.values(pa.injectables).map((i) => i.name),
    format: (
      argsSupplier?: (par: typeof pa) => string[],
      bodyDelim = "$fmtBody$",
    ) => {
      const args = argsSupplier?.(pa) ??
        (Object.values(pa.injectables).map((i) =>
          isSetable(i.type) ? i.type.s() : i.name
        ));
      return ws.unindentWhitespace(`
        format(${bodyDelim}
          ${pa.indentedBody("          ")}
        ${bodyDelim}, ${args.join(", ")})`);
    },
    faOptions,
  };
}

export function formatAide<ArgsShape extends InjectablesArgsShape>(
  argsShape: ArgsShape,
  resolve: (
    fa: ReturnType<typeof injectables<ArgsShape>>,
    template: (
      literals: TemplateStringsArray,
      ...suppliedExprs: InjectableExpr[]
    ) => { readonly body: string },
  ) => void,
  faOptions?: Partial<DiagnosticsSupplier>,
) {
  return formatAideCustom(argsShape, resolve, {
    ...faOptions,
    literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
  });
}
