import { dax, uuid, yaml } from "./deps.ts";
import * as md from "../../../lib/universal/markdown.ts";
import * as SQLa from "../../../render/mod.ts";
import * as a from "./assurance.ts";
import * as o from "../mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export let deterministicUuidCounter = 0;

export class DuckDbOrchEmitContext implements o.OrchEmitContext {
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
      return await uuid.v5.generate(o.DETERMINISTIC_UUID_NAMESPACE, data);
    }
    return crypto.randomUUID();
  }

  /**
   * Compute the current timestamp and prepare DuckDB SQL
   * @returns SQL supplier of the Javascript runtime's current time
   */
  get jsRuntimeNow(): SQLa.SqlTextSupplier<SQLa.SqlEmitContext> {
    return {
      SQL: () => {
        // DuckDB can parse string in ISO 8601 format
        return `'${new Date().toISOString()}'`;
      },
    };
  }

  // UUID generator when the value is needed by the SQLite engine runtime
  get sqlEngineNewUUID(): SQLa.SqlTextSupplier<DuckDbOrchEmitContext> {
    return { SQL: () => `uuid()` };
  }

  get onConflictDoNothing(): SQLa.SqlTextSupplier<SQLa.SqlEmitContext> {
    return { SQL: () => `ON CONFLICT DO NOTHING` };
  }

  get sqlEngineNow(): SQLa.SqlTextSupplier<SQLa.SqlEmitContext> {
    return { SQL: () => `CURRENT_TIMESTAMP` };
  }
}

export class DuckDbOrchGovernance
  extends o.OrchGovernance<DuckDbOrchEmitContext> {
  constructor(
    deterministicPKs: boolean,
    emitCtx = new DuckDbOrchEmitContext(),
  ) {
    super(emitCtx, deterministicPKs);
  }
}

export class DuckDbShell {
  readonly diagnostics: ReturnType<
    DuckDbOrchGovernance["orchSessionExecCRF"]["insertDML"]
  >[] = [];
  // RegEx to find `-- diagnostics-md-ignore-start "X"` / `-- diagnostics-md-ignore-finish "X"` pairs
  readonly ignoreDiagsSqlMdRegExp = new RegExp(
    /--\s*diagnostics-md-ignore-start\s+"(.+?)"[\s\S]*?--\s*diagnostics-md-ignore-finish\s+"\1"/,
    "gm",
  );
  #diagnosticsMD: md.MarkdownDocument<
    Any,
    ReturnType<typeof md.typicalMarkdownTags>
  >;
  #execIndex = 0;
  #stdErrsEncountered = 0;

  constructor(
    readonly session: o.OrchSession<
      DuckDbOrchGovernance,
      DuckDbOrchEmitContext
    >,
    readonly args: {
      readonly duckdbCmd: string;
      readonly dbDestFsPathSupplier: (identity?: string) => string;
      readonly preambleSQL?: (sql: string, identity?: string) => string;
      readonly diagnosticsMD?: () => md.MarkdownDocument<
        Any,
        ReturnType<typeof md.typicalMarkdownTags>
      >;
    } = {
      duckdbCmd: "duckdb",
      dbDestFsPathSupplier: () => ":memory:",
    },
  ) {
    this.#diagnosticsMD = args.diagnosticsMD?.() ?? new md.MarkdownDocument();
  }

  get stdErrsEncountered() {
    return this.#stdErrsEncountered;
  }

  sqlNarrativeMarkdown(
    ctx: {
      exec_code: string;
      sql: string;
      exec_identity: string;
      output_nature?: string;
    },
    status: dax.CommandResult,
    options: {
      stdoutFmt?: (stdout: string) => { fmt: string; content: string };
    } = {},
  ) {
    const { sql, exec_identity: identity } = ctx;
    const { stdoutFmt = (content) => ({ fmt: "sh", content }) } = options;
    const mdSQL = sql.replaceAll(
      this.ignoreDiagsSqlMdRegExp,
      (_, name) => `-- removed ${name} from diagnostics Markdown`,
    );

    const { h2, h3, code } = this.#diagnosticsMD.tags;
    const stdout = stdoutFmt(status.stdout);
    if (status.stderr) this.#stdErrsEncountered++;

    // deno-fmt-ignore
    const markdown = this.#diagnosticsMD.append`

      ${h2(identity)}

      ${code("sql", mdSQL)}
      ${status.stdout ? (h3(`\`${identity}\` STDOUT (status: \`${status.code}\`)`)) : `No STDOUT emitted by \`${identity}\` (status: \`${status.code}\`).`}
      ${status.stdout ? (code(stdout.fmt, stdout.content)) : ``}
      ${status.stderr ? (h3(`\`${identity}\` STDERR`)) : `No STDERR emitted by \`${identity}\`.`}
      ${status.stderr ? (code("sh", status.stderr)) : ``}
    `;

    return markdown;
  }

  async writeDiagnosticsSqlMD(
    ctx: Parameters<DuckDbShell["sqlNarrativeMarkdown"]>[0],
    status: dax.CommandResult,
    dir?: string,
  ) {
    const diagsTmpFile = await Deno.makeTempFile({
      dir: dir ?? Deno.cwd(),
      prefix: "ingest-diags-initDDL-",
      suffix: ".sql.md",
    });
    // deno-fmt-ignore
    await Deno.writeTextFile(diagsTmpFile, `---\n${yaml.stringify({ code: status.code })}---\n${this.sqlNarrativeMarkdown(ctx, status)}`);
    return diagsTmpFile;
  }

  async execDiag(
    ctx: Parameters<DuckDbShell["sqlNarrativeMarkdown"]>[0],
    status: dax.CommandResult,
    options?: Parameters<DuckDbShell["sqlNarrativeMarkdown"]>[2],
  ) {
    const { session, session: { govn }, args: { duckdbCmd } } = this;
    return govn.orchSessionExecCRF.insertDML({
      ...ctx,
      orch_session_exec_id: await govn.emitCtx.newUUID(govn.deterministicPKs),
      exec_nature: duckdbCmd,
      exec_status: status.code,
      input_text: ctx.sql,
      exec_error_text: status.stderr && status.stderr.length
        ? status.stderr
        : undefined,
      output_text: status.stdout && status.stdout.length
        ? status.stdout
        : undefined,
      session_id: (await session.orchSessionSqlDML()).sessionID,
      narrative_md: this.sqlNarrativeMarkdown(ctx, status, options),
    });
  }

  async execute(sql: string, identity = `execute_${this.#execIndex}`) {
    const { args: { duckdbCmd, dbDestFsPathSupplier, preambleSQL } } = this;
    const dbDestFsPath = dbDestFsPathSupplier(identity);
    if (preambleSQL) {
      // preambleSQL helps prepare the DuckDB environment with configuration SQL
      // e.g. `SET autoload_known_extensions=false;`
      sql = preambleSQL(sql, identity) + sql;
    }
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
    this.#execIndex++;
    return { status, diag };
  }

  async jsonResult<Row>(
    sql: string,
    identity = `jsonResult_${this.#execIndex}`,
  ) {
    const { args: { duckdbCmd, dbDestFsPathSupplier, preambleSQL } } = this;
    const dbDestFsPath = dbDestFsPathSupplier(identity);
    if (preambleSQL) {
      // preambleSQL helps prepare the DuckDB environment with configuration SQL;
      // e.g. `SET autoinstall_known_extensions = true;`
      sql = preambleSQL(sql, identity) + sql;
    }
    const status = await dax.$`${duckdbCmd} ${dbDestFsPath} --json`
      .stdout("piped")
      .stderr("piped")
      .stdinText(sql)
      .noThrow();
    const stdout = status.stdout;
    const diag = await this.execDiag(
      {
        exec_identity: identity,
        exec_code: `${duckdbCmd} ${dbDestFsPath} --json`,
        sql,
        output_nature: "JSON",
      },
      status,
      { stdoutFmt: (content) => ({ fmt: "json", content }) },
    );
    this.diagnostics.push(diag);
    this.#execIndex++;
    return {
      status,
      diag,
      json: (stdout && stdout.trim().length > 0)
        ? (JSON.parse(stdout) as Row[])
        : undefined,
    };
  }

  diagnosticsMarkdown() {
    const dmd = this.#diagnosticsMD;
    return this.#diagnosticsMD.markdownText(() =>
      `## Contents\n\n${dmd.tocMarkdownLists()}\n`
    );
  }
}

export class DuckDbOrchAssuranceRules extends o.OrchAssuranceRules {
  readonly structAR: ReturnType<
    typeof a.typicalStructureAssuranceRules<DuckDbOrchEmitContext>
  >;
  readonly valueAR: ReturnType<
    typeof a.typicalValueAssuranceRules<DuckDbOrchEmitContext>
  >;

  constructor(
    readonly sessionID: string,
    readonly sessionEntryID: string,
    readonly govn: DuckDbOrchGovernance,
  ) {
    super(sessionID, sessionEntryID);
    this.structAR = a.typicalStructureAssuranceRules<DuckDbOrchEmitContext>(
      this,
      this.govn.SQL,
    );
    this.valueAR = a.typicalValueAssuranceRules<DuckDbOrchEmitContext>(
      this,
      this.govn.SQL,
    );
  }
}

export class DuckDbOrchTableAssuranceRules<
  TableName extends string,
  ColumnName extends string,
> extends DuckDbOrchAssuranceRules {
  readonly tableRules: ReturnType<
    typeof a.typicalTableAssuranceRules<
      TableName,
      ColumnName,
      DuckDbOrchEmitContext
    >
  >;

  constructor(
    readonly tableName: TableName,
    readonly sessionID: string,
    readonly sessionEntryID: string,
    readonly govn: DuckDbOrchGovernance,
  ) {
    super(sessionID, sessionEntryID, govn);
    this.tableRules = a.typicalTableAssuranceRules<
      TableName,
      ColumnName,
      DuckDbOrchEmitContext
    >(
      tableName,
      this,
      this.govn.SQL,
    );
  }
}
