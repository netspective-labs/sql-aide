---
title: Multiple Zod Tables (with Foreign Keys)
sidebar:
  order: 3
---

```typescript filename="examples/getting-started/03-zod-table-pk-fk-tmpl.sqla.ts"
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as SQLa from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vX.Y.Z/render/mod.ts";

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

const seedDDL = SQLa.SQL(SQLa.typicalSqlTextSupplierOptions())`
  -- this is a template where you can add any SQL

  -- now emit the Zod tables
  ${tableWithAutoIncPK}

  ${tableWithFK}

  -- now emit something else after the table
`;

console.log(seedDDL.SQL(SQLa.typicalSqlEmitContext()));
```

```bash
deno run ./examples/getting-started/03-zod-table-pk-fk-tmpl.sqla.ts
```

Produces:

```sql
-- this is a template where you can add any SQL

-- now emit the Zod tables
CREATE TABLE "synthetic_table_with_auto_inc_pk" (
    "auto_inc_primary_key" INTEGER PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "text_nullable" TEXT,
    "int" INTEGER NOT NULL,
    "int_nullable" INTEGER
);

CREATE TABLE "synthetic_table_with_foreign_keys" (
    "auto_inc_primary_key" INTEGER PRIMARY KEY AUTOINCREMENT,
    "fk_int_primary_key" INTEGER NOT NULL,
    "fk_text_primary_key_not_nullable" TEXT NOT NULL,
    "fk_text_primary_key_nullable" TEXT,
    "fk_int_primary_key_nullable" INTEGER,
    FOREIGN KEY("fk_int_primary_key") REFERENCES "synthetic_table_with_auto_inc_pk"("auto_inc_primary_key"),
    FOREIGN KEY("fk_text_primary_key_not_nullable") REFERENCES "synthetic_table_with_auto_inc_pk"("text"),
    FOREIGN KEY("fk_text_primary_key_nullable") REFERENCES "synthetic_table_with_auto_inc_pk"("text"),
    FOREIGN KEY("fk_int_primary_key_nullable") REFERENCES "synthetic_table_with_auto_inc_pk"("int")
);

-- now emit something else after the table
```
