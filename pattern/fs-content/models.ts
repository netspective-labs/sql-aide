import * as SQLa from "../../render/mod.ts";
import * as g from "./governance.ts";

/**
 * Encapsulate all models that are universally applicable and not specific to
 * this particular service. TODO: consider extracting this into its own pattern.
 * @returns
 */
export function universalModels<EmitContext extends SQLa.SqlEmitContext>() {
  const modelsGovn = g.governance<EmitContext>();
  const { keys: gk, domains: gd, model: gm } = modelsGovn;

  // Stores all notebook cells in the database so that once the database is
  // created, all SQL is part of the database and may be executed like this
  // from the CLI:
  //    sqlite3 xyz.db "select sql from sql_notebook_cell where sql_notebook_cell_id = 'infoSchemaMarkdown'" | sqlite3 xyz.db
  // You can pass in arguments using .parameter or `sql_parameters` table, like:
  //    echo ".parameter set X Y; $(sqlite3 xyz.db \"SELECT sql FROM sql_notebook_cell where sql_notebook_cell_id = 'init'\")" | sqlite3 xyz.db
  const storedNotebook = gm.textPkTable("stored_notebook_cell", {
    stored_notebook_cell_id: gk.textPrimaryKey(),
    notebook_name: gd.text(),
    cell_name: gd.text(),
    code_interpreter: gd.textNullable(), // SQL by default, shebang-style for others
    interpretable_code: gd.blobText(),
    is_idempotent: gd.boolean(),
    description: gd.textNullable(),
    arguments: gd.jsonTextNullable(),
    ...gm.housekeeping.columns,
  }, {
    isIdempotent: true,
    constraints: (props, tableName) => {
      const c = SQLa.tableConstraints(tableName, props);
      return [
        c.unique("notebook_name", "cell_name"),
      ];
    },
  });

  const infoSchemaLifecycle = gm.table("information_schema_lifecycle", {
    migration_id: gk.textPrimaryKey(),
    stored_notebook_cell_id: storedNotebook.references.stored_notebook_cell_id()
      .optional(),
    remarks: gd.text().optional(),
    executed_at: gd.createdAt(),
    executed_by: gd.text().optional(),
    elaboration: gd.jsonTextNullable(),
  });

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

  // see https://github.com/lovasoa/SQLpage/tree/main#hosting-sql-files-directly-inside-the-database
  const sqlPageFiles = gm.table("sqlpage_files", {
    path: gk.textPrimaryKey(),
    contents: gd.blobText(),
    last_modified: gd.createdAt(),
  }, { isIdempotent: true });

  const tables = [storedNotebook, sqlPageFiles];
  const tableIndexes = [...storedNotebook.indexes, ...sqlPageFiles.indexes];

  return {
    modelsGovn,
    infoSchemaLifecycle,
    storedNotebook,
    sqliteParameters,
    sqlPageFiles,
    tables,
    tableIndexes,
  };
}

export function serviceModels<EmitContext extends SQLa.SqlEmitContext>() {
  const universal = universalModels<EmitContext>();
  const { keys: gk, domains: gd, model: gm } = universal.modelsGovn;

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
   * Immutable File Content walk path entry table represents an entry that was
   * traversed during path walking. This table contains references to the device
   * where the file resides, and references to the file content, digest hash, etc.
   *
   * If you want to see which files did not change between sessions, just "diff"
   * the rows in SQL.
   *
   * Always append new records. NEVER delete or update existing records.
   */
  const fsContentWalkPathEntry = gm.textPkTable(
    "fs_content_walk_path_entry",
    {
      fs_content_walk_path_entry_id: gm.keys.ulidPrimaryKey(),
      walk_session_id: fsContentWalkSession.references
        .fs_content_walk_session_id(),
      walk_path_id: fsContentWalkPath.references.fs_content_walk_path_id(),
      fs_content_id: fsContent.references.fs_content_id().optional(),
      file_path_abs: gd.text(),
      file_path_rel_parent: gd.text(),
      file_path_rel: gd.text(),
      file_basename: gd.text(),
      file_extn: gd.textNullable(),
      elaboration: gd.jsonTextNullable(), // anything that doesn't fit above
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      indexes: (props, tableName) => {
        const tif = SQLa.tableIndexesFactory(tableName, props);
        return [tif.index(undefined, "walk_session_id", "file_path_abs")];
      },
    },
  );

  const serviceTables = [
    mimeType,
    device,
    fsContentWalkSession,
    fsContentWalkPath,
    fsContent,
    fsContentWalkPathEntry,
  ];

  const serviceTableIndexes = [
    ...mimeType.indexes,
    ...device.indexes,
    ...fsContentWalkSession.indexes,
    ...fsContentWalkPath.indexes,
    ...fsContent.indexes,
    ...fsContentWalkPathEntry.indexes,
  ];

  return {
    universal,
    mimeType,
    device,
    fsContentWalkSession,
    fsContentWalkPath,
    fsContent,
    fsContentWalkPathEntry,
    serviceTables,
    serviceTableIndexes,
  };
}
