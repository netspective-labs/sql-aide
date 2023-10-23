import { stdLog as l } from "./deps.ts";

import {
  flexibleTextList,
  FlexibleTextSupplierSync,
} from "../universal/flexible-text.ts";
import { LogLevels } from "https://deno.land/std@0.204.0/log/levels.ts";
import { Logger } from "https://deno.land/std@0.204.0/log/logger.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type PipeInWriter<W = Any> = { write(chunk: W): Promise<void> };
export type PipeInSupplier<W = Any> = (
  stdin: PipeInWriter<W>,
) => Promise<void> | void;

export function spawnableProcess(
  cmdSupplier:
    | string
    | URL
    | ((purpose: "spawn", ...args: string[]) => string | URL),
) {
  return async function spawn(
    argsSupplier: FlexibleTextSupplierSync,
    stdinSupplier?: PipeInSupplier<Uint8Array>,
    logger?: l.Logger,
  ) {
    const args = flexibleTextList(argsSupplier);
    const command = typeof cmdSupplier === "function"
      ? cmdSupplier("spawn", ...args)
      : cmdSupplier;
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

    const { code, stdout, stderr } = await child.output();
    if (
      logger?.level == l.LogLevels.INFO || logger?.level == l.LogLevels.DEBUG
    ) {
      logger.info("cliOrchestrator", { command, args, stdinSupplier, code });
    }
    if (logger?.level == l.LogLevels.DEBUG) {
      logger.debug("cliOrchestrator", {
        "Deno.Command": cmd,
        stdinSupplier,
        stdout,
        stderr,
      });
    }
    return { command: cmd, code, stdout, stderr };
  };
}

export class SpawnableProcessCellError<Cell extends SpawnableProcessCell>
  extends Error {
  constructor(
    readonly cause: Error,
    readonly cell: Cell,
    readonly spawnResult?: Awaited<
      ReturnType<ReturnType<typeof spawnableProcess>>
    >,
  ) {
    super(cause.message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SpawnableProcessCellError<Cell>);
    }

    this.name = "SqliteCellError";
  }
}

export class SpawnableProcessJsonError<Cell extends SpawnableProcessCell>
  extends Error {
  constructor(
    readonly cause: Error,
    readonly cell: Cell,
    readonly spawnResult: Awaited<
      ReturnType<ReturnType<typeof spawnableProcess>>
    >,
  ) {
    super(cause.message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SpawnableProcessJsonError<Cell>);
    }

    this.name = "SqliteCellError";
  }
}

export class SpawnableProcessCell {
  #stdinLogger?: Logger;
  #processLogger?: Logger;
  #argsSupplier?: FlexibleTextSupplierSync;
  #stdinSuppliers: (Uint8Array | FlexibleTextSupplierSync)[] = [];
  #pipeInSupplier?: PipeInSupplier<Uint8Array>;

  constructor(
    readonly process: ReturnType<typeof spawnableProcess>,
    readonly options?: {
      readonly identity?: string;
      readonly stdinLogger?: Logger;
      readonly processLogger?: Logger;
    },
  ) {
    if (options?.stdinLogger) this.stdinLogger(options.stdinLogger);
    if (options?.processLogger) this.processLogger(options.processLogger);
  }

  stdinLogger(logger: Logger) {
    this.#stdinLogger = logger;
    return this;
  }

  processLogger(logger: Logger) {
    this.#processLogger = logger;
    return this;
  }

  args(argsSupplier: FlexibleTextSupplierSync) {
    this.#argsSupplier = argsSupplier;
    return this;
  }

  stdin(sqlSupplier: Uint8Array | FlexibleTextSupplierSync) {
    this.#stdinSuppliers.push(sqlSupplier);
    return this;
  }

  pipeIn(stdInSupplier: PipeInSupplier<Uint8Array>) {
    this.#pipeInSupplier = stdInSupplier;
    return this;
  }

  get stdinSupplier() {
    return async (stdin: PipeInWriter<Uint8Array>) => {
      // this is usually the result of a pipe from a previous command so grab
      // that output first
      if (this.#pipeInSupplier) await this.#pipeInSupplier(stdin);

      // now, the rest of the stdin comes from what was supplied in this instance
      for (const stdinSupplier of this.#stdinSuppliers) {
        if (stdinSupplier instanceof Uint8Array) {
          await stdin.write(stdinSupplier);
          if (this.#stdinLogger?.level == LogLevels.DEBUG) {
            const te = new TextDecoder();
            this.#stdinLogger?.debug(
              this.options?.identity ??
                SpawnableProcessCell.prototype.constructor.name,
              te.decode(stdinSupplier),
            );
          }
        } else {
          const te = new TextEncoder();
          for (const text of flexibleTextList(stdinSupplier)) {
            await stdin.write(te.encode(text));
            if (this.#stdinLogger?.level == LogLevels.DEBUG) {
              this.#stdinLogger?.debug(
                this.options?.identity ??
                  SpawnableProcessCell.prototype.constructor.name,
                text,
              );
            }
          }
        }
      }
    };
  }

  async spawn(argsSupplier?: FlexibleTextSupplierSync) {
    try {
      return await this.process(
        argsSupplier ?? this.#argsSupplier ?? [],
        this.stdinSupplier,
        this.#processLogger,
      );
    } catch (err) {
      throw new SpawnableProcessCellError(err, this, undefined);
    }
  }

  async text(argsSupplier?: FlexibleTextSupplierSync) {
    return new TextDecoder().decode((await this.spawn(argsSupplier)).stdout);
  }

  /**
   * Send all the text given via this.stdin() as one big string to the process.
   * @returns result of STDOUT of process as JSON object
   */
  async json<Shape>(argsSupplier?: FlexibleTextSupplierSync) {
    const sr = await this.spawn(argsSupplier);
    try {
      if (sr.code == 0) {
        return JSON.parse(new TextDecoder().decode(sr.stdout)) as Shape;
      }
    } catch (err) {
      throw new SpawnableProcessJsonError(err, this, sr);
    }
  }

  pipe<
    NextAction extends {
      pipeIn(stdInSupplier: PipeInSupplier<Uint8Array>): NextAction;
    },
  >(action: NextAction) {
    return action.pipeIn(async (writer) => {
      const sr = await this.spawn();
      await writer.write(sr.stdout);
    });
  }
}

export class SqliteCell extends SpawnableProcessCell {
  static readonly COMMAND = "sqlite3";
  static readonly process = spawnableProcess(SqliteCell.COMMAND);

  #filename = ":memory:";

  constructor(
    options?: {
      readonly filename?: string;
      readonly sqlSupplier?: Uint8Array | FlexibleTextSupplierSync;
      readonly sqlLogger?: Logger;
      readonly sqlite3Logger?: Logger;
    },
  ) {
    super(SqliteCell.process, {
      identity: SqliteCell.COMMAND,
      stdinLogger: options?.sqlLogger,
      processLogger: options?.sqlite3Logger,
    });
    if (options?.filename) this.#filename = options.filename;
    if (options?.sqlSupplier) this.SQL(options.sqlSupplier);
  }

  sqlLogger(logger: Logger) {
    this.stdinLogger(logger);
    return this;
  }

  sqlite3Logger(logger: Logger) {
    this.processLogger(logger);
    return this;
  }

  filename(filename: string) {
    this.#filename = filename;
    return this;
  }

  SQL(sqlSupplier: Uint8Array | FlexibleTextSupplierSync) {
    this.stdin(sqlSupplier);
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

  /**
   * Send all the text given via this.SQL() as one big string to the sqlite3 shell.
   * @returns result of Deno.command.spawn and other properties
   */
  async spawn(argsSupplier?: FlexibleTextSupplierSync) {
    return await super.spawn(argsSupplier ?? [this.#filename]);
  }

  /**
   * Send all the text given via this.SQL() as one big string to the sqlite3 shell.
   * @returns result of STDOUT of sqlite3 shell as JSON object
   */
  async json<Shape>(argsSupplier?: FlexibleTextSupplierSync) {
    return await super.json<Shape>(argsSupplier ?? [this.#filename, "--json"]);
  }
}

export class CommandsNotebook {
  constructor() {
  }

  process(
    process: ConstructorParameters<typeof SpawnableProcessCell>[0],
    options?: ConstructorParameters<typeof SpawnableProcessCell>[1],
  ) {
    return new SpawnableProcessCell(process, options);
  }

  sqlite3(options?: ConstructorParameters<typeof SqliteCell>[0]) {
    return new SqliteCell(options);
  }

  static create() {
    return new CommandsNotebook();
  }
}
