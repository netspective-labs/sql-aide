import * as SQLa from "../../render/mod.ts";
import * as tp from "../../pattern/typical/mod.ts";

export const sqlEmitContext = <EmitContext extends SQLa.SqlEmitContext>() =>
  SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.sqliteDialect(),
  }) as EmitContext;

export function governance<EmitContext extends SQLa.SqlEmitContext>() {
  type DomainQS = tp.TypicalDomainQS;
  type DomainsQS = tp.TypicalDomainsQS;
  const templateState = tp.governedTemplateState<
    DomainQS,
    DomainsQS,
    EmitContext
  >();
  return {
    keys: tp.governedKeys<DomainQS, DomainsQS, EmitContext>(),
    domains: tp.governedDomains<DomainQS, DomainsQS, EmitContext>(),
    templateState,
    model: tp.governedModel<DomainQS, DomainsQS, EmitContext>(
      templateState.ddlOptions,
    ),
  };
}

export function models<EmitContext extends SQLa.SqlEmitContext>() {
  const modelsGovn = governance<EmitContext>();
  const { keys: gk, domains: gd, model: gm } = modelsGovn;

  /**
   * Immutable Devices table represents different machines, servers, or workstations.
   * Every device has a unique identifier (ULID) and contains fields for its name,
   * operating system, os_info (possibly Unix name info, like output of uname -a),
   * and a JSON-structured field for additional details about the device.
   *
   * Always append new records. NEVER delete or update existing records.
   */
  const mimeType = gm.textPkTable(
    "mime_type",
    {
      mime_type_id: gk.ulidPrimaryKey(), // TODO: allow setting default to `ulid()` type like autoIncPK execpt autoUlidPK or something
      name: gd.text(),
      description: gd.text(),
      file_extn: gd.text(),
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique("name", "file_extn"),
        ];
      },
      indexes: (props, tableName) => {
        const tif = SQLa.tableIndexesFactory(tableName, props);
        return [tif.index(undefined, "file_extn")];
      },
    },
  );

  /**
   * Immutable Devices table represents different machines, servers, or workstations.
   * Every device has a unique identifier (ULID) and contains fields for its name,
   * operating system, os_info (possibly Unix name info, like output of uname -a),
   * and a JSON-structured field for additional details about the device.
   *
   * Always append new records. NEVER delete or update existing records.
   */
  const device = gm.textPkTable(
    "device",
    {
      device_id: gm.keys.ulidPrimaryKey(), // TODO: allow setting default to `ulid()` type like autoIncPK execpt autoUlidPK or something
      name: gd.text(),
      boundary: gd.text(), // can be IP address, VLAN, or any other device name differentiator
      device_elaboration: gd.jsonTextNullable(),
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique("name", "boundary"),
        ];
      },
      indexes: (props, tableName) => {
        const tif = SQLa.tableIndexesFactory(tableName, props);
        return [tif.index(undefined, "name")];
      },
    },
  );

  /**
   * Immutable FileSystem Walk Sessions Represents a single file system scan (or
   * "walk") session. Each time a directory is scanned for files and entries, a
   * record is created here. It includes a reference to the device being scanned
   * and the root path of the scan.
   *
   * Always append new records. NEVER delete or update existing records.
   */
  const fsContentWalkSession = gm.textPkTable(
    "fs_content_walk_session",
    {
      fs_content_walk_session_id: gm.keys.ulidPrimaryKey(),
      device_id: device.references.device_id(),
      walk_started_at: gd.dateTime(),
      walk_finished_at: gd.dateTimeNullable(),
      max_fileio_read_bytes: gd.integer(),
      ignore_paths_regex: gd.textNullable(),
      blobs_regex: gd.textNullable(),
      digests_regex: gd.textNullable(),
      elaboration: gd.jsonTextNullable(),
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique("device_id", "created_at"),
        ];
      },
    },
  );

  /**
   * Immutable FileSystem Walk Sessions Represents a single file system scan (or
   * "walk") session. Each time a directory is scanned for files and entries, a
   * record is created here. It includes a reference to the device being scanned
   * and the root path of the scan.
   *
   * Always append new records. NEVER delete or update existing records.
   */
  const fsContentWalkPath = gm.textPkTable(
    "fs_content_walk_path",
    {
      fs_content_walk_path_id: gm.keys.ulidPrimaryKey(),
      walk_session_id: fsContentWalkSession.references
        .fs_content_walk_session_id(),
      root_path: gd.text(),
      elaboration: gd.jsonTextNullable(),
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique("walk_session_id", "root_path", "created_at"),
        ];
      },
      indexes: (props, tableName) => {
        const tif = SQLa.tableIndexesFactory(tableName, props);
        return [tif.index(undefined, "walk_session_id", "root_path")];
      },
    },
  );

  /**
   * Immutable File Content table represents the content and metadata of a file at
   * a particular point in time. This table contains references to the device where
   * the file resides, file content (optional), digest hash of the content (to
   * detect changes), and modification time.
   *
   * The file content is "versioned" using mtime which are then related to the walk
   * session to see which version.
   *
   * Always append new records. NEVER delete or update existing records.
   */
  const fsContent = gm.textPkTable(
    "fs_content",
    {
      fs_content_id: gm.keys.ulidPrimaryKey(),
      walk_session_id: fsContentWalkSession.references
        .fs_content_walk_session_id(),
      walk_path_id: fsContentWalkPath.references.fs_content_walk_path_id(),
      file_path: gd.text(),
      content_digest: gd.text(), // '-' when no hash was computed (not NULL); content_digest for symlinks will be the same as their target
      content: gd.blobTextNullable(),
      file_bytes: gd.integerNullable(), // file_bytes for symlinks will be different than their target
      file_extn: gd.textNullable(),
      file_mode: gd.integerNullable(),
      file_mode_human: gd.textNullable(),
      file_mtime: gd.integerNullable(),
      content_fm_body_attrs: gd.jsonTextNullable(), // each component of frontmatter-based content ({ frontMatter: '', body: '', attrs: {...} })
      frontmatter: gd.jsonTextNullable(), // meta data or other "frontmatter" in JSON format
      elaboration: gd.jsonTextNullable(), // anything that doesn't fit above
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        // TODO: note that content_hash for symlinks will be the same as their target
        //       figure out whether we need anything special in the UNIQUE index
        return [
          c.unique(
            "content_digest", // use something like `-` when hash is no computed
            "file_path",
            "file_bytes",
            "file_mtime",
          ),
        ];
      },
      indexes: (props, tableName) => {
        const tif = SQLa.tableIndexesFactory(tableName, props);
        return [tif.index(undefined, "walk_session_id", "file_path")];
      },
    },
  );

  /**
   * This is a "virtual" table that should not be used for DDL but used for DML.
   * It is managed by SQLite and is used to store `.parameter set` values and
   * allows all keys to be used as `:xyz` variables that point to `value`.
   *
   * SQLite shell `.parameter set xyz value` is equivalent to `INSERT INTO
   * sqlite_parameters (key, value) VALUES ('xyz', 'value')` but `.parameter set`
   * does not support SQL expressions. If you need a value to be evaluated before
   * being set then use `INSERT INTO sqlite_parameters (key, value)...`.
   */
  const sqliteParameters = gm.table("sqlite_parameters", {
    key: gd.text(),
    value: gd.text(),
  });

  const contentTables = [
    mimeType,
    device,
    fsContentWalkSession,
    fsContentWalkPath,
    fsContent,
  ];

  const tableIndexes = [
    ...mimeType.indexes,
    ...device.indexes,
    ...fsContentWalkSession.indexes,
    ...fsContentWalkPath.indexes,
    ...fsContent.indexes,
  ];

  return {
    modelsGovn,
    mimeType,
    device,
    fsContentWalkSession,
    fsContentWalkPath,
    fsContent,
    sqliteParameters,
    contentTables,
    tableIndexes,
  };
}
