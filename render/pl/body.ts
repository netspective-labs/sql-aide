import * as safety from "../../lib/universal/safety.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as tmpl from "../emit/mod.ts";
import * as govn from "./governance.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export function isBody<
  BodyIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is govn.RoutineBody<BodyIdentity, Context> {
  const isB = safety.typeGuard<
    govn.RoutineBody<BodyIdentity, Context>
  >("content", "SQL");
  return isB(o);
}

export type BodyDefnOptions<
  BodyIdentity extends string,
  Context extends tmpl.SqlEmitContext,
> = tmpl.SqlTextSupplierOptions<Context> & {
  readonly identity?: BodyIdentity;
  readonly surround?: string | {
    readonly pre: string;
    readonly post: string;
  } | ((SQL: string) => string);
};

export function body<
  BodyIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>(
  ess: tmpl.EmbeddedSqlSupplier,
  bOptions?: BodyDefnOptions<BodyIdentity, Context>,
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context>[]
  ):
    & govn.RoutineBody<BodyIdentity, Context>
    & tmpl.SqlTextLintIssuesPopulator<Context> => {
    const partial = ess.embeddedSQL<Context>({
      literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
    });
    const content = partial(literals, ...expressions);
    const { identity, surround } = bOptions ?? {};
    return {
      isValid: true,
      identity,
      content,
      SQL: surround
        ? ((ctx) => {
          switch (typeof surround) {
            case "string":
              return `${surround}${content.SQL(ctx)}${surround}`;
            case "function":
              return surround(content.SQL(ctx));
            default:
              return `${surround.pre}${content.SQL(ctx)}${surround.post}`;
          }
        })
        : content.SQL,
      populateSqlTextLintIssues: () => {},
    };
  };
}
