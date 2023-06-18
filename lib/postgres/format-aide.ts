/**
 * This code defines a system for creating, formatting, and outputting PostgreSQL
 * format strings based on TypeScript types defined using the Zod validation
 * library. The generated PostgreSQL strings are intended to be used for creating
 * complex SQL queries, stored routines, and other SQL intended to generate SQL
 * at runtime in the database itself.
 *
 * This module is a meta-programming library in that it generates code that is
 * to be used by PostgreSQL to generate SQL inside the database.
 */
import { zod as z } from "../../deps.ts";
import * as safety from "../universal/safety.ts";
import * as ws from "../universal/whitespace.ts";

export { zod } from "../../deps.ts";
export * as ws from "../universal/whitespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * The `FormatArgument` type represents a named argument that should be included in
 * a SQL format string. It includes a name, a type (represented by a Zod type), an
 * index (indicating the argument's position), and three methods (`s`, `L`, `I`)
 * that return the format string for the argument in different PostgreSQL format
 * modes: normal, literal, and identifier.
 */
export type FormatArgument<ArgName, ArgType extends z.ZodTypeAny> = {
  readonly name: ArgName;
  readonly index: number;
  readonly type: ArgType;
  readonly s: () => string;
  readonly L: () => string;
  readonly I: () => string;
};

export const isFormatArgument = safety.typeGuard<FormatArgument<Any, Any>>(
  "name",
  "index",
  "type",
  "s",
  "L",
  "I",
);

/**
 * The `FormatArguments` type represents a map of argument names to
 * `FormatArgument` instances. It's created by the `formatArgs` function, which
 * takes a `ZodRawShape` (which is a map of argument names to Zod types) and
 * creates a `FormatArgument` for each entry.
 */
export type FormatArguments<
  ArgsShape extends z.ZodRawShape,
  ArgName extends keyof ArgsShape = keyof ArgsShape,
> = {
  [A in ArgName]: FormatArgument<A, ArgsShape[A]>;
};

export function formatArgs<
  ArgsShape extends z.ZodRawShape,
  ArgName extends keyof ArgsShape = keyof ArgsShape,
>(argsShape: ArgsShape) {
  const argNames: ArgName[] = [];
  const args = Object.fromEntries(
    Object.entries(argsShape).map(([name, type], index) => {
      const fa: FormatArgument<ArgName, Any> = {
        name: name as ArgName,
        type,
        index,
        s: () => `%${index + 1}$s`,
        L: () => `%${index + 1}$L`,
        I: () => `%${index + 1}$I`,
      };

      argNames.push(name as ArgName);
      return [name as ArgName, fa];
    }),
  );
  return {
    argsShape,
    args,
    argNames,
  };
}

export type FormatAideExprScalar =
  | FormatArgument<Any, Any>
  | string
  | number
  | bigint;

/**
 * The `FormatAideExpr` type represents an expression that can be included in a SQL
 * format string. It can be a `FormatArgument`, a string, a number, a bigint, or a
 * function that takes an index and an array of expressions and returns a
 * `FormatArgument` or primitive.
 */
export type FormatAideExpr =
  | FormatAideExprScalar
  | ((index: number, expressions: FormatAideExpr[]) => FormatAideExprScalar);

/**
 * The `formatAide` function is a factory function that creates an instance of the
 * `FormatAideExpr` system. It takes a `ZodRawShape`, a `resolve` function that
 * uses the `FormatArguments` and a template function to generate a SQL format
 * string, and an optional `faOptions` argument that provides a custom literal
 * supplier for the `resolve` function's template function.
 *
 * const transformed = mod.formatAideCustom(
 *   {
 *     arg1: z.string(),
 *     arg2: z.number(),
 *     arg3: z.date(),
 *   },
 *   ({ args: { arg1, arg2, arg3 } }, template) =>
 *     template`
 *       this is a test of arg1: ${arg1.L}
 *       this is a test of arg2: ${arg2.s}
 *       this is a test of arg3: ${arg3.I}`,
 *   { literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier },
 * );
 *
 * `transformed.format()` would yield
 *
 * `format($fmtBody$
 *   this is a test of arg1: %1$L
 *   this is a test of arg2: %2$s
 *   this is a test of arg3: %3$I
 * $fmtBody$, arg1, arg2, arg3)`
 *
 * This factory function uses a custom interpolation function that takes template
 * string literals and an array of expressions, and generates a SQL format string.
 * This function resolves any functions in the expressions array before
 * interpolation. The interpolated string is then passed to the `resolve` function
 * to generate the final SQL format string.
 *
 * The `format` function of the returned object creates a PostgreSQL format string
 * using the `body` and `args.argNames` properties.
 *
 * @param argsShape the names and types of the arguments
 * @param resolve a string template literal that the caller should use to provide their format function body
 * @param faOptions options
 * @returns the body of the `resolve` result along with utility properties
 */
export function formatAideCustom<ArgsShape extends z.ZodRawShape>(
  argsShape: ArgsShape,
  resolve: (
    fa: ReturnType<typeof formatArgs<ArgsShape>>,
    template: (
      literals: TemplateStringsArray,
      ...suppliedExprs: FormatAideExpr[]
    ) => { readonly body: string },
  ) => void,
  faOptions?: {
    readonly literalSupplier?: (
      literals: TemplateStringsArray,
      suppliedExprs: unknown[],
    ) => ws.TemplateLiteralIndexedTextSupplier;
  },
) {
  const interpolate: (
    literals: TemplateStringsArray,
    ...suppliedExprs: FormatAideExpr[]
  ) => string = (literals, ...suppliedExprs) => {
    const literalSupplier = faOptions?.literalSupplier
      ? faOptions?.literalSupplier(literals, suppliedExprs)
      : (index: number) => literals[index];

    // if any expressions are functions, resolve them so that the preprocessor
    // can see them as values
    const expressions = suppliedExprs.map((e, exprIndex, expressions) =>
      typeof e === "function" ? e(exprIndex, expressions) : e
    );

    let interpolated = "";
    const interpolateSingleExpr = (
      expr: FormatAideExprScalar,
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

  const args = formatArgs(argsShape);
  let body: string;
  resolve(args, (literals, ...suppliedExprs) => {
    body = interpolate(literals, ...suppliedExprs);
    return { body };
  });

  const indented = (text: string, indentation: string | number) => {
    const indent = typeof indentation === "string"
      ? indentation
      : " ".repeat(indentation);

    return text
      .split("\n")
      .map((line, index) => index === 0 ? line : indent + line)
      .join("\n");
  };
  return {
    argsShape,
    args,
    body: body!,
    indented,
    format: (bodyDelim = "$fmtBody$") =>
      ws.unindentWhitespace(`
        format(${bodyDelim}
          ${indented(body!, "          ")}
        ${bodyDelim}, ${args.argNames.join(", ")})`),
    faOptions,
  };
}

export function formatAide<ArgsShape extends z.ZodRawShape>(
  argsShape: ArgsShape,
  resolve: (
    fa: ReturnType<typeof formatArgs<ArgsShape>>,
    template: (
      literals: TemplateStringsArray,
      ...suppliedExprs: FormatAideExpr[]
    ) => { readonly body: string },
  ) => void,
) {
  return formatAideCustom(argsShape, resolve, {
    literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
  });
}
