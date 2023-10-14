import { frontmatter as fm } from "./deps.ts";
import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as ft from "../../lib/universal/flexible-text.ts";
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
 * We go to great lengths to allow SQL to be independently executed because we
 * don't always know the final use cases and we try to use the SQLite CLI whenever
 * possible because performance is best that way.
 *
 * Because SQL is a declarative and TypeScript is imperative langauage, use each
 * for their respective strengths. Use TypeScript to generate type-safe SQL and
 * let the database do as much work as well.
 * - Capture all state, valid content, invalid content, and other data in the
 *   database so that we can run queries for observability; if everything is in
 *   the database, including error messages, warnings, etc. we can always run
 *   queries and not have to store logs in separate system.
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
  loadExtnSQL: (extn: string) => SQLa.SqlTextBehaviorSupplier<EmitContext>;
  execDbQueryResult: <Shape>(
    sqlSupplier: ft.FlexibleTextSupplierSync,
    sqliteDb?: string,
  ) => Promise<Shape[] | undefined>;
}) {
  type SqlTextSupplier = SQLa.SqlTextSupplier<EmitContext>;
  const models = m.models<EmitContext>();
  const content = c.content<EmitContext>();
  const { templateState: gts } = models.modelsGovn;

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

  /**
   * Accepts an object shape and turns each property name into a SQLite param
   * and the property value into the param value. SQLite can use SQL expressions
   * or literals as values so this function supports both.
   * @param shape the variables and the values that should become bindable parameters
   * @returns a SqlTextBehaviorSupplier that can be used in SQL DDL / DML
   */
  const sqliteParametersPragma = <
    Shape extends Record<string, Any>,
  >(shape: Shape) => {
    const stbs: SQLa.SqlTextBehaviorSupplier<EmitContext> = {
      executeSqlBehavior: () => {
        return {
          SQL: (ctx) => {
            const eo = ctx.sqlTextEmitOptions;
            const params: string[] = [];
            // deno-fmt-ignore
            Object.entries(shape).forEach(([paramName, recordValueRaw]) => {
              if (SQLa.isSqlTextSupplier(recordValueRaw)) {
                params.push(`.parameter set :${paramName} "${recordValueRaw.SQL(ctx).replaceAll('"', '\\"')}"`); // a SQL expression
              } else {
                const ql = eo.quotedLiteral(recordValueRaw);
                // we do replaceAll('\\', '\\\\') because SQLite parameters use \ for their own escape and so does JS :-/
                params.push(`.parameter set :${paramName} ${ql[0] == ql[1] ? ql[1] : `"${ql[1].replaceAll('\\', '\\\\')}"`}`);
              }
            });
            return params.join("\n");
          },
        };
      },
    };
    return { ...stbs, shape };
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
        CREATE INDEX idx_fs_content__walk_session_id__file_path ON fs_content(walk_session_id, file_path);

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

  const insertContent = (
    options?: {
      deviceName?: string;
      deviceBoundary?: string;
      paths?: string[];
      ignorePathsRegEx?: string;
      blobsRegEx?: string;
      digestsRegEx?: string;
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

    // for all regular expressions we use ags017/regex Rust extension so
    // test with https://regex101.com/ ("Rust" flavor, remove \\ and use \ for tests)

    const paths = options?.paths ?? [Deno.cwd()];
    const blobsRegEx = options?.blobsRegEx ?? "\\.(md|mdx|html)$";
    const digestsRegEx = options?.digestsRegEx ?? ".*";
    const ignorePathsRegEx = options?.ignorePathsRegEx ??
      "/(\\.git|node_modules)/";
    const maxFileIoReadBytes = options?.maxFileIoReadBytes ?? 1000000000;

    // setup the SQL bind parameters that will be used in this block;
    // object property values will be available as :device_id, etc.
    const bindParams = sqliteParametersPragma({
      max_fileio_read_bytes: maxFileIoReadBytes,
      ignore_paths_regex: ignorePathsRegEx,
      blobs_regex: blobsRegEx,
      digests_regex: digestsRegEx,
    });

    // use abbreviations for easier to read templating
    const {
      fsContentWalkSession: fscws,
      fsContentWalkPath: fscwp,
      // fsContent: fsc,
    } = models;

    return {
      SQL: (ctx) => {
        const { loadExtnSQL: load } = libOptions;

        // get column names for easier to read templating
        //
        const { defineBind: d_defb, useBind: d_useb } = models.device
          .columnNames(
            ctx,
          );
        const { symbol: fscws_c, defineBind: fscws_defb, useBind: fscws_useb } =
          fscws.columnNames(ctx);
        // const { stsb: fscwpb } = fscwp.columnNames(ctx);
        // const { stsb: fscb } = fsc.columnNames(ctx);

        // deno-fmt-ignore
        return SQL()`
        ${load("asg017/ulid/ulid0")}
        ${load("nalgeon/fileio/fileio")}
        ${load("nalgeon/crypto/crypto")}
        ${load("asg017/path/path0")}
        ${load("asg017/regex/regex0")}

        ${activeDeviceDML}

        ${bindParams}
        ${models.sqliteParameters.insertDML({ key: d_defb.device_id, value: models.device.select({ name: deviceName, boundary: deviceBoundary }) })}

        ${models.fsContentWalkSession.insertDML({
          fs_content_walk_session_id: sqlEngineNewUlid,
          device_id: d_useb.device_id,
          walk_started_at: { SQL: () => `CURRENT_TIMESTAMP` },
          max_fileio_read_bytes: { SQL: () => `:max_fileio_read_bytes` },
          blobs_regex: { SQL: () => `:blobs_regex` },
          digests_regex: { SQL: () => `:digests_regex` },
          ignore_paths_regex: { SQL: () => `:ignore_paths_regex` },
        })}
        ${models.sqliteParameters.insertDML({ key: fscws_defb.fs_content_walk_session_id, value: { SQL: () => `SELECT fs_content_walk_session_id FROM fs_content_walk_session ORDER BY created_at DESC LIMIT 1` } })}

        ${models.fsContentWalkPath.insertDML(paths.map((root_path) => ({
          fs_content_walk_path_id: sqlEngineNewUlid,
          walk_session_id: fscws_useb.fs_content_walk_session_id,
          root_path })))}

        -- if something's not working, use '.parameter list' to see the bind parameters from SQL
        -- .parameter list

        -- inserts all unique content where file_path, file_bytes, and file_mtime do not conflict;
        -- we use nalgeon/fileio extension to read directories and asg017/path to compute paths
        INSERT OR IGNORE INTO fs_content (fs_content_id, walk_session_id, walk_path_id, file_path, file_extn, file_bytes, file_mtime, file_mode, file_mode_human, content, content_digest)
          SELECT ulid() as fs_content_id,
                 walk_session_id,
                 fs_content_walk_path_id,
                 name AS file_path,
                 path_extension(name) as file_extn,
                 size as file_bytes,
                 mtime as file_mtime,
                 mode as file_mode,
                 fileio_mode(mode) as file_mode_human,
                 CASE WHEN regex_find(:blobs_regex, name) IS NOT NULL AND size < :max_fileio_read_bytes THEN fileio_read(name) ELSE NULL END AS content,
                 CASE WHEN regex_find(:digests_regex, name) IS NOT NULL AND size < :max_fileio_read_bytes THEN hex(sha256(fileio_read(name))) ELSE NULL END AS content_digest
            FROM ${fscwp.tableName},
                 fileio_ls(root_path, true) as ls -- true indicates recursive listing
           WHERE walk_session_id = :fs_content_walk_session_id
             AND (file_mode_human like '-%' or file_mode_human like 'l%') -- only files or symlinks, not directories
             AND regex_find(:ignore_paths_regex, name) IS NULL;

        UPDATE ${fscws.tableName} SET ${fscws_c.walk_finished_at} = CURRENT_TIMESTAMP WHERE ${fscws_c.fs_content_walk_session_id} = ${fscws_useb.fs_content_walk_session_id};
      `.SQL(ctx);
      },
    };
  };

  const postProcessFsContent = async (
    options?: {
      readonly ctx?: EmitContext;
      readonly potentialFmFilesRegEx?: string;
    },
  ): Promise<SqlTextSupplier | undefined> => {
    const potentialFmFilesRegEx = options?.potentialFmFilesRegEx ??
      "\\.(md|mdx)$";

    const { loadExtnSQL: load } = libOptions;
    const unparsedFM = await libOptions.execDbQueryResult<
      { fs_content_id: string; content: string }
    >(SQL()`
      ${load("asg017/regex/regex0")}

      SELECT fs_content_id, content
        FROM fs_content
      WHERE regex_find('${potentialFmFilesRegEx}', file_path) IS NOT NULL
        AND content IS NOT NULL
        AND content_fm_body_attrs IS NULL
        AND frontmatter IS NULL;`.SQL(options?.ctx ?? m.sqlEmitContext()));

    if (unparsedFM) {
      return {
        SQL: (ctx) => {
          const { quotedLiteral } = ctx.sqlTextEmitOptions;
          const updatedFM: string[] = [];
          for (const ufm of unparsedFM) {
            if (fm.test(ufm.content)) {
              const parsedFM = fm.extract(ufm.content);
              // deno-fmt-ignore
              updatedFM.push(`UPDATE fs_content SET frontmatter = ${quotedLiteral(JSON.stringify(parsedFM.attrs))[1]}, content_fm_body_attrs = ${quotedLiteral(JSON.stringify(parsedFM))[1]} where fs_content_id = '${ufm.fs_content_id}';`);
            }
          }
          // deno-fmt-ignore
          return updatedFM.join("\n");
        },
      };
    }
    return undefined;
  };

  const contentStats = (): SqlTextSupplier => ({
    SQL: (ctx) => {
      // deno-fmt-ignore
      return SQL()`
        WITH TimeDifferences AS (
            SELECT
                file_extn,
                file_bytes,
                CASE WHEN frontmatter IS NOT NULL THEN 1 ELSE 0 END AS frontmatter,
                julianday('now') - julianday(datetime(file_mtime, 'unixepoch')) AS file_age
            FROM fs_content
        ),
        FormattedTimes AS (
            SELECT
                file_extn,
                file_bytes,
                frontmatter,
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
            SUM(frontmatter) AS with_frontmatter,
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
          SELECT content, content_digest FROM fs_content WHERE file_extn = '.html'
        ),
        html AS (
          SELECT content_digest,
                 text as label,
                 html_attribute_get(html, 'a', 'href') as href
            FROM html_content, html_each(html_content.content, 'a')
        ),
        file as (
          SELECT fs_content_path_id, file_path, label, href
            FROM fs_content_path, html
           WHERE fs_content_path.content_digest = html.content_digest
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
    insertContent,
    contentStats,
    allHtmlAnchors,
  };

  return {
    entries,
    postProcessFsContent, // this one is special
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
