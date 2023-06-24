import { testingAsserts as ta } from "../../deps-test.ts";
import { unindentWhitespace as uws } from "../../../lib/universal/whitespace.ts";
import * as emit from "../../emit/mod.ts";
import { SqlDomain, SqlDomainQS, SqlDomainsQS } from "../../domain/mod.ts";
import { SchemaDefinition } from "../../ddl/schema.ts";
import { ExtensionDefinition } from "./extension.ts";
import * as mod from "./coordinator.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

interface SyntheticSqlDomainQS extends SqlDomainQS {
  // branding is just for testing, it's not required
  readonly isSyntheticSqlDomainQS: true;
}

interface SyntheticSqlDomainsQS extends SqlDomainsQS<SyntheticSqlDomainQS> {
  // branding is just for testing, it's not required
  readonly isSyntheticSqlDomainsQS: true;
}

interface SyntheticContext extends emit.SqlEmitContext {
  // branding is just for testing, it's not required
  readonly isSyntheticContext: true;
}

class SyntheticTemplate<
  SchemaDefns extends {
    context: SchemaDefinition<"context", SyntheticContext>;
    extensions: SchemaDefinition<"extensions", SyntheticContext>;
  },
  ExtensionDefns extends {
    ltree: ExtensionDefinition<"extensions", "ltree", SyntheticContext>;
  },
  PgDomainDefns extends {
    execution_context: SqlDomain<
      Any,
      SyntheticContext,
      Any,
      SyntheticSqlDomainQS
    >;
  },
> extends mod.EmitCoordinator<
  SchemaDefns,
  ExtensionDefns,
  PgDomainDefns,
  SyntheticContext,
  SyntheticSqlDomainQS,
  SyntheticSqlDomainsQS
> {
  public constructor(
    readonly init: mod.EmitCoordinatorInit<
      SchemaDefns,
      ExtensionDefns,
      PgDomainDefns,
      SyntheticContext,
      SyntheticSqlDomainQS,
      SyntheticSqlDomainsQS
    >,
  ) {
    super(init);
  }

  static init() {
    return new SyntheticTemplate({
      importMeta: import.meta,
      schemaDefns: (define) => ({
        context: define("context"),
        extensions: define("extensions"),
      }),
      extnDefns: (define, schemas) => ({
        ltree: define(schemas.extensions, "ltree"),
      }),
      pgDomainDefns: (pgdf, schemas) => ({
        execution_context: pgdf.pgDomainDefn(
          // we type-cast because it's a reference ... "execution_context" as "ltree" in SQL
          pgdf.pgDomainRef(schemas.extensions, "ltree") as unknown as SqlDomain<
            Any,
            SyntheticContext,
            "execution_context",
            SyntheticSqlDomainQS
          >,
          "execution_context",
          {
            isIdempotent: true,
            nsOptions: {
              quoteIdentifiers: true,
              qnss: schemas.context,
            },
          },
        ),
      }),
    });
  }
}

Deno.test("Emit Coordinator", () => {
  const tmpl = SyntheticTemplate.init();
  // const bad = tmpl.schemas("bad");  // should be a syntax error in IDE
  // const bad = tmpl.extensions("bad");  // should be a syntax error in IDE
  const schemas = tmpl.schemas("extensions");
  const extns = tmpl.extensions("ltree");
  const fixture = tmpl.SQL()`
    ${schemas} -- test all schemas
    ${extns.extnSchemas} -- test only schemas passed in for extensions
    ${tmpl.pgDomains.execution_context}
    ${extns.uniqueExtns}`.SQL(tmpl.sqlEmitContext());
  ta.assertEquals(
    fixture,
    uws(`
      CREATE SCHEMA IF NOT EXISTS "extensions"; -- test all schemas
      CREATE SCHEMA IF NOT EXISTS "extensions"; -- test only schemas passed in for extensions
      BEGIN CREATE DOMAIN "context"."execution_context" AS "extensions"."ltree"; EXCEPTION WHEN DUPLICATE_OBJECT THEN /* ignore error without warning */ END;
      CREATE EXTENSION IF NOT EXISTS ltree SCHEMA "extensions";`),
  );
});
