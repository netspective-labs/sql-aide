import { path, persistContent as pc, pgSQLa, SQLa, zod as z } from "./deps.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PgDcpEmitContext extends SQLa.SqlEmitContext {
  readonly isPgDcpEmitContext: true;
}

export type PgDcpSchemaDefns = {
  readonly dcp_context: SQLa.SchemaDefinition<"dcp_context", PgDcpEmitContext>;
  readonly dcp_extensions: SQLa.SchemaDefinition<
    "dcp_extensions",
    PgDcpEmitContext
  >;
  readonly dcp_lifecycle: SQLa.SchemaDefinition<
    "dcp_lifecycle",
    PgDcpEmitContext
  >;
  readonly dcp_lifecycle_destroy: SQLa.SchemaDefinition<
    "dcp_lifecycle_destroy",
    PgDcpEmitContext
  >;
  readonly dcp_lib: SQLa.SchemaDefinition<"dcp_lib", PgDcpEmitContext>;
  readonly dcp_confidential: SQLa.SchemaDefinition<
    "dcp_confidential",
    PgDcpEmitContext
  >;
  readonly dcp_assurance: SQLa.SchemaDefinition<
    "dcp_assurance",
    PgDcpEmitContext
  >;
  readonly dcp_experimental: SQLa.SchemaDefinition<
    "dcp_experimental",
    PgDcpEmitContext
  >;
};

export type PgDcpExtensionDefns = {
  readonly ltree: pgSQLa.ExtensionDefinition<
    "dcp_extensions",
    "ltree",
    PgDcpEmitContext
  >;
  // TODO:
  // this.pgTapExtn = this.extension("pgtap");
  // this.mvStatsExtn = this.extension("mv_stats");
  // this.pgStatStatementsExtn = this.extension("pg_stat_statements");
  // this.unaccentExtn = this.extension("unaccent");
  // this.ltreeExtn = this.extension("ltree");
  // this.semverExtn = this.extension("semver");
  // this.crossTabExtn = this.extension("tablefunc");
  // this.pgCronExtn = this.extension("pg_cron");
  // this.pgCryptoExtn = this.extension("pgcrypto");
  // this.pgJwtExtn = this.extension("pgjwt");
  // this.uuidExtn = this.extension('"uuid-ossp"');
  // this.httpExtn = this.extension("http");
  // this.postgresFDW = this.extension("postgres_fdw");
  // this.isjsonbValid = this.extension("is_jsonb_valid");
  // this.pgVectorExtn = this.extension("vector");
  // this.oracleFDW = this.extension("oracle_fdw");
  // this.plsh = this.extension("plsh");
  // this.mysqlFDW = this.extension("mysql_fdw");
  // this.supa_audit = this.extension("supa_audit");
};

export type PgDcpPgDomainDefns = {
  readonly execution_context: SQLa.SqlDomain<
    Any,
    PgDcpEmitContext,
    "execution_context"
  >;
  readonly execution_host_identity: SQLa.SqlDomain<
    Any,
    PgDcpEmitContext,
    "execution_host_identity"
  >;
};

export class PgDcpEmitCoordinator<
  SchemaDefns extends PgDcpSchemaDefns,
  ExtensionDefns extends PgDcpExtensionDefns,
  PgDomainDefns extends PgDcpPgDomainDefns,
> extends pgSQLa.EmitCoordinator<
  SchemaDefns,
  ExtensionDefns,
  PgDomainDefns,
  PgDcpEmitContext
> {
  protected constructor(
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

  static init(importMeta: ImportMeta) {
    return new PgDcpEmitCoordinator({
      importMeta,
      schemaDefns: (define) => ({
        dcp_context: define("dcp_context"),
        dcp_extensions: define("dcp_extensions"),
        dcp_lifecycle: define("dcp_lifecycle"),
        dcp_lifecycle_destroy: define("dcp_lifecycle_destroy"),
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

export class PgDcpLifecycle<
  SchemaDefns extends PgDcpSchemaDefns,
  ExtensionDefns extends PgDcpExtensionDefns,
  PgDomainDefns extends PgDcpPgDomainDefns,
> {
  readonly subjectArea: string;
  readonly lcSchema: SQLa.SchemaDefinition<Any, PgDcpEmitContext>;
  readonly lcDestroySchema: SQLa.SchemaDefinition<Any, PgDcpEmitContext>;
  protected constructor(
    readonly ec: PgDcpEmitCoordinator<
      SchemaDefns,
      ExtensionDefns,
      PgDomainDefns
    >,
    readonly ns: SQLa.SqlNamespaceSupplier,
  ) {
    this.lcSchema = ec.schemaDefns.dcp_lifecycle;
    this.lcDestroySchema = ec.schemaDefns.dcp_lifecycle_destroy;

    // we prefix all lifecycle methods by "subject area" but the dcp_ prefix in
    // front of all of our lifecycle methods looks ugly so we strip it
    this.subjectArea = ns.sqlNamespace.startsWith("dcp_")
      ? ns.sqlNamespace.slice(4)
      : ns.sqlNamespace;
  }

  untypedEmptyArgsSP(
    spIdentifier: string,
    schema?: SQLa.SchemaDefinition<Any, PgDcpEmitContext>,
  ) {
    const ctx = this.ec.sqlEmitContext();
    return pgSQLa.storedProcedure(
      spIdentifier,
      {},
      (name) => pgSQLa.untypedPlPgSqlBody(name, ctx),
      // we the same text options as prime because `create table`, and other
      // DDL statements are likely so we don't want to process symbols
      {
        embeddedStsOptions: this.ec.primeSTSO,
        sqlNS: schema ?? this.lcSchema,
      },
    );
  }

  // TODO: remove these PgDCP -> SQLa migration notes
  // note1: in PgDCP we had _construct_* and _destroy_* in the same schema
  //        but in SQLa we moved destructive objects to different schema
  //        to allow easier security

  constructStorage(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_construct_storage`,
    );
  }

  constructShield(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_construct_shield`,
    );
  }

  constructDomains(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_construct_domains`,
    );
  }

  constructIdempotent(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_construct_idempotent`,
    );
  }

  destroyShield(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_destroy_shield`,
      this.lcDestroySchema,
    );
  }

  destroyStorage(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_destroy_storage`,
      this.lcDestroySchema,
    );
  }

  destroyIdempotent(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_destroy_idempotent`,
      this.lcDestroySchema,
    );
  }

  deployProvenanceHttpRequest(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_deploy_provenance_http_request`,
    );
  }

  upgrade(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_upgrade`,
    );
  }

  unitTest(identity?: string) {
    return this.untypedEmptyArgsSP(
      `test_${identity ?? this.subjectArea}`,
    );
  }

  lint(identity?: string) {
    return this.untypedEmptyArgsSP(
      `lint_${identity ?? this.subjectArea}`,
    );
  }

  doctor(identity?: string) {
    return this.untypedEmptyArgsSP(
      `test_doctor_${identity ?? this.subjectArea}`,
    );
  }

  metrics(identity?: string) {
    return this.untypedEmptyArgsSP(
      `observability_metrics_${identity ?? this.subjectArea}`,
    );
  }

  populateContext(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_populate_experimental_data`,
    );
  }

  populateSecrets(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_populate_secrets`,
    );
  }

  populateSeedData(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_populate_seed_data`,
    );
  }

  populateData(identity?: string) {
    return this.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_populate_data`,
    );
  }

  static init<
    SchemaDefns extends PgDcpSchemaDefns,
    ExtensionDefns extends PgDcpExtensionDefns,
    PgDomainDefns extends PgDcpPgDomainDefns,
  >(
    ec: PgDcpEmitCoordinator<
      SchemaDefns,
      ExtensionDefns,
      PgDomainDefns
    >,
    ns: SQLa.SqlNamespaceSupplier,
  ) {
    return new PgDcpLifecycle(ec, ns);
  }
}

export function pgDcpPersister({ importMeta, sources }: {
  readonly importMeta: ImportMeta;
  readonly sources: pc.PersistProvenance[];
}) {
  const relativeToCWD = (fsPath: string) => path.relative(Deno.cwd(), fsPath);
  return pc.textFilesPersister({
    destPath: (file) =>
      path.isAbsolute(file)
        ? file
        : path.fromFileUrl(importMeta.resolve(`./${file}`)),
    content: async function* () {
      // in our case we assume that each `psql` file X is in a `X.sqla.ts`
      // source file and that it's executable and that executing it will
      // return its `psl` content which needs to be saved to `X.auto.psql`.
      for (const s of sources) {
        const source = path.fromFileUrl(importMeta.resolve(s.source));
        yield pc.persistCmdOutput({
          // deno-fmt-ignore
          provenance: () => ({ source }),
          basename: () => path.basename(source, ".sqla.ts") + ".auto.psql",
        });
      }
    },
    finalize: async ({ emitted, persist, destPath }) => {
      const driver = destPath("driver.auto.psql");
      await persist(
        driver,
        emitted.map((e) => `\\ir ${path.basename(e.destFile)}`).join("\n"),
      );
    },
    reportSuccess: ({ provenance, destFile }) => {
      console.log(
        provenance ? relativeToCWD(provenance.source) : "<?>",
        path.relative(Deno.cwd(), destFile),
      );
    },
    reportFailure: ({ provenance, error }) => {
      console.error(
        provenance ? relativeToCWD(provenance.source) : "<?>",
        error,
      );
    },
  });
}
