import { path } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import { zod as z } from "../../deps.ts";
import * as SQLa from "../../mod.ts";
import * as polygen from "../mod.ts";
import * as mod from "./mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

type SyntheticContext = SQLa.SqlEmitContext;

const sqlGen = () => {
  const ctx: SyntheticContext = SQLa.typicalSqlEmitContext();
  const ddlOptions = SQLa.typicalSqlTextSupplierOptions();
  const qsContent = SQLa.typicalSqlQualitySystemContent(
    ddlOptions.sqlQualitySystemState,
  );
  return { ctx, ddlOptions, qsContent };
};

const syntheticSchema = () => {
  const tcf = SQLa.tableColumnFactory<
    Any,
    SyntheticContext,
    SQLa.SqlDomainQS
  >();
  const pkcFactory = SQLa.primaryKeyColumnFactory<
    SyntheticContext,
    SQLa.SqlDomainQS
  >();
  const commonColumns = {
    text: z.string().describe(`commonColumns.text description`),
    text_nullable: z.string().describe(
      `commonColumns.text_nullable description`,
    ).optional(),
    int: z.number(),
    int_nullable: z.number().optional(),
    // TODO: add all the other scalars and types
  };
  const housekeeping = {
    columns: {
      created_at: z.date().default(new Date()).optional(),
    },
    // IMPORTANT: pass this into tableColumnsRowFactory(..., { defaultIspOptions: housekeeping.insertStmtPrepOptions })
    insertStmtPrepOptions: <TableName extends string>() => {
      const result: SQLa.InsertStmtPreparerOptions<
        TableName,
        { created_at?: Date }, // this must match housekeeping.columns so that isColumnEmittable is type-safe
        { created_at?: Date }, // this must match housekeeping.columns so that isColumnEmittable is type-safe
        SyntheticContext,
        SQLa.SqlDomainQS
      > = {
        // created_at should be filled in by the database so we don't want
        // to emit it as part of the insert DML SQL statement
        isColumnEmittable: (name) => name == "created_at" ? false : true,
      };
      return result as SQLa.InsertStmtPreparerOptions<
        Any,
        Any,
        Any,
        SyntheticContext,
        SQLa.SqlDomainQS
      >;
    },
  };

  const tableWithoutPK = SQLa.tableDefinition("synthetic_table_without_pk", {
    ...commonColumns,
  });
  const tableWithAutoIncPK = SQLa.tableDefinition(
    "synthetic_table_with_auto_inc_pk",
    {
      auto_inc_primary_key: pkcFactory.autoIncPrimaryKey(),
      ...commonColumns,
    },
  );
  const tableWithTextPK = SQLa.tableDefinition("synthetic_table_with_text_pk", {
    text_primary_key: pkcFactory.primaryKey(z.string()),
    ...commonColumns,
  });
  const tableWithOnDemandPK = SQLa.tableDefinition(
    "synthetic_table_with_uaod_pk",
    {
      ua_on_demand_primary_key: pkcFactory.uaDefaultableTextPrimaryKey(
        z.string().default(() => "ON_DEMAND_PK"),
      ),
      ...commonColumns,
    },
    { descr: "synthetic_table_with_uaod_pk" },
  );
  const tableWithConstraints = SQLa.tableDefinition(
    "synthetic_table_with_constraints",
    {
      text_primary_key: pkcFactory.primaryKey(z.string()),
      column_unique: tcf.unique(z.string()),
      ...housekeeping.columns,
    },
    {
      // test "manual" creation of constraints
      sqlPartial: (destination) => {
        if (destination == "after all column definitions") {
          return [
            {
              SQL: () =>
                `UNIQUE(column_one_text, column_three_text_digest) /* CUSTOM CONSTRAINT */`,
            },
          ];
        }
      },
      // test "automatic" creation of unique constraints
      constraints: (props, tableName) => {
        const c = SQLa.tableConstraints(tableName, props);
        return [
          c.unique("column_unique", "created_at"),
          c.uniqueNamed("uniq_constr_name", "text_primary_key", "created_at"),
        ];
      },
      // test "automatic" creation of table indexes
      indexes: (props, tableName) => {
        const tif = SQLa.tableIndexesFactory(tableName, props);
        return [
          tif.index(undefined, "column_unique", "created_at"),
          tif.index(
            { indexIdentity: "custom_index_name", isUnique: true },
            "text_primary_key",
            "created_at",
          ),
        ];
      },
      populateQS: (tableQS, columnsQS) => {
        tableQS.description =
          "synthetic_table_with_constraints table description in prepareQS";
        columnsQS.column_unique.description =
          "column_unique description in prepareQS";
        columnsQS.text_primary_key.description =
          "text_primary_key description in prepareQS";
        return tableQS;
      },
    },
  );

  return {
    pkcFactory,
    commonColumns,
    housekeeping,
    tableWithoutPK,
    tableWithAutoIncPK,
    tableWithTextPK,
    tableWithOnDemandPK,
    tableWithConstraints,
  };
};

Deno.test("Rust information model structures", async () => {
  const { ctx } = sqlGen();

  const pso = polygen.typicalPolygenInfoModelOptions<
    SyntheticContext,
    Any,
    Any
  >();
  const engine = new mod.RustSerDePolygenEngine<SyntheticContext, Any, Any>(
    ctx,
    pso,
  );
  const imNB = new polygen.PolygenInfoModelNotebook<
    Any,
    SyntheticContext,
    Any,
    Any
  >(
    engine,
    ctx,
    function* () {
      for (const [_, value] of Object.entries(syntheticSchema())) {
        if (SQLa.isGraphEntityDefinitionSupplier(value)) {
          yield value.graphEntityDefn() as Any; // TODO: why is "Any" required here???
        }
      }
    },
    pso,
  );

  const fixture = Deno.readTextFileSync(
    path.fromFileUrl(import.meta.resolve("./mod_test-fixture-serde.rs")),
  );
  const esc = await imNB.entitiesSrcCode();
  ta.assert(await SQLa.sourceCodeText(ctx, esc), fixture);
});
