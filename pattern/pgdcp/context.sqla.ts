#!/usr/bin/env -S deno run --allow-all

import { persistContent as pc, pgSQLa, SQLa, zod as z } from "./deps.ts";
import * as pgdcp from "./pgdcp.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

type SchemaName = "dcp_context";

export class PgDcpContext {
  readonly state = pgdcp.pgDcpState(import.meta, {
    principal: "dcp_context",
  });
  readonly ctx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.postgreSqlDialect(),
  });

  readonly subjectArea: string;
  readonly cSchema = this.state.ec.schemaDefns.dcp_context;
  readonly execCtxTable = this.state.ec.governedModel.textEnumTable(
    "execution_context",
    pgdcp.ExecutionContext,
    {
      isIdempotent: true,
      sqlNS: this.cSchema,
    },
  );

  readonly dcpContextSchema = SQLa.sqlSchemaDefn("dcp_context", {
    isIdempotent: true,
  });

  protected constructor() {
    this.subjectArea = this.state.ec.subjectArea(this.cSchema);
  }

  readonly searchPath = pgSQLa.pgSearchPath<SchemaName, SQLa.SqlEmitContext>(
    this.dcpContextSchema,
  );

  constructStorage() {
    const { ec, lc, ec: { pgDomains: pgd } } = this.state;
    const { governedModel: gm, governedModel: { domains: d } } = ec;

    const singletonId = SQLa.declareZodTypeSqlDomainFactoryFromHook(
      "singleton_id",
      (_zodType, init) => {
        return {
          ...d.sdf.anySDF.defaults<Any>(
            z.boolean().default(true).optional(),
            { isOptional: true, ...init },
          ),
          sqlDataType: () => ({ SQL: () => `BOOL` }),
          sqlDefaultValue: () => ({ SQL: () => `TRUE CHECK (singleton_id)` }),
          polygenixDataType: () => `boolean`,
        };
      },
    );

    const context = SQLa.tableDefinition(
      "context",
      {
        singleton_id: gm.tcFactory.unique(
          z.boolean(
            SQLa.zodSqlDomainRawCreateParams(singletonId),
          ),
        ),
        active: this.execCtxTable.references.code(),
        host: d.text(),
      },
      { sqlNS: this.cSchema, isIdempotent: true },
    );

    // deno-fmt-ignore
    return lc.constructStorage()`
      ${pgd.execution_host_identity}

      ${this.execCtxTable}

      -- TODO: the host column in context table should be \`execution_host_identity\` not TEXT
      -- TODO: see ticket #87 - REFERENCES "execution_context"("code") should be schema-qualified
      ${this.searchPath}
      ${context}

      -- TODO: add trigger to ensure that no improper values can be added into context`;
  }

  execCtxFunctions() {
    const { ec } = this.state;
    const [sQR] = ec.schemaQualifier("dcp_context");

    // deno-fmt-ignore
    const ecConstantFn = (ec: pgdcp.ExecutionContext) => ({
      SQL: () => `CREATE OR REPLACE FUNCTION ${sQR(`exec_context_${ec}`)}() RETURNS ${sQR("execution_context")} LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $ecConstantFn$ SELECT ('${ec}'::text)::${sQR("execution_context")}$ecConstantFn$;`
    });

    // deno-fmt-ignore
    const isCompareExecCtxFn = (ec: pgdcp.ExecutionContext) => ({
      SQL: () => `CREATE OR REPLACE FUNCTION ${sQR(`is_exec_context_${ec}`)}(ec ${sQR("execution_context")}) RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $isCompareExecCtxFn$ SELECT CASE WHEN $1 = ${sQR(`exec_context_${ec}`)}() THEN true else false end; $isCompareExecCtxFn$;`
    });

    // deno-fmt-ignore
    const isActiveExecCtxFn = (ec: pgdcp.ExecutionContext) => ({
      SQL: () => `CREATE OR REPLACE FUNCTION ${sQR(`is_active_context_${ec}`)}() RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $isActiveExecCtxFn$ SELECT CASE WHEN active::text = (${sQR(`exec_context_${ec}`)}())::text THEN true else false end from ${sQR("context")} where singleton_id = true; $isActiveExecCtxFn$;`
    });

    const dropExecCtxFns = (
      ec: pgdcp.ExecutionContext,
    ) => [{
      SQL: () => `DROP FUNCTION IF EXISTS ${sQR(`exec_context_${ec}`)}()`,
    }, {
      SQL: () => `DROP FUNCTION IF EXISTS ${sQR(`is_exec_context_${ec}`)}()`,
    }, {
      SQL: () => `DROP FUNCTION IF EXISTS ${sQR(`is_active_context_${ec}`)}()`,
    }];

    return {
      ecConstantFn,
      isCompareExecCtxFn,
      isActiveExecCtxFn,
      dropExecCtxFns,
    };
  }

  content() {
    const { ae, ec, lc } = this.state;
    const ecf = this.execCtxFunctions();

    // deno-fmt-ignore
    const psqlText = ec.SQL()`
      ${ec.psqlHeader}

      ${this.constructStorage()}

      ${lc.constructIdempotent()`
        ${pgdcp.executionContexts.map((ec) => ecf.ecConstantFn(ec))}

        ${pgdcp.executionContexts.map((ec) => ecf.isCompareExecCtxFn(ec))}

        ${pgdcp.executionContexts.map((ec) => ecf.isActiveExecCtxFn(ec))}`}

      ${lc.destroyIdempotent()`
        -- TODO: DROP FUNCTION IF EXISTS {lcf.unitTest(state).qName}();
        ${pgdcp.executionContexts.map((ec) => ecf.dropExecCtxFns(ec)).flat()}`}

      ${lc.populateSeedData()`
        ${this.execCtxTable.insertDML({ code:"DEVELOPMENT",value:pgdcp.ExecutionContext.DEVELOPMENT}, {
          onConflict: {
            SQL: () => `ON CONFLICT DO NOTHING`,
          },
        }).SQL(this.ctx)};
        ${this.execCtxTable.insertDML({ code:"PRODUCTION",value:pgdcp.ExecutionContext.PRODUCTION}, {
          onConflict: {
            SQL: () => `ON CONFLICT DO NOTHING`,
          },
        }).SQL(this.ctx)};
        ${this.execCtxTable.insertDML({ code:"SANDBOX",value:pgdcp.ExecutionContext.SANDBOX}, {
          onConflict: {
            SQL: () => `ON CONFLICT DO NOTHING`,
          },
        }).SQL(this.ctx)};
        ${this.execCtxTable.insertDML({ code:"EXPERIMENTAL",value:pgdcp.ExecutionContext.EXPERIMENTAL}, {
          onConflict: {
            SQL: () => `ON CONFLICT DO NOTHING`,
          },
        }).SQL(this.ctx)};
        ${this.execCtxTable.insertDML({ code:"TEST",value:pgdcp.ExecutionContext.TEST}, {
          onConflict: {
            SQL: () => `ON CONFLICT DO NOTHING`,
          },
        }).SQL(this.ctx)};
      `}

      ${ae.unitTest()`
        ${pgdcp.executionContexts.map((ec) => [
            ae.hasFunction("dcp_context", `exec_context_${ec}`),
            ae.hasFunction("dcp_context", `is_exec_context_${ec}`),
            ae.hasFunction("dcp_context", `is_active_context_${ec}`),
          ]).flat()}`}`;

    const provenance: pgdcp.SqlFilePersistProvenance = {
      confidentiality: "non-sensitive",
      source: import.meta.url,
    };
    const persistableSQL:
      & pgdcp.SqlFilePersistProvenance
      & pc.PersistableContent<pgdcp.SqlFilePersistProvenance> = {
        ...provenance,
        basename: () => ec.psqlBasename(),
        // deno-lint-ignore require-await
        content: async () => {
          return {
            provenance,
            text: psqlText.SQL(ec.sqlEmitContext()),
          };
        },
      };

    return {
      psqlText,
      provenance,
      persistableSQL,
    };
  }

  static init() {
    return new PgDcpContext();
  }
}

if (import.meta.main) {
  const context = PgDcpContext.init();
  const content = context.content();
  console.log(content.psqlText.SQL(context.state.ec.sqlEmitContext()));
}
