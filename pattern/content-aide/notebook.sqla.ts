import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as m from "./models.sqla.ts";
import * as c from "./content.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * Our SQL "notebook" is a library function which is responsible to pulling
 * together all SQL we use. It's important to note we do not prefer to use ORMs
 * that hide SQL and instead use stateless SQL generators like SQLa to produce
 * all SQL through type-safe TypeScript functions.
 *
 * Because SQL is a declarative and TypeScript is imperative langauage, use each
 * for their respective strengths. Use TypeScript to generate type-safe SQL and
 * let the database do as much work as well.
 * - Instead of imperatively creating thousands of SQL statements, let the SQL
 *   engine use CTEs and other capabilities to do as much declarative work in
 *   the engine as possible.
 * - Instead of copy/pasting SQL into multiple SQL statements, modularize the
 *   SQL in TypeScript functions and build statements using template literal
 *   strings (`xyz${abc}`).
 * - Wrap SQL into TypeScript as much as possible so that SQL statements can be
 *   pulled in from URLs.
 * - If we're importing JSON, CSV, or other files pull them in via
 *   `import .. from "xyz" with { type: "json" }` and similar imports in case
 *   the SQL engine cannot do the imports directly from URLs (e.g. DuckDB can
 *   import HTTP directly and should do so, SQLite can pull from URLs too with
 *   the http0 extension).
 * - Whenever possible make SQL stateful functions like DDL, DML, etc. idempotent
 *   either by using `ON CONFLICT DO NOTHING` or when a conflict occurs put the
 *   errors or warnings into a table that the application should query.
 *
 * @param libOptions
 * @returns
 */
export function library<EmitContext extends SQLa.SqlEmitContext>(libOptions: {
  // extensions should be loaded using "behaviors" so `;` terminator is not emitted
  loadExtnSQL: (extn: string) => SQLa.SqlTextBehaviorSupplier<EmitContext>;
}) {
  type SqlTextSupplier = SQLa.SqlTextSupplier<EmitContext>;
  const models = m.models<EmitContext>();
  const content = c.content<EmitContext>();
  const { model: gm, domains: gd, templateState: gts, model: { tcFactory } } =
    models.modelsGovn;

  // type-safe wrapper for all SQL text generated in this library;
  // we call it `SQL` so that VS code extensions like frigus02.vscode-sql-tagged-template-literals
  // properly syntax-highlight code inside SQL`xyz` strings.
  const SQL = () => SQLa.SQL<EmitContext>(gts.ddlOptions);

  const sqlEngineNewUlid: SqlTextSupplier = { SQL: () => `ulid()` };
  const onConflictDoNothing: SqlTextSupplier = {
    SQL: () => `ON CONFLICT DO NOTHING`,
  };

  // type-safe wrapper for all SQLite pragma statements because they should not
  // be treated as SQL statements (that's why we use SqlTextBehaviorSupplier)
  const pragma = (
    sts: SqlTextSupplier,
  ): SQLa.SqlTextBehaviorSupplier<EmitContext> => ({
    executeSqlBehavior: () => sts,
  });

  // TODO: move this into SQLa as a reusable function across all projects;
  // when you want to store "variables" (what we call "session state") so that
  // multiple queries can share
  const tempTableDDL = <
    Identifier extends string,
    Shape extends Record<string, Any>,
  >(identifier: Identifier, shape: Shape) => {
    const SQL: SqlTextSupplier = {
      SQL: (ctx) => {
        const eo = ctx.sqlTextEmitOptions;
        const state = Object.entries(shape).map(([colName, recordValueRaw]) => {
          let value: [
            value: unknown,
            valueSqlText: string,
          ] | undefined;
          if (SQLa.isSqlTextSupplier(recordValueRaw)) {
            value = [
              recordValueRaw,
              `(${recordValueRaw.SQL(ctx)})`, // e.g. `(SELECT x from y) as SQL expr`
            ];
          } else {
            value = eo.quotedLiteral(recordValueRaw);
          }
          return [colName, value[1]];
        });

        // deno-fmt-ignore
        return uws(`
          CREATE TEMP TABLE ${identifier} AS
            SELECT ${state.map(([key, value]) => `${value} AS ${key}`).join(",\n              ")}`);
      },
    };
    return {
      ...SQL,
      identifier,
      shape,
    };
  };

  // TODO: move this into SQLa as a reusable function across all projects;
  // COALESCE(activity_log, '[]'): This checks if activity_log is NULL and if it is, it defaults to an empty JSON array '[]'.
  // json_insert() with the '$[' || json_array_length(...) || ']' path: This appends a new entry at the end of the JSON array in activity_log.
  // usage:
  //       UPDATE mime_type SET
  //         name = 'application/typescript',
  //         updated_at = CURRENT_TIMESTAMP,
  //         activity_log = ${activityLogContent(models.mimeType.zoSchema.shape)}
  //       WHERE file_extn = '.ts' and name != 'application/typescript'
  //       AND (SELECT COUNT(*) FROM mime_type WHERE name = 'application/typescript' AND file_extn = '.ts') = 0;;
  const _activityLogContent = <Shape extends Record<string, Any>>(
    shape: Shape,
    alColumnName = "activity_log",
  ) => {
    return uws(`json_insert(
      COALESCE(${alColumnName}, '[]'),
      '$[' || json_array_length(COALESCE(${alColumnName}, '[]')) || ']',
      json_object(${
      Object.keys(shape).map((column) => `'${column}', ${column}`).join(", ")
    }))`);
  };

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

  const mimeTypesSeedDML = () => {
    const { loadExtnSQL: load } = libOptions;
    return SQL()`
      ${load("asg017/ulid/ulid0")}
      ${load("asg017/http/http0")}

      -- This source: 'https://raw.githubusercontent.com/patrickmccallum/mimetype-io/master/src/mimeData.json'
      -- has the given JSON structure:
      -- [
      --   {
      --     "name": <MimeTypeName>,
      --     "description": <Description>,
      --     "types": [<Extension1>, <Extension2>, ...],
      --     "alternatives": [<Alternative1>, <Alternative2>, ...]
      --   },
      --   ...
      -- ]
      -- The goal of the SQL query is to flatten this structure into rows where each row will
      -- represent a single MIME type and one of its associated file extensions (from the 'types' array).
      -- The output will look like:
      -- | name             | description  | type         | alternatives        |
      -- |------------------|--------------|--------------|---------------------|
      -- | <MimeTypeName>   | <Description>| <Extension1> | <AlternativesArray> |
      -- | <MimeTypeName>   | <Description>| <Extension2> | <AlternativesArray> |
      -- ... and so on for all MIME types and all extensions.
      --
      -- we take all those JSON array entries and insert them into our MIME Types table
      INSERT or IGNORE INTO mime_type (mime_type_id, name, description, file_extn)
        SELECT ulid(),
               resource.value ->> '$.name' as name,
               resource.value ->> '$.description' as description,
               file_extns.value as file_extn
          FROM json_each(http_get_body('https://raw.githubusercontent.com/patrickmccallum/mimetype-io/master/src/mimeData.json')) as resource,
               json_each(resource.value, '$.types') AS file_extns;

      ${
      models.mimeType.insertDML({
        mime_type_id: sqlEngineNewUlid,
        name: "application/typescript",
        file_extn: ".ts",
        description: "Typescript source",
      }, { onConflict: onConflictDoNothing })
    }`;
  };

  const init = () => {
    // deno-fmt-ignore
    return SQL()`
        ${pragma(optimalOpenDB)}

        ${libOptions.loadExtnSQL('asg017/ulid/ulid0')}

        ${models.contentTables}

        -- Indexes for optimizing query performance
        -- TODO: have SQLa generate these from tables
        CREATE INDEX idx_mime_type__file_extn ON mime_type(file_extn);
        CREATE INDEX idx_device__name ON device(name);
        CREATE INDEX idx_fs_walk_session__device_id ON fs_walk_session(device_id);
        CREATE INDEX idx_fs_walk_entry__fs_walk_session_id ON fs_walk_entry(fs_walk_session_id);
        CREATE INDEX idx_fs_content__device_id__content_hash ON fs_content(device_id, content_hash);
        CREATE INDEX idx_fs_walk_entry_file__fs_walk_entry_id ON fs_walk_entry_file(fs_walk_entry_id);
        CREATE INDEX idx_fs_walk_entry_file__fs_content_id ON fs_walk_entry_file(fs_content_id);

        /**
         * This view combines the results of the four detection methods (creation,
         * deletion, renaming, and moving) into a unified dataset. You can then query
         * this view to get a comprehensive list of file operations across all sessions.
         * When you run a SELECT against this view, you'll get a list of operations
         * detailing how files have changed from one session to another.
         */
         DROP VIEW IF EXISTS fs_operations;
         CREATE VIEW fs_operations AS
            -- Detect Created Files
              SELECT 'created' AS operation, new.session_id, NULL AS old_path, new.path AS new_path
              FROM fs_walk_entry AS new
              LEFT JOIN fs_walk_entry AS old ON new.path = old.path WHERE old.path IS NULL
            UNION ALL
              -- Detect Deleted Files
              SELECT 'deleted' AS operation, old.session_id, old.path AS old_path, NULL AS new_path
              FROM fs_walk_entry AS old
              LEFT JOIN fs_walk_entry AS new ON old.path = new.path WHERE new.path IS NULL
            UNION ALL
              -- Detect Renamed Files
              SELECT 'renamed' AS operation, new.session_id, old.path AS old_path, new.path AS new_path
              FROM fs_walk_entry AS old
              JOIN fs_walk_entry AS new ON old.rel_path = new.rel_path AND old.entry_name != new.entry_name
            UNION ALL
              -- Detect Moved Files
              SELECT 'moved' AS operation, new.session_id, old.path AS old_path, new.path AS new_path
              FROM fs_walk_entry AS old
              JOIN fs_walk_entry AS new ON old.entry_name = new.entry_name AND old.rel_path != new.rel_path;

        ${pragma(optimalCloseDB)}
        `;
  };

  const deviceDML = async (
    device?: Awaited<ReturnType<typeof content.device>>,
  ) => {
    if (!device) device = await content.device();
    return SQL()`
      ${libOptions.loadExtnSQL("asg017/ulid/ulid0")}
      ${models.device.insertDML(device)}
    `;
  };

  const insertMonitoredContent = (
    options?: {
      deviceName?: string;
      deviceBoundary?: string;
      paths?: string[];
      blobs?: boolean;
      maxFileIoReadBytes?: number;
    },
  ): SqlTextSupplier => {
    const device = content.activeDevice();
    const deviceName = options?.deviceName ?? device.name;
    const deviceBoundary = options?.deviceBoundary ?? device.boundary;

    // we use ON CONFLICT DO NOTHING in case this device is already defined
    const activeDeviceDML = models.device.insertDML({
      device_id: sqlEngineNewUlid,
      name: deviceName,
      boundary: deviceBoundary,
    }, { onConflict: onConflictDoNothing });

    const paths = options?.paths ?? [Deno.cwd()];
    const blobs = options?.blobs ?? false;
    const maxFileIoReadBytes = options?.maxFileIoReadBytes ?? 1000000000;

    const sessionState = tempTableDDL("session_state", {
      device_id: models.device.select({
        name: deviceName,
        boundary: deviceBoundary,
      }),
      walk_session_id: sqlEngineNewUlid,
      max_filio_read_bytes: maxFileIoReadBytes,
    });

    const activeWalk = gm.table(
      "active_walk",
      { root_path: tcFactory.unique(gd.text()) },
      { isTemp: true, isIdempotent: false },
    );
    const activeWalkDML = activeWalk.insertDML(paths.map((root_path) => ({
      root_path,
    })));

    return {
      SQL: (ctx) => {
        const { loadExtnSQL: load } = libOptions;
        // deno-fmt-ignore
        return SQL()`
        ${load("asg017/ulid/ulid0")}
        ${load("nalgeon/fileio/fileio")}
        ${load("nalgeon/crypto/crypto")}
        ${load("asg017/path/path0")}

        ${activeDeviceDML}

        ${sessionState}

        ${activeWalk}
        ${activeWalkDML}

        -- TODO: add ignore directives (e.g. .git) and "globbing"
        -- using TEMP VIEW since 'fileio_ls' doesn't work in VIEW
        DROP VIEW IF EXISTS monitored_file;
        CREATE TEMP VIEW monitored_file AS
          SELECT (select device_id from ${sessionState.identifier}) as device_id,
                 root_path,
                 name AS file_path,
                 path_extension(name) as file_extn,
                 mtime as file_mtime,
                 size as file_bytes,
                 mode as file_mode,
                 fileio_mode(mode) as file_mode_human
            FROM (SELECT root_path FROM active_walk),
                 fileio_ls(root_path, true) as ls -- true indicates recursive listing
           WHERE file_mode_human like '-%' or file_mode_human like 'l%'; -- only files, not directories

        DROP VIEW IF EXISTS monitored_file_content;
        CREATE TEMP VIEW monitored_file_content AS
          SELECT *, ${ blobs ? "fileio_read(file_path) AS content, " : "" }hex(sha256(fileio_read(file_path)) AS content_hash
            FROM monitored_file;

        -- this first pass will insert all unique content where content_hash, file_bytes, file_mtime do not conflict
        INSERT OR IGNORE INTO fs_content (fs_content_id, device_id, file_path, content_hash, ${ blobs ? "content, " : "" }file_path, file_extn, file_bytes, file_mtime, file_mode, file_mode_human)
            SELECT ulid(), device_id, file_path, content_hash, ${ blobs ? "content, " : "" }file_path, file_extn, file_bytes, file_mtime, file_mode, file_mode_human
              FROM monitored_file_content;
      `.SQL(ctx);
      },
    };
  };

  const contentStats = (): SqlTextSupplier => ({
    SQL: (ctx) => {
      // deno-fmt-ignore
      return SQL()`
        WITH TimeDifferences AS (
            SELECT
                file_extn,
                file_bytes,
                julianday('now') - julianday(datetime(file_mtime, 'unixepoch')) AS file_age
            FROM fs_content
        ),
        FormattedTimes AS (
            SELECT
                file_extn,
                file_bytes,
                CASE
                    WHEN file_age < 1/24 THEN
                        CAST(ROUND(1440 * file_age) AS INTEGER) || ' minutes'
                    WHEN file_age < 1 THEN
                        CAST(ROUND(24 * file_age) AS INTEGER) || ' hours'
                    ELSE
                        CAST(file_age AS INTEGER) || ' days'
                END AS formatted_time
            FROM TimeDifferences
        )
        SELECT
            file_extn,
            COUNT(*) AS total_count,
            CAST(ROUND(AVG(file_bytes)) AS INTEGER) AS average_size,
            MAX(formatted_time) AS oldest,
            MIN(formatted_time) AS youngest
        FROM FormattedTimes
        GROUP BY file_extn;
      `.SQL(ctx);
    },
  });

  const allHtmlAnchors = (): SqlTextSupplier => ({
    SQL: (ctx) => {
      const { loadExtnSQL: load } = libOptions;
      // deno-fmt-ignore
      return SQL()`
        ${load("asg017/html/html0")}

        -- find all HTML files in the fs_content table and return
        -- each file and the anchors' labels and hrefs in that file
        WITH html_content AS (
          SELECT content, content_hash FROM fs_content WHERE file_extn = '.html'
        ),
        html AS (
          SELECT content_hash,
                 text as label,
                 html_attribute_get(html, 'a', 'href') as href
            FROM html_content, html_each(html_content.content, 'a')
        ),
        file as (
          SELECT fs_content_path_id, file_path, label, href
            FROM fs_content_path, html
           WHERE fs_content_path.content_hash = html.content_hash
        )
        SELECT * FROM file;
      `.SQL(ctx);
    },
  });

  const entries = {
    init,
    optimalOpenDB,
    optimalCloseDB,
    inspect,
    deviceDML,
    mimeTypesSeedDML,
    insertMonitoredContent,
    contentStats,
    allHtmlAnchors,
  };

  return {
    entries,
    SQL: async (
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
          const siSQL = typeof siEntry === "function"
            ? await siEntry()
            : siEntry;
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
