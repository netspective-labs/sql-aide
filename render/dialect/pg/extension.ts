import * as safety from "../../../lib/universal/safety.ts";
import * as emit from "../../emit/mod.ts";
import * as sch from "../../ddl/schema.ts";

export type PostgresExtension = string;

export interface ExtensionDefinition<
  SchemaName extends emit.SqlNamespace,
  ExtensionName extends PostgresExtension,
  Context extends emit.SqlEmitContext,
> extends emit.SqlTextSupplier<Context> {
  readonly isValid: boolean;
  readonly extension: ExtensionName;
  readonly isIdempotent: boolean;
  readonly schema: sch.SchemaDefinition<SchemaName, Context>;
}

export function isExtensionDefinition<
  SchemaName extends emit.SqlNamespace,
  ExtensionName extends PostgresExtension,
  Context extends emit.SqlEmitContext,
>(
  o: unknown,
): o is ExtensionDefinition<SchemaName, ExtensionName, Context> {
  const isSD = safety.typeGuard<
    ExtensionDefinition<SchemaName, ExtensionName, Context>
  >(
    "extension",
    "SQL",
  );
  return isSD(o);
}

export interface ExtensionDefnOptions<
  SchemaName extends emit.SqlNamespace,
  ExtensionName extends PostgresExtension,
  Context extends emit.SqlEmitContext,
> {
  readonly isIdempotent?: boolean;
}

export function pgExtensionDefn<
  SchemaName extends emit.SqlNamespace,
  ExtensionName extends PostgresExtension,
  Context extends emit.SqlEmitContext,
>(
  schema: sch.SchemaDefinition<SchemaName, Context>,
  extension: ExtensionName,
  edOptions?: ExtensionDefnOptions<
    SchemaName,
    ExtensionName,
    Context
  >,
) {
  const { isIdempotent = true } = edOptions ?? {};
  const result:
    & ExtensionDefinition<SchemaName, ExtensionName, Context>
    & emit.SqlTextLintIssuesPopulator<Context> = {
      isValid: true,
      schema,
      extension,
      isIdempotent,
      populateSqlTextLintIssues: () => {},
      SQL: (ctx) => {
        return `CREATE EXTENSION ${
          isIdempotent ? "IF NOT EXISTS " : ""
        }${extension} SCHEMA ${
          ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true })
            .schemaName(schema.sqlNamespace)
        }`;
      },
    };
  return result;
}
