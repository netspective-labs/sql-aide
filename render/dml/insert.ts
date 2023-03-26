import * as safety from "../../lib/universal/safety.ts";
import * as tmpl from "../emit/sql.ts";
import * as d from "../domain/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type InsertStmtReturning<
  ReturnableRecord,
  ReturnableColumnName extends keyof ReturnableRecord = keyof ReturnableRecord,
  ReturnableColumnExpr extends string = string,
> =
  | "*"
  | "primary-keys"
  | safety.RequireOnlyOne<{
    readonly columns?: ReturnableColumnName[];
    readonly exprs?: ReturnableColumnExpr[];
  }>;

export interface InsertStmtPreparerOptions<
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
  InsertableColumnName extends keyof InsertableRecord = keyof InsertableRecord,
> {
  readonly isColumnEmittable?: (
    columnName: keyof InsertableRecord,
    record: InsertableRecord,
    columnDefn: d.SqlDomain<
      Any,
      Context,
      Extract<InsertableColumnName, string>
    >,
    tableName: TableName,
  ) => boolean;
  readonly emitColumn?: (
    columnName: keyof InsertableRecord,
    record: InsertableRecord,
    columnDefn: d.SqlDomain<
      Any,
      Context,
      Extract<InsertableColumnName, string>
    >,
    tableName: TableName,
    ns: tmpl.SqlObjectNames,
    ctx: Context,
  ) =>
    | [columNameSqlText: string, value: unknown, valueSqlText: string]
    | undefined;
  readonly where?:
    | tmpl.SqlTextSupplier<Context>
    | ((
      ctx: Context,
    ) => tmpl.SqlTextSupplier<Context>);
  readonly onConflict?:
    | tmpl.SqlTextSupplier<Context>
    | ((
      ctx: Context,
    ) => tmpl.SqlTextSupplier<Context>);
  readonly returning?:
    | InsertStmtReturning<ReturnableRecord>
    | ((
      ctx: Context,
    ) => InsertStmtReturning<ReturnableRecord>);
  readonly transformSQL?: (
    suggested: string,
    tableName: TableName,
    record: InsertableRecord,
    names: InsertableColumnName[],
    values: [value: unknown, sqlText: string][],
    ns: tmpl.SqlObjectNames,
    ctx: Context,
  ) => string;
}

export interface InsertStmtPreparerSync<
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
> {
  (
    ir: InsertableRecord,
    options?: InsertStmtPreparerOptions<
      TableName,
      InsertableRecord,
      ReturnableRecord,
      Context
    >,
  ): tmpl.SqlTextSupplier<Context> & {
    readonly insertable: InsertableRecord;
    readonly returnable: (ir: InsertableRecord) => ReturnableRecord;
  };
}

export interface InsertStmtPreparer<
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
> {
  (
    ir: InsertableRecord,
    options?: InsertStmtPreparerOptions<
      TableName,
      InsertableRecord,
      ReturnableRecord,
      Context
    >,
  ): Promise<
    tmpl.SqlTextSupplier<Context> & {
      readonly insertable: InsertableRecord;
      readonly returnable: (ir: InsertableRecord) => ReturnableRecord;
    }
  >;
}

export function typicalInsertStmtSqlPreparerSync<
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
  InsertableColumnName extends keyof InsertableRecord = keyof InsertableRecord,
>(
  ir: InsertableRecord,
  tableName: TableName,
  candidateColumns: (
    group?: "all" | "primary-keys",
  ) => d.SqlDomain<Any, Context, Extract<InsertableColumnName, string>>[],
  ispOptions?: InsertStmtPreparerOptions<
    TableName,
    InsertableRecord,
    ReturnableRecord,
    Context
  >,
): tmpl.SqlTextSupplier<Context> {
  return {
    SQL: (ctx) => {
      const {
        isColumnEmittable,
        emitColumn,
        returning: returningArg,
        where,
        onConflict,
      } = ispOptions ?? {};
      const { sqlTextEmitOptions: eo } = ctx;
      const ns = ctx.sqlNamingStrategy(ctx, {
        quoteIdentifiers: true,
      });
      const names: InsertableColumnName[] = [];
      const values: [value: unknown, valueSqlText: string][] = [];
      candidateColumns().forEach((cdom) => {
        const cn = cdom.identity as InsertableColumnName;
        if (
          isColumnEmittable && !isColumnEmittable(cn, ir, cdom, tableName)
        ) {
          return;
        }

        let ec: [
          columNameSqlText: string,
          value: unknown,
          valueSqlText: string,
        ] | undefined;
        if (emitColumn) {
          ec = emitColumn(cn, ir, cdom, tableName, ns, ctx);
        } else {
          const { quotedLiteral } = eo;
          let recordValueRaw = (ir as Any)[cn];
          if (tmpl.isSqlTextSupplier(recordValueRaw)) {
            ec = [
              cn as string,
              recordValueRaw,
              `(${recordValueRaw.SQL(ctx)})`, // e.g. `(SELECT x from y) as SQL expr`
            ];
          } else {
            /* TODO: in NL Aide we used AxiomSerDe which supported defaults
                     differently than zod; now we're going to use Zod but not
                     sure if it's a 1:1 mapping...
            if (
              ax.isDefaultableAxiomSerDe(cdom) &&
              cdom.isDefaultable(recordValueRaw)
            ) {
              recordValueRaw = cdom.defaultValue(
                recordValueRaw,
                ctx as ax.AxiomSerDeValueSupplierContext,
              );
            }
            */
            if (cdom.sqlDmlTransformInsertableValue) {
              recordValueRaw = cdom.sqlDmlTransformInsertableValue(
                recordValueRaw,
              );
            }
            const qValue = quotedLiteral(recordValueRaw);
            ec = [cn as string, ...qValue];
          }
        }
        if (ec) {
          const [columNameSqlText, value, valueSqlText] = ec;
          names.push(columNameSqlText as InsertableColumnName);
          values.push([value, valueSqlText]);
        }
      });
      const sqlText = (
        ss?:
          | tmpl.SqlTextSupplier<Context>
          | ((ctx: Context) => tmpl.SqlTextSupplier<Context>),
      ) => {
        if (!ss) return "";
        const SQL = typeof ss == "function" ? ss(ctx).SQL(ctx) : ss.SQL(ctx);
        return ` ${SQL}`;
      };
      const returning = returningArg
        ? (typeof returningArg === "function"
          ? returningArg(ctx)
          : returningArg)
        : undefined;
      let returningSQL = "";
      if (typeof returning === "string") {
        switch (returning) {
          case "*":
            returningSQL = ` RETURNING *`;
            break;
          case "primary-keys":
            returningSQL = ` RETURNING ${
              candidateColumns("primary-keys").map((isd) =>
                ns.tableColumnName({ tableName, columnName: isd.identity })
              ).join(", ")
            }`;
            break;
        }
      } else if (typeof returning === "object") {
        if (returning.columns) {
          returningSQL = ` RETURNING ${
            returning!.columns!.map((n) =>
              ns.tableColumnName({ tableName, columnName: String(n) })
            ).join(", ")
          }`;
        } else {
          returningSQL = ` RETURNING ${returning!.exprs!.join(", ")}`;
        }
      }
      // deno-fmt-ignore
      const SQL = `INSERT INTO ${ns.tableName(tableName)} (${names.map(n => ns.tableColumnName({ tableName, columnName: String(n) })).join(", ")}) VALUES (${values.map((value) => value[1]).join(", ")
          })${sqlText(where)}${sqlText(onConflict)}${returningSQL}`;
      return ispOptions?.transformSQL
        ? ispOptions?.transformSQL(
          SQL,
          tableName,
          ir,
          names,
          values,
          ns,
          ctx,
        )
        : SQL;
    },
  };
}

export function typicalInsertStmtPreparerSync<
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  candidateColumns: (
    group?: "all" | "primary-keys",
  ) => d.SqlDomain<Any, Context, Extract<keyof InsertableRecord, string>>[],
  mutateValues?: (ir: safety.Writeable<InsertableRecord>) => InsertableRecord,
  defaultIspOptions?: InsertStmtPreparerOptions<
    TableName,
    InsertableRecord,
    ReturnableRecord,
    Context
  >,
): InsertStmtPreparerSync<
  TableName,
  InsertableRecord,
  ReturnableRecord,
  Context
> {
  return (ir, ispOptions = defaultIspOptions) => {
    // typically used when Zod parser should be invoked before SQL generated
    if (mutateValues) ir = mutateValues(ir);
    return {
      insertable: ir,
      returnable: (ir) => ir as unknown as ReturnableRecord,
      ...typicalInsertStmtSqlPreparerSync(
        ir,
        tableName,
        candidateColumns,
        ispOptions,
      ),
    };
  };
}

export function typicalInsertStmtPreparer<
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  candidateColumns: (
    group?: "all" | "primary-keys",
  ) => d.SqlDomain<Any, Context, Extract<keyof InsertableRecord, string>>[],
  mutateValues?: (
    ir: safety.Writeable<InsertableRecord>,
  ) => Promise<InsertableRecord>,
  defaultIspOptions?: InsertStmtPreparerOptions<
    TableName,
    InsertableRecord,
    ReturnableRecord,
    Context
  >,
): InsertStmtPreparer<TableName, InsertableRecord, ReturnableRecord, Context> {
  return async (ir, ispOptions = defaultIspOptions) => {
    // typically used when Zod parser should be invoked before SQL generated
    if (mutateValues) ir = await mutateValues(ir);
    return {
      insertable: ir,
      returnable: (ir) => ir as unknown as ReturnableRecord,
      ...typicalInsertStmtSqlPreparerSync(
        ir,
        tableName,
        candidateColumns,
        ispOptions,
      ),
    };
  };
}
