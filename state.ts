import * as tmpl from "./sql.ts";

export type SqlTextMemoizer<Context extends tmpl.SqlEmitContext> = {
  readonly memoizeSQL: <STS extends tmpl.SqlTextSupplier<Context>>(
    sts: STS,
  ) => STS;
};

export type SqlTextCollection = {
  readonly uniqueSQL: Iterable<string>;
  readonly populate: <Destination extends Array<string>>(
    entry: (sql: string) => string,
    dest: Destination,
  ) => Destination;
};

/**
 * A SQL text memoizer that will store only unique SQL statements in the order
 * that they were added.
 * @param ctx SqlEmitContext
 * @returns a memoizer function and SQL set
 */
export function uniqueSqlTextState<Context extends tmpl.SqlEmitContext>(
  ctx: Context,
) {
  const uniqueSQL = new Set<string>();
  const result: SqlTextMemoizer<Context> & SqlTextCollection = {
    uniqueSQL,
    memoizeSQL: <STS extends tmpl.SqlTextSupplier<Context>>(sts: STS) => {
      uniqueSQL.add(sts.SQL(ctx));
      return sts;
    },
    populate: <Destination extends Array<string>>(
      entry: (sql: string) => string,
      dest: Destination,
    ) => {
      for (const sql of uniqueSQL) {
        dest.push(entry(sql));
      }
      return dest;
    },
  };
  return result;
}
