import { fs, path, pgSQLa, SQLa, zod as z } from "./deps.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PgDcpEmitContext extends SQLa.SqlEmitContext {
  readonly isPgDcpEmitContext: true;
}

export class PgDcpEmitter<
  SchemaDefns extends {
    dcp_context: SQLa.SchemaDefinition<"dcp_context", PgDcpEmitContext>;
    dcp_extensions: SQLa.SchemaDefinition<"dcp_extensions", PgDcpEmitContext>;
    dcp_lifecycle: SQLa.SchemaDefinition<"dcp_lifecycle", PgDcpEmitContext>;
    dcp_lib: SQLa.SchemaDefinition<"dcp_lib", PgDcpEmitContext>;
    dcp_confidential: SQLa.SchemaDefinition<
      "dcp_confidential",
      PgDcpEmitContext
    >;
    dcp_assurance: SQLa.SchemaDefinition<"dcp_assurance", PgDcpEmitContext>;
    dcp_experimental: SQLa.SchemaDefinition<
      "dcp_experimental",
      PgDcpEmitContext
    >;
  },
  ExtensionDefns extends {
    ltree: pgSQLa.ExtensionDefinition<
      "dcp_extensions",
      "ltree",
      PgDcpEmitContext
    >;
  },
  PgDomainDefns extends {
    execution_context: SQLa.SqlTextSupplier<PgDcpEmitContext>;
    execution_host_identity: SQLa.SqlTextSupplier<PgDcpEmitContext>;
  },
> extends pgSQLa.EmitCoordinator<
  SchemaDefns,
  ExtensionDefns,
  PgDomainDefns,
  PgDcpEmitContext
> {
  public constructor(
    readonly init: pgSQLa.EmitCoordinatorInit<
      SchemaDefns,
      ExtensionDefns,
      PgDomainDefns,
      PgDcpEmitContext
    >,
  ) {
    super(init);
  }

  get psqlHeader() {
    const p = this.provenance;
    return `-- ${this.psqlBasename()} from ${p.identity} version ${p.version}`;
  }

  psqlBasename(forceExtn = ".psql") {
    let source = this.provenance.source;
    if (source.startsWith("file://")) source = path.fromFileUrl(source);
    return path.basename(source, ".sqla.ts") + forceExtn;
  }

  sqlEmitContext(): PgDcpEmitContext {
    return {
      isPgDcpEmitContext: true,
      ...SQLa.typicalSqlEmitContext({
        sqlDialect: SQLa.postgreSqlDialect(),
      }),
    };
  }

  lifecycle(
    args?: {
      lcSchema: SQLa.SchemaDefinition<Any, PgDcpEmitContext>;
    },
  ) {
    const ctx = this.sqlEmitContext();

    const constructStorage = (identity: string) => {
      const spIdentifier = `construct_storage_${identity}`;
      return pgSQLa.storedProcedure(
        spIdentifier,
        {},
        (name) => pgSQLa.untypedPlPgSqlBody(name, ctx),
        // we the same text options as prime because `create table`, and other
        // DDL statements are likely so we don't want to process symbols
        {
          embeddedStsOptions: this.primeSTSO,
          sqlNS: args?.lcSchema ?? this.schemaDefns.dcp_lifecycle,
        },
      );
    };

    return {
      constructStorage,
    };
  }

  static init(importMeta: ImportMeta) {
    return new PgDcpEmitter({
      importMeta,
      schemaDefns: (define) => ({
        dcp_context: define("dcp_context"),
        dcp_extensions: define("dcp_extensions"),
        dcp_lifecycle: define("dcp_lifecycle"),
        dcp_lib: define("dcp_lib"),
        dcp_confidential: define("dcp_confidential"),
        dcp_assurance: define("dcp_assurance"),
        dcp_experimental: define("dcp_experimental"),
      }),
      extnDefns: (define, schemas) => ({
        ltree: define(schemas.dcp_extensions, "ltree"),
      }),
      pgDomainDefns: (pgdf, schemas) => ({
        execution_context: pgdf.pgDomainDefn(
          // we type-cast because it's a reference ... "execution_context" as "ltree" in SQL
          pgdf.pgDomainRef(
            schemas.dcp_extensions,
            "ltree",
          ) as unknown as SQLa.SqlDomain<
            Any,
            PgDcpEmitContext,
            "execution_context"
          >,
          "execution_context",
          {
            isIdempotent: true,
            nsOptions: {
              quoteIdentifiers: true,
              qnss: schemas.dcp_context,
            },
          },
        ),
        execution_host_identity: pgdf.pgDomainDefn(
          pgdf.stringSDF.string<z.ZodString, "execution_host_identity">(
            z.string(),
          ),
          "execution_host_identity",
          {
            isIdempotent: true,
            nsOptions: {
              quoteIdentifiers: true,
              qnss: schemas.dcp_context,
            },
          },
        ),
      }),
    });
  }
}

export interface PgDcpPersistStrategy {
  readonly destPath: (file: string) => string;
  readonly handlePath: (entry: fs.WalkEntry) =>
    | ({
      // TODO: add readonly weight: number; or index, sort-order, etc.
      readonly entry: fs.WalkEntry;
      readonly destFile: (destPath?: (file: string) => string) => string;
    })
    | false;
}

export function typicalPgDcpPersistStrategy(
  destPath: (basename: string) => string,
  suffix = ".sqla.ts",
): PgDcpPersistStrategy {
  return {
    destPath,
    handlePath: (entry) => {
      if (!entry.name.endsWith(suffix)) return false;
      return {
        entry,
        destFile: (overrideDestPath) => {
          const destFN = path.basename(entry.path, suffix) + ".auto.psql";
          return overrideDestPath ? overrideDestPath(destFN) : destPath(destFN);
        },
      };
    },
  };
}

export function pgDcpPersist(options: PgDcpPersistStrategy) {
  const { destPath, handlePath } = options;
  return {
    destroyAll: async (rootPath: string) => {
      for await (
        const entry of fs.walk(rootPath, {
          includeFiles: true,
          includeDirs: false,
        })
      ) {
        const handler = handlePath(entry);
        if (handler) {
          const destFile = handler.destFile(destPath);
          console.log(
            path.relative(Deno.cwd(), handler.entry.path),
            path.relative(Deno.cwd(), destFile),
          );
        }
      }
    },
    emitAll: async (rootPath: string) => {
      for await (
        const entry of fs.walk(rootPath, {
          includeFiles: true,
          includeDirs: false,
        })
      ) {
        const handler = handlePath(entry);
        if (!handler) continue;
        const command = new Deno.Command(entry.path);
        const { code, stdout, stderr } = await command.output();
        if (code === 0) {
          const destFile = handler.destFile(destPath);
          const output = new TextDecoder().decode(stdout);
          await Deno.writeTextFile(destFile, output);
          console.log(
            path.relative(Deno.cwd(), handler.entry.path),
            path.relative(Deno.cwd(), destFile),
          );
        } else {
          console.error(new TextDecoder().decode(stderr));
        }
      }
    },
  };
}
