import { zod as z } from "../deps.ts";
import { testingAsserts as ta } from "../deps-test.ts";
import * as SQLa from "./mod.ts";
import * as mod from "./graph.ts";
import * as erd from "./diagram/plantuml-ie-notation.ts";

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
  const _tcf = SQLa.tableColumnFactory<
    Any,
    SyntheticContext,
    SQLa.SqlDomainQS
  >();
  const pkcFactory = SQLa.primaryKeyColumnFactory<
    SyntheticContext,
    SQLa.SqlDomainQS
  >();
  const commonColumns = {
    text: z.string(),
    text_nullable: z.string().optional(),
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
  );
  const tableWithFK = SQLa.tableDefinition(
    "synthetic_table_with_foreign_keys",
    {
      auto_inc_primary_key: pkcFactory.autoIncPrimaryKey(),
      fk_text_primary_key: tableWithOnDemandPK.references
        .ua_on_demand_primary_key(),
      fk_int_primary_key: tableWithAutoIncPK.belongsTo.auto_inc_primary_key(),
      fk_text_primary_key_nullable: tableWithOnDemandPK.references
        .ua_on_demand_primary_key().optional(),
      fk_int_primary_key_nullable: tableWithAutoIncPK.references
        .auto_inc_primary_key().optional(),
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
    tableWithFK,
  };
};

Deno.test("SQL Aide (SQLa) Graph", () => {
  const sg = sqlGen();
  const ss = syntheticSchema();

  const graph = mod.entitiesGraph(sg.ctx, function* () {
    for (const value of Object.values(ss)) {
      if (mod.isGraphEntityDefinitionSupplier(value)) {
        yield value.graphEntityDefn();
      }
    }
  });

  // console.dir(graph, { depth: 10 });
  ta.assertEquals(graph.entities.length, 5);
  ta.assertEquals(graph.entitiesByName.size, 5);
  ta.assertEquals(graph.edges.length, 4);
  ta.assertEquals(
    [{
      ref: {
        entity: "synthetic_table_with_uaod_pk",
        attr: "ua_on_demand_primary_key",
      },
      src: {
        entity: "synthetic_table_with_foreign_keys",
        attr: "fk_text_primary_key",
      },
    }, {
      ref: {
        entity: "synthetic_table_with_auto_inc_pk",
        attr: "auto_inc_primary_key",
      },
      src: {
        entity: "synthetic_table_with_foreign_keys",
        attr: "fk_int_primary_key",
      },
    }, {
      ref: {
        entity: "synthetic_table_with_uaod_pk",
        attr: "ua_on_demand_primary_key",
      },
      src: {
        entity: "synthetic_table_with_foreign_keys",
        attr: "fk_text_primary_key_nullable",
      },
    }, {
      ref: {
        entity: "synthetic_table_with_auto_inc_pk",
        attr: "auto_inc_primary_key",
      },
      src: {
        entity: "synthetic_table_with_foreign_keys",
        attr: "fk_int_primary_key_nullable",
      },
    }],
    graph.edges.map((e) => {
      return {
        ref: {
          entity: e.ref.entity.identity("presentation"),
          attr: e.ref.attr.identity,
        },
        src: {
          entity: e.source.entity.identity("presentation"),
          attr: e.source.attr.identity,
        },
      };
    }),
  );
});

Deno.test("SQL Aide (SQLa) PlantUML ERD", () => {
  const sg = sqlGen();
  const ss = syntheticSchema();

  const pumlERD = erd.plantUmlIE(sg.ctx, function* () {
    for (const value of Object.values(ss)) {
      if (mod.isGraphEntityDefinitionSupplier(value)) {
        yield value.graphEntityDefn();
      }
    }
  }, erd.typicalPlantUmlIeOptions());

  ta.assertEquals(pumlERD.content, pumlErdFixture);
});

const pumlErdFixture = `@startuml IE
  hide circle
  skinparam linetype ortho
  skinparam roundcorner 20
  skinparam class {
    BackgroundColor White
    ArrowColor Silver
    BorderColor Silver
    FontColor Black
    FontSize 12
  }

  entity "synthetic_table_without_pk" as synthetic_table_without_pk {
    * text: TEXT
      text_nullable: TEXT
    * int: INTEGER
      int_nullable: INTEGER
  }

  entity "synthetic_table_with_auto_inc_pk" as synthetic_table_with_auto_inc_pk {
      **auto_inc_primary_key**: INTEGER
    --
    * text: TEXT
      text_nullable: TEXT
    * int: INTEGER
      int_nullable: INTEGER
  }

  entity "synthetic_table_with_text_pk" as synthetic_table_with_text_pk {
    * **text_primary_key**: TEXT
    --
    * text: TEXT
      text_nullable: TEXT
    * int: INTEGER
      int_nullable: INTEGER
  }

  entity "synthetic_table_with_uaod_pk" as synthetic_table_with_uaod_pk {
    * **ua_on_demand_primary_key**: TEXT
    --
    * text: TEXT
      text_nullable: TEXT
    * int: INTEGER
      int_nullable: INTEGER
  }

  entity "synthetic_table_with_foreign_keys" as synthetic_table_with_foreign_keys {
      **auto_inc_primary_key**: INTEGER
    --
    * fk_text_primary_key: TEXT
    * fk_int_primary_key: INTEGER
      fk_text_primary_key_nullable: TEXT
      fk_int_primary_key_nullable: INTEGER
  }

  synthetic_table_with_uaod_pk |o..o{ synthetic_table_with_foreign_keys
  synthetic_table_with_auto_inc_pk |o..o{ synthetic_table_with_foreign_keys
  synthetic_table_with_uaod_pk |o..o{ synthetic_table_with_foreign_keys
  synthetic_table_with_auto_inc_pk |o..o{ synthetic_table_with_foreign_keys
@enduml`;
