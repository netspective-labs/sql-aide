import { stdLog as l } from "./deps.ts";

import {
  flexibleTextList,
  FlexibleTextSupplierSync,
} from "../universal/flexible-text.ts";
// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * Represents an object capable of writing data, possibly asynchronously.
 * The writer can write chunks of data of type `W`, which can be any type.
 *
 * @template W - The type of data chunk that the writer can handle.
 */
export type PipeInWriter<W = Any> = { write(chunk: W): Promise<void> | void };

/**
 * A supplier function that provides a `PipeInWriter` instance to handle
 * input (often for piping purposes). It is expected to complete a side
 * effect, such as writing data, and may do so asynchronously.
 *
 * @template W - The type of data chunk that the corresponding `PipeInWriter` can handle.
 */
export type PipeInWriterSupplier<W = Any> = (
  stdin: PipeInWriter<W>,
) => Promise<void> | void;

/**
 * Represents an object capable of receiving a `PipeInWriterSupplier` and
 * using it to supply data. This is typically part of a piping operation
 * where data flows from one command to another. The method `pipeIn` is
 * used to connect the supplier in the pipeline.
 *
 * @template NextCell - The type of the next step or stage in the pipeline
 * following the current operation, allowing for chaining of operations.
 */
export type PipeInSupplier<NextCell> = {
  pipeIn(stdInSupplier: PipeInWriterSupplier<Uint8Array>): NextCell;
};

/**
 * Factory function to create a supplier capable of writing both piped data
 * and direct content to a standard input stream (`stdin`). It handles the
 * data from previous commands in the pipeline and the immediate content
 * provided to the current command. This supplier supports logging and
 * uniquely identifying the stream for debugging purposes.
 *
 * @param content - List of content items,
 * each can be a Uint8Array or synchronous text supplier, representing the data to write to `stdin`.
 * @param {Object} [options] - Optional parameters to control logging and identify the operation.
 * @param {string} [options.identity] - Identifier for the logging source, default is "stdinSupplier".
 * @param {PipeInWriterSupplier<Uint8Array>[]} [options.pipeInSuppliers] - Suppliers for data that comes
 * from the output of previous commands in the pipeline.
 * @param {l.Logger} [options.logger] - Logger instance for logging debug information.
 * @returns ssynchronous function that takes a `PipeInWriter` for `stdin` and handles the writing operation,
 * including both piped data and direct content.
 */
export const stdinSupplierFactory = (
  content: (Uint8Array | FlexibleTextSupplierSync)[],
  options?: {
    readonly identity?: string;
    readonly pipeInSuppliers?: PipeInWriterSupplier<Uint8Array>[];
    readonly logger?: l.Logger;
  },
) => {
  return async (stdin: PipeInWriter<Uint8Array>) => {
    // this is usually the result of a pipe from a previous command so grab
    // that output first
    if (options?.pipeInSuppliers) {
      for (const pi of options.pipeInSuppliers) {
        await pi(stdin);
      }
    }

    // now, the rest of the stdin comes from what was supplied in this instance
    const logger = options?.logger;
    for (const c of content) {
      if (c instanceof Uint8Array) {
        await stdin.write(c);
        if (logger?.level == l.LogLevels.DEBUG) {
          const te = new TextDecoder();
          logger?.debug(
            options?.identity ?? "stdinSupplier",
            te.decode(c),
          );
        }
      } else {
        const te = new TextEncoder();
        for (const text of flexibleTextList(c)) {
          await stdin.write(te.encode(text));
          if (logger?.level == l.LogLevels.DEBUG) {
            logger?.debug(
              options?.identity ?? "stdinSupplier",
              text,
            );
          }
        }
      }
    }
  };
};

/**
 * Creates a `spawn` function capable of executing a command or process.
 * The command to run can be specified as a string, URL, or a supplier function.
 * The resulting `spawn` function is used to execute the command with specific arguments,
 * handle the process's input stream, and log various execution details.
 *
 * @param cmdSupplier - The command to be executed. This can be:
 *   1. A string specifying the command.
 *   2. A URL object pointing to the location of a resource (e.g., script file).
 *   3. A function returning a string or URL, which allows dynamic determination of the command.
 *      The function receives a purpose argument ("spawn") and the arguments for the process.
 * @returns an async `spawn` function with the following parameters:
 *   1. `argsSupplier`: Function or an array supplying the arguments for the command; processed by `flexibleTextList`.
 *   2. `stdinSupplier` (optional): A function to handle the input stream of the spawned process.
 *      This function, if provided, receives a writable stream and is expected to handle the writing of input data.
 *   3. `logger` (optional): A logging utility object used for logging information about the process execution.
 *      It's assumed to have methods like `info` and `debug` for logging, and properties like `level` to determine the log level.
 *
 * The `spawn` function executes the command with the supplied arguments, pipes the standard streams (stdin, stdout, stderr),
 * and, if provided, logs execution details (like the command, arguments, and exit code) and debug information
 * (including the entire Deno.Command object and streams).
 * It waits for the process to complete and returns an object containing details about the command's execution,
 * including the command object, exit code, stdout, and stderr contents.
 *
 * @example
 * const execute = spawnableProcess('ls');
 * const result = await execute(['-l'], undefined, customLogger);
 * // The `result` would contain details about the 'ls -l' command execution.
 */
export function spawnableProcess(
  cmdSupplier:
    | string
    | URL
    | ((purpose: "spawn", ...args: string[]) => string | URL),
) {
  return async function spawn(
    argsSupplier: FlexibleTextSupplierSync,
    stdinSupplier?: PipeInWriterSupplier<Uint8Array>,
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
      logger.info("spawnableProcess", { command, args, stdinSupplier, code });
    }
    if (logger?.level == l.LogLevels.DEBUG) {
      logger.debug("spawnableProcess", {
        "Deno.Command": cmd,
        stdinSupplier,
        stdout,
        stderr,
      });
    }
    return { command: cmd, code, stdout, stderr };
  };
}

/**
 * Represents a single content cell in a command pipeline, managing internal content
 * and supporting data piping with configurable logging. This class allows for content
 * accumulation and transformation, suitable for operations in a command pattern, particularly
 * resembling a UNIX-style pipeline.
 *
 * Instances of `ContentCell` can carry content, transform it to text, pipe it to other
 * content cells or commands, and perform these actions with optional logging.
 */
export class ContentCell {
  #logger?: l.Logger;
  #content: (Uint8Array | FlexibleTextSupplierSync)[] = [];
  #pipeInSuppliers?: PipeInWriterSupplier<Uint8Array>[];

  constructor(
    readonly options?: {
      readonly identity?: string;
      readonly content?: (Uint8Array | FlexibleTextSupplierSync)[];
      readonly stdinLogger?: l.Logger;
      readonly processLogger?: l.Logger;
    },
  ) {
    if (options?.stdinLogger) this.logger(options.stdinLogger);
    if (options?.content) this.content(...options.content);
  }

  logger(logger: l.Logger) {
    this.#logger = logger;
    return this;
  }

  content(...content: (Uint8Array | FlexibleTextSupplierSync)[]) {
    this.#content.push(...content);
    return this;
  }

  async text() {
    const sis = stdinSupplierFactory(this.#content, {
      identity: this.options?.identity,
      pipeInSuppliers: this.#pipeInSuppliers,
      logger: this.#logger,
    });
    const buffer: Uint8Array[] = [];
    await sis({
      write: (content) => {
        buffer.push(content);
      },
    });
    const td = new TextDecoder();
    const strings = buffer.map((b) => td.decode(b));
    return strings.join();
  }

  pipe<NextAction extends PipeInSupplier<NextAction>>(action: NextAction) {
    const sis = stdinSupplierFactory(this.#content, {
      identity: this.options?.identity,
      pipeInSuppliers: this.#pipeInSuppliers,
      logger: this.#logger,
    });
    return action.pipeIn(sis);
  }
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

/**
 * Represents a notebook cell (manageable unit) for a spawnable process within a larger command orchestration system.
 * It's designed to create, configure, and manage the lifecycle of a child process, including its standard input,
 * command-line arguments, and output handling. The class supports chaining and composition paradigms, allowing
 * the construction of complex command pipelines and process workflows.
 */
export class SpawnableProcessCell {
  #stdinLogger?: l.Logger;
  #processLogger?: l.Logger;
  #argsSupplier?: FlexibleTextSupplierSync;
  #stdinSuppliers: (Uint8Array | FlexibleTextSupplierSync)[] = [];
  #pipeInSuppliers?: PipeInWriterSupplier<Uint8Array>[];

  constructor(
    readonly process: ReturnType<typeof spawnableProcess>,
    readonly options?: {
      readonly identity?: string;
      readonly stdinLogger?: l.Logger;
      readonly processLogger?: l.Logger;
    },
  ) {
    if (options?.stdinLogger) this.stdinLogger(options.stdinLogger);
    if (options?.processLogger) this.processLogger(options.processLogger);
  }

  stdinLogger(logger: l.Logger) {
    this.#stdinLogger = logger;
    return this;
  }

  processLogger(logger: l.Logger) {
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

  pipeIn(stdInSupplier: PipeInWriterSupplier<Uint8Array>) {
    if (this.#pipeInSuppliers === undefined) this.#pipeInSuppliers = [];
    this.#pipeInSuppliers.push(stdInSupplier);
    return this;
  }

  async spawn(argsSupplier?: FlexibleTextSupplierSync) {
    try {
      return await this.process(
        argsSupplier ?? this.#argsSupplier ?? [],
        stdinSupplierFactory(this.#stdinSuppliers, {
          identity: this.options?.identity,
          pipeInSuppliers: this.#pipeInSuppliers,
          logger: this.#stdinLogger,
        }),
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

  pipe<NextAction extends PipeInSupplier<NextAction>>(action: NextAction) {
    return action.pipeIn(async (writer) => {
      const sr = await this.spawn();
      await writer.write(sr.stdout);
    });
  }
}

/**
 * Represents a specialized cell designed to interact with an SQLite database.
 * This class encapsulates the functionality for constructing, executing, and managing SQLite commands,
 * leveraging the capabilities provided by the `SpawnableProcessCell` for process management.
 * It allows direct interactions with the database, including executing SQL commands, changing database files,
 * and parsing responses, while abstracting away the lower-level details of process management and I/O handling.
 */
export class SqliteCell extends SpawnableProcessCell {
  static readonly COMMAND = "sqlite3";
  static readonly process = spawnableProcess(SqliteCell.COMMAND);

  #filename = ":memory:";

  constructor(
    options?: {
      readonly filename?: string;
      readonly sqlSupplier?: Uint8Array | FlexibleTextSupplierSync;
      readonly sqlLogger?: l.Logger;
      readonly sqlite3Logger?: l.Logger;
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

  sqlLogger(logger: l.Logger) {
    this.stdinLogger(logger);
    return this;
  }

  sqlite3Logger(logger: l.Logger) {
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

  content(options?: ConstructorParameters<typeof ContentCell>[0]) {
    return new ContentCell(options);
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
