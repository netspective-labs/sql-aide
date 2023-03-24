import * as safety from "../lib/universal/safety.ts";
import * as emit from "../emit/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface SchemaDefinition<
  SchemaName extends emit.SqlNamespace,
  Context extends emit.SqlEmitContext,
> extends emit.SqlTextSupplier<Context>, emit.SqlNamespaceSupplier {
  readonly isValid: boolean;
  readonly sqlNamespace: SchemaName; // further specifies SqlNamespaceSupplier.sqlNamespace
  readonly isIdempotent: boolean;
}

export interface SchemaDefnSupplier<
  SchemaName extends emit.SqlNamespace,
  Context extends emit.SqlEmitContext,
> extends emit.QualifiedNamingStrategySupplier {
  readonly schema: SchemaDefinition<SchemaName, Context>;
}

export function isSchemaDefinition<
  SchemaName extends emit.SqlNamespace,
  Context extends emit.SqlEmitContext,
>(
  o: unknown,
): o is SchemaDefinition<SchemaName, Context> {
  const isSD = safety.typeGuard<
    SchemaDefinition<SchemaName, Context>
  >("sqlNamespace", "SQL");
  return isSD(o);
}

export function isSchemaDefnSupplier<
  SchemaName extends emit.SqlNamespace,
  Context extends emit.SqlEmitContext,
>(
  o: unknown,
): o is SchemaDefnSupplier<SchemaName, Context> {
  const isSDS = safety.typeGuard<
    SchemaDefnSupplier<SchemaName, Context>
  >("schema");
  return isSDS(o);
}

export interface SchemaDefnOptions<
  SchemaName extends emit.SqlNamespace,
  Context extends emit.SqlEmitContext,
> {
  readonly isIdempotent?: boolean;
}

export function sqlSchemaDefn<
  SchemaName extends emit.SqlNamespace,
  Context extends emit.SqlEmitContext,
>(
  schemaName: SchemaName,
  schemaDefnOptions?: SchemaDefnOptions<SchemaName, Context>,
) {
  const { isIdempotent = false } = schemaDefnOptions ?? {};
  const result:
    & SchemaDefinition<SchemaName, Context>
    & emit.SqlTextLintIssuesPopulator<Context> = {
      isValid: true,
      sqlNamespace: schemaName,
      isIdempotent,
      populateSqlTextLintIssues: () => {},
      SQL: (ctx) => {
        return `CREATE SCHEMA ${isIdempotent ? "IF NOT EXISTS " : ""}${
          ctx
            .sqlNamingStrategy(ctx, { quoteIdentifiers: true })
            .schemaName(schemaName)
        }`;
      },
      qualifiedNames: (ctx, baseNS) => {
        const ns = baseNS ?? ctx.sqlNamingStrategy(ctx);
        const nsQualifier = emit.qualifyName(ns.schemaName(schemaName));
        return emit.qualifiedNamingStrategy(ns, nsQualifier);
      },
    };
  return result;
}
