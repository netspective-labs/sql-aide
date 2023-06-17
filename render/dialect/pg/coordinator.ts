import * as safety from "../../../lib/universal/safety.ts";
import * as emit from "../../emit/mod.ts";
import { SqlDomain } from "../../domain/mod.ts";
import { pgDomainsFactory } from "./domain.ts";
import { SchemaDefinition, sqlSchemaDefn } from "../../ddl/schema.ts";
import {
  ExtensionDefinition,
  pgExtensionDefn,
  PgExtensionName,
} from "./extension.ts";
import * as sr from "./routine.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface TemplateProvenance {
  readonly identity: string;
  readonly version: string;
  readonly source: string;
}

export interface TypeScriptModuleProvenance extends TemplateProvenance {
  readonly importMeta: ImportMeta;
}

export const isTypeScriptModuleProvenance = safety.typeGuard<
  TypeScriptModuleProvenance
>("importMeta");

export interface EmitCoordinatorInit<
  SchemaDefns extends Record<string, SchemaDefinition<string, Context>>,
  ExtensionDefns extends Record<
    string,
    ExtensionDefinition<SchemaName, string, Context>
  >,
  PgDomainDefns extends Record<string, SqlDomain<Any, Context, Any>>,
  Context extends emit.SqlEmitContext,
  SchemaName extends keyof SchemaDefns & string = keyof SchemaDefns & string,
  ExtensionName extends keyof ExtensionDefns & string =
    & keyof ExtensionDefns
    & string,
  PgDomainName extends keyof PgDomainDefns & string =
    & keyof PgDomainDefns
    & string,
> {
  readonly importMeta: ImportMeta;
  readonly schemaDefns: (
    define: <OverrideSN extends SchemaName>(
      name: OverrideSN,
    ) => SchemaDefinition<OverrideSN, Context>,
  ) => SchemaDefns;
  readonly extnDefns: (
    defineExtn: <
      OverrideSN extends SchemaName,
      OverrideEN extends ExtensionName,
    >(
      schema: SchemaDefinition<OverrideSN, Context>,
      name: OverrideEN,
    ) => ExtensionDefinition<OverrideSN, OverrideEN, Context>,
    schemaDefns: SchemaDefns,
  ) => ExtensionDefns;
  readonly pgDomainDefns: (
    pgdf: ReturnType<
      typeof pgDomainsFactory<PgDomainName, Context>
    >,
    schemaDefns: SchemaDefns,
  ) => PgDomainDefns;
  readonly provenance?: Partial<TemplateProvenance>;
}

export class EmitCoordinator<
  SchemaDefns extends Record<string, SchemaDefinition<string, Context>>,
  ExtensionDefns extends Record<
    string,
    ExtensionDefinition<keyof SchemaDefns & string, string, Context>
  >,
  PgDomainDefns extends Record<string, SqlDomain<Any, Context, Any>>,
  Context extends emit.SqlEmitContext,
  SchemaName extends keyof SchemaDefns & string = keyof SchemaDefns & string,
  ExtensionName extends keyof ExtensionDefns & string =
    & keyof ExtensionDefns
    & string,
  PgDomainName extends keyof PgDomainDefns & string =
    & keyof PgDomainDefns
    & string,
> {
  readonly sqlDialect = emit.postgreSqlDialect();
  readonly sqlNamingStrategy = emit.typicalSqlNamingStrategy();
  readonly provenance: TypeScriptModuleProvenance;
  readonly primeSTSO: emit.SqlTextSupplierOptions<Context>;
  readonly embedSymsSTSO: emit.SqlTextSupplierOptions<Context>;
  readonly schemaDefns: SchemaDefns;
  readonly extnDefns: ExtensionDefns;
  readonly pgDomainsFactory = pgDomainsFactory<PgDomainName, Context>();
  readonly pgDomains: PgDomainDefns;

  protected constructor(
    readonly init: EmitCoordinatorInit<
      SchemaDefns,
      ExtensionDefns,
      PgDomainDefns,
      Context
    >,
  ) {
    this.provenance = {
      source: this.init.importMeta.url,
      importMeta: this.init.importMeta,
      identity: init.provenance?.identity ||
        init.importMeta.url.split("/").pop() ||
        init.importMeta.url,
      version: init.provenance?.version || "0.0.0",
    };

    this.schemaDefns = init.schemaDefns(EmitCoordinator.schemaDefn);
    this.extnDefns = init.extnDefns(
      EmitCoordinator.extensionDefn,
      this.schemaDefns,
    );
    this.pgDomains = init.pgDomainDefns(
      this.pgDomainsFactory,
      this.schemaDefns,
    );
    this.primeSTSO = emit.typicalSqlTextSupplierOptions<Context>();
    this.embedSymsSTSO = emit.typicalSqlTextSupplierOptions<Context>({
      symbolsFirst: true,
    });
  }

  /**
   * Build a SQL template composing calls from other methods. For example:
   *
   * const ec = new EmitCoordinator(import.meta);
   * const extns = ec.extensions("ltree", ...);
   * const output = ec.SQL()`
   *   ${ec.psqlHeader}
   *
   *   ${ec.uniqueSchemas(...extns.extnSchemaNames, "dcp_lifecycle", "dcp_lifecycle_destroy", "dcp_context")}
   *
   *   ${extns.uniqueExtns}
   *
   *   ${constructStorage}
   *
   *   ${constructIdempotent}
   *
   *   ${destroyIdempotent}
   *
   *   ${populateSeedData}
   *
   *   ${unitTest}`,
   *
   * @param stsOptions
   * @returns
   */
  SQL(stsOptions = this.primeSTSO) {
    return emit.SQL<Context>(stsOptions);
  }

  sqlEmitContext(): Context {
    return emit.typicalSqlEmitContext({
      sqlDialect: this.sqlDialect,
    }) as Context;
  }

  extensions(...extnNames: ExtensionName[]) {
    // find all the schemas which the extensions belong to
    const extns = extnNames.map((name) => this.extnDefns[name]);
    const extnSchemas = extns.filter(
      (extension, index, self) =>
        self.findIndex((e) =>
          e.schema.sqlNamespace === extension.schema.sqlNamespace
        ) === index,
    ).map((e) => e.schema);
    const extnSchemaNames = extnSchemas.map((es) => es.sqlNamespace);
    const uniqueExtns = extns.filter(
      (extension, index, self) =>
        self.findIndex((e) => e.extension === extension.extension) === index,
    );
    return { extnSchemas, extnSchemaNames, uniqueExtns };
  }

  /**
   * Return the list of schemas for all the given schema names.
   *
   * const [mySchema1] = this.schemas("my_schema1", "my_schem2")
   *
   * @param schemaNames The schemas we care about
   * @returns An array of SchemaDefinition objects
   */
  schemas(...schemaNames: SchemaName[]) {
    return schemaNames.map((name) => this.schemaDefns[name]);
  }

  /**
   * Return the unique list of schemas for all the given schema names. More
   * useful when the list of schema names may be unknown (such as when including
   * schemas from extensions).
   *
   * const extns = this.extensions("ltree");
   * const schemas = this.uniqueSchemas(...extns.extnSchemaNames, "my_schema1", "my_schem2")
   *
   * @param schemaNames The schemas we care about
   * @returns An array of SchemaDefinition objects filtered for uniqueness
   */
  uniqueSchemas(...schemaNames: SchemaName[]) {
    const schemas = this.schemas(...schemaNames);
    return schemas.filter(
      (filter, index, self) =>
        self.findIndex((self) => self.sqlNamespace === filter.sqlNamespace) ===
          index,
    );
  }

  /**
   * Return the qualified naming strategy for a given schema.
   *
   * const [sQN, QN2] = ec.schemaQNI("my_schema1", "my_schema2");
   *
   * After the call above, `sQN` will be the SqlObjectNames instance for my_schema1 namespace.
   *
   * @param schemaNames schemas to return qualifiedNames from
   * @returns an array of objects that can be used to create qualified names in the supplied schemas
   */
  schemaObjectNames(...schemaNames: SchemaName[]) {
    return schemaNames.map((schemaName) =>
      this.schemaDefns[schemaName].qualifiedNames(
        { sqlNamingStrategy: this.sqlNamingStrategy },
      )
    );
  }

  /**
   * Return the qualified naming strategy for a given schema along with injectables wrapper
   * to make it easy to create qualified references to SQL objects in SQL templates.
   *
   * const [[sQN, sQR], [QN2, QR2]] = ec.schemaQNI("my_schema1", "my_schema2");
   *
   * After the call above, `sQN` will be the SqlObjectNames instance for my_schema1 namespace
   * and `sQR` will be a `(text: string) => string` function which will accept any text
   * and qualify the reference as "my_schema1".${text}.
   *
   * @param schemaNames schemas to return qualifiedNames and injectables wrapper from
   * @returns an array of objects that can be used to create qualified names in the supplied schemas
   */
  schemaQN(
    ...schemaNames: SchemaName[]
  ): [qn: emit.SqlObjectNames, qni: (text: string) => string][] {
    return schemaNames.map((schemaName) => {
      const qn = this.schemaDefns[schemaName].qualifiedNames(
        { sqlNamingStrategy: this.sqlNamingStrategy },
      );
      const qni = (text: string) => qn.injectable(text);
      return [qn, qni];
    });
  }

  tokenQualifier(
    schemaName: SchemaName,
    tokens: (value: string, son: emit.SqlObjectNames) => emit.SqlInjection,
  ) {
    return emit.tokenQualifier({
      sqlNSS: { sqlNamingStrategy: this.sqlNamingStrategy },
      tokens,
      nsOptions: { quoteIdentifiers: true, qnss: this.schemaDefns[schemaName] },
    });
  }

  /**
   * Return a function for each schema that, when called, will "qualify" the
   * given text in that schema in a format convenient for SQL template literals.
   *
   * const [sQR, QR2] = ec.schemaQualifier("my_schema1", "my_schema2");
   *
   * After the call above, `sQR` will be a `(text: string) => SqlInjectable` function
   * which will accept any text and qualify the reference as "my_schema1".${text} in
   * a method convenient for use within a SQL string template literal.
   *
   * @param schemaNames schemas to return qualifiedNames from
   * @returns an array of objects that can be used to create qualified names in the supplied schemas
   */
  schemaQualifier(...schemaNames: SchemaName[]) {
    const result: ((text: string) => string)[] = [];
    for (const schemaName of schemaNames) {
      const tq = emit.tokenQualifier({
        sqlNSS: { sqlNamingStrategy: this.sqlNamingStrategy },
        tokens: (text, son) => ({ sqlInjection: son.injectable(text) }),
        nsOptions: {
          quoteIdentifiers: true,
          qnss: this.schemaDefns[schemaName],
        },
      });
      result.push((text) => tq[0](text).sqlInjection);
    }
    return result;
  }

  /**
   * Transform given SQL symbol suppliers (like tables, views, etc.) into more
   * convenient formats for string template literals.
   *
   * const [execCtx, execHostID] = ec.qualifiedTokens(
   *   "my_schema1",
   *   (value, son) => ({ sqlInjection: son.injectable(value) }),
   *   pgd.execution_context,
   *   pgd.execution_host_identity,
   * );
   *
   * Once you have the above, you can use ${execCtx} and ${execHostID} in `SQL`
   * template literals.
   *
   * @param schemaName which schema to pre-qualify the symbols in
   * @param tokens how to generate the tokens when called like ${xyzToken}
   * @param ssSuppliers the actual SQL symbol suppliers (tables, views, domains, etc.)
   * @returns an array of tokens that, when called, will contain fully qualified names of SQL symbols
   */
  qualifiedTokens(
    schemaName: SchemaName,
    tokens: (value: string, son: emit.SqlObjectNames) => emit.SqlInjection,
    ...ssSuppliers: (string | emit.SqlSymbolSupplier<Any>)[]
  ) {
    return emit.qualifiedTokens({
      sqlNSS: { sqlNamingStrategy: this.sqlNamingStrategy },
      tokens,
      nsOptions: { quoteIdentifiers: true, qnss: this.schemaDefns[schemaName] },
    }, ...ssSuppliers);
  }

  untypedEmptyArgsSP<RoutineName extends string>(
    routineName: RoutineName,
    schema: SchemaDefinition<SchemaName, Context>,
  ) {
    const ctx = this.sqlEmitContext();
    return sr.storedProcedure(
      routineName,
      {},
      (name) => sr.untypedPlPgSqlBody(name, ctx),
      // we use the same text options as prime because `create table`, and other
      // DDL statements are likely so we don't want to process symbols
      {
        embeddedStsOptions: this.primeSTSO,
        sqlNS: schema,
      },
    );
  }

  emptyArgsReturnsSetOfTextSF<RoutineName extends string>(
    routineName: RoutineName,
    schema: SchemaDefinition<SchemaName, Context>,
  ) {
    const ctx = this.sqlEmitContext();
    return sr.storedFunction(
      routineName,
      {},
      "SETOF TEXT",
      (name) => sr.untypedPlPgSqlBody(name, ctx),
      // we use the same text options as prime because `create table`, and other
      // DDL statements are likely so we don't want to process symbols
      {
        embeddedStsOptions: this.primeSTSO,
        isIdempotent: true,
        sqlNS: schema,
      },
    );
  }

  static schemaDefn<
    SchemaName extends emit.SqlNamespace,
    Context extends emit.SqlEmitContext,
  >(name: SchemaName) {
    return sqlSchemaDefn<SchemaName, Context>(name, {
      isIdempotent: true,
    });
  }

  static extensionDefn<
    SchemaName extends emit.SqlNamespace,
    ExtensionName extends PgExtensionName,
    Context extends emit.SqlEmitContext,
  >(
    schema: SchemaDefinition<SchemaName, Context>,
    name: ExtensionName,
  ) {
    return pgExtensionDefn<SchemaName, ExtensionName, Context>(
      schema,
      name,
    );
  }
}
