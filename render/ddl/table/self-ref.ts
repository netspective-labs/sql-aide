import { zod as z } from "../../deps.ts";
import * as safety from "../../../lib/universal/safety.ts";
import * as tmpl from "../../emit/mod.ts";
import * as za from "../../../lib/universal/zod-aide.ts";
import * as d from "../../domain/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type SelfRefPlaceholder = {
  readonly isSelfRefPlaceholder: true;
  readonly selfRefDomain: d.SqlDomain<Any, Any, Any, Any> | undefined;
};

export const isSelfRefPlaceholder = safety.typeGuard<SelfRefPlaceholder>(
  "isSelfRefPlaceholder",
  "selfRefDomain",
);

export type SelfRefPlaceholderSupplier = {
  readonly selfRefPlaceholder: SelfRefPlaceholder;
};

export const isSelfRefPlaceholderSupplier = safety.typeGuard<
  SelfRefPlaceholderSupplier
>(
  "selfRefPlaceholder",
);

export const selfRefPlacholderZB = za.zodBaggage<
  SelfRefPlaceholder,
  SelfRefPlaceholderSupplier
>("selfRefPlaceholder");

export function selfRef<
  ZTA extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
  DomainQS extends d.SqlDomainQS,
  DomainsQS extends d.SqlDomainsQS<DomainsQS>,
  // the "inferred type" is the same as the original types except without
  // optionals, defaults, or nulls (always required, considered the "CoreZTA");
  SelfReference = za.CoreZTA<ZTA> & SelfRefPlaceholderSupplier,
>(
  zodType: ZTA,
  sdf: ReturnType<
    typeof d.sqlDomainsFactory<Any, Context, DomainQS, DomainsQS>
  >,
) {
  // trick Typescript into thinking Zod instance is also SR placeholder;
  // this allows assignment of a reference to a Zod object or use as a
  // regular Zod schema; the placeholder is carried in zodType._def
  const cloned = sdf.clearWrappedBaggage(
    za.clonedZodType(zodType),
  );
  return selfRefPlacholderZB.zodTypeBaggageProxy(
    cloned,
    {
      isSelfRefPlaceholder: true,
      selfRefDomain: sdf.isBaggageSupplier(zodType)
        ? zodType.sqlDomain
        : undefined,
    },
  ) as SelfReference;
}
