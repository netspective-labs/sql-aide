import * as pgpass from "../../../lib/postgres/pgpass/pgpass-parse.ts";
import * as ws from "../../../lib/universal/whitespace.ts";
import * as tmpl from "../../emit/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type ContentProvenance = { identity: string };

export type ContentFsPathSupplier = (provenance: ContentProvenance) => string;

export interface AttachableStorageEngine {
  readonly identifier: string;
}

export interface AttachableSqliteEngine
  extends AttachableStorageEngine, DuckDbSqlTextSupplier<Any, Any, Any> {
  readonly isAttachableSqliteEngine: true;
  readonly sqliteDbFsPath: string;
}

export function attachableSqliteEngine(
  init: Omit<
    AttachableSqliteEngine,
    "isAttachableSqliteEngine" | "SQL" | "encounteredInSQL"
  >,
) {
  let emitCount = 0;
  const sqliteEngine: AttachableSqliteEngine = {
    isAttachableSqliteEngine: true,
    ...init,
    // SQL(ctx) will be called each time it's added to a SQLa template literal
    // so we use ctx.sqliteBackends for state management
    SQL: (ctx) => {
      let sbe = ctx.sqliteBackends.get(sqliteEngine.identifier);
      if (!sbe) {
        sbe = sqliteEngine;
        ctx.sqliteBackends.set(sbe.identifier, sbe);
      }
      emitCount++;
      // deno-fmt-ignore
      return ws.unindentWhitespace(`${emitCount == 1 ? `INSTALL sqlite;\n` : ''}ATTACH '${init.sqliteDbFsPath}' AS ${init.identifier} (TYPE sqlite);`);
    },
  };
  return sqliteEngine;
}

export interface AttachableExcelEngine<SheetName extends string>
  extends AttachableStorageEngine {
  readonly isAttachableExcelEngine: true;
  readonly from: (
    sheetName: SheetName,
  ) => string | DuckDbSqlTextSupplier<Any, Any, Any>;
}

export function attachableExcelEngine<SheetName extends string = string>(
  init: Omit<
    AttachableExcelEngine<SheetName>,
    "isAttachableExcelEngine" | "from" | "encounteredInSQL"
  >,
) {
  const encounteredInSQL = new Map<
    string,
    {
      readonly excelFileName: string;
      readonly sheetName: string;
      count: number;
    }
  >();
  const xlsEngine: AttachableExcelEngine<SheetName> = {
    isAttachableExcelEngine: true,
    ...init,
    from: (sheetName) => {
      return {
        SQL: ({ contentFsPath }) => {
          const excelFileName = contentFsPath({ identity: init.identifier });
          const key = `${excelFileName}:::${sheetName}`;
          let eis = encounteredInSQL.get(key);
          if (!eis) {
            eis = { excelFileName, sheetName, count: 1 };
            encounteredInSQL.set(key, eis);
          } else {
            eis.count++;
          }
          return `st_read('${excelFileName}', layer='${sheetName}')`;
        },
      };
    },
  };
  return xlsEngine;
}

export interface AttachablePostgreSqlEngine<Table extends string>
  extends AttachableStorageEngine {
  readonly isAttachablePostgreSqlEngine: true;
  readonly pgpassConn: pgpass.Connection;
  readonly from: (
    tableName: Table,
    options?: { schema?: string; pushdown?: boolean },
  ) => string | DuckDbSqlTextSupplier<Any, Any, Any>;
  readonly encounteredInSQL: (table?: Table) => number | null;
}

export function attachablePostgreSqlEngine<Table extends string = string>(
  init: Omit<
    AttachablePostgreSqlEngine<Table>,
    "isAttachablePostgreSqlEngine" | "from" | "encounteredInSQL"
  >,
) {
  const encounteredInSQL = new Map<Table, { count: number }>();
  const conn = init.pgpassConn;
  const pgEngine: AttachablePostgreSqlEngine<Table> = {
    isAttachablePostgreSqlEngine: true,
    ...init,
    from: (tableName, options) => {
      let eis = encounteredInSQL.get(tableName);
      if (!eis) {
        eis = { count: 1 };
        encounteredInSQL.set(tableName, eis);
      }
      // deno-fmt-ignore
      return `${options?.pushdown ? "postgres_scan_pushdown" : "postgres_scan"}('dbname=${conn.database} user=${conn.username} password=${conn.password} host=${conn.host} port=${String(conn.port)}', '${options?.schema ?? "public"}', '${tableName}')`;
    },
    encounteredInSQL: (table?: Table) => {
      if (table) {
        const found = encounteredInSQL.get(table);
        if (found) return found.count;
        return null;
      }
      if (encounteredInSQL.size == 0) return null;
      let count = 0;
      encounteredInSQL.forEach((value) => {
        count += value.count;
      });
      return count;
    },
  };
  return pgEngine;
}

export type AttachableBackEnds =
  | AttachableSqliteEngine
  | AttachablePostgreSqlEngine<Any>
  | AttachableExcelEngine<Any>;

export interface DuckDbSqlEmitContext<
  SqliteBE extends string,
  PgBE extends string,
  XlsBE extends string,
> extends tmpl.SqlEmitContext {
  readonly contentFsPath: ContentFsPathSupplier;
  readonly sqliteBackends: Map<SqliteBE, AttachableSqliteEngine>;
  readonly postgreSqlBackends: Map<PgBE, AttachablePostgreSqlEngine<Any>>;
  readonly excelBackends: Map<XlsBE, AttachableExcelEngine<Any>>;
  readonly extensions: (options?: {
    readonly emitSqliteASE?: (ase: AttachableSqliteEngine) => boolean;
    readonly emitPostgreSqlASE?: <Table extends string>(
      ase: Map<string, AttachablePostgreSqlEngine<Table>>,
    ) => boolean;
    readonly emitExcelASE?: <SheetName extends string>(
      ase: Map<string, AttachableExcelEngine<SheetName>>,
    ) => boolean;
  }) => DuckDbSqlTextSupplier<Any, Any, Any>[];
}

export type DuckDbSqlTextSupplier<
  SqliteBE extends string,
  PgBE extends string,
  XlsBE extends string,
> = tmpl.SqlTextSupplier<DuckDbSqlEmitContext<SqliteBE, PgBE, XlsBE>>;

export const duckDbSqlEmitContext = <
  SqliteBE extends string,
  PgBE extends string,
  XlsBE extends string,
>(
  contentFsPath: ContentFsPathSupplier,
  inherit?: Omit<
    Partial<DuckDbSqlEmitContext<SqliteBE, PgBE, XlsBE>>,
    "contentFsPath"
  >,
) => {
  const result: DuckDbSqlEmitContext<SqliteBE, PgBE, XlsBE> = {
    ...tmpl.typicalSqlEmitContext(inherit),
    contentFsPath,
    sqliteBackends: inherit?.sqliteBackends ?? new Map(),
    postgreSqlBackends: inherit?.postgreSqlBackends ?? new Map(),
    excelBackends: inherit?.excelBackends ?? new Map(),
    extensions: (options) => {
      const extensions: DuckDbSqlTextSupplier<SqliteBE, PgBE, XlsBE>[] = [];
      const emitSqliteASE = options?.emitSqliteASE;
      result.sqliteBackends.forEach((ase) => {
        if (!emitSqliteASE || emitSqliteASE(ase)) extensions.push(ase);
      });

      if (options?.emitPostgreSqlASE?.(result.postgreSqlBackends)) {
        extensions.push({
          SQL: () => `INSTALL postgres; LOAD postgres;`,
        });
      }

      if (options?.emitExcelASE?.(result.excelBackends)) {
        extensions.push({
          SQL: () => `INSTALL spatial; LOAD spatial;`,
        });
      }
      return extensions;
    },
  };
  return result;
};
