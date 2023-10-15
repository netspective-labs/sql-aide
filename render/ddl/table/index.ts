import { zod as z } from "../../deps.ts";
import * as tmpl from "../../emit/mod.ts";

export type TableIndex<Context extends tmpl.SqlEmitContext> =
  tmpl.SqlTextSupplier<Context>;

export type TableColumnsIndex<
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  ColumnName extends keyof ColumnsShape = keyof ColumnsShape,
> =
  & TableIndex<Context>
  & {
    readonly indexIdentity?: string;
    readonly indexedColumnNames: ColumnName[];
  };

export function tableIndexesFactory<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  ColumnName extends keyof ColumnsShape = keyof ColumnsShape,
>(tableName: TableName, columnsShape: ColumnsShape) {
  const indexes: TableColumnsIndex<ColumnsShape, Context>[] = [];
  const builder = {
    index: (
      options?: {
        readonly indexIdentity?: string;
        readonly isUnique?: boolean;
      },
      ...indexedColumnNames: ColumnName[]
    ) => {
      const index: TableColumnsIndex<ColumnsShape, Context> = {
        indexIdentity: options?.indexIdentity,
        indexedColumnNames,
        SQL: (ctx) => {
          const ns = ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true });
          const indexIdentity = index.indexIdentity ?? ns.tableIndexName(
            tableName,
            indexedColumnNames.map((cn) => String(cn)),
          );
          const ucQuoted = indexedColumnNames.map((c) =>
            ns.domainName(String(c))
          );
          // deno-fmt-ignore
          return `CREATE ${options?.isUnique ? "UNIQUE " : ""}INDEX ${indexIdentity} ON ${ns.tableName(tableName)}(${
            ucQuoted.join(", ")
          })`;
        },
      };

      indexes.push(index);
      return index;
    },
  };
  return {
    tableName,
    columnsShape,
    indexes,
    ...builder,
  };
}
