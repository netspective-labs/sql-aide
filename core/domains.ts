import { zod as z } from "../deps.ts";
import * as safety from "../lib/universal/safety.ts";
import * as za from "../lib/universal/zod-aide.ts";
import * as tmpl from "../sql.ts";
import * as d from "./domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type SqlDomains<
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
  EntityIdentity extends string,
  Context extends tmpl.SqlEmitContext,
>() {
  let sqlDomainsIterationIndex = 0;
  const sdf = d.zodTypeSqlDomainFactory<Any, Context>();
  const zb = za.zodBaggage<
    d.SqlDomain<Any, Context, Any>,
    d.SqlDomainSupplier<Any, Any, Context>
  >("sqlDomain");

  const sqlDomains = <
    RawShape extends z.ZodRawShape,
    BaggageSchema extends {
      [Property in keyof RawShape]: ReturnType<
        typeof zb.introspectableZodTypeBaggage<RawShape[Property]>
      >;
    },
    SqlDomainSchema extends SqlDomains<RawShape, Context>,
  >(zodRawShape: RawShape, init?: {
    readonly identity?: (init: {
      readonly zSchema: z.ZodObject<RawShape>;
      readonly zbSchema: BaggageSchema;
      readonly sdSchema: SqlDomainSchema;
    }) => EntityIdentity;
  }) => {
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

    const identity = init?.identity?.({ zSchema, zbSchema, sdSchema }) ??
      (`anonymous${++sqlDomainsIterationIndex}` as EntityIdentity);
    return {
      identity,
      zSchema,
      zbSchema,
      sdSchema,
    };
  };

  function sqlReferencableDomains<
    RawShape extends z.ZodRawShape,
    DomainsIdentity extends string,
  >(
    zodRawShape: RawShape,
    init?: {
      readonly identity?: (
        init: { readonly zSchema: z.ZodObject<RawShape> },
      ) => EntityIdentity;
    },
  ) {
    const common = sqlDomains(zodRawShape, init);

    type ReferenceSource = {
      readonly identity: EntityIdentity;
      readonly incomingRefs: Set<ReferenceDestination>;
      readonly register: (rd: ReferenceDestination) => ReferenceDestination;
    };

    type ReferenceDestination = {
      readonly refSource: ReferenceSource;
    };

    type RefSrcPlaceholderSupplier = {
      readonly nativeRefSrcPlaceholder: ReferenceSource;
    };

    const inferables = () => {
      // the "inferred types" are the same as their original types except without
      // optionals, defaults, or nulls (always required, considered the "CoreZTA");
      type InferReferences = {
        [Property in keyof RawShape]: () => za.CoreZTA<RawShape[Property]>;
      };

      const inferredPlaceholder = () => {
        const incomingRefs = new Set<ReferenceDestination>();
        const refSource: ReferenceSource = {
          identity: common.identity,
          incomingRefs,
          register: (rd) => {
            incomingRefs.add(rd);
            return rd;
          },
        };
        return refSource;
      };

      const inferables: InferReferences = {} as Any;
      const { shape, keys: shapeKeys } = common.zSchema._getCached();
      for (const key of shapeKeys) {
        const zodType = shape[key];
        (inferables[key] as Any) = () => {
          // because zodSchema may have been cloned/copied from another sqlDomain we
          // want to forceCreate = true
          const placeholder = sdf.coreSqlDomain(zodType, {
            identity: key as DomainsIdentity,
          });
          const nativeRefSrcPlaceholder = inferredPlaceholder();
          const nri:
            & d.SqlDomain<za.CoreZTA<typeof zodType>, Context, typeof key>
            & RefSrcPlaceholderSupplier = {
              nativeRefSrcPlaceholder, // <-- this is what allows isInferencePlaceholder() to pick up the placeholder
              ...placeholder,
            };

          // trick Typescript into thinking the Zod instance is also a SqlDomainSupplier;
          // this allows assignment of a reference to a Zod object or use as a
          // regular Zod schema; the sqlDomain is carried in zodType._def
          return zb.introspectableZodTypeBaggage<typeof zodType>(
            zodType,
            nri,
          );
        };
      }

      return inferables;
    };

    const references = () => {
      const isInferencePlaceholder = safety.typeGuard<
        RefSrcPlaceholderSupplier
      >("nativeRefSrcPlaceholder");

      type References = {
        [
          Property in keyof RawShape as Extract<
            Property,
            RawShape[Property] extends RefSrcPlaceholderSupplier ? Property
              : never
          >
        ]:
          & d.SqlDomain<
            RawShape[Property],
            Context,
            Extract<Property, string>
          >
          & ReferenceDestination;
      };

      // see if any references were registered but need to be created
      const references: References = {} as Any;
      const { shape, keys: shapeKeys } = common.zSchema._getCached();
      for (const key of shapeKeys) {
        const domain = common.sdSchema[key];
        if (isInferencePlaceholder(domain)) {
          const reference: ReferenceDestination = {
            refSource: domain.nativeRefSrcPlaceholder,
          };
          const zodType = shape[key];
          const finalDomain = sdf.coreSqlDomain(zodType, {
            identity: key as DomainsIdentity,
          });
          (common.sdSchema[key] as Any) = {
            ...finalDomain,
            ...reference,
          };
          (references as Any)[key] = finalDomain;
        }
      }

      return references;
    };

    return {
      ...common,
      infer: inferables(),
      references: references(),
    };
  }

  return {
    ...zb,
    ...sdf,
    sqlDomains,
    sqlReferencableDomains,
  };
}
