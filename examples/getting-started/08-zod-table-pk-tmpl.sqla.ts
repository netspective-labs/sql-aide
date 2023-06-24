#!/usr/bin/env -S deno run --allow-all

import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as SQLa from "../../render/mod.ts";

type SyntheticContext = SQLa.SqlEmitContext;
const pkcFactory = SQLa.primaryKeyColumnFactory<
  SyntheticContext,
  SQLa.SqlDomainQS
>();

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

const seedDDL = SQLa.SQL(SQLa.typicalSqlTextSupplierOptions())`
  -- this is a template where you can add any SQL

  -- now emit the Zod table
  ${tableWithAutoIncPK}

  -- now emit something else after the table
`;

console.log(seedDDL.SQL(SQLa.typicalSqlEmitContext()));

// when you run it, it will generate

// -- this is a template where you can add any SQL

// -- now emit the Zod table
// CREATE TABLE "synthetic_table_with_auto_inc_pk" (
//   "auto_inc_primary_key" INTEGER PRIMARY KEY AUTOINCREMENT,
//   "text" TEXT NOT NULL,
//   "text_nullable" TEXT,
//   "int" INTEGER NOT NULL,
//   "int_nullable" INTEGER
// );
// -- now emit something else after the table
