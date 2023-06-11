import { pgSQLa, SQLa, zod as z } from "./deps.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PgDcpEmitContext extends SQLa.SqlEmitContext {
  readonly isPgDcpEmitContext: true;
}

export class PgDcpEmitter<
  SchemaDefns extends {
    context: SQLa.SchemaDefinition<"context", PgDcpEmitContext>;
    extensions: SQLa.SchemaDefinition<"extensions", PgDcpEmitContext>;
    lifecycle: SQLa.SchemaDefinition<"lifecycle", PgDcpEmitContext>;
    lib: SQLa.SchemaDefinition<"lib", PgDcpEmitContext>;
    confidential: SQLa.SchemaDefinition<"confidential", PgDcpEmitContext>;
    assurance: SQLa.SchemaDefinition<"assurance", PgDcpEmitContext>;
    experimental: SQLa.SchemaDefinition<"experimental", PgDcpEmitContext>;
  },
  ExtensionDefns extends {
    ltree: pgSQLa.ExtensionDefinition<"extensions", "ltree", PgDcpEmitContext>;
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
          sqlNS: args?.lcSchema ?? this.schemaDefns.lifecycle,
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
        context: define("context"),
        extensions: define("extensions"),
        lifecycle: define("lifecycle"),
        lib: define("lib"),
        confidential: define("confidential"),
        assurance: define("assurance"),
        experimental: define("experimental"),
      }),
      extnDefns: (define, schemas) => ({
        ltree: define(schemas.extensions, "ltree"),
      }),
      pgDomainDefns: (pgdf, schemas) => ({
        execution_context: pgdf.pgDomainDefn(
          // we type-cast because it's a reference ... "execution_context" as "ltree" in SQL
          pgdf.pgDomainRef(
            schemas.extensions,
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
              qnss: schemas.context,
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
              qnss: schemas.context,
            },
          },
        ),
      }),
    });
  }
}
