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

  SQL(stsOptions = this.primeSTSO) {
    return emit.SQL<Context>(stsOptions);
  }

  sqlEmitContext(): Context {
    return emit.typicalSqlEmitContext({
      sqlDialect: this.sqlDialect,
    }) as Context;
  }

  schemas(...schemaNames: SchemaName[]) {
    return schemaNames.map((name) => this.schemaDefns[name]);
  }

  /**
   * Return the qualified naming strategy for a given schema
   * @param schemaName Which schema to return qualifiedNames from
   * @returns an object that can be used to create qualified names in the supplied schema
   */
  schemaQN(schemaName: SchemaName, baseNS?: emit.SqlObjectNames) {
    return this.schemaDefns[schemaName].qualifiedNames(
      { sqlNamingStrategy: this.sqlNamingStrategy },
      baseNS,
    );
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

  symbols(...ssSuppliers: emit.SqlSymbolSupplier<Context>[]) {
    const result: string[] = [];
    const ctx = { sqlNamingStrategy: this.sqlNamingStrategy };
    for (const sss of ssSuppliers) {
      result.push(sss.sqlSymbol(ctx));
    }
    return result;
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
