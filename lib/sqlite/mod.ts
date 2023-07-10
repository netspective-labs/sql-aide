import { unindentWhitespace as uws } from "../universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";

export const ctx = SQLa.typicalSqlEmitContext({
  sqlDialect: SQLa.sqliteDialect(),
});
export type EmitContext = typeof ctx;
export type SqlTextSupplier = SQLa.SqlTextSupplier<EmitContext>;

// See [SQLite Pragma Cheatsheet for Performance and Consistency](https://cj.rs/blog/sqlite-pragma-cheatsheet-for-performance-and-consistency/)
export const optimalOpenDB: SqlTextSupplier = {
  SQL: () =>
    uws(`
      PRAGMA journal_mode = wal; -- different implementation of the atomicity properties
      PRAGMA synchronous = normal; -- synchronise less often to the filesystem
      PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance`),
};

export const optimalCloseDB: SqlTextSupplier = {
  SQL: () =>
    uws(`
      PRAGMA analysis_limit=400; -- make sure pragma optimize does not take too long
      PRAGMA optimize; -- gather statistics to improve query optimization`),
};

/*
 * This SQL statement retrieves column information for tables in an SQLite database
 * including table name, column ID, column name, data type, nullability, default
 * value, and primary key status.
 * It filters only tables from the result set. It is commonly used for analyzing
 * and documenting database schemas.
 * NOTE: pragma_table_info(m.tbl_name) will only work when m.type is 'table'
 */
export const inspect: SqlTextSupplier = {
  SQL: () =>
    uws(`
      SELECT
          tbl_name AS table_name,
          c.cid AS column_id,
          c.name AS column_name,
          c."type" AS "type",
          c."notnull" AS "notnull",
          c.dflt_value as "default_value",
          c.pk AS primary_key
      FROM
          sqlite_master m,
          pragma_table_info(m.tbl_name) c
      WHERE
          m.type = 'table';`),
};

export const sqlLibrary = { optimalOpenDB, optimalCloseDB, inspect } as const;
export type SqlIdentity = keyof typeof sqlLibrary;
