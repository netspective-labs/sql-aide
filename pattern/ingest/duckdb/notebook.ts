import { uuid } from "./deps.ts";
import * as chainNB from "../../../lib/notebook/chain-of-responsibility.ts";
import * as qs from "../../../lib/quality-system/mod.ts";
import * as ws from "../../../lib/universal/whitespace.ts";
import * as SQLa from "../../../render/mod.ts";
import * as tp from "../../../pattern/typical/mod.ts";
import * as a from "./assurance.ts";

// deno-lint-ignore no-explicit-any
export type Any = any;

export type DomainQS = tp.TypicalDomainQS;
export type DomainsQS = tp.TypicalDomainsQS;

export const markdown = qs.qsMarkdown;

export const DETERMINISTIC_UUID_NAMESPACE =
  "b6c7390a-69ea-4814-ae3e-c0c6ed3a913f";
export let deterministicUuidCounter = 0;

export interface IngestSourceStructAssuranceContext {
  readonly sessionEntryDML: () =>
    | Promise<
      ReturnType<IngestGovernance["ingestSessionEntryCRF"]["insertDML"]>
    >
    | ReturnType<IngestGovernance["ingestSessionEntryCRF"]["insertDML"]>;
  readonly structuralIssueDML: (message: string, nature?: string) =>
    | Promise<
      ReturnType<IngestGovernance["ingestSessionIssueCRF"]["insertDML"]>
    >
    | ReturnType<IngestGovernance["ingestSessionIssueCRF"]["insertDML"]>;
  readonly selectEntryIssues: () => SQLa.SqlTextSupplier<IngestEmitContext>;
}

export interface IngestableResource {
  readonly uri: string;
  readonly nature: string;
  readonly workflow: (sessionID: string, sessionEntryID: string) => {
    readonly ingestSQL: (
      issac: IngestSourceStructAssuranceContext,
    ) =>
      | Promise<SQLa.SqlTextSupplier<IngestEmitContext>>
      | SQLa.SqlTextSupplier<IngestEmitContext>;
    readonly assuranceSQL: () =>
      | Promise<SQLa.SqlTextSupplier<IngestEmitContext>>
      | SQLa.SqlTextSupplier<IngestEmitContext>;
  };
}

export interface InvalidIngestSource extends IngestableResource {
  readonly nature: "ERROR";
  readonly error: Error;
  readonly tableName: string;
}

export interface CsvFileIngestSource<TableName extends string>
  extends IngestableResource {
  readonly nature: "CSV";
  readonly tableName: TableName;
}

export interface ExcelSheetIngestSource<
  SheetName extends string,
  TableName extends string,
> extends IngestableResource {
  readonly nature: "Excel Workbook Sheet";
  readonly sheetName: SheetName;
  readonly tableName: TableName;
}

export class ErrorIngestSource implements InvalidIngestSource {
  readonly nature = "ERROR";
  readonly tableName = "ERROR";
  constructor(
    readonly uri: string,
    readonly error: Error,
    readonly issueType: string,
    readonly govn: IngestGovernance,
  ) {
  }

  workflow(): ReturnType<InvalidIngestSource["workflow"]> {
    return {
      ingestSQL: async (issac) =>
        // deno-fmt-ignore
        this.govn.SQL`
           -- required by IngestEngine, setup the ingestion entry for logging
           ${await issac.sessionEntryDML()}
           ${await issac.structuralIssueDML(this.error.message, this.issueType)};
           -- required by IngestEngine, emit the errors for the given session (file) so it can be picked up
           ${issac.selectEntryIssues()}`,
      assuranceSQL: () =>
        this.govn.SQL`
          -- error: ${this.error.message}
        `,
    };
  }
}

export class IngestEmitContext implements SQLa.SqlEmitContext {
  readonly embeddedSQL = SQLa.SQL;
  readonly sqlNamingStrategy = SQLa.typicalSqlNamingStrategy();
  readonly sqlTextEmitOptions = SQLa.typicalSqlTextEmitOptions();
  readonly sqlDialect = SQLa.duckDbDialect();

  /**
   * UUID generator when the value is needed by the Javascript runtime
   * @param deterministic true if running this in a test or other synthetic environment
   * @returns either a unique deterministic or random string
   */
  async newUUID(deterministic: boolean) {
    if (deterministic) {
      deterministicUuidCounter++;
      const data = new TextEncoder().encode(
        deterministicUuidCounter.toString(),
      );
      return await uuid.v5.generate(DETERMINISTIC_UUID_NAMESPACE, data);
    }
    return crypto.randomUUID();
  }

  /**
   * Compute the current timestamp and prepare DuckDB SQL
   * @returns SQL supplier of the Javascript runtime's current time
   */
  get newCurrentTimestamp(): SQLa.SqlTextSupplier<IngestEmitContext> {
    return {
      SQL: () => {
        const now = new Date();
        return `make_timestamp(${now.getFullYear()}, ${now.getMonth()}, ${now.getDay()}, ${now.getHours()}, ${now.getMinutes()}, ${`${now.getSeconds()}.${now.getMilliseconds()}`})`;
      },
    };
  }

  // UUID generator when the value is needed by the SQLite engine runtime
  get sqlEngineNewUUID(): SQLa.SqlTextSupplier<IngestEmitContext> {
    return { SQL: () => `uuid()` };
  }

  get onConflictDoNothing(): SQLa.SqlTextSupplier<IngestEmitContext> {
    return { SQL: () => `ON CONFLICT DO NOTHING` };
  }

  get sqlEngineNow(): SQLa.SqlTextSupplier<IngestEmitContext> {
    return { SQL: () => `CURRENT_TIMESTAMP` };
  }
}

export class IngestGovernance {
  readonly emitCtx = new IngestEmitContext();
  readonly gk = tp.governedKeys<DomainQS, DomainsQS, IngestEmitContext>();
  readonly gd = tp.governedDomains<DomainQS, DomainsQS, IngestEmitContext>();
  readonly gts = tp.governedTemplateState<
    DomainQS,
    DomainsQS,
    IngestEmitContext
  >();
  readonly gm = tp.governedModel<DomainQS, DomainsQS, IngestEmitContext>(
    this.gts.ddlOptions,
  );
  readonly stsOptions = SQLa.typicalSqlTextSupplierOptions<IngestEmitContext>();
  readonly primaryKey = this.gk.uuidPrimaryKey;

  readonly ingestSession = SQLa.tableDefinition("ingest_session", {
    ingest_session_id: this.primaryKey(),
    ingest_started_at: this.gd.createdAt(),
    ingest_finished_at: this.gd.dateTimeNullable(),
    elaboration: this.gd.jsonTextNullable(),
  }, {
    isIdempotent: true,
    populateQS: (t, c, _, tableName) => {
      t.description = markdown`
        An ingestion session is an ingestion event in which we can record the ingestion supply chain`;
      c.ingest_session_id.description =
        `${tableName} primary key and internal label (UUID)`;
      c.elaboration.description =
        `JSON governance data (description, documentation, usage, etc. in JSON)`;
    },

    qualitySystem: {
      description: markdown`
          An ingestion session is an ingestion event in which we can record the ingestion supply chain.`,
    },
  });

  readonly ingestSessionEntry = SQLa.tableDefinition("ingest_session_entry", {
    ingest_session_entry_id: this.primaryKey(),
    session_id: this.ingestSession.references.ingest_session_id(),
    ingest_src: this.gd.text(),
    ingest_table_name: this.gd.text().optional(),
    elaboration: this.gd.jsonTextNullable(),
  }, {
    isIdempotent: true,
    populateQS: (t, c, _, tableName) => {
      t.description = markdown`
        An ingestion session is an ingestion event in which we can record the ingestion supply chain`;
      c.ingest_session_entry_id.description =
        `${tableName} primary key and internal label (UUID)`;
      c.session_id.description =
        `${this.ingestSession.tableName} row this entry describes`;
      c.ingest_src.description =
        `The name of the file or URI of the source of the ingestion`;
      c.ingest_table_name.description =
        `If the ingestion was done into a temp or actual table, this is the table name`;
      c.elaboration.description =
        `JSON governance data (description, documentation, usage, etc. in JSON)`;
    },

    qualitySystem: {
      description: markdown`
          An ingestion session is an ingestion event in which we can record the ingestion supply chain.`,
    },
  });

  readonly ingestSessionState = SQLa.tableDefinition("ingest_session_state", {
    ingest_session_state_id: this.primaryKey(),
    session_id: this.ingestSession.references.ingest_session_id(),
    session_entry_id: this.ingestSessionEntry.references
      .ingest_session_entry_id().optional(),
    from_state: this.gd.text(),
    to_state: this.gd.text(),
    transition_result: this.gd.jsonTextNullable(),
    transition_reason: this.gd.textNullable(),
    transitioned_at: this.gd.createdAt(),
    elaboration: this.gd.jsonTextNullable(),
  }, {
    isIdempotent: true,
    constraints: (props, tableName) => {
      const c = SQLa.tableConstraints(tableName, props);
      return [
        c.unique("ingest_session_state_id", "from_state", "to_state"),
      ];
    },
    populateQS: (t, c, _, tableName) => {
      t.description = markdown`
        Records the state of an ingestion session, computations, and results for Kernels that are stateful.
        For example, a SQL Notebook Cell that creates tables should only be run once (meaning it's statefule).
        Other Kernels might store results for functions and output defined in one cell can be used in later cells.`;
      c.ingest_session_state_id.description = `${tableName} primary key`;
      c.session_id.description =
        `${this.ingestSession.tableName} row this state describes`;
      c.session_entry_id.description =
        `${this.ingestSessionEntry.tableName} row this state describes (optional)`;
      c.from_state.description =
        `the previous state (set to "INITIAL" when it's the first transition)`;
      c.to_state.description =
        `the current state; if no rows exist it means no state transition occurred`;
      c.transition_result.description =
        `if the result of state change is necessary for future use`;
      c.transition_reason.description =
        `short text or code explaining why the transition occurred`;
      c.transitioned_at.description = `when the transition occurred`;
      c.elaboration.description =
        `any elaboration needed for the state transition`;
    },
  });

  readonly ingestSessionIssue = SQLa.tableDefinition(
    "ingest_session_issue",
    {
      ingest_session_issue_id: this.gk.uuidPrimaryKey(),
      session_id: this.ingestSession.references.ingest_session_id(),
      session_entry_id: this.ingestSessionEntry.references
        .ingest_session_entry_id().optional(),
      issue_type: this.gd.text(),
      issue_message: this.gd.text(),
      issue_row: this.gd.integerNullable(),
      issue_column: this.gd.textNullable(),
      invalid_value: this.gd.textNullable(),
      remediation: this.gd.textNullable(),
      elaboration: this.gd.jsonTextNullable(),
    },
    {
      isIdempotent: true,
      populateQS: (t, c, _, tableName) => {
        t.description = markdown`
        A tabular ingestion issue is generated when an error or warning needs to
        be created during the ingestion of a CSV or other "tabular" source.`;
        c.ingest_session_issue_id.description =
          `${tableName} primary key and internal label (UUID)`;
        c.issue_type.description = `The category of an issue`;
        c.issue_message.description = `The human-friendly message for an issue`;
        c.issue_row.description =
          `The row number in which the issue occurred (may be NULL if not applicable)`;
        c.issue_column.description =
          `The name of the column in which the issue occurred (may be NULL if not applicable)`;
        c.invalid_value.description =
          `The invalid value which caused the issue (may be NULL if not applicable)`;
        c.remediation.description =
          `If the issue is correctable, explain how to correct it.`;
        c.elaboration.description =
          `isse-specific attributes/properties in JSON ("custom data")`;
      },

      qualitySystem: {
        description: markdown`
        A tabular ingestion issue is generated when an error or warning needs to
        be created during the ingestion of a CSV or other "tabular" source.`,
      },
    },
  );

  readonly informationSchema = {
    adminTables: [
      this.ingestSession,
      this.ingestSessionEntry,
      this.ingestSessionState,
      this.ingestSessionIssue,
    ],
    adminTableIndexes: [
      ...this.ingestSession.indexes,
      ...this.ingestSessionEntry.indexes,
      ...this.ingestSessionState.indexes,
      ...this.ingestSessionIssue.indexes,
    ],
  };

  readonly ingestSessionCRF = SQLa.tableColumnsRowFactory<
    typeof this.ingestSession.tableName,
    typeof this.ingestSession.zoSchema.shape,
    IngestEmitContext,
    DomainQS,
    DomainsQS
  >(
    this.ingestSession.tableName,
    this.ingestSession.zoSchema.shape,
  );
  readonly ingestSessionEntryCRF = SQLa.tableColumnsRowFactory<
    typeof this.ingestSessionEntry.tableName,
    typeof this.ingestSessionEntry.zoSchema.shape,
    IngestEmitContext,
    DomainQS,
    DomainsQS
  >(
    this.ingestSessionEntry.tableName,
    this.ingestSessionEntry.zoSchema.shape,
  );
  readonly ingestSessionStateCRF = SQLa.tableColumnsRowFactory<
    typeof this.ingestSessionState.tableName,
    typeof this.ingestSessionState.zoSchema.shape,
    IngestEmitContext,
    DomainQS,
    DomainsQS
  >(
    this.ingestSessionState.tableName,
    this.ingestSessionState.zoSchema.shape,
  );
  readonly ingestSessionIssueCRF = SQLa.tableColumnsRowFactory<
    typeof this.ingestSessionIssue.tableName,
    typeof this.ingestSessionIssue.zoSchema.shape,
    IngestEmitContext,
    DomainQS,
    DomainsQS
  >(
    this.ingestSessionIssue.tableName,
    this.ingestSessionIssue.zoSchema.shape,
  );

  constructor(readonly deterministicPKs: boolean) {
  }

  // type-safe wrapper for all SQL text generated in this library;
  // we call it `SQL` so that VS code extensions like frigus02.vscode-sql-tagged-template-literals
  // properly syntax-highlight code inside SQL`xyz` strings.
  get SQL() {
    return SQLa.SQL<IngestEmitContext>(this.stsOptions);
  }

  // type-safe wrapper for all SQL that should not be treated as SQL statements
  // but as arbitrary text to send to the SQL stream
  sqlBehavior(
    sts: SQLa.SqlTextSupplier<IngestEmitContext>,
  ): SQLa.SqlTextBehaviorSupplier<IngestEmitContext> {
    return {
      executeSqlBehavior: () => sts,
    };
  }

  viewDefn<ViewName extends string, DomainQS extends SQLa.SqlDomainQS>(
    viewName: ViewName,
  ) {
    return SQLa.viewDefinition<ViewName, IngestEmitContext, DomainQS>(
      viewName,
      {
        isIdempotent: true,
        embeddedStsOptions: this.gts.ddlOptions,
        before: (viewName) => SQLa.dropView(viewName),
      },
    );
  }

  toSnakeCase(str: string) {
    return str
      .replace(/\.([a-zA-Z0-9])/g, "_$1") // Replace dots with underscores
      .replace(/\-/g, "_") // Replace hyphens with underscores
      .replace(/([A-Z])/g, "_$1") // Add underscores before capital letters
      .toLowerCase() // Convert to lower case
      .replace(/^_+|_+$/g, "") // Remove leading and trailing underscores
      .replace(/__+/g, "_"); // Replace multiple underscores with a single one
  }

  #sessionDML?: Awaited<ReturnType<IngestGovernance["ingestSessionSqlDML"]>>;

  async ingestSessionSqlDML(): Promise<
    & { readonly sessionID: string }
    & SQLa.SqlTextSupplier<IngestEmitContext>
  > {
    if (!this.#sessionDML) {
      const sessionID = await this.emitCtx.newUUID(this.deterministicPKs);
      this.#sessionDML = {
        sessionID,
        ...this.ingestSessionCRF.insertDML({ ingest_session_id: sessionID }),
      };
    }
    return this.#sessionDML;
  }
}

export class IngestAssuranceRules implements a.AssuranceRulesGovernance {
  readonly rules: ReturnType<typeof a.typicalAssuranceRules<IngestEmitContext>>;

  constructor(
    readonly sessionID: string,
    readonly sessionEntryID: string,
    readonly govn: IngestGovernance,
  ) {
    this.rules = a.typicalAssuranceRules<IngestEmitContext>(
      this,
      this.govn.SQL,
    );
  }

  insertIssueCtePartial(
    from: string,
    typeText: string,
    messageSql: string,
    remediationSql?: string,
  ) {
    return ws.unindentWhitespace(`
      INSERT INTO ingest_session_issue (ingest_session_issue_id, session_id, session_entry_id, issue_type, issue_message, remediation)
          SELECT uuid(),
                 '${this.sessionID}',
                 '${this.sessionEntryID}',
                 '${typeText}',
                 ${messageSql},
                 ${remediationSql ?? "NULL"}
            FROM ${from}`);
  }

  insertRowValueIssueCtePartial(
    from: string,
    typeText: string,
    rowNumSql: string,
    columnNameSql: string,
    valueSql: string,
    messageSql: string,
    remediationSql?: string,
  ) {
    return ws.unindentWhitespace(`
      INSERT INTO ingest_session_issue (ingest_session_issue_id, session_id, session_entry_id, issue_type, issue_row, issue_column, invalid_value, issue_message, remediation)
          SELECT uuid(),
                 '${this.sessionID}',
                 '${this.sessionEntryID}',
                 '${typeText}',
                 ${rowNumSql},
                 ${columnNameSql},
                 ${valueSql},
                 ${messageSql},
                 ${remediationSql ?? "NULL"}
            FROM ${from}`);
  }
}

export class IngestTableAssuranceRules<TableName extends string>
  extends IngestAssuranceRules {
  readonly tableRules: ReturnType<
    typeof a.typicalTableAssuranceRules<TableName, IngestEmitContext>
  >;

  constructor(
    readonly tableName: TableName,
    readonly sessionID: string,
    readonly sessionEntryID: string,
    readonly govn: IngestGovernance,
  ) {
    super(sessionID, sessionEntryID, govn);
    this.tableRules = a.typicalTableAssuranceRules<
      TableName,
      IngestEmitContext
    >(
      tableName,
      this,
      this.govn.SQL,
    );
  }
}

export type IngestSqlRegistrationExecution =
  | "before-init"
  | "after-init"
  | "before-finalize"
  | "after-finalize";

export interface IngestSqlRegister {
  readonly catalog: Record<
    IngestSqlRegistrationExecution,
    Iterable<SQLa.SqlTextSupplier<IngestEmitContext>>
  >;
  readonly register: (
    sts: SQLa.SqlTextSupplier<IngestEmitContext>,
    execute: IngestSqlRegistrationExecution,
  ) => void;
}

export function ingestSqlRegister(): IngestSqlRegister {
  const catalog: Record<
    IngestSqlRegistrationExecution,
    SQLa.SqlTextSupplier<IngestEmitContext>[]
  > = {
    "before-init": [],
    "after-init": [],
    "before-finalize": [],
    "after-finalize": [],
  };

  return {
    catalog,
    register: (sts, execute) => {
      catalog[execute].push(sts);
    },
  };
}

export class IngestResumableError extends Error {
  constructor(readonly issue: string, cause?: Error) {
    super(issue);
    if (cause) this.cause = cause;
  }
}

export interface IngestArgs<Governance extends IngestGovernance, Notebook> {
  readonly sqlRegister: IngestSqlRegister;
  readonly emitDagPuml?:
    | ((puml: string, previewUrl: string) => Promise<void>)
    | undefined;
}

export interface IngestInit<
  Governance extends IngestGovernance,
  Notebook,
  Args extends IngestArgs<Governance, Notebook>,
> {
  readonly govn: Governance;
  readonly newInstance: (
    govn: IngestGovernance,
    args: Args,
  ) => Notebook | Promise<Notebook>;
}

export async function ingest<
  Governance extends IngestGovernance,
  Notebook,
  Args extends IngestArgs<Governance, Notebook>,
>(
  prototype: Notebook,
  descriptor: chainNB.NotebookDescriptor<
    Notebook,
    chainNB.NotebookCell<Notebook, chainNB.NotebookCellID<Notebook>>
  >,
  init: IngestInit<Governance, Notebook, Args>,
  args: Args,
) {
  const kernel = chainNB.ObservableKernel.create<Notebook>(
    prototype,
    descriptor,
  );
  if (
    args.emitDagPuml || !kernel.isValid() || kernel.lintResults.length > 0
  ) {
    // In case the ingestion engine created circular or other invalid states
    // show the state diagram as a PlantUML URL to visualize the error(s).
    const pe = await import("npm:plantuml-encoder");
    const diagram = kernel.introspectedNB.dagOps.diagram(
      kernel.introspectedNB.graph,
    );
    const previewURL = `http://www.plantuml.com/plantuml/svg/${
      pe.encode(diagram)
    }`;

    await args.emitDagPuml?.(diagram, previewURL);

    if (!kernel.isValid() || kernel.lintResults.length > 0) {
      console.error("Invalid Kernel, inspect the DAG:");
      console.log(previewURL);
      return;
    }
  }

  const { govn } = init;
  const workflow = await init.newInstance(govn, args);
  const initRunState = await kernel.initRunState();
  const { runState: { eventEmitter: rsEE } } = initRunState;
  const sessionID = (await govn.ingestSessionSqlDML()).sessionID;
  const { sqlRegister } = args;

  const registerStateChange = async (
    fromState: string,
    toState: string,
    elaboration?: string,
  ) => {
    sqlRegister.register(
      govn.ingestSessionStateCRF.insertDML({
        ingest_session_state_id: await govn.emitCtx.newUUID(
          govn.deterministicPKs,
        ),
        session_id: sessionID,
        from_state: fromState,
        to_state: toState,
        transitioned_at: govn.emitCtx.newCurrentTimestamp,
        elaboration,
      }),
      "before-finalize",
    );
  };

  rsEE.initNotebook = (_ctx) => {
    // TODO: any reason to record this state change?
  };
  rsEE.beforeCell = (cell, ctx) => {
    registerStateChange(
      ctx.previous ? `EXIT(${String(ctx.previous.current.nbCellID)})` : "NONE",
      `ENTER(${cell})`,
    );
  };
  rsEE.afterInterrupt = (cell, _ctx) => {
    registerStateChange(`ENTER(${cell})`, `INTERRUPTED(${cell})`);
  };
  rsEE.afterError = (cell, error, _ctx) => {
    registerStateChange(
      `ENTER(${cell})`,
      `ERROR(${cell})`,
      JSON.stringify(
        {
          name: error.name,
          error: error.toString(),
          cause: error.cause,
          stack: error.stack,
        },
        null,
        "  ",
      ),
    );
    if (error instanceof IngestResumableError) return "continue";

    // unless the error is resumable, show error and abort
    console.error(`[Non-resumable issue in '${cell}']`, error);
    return "abort";
  };
  rsEE.afterCell = (cell, _result, _ctx) => {
    registerStateChange(`ENTER(${cell})`, `EXIT(${cell})`);
  };
  rsEE.finalizeNotebook = (_ctx) => {
    // TODO: add final state change?
  };

  // now that everything is setup, execute
  await kernel.run(workflow, initRunState);
}
