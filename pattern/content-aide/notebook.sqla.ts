import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as m from "./models.sqla.ts";

export function notebook<EmitContext extends SQLa.SqlEmitContext>(options: {
  // extensions should be loaded using "behaviors" so `;` terminator is not emitted
  loadExtnSQL: (extn: string) => SQLa.SqlTextBehaviorSupplier<EmitContext>;
}) {
  type SqlTextSupplier = SQLa.SqlTextSupplier<EmitContext>;
  const { templateState: gts } = m.governance<EmitContext>();
  const { loadExtnSQL } = options;

  // See [SQLite Pragma Cheatsheet for Performance and Consistency](https://cj.rs/blog/sqlite-pragma-cheatsheet-for-performance-and-consistency/)
  const optimalOpenDB: SqlTextSupplier = {
    SQL: () =>
      uws(`
      PRAGMA journal_mode = wal; -- different implementation of the atomicity properties
      PRAGMA synchronous = normal; -- synchronise less often to the filesystem
      PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance`),
  };

  const optimalCloseDB: SqlTextSupplier = {
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
  const inspect: SqlTextSupplier = {
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

  const insertMonitoredContent: SqlTextSupplier = {
    SQL: (ctx) => {
      return SQLa.SQL<EmitContext>(gts.ddlOptions)`
        ${loadExtnSQL("asg017/ulid/ulid0")}
        ${loadExtnSQL("nalgeon/fileio/fileio")}
        ${loadExtnSQL("nalgeon/crypto/crypto")}
        ${loadExtnSQL("asg017/path/path0")}

        -- using TEMP VIEW since 'fileio_ls' doesn't work in VIEW
        DROP VIEW IF EXISTS monitored_file;
        CREATE TEMP VIEW monitored_file AS
          SELECT device_id,
                root_path,
                name AS file_path,
                path_extension(name) as file_extn,
                (select name from mime_type where file_extn = path_extension(name)) as content_mime_type,
                mtime as file_mtime,
                size as file_size,
                mode as file_mode,
                fileio_mode(mode) as file_mode_human
            FROM (SELECT device_id, root_path FROM device_monitor_path),
                fileio_ls(root_path, true) -- true indicates recursive listing
          WHERE file_mode_human like '-%'; -- only files, not directories

        DROP VIEW IF EXISTS monitored_file_content;
        CREATE TEMP VIEW monitored_file_content AS
          SELECT *, fileio_read(file_path) AS content, hex(sha256(fileio_read(file_path))) AS content_hash
            FROM monitored_file;

        -- this first pass will insert all unique content where content_hash, file_size, and file_mtime do not conflict
        INSERT OR IGNORE INTO fs_content (fs_content_id, device_id, content_hash, content, content_mime_type, file_size, file_mtime, file_mode, file_mode_human)
            SELECT ulid(), device_id, content_hash, content, content_mime_type, file_size, file_mtime, file_mode, file_mode_human
              FROM monitored_file_content;

        -- this second pass will insert all unique paths where content_hash and file_path do not conflict;
        -- multiple rows pointing to the same content_hash might be created for symlinks
        INSERT OR IGNORE INTO fs_content_path (fs_content_path_id, device_id, content_hash, file_path, file_size, file_mtime, file_mode, file_mode_human)
            SELECT ulid(), device_id, content_hash, file_path, file_size, file_mtime, file_mode, file_mode_human
              FROM monitored_file_content;
      `.SQL(ctx);
    },
  };

  return {
    optimalOpenDB,
    optimalCloseDB,
    inspect,
    insertMonitoredContent,
  };
}
