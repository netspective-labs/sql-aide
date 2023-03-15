import { zod as z } from "../deps.ts";
import * as tmpl from "../sql.ts";
import * as za from "../zod-aide.ts";
import * as d from "./domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type SqlDomainsShape<
  ZodRawShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
> = {
  [Property in keyof ZodRawShape]: d.SqlDomain<
    ZodRawShape[Property],
    Context,
    Extract<Property, string>
  >;
};

export type SqlDomainsSupplier<Context extends tmpl.SqlEmitContext> = {
  readonly domains: () => d.SqlDomain<Any, Context, Any>[];
};

export function sqlDomainsFactory<
  DomainsIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>() {
  const sdf = d.zodTypeSqlDomainFactory<DomainsIdentity, Context>();
  const zb = za.zodBaggage<
    d.SqlDomain<Any, Context, DomainsIdentity>,
    { sqlDomain: d.SqlDomain<Any, Context, DomainsIdentity> }
  >("sqlDomain");

  const sqlDomains = <
    RawShape extends z.ZodRawShape,
    BaggageSchema extends {
      [Property in keyof RawShape]: ReturnType<
        typeof zb.introspectableZodTypeBaggage<RawShape[Property]>
      >;
    },
    SqlDomainSchema extends SqlDomainsShape<RawShape, Context>,
  >(zodRawShape: RawShape) => {
    const zSchema = z.object(zodRawShape).strict();
    const zbSchema: BaggageSchema = {} as Any;
    const sdSchema: SqlDomainSchema = {} as Any;

    const { shape, keys: shapeKeys } = zSchema._getCached();
    for (const key of shapeKeys) {
      const member = shape[key];
      const sqlDomain = sdf.coreSqlDomain(member, { identity: key as Any });
      const iztb = zb.introspectableZodTypeBaggage<typeof member>(
        member,
        sqlDomain,
      );
      (zbSchema[key] as Any) = iztb;
      (sdSchema[key] as Any) = iztb.sqlDomain;
    }

    return { zSchema, zbSchema, sdSchema };
  };

  return {
    ...zb,
    ...sdf,
    sqlDomains,
  };
}
