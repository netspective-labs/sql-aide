import * as qs from "../../lib/quality-system/mod.ts";
import * as SQLa from "../../render/mod.ts";
import * as tp from "../typical/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type DomainQS = tp.TypicalDomainQS;
export type DomainsQS = tp.TypicalDomainsQS;

export const markdown = qs.qsMarkdown;

export const DETERMINISTIC_UUID_NAMESPACE =
  "b6c7390a-69ea-4814-ae3e-c0c6ed3a913f";

export interface OrchEmitContext extends SQLa.SqlEmitContext {
  /**
   * UUID generator when the value is needed by the Javascript runtime
   * @param deterministic true if running this in a test or other synthetic environment
   * @returns either a unique deterministic or random string
   */
  readonly newUUID: (deterministic: boolean) => Promise<string>;

  /**
   * Compute the current timestamp and prepare db-specific dialect SQL function
   * which returns the current time from the client (TypeScript).
   * @returns SQL supplier of the Javascript runtime's current time
   */
  readonly newCurrentTimestamp: SQLa.SqlTextSupplier<SQLa.SqlEmitContext>;

  /**
   * Property to pass into insert or other DML when we want to ignore conflicts.
   */
  readonly onConflictDoNothing: SQLa.SqlTextSupplier<SQLa.SqlEmitContext>;
}

export class OrchGovernance<EmitContext extends OrchEmitContext> {
  readonly gk = tp.governedKeys<DomainQS, DomainsQS, EmitContext>();
  readonly gd = tp.governedDomains<DomainQS, DomainsQS, EmitContext>();
  readonly gts = tp.governedTemplateState<
    DomainQS,
    DomainsQS,
    EmitContext
  >();
  readonly gm = tp.governedModel<DomainQS, DomainsQS, EmitContext>(
    this.gts.ddlOptions,
  );
  readonly stsOptions = SQLa.typicalSqlTextSupplierOptions<EmitContext>();
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
    args_json: this.gd.jsonTextNullable(),
    diagnostics_json: this.gd.jsonTextNullable(),
    diagnostics_md: this.gd.textNullable(),
  }, {
    isIdempotent: true,
    populateQS: (t, c, _, tableName) => {
      t.description = markdown`
        An orchestration session groups multiple orchestration events for reporting or other purposes`;
      c.orch_session_id.description =
        `${tableName} primary key and internal label (UUID)`;
      c.elaboration.description =
        `JSON governance data (description, documentation, usage, etc. in JSON)`;
      c.args_json.description =
        `Sesison arguments in a machine-friendly (engine-dependent) JSON format`;
      c.diagnostics_json.description =
        `Diagnostics in a machine-friendly (engine-dependent) JSON format`;
      c.diagnostics_md.description =
        `Diagnostics in a human-friendly readable markdown format`;
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
    EmitContext,
    DomainQS,
    DomainsQS
  >(
    this.device.tableName,
    this.device.zoSchema.shape,
  );

  readonly orchSessionCRF = SQLa.tableColumnsRowFactory<
    typeof this.orchSession.tableName,
    typeof this.orchSession.zoSchema.shape,
    EmitContext,
    DomainQS,
    DomainsQS
  >(
    this.orchSession.tableName,
    this.orchSession.zoSchema.shape,
  );

  readonly orchSessionEntryCRF = SQLa.tableColumnsRowFactory<
    typeof this.orchSessionEntry.tableName,
    typeof this.orchSessionEntry.zoSchema.shape,
    EmitContext,
    DomainQS,
    DomainsQS
  >(
    this.orchSessionEntry.tableName,
    this.orchSessionEntry.zoSchema.shape,
  );

  readonly orchSessionStateCRF = SQLa.tableColumnsRowFactory<
    typeof this.orchSessionState.tableName,
    typeof this.orchSessionState.zoSchema.shape,
    EmitContext,
    DomainQS,
    DomainsQS
  >(
    this.orchSessionState.tableName,
    this.orchSessionState.zoSchema.shape,
  );

  readonly orchSessionExecCRF = SQLa.tableColumnsRowFactory<
    typeof this.orchSessionExec.tableName,
    typeof this.orchSessionExec.zoSchema.shape,
    EmitContext,
    DomainQS,
    DomainsQS
  >(
    this.orchSessionExec.tableName,
    this.orchSessionExec.zoSchema.shape,
  );

  readonly orchSessionIssueCRF = SQLa.tableColumnsRowFactory<
    typeof this.orchSessionIssue.tableName,
    typeof this.orchSessionIssue.zoSchema.shape,
    EmitContext,
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

  constructor(
    readonly emitCtx: EmitContext,
    readonly deterministicPKs: boolean,
  ) {
  }

  // type-safe wrapper for all SQL text generated in this library;
  // we call it `SQL` so that VS code extensions like frigus02.vscode-sql-tagged-template-literals
  // properly syntax-highlight code inside SQL`xyz` strings.
  get SQL() {
    return SQLa.SQL<EmitContext>(this.stsOptions);
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

  viewDefn<ViewName extends string, DomainQS extends SQLa.SqlDomainQS>(
    viewName: ViewName,
  ) {
    return SQLa.viewDefinition<ViewName, EmitContext, DomainQS>(
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
