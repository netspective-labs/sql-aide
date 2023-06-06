#!/usr/bin/env -S deno run --allow-all

import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as SQLa from "../../render/mod.ts";

type SyntheticContext = SQLa.SqlEmitContext;
const pkcFactory = SQLa.primaryKeyColumnFactory<SyntheticContext>();

const tableWithAutoIncPK = SQLa.tableDefinition(
  "synthetic_table_with_auto_inc_pk",
  {
    auto_inc_primary_key: pkcFactory.autoIncPrimaryKey(),
    text: z.string(),
    text_nullable: z.string().optional(),
    int: z.number(),
    int_nullable: z.number().optional(),
  },
);

const tableWithFK = SQLa.tableDefinition(
  "synthetic_table_with_foreign_keys",
  {
    auto_inc_primary_key: pkcFactory.autoIncPrimaryKey(),
    fk_int_primary_key: tableWithAutoIncPK.belongsTo.auto_inc_primary_key(),
    fk_text_primary_key_not_nullable: tableWithAutoIncPK.references.text(),
    fk_text_primary_key_nullable: tableWithAutoIncPK.references.text()
      .optional(),
    fk_int_primary_key_nullable: tableWithAutoIncPK.references
      .int().optional(),
  },
);

const sqliteDDL = SQLa.SQL(SQLa.typicalSqlTextSupplierOptions())`
  -- this is a template where you can add any SQLite SQL

  -- now emit the Zod tables as SQLite
  ${tableWithAutoIncPK}

  ${tableWithFK}

  -- now emit something else after the tables
`;

const sqlServerDDL = SQLa.SQL(SQLa.typicalSqlTextSupplierOptions())`
  -- this is a template where you can add any MS SQL*Server SQL

  -- now emit the Zod tables SQL*Server style
  ${tableWithAutoIncPK}

  ${tableWithFK}

  -- now emit something else after the tables
`;

console.log(
  sqliteDDL.SQL(
    SQLa.typicalSqlEmitContext({ sqlDialect: SQLa.sqliteDialect() }),
  ),
);

console.log(
  sqlServerDDL.SQL(
    SQLa.typicalSqlEmitContext({
      sqlDialect: SQLa.msSqlServerDialect(),
      sqlNamingStrategy: SQLa.bracketSqlNamingStrategy(),
    }),
  ),
);
