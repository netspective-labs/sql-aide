import * as chainNB from "../../lib/notebook/chain-of-responsibility.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as sysInfo from "../../lib/universal/sys-info.ts";
import * as SQLa from "../../render/mod.ts";
import * as a from "./assurance.ts";
import * as g from "./governance.ts";

export type OrchSqlRegistrationExecution =
  | "before-init"
  | "after-init"
  | "before-finalize"
  | "after-finalize";

export class OrchSession<
  Governance extends g.OrchGovernance<EmitContext>,
  EmitContext extends g.OrchEmitContext,
> {
  protected deviceDmlSingleton?: Awaited<
    ReturnType<OrchSession<Governance, EmitContext>["deviceSqlDML"]>
  >;
  protected sessionDmlSingleton?: Awaited<
    ReturnType<OrchSession<Governance, EmitContext>["orchSessionSqlDML"]>
  >;
  readonly stateChangesDML: ReturnType<
    g.OrchGovernance<EmitContext>["orchSessionStateCRF"]["insertDML"]
  >[] = [];

  constructor(
    readonly govn: Governance,
    readonly sqlCatalog: Record<
      OrchSqlRegistrationExecution,
      SQLa.SqlTextSupplier<EmitContext>[]
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
    & SQLa.SqlTextSupplier<EmitContext>
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
    & SQLa.SqlTextSupplier<EmitContext>
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
          orch_started_at: this.govn.emitCtx.newCurrentTimestamp,
          // orch_started_at and diagnostics_arg, diagnostics_json, diagnostics_md should be
          // supplied after session is completed
          diagnostics_md:
            `Session ${sessionID} markdown diagnostics not provided (not completed?)`,
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
  constructor(
    readonly sessionID: string,
    readonly sessionEntryID: string,
  ) {}

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

export class OrchResumableError extends Error {
  constructor(readonly issue: string, cause?: Error) {
    super(issue);
    if (cause) this.cause = cause;
  }
}

export interface OrchArgs<
  Governance extends g.OrchGovernance<EmitContext>,
  Notebook,
  EmitContext extends g.OrchEmitContext,
> {
  readonly session: OrchSession<Governance, EmitContext>;
  readonly emitDagPuml?:
    | ((puml: string, previewUrl: string) => Promise<void>)
    | undefined;
}

export interface OrchInit<
  Governance extends g.OrchGovernance<EmitContext>,
  Notebook,
  Args extends OrchArgs<Governance, Notebook, EmitContext>,
  EmitContext extends g.OrchEmitContext,
> {
  readonly govn: Governance;
  readonly newInstance: (
    govn: Governance,
    args: Args,
  ) => Notebook | Promise<Notebook>;
}

export async function orchestrate<
  Governance extends g.OrchGovernance<EmitContext>,
  Notebook,
  Args extends OrchArgs<Governance, Notebook, EmitContext>,
  EmitContext extends g.OrchEmitContext,
>(
  prototype: Notebook,
  descriptor: chainNB.NotebookDescriptor<
    Notebook,
    chainNB.NotebookCell<Notebook, chainNB.NotebookCellID<Notebook>>
  >,
  init: OrchInit<Governance, Notebook, Args, EmitContext>,
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
