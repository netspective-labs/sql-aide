import * as yaml from "https://deno.land/std@0.209.0/yaml/stringify.ts";
import * as dax from "https://deno.land/x/dax@0.36.0/mod.ts";
import * as ws from "../../../lib/universal/whitespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export class DuckDbShell {
  readonly diagnostics: {
    identity: string;
    sql: string;
    status: number;
    result?: Any;
    markdown: string;
  }[] = [];
  constructor(
    readonly args: {
      readonly duckdbCmd: string;
      readonly dbDestFsPath: string;
    } = {
      duckdbCmd: "duckdb",
      dbDestFsPath: ":memory:",
    },
  ) {
  }

  sqlMarkdownPartial(
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

  async execute(sql: string, identity?: string) {
    const { args: { duckdbCmd, dbDestFsPath } } = this;
    const status = await dax.$`${duckdbCmd} ${dbDestFsPath}`
      .stdout("piped")
      .stderr("piped")
      .stdinText(sql)
      .noThrow();
    this.diagnostics.push({
      identity: identity ? identity : "unknown",
      sql,
      status: status.code,
      markdown: this.sqlMarkdownPartial(sql, status).join("\n"),
    });
    return status;
  }

  async jsonResult(
    sql: string,
    identity: string,
  ) {
    const { args: { duckdbCmd, dbDestFsPath } } = this;
    const status = await dax.$`${duckdbCmd} ${dbDestFsPath} --json`
      .stdout("piped")
      .stderr("piped")
      .stdinText(sql)
      .noThrow();
    const stdout = status.stdout;
    this.diagnostics.push({
      identity: identity ? identity : "unknown",
      sql,
      status: status.code,
      result: stdout ? JSON.parse(stdout) : stdout,
      markdown: this.sqlMarkdownPartial(sql, status).join("\n"),
    });
    return status;
  }

  async emitDiagnostics(args: {
    readonly diagsJson?: string;
    readonly diagsXlsx?: string;
    readonly diagsMd?: string;
  }) {
    const { diagsXlsx, diagsJson, diagsMd } = args;
    if (diagsXlsx) {
      // if Excel workbook already exists, GDAL xlsx driver will error
      try {
        Deno.removeSync(diagsXlsx);
      } catch (_err) {
        // ignore errors if file does not exist
      }

      // deno-fmt-ignore
      await this.execute(ws.unindentWhitespace(`
        INSTALL spatial; -- Only needed once per DuckDB connection
        LOAD spatial; -- Only needed once per DuckDB connection
        -- TODO: join with ingest_session table to give all the results in one sheet
        COPY (SELECT * FROM ingest_session_issue) TO '${diagsXlsx}' WITH (FORMAT GDAL, DRIVER 'xlsx');`)
      );
    }

    if (diagsJson) {
      await Deno.writeTextFile(
        diagsJson,
        JSON.stringify(this.diagnostics, null, "  "),
      );
    }

    if (diagsMd) {
      const md: string[] = [
        "---",
        yaml.stringify(this.args),
        "---",
        "# Ingest Diagnostics",
      ];
      for (const d of this.diagnostics) {
        md.push(`\n## ${d.identity}`);
        md.push(`${d.markdown}`);
      }
      await Deno.writeTextFile(diagsMd, md.join("\n"));
    }
  }
}
