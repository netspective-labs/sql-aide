import { dax, fs, uuid, yaml } from "./deps.ts";
import * as chainNB from "../../../lib/notebook/chain-of-responsibility.ts";
import * as qs from "../../../lib/quality-system/mod.ts";
import * as ws from "../../../lib/universal/whitespace.ts";
import * as sysInfo from "../../../lib/universal/sys-info.ts";
import * as SQLa from "../../../render/mod.ts";
import * as tp from "../../typical/mod.ts";
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
  readonly sessionEntryInsertDML: () =>
    | Promise<
      ReturnType<OrchGovernance["orchSessionEntryCRF"]["insertDML"]>
    >
    | ReturnType<OrchGovernance["orchSessionEntryCRF"]["insertDML"]>;
  readonly issueInsertDML: (message: string, nature?: string) =>
    | Promise<
      ReturnType<OrchGovernance["orchSessionIssueCRF"]["insertDML"]>
    >
    | ReturnType<OrchGovernance["orchSessionIssueCRF"]["insertDML"]>;
}

export interface IngestableResource {
  readonly uri: string;
  readonly nature: string;
  readonly workflow: (sessionID: string, sessionEntryID: string) => {
    readonly ingestSQL: (
      issac: IngestSourceStructAssuranceContext,
    ) =>
      | Promise<SQLa.SqlTextSupplier<OrchEmitContext>>
      | SQLa.SqlTextSupplier<OrchEmitContext>;
    readonly assuranceSQL: () =>
      | Promise<SQLa.SqlTextSupplier<OrchEmitContext>>
      | SQLa.SqlTextSupplier<OrchEmitContext>;
    readonly exportResourceSQL: (targetSchema: string) =>
      | Promise<SQLa.SqlTextSupplier<OrchEmitContext>>
      | SQLa.SqlTextSupplier<OrchEmitContext>;
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

export interface IngestSourcesSupplier<
  PotentialIngestSource,
  Args extends Any[] = [],
> {
  readonly sources: (...args: Args) =>
    | Promise<Iterable<PotentialIngestSource>>
    | Iterable<PotentialIngestSource>;
}

export interface IngestFsPatternSourcesSupplier<PotentialIngestSource>
  extends IngestSourcesSupplier<PotentialIngestSource, [fs.WalkEntry]> {
  readonly pattern: RegExp;
  readonly sources: (entry: fs.WalkEntry) =>
    | Promise<Iterable<PotentialIngestSource>>
    | Iterable<PotentialIngestSource>;
}

export class ErrorIngestSource implements InvalidIngestSource {
  readonly nature = "ERROR";
  readonly tableName = "ERROR";
  constructor(
    readonly uri: string,
    readonly error: Error,
    readonly issueType: string,
    readonly govn: OrchGovernance,
  ) {
  }

  workflow(): ReturnType<InvalidIngestSource["workflow"]> {
    return {
      ingestSQL: async (issac) =>
        // deno-fmt-ignore
        this.govn.SQL`
           -- required by IngestEngine, setup the ingestion entry for logging
           ${await issac.sessionEntryInsertDML()}
           ${await issac.issueInsertDML(this.error.message, this.issueType)}`,
      assuranceSQL: () =>
        this.govn.SQL`
          -- error: ${this.error.message}
        `,
      exportResourceSQL: (targetSchema) =>
        this.govn.SQL`
          -- error: ${this.error.message} exportResourceSQL(${targetSchema})
        `,
    };
  }
}

export class OrchEmitContext implements SQLa.SqlEmitContext {
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
  get newCurrentTimestamp(): SQLa.SqlTextSupplier<OrchEmitContext> {
    return {
      SQL: () => {
        const now = new Date();
        // deno-fmt-ignore
        return `make_timestamp(${now.getFullYear()}, ${now.getMonth()+1}, ${now.getDay()}, ${now.getHours()}, ${now.getMinutes()}, ${`${now.getSeconds()}.${now.getMilliseconds()}`})`;
      },
    };
  }

  // UUID generator when the value is needed by the SQLite engine runtime
  get sqlEngineNewUUID(): SQLa.SqlTextSupplier<OrchEmitContext> {
    return { SQL: () => `uuid()` };
  }

  get onConflictDoNothing(): SQLa.SqlTextSupplier<OrchEmitContext> {
    return { SQL: () => `ON CONFLICT DO NOTHING` };
  }

  get sqlEngineNow(): SQLa.SqlTextSupplier<OrchEmitContext> {
    return { SQL: () => `CURRENT_TIMESTAMP` };
  }
}

export class OrchGovernance {
  readonly emitCtx = new OrchEmitContext();
  readonly gk = tp.governedKeys<DomainQS, DomainsQS, OrchEmitContext>();
  readonly gd = tp.governedDomains<DomainQS, DomainsQS, OrchEmitContext>();
  readonly gts = tp.governedTemplateState<
    DomainQS,
    DomainsQS,
    OrchEmitContext
  >();
  readonly gm = tp.governedModel<DomainQS, DomainsQS, OrchEmitContext>(
    this.gts.ddlOptions,
  );
  readonly stsOptions = SQLa.typicalSqlTextSupplierOptions<OrchEmitContext>();
  readonly primaryKey = this.gk.uuidPrimaryKey;

  readonly device = SQLa.tableDefinition("device", {
    device_id: this.primaryKey(),
    name: this.gd.text(),
    state: this.gd.jsonText(),
    boundary: this.gd.text(),
    segmentation: this.gd.jsonTextNullable(),
    state_sysinfo: this.gd.jsonTextNullable(),
    elaboration: this.gd.jsonTextNullable(),
  }, {
    isIdempotent: true,
    constraints: (props, tableName) => {
      const c = SQLa.tableConstraints(tableName, props);
      return [
        c.unique("name", "state", "boundary"),
      ];
    },
    indexes: (props, tableName) => {
      const tif = SQLa.tableIndexesFactory(tableName, props);
      return [tif.index({ isIdempotent: true }, "name", "state")];
    },
    populateQS: (t, c) => {
      t.description =
        `Identity, network segmentation, and sysinfo for devices on which resources are found`;
      c.name.description = "unique device identifier (defaults to hostname)";
      c.state.description =
        `should be "SINGLETON" if only one state is allowed, or other tags if multiple states are allowed`;
      c.boundary.description =
        "can be IP address, VLAN, or any other device name differentiator";
      c.segmentation.description = "zero trust or other network segmentation";
      c.state_sysinfo.description =
        "any sysinfo or other state data that is specific to this device (mutable)";
      c.elaboration.description =
        "any elaboration needed for the device (mutable)";
    },
  });

  readonly orchSession = SQLa.tableDefinition("orch_session", {
    orch_session_id: this.primaryKey(),
    device_id: this.device.belongsTo.device_id(),
    orch_started_at: this.gd.createdAt(),
    orch_finished_at: this.gd.dateTimeNullable(),
    elaboration: this.gd.jsonTextNullable(),
  }, {
    isIdempotent: true,
    populateQS: (t, c, _, tableName) => {
      t.description = markdown`
        An orchestration session groups multiple orchestration events for reporting or other purposes`;
      c.orch_session_id.description =
        `${tableName} primary key and internal label (UUID)`;
      c.elaboration.description =
        `JSON governance data (description, documentation, usage, etc. in JSON)`;
    },
  });

  readonly orchSessionEntry = SQLa.tableDefinition("orch_session_entry", {
    orch_session_entry_id: this.primaryKey(),
    session_id: this.orchSession.belongsTo.orch_session_id(),
    ingest_src: this.gd.text(),
    ingest_table_name: this.gd.text().optional(),
    elaboration: this.gd.jsonTextNullable(),
  }, {
    isIdempotent: true,
    populateQS: (t, c, _, tableName) => {
      t.description = markdown`
        An orchestration session entry records a specific file that that is ingested or otherwise orchestrated`;
      c.orch_session_entry_id.description =
        `${tableName} primary key and internal label (UUID)`;
      c.session_id.description =
        `${this.orchSession.tableName} row this entry describes`;
      c.ingest_src.description =
        `The name of the file or URI of the source of the ingestion`;
      c.ingest_table_name.description =
        `If the ingestion was done into a temp or actual table, this is the table name`;
      c.elaboration.description =
        `JSON governance data (description, documentation, usage, etc. in JSON)`;
    },
  });

  readonly orchSessionState = SQLa.tableDefinition("orch_session_state", {
    orch_session_state_id: this.primaryKey(),
    session_id: this.orchSession.belongsTo.orch_session_id(),
    session_entry_id: this.orchSessionEntry.belongsTo
      .orch_session_entry_id().optional(),
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
        c.unique("orch_session_state_id", "from_state", "to_state"),
      ];
    },
    populateQS: (t, c, _, tableName) => {
      t.description = markdown`
        Records the state of an orchestration session, computations, and results for Kernels that are stateful.
        For example, a SQL Notebook Cell that creates tables should only be run once (meaning it's stateful).
        Other Kernels might store results for functions and output defined in one cell can be used in later cells.`;
      c.orch_session_state_id.description = `${tableName} primary key`;
      c.session_id.description =
        `${this.orchSession.tableName} row this state describes`;
      c.session_entry_id.description =
        `${this.orchSessionEntry.tableName} row this state describes (optional)`;
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

  readonly orch_session_exec_id = this.primaryKey();
  readonly orchSessionExec = SQLa.tableDefinition("orch_session_exec", {
    orch_session_exec_id: this.orch_session_exec_id,
    exec_nature: this.gd.text(),
    session_id: this.orchSession.belongsTo.orch_session_id(),
    session_entry_id: this.orchSessionEntry.belongsTo
      .orch_session_entry_id().optional(),
    parent_exec_id: this.gd.selfRef(this.orch_session_exec_id).optional(),
    namespace: this.gd.textNullable(),
    exec_identity: this.gd.textNullable(),
    exec_code: this.gd.text(),
    exec_status: this.gd.integer(),
    input_text: this.gd.textNullable(),
    exec_error_text: this.gd.textNullable(),
    output_text: this.gd.textNullable(),
    output_nature: this.gd.jsonTextNullable(),
    narrative_md: this.gd.textNullable(),
    elaboration: this.gd.jsonTextNullable(),
  }, {
    isIdempotent: true,
    populateQS: (t, c, _, tableName) => {
      t.description = markdown`
        Records the state of an orchestration session command or other execution.`;
      c.exec_nature.description =
        `the nature of ${tableName} row (e.g. shell, SQL, etc.)`;
      c.orch_session_exec_id.description = `${tableName} primary key`;
      c.session_id.description =
        `${this.orchSession.tableName} row this state describes`;
      c.session_entry_id.description =
        `${this.orchSessionEntry.tableName} row this state describes (optional)`;
      c.parent_exec_id.description =
        `if this row is a child of a parent execution`;
      c.namespace.description = `an arbitrary grouping strategy`;
      c.exec_identity.description = `an arbitrary identity of this execution`;
      c.exec_code.description = `the shell command, SQL or other code executed`;
      c.input_text.description =
        `if STDIN or other technique to send in content was used`;
      c.exec_status.description = `numerical description of result`;
      c.exec_error_text.description = `text representation of error from exec`;
      c.output_text.description = `STDOUT or other result in text format`;
      c.output_nature.description = `hints about the nature of the output`;
      c.narrative_md.description =
        `a block of Markdown text with human-friendly narrative of execution`;
      c.elaboration.description = `any elaboration needed for the execution`;
    },
  });

  readonly orchSessionIssue = SQLa.tableDefinition(
    "orch_session_issue",
    {
      orch_session_issue_id: this.gk.uuidPrimaryKey(),
      session_id: this.orchSession.belongsTo.orch_session_id(),
      session_entry_id: this.orchSessionEntry.belongsTo
        .orch_session_entry_id().optional(),
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
          An orchestration issue is generated when an error or warning needs to
          be created during the orchestration of an entry in a session.`;
        c.orch_session_issue_id.description =
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
    },
  );

  readonly informationSchema = {
    adminTables: [
      this.device,
      this.orchSession,
      this.orchSessionEntry,
      this.orchSessionState,
      this.orchSessionExec,
      this.orchSessionIssue,
    ],
    adminTableIndexes: [
      ...this.device.indexes,
      ...this.orchSession.indexes,
      ...this.orchSessionEntry.indexes,
      ...this.orchSessionState.indexes,
      ...this.orchSessionExec.indexes,
      ...this.orchSessionIssue.indexes,
    ],
  };

  readonly deviceCRF = SQLa.tableColumnsRowFactory<
    typeof this.device.tableName,
    typeof this.device.zoSchema.shape,
    OrchEmitContext,
    DomainQS,
    DomainsQS
  >(
    this.device.tableName,
    this.device.zoSchema.shape,
  );

  readonly orchSessionCRF = SQLa.tableColumnsRowFactory<
    typeof this.orchSession.tableName,
    typeof this.orchSession.zoSchema.shape,
    OrchEmitContext,
    DomainQS,
    DomainsQS
  >(
    this.orchSession.tableName,
    this.orchSession.zoSchema.shape,
  );

  readonly orchSessionEntryCRF = SQLa.tableColumnsRowFactory<
    typeof this.orchSessionEntry.tableName,
    typeof this.orchSessionEntry.zoSchema.shape,
    OrchEmitContext,
    DomainQS,
    DomainsQS
  >(
    this.orchSessionEntry.tableName,
    this.orchSessionEntry.zoSchema.shape,
  );

  readonly orchSessionStateCRF = SQLa.tableColumnsRowFactory<
    typeof this.orchSessionState.tableName,
    typeof this.orchSessionState.zoSchema.shape,
    OrchEmitContext,
    DomainQS,
    DomainsQS
  >(
    this.orchSessionState.tableName,
    this.orchSessionState.zoSchema.shape,
  );

  readonly orchSessionExecCRF = SQLa.tableColumnsRowFactory<
    typeof this.orchSessionExec.tableName,
    typeof this.orchSessionExec.zoSchema.shape,
    OrchEmitContext,
    DomainQS,
    DomainsQS
  >(
    this.orchSessionExec.tableName,
    this.orchSessionExec.zoSchema.shape,
  );

  readonly orchSessionIssueCRF = SQLa.tableColumnsRowFactory<
    typeof this.orchSessionIssue.tableName,
    typeof this.orchSessionIssue.zoSchema.shape,
    OrchEmitContext,
    DomainQS,
    DomainsQS
  >(
    this.orchSessionIssue.tableName,
    this.orchSessionIssue.zoSchema.shape,
  );

  // the following allow for type-safe access to table/columns names/symbols

  readonly tableNames = {
    [this.device.tableName]: this.device.tableName,
    [this.orchSession.tableName]: this.orchSession.tableName,
    [this.orchSessionEntry.tableName]: this.orchSessionEntry.tableName,
    [this.orchSessionState.tableName]: this.orchSessionState.tableName,
    [this.orchSessionExec.tableName]: this.orchSessionExec.tableName,
    [this.orchSessionIssue.tableName]: this.orchSessionIssue.tableName,
  };

  readonly columnNames = {
    [this.device.tableName]: this.device.columnNames,
    [this.orchSession.tableName]: this.orchSession.columnNames,
    [this.orchSessionEntry.tableName]: this.orchSessionEntry.columnNames,
    [this.orchSessionState.tableName]: this.orchSessionState.columnNames,
    [this.orchSessionExec.tableName]: this.orchSessionExec.columnNames,
    [this.orchSessionIssue.tableName]: this.orchSessionIssue.columnNames,
  };

  constructor(readonly deterministicPKs: boolean) {
  }

  // type-safe wrapper for all SQL text generated in this library;
  // we call it `SQL` so that VS code extensions like frigus02.vscode-sql-tagged-template-literals
  // properly syntax-highlight code inside SQL`xyz` strings.
  get SQL() {
    return SQLa.SQL<OrchEmitContext>(this.stsOptions);
  }

  // type-safe wrapper for all SQL that should not be treated as SQL statements
  // but as arbitrary text to send to the SQL stream
  sqlBehavior(
    sts: SQLa.SqlTextSupplier<OrchEmitContext>,
  ): SQLa.SqlTextBehaviorSupplier<OrchEmitContext> {
    return {
      executeSqlBehavior: () => sts,
    };
  }

  viewDefn<ViewName extends string, DomainQS extends SQLa.SqlDomainQS>(
    viewName: ViewName,
  ) {
    return SQLa.viewDefinition<ViewName, OrchEmitContext, DomainQS>(
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
}

export class DuckDbShell {
  readonly diagnostics: ReturnType<
    OrchGovernance["orchSessionExecCRF"]["insertDML"]
  >[] = [];
  constructor(
    readonly session: OrchSession,
    readonly args: {
      readonly duckdbCmd: string;
      readonly dbDestFsPathSupplier: (identity?: string) => string;
    } = {
      duckdbCmd: "duckdb",
      dbDestFsPathSupplier: () => ":memory:",
    },
  ) {
  }

  sqlNarrativeMarkdown(
    sql: string,
    status: dax.CommandResult,
    stdoutFmt?: (stdout: string) => { fmt: string; content: string },
  ) {
    const markdown: string[] = [`\`\`\`sql\n${sql}\n\`\`\`\n`];
    if (status.stdout) {
      markdown.push("### stdout");
      const stdout = stdoutFmt?.(status.stdout) ??
        ({ fmt: "sh", content: status.stdout });
      markdown.push(
        `\`\`\`${stdout.fmt}\n${stdout.content}\n\`\`\``,
      );
    }
    if (status.stderr) {
      markdown.push("### stderr");
      markdown.push(`\`\`\`sh\n${status.stderr}\n\`\`\``);
    }
    return markdown;
  }

  async writeDiagnosticsSqlMD(
    sql: string,
    status: dax.CommandResult,
    dir?: string,
  ) {
    const diagsTmpFile = await Deno.makeTempFile({
      dir: dir ?? Deno.cwd(),
      prefix: "ingest-diags-initDDL-",
      suffix: ".sql.md",
    });
    // deno-fmt-ignore
    await Deno.writeTextFile(diagsTmpFile, `---\n${yaml.stringify({ code: status.code })}---\n${this.sqlNarrativeMarkdown(sql, status).join("\n")}`);
    return diagsTmpFile;
  }

  async execDiag(
    init: {
      exec_code: string;
      sql: string;
      exec_identity?: string;
      output_nature?: string;
    },
    status: dax.CommandResult,
  ) {
    const { session, session: { govn }, args: { duckdbCmd } } = this;
    return govn.orchSessionExecCRF.insertDML({
      ...init,
      orch_session_exec_id: await govn.emitCtx.newUUID(govn.deterministicPKs),
      exec_nature: duckdbCmd,
      exec_status: status.code,
      input_text: init.sql,
      exec_error_text: status.stderr && status.stderr.length
        ? status.stderr
        : undefined,
      output_text: status.stdout && status.stdout.length
        ? status.stdout
        : undefined,
      session_id: (await session.orchSessionSqlDML()).sessionID,
      narrative_md: this.sqlNarrativeMarkdown(init.sql, status).join("\n"),
    });
  }

  async execute(sql: string, identity?: string) {
    const { args: { duckdbCmd, dbDestFsPathSupplier } } = this;
    const dbDestFsPath = dbDestFsPathSupplier(identity);
    const status = await dax.$`${duckdbCmd} ${dbDestFsPath}`
      .stdout("piped")
      .stderr("piped")
      .stdinText(sql)
      .noThrow();
    const diag = await this.execDiag({
      exec_identity: identity,
      exec_code: `${duckdbCmd} ${dbDestFsPath}`,
      sql,
    }, status);
    this.diagnostics.push(diag);
    return { status, diag };
  }

  async jsonResult<Row>(sql: string, identity?: string) {
    const { args: { duckdbCmd, dbDestFsPathSupplier } } = this;
    const dbDestFsPath = dbDestFsPathSupplier(identity);
    const status = await dax.$`${duckdbCmd} ${dbDestFsPath} --json`
      .stdout("piped")
      .stderr("piped")
      .stdinText(sql)
      .noThrow();
    const stdout = status.stdout;
    const diag = await this.execDiag({
      exec_identity: identity,
      exec_code: `${duckdbCmd} ${dbDestFsPath} --json`,
      sql,
      output_nature: "JSON",
    }, status);
    this.diagnostics.push(diag);
    return {
      status,
      diag,
      json: (stdout && stdout.trim().length > 0)
        ? (JSON.parse(stdout) as Row[])
        : undefined,
    };
  }

  async emitDiagnostics(options: {
    readonly emitJson?: ((json: string) => Promise<void>) | undefined;
    readonly diagsMd?: {
      readonly emit: (md: string) => Promise<void>;
      readonly frontmatter?: Record<string, unknown>;
    } | undefined;
  }) {
    const { emitJson, diagsMd } = options;

    await emitJson?.(JSON.stringify(this.diagnostics, null, "  "));

    if (diagsMd) {
      const md: string[] = [
        "---",
        yaml.stringify(diagsMd.frontmatter ?? this.args) + "---",
        "# Orchestration Diagnostics",
      ];
      for (const d of this.diagnostics) {
        if (Array.isArray(d.insertable)) {
          for (const i of d.insertable) {
            md.push(`\n## ${i.exec_identity}`);
            md.push(`${i.narrative_md}`);
          }
        } else {
          md.push(`\n## ${d.insertable.exec_identity}`);
          md.push(`${d.insertable.narrative_md}`);
        }
      }
      await diagsMd.emit(md.join("\n"));
    }
  }
}

export type OrchSqlRegistrationExecution =
  | "before-init"
  | "after-init"
  | "before-finalize"
  | "after-finalize";

export class OrchSession {
  protected deviceDmlSingleton?: Awaited<
    ReturnType<OrchSession["deviceSqlDML"]>
  >;
  protected sessionDmlSingleton?: Awaited<
    ReturnType<OrchSession["orchSessionSqlDML"]>
  >;
  readonly stateChangesDML: ReturnType<
    OrchGovernance["orchSessionStateCRF"]["insertDML"]
  >[] = [];

  constructor(
    readonly govn: OrchGovernance,
    readonly sqlCatalog: Record<
      OrchSqlRegistrationExecution,
      SQLa.SqlTextSupplier<OrchEmitContext>[]
    > = {
      "before-init": [],
      "after-init": [],
      "before-finalize": [],
      "after-finalize": [],
    },
  ) {
  }

  sqlCatalogSqlText(exec: OrchSqlRegistrationExecution) {
    switch (exec) {
      // before-finalize should include all state changes SQL as well
      case "before-finalize":
        return [...this.sqlCatalog[exec], ...this.stateChangesDML].map((dml) =>
          dml.SQL(this.govn.emitCtx)
        );

      default:
        return this.sqlCatalog[exec].map((dml) => dml.SQL(this.govn.emitCtx));
    }
  }

  sqlCatalogSqlSuppliers(exec: OrchSqlRegistrationExecution) {
    return this.sqlCatalog[exec];
  }

  async deviceSqlDML(): Promise<
    & { readonly deviceID: string }
    & SQLa.SqlTextSupplier<OrchEmitContext>
  > {
    if (!this.deviceDmlSingleton) {
      const { emitCtx: ctx, deviceCRF, deterministicPKs } = this.govn;
      const deviceID = await ctx.newUUID(deterministicPKs);
      this.deviceDmlSingleton = {
        deviceID,
        ...deviceCRF.insertDML({
          device_id: deviceID,
          name: Deno.hostname(),
          state: "SINGLETON",
          boundary: "UNKNOWN",
          state_sysinfo: JSON.stringify({
            "os-arch": await sysInfo.osArchitecture(),
            "os-platform": sysInfo.osPlatformName(),
            // TODO: add these with e2e synthetic capabilities too (use "synthetic" as device name)
            // "device-ip-addresses": sysInfo.deviceIpAddresses(),
            // "public-ip-addresses": await sysInfo.publicIpAddress(),
            // "home-path": sysInfo.homePath(),
          }),
        }, { onConflict: ctx.onConflictDoNothing }),
      };
    }
    return this.deviceDmlSingleton;
  }

  async orchSessionSqlDML(): Promise<
    & { readonly sessionID: string }
    & SQLa.SqlTextSupplier<OrchEmitContext>
  > {
    if (!this.sessionDmlSingleton) {
      const { emitCtx: ctx, orchSessionCRF, deterministicPKs } = this.govn;
      const device = await this.deviceSqlDML();
      const sessionID = await ctx.newUUID(deterministicPKs);
      this.sessionDmlSingleton = {
        sessionID,
        ...orchSessionCRF.insertDML({
          orch_session_id: sessionID,
          device_id: device.deviceID,
        }),
      };
    }
    return this.sessionDmlSingleton;
  }

  async registerState(
    fromState: string,
    toState: string,
    reason: string,
    elaboration?: string,
  ) {
    const sessionDML = await this.orchSessionSqlDML();
    const { emitCtx: ctx, orchSessionStateCRF, deterministicPKs } = this.govn;
    this.stateChangesDML.push(
      orchSessionStateCRF.insertDML({
        orch_session_state_id: await ctx.newUUID(deterministicPKs),
        session_id: sessionDML.sessionID,
        from_state: fromState,
        to_state: toState,
        transition_reason: reason,
        transitioned_at: ctx.newCurrentTimestamp,
        elaboration,
      }),
    );
  }

  async registerEntryState(
    sessionEntryID: string,
    fromState: string,
    toState: string,
    reason: string,
    elaboration?: string,
  ) {
    const sessionDML = await this.orchSessionSqlDML();
    const { emitCtx: ctx, orchSessionStateCRF, deterministicPKs } = this.govn;
    this.stateChangesDML.push(
      orchSessionStateCRF.insertDML({
        orch_session_state_id: await ctx.newUUID(deterministicPKs),
        session_id: sessionDML.sessionID,
        session_entry_id: sessionEntryID,
        from_state: fromState,
        to_state: toState,
        transition_reason: reason,
        transitioned_at: ctx.newCurrentTimestamp,
        elaboration,
      }),
    );
  }

  /**
   * Prepare a SQL view that combines all the diagnostics into a single
   * denormalized table that can be used to generate a Excel workbook using
   * GDAL (spacial plugin). Notably this means removing duplicate columns
   * and not using timestamptz types (GDAL doesn't support timestamptz).
   * @returns
   */
  diagnosticsView() {
    return this.govn.viewDefn("orch_session_diagnostic_text")`
      SELECT
          -- Including all other columns from 'orch_session'
          ises.* EXCLUDE (orch_started_at, orch_finished_at),
          -- TODO: Casting known timestamp columns to text so emit to Excel works with GDAL (spatial)
             -- strftime(timestamptz orch_started_at, '%Y-%m-%d %H:%M:%S') AS orch_started_at,
             -- strftime(timestamptz orch_finished_at, '%Y-%m-%d %H:%M:%S') AS orch_finished_at,

          -- Including all columns from 'orch_session_entry'
          isee.* EXCLUDE (session_id),

          -- Including all other columns from 'orch_session_issue'
          isi.* EXCLUDE (session_id, session_entry_id)
      FROM orch_session AS ises
      JOIN orch_session_entry AS isee ON ises.orch_session_id = isee.session_id
      LEFT JOIN orch_session_issue AS isi ON isee.orch_session_entry_id = isi.session_entry_id`;
  }
}

export class OrchAssuranceRules implements a.AssuranceRulesGovernance {
  readonly rules: ReturnType<typeof a.typicalAssuranceRules<OrchEmitContext>>;

  constructor(
    readonly sessionID: string,
    readonly sessionEntryID: string,
    readonly govn: OrchGovernance,
  ) {
    this.rules = a.typicalAssuranceRules<OrchEmitContext>(
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
      INSERT INTO orch_session_issue (orch_session_issue_id, session_id, session_entry_id, issue_type, issue_message, remediation)
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
      INSERT INTO orch_session_issue (orch_session_issue_id, session_id, session_entry_id, issue_type, issue_row, issue_column, invalid_value, issue_message, remediation)
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

export class OrchTableAssuranceRules<TableName extends string>
  extends OrchAssuranceRules {
  readonly tableRules: ReturnType<
    typeof a.typicalTableAssuranceRules<TableName, OrchEmitContext>
  >;

  constructor(
    readonly tableName: TableName,
    readonly sessionID: string,
    readonly sessionEntryID: string,
    readonly govn: OrchGovernance,
  ) {
    super(sessionID, sessionEntryID, govn);
    this.tableRules = a.typicalTableAssuranceRules<
      TableName,
      OrchEmitContext
    >(
      tableName,
      this,
      this.govn.SQL,
    );
  }
}

export class OrchResumableError extends Error {
  constructor(readonly issue: string, cause?: Error) {
    super(issue);
    if (cause) this.cause = cause;
  }
}

export interface OrchArgs<Governance extends OrchGovernance, Notebook> {
  readonly session: OrchSession;
  readonly emitDagPuml?:
    | ((puml: string, previewUrl: string) => Promise<void>)
    | undefined;
}

export interface OrchInit<
  Governance extends OrchGovernance,
  Notebook,
  Args extends OrchArgs<Governance, Notebook>,
> {
  readonly govn: Governance;
  readonly newInstance: (
    govn: OrchGovernance,
    args: Args,
  ) => Notebook | Promise<Notebook>;
}

export async function orchestrate<
  Governance extends OrchGovernance,
  Notebook,
  Args extends OrchArgs<Governance, Notebook>,
>(
  prototype: Notebook,
  descriptor: chainNB.NotebookDescriptor<
    Notebook,
    chainNB.NotebookCell<Notebook, chainNB.NotebookCellID<Notebook>>
  >,
  init: OrchInit<Governance, Notebook, Args>,
  args: Args,
) {
  const kernel = chainNB.ObservableKernel.create<Notebook>(
    prototype,
    descriptor,
  );
  if (
    args.emitDagPuml || !kernel.isValid() || kernel.lintResults.length > 0
  ) {
    // In case the orchestration engine created circular or other invalid states
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
  const { session } = args;
  const cellStates: { fromState: string; toState: string }[] = [];

  const registerCellState = async (
    fromState: string,
    toState: string,
    reason: string,
    elaboration?: string,
  ) => {
    // if the the new state change is already registered, skip it
    if (cellStates.length) {
      const active = cellStates[cellStates.length - 1];
      if (active.fromState == fromState && active.toState == toState) return;
    }
    // if we get here it means we're actually changing the state
    await session.registerState(fromState, toState, reason, elaboration);
    cellStates.push({ fromState, toState });
  };

  rsEE.initNotebook = (_ctx) => {
    // TODO: any reason to record this state change?
  };
  rsEE.beforeCell = async (cell, ctx) => {
    await registerCellState(
      ctx.previous ? `EXIT(${String(ctx.previous.current.nbCellID)})` : "NONE",
      `ENTER(${cell})`,
      "rsEE.beforeCell",
    );
  };
  rsEE.afterInterrupt = async (cell, _ctx) => {
    await registerCellState(
      `EXIT(${cell})`,
      `INTERRUPTED(${cell})`,
      "rsEE.afterInterrupt",
    );
  };
  rsEE.afterError = async (cell, error, _ctx) => {
    await registerCellState(
      `EXIT(${cell})`,
      `ERROR(${cell})`,
      "rsEE.afterError",
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
    if (error instanceof OrchResumableError) return "continue";

    // unless the error is resumable, show error and abort
    console.error(`[Non-resumable issue in '${cell}']`, error);
    return "abort";
  };
  rsEE.afterCell = async (cell, _result, ctx) => {
    await registerCellState(
      `EXIT(${cell})`,
      ctx.next ? `ENTER(${String(ctx.next.nbCellID)})` : "NONE",
      "rsEE.afterCell",
    );
  };
  rsEE.finalizeNotebook = (_ctx) => {
    // TODO: add final state change?
  };

  // now that everything is setup, execute
  await kernel.run(workflow, initRunState);
}
