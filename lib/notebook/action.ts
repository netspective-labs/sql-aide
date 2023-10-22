import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import {
  flexibleTextList,
  FlexibleTextSupplierSync,
} from "../universal/flexible-text.ts";

export function cliOrchestrator(
  cmdSupplier: string | ((...args: string[]) => string | URL),
) {
  async function spawn(
    argsSupplier: FlexibleTextSupplierSync,
    stdinSupplier?: (
      stdin: WritableStreamDefaultWriter<Uint8Array>,
    ) => Promise<void> | void,
  ) {
    const args = flexibleTextList(argsSupplier);
    const command = typeof cmdSupplier === "string"
      ? cmdSupplier
      : cmdSupplier("withStdin", ...args);
    const cmd = new Deno.Command(command, {
      args: flexibleTextList(argsSupplier),
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    const child = cmd.spawn();

    if (stdinSupplier) {
      const stdInWriter = child.stdin.getWriter();
      await stdinSupplier(stdInWriter);
      stdInWriter.close();
    }

    const { code, stdout: stdoutRaw, stderr: stderrRaw } = await child.output();
    return {
      command: cmd,
      code,
      stdoutRaw,
      stderrRaw,
      stdout: () => new TextDecoder().decode(stdoutRaw),
      stderr: () => new TextDecoder().decode(stderrRaw),
    };
  }

  async function safeSpawn<StdoutShape>(
    argsSupplier: FlexibleTextSupplierSync,
    resultSupplier: (
      spawnResult: Awaited<ReturnType<typeof spawn>>,
    ) => Promise<StdoutShape | undefined> | StdoutShape | undefined,
    options?: {
      readonly stdinSupplier?: (
        stdin: WritableStreamDefaultWriter<Uint8Array>,
      ) => Promise<void> | void;
      readonly onSpawnNonZeroCode?: (
        spawnResult: Awaited<ReturnType<typeof spawn>>,
      ) =>
        | StdoutShape
        | undefined
        | Promise<StdoutShape | undefined>;
      readonly onError?: (
        error: Error,
        spawnResult?: Awaited<ReturnType<typeof spawn>>,
      ) =>
        | StdoutShape
        | undefined
        | Promise<StdoutShape | undefined>;
    },
  ) {
    let spawnResult: Awaited<ReturnType<typeof spawn>> | undefined;
    try {
      spawnResult = await spawn(argsSupplier, options?.stdinSupplier);
      if (spawnResult.code != 0) {
        return options?.onSpawnNonZeroCode?.(spawnResult) ?? undefined;
      }
      return resultSupplier(spawnResult);
    } catch (err) {
      return options?.onError?.(err, spawnResult) ?? undefined;
    }
  }

  return { spawn, safeSpawn };
}

export class Sqlite3 {
  static readonly COMMAND = "sqlite3";
  static readonly CLI = cliOrchestrator(Sqlite3.COMMAND);

  // this should match the definition `sqlite3 --help` as precisely as possible
  // so that we can validate the CLI call before spawning
  static readonly cliffyCmd = new Command()
    .name(Sqlite3.COMMAND)
    .option("--json", "set output mode to 'json'")
    .arguments("[FILENAME] [...SQL]");

  #filename = ":memory:";
  #sqlSuppliers: (Uint8Array | FlexibleTextSupplierSync)[] = [];
  #stdInSupplier?: (
    stdin: WritableStreamDefaultWriter<Uint8Array>,
  ) => Promise<void> | void;

  constructor(
    readonly options?: { sqlSupplier?: Uint8Array | FlexibleTextSupplierSync },
  ) {
    if (options?.sqlSupplier) this.SQL(options.sqlSupplier);
  }

  filename(filename: string) {
    this.#filename = filename;
    return this;
  }

  stdIn(
    stdInSupplier: (
      stdin: WritableStreamDefaultWriter<Uint8Array>,
    ) => Promise<void> | void,
  ) {
    this.#stdInSupplier = stdInSupplier;
    return this;
  }

  SQL(sqlSupplier: Uint8Array | FlexibleTextSupplierSync) {
    this.#sqlSuppliers.push(sqlSupplier);
    return this;
  }

  pragma(supplier: string | { dump: true }) {
    if (typeof supplier == "string") {
      this.SQL(supplier);
    } else {
      if (supplier.dump) {
        this.SQL("\n.dump");
      }
    }
    return this;
  }

  get stdinSupplier() {
    return async (stdin: WritableStreamDefaultWriter<Uint8Array>) => {
      // this is usually the result of a pipe from a previous command so grab
      // that output first
      if (this.#stdInSupplier) await this.#stdInSupplier(stdin);
      for (const sqlSupplier of this.#sqlSuppliers) {
        if (sqlSupplier instanceof Uint8Array) {
          stdin.write(sqlSupplier);
        } else {
          const te = new TextEncoder();
          for (const SQL of flexibleTextList(sqlSupplier)) {
            stdin.write(te.encode(SQL));
          }
        }
      }
    };
  }

  /**
   * Send all the text given via this.SQL() as one big string to the sqlite3 shell.
   * @returns result of Deno.command.spawn and other properties
   */
  async spawn() {
    return await Sqlite3.CLI.spawn([this.#filename], this.stdinSupplier);
  }

  /**
   * Send all the text given via this.SQL() as one big string to the sqlite3 shell.
   * @returns result of stdout as text
   */
  async text() {
    return (await this.spawn()).stdout;
  }

  /**
   * Send all the text given via this.SQL() as one big string to the sqlite3 shell.
   * @returns result of STDOUT of sqlite3 shell as JSON object
   */
  async json<Shape>() {
    const args = [this.#filename, "--json"];
    return await Sqlite3.CLI.safeSpawn<Shape>(
      args,
      (sr) => JSON.parse(sr.stdout()),
      {
        stdinSupplier: this.stdinSupplier,
      },
    );
  }

  pipe<
    NextAction extends {
      stdIn(
        stdInSupplier: (
          stdin: WritableStreamDefaultWriter<Uint8Array>,
        ) => Promise<void> | void,
      ): NextAction;
    },
  >(action: NextAction) {
    return action.stdIn(async (writer) => {
      const sr = await this.spawn();
      writer.write(sr.stdoutRaw);
    });
  }
}

export class ActionNotebook {
  constructor() {
  }

  sqlite3(sqlSupplier?: Uint8Array | FlexibleTextSupplierSync) {
    return new Sqlite3({ sqlSupplier });
  }

  static create() {
    return new ActionNotebook();
  }
}
