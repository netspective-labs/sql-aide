import { zod as z } from "../deps.ts";
import { Sha1 } from "https://deno.land/std@0.160.0/hash/sha1.ts"; // depracated after 0.160.0
import * as za from "../lib/universal/zod-aide.ts";
import * as SQLa from "../mod.ts";
// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

// TODO Check out [dbtvault](https://dbtvault.readthedocs.io/en/latest/tutorial/tut_hubs/)
//      for implementations of Transactional Links, Effectivity Satellites,
//      Multi-Active Satellites, Extended Tracking Satellites, As of Date Tables,
//      Point In Time (PIT) tables, and Bridge Tables.
// TODO follow [best practices](https://dbtvault.readthedocs.io/en/latest/best_practices/)
// TODO see if it makes sense to use Typescript as the source to just generate
//      `dbt` artifacts for transformations as a potential augment to PostgreSQL stored
//      procedures and `pgSQL`.

export type DataVaultDomainGovn = {
  readonly isDigestPrimaryKeyMember?: boolean;
  readonly isSurrogateKey?: boolean;
  readonly isDenormalized?: boolean;
  readonly isUniqueConstraintMember?: string[];
};

export type DataVaultDomainGovnSupplier = {
  readonly dvDomainGovn: DataVaultDomainGovn;
};

/**
 * dataVaultDomains is a convenience object which defines aliases of all the
 * domains that we'll be using. We create "aliases" for easier maintenance and
 * extensibility (so if SQLa base domains change, we can diverge easily).
 * @returns the typical domains used by Data Vault models
 */
export function dataVaultDomains<Context extends SQLa.SqlEmitContext>() {
  // govnZB can be used to add arbitrary governance rules, descriptions and meta
  // data to any domain (Zod Type).
  const govnZB = za.zodBaggage<
    DataVaultDomainGovn,
    DataVaultDomainGovnSupplier
  >("dvDomainGovn");
  // usage:
  //    const govn = govnZB.unwrappedBaggage(zodType);   // prepare the type-safe proxy
  //    govn.dvDomainGovn = {...}                        // use the proxy safely

  // see https://github.com/colinhacks/zod#json-type
  const literalSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
  ]);
  type Literal = z.infer<typeof literalSchema>;
  type Json = Literal | { [key: string]: Json } | Json[];
  const jsonSchema: z.ZodType<Json> = z.lazy(() =>
    z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
  );

  // all domains should be functions that can be used directly in Zod objects
  return {
    govnZB,
    text: z.string,
    textNullable: z.string().optional,

    integer: z.number,
    integerNullable: z.number().optional(),

    jsonText: jsonSchema,
    jsonTextNullable: jsonSchema.optional(),

    boolean: z.boolean,
    booleanNullable: z.boolean().optional,

    date: z.date,
    dateNullable: z.date().optional,

    dateTime: z.date,
    dateTimeNullable: z.date().optional,

    createdAt: () => z.date().default(new Date()),

    // SHA-1 is cryptographically vulnerable but we're using it for basic hash
    // and it's fast to compute; TODO: in latest Deno should use crypto.subtle.digest()
    // but that function is async
    sha1Digest: () =>
      z.preprocess(
        (text) => new Sha1().update(String(text)).hex(),
        z.string(),
      ),
    ulid: z.string().ulid,
    ulidNullable: z.string().ulid().optional,

    uuid: z.string().uuid,
    uuidNullable: z.string().uuid().optional,
    // TODO [NL Aide Migration]:
    // unique: SQLa.uniqueContraint,

    // TODO [NL Aide Migration]:
    // uniqueMultiMember: <TsValueType>(
    //   domain: SQLa.AxiomSqlDomain<TsValueType, Context>,
    //   ...groupNames: string[]
    // ) => {
    //   return SQLa.mutateGovernedASD<TsValueType, DataVaultDomainGovn, Context>(
    //     domain,
    //     (existing) => ({
    //       ...existing,
    //       isUniqueConstraintMember: existing?.isUniqueConstraintMember
    //         ? [...existing?.isUniqueConstraintMember, ...groupNames]
    //         : groupNames,
    //     }),
    //   );
    // },
  };
}

/**
 * dataVaultKeys is a "data vault keys governer" builder object.
 * @returns a builder object with helper functions as properties which can be used to build DV keys
 */
export function dataVaultKeys<Context extends SQLa.SqlEmitContext>() {
  // we create our aliases in a function and use the function instead of passing
  // in dvDomains as an argument because deep-generics type-safe objects will be
  // available.
  //   const { sha1Digest, ulid } = dataVaultDomains<Context>();

  //   const digestPrimaryKey = () =>
  //     SQLa.uaDefaultablePrimaryKey<string, Context>(shah1Digest<Context>());

  //   const ulidPrimaryKey = () =>
  //     SQLa.uaDefaultablePrimaryKey<string, Context>(ulid<Context>());

  //   const autoIncPrimaryKey = () =>
  //     SQLa.autoIncPrimaryKey<number, Context>(SQLa.integer());

  //   const digestPkMember = <TsValueType>(
  //     domain: SQLa.AxiomSqlDomain<TsValueType, Context>,
  //   ) => {
  //     return mutateGoverned<TsValueType>(
  //       domain,
  //       (existing) => ({ ...existing, isDigestPrimaryKeyMember: true }),
  //     );
  //   };

  //   const surrogateKey = <TsValueType>(
  //     domain: SQLa.AxiomSqlDomain<TsValueType, Context>,
  //   ) => {
  //     return mutateGoverned<TsValueType>(
  //       domain,
  //       (existing) => ({ ...existing, isSurrogateKey: true }),
  //     );
  //   };

  return {
    //     digestPrimaryKey,
    //     digestPkMember,
    //     digestPkLintRule: <TableName, ColumnName>(
    //       tableName: TableName,
    //       pkColumn?: SQLa.IdentifiableSqlDomain<Any, Context>,
    //       pkDigestColumns?: ColumnName[],
    //     ) => {
    //       const rule: SQLa.SqlLintRule = {
    //         lint: (lis) => {
    //           if (
    //             pkColumn && axsdc.isDigestAxiomSD(pkColumn) &&
    //             (!pkDigestColumns || pkDigestColumns.length == 0)
    //           ) {
    //             lis.registerLintIssue({
    //               lintIssue:
    //                 `table name '${tableName}' requires pkDigestColumns for primary key column ${pkColumn.identity}`,
    //               consequence: SQLa.SqlLintIssueConsequence.FATAL_DDL,
    //             });
    //           }
    //         },
    //       };
    //       return rule;
    //     },
    //     autoIncPrimaryKey,
    //     ulidPrimaryKey,
    //     surrogateKey,
  };
}

export type DataVaultTypicalHousekeepingColumns<
  Context extends SQLa.SqlEmitContext,
> = {
  readonly created_at: SQLa.SqlDomain<
    z.ZodOptional<z.ZodDate>,
    Context,
    "created_at"
  >;
};

/**
 * dataVaultHousekeeping is a "data vault housekeeping columns governer" builder
 * object.
 * @returns a builder object with helper functions as properties which can be used to build DV housekeeping columns
 */
export function dataVaultHousekeeping<Context extends SQLa.SqlEmitContext>() {
  const { createdAt } = dataVaultDomains();

  // TODO: add loadedAt, loadedBy, provenance (lineage), etc. columns from PgDCP DV

  return {
    typical: {
      columns: {
        created_at: createdAt(),
      },
      insertStmtPrepOptions: <TableName extends string>() => {
        const result: SQLa.InsertStmtPreparerOptions<
          TableName,
          { created_at?: Date }, // this must match typical.columns so that isColumnEmittable is type-safe
          { created_at?: Date }, // this must match typical.columns so that isColumnEmittable is type-safe
          Context
        > = {
          // created_at should be filled in by the database so we don't want
          // to emit it as part of the an insert DML SQL statement
          isColumnEmittable: (name) => name == "created_at" ? false : true,
        };
        return result as SQLa.InsertStmtPreparerOptions<Any, Any, Any, Context>;
      },
    },
  };
}

export type DataVaultHubTableDefn<
  HubName extends string,
  HubTableName extends string,
  Context extends SQLa.SqlEmitContext,
> = SQLa.TableDefinition<HubTableName, Context> & {
  readonly pkColumnDefn: SQLa.TablePrimaryKeyColumnDefn<Any, Context>;
  readonly hubName: HubName;
};

export type DataVaultLinkTableDefn<
  LinkName extends string,
  LinkTableName extends string,
  Context extends SQLa.SqlEmitContext,
> = SQLa.TableDefinition<LinkTableName, Context> & {
  readonly linkName: LinkName;
};

/**
 * dataVaultGovn is a "data vault governer" builders object for data vault models.
 * @param ddlOptions optional DDL string template literal options
 * @returns a single object with helper functions as properties (for building models)
 */
export function dataVaultGovn<Context extends SQLa.SqlEmitContext>(
  _ddlOptions: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  const domains = dataVaultDomains<Context>();
  const keys = dataVaultKeys<Context>();
  const housekeeping = dataVaultHousekeeping<Context>();
  const tableLintRules = SQLa.tableLintRules<Context>();

  return {
    domains,
    keys,
    housekeeping,
    tableLintRules,
  };
}
