import { Logger, LogLevels } from "https://deno.land/std@0.204.0/log/mod.ts";

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
    logger?: Logger,
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
    if (logger?.level == LogLevels.INFO || logger?.level == LogLevels.DEBUG) {
      logger.info("cliOrchestrator", { command, args, stdinSupplier, code });
    }
    if (logger?.level == LogLevels.DEBUG) {
      logger.debug("cliOrchestrator", {
        "Deno.Command": cmd,
        stdinSupplier,
        stdoutRaw,
        stderrRaw,
      });
    }
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
      readonly logger?: Logger;
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
      spawnResult = await spawn(
        argsSupplier,
        options?.stdinSupplier,
        options?.logger,
      );
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

// TODO: in safeSpawn construct a proper SqliteCellError
export class SqliteCellError extends Error {
  constructor(readonly sc: SqliteCell, message: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SqliteCellError);
    }

    this.name = "SqliteCellError";
  }
}

export class SqliteCell {
  static readonly COMMAND = "sqlite3";
  static readonly CLI = cliOrchestrator(SqliteCell.COMMAND);

  #sqlLogger?: Logger;
  #sqlite3Logger?: Logger; // TODO
  #filename = ":memory:";
  #sqlSuppliers: (Uint8Array | FlexibleTextSupplierSync)[] = [];
  #stdInSupplier?: (
    stdin: WritableStreamDefaultWriter<Uint8Array>,
  ) => Promise<void> | void;

  constructor(
    readonly options?: {
      readonly filename?: string;
      readonly sqlSupplier?: Uint8Array | FlexibleTextSupplierSync;
      readonly sqlLogger?: Logger;
      readonly sqlite3Logger?: Logger;
    },
  ) {
    if (options?.filename) this.#filename = options.filename;
    if (options?.sqlSupplier) this.SQL(options.sqlSupplier);
    if (options?.sqlLogger) this.#sqlLogger = options.sqlLogger;
    if (options?.sqlite3Logger) this.#sqlLogger = options.sqlite3Logger;
  }

  sqlLogger(logger: Logger) {
    this.#sqlLogger = logger;
    return this;
  }

  sqlite3Logger(logger: Logger) {
    this.#sqlite3Logger = logger;
    return this;
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

      // now, the rest of the SQL comes from what was supplied in this instance
      for (const sqlSupplier of this.#sqlSuppliers) {
        if (sqlSupplier instanceof Uint8Array) {
          stdin.write(sqlSupplier);
          if (this.#sqlLogger?.level == LogLevels.DEBUG) {
            const te = new TextDecoder();
            this.#sqlLogger?.debug(
              SqliteCell.prototype.constructor.name,
              te.decode(sqlSupplier),
            );
          }
        } else {
          const te = new TextEncoder();
          for (const SQL of flexibleTextList(sqlSupplier)) {
            stdin.write(te.encode(SQL));
            if (this.#sqlLogger?.level == LogLevels.DEBUG) {
              this.#sqlLogger?.debug(
                SqliteCell.prototype.constructor.name,
                SQL,
              );
            }
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
    return await SqliteCell.CLI.spawn(
      [this.#filename],
      this.stdinSupplier,
      this.#sqlite3Logger,
    );
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
    return await SqliteCell.CLI.safeSpawn<Shape>(
      args,
      (sr) => JSON.parse(sr.stdout()),
      {
        // TODO: construct a proper SqliteCellError
        stdinSupplier: this.stdinSupplier,
        logger: this.#sqlite3Logger,
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

export class CommandsNotebook {
  constructor() {
  }

  sqlite3(options?: ConstructorParameters<typeof SqliteCell>[0]) {
    return new SqliteCell(options);
  }

  static create() {
    return new CommandsNotebook();
  }
}
