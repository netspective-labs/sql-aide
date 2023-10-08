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
      os_info: gd.textNullable(),
      device_elaboration: gd.jsonTextNullable(), // TODO: need check constraint `CHECK(json_valid(content_elaboration) OR content_elaboration IS NULL),`
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
      os: gd.text(),
      ip_address: gd.text(),
      os_info: gd.textNullable(),
      device_elaboration: gd.jsonTextNullable(), // TODO: need check constraint `CHECK(json_valid(content_elaboration) OR content_elaboration IS NULL),`
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique("name", "ip_address"),
        ];
      },
    },
  );

  /**
   * Immutable Device Monitor Path represents which paths should be monitored
   * on a given device, which files should be monitored, and how often.
   *
   * Always append new records. NEVER delete or update existing records.
   */
  const deviceMonitorPath = gm.textPkTable(
    "device_monitor_path",
    {
      device_monitor_path_id: gm.keys.ulidPrimaryKey(),
      device_id: device.references.device_id(),
      root_path: gd.text(),
      glob_spec: gd.text().optional(),
      cron_spec: gd.text().optional(),
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique("device_id", "root_path", "glob_spec"),
        ];
      },
    },
  );

  /**
   * Immutable File Content table represents the content and metadata of a file at
   * a particular point in time. This table contains references to the device where
   * the file resides, file content (optional), hash of the content (to detect changes),
   * and timestamps (modification and access times).
   *
   * The file content is "versioned" using mtime and hash which are then
   * related to the walk session to see which version.
   *
   * Always append new records. NEVER delete or update existing records.
   */
  const fsContent = gm.textPkTable(
    "fs_content",
    {
      fs_content_id: gm.keys.ulidPrimaryKey(),
      device_id: device.references.device_id(),
      content_hash: gd.text(),
      content: gd.textNullable(), // TODO: BLOB
      content_mime_type: gd.textNullable(),
      file_mode: gd.integerNullable(),
      file_mode_human: gd.textNullable(),
      file_size: gd.integerNullable(),
      file_mtime: gd.integerNullable(),
      content_elaboration: gd.jsonTextNullable(), // TODO: need check constraint
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique(
            "device_id",
            "content_hash",
            "file_size",
            "file_mtime",
          ),
        ];
      },
    },
  );

  /**
   * Immutable File Content path table represents the path where the content
   * was found. Usually this only has one entry but could have more if there
   * were multiple symlinks pointing to the same content.
   *
   * Always append new records. NEVER delete or update existing records.
   */
  const fsContentPath = gm.textPkTable(
    "fs_content_path",
    {
      fs_content_path_id: gm.keys.ulidPrimaryKey(),
      device_id: device.references.device_id(),
      file_path: gd.text(),
      content_hash: gd.text(),
      file_mode: gd.integerNullable(),
      file_mode_human: gd.textNullable(),
      file_size: gd.integerNullable(),
      file_mtime: gd.integerNullable(),
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique("device_id", "content_hash", "file_path"),
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
  const fsWalkSession = gm.textPkTable(
    "fs_walk_session",
    {
      fs_walk_session_id: gm.keys.ulidPrimaryKey(),
      device_id: device.references.device_id(),
      root_path: gd.text(),
      walk_options: gd.jsonTextNullable(), // TODO: need check constraint
      session_elaboration: gd.jsonTextNullable(), // TODO: need check constraint
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique("device_id", "root_path", "walk_options", "created_at"),
        ];
      },
    },
  );

  /**
   * Immutable FileSystem Walk Entries records represent a file or directory
   * discovered during a file system walk session. It has references to the
   * session and contains information like full path, relative path, whether
   * it's a file or directory, and timestamps.
   *
   * Always append new records. NEVER delete or update existing records.
   */
  const fsWalkEntry = gm.textPkTable(
    "fs_walk_entry",
    {
      fs_walk_entry_id: gm.keys.ulidPrimaryKey(),
      fs_walk_session_id: fsWalkSession.references.fs_walk_session_id(),
      abs_path: gd.text(),
      rel_path: gd.text(),
      entry_mtime: gd.dateTimeNullable(),
      entry_atime: gd.dateTimeNullable(),
      entry_elaboration: gd.jsonTextNullable(), // TODO: need check constraint
      ...gm.housekeeping.columns,
    },
    {
      isIdempotent: true,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique("fs_walk_session_id", "abs_path"),
        ];
      },
    },
  );

  /**
   * Immutable FileSystem Walk Entries records represent a file or directory
   * discovered during a file system walk session. It has references to the
   * session and contains information like full path, relative path, whether
   * it's a file or directory, and timestamps.
   *
   * Always append new records. NEVER delete or update existing records.
   */
  const fsWalkEntryFile = gm.textPkTable(
    "fs_walk_entry_file",
    {
      fs_walk_entry_file_id: gm.keys.ulidPrimaryKey(),
      fs_content_id: fsContent.references.fs_content_id(),
      fs_walk_entry_id: fsWalkEntry.references.fs_walk_entry_id(),
      file_elaboration: gd.jsonTextNullable(), // TODO: need check constraint
      ...gm.housekeeping.columns,
    },
    { isIdempotent: true },
  );

  const contentTables = [
    mimeType,
    device,
    deviceMonitorPath,
    fsContent,
    fsContentPath,
    fsWalkSession,
    fsWalkEntry,
    fsWalkEntryFile,
  ];

  return {
    modelsGovn,
    mimeType,
    device,
    deviceMonitorPath,
    fsContent,
    fsContentPath,
    fsWalkSession,
    fsWalkEntry,
    fsWalkEntryFile,
    contentTables,
  };
}
