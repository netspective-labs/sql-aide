---
title: Multiple Zod Tables with Dialects and Naming
---

```typescript filename="examples/getting-started/04-zod-table-pk-fk-tmpl-dialects.sqla.ts"
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as SQLa from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vX.Y.Z/pattern/typical/mod.ts";

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
```

```bash
deno run ./examples/getting-started/04-zod-table-pk-fk-tmpl-dialects.sqla.ts
```

Produces:

```sql
-- this is a template where you can add any SQLite SQL

-- now emit the Zod tables as SQLite
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

-- now emit something else after the tables
```

```sql
-- this is a template where you can add any MS SQL*Server SQL

-- now emit the Zod tables SQL*Server style
CREATE TABLE [synthetic_table_with_auto_inc_pk] (
    [auto_inc_primary_key] INTEGER IDENTITY(1,1) PRIMARY KEY,
    [text] NVARCHAR(MAX) NOT NULL,
    [text_nullable] NVARCHAR(MAX),
    [int] INTEGER NOT NULL,
    [int_nullable] INTEGER
);

CREATE TABLE [synthetic_table_with_foreign_keys] (
    [auto_inc_primary_key] INTEGER IDENTITY(1,1) PRIMARY KEY,
    [fk_int_primary_key] INTEGER NOT NULL,
    [fk_text_primary_key_not_nullable] NVARCHAR(MAX) NOT NULL,
    [fk_text_primary_key_nullable] NVARCHAR(MAX),
    [fk_int_primary_key_nullable] INTEGER,
    FOREIGN KEY([fk_int_primary_key]) REFERENCES [synthetic_table_with_auto_inc_pk]([auto_inc_primary_key]),
    FOREIGN KEY([fk_text_primary_key_not_nullable]) REFERENCES [synthetic_table_with_auto_inc_pk]([text]),
    FOREIGN KEY([fk_text_primary_key_nullable]) REFERENCES [synthetic_table_with_auto_inc_pk]([text]),
    FOREIGN KEY([fk_int_primary_key_nullable]) REFERENCES [synthetic_table_with_auto_inc_pk]([int])
);

-- now emit something else after the tables
```
