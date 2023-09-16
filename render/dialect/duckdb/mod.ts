import * as pgpass from "../../../lib/postgres/pgpass/pgpass-parse.ts";
import * as ws from "../../../lib/universal/whitespace.ts";
import * as tmpl from "../../emit/mod.ts";

export type ContentProvenance = { identity: string };

export type ContentFsPathSupplier = (provenance: ContentProvenance) => string;

export interface AttachableStorageEngine {
  readonly identifier: string;
}

export interface AttachableSqliteEngine
  extends AttachableStorageEngine, DuckDbSqlTextSupplier {
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

export interface AttachableExcelEngine extends AttachableStorageEngine {
  readonly isAttachableExcelEngine: true;
  readonly from: (sheetName: string) => string;
}

export function attachableExcelEngine(
  init: Omit<
    AttachableExcelEngine,
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
  const xlsEngine: AttachableExcelEngine = {
    isAttachableExcelEngine: true,
    ...init,
    from: (sheetName) => {
      const excelFileName = init.identifier;
      const key = `${excelFileName}:::${sheetName}`;
      let eis = encounteredInSQL.get(key);
      if (!eis) {
        eis = { excelFileName, sheetName, count: 1 };
        encounteredInSQL.set(key, eis);
      } else {
        eis.count++;
      }
      // deno-fmt-ignore
      return `st_read('${excelFileName}', layer='${sheetName}')`;
    },
  };
  return xlsEngine;
}

export interface AttachablePostgreSqlEngine extends AttachableStorageEngine {
  readonly isAttachablePostgreSqlEngine: true;
  readonly pgpassConn: pgpass.Connection;
  readonly from: (
    tableName: string,
    options?: { schema?: string; pushdown?: boolean },
  ) => string;
  readonly encounteredInSQL: (table?: string) => number | null;
}

export function attachablePostgreSqlEngine(
  init: Omit<
    AttachablePostgreSqlEngine,
    "isAttachablePostgreSqlEngine" | "from" | "encounteredInSQL"
  >,
) {
  const encounteredInSQL = new Map<string, { count: number }>();
  const conn = init.pgpassConn;
  const pgEngine: AttachablePostgreSqlEngine = {
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
    encounteredInSQL: (table?: string) => {
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
  | AttachablePostgreSqlEngine
  | AttachableExcelEngine;

export type AttachedBackEnds = Map<string, AttachableBackEnds>;

export interface DuckDbSqlEmitContext extends tmpl.SqlEmitContext {
  readonly contentFsPath: ContentFsPathSupplier;
  readonly sqliteBackends: Map<string, AttachableSqliteEngine>;
  readonly postgreSqlBackends: Map<string, AttachablePostgreSqlEngine>;
  readonly excelBackends: Map<string, AttachableExcelEngine>;
  readonly extensions: (options?: {
    readonly emitSqliteASE?: (ase: AttachableSqliteEngine) => boolean;
    readonly emitPostgreSqlASE?: (
      ase: Map<string, AttachablePostgreSqlEngine>,
    ) => boolean;
    readonly emitExcelASE?: (
      ase: Map<string, AttachableExcelEngine>,
    ) => boolean;
  }) => DuckDbSqlTextSupplier[];
}

export type DuckDbSqlTextSupplier = tmpl.SqlTextSupplier<DuckDbSqlEmitContext>;

export const duckDbSqlEmitContext = (
  contentFsPath: ContentFsPathSupplier,
  inherit?: Omit<Partial<DuckDbSqlEmitContext>, "contentFsPath">,
) => {
  const result: DuckDbSqlEmitContext = {
    ...tmpl.typicalSqlEmitContext(inherit),
    contentFsPath,
    sqliteBackends: inherit?.sqliteBackends ?? new Map(),
    postgreSqlBackends: inherit?.postgreSqlBackends ?? new Map(),
    excelBackends: inherit?.excelBackends ?? new Map(),
    extensions: (options) => {
      const extensions: DuckDbSqlTextSupplier[] = [];
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
