#!/usr/bin/env -S deno run --allow-all

import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as SQLa from "../../render/mod.ts";

const tableWithoutPK = SQLa.tableDefinition("synthetic_table_without_pk", {
  text: z.string(),
  text_nullable: z.string().optional(),
  int: z.number(),
  int_nullable: z.number().optional(),
});

const seedDDL = SQLa.SQL(SQLa.typicalSqlTextSupplierOptions())`
  -- this is a template where you can add any SQL

  -- now emit the Zod table
  ${tableWithoutPK}

  -- now emit something else after the table
`;

console.log(seedDDL.SQL(SQLa.typicalSqlEmitContext()));

// when you run it, it will generate

// -- this is a template where you can add any SQL

// -- now emit the Zod table
// CREATE TABLE "synthetic_table_without_pk" (
//     "text" TEXT NOT NULL,
//     "text_nullable" TEXT,
//     "int" INTEGER NOT NULL,
//     "int_nullable" INTEGER
// );

// -- now emit something else after the table
