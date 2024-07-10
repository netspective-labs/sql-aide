import { pgSQLa, SQLa, zod as z } from "./deps.ts";
import * as udm from "../udm/mod.ts";
// deno-lint-ignore no-explicit-any
type Any = any;

export enum TransitionStatus {
  NONE = "None",
  SQLLOADED = "SQL Loaded",
  MIGRATED = "Migrated",
  ROLLBACK = "Rollback",
}

export interface MigrationVersion {
  readonly version: string;
  readonly dateTime: Date;
}

export class PgMigrate<
  SchemaName extends string,
  Context extends SQLa.SqlEmitContext,
> {
  readonly infoSchemaLifecycle;
  protected constructor(
    readonly ctxSupplier: () => Context,
    readonly schemaName: SchemaName,
    readonly prependMigrationSPText = "migration_",
    readonly prependMigrateSPText = "migrate_",
    readonly appendMigrationUndoSPText = "_undo",
    readonly appendMigrationStatusFnText = "_status",
  ) {
    this.infoSchemaLifecycle = SQLa.sqlSchemaDefn(this.schemaName, {
      isIdempotent: true,
    });
  }

  get sqlEngineNow(): SQLa.SqlTextSupplier<SQLa.SqlEmitContext> {
    return { SQL: () => `CURRENT_TIMESTAMP` };
  }

  formatDateToCustomString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth()).padStart(2, "0"); // Month is zero-based
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  migrationScaffold<
    ArgsShape extends z.ZodRawShape,
    BodyTemplateSupplier extends (
      argsDefn: ArgsShape,
      spOptions?: pgSQLa.StoredProcedureDefnOptions<string, Context>,
    ) => pgSQLa.PgProceduralLangBody<
      Any,
      string,
      SQLa.SqlEmitContext
    >,
    Context extends SQLa.SqlEmitContext,
    DomainQS extends SQLa.SqlDomainQS,
    DomainsQS extends SQLa.SqlDomainsQS<DomainsQS>,
  >(
    version: MigrationVersion,
    argsDefn: ArgsShape,
    migrateTemplate: BodyTemplateSupplier,
    rollbackTemplate: BodyTemplateSupplier,
    statusTemplate: BodyTemplateSupplier,
    spOptions?: pgSQLa.StoredProcedureDefnOptions<string, Context>,
  ) {
    const formattedDate = this.formatDateToCustomString(version.dateTime);
    const migrateVersion = "V" + version.version + "_" + formattedDate;
    const migrateTemplateBody = migrateTemplate(argsDefn);
    const { isIdempotent = true, headerBodySeparator: _hbSep = "$$" } =
      spOptions ?? {};
    const ctx = this.ctxSupplier();
    const migrateTemplateBodySqlText = migrateTemplateBody.SQL(ctx);
    const migrateSP = pgSQLa.storedProcedure(
      this.prependMigrateSPText + migrateVersion,
      {},
      (name, args, _) =>
        pgSQLa.typedPlPgSqlBody(name, args, ctx, {
          autoBeginEnd: false,
        }),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: isIdempotent,
        sqlNS: this.infoSchemaLifecycle,
        headerBodySeparator: "$migrateVersionSP$",
      },
    )`
    BEGIN
      IF ${this.infoSchemaLifecycle.sqlNamespace}."migration_${migrateVersion}_status"() = 0 THEN
        ${migrateTemplateBodySqlText}
      END IF;
    END
    `;
    const rollbackTemplateBody = rollbackTemplate(argsDefn);
    const rollbackTemplateBodySqlText = rollbackTemplateBody.SQL(ctx);
    const rollbackSP = pgSQLa.storedProcedure(
      this.prependMigrationSPText + migrateVersion +
        this.appendMigrationUndoSPText,
      {},
      (name, args, _) =>
        pgSQLa.typedPlPgSqlBody(name, args, ctx, {
          autoBeginEnd: false,
        }),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: this.infoSchemaLifecycle,
        headerBodySeparator: "$migrateVersionUndo$",
      },
    )`${rollbackTemplateBodySqlText}`;
    const statusTemplateBody = statusTemplate(argsDefn);
    const statusTemplateBodySqlText = statusTemplateBody.SQL(ctx);
    const statusFn = pgSQLa.storedFunction(
      this.prependMigrationSPText + migrateVersion +
        this.appendMigrationStatusFnText,
      {},
      "integer",
      (name, args) =>
        pgSQLa.typedPlPgSqlBody(name, args, ctx, {
          autoBeginEnd: false,
        }),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: this.infoSchemaLifecycle,
        headerBodySeparator: "$fnMigrateVersionStatus$",
      },
    )`
    DECLARE
      status INTEGER := 0; -- Initialize status to 0 (not executed)
    ${statusTemplateBodySqlText}
    `;
    return {
      migrateSP,
      rollbackSP,
      statusFn,
    };
  }

  content() {
    const ctx = this.ctxSupplier();
    const islmGovernance = udm.gm.stateTable(
      "islm_governance",
      {
        islm_governance_id: udm.uuidPrimaryKey(),
        migrate_version: udm.text(),
        sp_migration: udm.text(),
        sp_migration_undo: udm.text(),
        fn_migration_status: udm.text(),
      },
      ["sp_migration", "from_state", "to_state"],
      { isIdempotent: true, sqlNS: this.infoSchemaLifecycle },
    );

    const spIslmInit = pgSQLa
      .storedRoutineBuilder(
        "islm_init",
        {},
      );

    const spIslmGovernance = pgSQLa.storedProcedure(
      spIslmInit.routineName,
      spIslmInit.argsDefn,
      (name, args, bo) => pgSQLa.typedPlPgSqlBody(name, args, ctx, bo),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        sqlNS: this.infoSchemaLifecycle,
      },
    )`
    ${islmGovernance}
    EXCEPTION
    -- Catch the exception if the table already exists
    WHEN duplicate_table THEN
      -- Do nothing, just ignore the exception
      NULL;
    `;

    const extn = pgSQLa.pgExtensionDefn(
      this.infoSchemaLifecycle,
      '"uuid-ossp"',
    );
    const spIslmMigrateCtl = pgSQLa
      .storedRoutineBuilder(
        "islm_migrate_ctl",
        {
          "task": udm.text(),
          "target_version": udm.text(),
        },
      );

    const spIslmMigrateSP = pgSQLa.storedProcedure(
      spIslmMigrateCtl.routineName,
      spIslmMigrateCtl.argsDefn,
      (name, args, bo) => pgSQLa.typedPlPgSqlBody(name, args, ctx, bo),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        sqlNS: this.infoSchemaLifecycle,
      },
    )`
    DECLARE
      r RECORD;
      t TEXT;
      extracted_ts TEXT;
    BEGIN
      CASE task
      WHEN 'migrate' THEN
        FOR r IN (
          SELECT sp_migration,sp_migration_undo,fn_migration_status FROM ${this.infoSchemaLifecycle.sqlNamespace}.${islmGovernance.tableName} WHERE from_state = '${TransitionStatus.NONE}' AND to_state = '${TransitionStatus.SQLLOADED}' AND (migrate_version NOT IN (SELECT migrate_version FROM ${this.infoSchemaLifecycle.sqlNamespace}.${islmGovernance.tableName} WHERE from_state = '${TransitionStatus.SQLLOADED}' AND to_state = '${TransitionStatus.MIGRATED}')) AND
          (migrate_version IS NULL OR to_timestamp(substring(migrate_version FROM '(\\d{14})$'), 'YYYYMMDDHH24MISS')::timestamp<=to_timestamp(substring(target_version FROM '(\\d{14})$'), 'YYYYMMDDHH24MISS')::timestamp)
          ORDER BY migrate_version
        ) LOOP
          -- Check if migration has been executed
          -- Construct procedure and status function names
            DECLARE
              procedure_name TEXT := format('${this.infoSchemaLifecycle.sqlNamespace}."%s"()', r.sp_migration);
              procedure_undo_name TEXT := format('${this.infoSchemaLifecycle.sqlNamespace}."%s"()', r.sp_migration_undo);
              status_function_name TEXT := format('${this.infoSchemaLifecycle.sqlNamespace}."%s"()', r.fn_migration_status);
              islm_governance_id TEXT:= ${this.infoSchemaLifecycle.sqlNamespace}.uuid_generate_v4();
              status INT;
              migrate_insertion_sql TEXT;
            BEGIN
              -- Check if migration has been executed
              --EXECUTE SELECT (status_function_name)::INT INTO status;
              EXECUTE 'SELECT ' || status_function_name INTO status;

              IF status = 0 THEN
                -- Call the migration procedure
                EXECUTE  'call ' || procedure_name;

                -- Insert into the governance table
                migrate_insertion_sql := $dynSQL$
                  INSERT INTO ${this.infoSchemaLifecycle.sqlNamespace}.${islmGovernance.tableName} ("islm_governance_id","migrate_version", "sp_migration", "sp_migration_undo", "fn_migration_status", "from_state", "to_state", "transition_result", "transition_reason") VALUES ($1, $2, $3, $4, $5, '${TransitionStatus.SQLLOADED}', '${TransitionStatus.MIGRATED}', '{}', 'Migration') ON CONFLICT DO NOTHING
                $dynSQL$;
                EXECUTE migrate_insertion_sql USING islm_governance_id, target_version, r.sp_migration, r.sp_migration_undo, r.fn_migration_status;
              END IF;
            END;
        END LOOP;
      WHEN 'rollback' THEN
      -- Implement rollback logic here...
      -- Construct procedure names
        DECLARE
          migrate_rb_insertion_sql TEXT;
          procedure_name text;
          procedure_undo_name text;
          status_function_name text;
          islm_governance_id text;
          sp_migration_undo_sql RECORD;
        BEGIN
          SELECT sp_migration,sp_migration_undo,fn_migration_status FROM ${this.infoSchemaLifecycle.sqlNamespace}.${islmGovernance.tableName} WHERE from_state = '${TransitionStatus.SQLLOADED}' AND to_state = '${TransitionStatus.MIGRATED}' AND migrate_version=target_version AND (target_version IN (SELECT migrate_version FROM ${this.infoSchemaLifecycle.sqlNamespace}.${islmGovernance.tableName} WHERE from_state = '${TransitionStatus.SQLLOADED}' AND to_state = '${TransitionStatus.MIGRATED}' ORDER BY migrate_version DESC LIMIT 1))  INTO sp_migration_undo_sql;
          IF sp_migration_undo_sql IS NOT NULL THEN
            procedure_name := format('${this.infoSchemaLifecycle.sqlNamespace}."%s"()', sp_migration_undo_sql.sp_migration);
            procedure_undo_name := format('${this.infoSchemaLifecycle.sqlNamespace}."%s"()', sp_migration_undo_sql.sp_migration_undo);
            status_function_name := format('${this.infoSchemaLifecycle.sqlNamespace}."%s"()', sp_migration_undo_sql.fn_migration_status);
            islm_governance_id := ${this.infoSchemaLifecycle.sqlNamespace}.uuid_generate_v4();
            EXECUTE  'call ' || procedure_undo_name;

            -- Insert the governance table
            migrate_rb_insertion_sql := $dynSQL$
                      INSERT INTO ${this.infoSchemaLifecycle.sqlNamespace}.${islmGovernance.tableName} ("islm_governance_id","migrate_version", "sp_migration", "sp_migration_undo", "fn_migration_status", "from_state", "to_state", "transition_result", "transition_reason") VALUES ($1, $2, $3, $4, $5, '${TransitionStatus.MIGRATED}', '${TransitionStatus.ROLLBACK}', '{}', 'Rollback for migration') ON CONFLICT DO NOTHING

                    $dynSQL$;
            EXECUTE migrate_rb_insertion_sql USING islm_governance_id, target_version, sp_migration_undo_sql.sp_migration, sp_migration_undo_sql.sp_migration_undo, sp_migration_undo_sql.fn_migration_status;
          ELSE
            RAISE EXCEPTION 'Cannot perform a rollback for this version';
          END IF;
        END;
      ELSE
        RAISE EXCEPTION 'Unknown task: %', task;
      END CASE;

    END;
    `;

    return {
      islmGovernance,
      spIslmGovernance,
      spIslmMigrateSP,
      extn,
    };
  }

  static init<SchemaName extends string, Context extends SQLa.SqlEmitContext>(
    ctxSupplier: () => Context,
    schemaName: SchemaName,
  ): PgMigrate<SchemaName, Context> {
    return new PgMigrate(ctxSupplier, schemaName);
  }
}
