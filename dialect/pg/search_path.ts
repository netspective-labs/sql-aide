import * as safety from "../../lib/universal/safety.ts";
import * as emit from "../../emit/mod.ts";
import * as sch from "../../ddl/schema.ts";

export interface PostgresSchemaSearchPathDefinition<
  SchemaName extends emit.SqlNamespace,
  Context extends emit.SqlEmitContext,
> extends emit.SqlTextSupplier<Context> {
  readonly searchPath: SchemaName[];
}

export function isPostgresSchemaSearchPathDefinition<
  SchemaName extends emit.SqlNamespace,
  Context extends emit.SqlEmitContext,
>(
  o: unknown,
): o is PostgresSchemaSearchPathDefinition<SchemaName, Context> {
  const isSD = safety.typeGuard<
    PostgresSchemaSearchPathDefinition<SchemaName, Context>
  >(
    "searchPath",
    "SQL",
  );
  return isSD(o);
}

export function pgSearchPath<
  SchemaName extends emit.SqlNamespace,
  Context extends emit.SqlEmitContext,
>(...searchPath: sch.SchemaDefinition<SchemaName, Context>[]) {
  const result:
    & PostgresSchemaSearchPathDefinition<SchemaName, Context>
    & emit.SqlTextLintIssuesPopulator<Context> = {
      searchPath: searchPath.map((s) => s.sqlNamespace),
      populateSqlTextLintIssues: () => {},
      SQL: (ctx) => {
        return `SET search_path TO ${
          searchPath.map((schema) =>
            ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true })
              .schemaName(schema.sqlNamespace)
          ).join(", ")
        }`;
      },
    };
  return result;
}
