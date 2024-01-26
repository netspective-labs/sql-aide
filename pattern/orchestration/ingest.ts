import { fs } from "./deps.ts";
import * as SQLa from "../../render/mod.ts";
import * as g from "./governance.ts";
import * as nb from "./notebook.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type State = `ENTER(${string})` | `EXIT(${string})`;

export interface IngestSourceStructAssuranceContext<
  InitState extends State,
  EmitContext extends g.OrchEmitContext,
> {
  readonly initState: () => InitState;
  readonly sessionEntryInsertDML: () =>
    | Promise<
      ReturnType<
        g.OrchGovernance<EmitContext>["orchSessionEntryCRF"]["insertDML"]
      >
    >
    | ReturnType<
      g.OrchGovernance<EmitContext>["orchSessionEntryCRF"]["insertDML"]
    >;
  readonly issueInsertDML: (message: string, nature?: string) =>
    | Promise<
      ReturnType<
        g.OrchGovernance<EmitContext>["orchSessionIssueCRF"]["insertDML"]
      >
    >
    | ReturnType<
      g.OrchGovernance<EmitContext>["orchSessionIssueCRF"]["insertDML"]
    >;
}

export interface IngestableResource<
  Governance extends g.OrchGovernance<EmitContext>,
  InitState extends State,
  TerminalState extends State,
  EmitContext extends g.OrchEmitContext,
> {
  readonly uri: string;
  readonly nature: string;
  readonly workflow: (
    session: nb.OrchSession<Governance, EmitContext>,
    sessionEntryID: string,
  ) => Promise<{
    readonly ingestSQL: (
      issac: IngestSourceStructAssuranceContext<InitState, EmitContext>,
    ) =>
      | Promise<SQLa.SqlTextSupplier<EmitContext>>
      | SQLa.SqlTextSupplier<EmitContext>;
    readonly assuranceSQL: () =>
      | Promise<SQLa.SqlTextSupplier<EmitContext>>
      | SQLa.SqlTextSupplier<EmitContext>;
    readonly exportResourceSQL: (targetSchema: string) =>
      | Promise<SQLa.SqlTextSupplier<EmitContext>>
      | SQLa.SqlTextSupplier<EmitContext>;
    readonly terminalState: () => TerminalState;
  }>;
}

export interface InvalidIngestSource<
  Governance extends g.OrchGovernance<EmitContext>,
  InitState extends State,
  TerminalState extends State,
  EmitContext extends g.OrchEmitContext,
> extends
  IngestableResource<Governance, InitState, TerminalState, EmitContext> {
  readonly nature: "ERROR";
  readonly error: Error;
  readonly tableName: string;
}

export interface CsvFileIngestSource<
  TableName extends string,
  Governance extends g.OrchGovernance<EmitContext>,
  InitState extends State,
  TerminalState extends State,
  EmitContext extends g.OrchEmitContext,
> extends
  IngestableResource<Governance, InitState, TerminalState, EmitContext> {
  readonly nature: "CSV";
  readonly tableName: TableName;
}

export interface ExcelSheetIngestSource<
  SheetName extends string,
  TableName extends string,
  Governance extends g.OrchGovernance<EmitContext>,
  InitState extends State,
  TerminalState extends State,
  EmitContext extends g.OrchEmitContext,
> extends
  IngestableResource<Governance, InitState, TerminalState, EmitContext> {
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

export class ErrorIngestSource<
  Governance extends g.OrchGovernance<EmitContext>,
  InitState extends State,
  EmitContext extends g.OrchEmitContext,
> implements
  InvalidIngestSource<
    Governance,
    InitState,
    "EXIT(ErrorIngestSource)",
    EmitContext
  > {
  readonly nature = "ERROR";
  readonly tableName = "ERROR";
  constructor(
    readonly uri: string,
    readonly error: Error,
    readonly issueType: string,
    readonly govn: Governance,
  ) {
  }

  // deno-lint-ignore require-await
  async workflow(): ReturnType<
    InvalidIngestSource<
      Governance,
      InitState,
      "EXIT(ErrorIngestSource)",
      EmitContext
    >["workflow"]
  > {
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
      terminalState: () => "EXIT(ErrorIngestSource)",
    };
  }
}
