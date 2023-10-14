import { zod as z } from "../deps.ts";
import * as tmpl from "../emit/mod.ts";
import * as safety from "../../lib/universal/safety.ts";
import * as qs from "../quality-system.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type SqlDomainZodDescrMeta = {
  readonly isSqlDomainZodDescrMeta: true;
};

export function isSqlDomainZodDescr<SDZD extends SqlDomainZodDescrMeta>(
  o: unknown,
): o is SDZD {
  const isSDZD = safety.typeGuard<SDZD>("isSqlDomainZodDescrMeta");
  return isSDZD(o);
}

export type SqlDomainQS = qs.Documentable;

export type SqlDomain<
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string,
  QualitySystem extends SqlDomainQS,
> =
  & tmpl.SqlSymbolSupplier<Context>
  & Partial<qs.QualitySystemSupplier<QualitySystem>>
  & {
    readonly isSqlDomain: true;
    readonly identity: DomainIdentity;
    readonly isNullable: () => boolean;
    readonly sqlDataType: (
      purpose:
        | "create table column"
        | "stored routine arg"
        | "stored function returns scalar"
        | "stored function returns table column"
        | "type field"
        | "table foreign key ref"
        | "diagram"
        | "PostgreSQL domain",
    ) => tmpl.SqlTextSupplier<Context>;
    readonly sqlDefaultValue?: (
      purpose: "create table column" | "stored routine arg",
    ) => tmpl.SqlTextSupplier<Context>;
    readonly sqlDqlQuotedLiteral?: <Value extends Any | undefined>(
      purpose: "select",
      value: Value,
      qlSupplier: (value: Value) => [value: Value, quoted: string],
      ctx: Context,
    ) => [value: Value, quoted: string];
    readonly sqlDmlQuotedLiteral?: <Value extends Any | undefined>(
      purpose: "insert" | "update" | "delete",
      columnValue: Value,
      qlSupplier: (value: Value) => [value: Value, quoted: string],
      rowValues: Record<string, Any>,
      ctx: Context,
    ) => [value: Value, quoted: string];
    readonly sqlPartial?: (
      destination:
        | "create table, full column defn"
        | "create table, column defn decorators"
        | "create table, after all column definitions",
    ) => tmpl.SqlTextSupplier<Context>[] | undefined;
  };

export type SqlDomainPreparer<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
> = <ZodType extends z.ZodTypeAny, Identity extends DomainsIdentity>(
  zodType: ZodType,
  init?: { identity: Identity },
) => SqlDomain<ZodType, Context, Identity, QualitySystem>;

export type SqlDomainSupplier<
  ZodType extends z.ZodTypeAny,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
> = {
  readonly sqlDomain: SqlDomain<
    ZodType,
    Context,
    DomainsIdentity,
    QualitySystem
  >;
};

export type SqlCustomDomainSupplier<
  Enrich extends Record<string, unknown>,
  ZodType extends z.ZodTypeAny,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
> = {
  readonly sqlDomain:
    & SqlDomain<ZodType, Context, DomainsIdentity, QualitySystem>
    & Enrich;
};

export type ZodTypeSqlDomainSupplier<
  ZodType extends z.ZodTypeAny,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
> =
  & ZodType
  & SqlDomainSupplier<ZodType, DomainsIdentity, Context, QualitySystem>;

export function zodTypeAnySqlDomainFactory<
  ZodType extends z.ZodTypeAny,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
>() {
  const SQL_DOMAIN_NOT_IN_COLLECTION = "SQL_DOMAIN_NOT_IN_COLLECTION" as const;

  const isSqlDomain = safety.typeGuard<
    SqlDomain<ZodType, Context, DomainsIdentity, QualitySystem>
  >("isSqlDomain", "sqlDataType");

  const isSqlDomainSupplier = safety.typeGuard<
    SqlDomainSupplier<ZodType, DomainsIdentity, Context, QualitySystem>
  >(
    "sqlDomain",
  );

  const defaults = <Identity extends string>(
    zodType: ZodType,
    init?: {
      readonly identity?: Identity;
      readonly isOptional?: boolean;
      readonly parents?: z.ZodTypeAny[];
    },
  ) => {
    const lintIssues: tmpl.SqlLintIssueSupplier[] = [];
    const qualitySystem: QualitySystem | undefined = zodType.description
      ? { description: zodType.description } as QualitySystem
      : undefined;
    const defaults:
      & Pick<
        SqlDomain<Any, Context, Identity, QualitySystem>,
        | "identity"
        | "isSqlDomain"
        | "sqlSymbol"
        | "isNullable"
        | "qualitySystem"
      >
      & tmpl.SqlLintIssuesSupplier = {
        isSqlDomain: true as true, // must not be a boolean but `true`
        identity: (init?.identity ?? SQL_DOMAIN_NOT_IN_COLLECTION) as Identity,
        isNullable: () =>
          init?.isOptional || zodType.isOptional() || zodType.isNullable(),
        sqlSymbol: (ctx) =>
          ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true }).domainName(
            init?.identity ?? SQL_DOMAIN_NOT_IN_COLLECTION,
          ),
        lintIssues,
        registerLintIssue: (...slis: tmpl.SqlLintIssueSupplier[]) => {
          lintIssues.push(...slis);
        },
        qualitySystem,
      };
    return defaults;
  };

  return {
    SQL_DOMAIN_NOT_IN_COLLECTION,
    isSqlDomain,
    isSqlDomainSupplier,
    defaults,
  };
}

export type SqlDomainZodStringDescr = SqlDomainZodDescrMeta & {
  readonly isJsonText?: boolean;
} & {
  readonly isVarChar?: boolean;
} & {
  readonly isSemver?: boolean;
} & {
  readonly isUuid?: boolean;
} & {
  readonly isUlid?: boolean;
} & {
  readonly isBlobText?: boolean;
};

export function sqlDomainZodStringDescr(
  options: Pick<
    SqlDomainZodStringDescr,
    "isJsonText" | "isVarChar" | "isSemver" | "isUuid" | "isUlid" | "isBlobText"
  >,
): SqlDomainZodStringDescr {
  return {
    isSqlDomainZodDescrMeta: true,
    ...options,
  };
}

export function isSqlDomainZodStringDescr<
  SDZND extends SqlDomainZodStringDescr,
>(o: unknown): o is SDZND {
  const isSDZSD = safety.typeGuard<SDZND>("isSqlDomainZodDescrMeta");
  return isSDZSD(o) &&
    ("isJsonText" in o || "isVarChar" in o || "isSemver" in o ||
      "isUuid" in o || "isUlid" in o || "isBlobText" in o);
}

export function zodStringSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
>(zsdfOptions?: { defaultVarCharMaxLen?: number }) {
  const ztaSDF = zodTypeAnySqlDomainFactory<
    Any,
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  return {
    ...ztaSDF,
    string: <
      ZodType extends z.ZodType<string, z.ZodStringDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      const defaultValue = init?.parents?.[0]?._def.defaultValue?.();
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return `NVARCHAR(MAX)`;
            }
            return `TEXT`;
          },
        }),
        sqlDefaultValue: () => ({
          SQL: (_ctx: Context) => {
            const defaultValueTransformed = defaultValue != undefined
              ? _ctx.sqlTextEmitOptions.quotedLiteral(defaultValue)
              : undefined;
            return defaultValueTransformed != undefined
              ? defaultValueTransformed[1]
              : "";
          },
        }),
        parents: init?.parents,
      };
    },
    jsonString: <
      ZodType extends z.ZodType<string, z.ZodStringDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      const inherited = ztaSDF.defaults<Identity>(zodType, init);
      return {
        ...inherited,
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isPostgreSqlDialect(ctx.sqlDialect)) {
              return `JSONB`;
            }
            return `TEXT`;
          },
        }),
        sqlPartial: (
          dest:
            | "create table, full column defn"
            | "create table, column defn decorators"
            | "create table, after all column definitions",
        ) => {
          if (dest === "create table, column defn decorators") {
            // we're assuming there are no other sqlPartials inherited
            const decorators: tmpl.SqlTextSupplier<Context> = {
              SQL: (ctx) =>
                tmpl.isSqliteDialect(ctx.sqlDialect)
                  ? `CHECK(json_valid(${inherited.identity})${
                    inherited.isNullable()
                      ? ` OR ${inherited.identity} IS NULL`
                      : ""
                  })`
                  : ``,
            };
            return [decorators];
          }
          // we're assuming there are no other sqlPartials inherited
          return undefined;
        },
        parents: init?.parents,
      };
    },
    blobString: <
      ZodType extends z.ZodType<string, z.ZodStringDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: () => {
            return `BLOB`;
          },
        }),
        parents: init?.parents,
      };
    },
    varChar: <
      ZodType extends z.ZodType<string, z.ZodStringDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            let maxLength: number | undefined = undefined;
            const maxLengthCheck = zodType._def.checks.find((c) =>
              c.kind === "max"
            );
            if (maxLengthCheck) {
              maxLength = maxLengthCheck.kind === "max"
                ? maxLengthCheck.value
                : undefined;
            }
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return `NVARCHAR(${maxLength ? maxLength : "MAX"})`;
            }
            return `VARCHAR(${
              maxLength
                ? maxLength
                : (zsdfOptions?.defaultVarCharMaxLen ?? "4096")
            })`;
          },
        }),
        parents: init?.parents,
      };
    },
    // this is a sample string domain which shows how to use the "dialect"
    // property of SqlEmitContext to differentiate the SQL output for a
    // domain based on the SQL engine.
    stringDialect: <
      ZodType extends z.ZodType<string, z.ZodStringDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            // dialectState returns all dialect checkers in one object but
            // you can check each individually like isSqliteDialect(ctx.sqlDialect)
            // deno-fmt-ignore
            return `TEXT /* ${JSON.stringify(
              tmpl.dialectState(ctx.sqlDialect)
            )} */`;
          },
        }),
        parents: init?.parents,
      };
    },
    semver: <
      ZodType extends z.ZodType<string, z.ZodStringDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (_ctx: Context) => {
            return `semver`;
          },
        }),
        parents: init?.parents,
      };
    },
    uuid: <
      ZodType extends z.ZodType<string, z.ZodStringDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      const defaultValue = init?.parents?.[0]?._def.defaultValue?.();
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (_ctx: Context) => {
            return `TEXT`;
          },
        }),
        sqlDefaultValue: () => ({
          SQL: (_ctx: Context) => {
            return defaultValue != undefined ? defaultValue : "";
          },
        }),
        parents: init?.parents,
      };
    },
    ulid: <
      ZodType extends z.ZodType<string, z.ZodStringDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      const defaultValue = init?.parents?.[0]?._def.defaultValue?.();
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            return tmpl.isSqliteDialect(ctx.sqlDialect) ? "ULID" : "TEXT";
          },
        }),
        sqlDefaultValue: () => ({
          SQL: (_ctx: Context) => {
            return defaultValue != undefined ? defaultValue : "";
          },
        }),
        parents: init?.parents,
      };
    },
  };
}

export type SqlDomainZodArrayDescr = SqlDomainZodDescrMeta & {
  readonly isJsonText?: boolean;
} & {
  readonly isVarChar?: boolean;
} & {
  readonly isFloat?: boolean;
};

export function sqlDomainZodArrayDescr(
  options: Pick<SqlDomainZodArrayDescr, "isJsonText" | "isVarChar" | "isFloat">,
): SqlDomainZodArrayDescr {
  return {
    isSqlDomainZodDescrMeta: true,
    ...options,
  };
}

export function isSqlDomainZodArrayDescr<
  SDZND extends SqlDomainZodArrayDescr,
>(o: unknown): o is SDZND {
  const isSDZSD = safety.typeGuard<SDZND>("isSqlDomainZodDescrMeta");
  return isSDZSD(o) &&
    ("isFloat" in o || "isJsonText" in o || "isVarChar" in o);
}

export function zodArraySqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
>() {
  const ztaSDF = zodTypeAnySqlDomainFactory<
    Any,
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  return {
    ...ztaSDF,
    arrayText: <
      ZodType extends z.ZodType<Array<string>, z.ZodStringDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return `NVARCHAR(MAX)[]`;
            }
            return `TEXT[]`;
          },
        }),
        parents: init?.parents,
      };
    },
    arrayFloat: <
      ZodType extends z.ZodType<Array<number>, z.ZodStringDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isPostgreSqlDialect(ctx.sqlDialect)) return "FLOAT[]";
            return "REAL[]";
          },
        }),
        parents: init?.parents,
      };
    },
  };
}

export function zodBooleanSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
>() {
  const ztaSDF = zodTypeAnySqlDomainFactory<
    Any,
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  return {
    ...ztaSDF,
    boolean: <
      ZodType extends z.ZodType<z.ZodBoolean>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      const defaultValue = init?.parents?.[0]?._def.defaultValue();
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return `BOOLEAN`;
            }
            return `BOOLEAN`;
          },
        }),
        sqlDefaultValue: () => ({
          SQL: (_ctx: Context) => {
            return defaultValue != undefined ? defaultValue.toString() : "";
          },
        }),
        parents: init?.parents,
      };
    },
  };
}

export const zodSqlDomainRawCreateParams = (
  descrMeta: SqlDomainZodDescrMeta,
) => {
  return {
    description: JSON.stringify(descrMeta),
  };
};

// see https://github.com/colinhacks/zod#json-type
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
type JsonB = Json;

export function zodJsonSchema(): z.ZodType<Json> {
  const zJSON: z.ZodType<Json> = z.lazy(
    () => z.union([literalSchema, z.array(zJSON), z.record(zJSON)]),
    zodSqlDomainRawCreateParams(sqlDomainZodJsonDescrMeta()),
  );
  return zJSON;
}

export function zodJsonB(): z.ZodType<JsonB> {
  const zJsonB: z.ZodType<Json> = z.lazy(
    () => z.union([literalSchema, z.array(zJsonB), z.record(zJsonB)]),
    zodSqlDomainRawCreateParams(sqlDomainZodJsonDescrMeta()),
  );
  return zJsonB;
}

export type SqlDomainZodJsonDescr = SqlDomainZodDescrMeta & {
  readonly isJsonSqlDomain: true;
};

export function isSqlDomainZodJsonDescr<SDZJD extends SqlDomainZodJsonDescr>(
  o: unknown,
): o is SDZJD {
  const isSDZJD = safety.typeGuard<SDZJD>(
    "isSqlDomainZodDescrMeta",
    "isJsonSqlDomain",
  );
  return isSDZJD(o);
}

export function sqlDomainZodJsonDescrMeta(): SqlDomainZodJsonDescr {
  return {
    isSqlDomainZodDescrMeta: true,
    isJsonSqlDomain: true,
  };
}

export function zodJsonSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
>() {
  const ztaSDF = zodTypeAnySqlDomainFactory<
    Any,
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  return {
    ...ztaSDF,
    isSqlDomainZodJsonDescr,
    sqlDomainZodJsonDescrMeta,
    json: <
      ZodType extends z.ZodType<string, z.ZodStringDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isPostgreSqlDialect(ctx.sqlDialect)) {
              return `JSONB`;
            }
            return `TEXT`;
          },
        }),
        parents: init?.parents,
      };
    },
  };
}

export type SqlDomainZodNumberDescr = SqlDomainZodDescrMeta & {
  readonly isFloat: boolean;
  readonly isBigFloat: boolean;
  readonly isSerial: boolean;
};

export function sqlDomainZodNumberDescr(
  options: Pick<SqlDomainZodNumberDescr, "isFloat" | "isBigFloat" | "isSerial">,
): SqlDomainZodNumberDescr {
  return {
    isSqlDomainZodDescrMeta: true,
    ...options,
  };
}

export function isSqlDomainZodNumberDescr<
  SDZND extends SqlDomainZodNumberDescr,
>(o: unknown): o is SDZND {
  const isSDZND = safety.typeGuard<SDZND>(
    "isSqlDomainZodDescrMeta",
    "isFloat",
    "isBigFloat",
    "isSerial",
  );
  return isSDZND(o);
}

export function zodNumberSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
>() {
  const ztaSDF = zodTypeAnySqlDomainFactory<
    z.ZodTypeAny,
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  return {
    ...ztaSDF,
    bigint: <
      ZodType extends z.ZodType<bigint, z.ZodBigIntDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({ SQL: () => `BIGINT` }),
      };
    },
    integer: <
      ZodType extends z.ZodType<number, z.ZodNumberDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      const defaultValue = init?.parents?.[0]?._def.defaultValue?.();
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({ SQL: () => `INTEGER` }),
        sqlDefaultValue: () => ({
          SQL: (_ctx: Context) => {
            return defaultValue != undefined ? defaultValue.toString() : "";
          },
        }),
      };
    },
    integerNullable: <
      ZodType extends z.ZodOptional<z.ZodType<number, z.ZodNumberDef>>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, { ...init, isOptional: true }),
        sqlDataType: () => ({ SQL: () => `INTEGER` }),
      };
    },
    serial: <
      ZodType extends z.ZodType<number, z.ZodNumberDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isPostgreSqlDialect(ctx.sqlDialect)) return "SERIAL";
            else if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return "INT IDENTITY(1,1)";
            }
            return "INTEGER AUTOINCREMENT";
          },
        }),
      };
    },
    float: <
      ZodType extends z.ZodType<number, z.ZodNumberDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      const defaultValue = init?.parents?.[0]?._def.defaultValue?.();
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isPostgreSqlDialect(ctx.sqlDialect)) return "FLOAT";
            return "REAL";
          },
        }),
        sqlDefaultValue: () => ({
          SQL: (_ctx: Context) => {
            return defaultValue != undefined ? defaultValue.toString() : "";
          },
        }),
      };
    },
    floatNullable: <
      ZodType extends z.ZodOptional<z.ZodType<number, z.ZodNumberDef>>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, { ...init, isOptional: true }),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isPostgreSqlDialect(ctx.sqlDialect)) return "FLOAT";
            return "REAL";
          },
        }),
      };
    },
    bigFloat: <
      ZodType extends z.ZodType<number, z.ZodNumberDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isPostgreSqlDialect(ctx.sqlDialect)) {
              return "DOUBLE PRECISION";
            }
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return "FLOAT";
            }
            return "REAL";
          },
        }),
      };
    },
    bigFloatNullable: <
      ZodType extends z.ZodOptional<z.ZodType<number, z.ZodNumberDef>>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, { ...init, isOptional: true }),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isPostgreSqlDialect(ctx.sqlDialect)) {
              return "DOUBLE PRECISION";
            }
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return "FLOAT";
            }
            return "REAL";
          },
        }),
      };
    },
  };
}

export type SqlDomainZodDateDescr = SqlDomainZodDescrMeta & {
  readonly isDateSqlDomain: true;
  readonly isDateTime?: boolean;
  readonly isCreatedAt?: boolean;
  readonly isUpdatedAt?: boolean;
  readonly isDeletedAt?: boolean;
};

export function sqlDomainZodDateDescr(
  options: Pick<
    SqlDomainZodDateDescr,
    "isDateTime" | "isCreatedAt" | "isUpdatedAt" | "isDeletedAt"
  >,
): SqlDomainZodDateDescr {
  return {
    isSqlDomainZodDescrMeta: true,
    isDateSqlDomain: true,
    ...options,
  };
}

export function isSqlDomainZodDateDescr<SDZJD extends SqlDomainZodDateDescr>(
  o: unknown,
): o is SDZJD {
  const isSDZJD = safety.typeGuard<SDZJD>(
    "isSqlDomainZodDescrMeta",
    "isDateSqlDomain",
  );
  return isSDZJD(o);
}

/**
 * Typical date formatting strategy is UTC-first.
 * @param init override SQL formatting
 * @returns a strategy factory
 */
export function sqlDateFormatStrategy(
  init?: {
    sqlDateFormat?: (date: Date) => string;
    sqlDateTimeFormat?: (date: Date) => string;
  },
) {
  const sqlDateFormat = init?.sqlDateFormat ??
    ((date) => date.toISOString().substring(0, 10));
  const sqlDateTimeFormat = init?.sqlDateTimeFormat ??
    ((date) => date.toISOString());

  return {
    sqlDateFormat,
    sqlDateTimeFormat,
  };
}

export function zodDateSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
>(
  dtfStrategy: ReturnType<typeof sqlDateFormatStrategy> =
    sqlDateFormatStrategy(),
) {
  const ztaSDF = zodTypeAnySqlDomainFactory<
    Any,
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  return {
    ...ztaSDF,
    dateFmtStrategy: dtfStrategy,
    date: <
      ZodType extends z.ZodType<Date, z.ZodDateDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
        readonly formattedDate?: (date: Date) => string;
      },
    ): SqlDomain<ZodType, Context, Identity, QualitySystem> => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({ SQL: () => `DATE` }),
        sqlDmlQuotedLiteral: (_, value, quotedLiteral) => {
          if (value instanceof Date) {
            return quotedLiteral(
              (init?.formattedDate ?? dtfStrategy.sqlDateFormat)(value) as Any,
            );
          }
          return quotedLiteral(value);
        },
      };
    },
    dateTime: <
      ZodType extends z.ZodType<Date, z.ZodDateDef>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
        readonly formattedDate?: (date: Date) => string;
      },
    ): SqlDomain<ZodType, Context, Identity, QualitySystem> => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return `DATETIME2`;
            }
            return `TIMESTAMP`;
          },
        }),
        sqlDmlQuotedLiteral: (_, value, quotedLiteral) => {
          if (value instanceof Date) {
            return quotedLiteral(
              (init?.formattedDate ?? dtfStrategy.sqlDateTimeFormat)(
                value,
              ) as Any,
            );
          }
          return quotedLiteral(value);
        },
      };
    },
    createdAt: <
      ZodType extends z.ZodOptional<z.ZodDefault<z.ZodDate>>,
      Identity extends string,
    >(init?: {
      readonly identity?: Identity;
      readonly parents?: z.ZodTypeAny[];
      readonly dateFormat?: Intl.DateTimeFormatOptions;
    }): SqlDomain<ZodType, Context, Identity, QualitySystem> => {
      return {
        ...ztaSDF.defaults<Identity>(
          z.date().default(new Date()).optional() as ZodType,
          { isOptional: true, ...init },
        ),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return `DATETIME2`;
            }
            return `TIMESTAMP`;
          },
        }),

        sqlDefaultValue: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return `GETDATE()`;
            }
            return `CURRENT_TIMESTAMP`;
          },
        }),
      };
    },
    updatedAt: <
      ZodType extends z.ZodOptional<z.ZodDefault<z.ZodDate>>,
      Identity extends string,
    >(init?: {
      readonly identity?: Identity;
      readonly parents?: z.ZodTypeAny[];
      readonly dateFormat?: Intl.DateTimeFormatOptions;
    }): SqlDomain<ZodType, Context, Identity, QualitySystem> => {
      return {
        ...ztaSDF.defaults<Identity>(
          z.date().default(new Date()).optional() as ZodType,
          { isOptional: true, ...init },
        ),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return `DATETIME2`;
            }
            return `TIMESTAMP`;
          },
        }),
      };
    },
    deletedAt: <
      ZodType extends z.ZodOptional<z.ZodDefault<z.ZodDate>>,
      Identity extends string,
    >(init?: {
      readonly identity?: Identity;
      readonly parents?: z.ZodTypeAny[];
      readonly dateFormat?: Intl.DateTimeFormatOptions;
    }): SqlDomain<ZodType, Context, Identity, QualitySystem> => {
      return {
        ...ztaSDF.defaults<Identity>(
          z.date().default(new Date()).optional() as ZodType,
          { isOptional: true, ...init },
        ),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return `DATETIME2`;
            }
            return `TIMESTAMP`;
          },
        }),
      };
    },
  };
}

export function zodEnumSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
>() {
  const ztaSDF = zodTypeAnySqlDomainFactory<
    Any,
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  return {
    ...ztaSDF,
    nativeNumeric: <
      ZodType extends z.ZodType<z.EnumLike, z.ZodNativeEnumDef<z.EnumLike>>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({ SQL: () => `INTEGER` }),
        parents: init?.parents,
      };
    },
    nativeText: <
      ZodType extends z.ZodType<z.EnumLike, z.ZodNativeEnumDef<z.EnumLike>>,
      Identity extends string,
    >(
      zodType: ZodType,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({ SQL: () => `TEXT` }),
        parents: init?.parents,
      };
    },
    zodText: <
      U extends string,
      T extends Readonly<[U, ...U[]]> | [U, ...U[]],
      Identity extends string,
    >(
      values: T,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(z.enum(values), init),
        sqlDataType: () => ({ SQL: () => `TEXT` }),
        parents: init?.parents,
      };
    },
    zodVarChar: <
      U extends string,
      T extends Readonly<[U, ...U[]]> | [U, ...U[]],
      Identity extends string,
    >(
      values: T,
      maxLength: number,
      init?: {
        readonly identity?: Identity;
        readonly isOptional?: boolean;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(z.enum(values), init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              return `NVARCHAR(${maxLength})`;
            }
            return `VARCHAR(${maxLength})`;
          },
        }),
        parents: init?.parents,
      };
    },
  };
}

export type ZodTypeSqlDomainFactoryFromHook<
  Identity extends string,
  ZodType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
> = (
  zodType: ZodType,
  init?: {
    readonly identity?: Identity;
    readonly isOptional?: boolean;
    readonly parents?: z.ZodTypeAny[];
  },
) => SqlDomain<ZodType, Context, Identity, QualitySystem>;

export const zodTypeSqlDomainFactoryFromHooks = new Map<
  string,
  ZodTypeSqlDomainFactoryFromHook<Any, Any, Any, Any>
>();

export function declareZodTypeSqlDomainFactoryFromHook(
  name: string,
  hook: ZodTypeSqlDomainFactoryFromHook<Any, Any, Any, Any>,
) {
  zodTypeSqlDomainFactoryFromHooks.set(name, hook);
  const result:
    & SqlDomainZodDescrMeta
    & ZodTypeSqlDomainFactoryFromHookSupplier = {
      isSqlDomainZodDescrMeta: true,
      zodTypeSqlDomainFrom: name,
    };
  return result;
}

export type ZodTypeSqlDomainFactoryFromHookSupplier = {
  readonly zodTypeSqlDomainFrom: string;
};

export function isZodTypeSqlDomainFactoryFromHookSupplier<
  ZTSDFHS extends ZodTypeSqlDomainFactoryFromHookSupplier,
>(o: unknown): o is ZTSDFHS {
  const isZTSDFHS = safety.typeGuard<ZTSDFHS>("zodTypeSqlDomainFrom");
  return isZTSDFHS(o);
}

export function zodTypeSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
  QualitySystem extends SqlDomainQS,
>() {
  const SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE =
    "SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE";

  const anySDF = zodTypeAnySqlDomainFactory<
    Any,
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  const stringSDF = zodStringSqlDomainFactory<
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  const arraySDF = zodArraySqlDomainFactory<
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  const numberSDF = zodNumberSqlDomainFactory<
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  const dateSDF = zodDateSqlDomainFactory<
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  const enumSDF = zodEnumSqlDomainFactory<
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  const jsonSDF = zodJsonSqlDomainFactory<
    DomainsIdentity,
    Context,
    QualitySystem
  >();
  const booleanSDF = zodBooleanSqlDomainFactory<
    DomainsIdentity,
    Context,
    QualitySystem
  >();

  const detachFrom = <ZodType extends z.ZodTypeAny>(zodType: ZodType): void => {
    delete (zodType as Any)["sqlDomain"];

    const zodDef = zodType._def;
    switch (zodDef.typeName) {
      case z.ZodFirstPartyTypeKind.ZodOptional: {
        return detachFrom(zodType._def.innerType);
      }

      case z.ZodFirstPartyTypeKind.ZodDefault: {
        return detachFrom(zodType._def.innerType);
      }
    }
  };

  const descriptionHook = <
    Identity extends string,
    ZodType extends z.ZodTypeAny,
  >(
    zodType: ZodType,
    init?: {
      readonly identity?: Identity;
      readonly isOptional?: boolean;
      readonly parents?: z.ZodTypeAny[];
    },
  ) => {
    if (zodType._def.description) {
      const metaText = zodType._def.description;
      try {
        const descrMeta = JSON.parse(zodType._def.description);
        if (isSqlDomainZodDescr(descrMeta)) {
          return {
            zodType,
            init,
            metaText,
            descrMeta,
            descrMetaError: undefined,
          };
        }
      } catch (err) {
        return {
          zodType,
          init,
          metaText,
          descrMeta: undefined,
          descrMetaError: err,
        };
      }
    } else if (zodType._def.type?._def?.description) {
      const metaText = zodType._def.type?._def?.description;
      try {
        const descrMeta = JSON.parse(zodType._def.type?._def?.description);
        if (isSqlDomainZodDescr(descrMeta)) {
          return {
            zodType,
            init,
            metaText,
            descrMeta,
            descrMetaError: undefined,
          };
        }
      } catch (err) {
        return {
          zodType,
          init,
          metaText,
          descrMeta: undefined,
          descrMetaError: err,
        };
      }
    }
    return undefined;
  };

  const from = <Identity extends string, ZodType extends z.ZodTypeAny>(
    zodType: ZodType,
    init?: {
      readonly identity?: Identity;
      readonly isOptional?: boolean;
      readonly parents?: z.ZodTypeAny[];
    },
  ): SqlDomain<ZodType, Context, Identity, QualitySystem> => {
    const zodDef = zodType._def;

    // we allow SqlDomain "hooks" to be defined in meta data
    const zodDefHook = descriptionHook(zodType, init);
    if (
      zodDefHook?.descrMeta &&
      isZodTypeSqlDomainFactoryFromHookSupplier(zodDefHook.descrMeta)
    ) {
      const hookName = zodDefHook.descrMeta.zodTypeSqlDomainFrom;
      const hook = zodTypeSqlDomainFactoryFromHooks.get(hookName);
      if (hook) {
        return hook(zodType, init);
      }
      throw new Error(
        `Unable to map Zod type ${zodDef.typeName} to SQL domain, invalid from hook name '${hookName}' (${
          JSON.stringify(
            zodDef,
          )
        } init: ${JSON.stringify(init)})`,
      );
    }

    switch (zodDef.typeName) {
      case z.ZodFirstPartyTypeKind.ZodOptional: {
        return from(zodType._def.innerType, {
          ...init,
          isOptional: true,
          parents: init?.parents ? [...init.parents, zodType] : [zodType],
        });
      }

      case z.ZodFirstPartyTypeKind.ZodDefault: {
        return from(zodType._def.innerType, {
          ...init,
          parents: init?.parents ? [...init.parents, zodType] : [zodType],
        });
      }
    }

    switch (zodDef.typeName) {
      case z.ZodFirstPartyTypeKind.ZodBoolean: {
        return booleanSDF.boolean(zodType, init);
      }

      case z.ZodFirstPartyTypeKind.ZodArray: {
        if (zodDefHook?.descrMeta) {
          if (isSqlDomainZodArrayDescr(zodDefHook.descrMeta)) {
            return zodDefHook.descrMeta.isFloat
              ? arraySDF.arrayFloat(zodType, init)
              : arraySDF.arrayText(zodType, init);
          } else {
            throw new Error(
              `Unable to map Zod type ${zodDef.typeName} to SQL domain, description meta is not for ZodString ${
                JSON.stringify(
                  zodDefHook.descrMeta,
                )
              }`,
            );
          }
        } else {
          return arraySDF.arrayText(zodType, init);
        }
      }

      case z.ZodFirstPartyTypeKind.ZodString: {
        if (zodDefHook?.descrMeta) {
          if (isSqlDomainZodStringDescr(zodDefHook.descrMeta)) {
            return zodDefHook.descrMeta.isJsonText
              ? stringSDF.jsonString(zodType, init)
              : (zodDefHook.descrMeta.isVarChar
                ? stringSDF.varChar(zodType, init)
                : (zodDefHook.descrMeta.isSemver
                  ? stringSDF.semver(zodType, init)
                  : (zodDefHook.descrMeta.isUuid
                    ? stringSDF.uuid(zodType, init)
                    : (zodDefHook.descrMeta.isUlid
                      ? stringSDF.ulid(zodType, init)
                      : (zodDefHook.descrMeta.isBlobText
                        ? stringSDF.blobString(zodType, init)
                        : stringSDF.string(zodType, init))))));
          } else {
            throw new Error(
              `Unable to map Zod type ${zodDef.typeName} to SQL domain, description meta is not for ZodString ${
                JSON.stringify(
                  zodDefHook.descrMeta,
                )
              }`,
            );
          }
        } else {
          return stringSDF.string(zodType, init);
        }
      }

      case z.ZodFirstPartyTypeKind.ZodNumber: {
        if (zodDefHook?.descrMeta) {
          if (isSqlDomainZodNumberDescr(zodDefHook.descrMeta)) {
            if (zodDefHook.descrMeta.isSerial) {
              return numberSDF.serial(zodType, init);
            } else if (zodDefHook.descrMeta.isBigFloat) {
              return numberSDF.bigFloat(zodType, init);
            } else if (zodDefHook.descrMeta.isFloat) {
              return numberSDF.float(zodType, init);
            } else {
              return numberSDF.integer(zodType, init);
            }
          } else {
            throw new Error(
              `Unable to map Zod type ${zodDef.typeName} to SQL domain, description meta is not for ZodNumber ${
                JSON.stringify(
                  zodDefHook.descrMeta,
                )
              }`,
            );
          }
        } else {
          return numberSDF.integer(zodType, init);
        }
      }

      case z.ZodFirstPartyTypeKind.ZodBigInt: {
        return numberSDF.bigint(zodType, init);
      }

      case z.ZodFirstPartyTypeKind.ZodDate: {
        if (zodDefHook?.descrMeta) {
          if (isSqlDomainZodDateDescr(zodDefHook.descrMeta)) {
            if (zodDefHook.descrMeta.isCreatedAt) {
              return zodDefHook.descrMeta.isCreatedAt
                ? dateSDF.createdAt(init)
                : zodDefHook.descrMeta.isDateTime
                ? dateSDF.dateTime(zodType, init)
                : dateSDF.date(zodType, init);
            } else if (zodDefHook.descrMeta.isUpdatedAt) {
              return zodDefHook.descrMeta.isUpdatedAt
                ? dateSDF.updatedAt(init)
                : zodDefHook.descrMeta.isDateTime
                ? dateSDF.dateTime(zodType, init)
                : dateSDF.date(zodType, init);
            } else {
              return zodDefHook.descrMeta.isDeletedAt
                ? dateSDF.deletedAt(init)
                : zodDefHook.descrMeta.isDateTime
                ? dateSDF.dateTime(zodType, init)
                : dateSDF.date(zodType, init);
            }
          } else {
            throw new Error(
              `Unable to map Zod type ${zodDef.typeName} to SQL domain, description meta is not for ZodDate ${
                JSON.stringify(
                  zodDefHook.descrMeta,
                )
              }`,
            );
          }
        } else {
          return dateSDF.date(zodType, init);
        }
      }

      case z.ZodFirstPartyTypeKind.ZodNativeEnum: {
        return enumSDF.nativeNumeric(zodType, init);
      }

      case z.ZodFirstPartyTypeKind.ZodEnum: {
        return enumSDF.zodText(
          (zodType as Any as z.ZodEnum<Any>)._def.values,
          init,
        );
      }

      case z.ZodFirstPartyTypeKind.ZodLazy: {
        if (zodDefHook?.descrMeta) {
          if (isSqlDomainZodJsonDescr(zodDefHook.descrMeta)) {
            return jsonSDF.json(zodType, init);
          } else {
            throw new Error(
              `Unable to map Zod type ${zodDef.typeName} to SQL domain, descr hook is not for JSON ${
                JSON.stringify(
                  zodDefHook.descrMeta,
                )
              }`,
            );
          }
        } else {
          throw new Error(
            `Unable to map Zod type ${zodDef.typeName} to SQL domain, no description meta found (${
              JSON.stringify(
                zodDef,
              )
            } init: ${JSON.stringify(init)})`,
          );
        }
      }

      default:
        throw new Error(
          `Unable to map Zod type ${zodDef.typeName} to SQL domain (${
            JSON.stringify(zodDef)
          } init: ${
            JSON.stringify(
              init,
            )
          })`,
        );
    }
  };

  const cacheableFrom = <Identity extends string, ZodType extends z.ZodTypeAny>(
    zodType: ZodType,
    init?: {
      readonly identity?: Identity;
      readonly isOptional?: boolean;
      readonly parents?: z.ZodTypeAny[];
      readonly forceCreate?: boolean;
    },
  ): SqlDomain<ZodType, Context, Identity, QualitySystem> => {
    // if a sqlDomain is already attached to a ZodType use it as-is;
    if (anySDF.isSqlDomainSupplier(zodType)) {
      if (!init?.forceCreate) {
        const proxied = (zodType as Any).sqlDomain as SqlDomain<
          ZodType,
          Context,
          Identity,
          QualitySystem
        >;
        if (proxied.identity == anySDF.SQL_DOMAIN_NOT_IN_COLLECTION) {
          (proxied.identity as string) = init?.identity ??
            SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE;
        }
        return proxied;
      } else {
        detachFrom(zodType);
      }
    }

    return from(zodType, init);
  };

  return {
    SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE,
    anySDF,
    arraySDF,
    stringSDF,
    booleanSDF,
    numberSDF,
    dateSDF,
    enumSDF,
    detachFrom,
    descriptionHook,
    from,
    cacheableFrom,
  };
}
