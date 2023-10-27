import { pgSQLa, SQLa, zod as z } from "./deps.ts";
import * as udm from "../udm/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

interface MigrationVersion {
  readonly version: string;
  readonly dateTime: Date;
  readonly description?: string;
}

export class PgMigrate<
  SchemaName extends string,
  Context extends SQLa.SqlEmitContext,
> {
  protected constructor(
    readonly ctxSupplier: () => Context,
    readonly schemaName: SchemaName,
  ) {}

  readonly infoSchemaLifecycle = SQLa.sqlSchemaDefn("info_schema_lifecycle", {
    isIdempotent: true,
  });

  formatDateToCustomString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth()).padStart(2, "0"); // Month is zero-based
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
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
    const migrateVersion = "V" + version.version + formattedDate +
      (version.description ? version.description : "");
    const migrateTemplateBody = migrateTemplate(argsDefn);
    const { isIdempotent = true, headerBodySeparator: _hbSep = "$$" } =
      spOptions ?? {};
    const ctx = this.ctxSupplier();
    const migrateTemplateBodySqlText = migrateTemplateBody.SQL(ctx);
    const migrateSP = pgSQLa.storedProcedure(
      "migrate_" + migrateVersion,
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
        headerBodySeparator: "$migrateVersion" + migrateVersion + "SP$",
      },
    )`
    IF ${this.infoSchemaLifecycle.sqlNamespace}.migration_${migrateVersion}_status() = 0 THEN
      ${migrateTemplateBodySqlText}
    END IF;
    `;
    const rollbackTemplateBody = rollbackTemplate(argsDefn);
    const rollbackTemplateBodySqlText = rollbackTemplateBody.SQL(ctx);
    const rollbackSP = pgSQLa.storedProcedure(
      "migration_" + migrateVersion + "_undo",
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
        headerBodySeparator: "$migrateVersion" + migrateVersion + "undo$",
      },
    )`${rollbackTemplateBodySqlText}`;
    const statusTemplateBody = statusTemplate(argsDefn);
    const statusTemplateBodySqlText = statusTemplateBody.SQL(ctx);
    const statusFn = pgSQLa.storedFunction(
      "migration_" + migrateVersion + "_status",
      {},
      "text",
      (name, args) =>
        pgSQLa.typedPlPgSqlBody(name, args, ctx, {
          autoBeginEnd: false,
        }),
      {
        embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
        autoBeginEnd: false,
        isIdempotent: true,
        sqlNS: this.infoSchemaLifecycle,
        headerBodySeparator: "$fnMigrateVersion" + migrateVersion + "Status$",
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

  content(version: MigrationVersion) {
    // const { ec } = this.state;
    // const { governedModel: { domains: d } } = ec;
    const ctx = this.ctxSupplier();
    const islmGovernance = SQLa.tableDefinition("islm_governance", {
      version: udm.text(),
      description: udm.text(),
      applied_at: udm.dateTime(),
      execution_time: udm.integer(),
      success: udm.boolean(),
      rollback_status: udm.boolean(),
    }, {
      sqlNS: this.infoSchemaLifecycle,
      isIdempotent: false,
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique("version"),
        ];
      },
    });
    const islmGovnRF = SQLa.tableColumnsRowFactory(
      islmGovernance.tableName,
      islmGovernance.zoSchema.shape,
    );
    const formattedDate = this.formatDateToCustomString(version.dateTime);
    const migrateVersion = "V" + version.version + formattedDate +
      (version.description ? version.description : "");
    const islmGovernanceInsertion = islmGovnRF.insertDML([
      {
        version: migrateVersion,
        description: "Initial migration",
        applied_at: new Date("2023-10-16T00:00:00.000Z"),
        execution_time: 10,
        success: true,
        rollback_status: false,
      },
    ], {
      onConflict: {
        SQL: () => `ON CONFLICT DO NOTHING`,
      },
    });

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
    `;
    const spIslmMigrateCtl = pgSQLa
      .storedRoutineBuilder(
        "islm_migrate_ctl",
        {
          "task": udm.text(),
          "target_version": udm.textNullable(),
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
    BEGIN
      CASE task
      WHEN 'migrate' THEN
        FOR r IN (
          SELECT version FROM ${this.infoSchemaLifecycle.sqlNamespace}.${islmGovernance.tableName} WHERE success IS NULL AND ($1 IS NULL OR version <= $1)
          ORDER BY version
        ) LOOP
          -- Check if migration has been executed
          -- Construct procedure and status function names
            DECLARE
              procedure_name TEXT := format('${this.infoSchemaLifecycle.sqlNamespace}.migrate_%s()', r.version);
              status_function_name TEXT := format('${this.infoSchemaLifecycle.sqlNamespace}.migrate_%s_status()', r.version);
              status INT;
            BEGIN
              -- Check if migration has been executed
              --EXECUTE SELECT (status_function_name)::INT INTO status;
              EXECUTE 'SELECT ' || status_function_name INTO status;

              IF status = 0 THEN
                -- Call the migration procedure
                EXECUTE procedure_name;

                -- Update the governance table
                EXECUTE format('
                  UPDATE ${this.infoSchemaLifecycle.sqlNamespace}.${islmGovernance.tableName}
                  SET success = TRUE,
                    applied_at = NOW()
                  WHERE version = $1', r.version)
                USING r.version;
              END IF;
            END;
        END LOOP;
      WHEN 'rollback' THEN
      -- Implement rollback logic here...
      -- Construct procedure names
        EXECUTE format('CALL ${this.infoSchemaLifecycle.sqlNamespace}.migrate_%s_undo()', target_version);

        -- Update the governance table, corrected WHERE clause
        EXECUTE format('
            UPDATE ${this.infoSchemaLifecycle.sqlNamespace}.${islmGovernance.tableName}
            SET rollback_status = TRUE,
                applied_at = NOW()
            WHERE version = $1', target_version)
        USING target_version;
      ELSE
        RAISE EXCEPTION 'Unknown task: %', task;
      END CASE;

    END;
    `;

    return {
      islmGovernance,
      spIslmGovernance,
      spIslmMigrateSP,
      islmGovernanceInsertion,
    };
  }

  static init<SchemaName extends string, Context extends SQLa.SqlEmitContext>(
    ctxSupplier: () => Context,
    schemaName: SchemaName,
  ): PgMigrate<SchemaName, Context> {
    return new PgMigrate(ctxSupplier, schemaName);
  }
}
