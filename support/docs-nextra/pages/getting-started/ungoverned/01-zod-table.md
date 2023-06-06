---
title: Single Zod Table (without template)
---

```typescript filename="examples/getting-started/01-zod-table.sqla.ts"
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as SQLa from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vX.Y.Z/pattern/typical/mod.ts";

const tableWithoutPK = SQLa.tableDefinition("synthetic_table_without_pk", {
  text: z.string(),
  text_nullable: z.string().optional(),
  int: z.number(),
  int_nullable: z.number().optional(),
});

console.log(tableWithoutPK.SQL(SQLa.typicalSqlEmitContext()));
```

```bash
deno run ./examples/getting-started/01-zod-table.sqla.ts
```

Produces:

```sql
CREATE TABLE "synthetic_table_without_pk" (
    "text" TEXT NOT NULL,
    "text_nullable" TEXT,
    "int" INTEGER NOT NULL,
    "int_nullable" INTEGER
)
```
