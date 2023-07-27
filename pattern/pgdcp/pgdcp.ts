import {
  govnPattern as gp,
  path,
  persistContent as pc,
  pgGovnPattern as pggp,
  pgSQLa,
  SQLa,
  zod as z,
} from "./deps.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PgDcpEmitContext extends gp.GovernedEmitContext {
  readonly isPgDcpEmitContext: true;
}

export const pgDcpSchemasPrefix = "dcp_" as const;
export type PgDcpSchemaDefns = pgSQLa.PrefixedSchemaDefns<
  typeof pgDcpSchemasPrefix,
  | "context"
  | "extensions"
  | "lifecycle"
  | "lifecycle_destroy"
  | "lib"
  | "confidential"
  | "assurance"
  | "experimental"
  | "observability",
  PgDcpEmitContext
>;

export type PgDcpExtensionDefns = {
  readonly ltree: pgSQLa.ExtensionDefinition<
    "dcp_extensions",
    "ltree",
    PgDcpEmitContext
  >;
  readonly pgjwt: pgSQLa.ExtensionDefinition<
    "dcp_extensions",
    "pgjwt",
    PgDcpEmitContext
  >;
  readonly pgcrypto: pgSQLa.ExtensionDefinition<
    "dcp_extensions",
    "pgcrypto",
    PgDcpEmitContext
  >;
  readonly semver: pgSQLa.ExtensionDefinition<
    "dcp_extensions",
    "semver",
    PgDcpEmitContext
  >;
  readonly plpython3u: pgSQLa.ExtensionDefinition<
    "dcp_extensions",
    "plpython3u",
    PgDcpEmitContext
  >;
  readonly pg_stat_statements: pgSQLa.ExtensionDefinition<
    "dcp_extensions",
    "pg_stat_statements",
    PgDcpEmitContext
  >;
  readonly pgtap: pgSQLa.ExtensionDefinition<
    "dcp_extensions",
    "pgtap",
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

export enum ExecutionContext {
  PRODUCTION = "production",
  TEST = "test",
  DEVELOPMENT = "devl",
  SANDBOX = "sandbox",
  EXPERIMENTAL = "experimental",
}
export const executionContexts = Object.values(ExecutionContext);

export type PgDcpPgDomainDefns = {
  readonly execution_host_identity: SQLa.SqlDomain<
    Any,
    PgDcpEmitContext,
    "execution_host_identity",
    pggp.PgDcpDomainQS
  >;
};

export class PgDcpEmitCoordinator<
  SchemaDefns extends PgDcpSchemaDefns,
  ExtensionDefns extends PgDcpExtensionDefns,
  PgDomainDefns extends PgDcpPgDomainDefns,
  SchemaName extends keyof SchemaDefns & string = keyof SchemaDefns & string,
> extends pgSQLa.EmitCoordinator<
  SchemaDefns,
  ExtensionDefns,
  PgDomainDefns,
  PgDcpEmitContext,
  pggp.PgDcpDomainQS,
  pggp.PgDcpDomainsQS
> {
  readonly governedModel = pggp.PgDcpIM.prime<
    pggp.PgDcpDomainQS,
    pggp.PgDcpDomainsQS,
    PgDcpEmitContext
  >();

  protected constructor(
    readonly init: pgSQLa.EmitCoordinatorInit<
      SchemaDefns,
      ExtensionDefns,
      PgDomainDefns,
      PgDcpEmitContext,
      pggp.PgDcpDomainQS,
      pggp.PgDcpDomainsQS
    >,
  ) {
    super(init);
  }

  get psqlHeader() {
    const p = this.provenance;
    return `-- generated from ${p.identity} version ${p.version} (basename: ${this.psqlBasename()})`;
  }

  psqlBasename(forceExtn = ".auto.psql") {
    let source = this.provenance.source;
    if (source.startsWith("file://")) source = path.fromFileUrl(source);
    return path.basename(source, ".sqla.ts") + forceExtn;
  }

  sqlEmitContext(): PgDcpEmitContext {
    return this.governedModel.templateState.context({
      sqlDialect: SQLa.postgreSqlDialect(),
    });
  }

  subjectArea(target: SchemaName | SQLa.SqlNamespaceSupplier) {
    // schemas also represent "subject areas" but in those cases the dcp_ prefix
    // in front of all of our lifecycle methods looks ugly so we strip it
    return typeof target === "string"
      ? (target.startsWith(pgDcpSchemasPrefix) ? target.slice(4) : target)
      : (target.sqlNamespace.startsWith(pgDcpSchemasPrefix)
        ? target.sqlNamespace.slice(4)
        : target.sqlNamespace);
  }

  subjectAreas(...schemaNames: SchemaName[]) {
    // schemas also represent "subject areas" but in those cases the dcp_ prefix
    // in front of all of our lifecycle methods looks ugly so we strip it
    return schemaNames.map((name) => this.subjectArea(name));
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
        dcp_observability: define("dcp_observability"),
      }),
      extnDefns: (define, schemas) => ({
        ltree: define(schemas.dcp_extensions, "ltree"),
        pgjwt: define(schemas.dcp_extensions, "pgjwt"),
        pgcrypto: define(schemas.dcp_extensions, "pgcrypto"),
        semver: define(schemas.dcp_extensions, "semver"),
        plpython3u: define(schemas.dcp_extensions, "plpython3u"),
        pg_stat_statements: define(
          schemas.dcp_extensions,
          "pg_stat_statements",
        ),
        pgtap: define(schemas.dcp_extensions, "pgtap"),
      }),
      pgDomainDefns: (pgdf, schemas) => ({
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
  readonly lcSchema: SQLa.SchemaDefinition<"dcp_lifecycle", PgDcpEmitContext>;
  readonly lcDestroySchema: SQLa.SchemaDefinition<
    "dcp_lifecycle_destroy",
    PgDcpEmitContext
  >;
  protected constructor(
    readonly ec: PgDcpEmitCoordinator<
      SchemaDefns,
      ExtensionDefns,
      PgDomainDefns
    >,
    readonly subjectArea: string,
  ) {
    this.lcSchema = ec.schemaDefns.dcp_lifecycle;
    this.lcDestroySchema = ec.schemaDefns.dcp_lifecycle_destroy;
  }

  // TODO: remove these PgDCP -> SQLa migration notes
  // note1: in PgDCP we had _construct_* and _destroy_* in the same schema
  //        but in SQLa we moved destructive objects to different schema
  //        to allow easier security

  constructStorage(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_construct_storage`,
      this.lcSchema,
    );
  }

  constructShield(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_construct_shield`,
      this.lcSchema,
    );
  }

  constructDomains(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_construct_domains`,
      this.lcSchema,
    );
  }

  constructIdempotent(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_construct_idempotent`,
      this.lcSchema,
    );
  }

  destroyShield(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_destroy_shield`,
      this.lcDestroySchema,
    );
  }

  destroyStorage(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_destroy_storage`,
      this.lcDestroySchema,
    );
  }

  destroyIdempotent(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_destroy_idempotent`,
      this.lcDestroySchema,
    );
  }

  deployProvenanceHttpRequest(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_deploy_provenance_http_request`,
      this.lcSchema,
    );
  }

  upgrade(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_upgrade`,
      this.lcSchema,
    );
  }

  populateContext(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_populate_experimental_data`,
      this.lcSchema,
    );
  }

  populateSecrets(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_populate_secrets`,
      this.lcSchema,
    );
  }

  populateSeedData(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_populate_seed_data`,
      this.lcSchema,
    );
  }

  populateData(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `${identity ?? this.subjectArea}_populate_data`,
      this.lcSchema,
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
    subjectArea: string,
  ) {
    return new PgDcpLifecycle(ec, subjectArea);
  }
}

export class PgDcpAssurance<
  SchemaDefns extends PgDcpSchemaDefns,
  ExtensionDefns extends PgDcpExtensionDefns,
  PgDomainDefns extends PgDcpPgDomainDefns,
  SchemaName extends keyof SchemaDefns & string = keyof SchemaDefns & string,
> {
  readonly aeSchema: SQLa.SchemaDefinition<"dcp_assurance", PgDcpEmitContext>;
  protected constructor(
    readonly ec: PgDcpEmitCoordinator<
      SchemaDefns,
      ExtensionDefns,
      PgDomainDefns
    >,
    readonly subjectArea: string,
  ) {
    this.aeSchema = ec.schemaDefns.dcp_assurance;
  }

  unitTest(identity?: string) {
    return this.ec.emptyArgsReturnsSetOfTextSF(
      `test_${identity ?? this.subjectArea}`,
      this.aeSchema,
    );
  }

  hasFunction<RoutineName>(schemaName: SchemaName, routineName: RoutineName) {
    return {
      // deno-fmt-ignore
      SQL: () => `RETURN NEXT ${this.aeSchema.sqlNamespace}.has_function('${schemaName}', '${routineName}');`,
    };
  }

  hasTable<RoutineName>(schemaName: SchemaName, routineName: RoutineName) {
    return {
      // deno-fmt-ignore
      SQL: () => `RETURN NEXT ${this.aeSchema.sqlNamespace}.has_table('${schemaName}', '${routineName}');`,
    };
  }

  hasType<RoutineName>(schemaName: SchemaName, routineName: RoutineName) {
    return {
      // deno-fmt-ignore
      SQL: () => `RETURN NEXT ${this.aeSchema.sqlNamespace}.has_type('${schemaName}', '${routineName}');`,
    };
  }

  hasExtension<RoutineName>(schemaName: SchemaName, routineName: RoutineName) {
    return {
      // deno-fmt-ignore
      SQL: () => `RETURN NEXT ${this.aeSchema.sqlNamespace}.has_extension('${schemaName}', '${routineName}');`,
    };
  }

  hasRole<RoutineName>(schemaName: SchemaName, routineName: RoutineName) {
    return {
      // deno-fmt-ignore
      SQL: () => `RETURN NEXT ${this.aeSchema.sqlNamespace}.has_role('${schemaName}', '${routineName}');`,
    };
  }

  hasUser<RoutineName>(schemaName: SchemaName, routineName: RoutineName) {
    return {
      // deno-fmt-ignore
      SQL: () => `RETURN NEXT ${this.aeSchema.sqlNamespace}.has_user('${schemaName}', '${routineName}');`,
    };
  }

  hasntRole<RoutineName>(schemaName: SchemaName, routineName: RoutineName) {
    return {
      // deno-fmt-ignore
      SQL: () => `RETURN NEXT ${this.aeSchema.sqlNamespace}.hasnt_role('${schemaName}', '${routineName}');`,
    };
  }

  hasntUser<RoutineName>(schemaName: SchemaName, routineName: RoutineName) {
    return {
      // deno-fmt-ignore
      SQL: () => `RETURN NEXT ${this.aeSchema.sqlNamespace}.hasnt_user('${schemaName}', '${routineName}');`,
    };
  }

  lint(identity?: string) {
    return this.ec.emptyArgsReturnsSetOfTextSF(
      `lint_${identity ?? this.subjectArea}`,
      this.aeSchema,
    );
  }

  doctor(identity?: string) {
    return this.ec.emptyArgsReturnsSetOfTextSF(
      `test_doctor_${identity ?? this.subjectArea}`,
      this.aeSchema,
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
    subjectArea: string,
  ) {
    return new PgDcpAssurance(ec, subjectArea);
  }
}

export class PgDcpObservability<
  SchemaDefns extends PgDcpSchemaDefns,
  ExtensionDefns extends PgDcpExtensionDefns,
  PgDomainDefns extends PgDcpPgDomainDefns,
> {
  readonly subjectArea: string;
  readonly oSchema: SQLa.SchemaDefinition<
    "dcp_observability",
    PgDcpEmitContext
  >;
  protected constructor(
    readonly ec: PgDcpEmitCoordinator<
      SchemaDefns,
      ExtensionDefns,
      PgDomainDefns
    >,
    readonly principalSchema: SQLa.SqlNamespaceSupplier,
  ) {
    this.oSchema = ec.schemaDefns.dcp_observability;
    this.subjectArea = ec.subjectArea(principalSchema);
  }

  metrics(identity?: string) {
    return this.ec.untypedEmptyArgsSP(
      `observability_metrics_${identity ?? this.subjectArea}`,
      this.oSchema,
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
    return new PgDcpObservability(ec, ns);
  }
}

/**
 * Prepare PgDCP state management for schemas and extensions.
 * @param importMeta
 * @param init
 * @returns
 */
export function pgDcpStateSE<
  SchemaName extends keyof PgDcpSchemaDefns = keyof PgDcpSchemaDefns,
  ExtensionName extends keyof PgDcpExtensionDefns = keyof PgDcpExtensionDefns,
>(importMeta: ImportMeta, init?: {
  readonly principal?: SchemaName;
  readonly subjectArea?: string;
  readonly schemas?: SchemaName[];
  readonly extensions?: ExtensionName[];
}) {
  const ec = PgDcpEmitCoordinator.init(importMeta);
  const principalSchema = init?.principal
    ? ec.schemaDefns[init.principal]
    : undefined;
  const subjectArea = init?.subjectArea ??
    (principalSchema
      ? ec.subjectArea(principalSchema.sqlNamespace)
      : undefined);

  const schemasRef = init?.schemas ?? [];
  const extensions = init?.extensions
    ? ec.extensions(...init.extensions)
    : undefined;
  const principal = principalSchema ? [principalSchema.sqlNamespace] : [];
  const schemas = extensions
    ? ec.uniqueSchemas(
      ...principal,
      ...extensions.extnSchemaNames,
      ...schemasRef,
    )
    : ec.uniqueSchemas(...principal, ...schemasRef);

  return { ec, subjectArea, schemas, extensions };
}

export function pgDcpState<
  SchemaName extends keyof PgDcpSchemaDefns = keyof PgDcpSchemaDefns,
  ExtensionName extends keyof PgDcpExtensionDefns = keyof PgDcpExtensionDefns,
>(
  importMeta: ImportMeta,
  init:
    & {
      readonly schemas?: SchemaName[];
      readonly extensions?: ExtensionName[];
    }
    // either a principal schema or subject area (or both) are required
    & (
      | { readonly principal: SchemaName; readonly subjectArea?: string }
      | { readonly principal?: SchemaName; readonly subjectArea: string }
      | { readonly principal: SchemaName; readonly subjectArea: string }
    ),
) {
  const stateSE = pgDcpStateSE(importMeta, init);
  const { ec, subjectArea = "assert_SHOULD_NEVER_HAPPEN" } = stateSE;

  const lc = PgDcpLifecycle.init(ec, subjectArea);
  const ae = PgDcpAssurance.init(ec, subjectArea);

  return { ...stateSE, lc, ae };
}

export type SqlFileConfidentiality = "non-sensitive" | "contains-secrets";

export interface SqlFilePersistProvenance extends pc.PersistProvenance {
  readonly index?: number;
  readonly confidentiality: SqlFileConfidentiality;
}

export function pgDcpPersister(
  { importMeta, sources }: {
    readonly importMeta: ImportMeta;
    readonly sources: SqlFilePersistProvenance[];
  },
  options?: Partial<
    Parameters<
      typeof pc.textFilesPersister<SqlFilePersistProvenance>
    >[0]
  >,
) {
  let persistIndex = -1;
  return pc.textFilesPersister<SqlFilePersistProvenance>({
    ...options,
    destPath: (file) =>
      path.isAbsolute(file)
        ? file
        : path.fromFileUrl(importMeta.resolve(`./${file}`)),
    content: async function* () {
      for (const s of sources) {
        // a source can either supply its content or be a file that, when
        // executed, will supply content in STDOUT.
        persistIndex = s.index ?? persistIndex + 1;
        const piPrefix = persistIndex.toString().padStart(3, "0");

        // if the source implements PersistableContent then it means it's
        // computing its content in Deno (or some other way) so we just
        // use the content as-is with our filenaming convention.
        if (pc.isPersistableContent<SqlFilePersistProvenance>(s)) {
          yield {
            ...s,
            basename: async () => `${piPrefix}_${await s.basename()}`,
          };
          continue;
        }

        const source = path.fromFileUrl(importMeta.resolve(s.source));
        const tryExec: Parameters<typeof pc.persistCmdOutput>[0] = {
          // deno-fmt-ignore
          provenance: () => ({ ...s, source }),
          basename: () =>
            `${piPrefix}_${path.basename(source, ".sqla.ts") + ".auto.psql"}`,
        };
        const isExecutable = await pc.isExecutable(tryExec);
        switch (isExecutable) {
          case true:
            yield pc.persistCmdOutput({
              // deno-fmt-ignore
              provenance: () => ({ ...s, source }),
              basename: () =>
                `${piPrefix}_${
                  path.basename(source).replace(/(\.[^\.]*)+$/, "") + // remove all extensions
                  ".auto.psql"
                }`,
            });
            continue;
        }

        // if we get to here then we assume the file is a SQL file and we just
        // take the entire contents and emit it as an "indexed" file
        yield pc.persistFileContent({
          // deno-fmt-ignore
          provenance: () => ({ ...s, source }),
          basename: () =>
            `${piPrefix}_${
              path.basename(source, path.extname(source)) + ".auto.psql"
            }`,
        });
      }
    },
    finalize: async ({ emitted, persist, destPath }) => {
      const destFile = destPath("driver.auto.psql");
      const text = emitted.map((e) => `\\ir ${path.basename(e.destFile)}`)
        .join("\n");
      await persist(destFile, text);
      options?.reportSuccess?.({ destFile, text });
    },
  });
}

export function pgDcpPersisterVerbose(
  init: Parameters<typeof pgDcpPersister>[0],
  options?: Parameters<typeof pgDcpPersister>[1],
) {
  const relativeToCWD = (fsPath: string) =>
    path.relative(
      Deno.cwd(),
      fsPath.startsWith("file:") ? path.fromFileUrl(fsPath) : fsPath,
    );
  return pgDcpPersister(init, {
    ...options,
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
