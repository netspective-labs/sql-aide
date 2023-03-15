// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

/**
 * Arbitrarily "enrich" any Typescript object with custom properties.
 * @param property identifies our enrichment property
 * @returns a class-like object with utility functions
 */
export function flexibleEnrichment<
  Target,
  Enrichment,
  EnrichmentSupplier extends { [key: string]: Enrichment } = {
    [key: string]: Enrichment;
  },
  EnrichmentProp extends keyof EnrichmentSupplier = keyof EnrichmentSupplier,
>(property: EnrichmentProp) {
  const isEnrichmentSupplier = (o: unknown): o is EnrichmentSupplier => {
    if (o && typeof o === "object" && property in o) return true;
    return false;
  };

  const deenriched = (target: Target): Target => {
    if (isEnrichmentSupplier(target)) {
      delete target[property];
      return target;
    }
    return target;
  };

  return {
    isEnrichmentSupplier,
    enrichment: (search: Target) => {
      if (isEnrichmentSupplier(search)) {
        return search[property];
      }
      return undefined;
    },
    withEnrichmentCustom: <
      E extends Enrichment,
      Result = Enrichment,
    >(target: Target, enrichmentFn: () => E) => {
      // don't search, just forcibly set
      const enrichment = enrichmentFn();
      (target as Any)[property] = enrichment;

      // this will trick the type-script compiler into thinking the Target
      // has an enrichment so compile-type type checking will work well;
      return enrichment as unknown as Result;
    },
    withEnrichment: <
      E extends Enrichment,
      Result = Enrichment,
    >(target: Target, enrichmentFn: () => E) => {
      // only set if it doesn't already exist somewhere in the ZodType
      if (!isEnrichmentSupplier(target)) {
        const enrichment = enrichmentFn();
        (target as Any)[property] = enrichment;
      }
      return (target as Any)[property] as unknown as Result;
    },
    withEnrichmentSupplierCustom: <
      E extends Enrichment,
      Result = Target & EnrichmentSupplier,
    >(target: Target, enrichment: () => E) => {
      // don't search, just forcibly set
      (target as Any)[property] = enrichment();

      // this will trick the type-script compiler into thinking the Target
      // has an enrichment so compile-type type checking will work well;
      return target as unknown as Result;
    },
    withEnrichmentSupplier: <
      E extends Enrichment,
      Result = Target & EnrichmentSupplier,
    >(target: Target, enrichment: () => E) => {
      // only set if it doesn't already exist somewhere in the ZodType
      if (!isEnrichmentSupplier(target)) {
        (target as Any)[property] = enrichment();
      }

      // this will trick the type-script compiler into thinking the ZodType
      // has an enrichment so compile-type type checking will work well;
      // at runtime you use enrichment(search) to find at proper depth.
      return target as unknown as Result;
    },
    deenriched,
  };
}
