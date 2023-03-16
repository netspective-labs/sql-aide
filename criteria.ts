import * as safety from "./lib/universal/safety.ts";
import * as tmpl from "./sql.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type FilterableRecordValues<
  T,
  Context extends tmpl.SqlEmitContext,
> = {
  [K in keyof T]?:
    | T[K]
    | tmpl.SqlTextSupplier<Context>
    | FilterCriteriaValue<Any, Context>
    | FilterCriteriaComponent<Any, Context>;
};

export type FilterCriteriaConnect = "AND" | "OR" | "NOT";

export type FilterCriteriaCompareNature = "=" | ">" | "<" | ">=" | "<=" | "in";

export interface FilterCriteriaCompare<
  Value,
  Context extends tmpl.SqlEmitContext,
> {
  readonly nature: FilterCriteriaCompareNature;
  readonly sqlText: (
    leftHandSide: string,
    value: Value,
    options?: { purpose?: "select-where" },
  ) => tmpl.SqlTextSupplier<Context>;
}

export const fccValueIsNULL = (value: unknown) =>
  value === undefined ||
  (typeof value === "string" &&
    value.trim().toUpperCase() == "NULL");

export function fccEquals<Context extends tmpl.SqlEmitContext>(
  valueIsNull: (value: unknown) => boolean = fccValueIsNULL,
) {
  const result: FilterCriteriaCompare<Any, Context> = {
    nature: "=",
    sqlText: (lhs, value) => {
      return {
        SQL: () => {
          return valueIsNull(value) ? `${lhs} IS NULL` : `${lhs} = ${value}`;
        },
      };
    },
  };
  return result;
}

export function filterCriteriaCompareHelpers<
  Context extends tmpl.SqlEmitContext,
>(valueIsNull: (value: unknown) => boolean = fccValueIsNULL) {
  return {
    "=": () => fccEquals<Context>(valueIsNull),
    equals: () => fccEquals<Context>(valueIsNull),
  };
}

export type FilterCriteriaValue<Value, Context extends tmpl.SqlEmitContext> = {
  readonly connect?: FilterCriteriaConnect;
  readonly compare: FilterCriteriaCompare<Value, Context>;
  readonly filterCriteriaValue: unknown;
};

export function fcValue<Value, Context extends tmpl.SqlEmitContext>(
  value: Value,
  options?: Partial<
    Omit<FilterCriteriaValue<Value, Context>, "filterCriteriaValue">
  >,
) {
  const result: FilterCriteriaValue<Value, Context> = {
    filterCriteriaValue: value,
    compare: options?.compare ?? fccEquals(),
    ...options,
  };
  return result;
}

export function isFilterCriteriaValue<
  Value,
  Context extends tmpl.SqlEmitContext,
>(o: unknown): o is FilterCriteriaValue<Value, Context> {
  const isFCV = safety.typeGuard<FilterCriteriaValue<Value, Context>>(
    "filterCriteriaValue",
  );
  return isFCV(o);
}

export type FilterCriteriaComponent<
  Value,
  Context extends tmpl.SqlEmitContext,
> = {
  readonly isFilterCriteriaComponent: true;
  readonly connect?: FilterCriteriaConnect;
  readonly compare: FilterCriteriaCompare<Value, Context>;
  readonly values: [value: unknown, valueSqlText: string];
};

export function isFilterCriteriaComponent<
  Value,
  Context extends tmpl.SqlEmitContext,
>(o: unknown): o is FilterCriteriaComponent<Value, Context> {
  const isFCV = safety.typeGuard<FilterCriteriaComponent<Value, Context>>(
    "isFilterCriteriaComponent",
    "values",
  );
  return isFCV(o);
}

export type IdentifiableFilterCriteriaComponent<
  Value,
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
> = FilterCriteriaComponent<Value, Context> & {
  readonly isFilterCriteriaComponent: true;
  readonly identity: FilterableAttrName;
};

export function isIdentifiableFilterCriteriaComponent<
  Value,
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is IdentifiableFilterCriteriaComponent<Value, FilterableRecord, Context> {
  const isIFCC = safety.typeGuard<
    IdentifiableFilterCriteriaComponent<Value, FilterableRecord, Context>
  >(
    "isFilterCriteriaComponent",
    "identity",
    "values",
  );
  return isFilterCriteriaComponent(o) && isIFCC(o);
}

export interface FilterCriteriaPreparerOptions<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
> {
  readonly isAttrFilterable?: (
    attrName: FilterableAttrName,
    record: FilterableRecord,
  ) => boolean;
  readonly filterAttr?: (
    attrName: FilterableAttrName,
    record: FilterableRecord,
    ns: tmpl.SqlObjectNames,
    ctx: Context,
  ) =>
    | IdentifiableFilterCriteriaComponent<Any, FilterableRecord, Context>
    | undefined;
}

export interface FilterCriteria<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
> {
  readonly filterable: FilterableRecord;
  readonly candidateAttrs: (
    group?: "all" | "primary-keys",
  ) => FilterableAttrName[];
  readonly criteria: IdentifiableFilterCriteriaComponent<
    Any,
    FilterableRecord,
    Context
  >[];
  readonly fcpOptions?: FilterCriteriaPreparerOptions<
    FilterableRecord,
    Context
  >;
}

export interface FilterCriteriaPreparer<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
> {
  (
    ctx: Context,
    fr: FilterableRecord,
    options?: FilterCriteriaPreparerOptions<
      FilterableRecord,
      Context
    >,
  ): FilterCriteria<FilterableRecord, Context>;
}

export function filterCriteriaHelpers<
  Value,
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
>() {
  const fcch = filterCriteriaCompareHelpers();
  return {
    compare: fcch,
    is: (
      compare: FilterCriteriaCompareNature,
      value: Value,
    ): FilterCriteriaValue<Any, Context> => {
      switch (compare) {
        default:
          return fcValue(value, { compare: fcch.equals() });
      }
    },
    and: (andValue: Any): FilterCriteriaValue<Value, Context> =>
      isFilterCriteriaValue(andValue)
        ? { ...andValue, connect: "AND" }
        : fcValue(andValue, { connect: "AND" }),
    or: (orValue: Any): FilterCriteriaValue<Value, Context> =>
      isFilterCriteriaValue(orValue)
        ? { ...orValue, connect: "OR" }
        : fcValue(orValue, { connect: "OR" }),
    not: (notValue: Any): FilterCriteriaValue<Value, Context> =>
      isFilterCriteriaValue(notValue)
        ? { ...notValue, connect: "NOT" }
        : fcValue(notValue, { connect: "NOT" }),
  };
}

export function filterCriteriaPreparer<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
>(
  candidateAttrs: (group?: "all" | "primary-keys") => FilterableAttrName[],
  defaultFcpOptions?: FilterCriteriaPreparerOptions<FilterableRecord, Context>,
): FilterCriteriaPreparer<FilterableRecord, Context> {
  return (ctx, fr, fcpOptions = defaultFcpOptions) => {
    const {
      isAttrFilterable = (
        attrName: FilterableAttrName,
        record: FilterableRecord,
      ) => Object.hasOwn(record as Any, attrName) ? true : false,
      filterAttr,
    } = fcpOptions ?? {};
    const { sqlTextEmitOptions: eo } = ctx;
    const { quotedLiteral } = eo;
    const ns = ctx.sqlNamingStrategy(ctx, {
      quoteIdentifiers: true,
    });

    const values = (
      rawValue: unknown,
    ): [value: unknown, valueSqlText: string] => {
      if (tmpl.isSqlTextSupplier(rawValue)) {
        return [rawValue, `(${rawValue.SQL(ctx)})`]; // e.g. `(SELECT x from y) as SQL expr`
      } else {
        return quotedLiteral(rawValue);
      }
    };

    const criteria: IdentifiableFilterCriteriaComponent<
      Any,
      FilterableRecord,
      Context
    >[] = [];
    candidateAttrs().forEach((c) => {
      if (isAttrFilterable && !isAttrFilterable(c, fr)) {
        return;
      }

      let ec:
        | IdentifiableFilterCriteriaComponent<Any, FilterableRecord, Context>
        | undefined;
      if (filterAttr) {
        ec = filterAttr(c, fr, ns, ctx);
      } else {
        const recordValueRaw = (fr as Any)[c];
        if (isIdentifiableFilterCriteriaComponent(recordValueRaw)) {
          ec = recordValueRaw;
        } else if (isFilterCriteriaComponent(recordValueRaw)) {
          ec = { ...recordValueRaw, identity: c };
        } else if (isFilterCriteriaValue(recordValueRaw)) {
          ec = {
            isFilterCriteriaComponent: true,
            identity: c,
            values: values(recordValueRaw.filterCriteriaValue),
            ...recordValueRaw,
          };
        } else {
          ec = {
            isFilterCriteriaComponent: true,
            identity: c,
            values: values(recordValueRaw),
            compare: fccEquals(),
          };
        }
      }
      if (ec) {
        criteria.push({
          ...ec,
          connect: criteria.length > 0 ? (ec.connect ?? `AND`) : undefined,
        });
      }
    });
    return {
      candidateAttrs,
      fcpOptions,
      filterable: fr,
      criteria,
    };
  };
}

export function filterCriteriaSQL<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
>(fc: FilterCriteria<FilterableRecord, Context>, fcsOptions?: {
  readonly attrNameSupplier?: (
    attrName: FilterableAttrName,
    ns: tmpl.SqlObjectNames,
  ) => string;
}) {
  const result: tmpl.SqlTextSupplier<Context> = {
    ...fc,
    SQL: (ctx) => {
      const {
        attrNameSupplier = (an: FilterableAttrName, ns: tmpl.SqlObjectNames) =>
          ns.domainName(String(an)),
      } = fcsOptions ?? {};
      const ns = ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true });
      // TODO: figure out why 'c.identity as Any' is needed in typed attrNameSupplier
      // deno-fmt-ignore
      return `${fc.criteria.map((c) => `${c.connect ? ` ${c.connect} ` : ""}${c.compare.sqlText(attrNameSupplier(c.identity as Any, ns), c.values[1]).SQL(ctx)}`).join("")
      }`;
    },
  };
  return result;
}
