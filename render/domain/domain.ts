import { zod as z } from "../deps.ts";
import * as tmpl from "../emit/mod.ts";
import * as safety from "../../lib/universal/safety.ts";

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
  readonly sqlDmlTransformInsertableValue?: (
    supplied: ZTA | undefined,
  ) => ZTA;
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
> = <
  ZodType extends z.ZodTypeAny,
  Identity extends DomainsIdentity,
>(
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
  >("sqlDomain");

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
          ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true }).domainName(
            init?.identity ?? SQL_DOMAIN_NOT_IN_COLLECTION,
          ),
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

export function zodStringSqlDomainFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>() {
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
        sqlDataType: () => ({ SQL: () => `TEXT` }),
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
const literalSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

export const zodJsonSchema: z.ZodType<Json> = z.lazy(
  () =>
    z.union([literalSchema, z.array(zodJsonSchema), z.record(zodJsonSchema)]),
  zodSqlDomainRawCreateParams(sqlDomainZodJsonDescrMeta()),
);

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
        sqlDataType: () => ({ SQL: () => `JSON` }),
        parents: init?.parents,
      };
    },
  };
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
>() {
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
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({ SQL: () => `DATE` }),
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
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(zodType, init),
        sqlDataType: () => ({ SQL: () => `DATETIME` }),
      };
    },
    createdAt: <
      ZodType extends z.ZodOptional<z.ZodDefault<z.ZodDate>>,
      Identity extends string,
    >(
      init?: {
        readonly identity?: Identity;
        readonly parents?: z.ZodTypeAny[];
      },
    ) => {
      return {
        ...ztaSDF.defaults<Identity>(
          z.date().default(new Date()).optional() as ZodType,
          { isOptional: true, ...init },
        ),
        sqlDataType: () => ({ SQL: () => `DATETIME` }),
        sqlDefaultValue: () => ({ SQL: () => `CURRENT_TIMESTAMP` }),
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
        sqlDataType: () => ({ SQL: () => `TEXT` }),
        parents: init?.parents,
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
>(
  o: unknown,
): o is ZTSDFHS {
  const isZTSDFHS = safety.typeGuard<ZTSDFHS>(
    "zodTypeSqlDomainFrom",
  );
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
  >(zodType: ZodType, init?: {
    readonly identity?: Identity;
    readonly isOptional?: boolean;
    readonly parents?: z.ZodTypeAny[];
  }) => {
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

  const from = <
    Identity extends string,
    ZodType extends z.ZodTypeAny,
  >(
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
          JSON.stringify(zodDef)
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
        return stringSDF.string(zodType, init);
      }

      case z.ZodFirstPartyTypeKind.ZodNumber: {
        return numberSDF.integer(zodType, init);
      }

      case z.ZodFirstPartyTypeKind.ZodBigInt: {
        return numberSDF.bigint(zodType, init);
      }

      case z.ZodFirstPartyTypeKind.ZodDate: {
        if (zodDefHook?.descrMeta) {
          if (isSqlDomainZodDateDescr(zodDefHook.descrMeta)) {
            return zodDefHook.descrMeta.isCreatedAt
              ? dateSDF.createdAt(init)
              : (zodDefHook.descrMeta.isDateTime
                ? dateSDF.dateTime(zodType, init)
                : dateSDF.date(zodType, init));
          } else {
            throw new Error(
              `Unable to map Zod type ${zodDef.typeName} to SQL domain, description meta is not for ZodDate ${
                JSON.stringify(zodDefHook.descrMeta)
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
          (zodType as Any as z.ZodEnum<Any>)._def.values.values,
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
                JSON.stringify(zodDefHook.descrMeta)
              }`,
            );
          }
        } else {
          throw new Error(
            `Unable to map Zod type ${zodDef.typeName} to SQL domain, no description meta found (${
              JSON.stringify(zodDef)
            } init: ${JSON.stringify(init)})`,
          );
        }
      }

      default:
        throw new Error(
          `Unable to map Zod type ${zodDef.typeName} to SQL domain (${
            JSON.stringify(zodDef)
          } init: ${JSON.stringify(init)})`,
        );
    }
  };

  const cacheableFrom = <
    Identity extends string,
    ZodType extends z.ZodTypeAny,
  >(
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
