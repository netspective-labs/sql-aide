/**
 * This code defines a system for creating, formatting, and outputting PostgreSQL
 * `psql` source code from TypeScript string template literals. The input can be
 * complex TypeScript but the output should be `psql`-ready code that can be used
 * without SQLa dependencies.
 */
import { zod as z } from "../../deps.ts";
import * as ws from "../universal/whitespace.ts";

export { zod } from "../../deps.ts";
export * as ws from "../universal/whitespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * The `Setable` type represents a named `set` expr that should be included
 * in a SQL format string. It includes a name, a type (represented by a Zod
 * type) and three methods (`s`, `L`, `I`) that return the format string for the
 * argument in different PostgreSQL format modes: normal, literal, and
 * identifier.
 */
export type Setable<Name, Type extends z.ZodTypeAny> = {
  readonly name: Name;
  readonly type: Type;
  readonly set: () => string;
  readonly s: () => string;
  readonly L: () => string;
  readonly I: () => string;
};

/**
 * The `Injectables` type represents a map of injection names to
 * `Setable` instances. It's created by the `injectables` function, which
 * takes a `ZodRawShape` (which is a map of argument names to Zod types) and
 * creates a `Setable` for each entry.
 */
export type Injectables<
  Shape extends z.ZodRawShape,
  Name extends keyof Shape = keyof Shape,
> = {
  [A in Name]: Setable<A, Shape[A]>;
};

export function injectables<
  Shape extends z.ZodRawShape,
  Name extends keyof Shape = keyof Shape,
>(shape: Shape) {
  const argNames: Name[] = [];
  const injectables = Object.fromEntries(
    Object.entries(shape).map(([name, type]) => {
      const fa: Setable<Name, Any> = {
        name: name as Name,
        type,
        set: () => `\\set ${name}`,
        s: () => `:'${name}'`,
        L: () => name,
        I: () => `:"${name}"`,
      };

      argNames.push(name as Name);
      return [name as Name, fa];
    }),
  );
  return { shape, injectables };
}

export type InjectableExprScalar =
  | Setable<Any, Any>
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
  | ((index: number, expressions: InjectableExpr[]) => InjectableExprScalar);

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
 * @param argsShape the names and types of the arguments
 * @param resolve a string template literal that the caller should use to provide their psql body
 * @param paOptions options
 * @returns the body of the `resolve` result along with utility properties
 */
export function psqlAideCustom<ArgsShape extends z.ZodRawShape>(
  argsShape: ArgsShape,
  resolve: (
    fa: ReturnType<typeof injectables<ArgsShape>>,
    template: (
      literals: TemplateStringsArray,
      ...suppliedExprs: InjectableExpr[]
    ) => { readonly body: string },
  ) => void,
  paOptions?: {
    readonly literalSupplier?: (
      literals: TemplateStringsArray,
      suppliedExprs: unknown[],
    ) => ws.TemplateLiteralIndexedTextSupplier;
  },
) {
  const interpolate: (
    literals: TemplateStringsArray,
    ...suppliedExprs: InjectableExpr[]
  ) => string = (literals, ...suppliedExprs) => {
    const literalSupplier = paOptions?.literalSupplier
      ? paOptions?.literalSupplier(literals, suppliedExprs)
      : (index: number) => literals[index];

    // if any expressions are functions, resolve them so that the preprocessor
    // can see them as values
    const expressions = suppliedExprs.map((e, exprIndex, expressions) =>
      typeof e === "function" ? e(exprIndex, expressions) : e
    );

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

  const args = injectables(argsShape);
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
    paOptions,
  };
}

export function psqlAide<ArgsShape extends z.ZodRawShape>(
  argsShape: ArgsShape,
  resolve: (
    fa: ReturnType<typeof injectables<ArgsShape>>,
    template: (
      literals: TemplateStringsArray,
      ...suppliedExprs: InjectableExpr[]
    ) => { readonly body: string },
  ) => void,
) {
  return psqlAideCustom(argsShape, resolve, {
    literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
  });
}
