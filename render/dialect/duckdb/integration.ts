import * as pgpass from "../../../lib/postgres/pgpass/pgpass-parse.ts";
import * as ws from "../../../lib/universal/whitespace.ts";
import * as tmpl from "../../emit/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface IntegrationSupplier {
  readonly isIntegrationSupplier: true;
}

export interface CsvIntegration<
  Context extends tmpl.SqlEmitContext & {
    readonly resolveFsPath?: (
      cvsI: CsvIntegration<Context>,
      ctx: Context,
    ) => string;
  },
> extends IntegrationSupplier {
  readonly csvSrcFsPath: (ctx: Context) => string;
  readonly readCsvAutoOptions?: string[];
  readonly from: tmpl.SqlTextSupplier<
    Context
  >;
}

export function csvIntegration<
  Context extends tmpl.SqlEmitContext & {
    readonly resolveFsPath?: (
      cvsI: CsvIntegration<Context>,
      ctx: Context,
    ) => string;
  },
>(
  init: Omit<CsvIntegration<Context>, "isIntegrationSupplier" | "from">,
) {
  const csvI: CsvIntegration<Context> = {
    isIntegrationSupplier: true,
    readCsvAutoOptions: ["header=true"],
    from: {
      SQL: (ctx) => {
        const csvSrcFsPath = ctx.resolveFsPath?.(csvI, ctx) ??
          csvI.csvSrcFsPath(ctx);
        return `read_csv_auto('${csvSrcFsPath}'${
          csvI.readCsvAutoOptions
            ? `, ${csvI.readCsvAutoOptions.join(", ")}`
            : ""
        })`;
      },
    },
    ...init,
  };
  return csvI;
}

export interface CsvTableIntegration<Context extends tmpl.SqlEmitContext>
  extends CsvIntegration<Context>, tmpl.SqlTextSupplier<Context> {
  readonly tableName: string;
  readonly isTempTable?: boolean;
  readonly extraColumnsSql?: string[];
}

export function csvTableIntegration<
  Context extends tmpl.SqlEmitContext & {
    readonly resolveFsPath?: (
      cvsI: CsvIntegration<Context>,
      ctx: Context,
    ) => string;
  },
>(
  init: Omit<
    CsvTableIntegration<Context>,
    "isIntegrationSupplier" | "from" | "SQL"
  >,
) {
  const csvI: CsvTableIntegration<Context> = {
    ...csvIntegration(init),
    extraColumnsSql: ["row_number() OVER () as src_file_row_number"],
    SQL: (ctx) => {
      // deno-fmt-ignore
      return ws.unindentWhitespace(`
        CREATE ${csvI.isTempTable ? `TEMPORARY ` : ""}TABLE ${csvI.tableName} AS
          SELECT *${csvI.extraColumnsSql ? `, ${csvI.extraColumnsSql.join(", ")}` : ""}
            FROM ${csvI.from.SQL(ctx)}`);
    },
    ...init,
  };
  return csvI;
}

export function csvTablesIntegrations<
  Shape extends Record<string | number | symbol, CsvTableIntegration<Context>>,
  Context extends tmpl.SqlEmitContext,
>(
  integrations: Shape,
  options?: {
    readonly resolveFsPath?: (
      si: CsvTableIntegration<Context>,
      ctx: Context,
    ) => string;
  },
) {
  return {
    ...integrations,
    SQL: (ctx: Context) => {
      const localCtx = {
        resolveFsPath: options?.resolveFsPath,
        ...ctx,
      } as Context;
      const SQL: string[] = [];
      for (
        const csvI of Object.values<CsvTableIntegration<Context>>(integrations)
      ) {
        // deno-fmt-ignore
        SQL.push(csvI.SQL(localCtx));
      }
      return SQL.join("\n");
    },
  };
}

export interface SqliteIntegration<Context extends tmpl.SqlEmitContext>
  extends IntegrationSupplier {
  readonly sqliteDbFsPath: (ctx: Context) => string;
  readonly attachAs: string;
}

export function sqliteIntegration<Context extends tmpl.SqlEmitContext>(
  init: Omit<
    SqliteIntegration<Context>,
    "isIntegrationSupplier"
  >,
) {
  const si: SqliteIntegration<Context> = {
    isIntegrationSupplier: true,
    ...init,
  };
  return si;
}

export function sqliteIntegrations<
  Shape extends Record<string | number | symbol, SqliteIntegration<Context>>,
  Context extends tmpl.SqlEmitContext,
>(
  integrations: Shape,
  options?: {
    readonly resolveFsPath?: (
      si: SqliteIntegration<Context>,
      ctx: Context,
    ) => string;
  },
) {
  return {
    ...integrations,
    SQL: (ctx: Context) => {
      const SQL: string[] = [];
      let emitCount = 0;
      for (
        const si of Object.values<SqliteIntegration<Context>>(integrations)
      ) {
        const sqliteDbFsPath = options?.resolveFsPath?.(si, ctx) ??
          si.sqliteDbFsPath(ctx);
        emitCount++;
        // deno-fmt-ignore
        SQL.push(`${emitCount == 1 ? `INSTALL sqlite;\n` : ''}ATTACH '${sqliteDbFsPath}' AS ${si.attachAs} (TYPE sqlite);`);
      }
      return SQL.join("\n");
    },
  };
}

export interface ExcelIntegration<
  SheetName extends string,
  Context extends tmpl.SqlEmitContext,
> extends IntegrationSupplier {
  readonly xlsFsPath: (ctx: Context) => string;
  readonly from: (sheetName: SheetName) => tmpl.SqlTextSupplier<Context>;
}

export function excelIntegration<
  SheetName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  init:
    & Omit<
      ExcelIntegration<SheetName, Context>,
      "isIntegrationSupplier" | "isExcelIntegration" | "from"
    >
    & {
      readonly resolveFsPath?: (
        ei: ExcelIntegration<SheetName, Context>,
        ctx: Context,
      ) => string;
    },
) {
  const xlsEngine: ExcelIntegration<SheetName, Context> = {
    isIntegrationSupplier: true,
    ...init,
    from: (sheetName) => {
      return {
        SQL: (ctx) => {
          const excelFileName = init?.resolveFsPath?.(xlsEngine, ctx) ??
            xlsEngine.xlsFsPath(ctx);
          return `st_read('${excelFileName}', layer='${sheetName}')`;
        },
      };
    },
  };
  return xlsEngine;
}

export function excelIntegrations<
  Shape extends Record<
    string | number | symbol,
    ExcelIntegration<Any, Context>
  >,
  Context extends tmpl.SqlEmitContext,
>(
  integrations: Shape,
) {
  return {
    ...integrations,
    SQL: () => `INSTALL spatial; LOAD spatial;`,
  };
}

export interface PostgreSqlIntegration<
  Table extends string,
  Context extends tmpl.SqlEmitContext,
> extends IntegrationSupplier {
  readonly isPostgreSqlIntegration: true;
  readonly pgpassConn: (ctx: Context) => pgpass.Connection;
  readonly from: (
    tableName: Table,
    options?: { schema?: string; pushdown?: boolean },
  ) => tmpl.SqlTextSupplier<Context>;
}

export function postgreSqlIntegration<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  init: Omit<
    PostgreSqlIntegration<TableName, Context>,
    "isIntegrationSupplier" | "isPostgreSqlIntegration" | "from"
  >,
) {
  const pgEngine: PostgreSqlIntegration<TableName, Context> = {
    isIntegrationSupplier: true,
    isPostgreSqlIntegration: true,
    ...init,
    from: (tableName, options) => {
      return {
        SQL: (ctx) => {
          const conn = init.pgpassConn(ctx);
          // deno-fmt-ignore
          return `${options?.pushdown ? "postgres_scan_pushdown" : "postgres_scan"}('dbname=${conn.database} user=${conn.username} password=${conn.password} host=${conn.host} port=${String(conn.port)}', '${options?.schema ?? "public"}', '${tableName}')`
        },
      };
    },
  };
  return pgEngine;
}

export function postgreSqlIntegrations<
  Shape extends Record<
    string | number | symbol,
    PostgreSqlIntegration<Any, Context>
  >,
  Context extends tmpl.SqlEmitContext,
>(
  integrations: Shape,
) {
  return {
    ...integrations,
    SQL: () => `INSTALL postgres; LOAD postgres;`,
  };
}

// the functions below are "convenience" functions for building strongly-typed
// integrations with attached Context

export function integration<Context extends tmpl.SqlEmitContext>() {
  function csv(init: Parameters<typeof csvTableIntegration<Context>>[0]) {
    return csvIntegration<Context>(init);
  }

  function csvTable(init: Parameters<typeof csvTableIntegration<Context>>[0]) {
    return csvTableIntegration<Context>(init);
  }

  function sqlite(init: Parameters<typeof sqliteIntegration<Context>>[0]) {
    return sqliteIntegration<Context>(init);
  }

  function excel<SheetName extends string>(
    init: Parameters<typeof excelIntegration<SheetName, Context>>[0],
  ) {
    return excelIntegration<SheetName, Context>(init);
  }

  function postgreSQL<TableName extends string>(
    init: Parameters<typeof postgreSqlIntegration<TableName, Context>>[0],
  ) {
    return postgreSqlIntegration<TableName, Context>(init);
  }

  return {
    csv,
    csvTable,
    sqlite,
    excel,
    postgreSQL,
  };
}

export function integrationsBuilder<Context extends tmpl.SqlEmitContext>() {
  function csvTables<
    Shape extends Record<
      string | number | symbol,
      CsvTableIntegration<Context>
    >,
  >(shape: Shape) {
    return csvTablesIntegrations<Shape, Context>(shape);
  }

  function sqlite<
    Shape extends Record<string | number | symbol, SqliteIntegration<Context>>,
  >(
    shape: Shape,
    options?: Parameters<typeof sqliteIntegrations<Shape, Context>>[1],
  ) {
    return sqliteIntegrations<Shape, Context>(shape, options);
  }

  function excel<
    Shape extends Record<
      string | number | symbol,
      ExcelIntegration<Any, Context>
    >,
  >(shape: Shape) {
    return excelIntegrations<Shape, Context>(shape);
  }

  function postgreSQL<
    Shape extends Record<
      string | number | symbol,
      PostgreSqlIntegration<Any, Context>
    >,
  >(shape: Shape) {
    return postgreSqlIntegrations<Shape, Context>(shape);
  }

  return {
    factory: integration<Context>(),
    csvTables,
    sqlite,
    excel,
    postgreSQL,
  };
}
