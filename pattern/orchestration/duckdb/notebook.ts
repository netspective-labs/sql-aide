import { dax, uuid, yaml } from "./deps.ts";
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
  get newCurrentTimestamp(): SQLa.SqlTextSupplier<SQLa.SqlEmitContext> {
    return {
      SQL: () => {
        const now = new Date();
        // deno-fmt-ignore
        return `make_timestamp(${now.getFullYear()}, ${now.getMonth()+1}, ${now.getDay()}, ${now.getHours()}, ${now.getMinutes()}, ${`${now.getSeconds()}.${now.getMilliseconds()}`})`;
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

  get sqlEngineNow(): SQLa.SqlTextSupplier<DuckDbOrchEmitContext> {
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

  constructor(
    readonly session: o.OrchSession<
      DuckDbOrchGovernance,
      DuckDbOrchEmitContext
    >,
    readonly args: {
      readonly duckdbCmd: string;
      readonly dbDestFsPathSupplier: (identity?: string) => string;
      readonly preambleSQL?: (sql: string, identity?: string) => string;
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
    const mdSQL = sql.replaceAll(
      this.ignoreDiagsSqlMdRegExp,
      (_, name) => `-- removed ${name} from diagnostics Markdown`,
    );

    // note that our code blocks start with four ```` because SQL might include Markdown with blocks too
    const markdown: string[] = [`\`\`\`\`sql\n${mdSQL}\n\`\`\`\`\n`];
    if (status.stdout) {
      markdown.push("### stdout");
      const stdout = stdoutFmt?.(status.stdout) ??
        ({ fmt: "sh", content: status.stdout });
      markdown.push(
        `\`\`\`\`${stdout.fmt}\n${stdout.content}\n\`\`\`\``,
      );
    }
    if (status.stderr) {
      markdown.push("### stderr");
      markdown.push(`\`\`\`\`sh\n${status.stderr}\n\`\`\`\``);
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
    return { status, diag };
  }

  async jsonResult<Row>(sql: string, identity?: string) {
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

  diagnosticsMarkdown() {
    const md: string[] = [];
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
    return md.join("\n");
  }
}

export class DuckDbOrchAssuranceRules extends o.OrchAssuranceRules {
  readonly rules: ReturnType<
    typeof a.typicalAssuranceRules<DuckDbOrchEmitContext>
  >;

  constructor(
    readonly sessionID: string,
    readonly sessionEntryID: string,
    readonly govn: DuckDbOrchGovernance,
  ) {
    super(sessionID, sessionEntryID);
    this.rules = a.typicalAssuranceRules<DuckDbOrchEmitContext>(
      this,
      this.govn.SQL,
    );
  }
}

export class DuckDbOrchTableAssuranceRules<TableName extends string>
  extends DuckDbOrchAssuranceRules {
  readonly tableRules: ReturnType<
    typeof a.typicalTableAssuranceRules<TableName, DuckDbOrchEmitContext>
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
      DuckDbOrchEmitContext
    >(
      tableName,
      this,
      this.govn.SQL,
    );
  }
}
