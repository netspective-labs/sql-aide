import * as ft from "../../lib/universal/flexible-text.ts";
import * as SQLa from "../../render/mod.ts";
import * as m from "./models.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

// Reminders:
// - when sending arbitrary text to the SQL stream, use SqlTextBehaviorSupplier
// - when sending SQL statements (which need to be ; terminated) use SqlTextSupplier

export const noSqliteExtnLoader: (
  extn: string,
) => SQLa.SqlTextBehaviorSupplier<Any> = (extn: string) => ({
  executeSqlBehavior: () => ({
    SQL: () => `-- loadExtnSQL not provided to load '${extn}'`,
  }),
});

export class NotebookHelpers<
  EmitContext extends SQLa.SqlEmitContext = SQLa.SqlEmitContext,
> extends SQLa.SqlNotebook<EmitContext> {
  readonly models: ReturnType<typeof m.serviceModels<EmitContext>>;
  readonly loadExtnSQL: (
    extn: string,
  ) => SQLa.SqlTextBehaviorSupplier<EmitContext>;
  readonly stsOptions: SQLa.SqlTextSupplierOptions<EmitContext>;
  readonly execDbQueryResult: <Shape>(
    sqlSupplier: ft.FlexibleTextSupplierSync,
    sqliteDb?: string,
  ) => Promise<Shape[] | undefined>;
  readonly templateState: ReturnType<
    typeof m.serviceModels<EmitContext>
  >["universal"]["modelsGovn"]["templateState"];

  constructor(
    readonly options?: {
      readonly loadExtnSQL?: (
        extn: string,
      ) => SQLa.SqlTextBehaviorSupplier<EmitContext>;
      readonly models?: ReturnType<typeof m.serviceModels<EmitContext>>;
      readonly stsOptions?: SQLa.SqlTextSupplierOptions<EmitContext>;
      readonly execDbQueryResult?: <Shape>(
        sqlSupplier: ft.FlexibleTextSupplierSync,
        sqliteDb?: string,
      ) => Promise<Shape[] | undefined>;
    },
  ) {
    super();
    this.models = options?.models ?? m.serviceModels<EmitContext>();
    this.templateState = this.models.universal.modelsGovn.templateState;
    this.loadExtnSQL = options?.loadExtnSQL ?? noSqliteExtnLoader;
    this.stsOptions = options?.stsOptions ??
      SQLa.typicalSqlTextSupplierOptions();
    this.execDbQueryResult = options?.execDbQueryResult ?? (() => {
      throw Error(`this.execDbQueryResult not supplied`);
    });
  }

  // type-safe wrapper for all SQL text generated in this library;
  // we call it `SQL` so that VS code extensions like frigus02.vscode-sql-tagged-template-literals
  // properly syntax-highlight code inside SQL`xyz` strings.
  get SQL() {
    return SQLa.SQL<EmitContext>(this.templateState.ddlOptions);
  }

  // type-safe wrapper for all SQL that should not be treated as SQL statements
  // but as arbitrary text to send to the SQL stream
  sqlBehavior(
    sts: SQLa.SqlTextSupplier<EmitContext>,
  ): SQLa.SqlTextBehaviorSupplier<EmitContext> {
    return {
      executeSqlBehavior: () => sts,
    };
  }

  get sqlEngineNewUlid(): SQLa.SqlTextSupplier<EmitContext> {
    return { SQL: () => `ulid()` };
  }

  get onConflictDoNothing(): SQLa.SqlTextSupplier<EmitContext> {
    return { SQL: () => `ON CONFLICT DO NOTHING` };
  }

  // See [SQLite Pragma Cheatsheet for Performance and Consistency](https://cj.rs/blog/sqlite-pragma-cheatsheet-for-performance-and-consistency/)
  get optimalOpenDB() {
    return this.sqlBehavior(this.SQL`
      -- make sure all pragmas are silent in case SQL will be piped
      .output /dev/null
      PRAGMA journal_mode = wal; -- different implementation of the atomicity properties
      PRAGMA synchronous = normal; -- synchronise less often to the filesystem
      PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance
      .output stdout`);
  }

  get optimalCloseDB() {
    return this.sqlBehavior(this.SQL`
      -- make sure all pragmas are silent in case SQL will be piped
      .output /dev/null
      PRAGMA analysis_limit=400; -- make sure pragma optimize does not take too long
      PRAGMA optimize; -- gather statistics to improve query optimization
      .output stdout`);
  }

  viewDefn<ViewName extends string, DomainQS extends SQLa.SqlDomainQS>(
    viewName: ViewName,
  ) {
    return SQLa.viewDefinition<ViewName, EmitContext, DomainQS>(viewName, {
      isIdempotent: true,
      embeddedStsOptions: this.templateState.ddlOptions,
    });
  }
}

export class ConstructionNotebook<
  EmitContext extends SQLa.SqlEmitContext = SQLa.SqlEmitContext,
> extends SQLa.SqlNotebook<EmitContext> {
  readonly identity = "ddl-construction";

  constructor(
    readonly nbh: NotebookHelpers<EmitContext>,
    readonly existingMigrations: ReturnType<
      typeof nbh.models.universal.infoSchemaLifecycle.select
    >["filterable"][],
  ) {
    super();
  }

  @ConstructionNotebook.notIdempotent()
  initialDDL() {
    const { nbh, nbh: { models } } = this;
    // deno-fmt-ignore
    return nbh.SQL`
      ${nbh.optimalOpenDB}

      ${nbh.loadExtnSQL('asg017/ulid/ulid0')}

      ${models.universal.tables}

      ${models.universal.tableIndexes}

      ${models.serviceTables}

      ${models.serviceTableIndexes}

      ${models.universal.sqlPageFiles}

      ${nbh.optimalCloseDB}
      `;
  }

  fsContentWalkSessionStatsViewDDL() {
    // deno-fmt-ignore
    return this.nbh.viewDefn("fs_content_walk_session_stats")/* sql */`
      WITH Summary AS (
          SELECT
              strftime('%Y-%m-%d %H:%M:%S.%f', fcws.walk_started_at) AS walk_datetime,
              strftime('%f', fcws.walk_finished_at - fcws.walk_started_at) AS walk_duration,
              COALESCE(fcwpe.file_extn, '') AS file_extn,
              fcwp.root_path AS root_path,
              COUNT(fcwpe.fs_content_id) AS total_count,
              SUM(CASE WHEN fsc.frontmatter IS NOT NULL THEN 1 ELSE 0 END) AS with_frontmatter,
              AVG(fsc.file_bytes) AS average_size,
              strftime('%Y-%m-%d %H:%M:%S', datetime(MIN(fsc.file_mtime), 'unixepoch')) AS oldest,
              strftime('%Y-%m-%d %H:%M:%S', datetime(MAX(fsc.file_mtime), 'unixepoch')) AS youngest
          FROM
              fs_content_walk_session AS fcws
          LEFT JOIN
              fs_content_walk_path AS fcwp ON fcws.fs_content_walk_session_id = fcwp.walk_session_id
          LEFT JOIN
              fs_content_walk_path_entry AS fcwpe ON fcwp.fs_content_walk_path_id = fcwpe.walk_path_id
          LEFT JOIN
              fs_content AS fsc ON fcwpe.fs_content_id = fsc.fs_content_id
          GROUP BY
              fcws.walk_started_at,
              fcws.walk_finished_at,
              fcwpe.file_extn,
              fcwp.root_path
          UNION ALL
          SELECT
              strftime('%Y-%m-%d %H:%M:%S.%f', fcws.walk_started_at) AS walk_datetime,
              strftime('%f', fcws.walk_finished_at - fcws.walk_started_at) AS walk_duration,
              'ALL' AS file_extn,
              fcwp.root_path AS root_path,
              COUNT(fcwpe.fs_content_id) AS total_count,
              SUM(CASE WHEN fsc.frontmatter IS NOT NULL THEN 1 ELSE 0 END) AS with_frontmatter,
              AVG(fsc.file_bytes) AS average_size,
              strftime('%Y-%m-%d %H:%M:%S', datetime(MIN(fsc.file_mtime), 'unixepoch')) AS oldest,
              strftime('%Y-%m-%d %H:%M:%S', datetime(MAX(fsc.file_mtime), 'unixepoch')) AS youngest
          FROM
              fs_content_walk_session AS fcws
          LEFT JOIN
              fs_content_walk_path AS fcwp ON fcws.fs_content_walk_session_id = fcwp.walk_session_id
          LEFT JOIN
              fs_content_walk_path_entry AS fcwpe ON fcwp.fs_content_walk_path_id = fcwpe.walk_path_id
          LEFT JOIN
              fs_content AS fsc ON fcwpe.fs_content_id = fsc.fs_content_id
          GROUP BY
              fcws.walk_started_at,
              fcws.walk_finished_at,
              fcwp.root_path
      )
      SELECT
          walk_datetime,
          walk_duration,
          file_extn,
          root_path,
          total_count,
          with_frontmatter,
          CAST(ROUND(average_size) AS INTEGER) AS average_size,
          oldest,
          youngest
      FROM
          Summary
      ORDER BY
          walk_datetime,
          file_extn`;
  }

  mimeTypesSeedDML() {
    const { nbh, nbh: { models } } = this;
    // deno-fmt-ignore
    return nbh.SQL`
      ${nbh.loadExtnSQL("asg017/ulid/ulid0")}
      ${nbh.loadExtnSQL("asg017/http/http0")}

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

      ${models.mimeType.insertDML({
          mime_type_id: nbh.sqlEngineNewUlid,
          name: "application/typescript",
          file_extn: ".ts",
          description: "Typescript source",
        }, { onConflict: nbh.onConflictDoNothing })};`;
  }

  static readonly notIdempodentCells = new Set<keyof ConstructionNotebook>();

  /**
   * Descorate a function with `@notIdempotent` if it's important to indicate
   * whether its SQL is idempotent or not. By default we assume all SQL is
   * idempotent but this can be set to indicate it's not.
   * @param value idempotency indicator
   */
  static notIdempotent = () => {
    return (
      _target: SQLa.SqlNotebook<Any>,
      propertyKey: keyof ConstructionNotebook,
      _descriptor: PropertyDescriptor,
    ) => {
      ConstructionNotebook.notIdempodentCells.add(propertyKey);
    };
  };
}
