import { zod as z } from "../deps.ts";
import * as tmpl from "../emit/mod.ts";
import * as safety from "../../lib/universal/safety.ts";
import { SQLa } from "../../pattern/typical/mod.ts";

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

export type SqlDomain<
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string,
> = tmpl.SqlSymbolSupplier<Context> & {
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
> = <ZodType extends z.ZodTypeAny, Identity extends DomainsIdentity>(
  zodType: ZodType,
  init?: { identity: Identity },
) => SqlDomain<ZodType, Context, Identity>;

export type SqlDomainSupplier<
  ZodType extends z.ZodTypeAny,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
> = { readonly sqlDomain: SqlDomain<ZodType, Context, DomainsIdentity> };

export type SqlCustomDomainSupplier<
  Enrich extends Record<string, unknown>,
  ZodType extends z.ZodTypeAny,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
> = {
  readonly sqlDomain: SqlDomain<ZodType, Context, DomainsIdentity> & Enrich;
};

export type ZodTypeSqlDomainSupplier<
  ZodType extends z.ZodTypeAny,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
> = ZodType & SqlDomainSupplier<ZodType, DomainsIdentity, Context>;

export function zodTypeAnySqlDomainFactory<
  ZodType extends z.ZodTypeAny,
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>() {
  const SQL_DOMAIN_NOT_IN_COLLECTION = "SQL_DOMAIN_NOT_IN_COLLECTION" as const;

  const isSqlDomain = safety.typeGuard<
    SqlDomain<ZodType, Context, DomainsIdentity>
  >("isSqlDomain", "sqlDataType");

  const isSqlDomainSupplier = safety.typeGuard<
    SqlDomainSupplier<ZodType, DomainsIdentity, Context>
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
    const defaults:
      & Pick<
        SqlDomain<Any, Context, Identity>,
        "identity" | "isSqlDomain" | "sqlSymbol" | "isNullable"
      >
      & tmpl.SqlLintIssuesSupplier = {
        isSqlDomain: true as true, // must not be a boolean but `true`
        identity: (init?.identity ?? SQL_DOMAIN_NOT_IN_COLLECTION) as Identity,
        isNullable: () =>
          init?.isOptional || zodType.isOptional() || zodType.isNullable(),
        sqlSymbol: (ctx: Context) =>
          ctx
            .sqlNamingStrategy(ctx, { quoteIdentifiers: true })
            .domainName(init?.identity ?? SQL_DOMAIN_NOT_IN_COLLECTION),
        lintIssues,
        registerLintIssue: (...slis: tmpl.SqlLintIssueSupplier[]) => {
          lintIssues.push(...slis);
        },
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
};

export function sqlDomainZodStringDescr(
  options: Pick<SqlDomainZodStringDescr, "isJsonText" | "isVarChar">,
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
  return isSDZSD(o) && ("isJsonText" in o || "isVarChar" in o);
}

export function zodStringSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>(zsdfOptions?: { defaultVarCharMaxLen?: number }) {
  const ztaSDF = zodTypeAnySqlDomainFactory<Any, DomainsIdentity, Context>();
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
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: () => `JSON`,
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
>() {
  const ztaSDF = zodTypeAnySqlDomainFactory<Any, DomainsIdentity, Context>();
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
        sqlDataType: () => ({ SQL: () => `JSONB` }),
        parents: init?.parents,
      };
    },
  };
}

export type SqlDomainZodNumberDescr = SqlDomainZodDescrMeta & {
  readonly isFloat: boolean;
  readonly isBigFloat: boolean;
};

export function sqlDomainZodNumberDescr(
  options: Pick<SqlDomainZodNumberDescr, "isFloat" | "isBigFloat">,
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
  );
  return isSDZND(o);
}

export function zodNumberSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>() {
  const ztaSDF = zodTypeAnySqlDomainFactory<
    z.ZodTypeAny,
    DomainsIdentity,
    Context
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
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({ SQL: () => `INTEGER` }),
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
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (SQLa.isPostgreSqlDialect(ctx.sqlDialect)) return "FLOAT";
            return "REAL";
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
            if (SQLa.isPostgreSqlDialect(ctx.sqlDialect)) return "FLOAT";
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
            if (SQLa.isPostgreSqlDialect(ctx.sqlDialect)) {
              return "DOUBLE PRECISION";
            }
            if (SQLa.isMsSqlServerDialect(ctx.sqlDialect)) {
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
            if (SQLa.isPostgreSqlDialect(ctx.sqlDialect)) {
              return "DOUBLE PRECISION";
            }
            if (SQLa.isMsSqlServerDialect(ctx.sqlDialect)) {
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
};

export function sqlDomainZodDateDescr(
  options: Pick<SqlDomainZodDateDescr, "isDateTime" | "isCreatedAt">,
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

export function zodDateSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>(
  factoryInit?: {
    sqlDateFormat?: (date: Date) => string;
    sqlDateTimeFormat?: (date: Date) => string;
  },
) {
  // For "YYYY-MM-DD"
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // For "YYYY-MM-DD HH:MM"
  const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const sqlDateFormat = factoryInit?.sqlDateFormat ??
    ((date) =>
      dateFormatter.format(date).split("/").reverse().join(
        "-",
      ));
  const sqlDateTimeFormat = factoryInit?.sqlDateTimeFormat ??
    ((date) => dateTimeFormatter.format(date).replace(/\//g, "-"));
  const ztaSDF = zodTypeAnySqlDomainFactory<Any, DomainsIdentity, Context>();
  return {
    ...ztaSDF,
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
    ): SqlDomain<ZodType, Context, Identity> => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({ SQL: () => `DATE` }),
        sqlDmlQuotedLiteral: (_, value, quotedLiteral) => {
          if (value instanceof Date) {
            return quotedLiteral(
              (init?.formattedDate ?? sqlDateFormat)(value) as Any,
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
    ): SqlDomain<ZodType, Context, Identity> => {
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
              (init?.formattedDate ?? sqlDateTimeFormat)(value) as Any,
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
    }): SqlDomain<ZodType, Context, Identity> => {
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
  };
}

export function zodEnumSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>() {
  const ztaSDF = zodTypeAnySqlDomainFactory<Any, DomainsIdentity, Context>();
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
        sqlDataType: () => ({
          SQL: (ctx: Context) => {
            if (tmpl.isMsSqlServerDialect(ctx.sqlDialect)) {
              // TODO: refactor this to its own render/dialect/mssql similar to render/dialect/pg
              return `NVARCHAR(450)`;
            }
            return `TEXT`;
          },
        }),
      };
    },
  };
}

export type ZodTypeSqlDomainFactoryFromHook<
  Identity extends string,
  ZodType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = (
  zodType: ZodType,
  init?: {
    readonly identity?: Identity;
    readonly isOptional?: boolean;
    readonly parents?: z.ZodTypeAny[];
  },
) => SqlDomain<ZodType, Context, Identity>;

export const zodTypeSqlDomainFactoryFromHooks = new Map<
  string,
  ZodTypeSqlDomainFactoryFromHook<Any, Any, Any>
>();

export function declareZodTypeSqlDomainFactoryFromHook(
  name: string,
  hook: ZodTypeSqlDomainFactoryFromHook<Any, Any, Any>,
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
>() {
  const SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE =
    "SQL_DOMAIN_HAS_NO_IDENTITY_FROM_SHAPE";

  const anySDF = zodTypeAnySqlDomainFactory<Any, DomainsIdentity, Context>();
  const stringSDF = zodStringSqlDomainFactory<DomainsIdentity, Context>();
  const numberSDF = zodNumberSqlDomainFactory<DomainsIdentity, Context>();
  const dateSDF = zodDateSqlDomainFactory<DomainsIdentity, Context>();
  const enumSDF = zodEnumSqlDomainFactory<DomainsIdentity, Context>();
  const jsonSDF = zodJsonSqlDomainFactory<DomainsIdentity, Context>();

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
  ): SqlDomain<ZodType, Context, Identity> => {
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
      case z.ZodFirstPartyTypeKind.ZodString: {
        if (zodDefHook?.descrMeta) {
          if (isSqlDomainZodStringDescr(zodDefHook.descrMeta)) {
            return zodDefHook.descrMeta.isJsonText
              ? stringSDF.jsonString(zodType, init)
              : (zodDefHook.descrMeta.isVarChar
                ? stringSDF.varChar(zodType, init)
                : stringSDF.string(zodType, init));
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
            return zodDefHook.descrMeta.isBigFloat
              ? numberSDF.bigFloat(zodType, init)
              : zodDefHook.descrMeta.isFloat
              ? numberSDF.float(zodType, init)
              : numberSDF.integer(zodType, init);
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
            return zodDefHook.descrMeta.isCreatedAt
              ? dateSDF.createdAt(init)
              : zodDefHook.descrMeta.isDateTime
              ? dateSDF.dateTime(zodType, init)
              : dateSDF.date(zodType, init);
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
  ): SqlDomain<ZodType, Context, Identity> => {
    // if a sqlDomain is already attached to a ZodType use it as-is;
    if (anySDF.isSqlDomainSupplier(zodType)) {
      if (!init?.forceCreate) {
        const proxied = (zodType as Any).sqlDomain as SqlDomain<
          ZodType,
          Context,
          Identity
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
    stringSDF,
    numberSDF,
    dateSDF,
    enumSDF,
    detachFrom,
    descriptionHook,
    from,
    cacheableFrom,
  };
}
