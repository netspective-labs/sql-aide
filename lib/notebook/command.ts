import { stdLog as l } from "./deps.ts";

import {
  flexibleTextList,
  FlexibleTextSupplierSync,
} from "../universal/flexible-text.ts";
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

export const stdinSupplierFactory = (
  content: (Uint8Array | FlexibleTextSupplierSync)[],
  options?: {
    readonly identity?: string;
    readonly pipeInSuppliers?: PipeInSupplier<Uint8Array>[];
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

export class ContentCell {
  #logger?: l.Logger;
  #content: (Uint8Array | FlexibleTextSupplierSync)[] = [];
  #pipeInSuppliers?: PipeInSupplier<Uint8Array>[];

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
      // deno-lint-ignore require-await
      write: async (content) => {
        buffer.push(content);
      },
    });
    const td = new TextDecoder();
    const strings = buffer.map((b) => td.decode(b));
    return strings.join();
  }

  pipe<
    NextAction extends {
      pipeIn(stdInSupplier: PipeInSupplier<Uint8Array>): NextAction;
    },
  >(action: NextAction) {
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

export class SpawnableProcessCell {
  #stdinLogger?: l.Logger;
  #processLogger?: l.Logger;
  #argsSupplier?: FlexibleTextSupplierSync;
  #stdinSuppliers: (Uint8Array | FlexibleTextSupplierSync)[] = [];
  #pipeInSuppliers?: PipeInSupplier<Uint8Array>[];

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

  pipeIn(stdInSupplier: PipeInSupplier<Uint8Array>) {
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
