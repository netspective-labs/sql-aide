import { TemplateProvenance } from "../../render/dialect/pg/coordinator.ts";
import { path, pgSQLa, SQLa, zod as z } from "./deps.ts";

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

export interface PgDcpPersistContent {
  readonly psqlBasename: () => Promise<string>;
  readonly psqlText: () => Promise<
    {
      readonly provenance: TemplateProvenance;
      readonly content: string;
    } | {
      readonly provenance: TemplateProvenance;
      readonly error: Error;
    }
  >;
}

export function pgDcpPersistCmdOutput(
  source: {
    readonly provenance: () => TemplateProvenance;
    readonly psqlBasename: () => Promise<string>;
  },
) {
  const provenance = source.provenance();
  const result: PgDcpPersistContent = {
    psqlBasename: source.psqlBasename,
    psqlText: async () => {
      try {
        const command = new Deno.Command(provenance.source);
        const { code, stdout, stderr } = await command.output();
        if (code === 0) {
          return { provenance, content: new TextDecoder().decode(stdout) };
        } else {
          return {
            provenance,
            error: new Error(new TextDecoder().decode(stderr)),
          };
        }
      } catch (error) {
        return { provenance, error };
      }
    },
  };
  return result;
}

export interface PgDcpPersistStrategy {
  readonly destPath: (target: string) => string;
  readonly content: () => AsyncGenerator<PgDcpPersistContent>;
}

export function pgDcpPersist(strategy: PgDcpPersistStrategy) {
  const { destPath, content } = strategy;
  return {
    emitAll: async () => {
      for await (const c of content()) {
        const destFile = destPath(await c.psqlBasename());
        const psqlText = await c.psqlText();
        const { provenance } = psqlText;
        if ("content" in psqlText) {
          await Deno.writeTextFile(destFile, psqlText.content);
          console.log(
            path.relative(Deno.cwd(), provenance.source),
            path.relative(Deno.cwd(), destFile),
          );
        } else {
          console.log(
            path.relative(Deno.cwd(), provenance.source),
            psqlText.error,
          );
        }
      }
    },
  };
}
