import { pgSQLa, safety, SQLa } from "./deps.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type SqlEmitContext = SQLa.SqlEmitContext;

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

export const emitter = <Context extends SqlEmitContext>(
  importMeta: ImportMeta,
  defaultP?: Partial<TemplateProvenance>,
) => {
  const stsOptions = SQLa.typicalSqlTextSupplierOptions<Context>();
  return {
    stsOptions,
    SQL: SQLa.SQL<Context>(stsOptions),
    sqlEmitContext: () =>
      SQLa.typicalSqlEmitContext({
        sqlDialect: SQLa.postgreSqlDialect(),
      }),
    provenance: () => {
      const result: TypeScriptModuleProvenance = {
        source: importMeta.url,
        importMeta,
        identity: defaultP?.identity || importMeta.url.split("/").pop() ||
          importMeta.url,
        version: defaultP?.version || "0.0.0",
      };
      return result;
    },
  };
};

export const schemas = <Context extends SqlEmitContext>() => {
  const schemaDefn = <SchemaName extends string>(name: SchemaName) =>
    SQLa.sqlSchemaDefn<SchemaName, Context>(name, { isIdempotent: true });

  const context = schemaDefn("context");
  const extensions = schemaDefn("extensions");
  const lifecycle = schemaDefn("lifecycle");
  const lib = schemaDefn("lib");
  const confidential = schemaDefn("confidential");
  const assurance = schemaDefn("assurance");
  const experimental = schemaDefn("experimental");

  return {
    context,
    extensions,
    lifecycle,
    lib,
    confidential,
    assurance,
    experimental,
    pick: (...pickFrom: SQLa.SchemaDefinition<Any, Context>[]) => {
      return pickFrom.filter(
        (schema, index, self) =>
          self.findIndex((s) => s.sqlNamespace === schema.sqlNamespace) ===
            index,
      );
    },
  };
};

export const extensions = <Context extends SqlEmitContext>() => {
  const s = schemas<Context>();
  type ExtnDefn = ReturnType<typeof pgSQLa.pgExtensionDefn<Any, Any, Context>>;
  const ltree = pgSQLa.pgExtensionDefn(s.extensions, "ltree");
  return {
    ltree,
    pick: (...extns: ExtnDefn[]) => {
      // find all the schemas which the extensions belong to
      const extnSchemas = extns.filter(
        (extension, index, self) =>
          self.findIndex((e) =>
            e.schema.sqlNamespace === extension.schema.sqlNamespace
          ) === index,
      ).map((e) => e.schema);
      const uniqueExtns = extns.filter(
        (extension, index, self) =>
          self.findIndex((e) => e.extension === extension.extension) === index,
      );
      return { extnSchemas, uniqueExtns };
    },
  };
};

export const lifecycle = <Context extends SqlEmitContext>() => {
  const e = emitter(import.meta);
  const ctx = e.sqlEmitContext();
  const { lifecycle: lcSchema } = schemas<Context>();

  const constructStorage = (identity: string) => {
    const spIdentifier = `construct_storage_${identity}`;
    return pgSQLa.storedProcedure(
      spIdentifier,
      {},
      (name) => pgSQLa.untypedPlPgSqlBody(name, ctx),
      { embeddedStsOptions: e.stsOptions, sqlNS: lcSchema },
    );
  };

  return {
    lcSchema,
    constructStorage,
  };
};
