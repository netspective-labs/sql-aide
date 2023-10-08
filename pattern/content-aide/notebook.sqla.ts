import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as m from "./models.sqla.ts";
import mimeTypesDefn from "https://raw.githubusercontent.com/patrickmccallum/mimetype-io/master/src/mimeData.json" with {
  type: "json",
};

export function library<EmitContext extends SQLa.SqlEmitContext>(libOptions: {
  // extensions should be loaded using "behaviors" so `;` terminator is not emitted
  loadExtnSQL: (extn: string) => SQLa.SqlTextBehaviorSupplier<EmitContext>;
}) {
  type SqlTextSupplier = SQLa.SqlTextSupplier<EmitContext>;
  const models = m.models<EmitContext>();
  const { templateState: gts } = models.modelsGovn;

  const pragma = (
    sts: SqlTextSupplier,
  ): SQLa.SqlTextBehaviorSupplier<EmitContext> => ({
    executeSqlBehavior: () => sts,
  });

  // See [SQLite Pragma Cheatsheet for Performance and Consistency](https://cj.rs/blog/sqlite-pragma-cheatsheet-for-performance-and-consistency/)
  const optimalOpenDB: SqlTextSupplier = {
    SQL: (ctx) =>
      ctx.embeddedSQL(gts.ddlOptions)`
        -- make sure all pragmas are silent in case SQL will be piped
        .output /dev/null
        PRAGMA journal_mode = wal; -- different implementation of the atomicity properties
        PRAGMA synchronous = normal; -- synchronise less often to the filesystem
        PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance
        .output stdout`.SQL(ctx),
  };

  const optimalCloseDB: SqlTextSupplier = {
    SQL: () =>
      uws(`
        -- make sure all pragmas are silent in case SQL will be piped
        .output /dev/null
        PRAGMA analysis_limit=400; -- make sure pragma optimize does not take too long
        PRAGMA optimize; -- gather statistics to improve query optimization
        .output stdout`),
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

  const init = () => {
    const newUlid = { SQL: () => "ulid()" }; // can also use ulid_bytes() for higher performance
    const deviceInsertable = {
      device_id: newUlid,
      name: "test",
      ip_address: "127.0.0.1",
      os: "Debian",
    };
    const deviceDML = models.device.insertDML(deviceInsertable);
    const monitorPathDML = models.deviceMonitorPath.insertDML({
      device_monitor_path_id: newUlid,
      device_id: models.device.select({ name: "test" }),
      root_path: "/etc/init.d",
    });
    const mimeTypesDML = mimeTypesDefn.flatMap((mt) =>
      mt.types.map((type) =>
        models.mimeType.insertDML({
          mime_type_id: newUlid,
          name: mt.name,
          file_extn: type,
          description: mt.description.replaceAll("\n", "\\n"),
        })
      )
    );

    // deno-fmt-ignore
    return SQLa.SQL<EmitContext>(gts.ddlOptions)`
        ${pragma(optimalOpenDB)}

        ${libOptions.loadExtnSQL('asg017/ulid/ulid0')}

        ${models.contentTables}

        -- Indexes for optimizing query performance
        CREATE INDEX idx_device__name ON device(name);
        CREATE INDEX idx_fs_walk_session__device_id ON fs_walk_session(device_id);
        CREATE INDEX idx_fs_walk_entry__fs_walk_session_id ON fs_walk_entry(fs_walk_session_id);
        CREATE INDEX idx_fs_content__device_id__content_hash ON fs_content(device_id, content_hash);
        CREATE INDEX idx_fs_walk_entry_file__fs_walk_entry_id ON fs_walk_entry_file(fs_walk_entry_id);
        CREATE INDEX idx_fs_walk_entry_file__fs_content_id ON fs_walk_entry_file(fs_content_id);

        ${mimeTypesDML}

        ${deviceDML}
        ${monitorPathDML}

        ${pragma(optimalCloseDB)}
        `;
  };

  const insertMonitoredContent = (
    options?: { blobs?: boolean },
  ): SqlTextSupplier => ({
    SQL: (ctx) => {
      const { loadExtnSQL: load } = libOptions;
      const blobs = options?.blobs ?? false;
      // deno-fmt-ignore
      return SQLa.SQL<EmitContext>(gts.ddlOptions)`
        ${load("asg017/ulid/ulid0")}
        ${load("nalgeon/fileio/fileio")}
        ${load("nalgeon/crypto/crypto")}
        ${load("asg017/path/path0")}

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
          SELECT *, ${ blobs ? "fileio_read(file_path) AS content," : "" }hex(sha256(fileio_read(file_path))) AS content_hash
            FROM monitored_file;

        -- this first pass will insert all unique content where content_hash, file_size, and file_mtime do not conflict
        INSERT OR IGNORE INTO fs_content (fs_content_id, device_id, content_hash, ${ blobs ? "content," : "" }content_mime_type, file_size, file_mtime, file_mode, file_mode_human)
            SELECT ulid(), device_id, content_hash, ${ blobs ? "content," : "" }content_mime_type, file_size, file_mtime, file_mode, file_mode_human
              FROM monitored_file_content;

        -- this second pass will insert all unique paths where content_hash and file_path do not conflict;
        -- multiple rows pointing to the same content_hash might be created for symlinks
        INSERT OR IGNORE INTO fs_content_path (fs_content_path_id, device_id, content_hash, file_path, file_size, file_mtime, file_mode, file_mode_human)
            SELECT ulid(), device_id, content_hash, file_path, file_size, file_mtime, file_mode, file_mode_human
              FROM monitored_file_content;
      `.SQL(ctx);
    },
  });

  const entries = {
    init,
    optimalOpenDB,
    optimalCloseDB,
    inspect,
    insertMonitoredContent,
  };

  return {
    entries,
    SQL: (
      options: { separators?: true | undefined; dump?: true | undefined },
      ...sqlIdentities: (keyof typeof entries)[]
    ) => {
      const ctx = m.sqlEmitContext<EmitContext>();
      const separators = options?.separators;
      const SQL: string[] = [];
      for (const si of sqlIdentities) {
        if (separators) SQL.push(`-- ${si}\n`);
        if (si in entries) {
          const siEntry = entries[si];
          const siSQL = typeof siEntry === "function" ? siEntry() : siEntry;
          SQL.push(siSQL.SQL(ctx));
        } else {
          SQL.push(`-- notebook entry '${si}' not found`);
        }
      }
      if (options.dump) SQL.push(`.dump`);
      return SQL;
    },
  };
}
