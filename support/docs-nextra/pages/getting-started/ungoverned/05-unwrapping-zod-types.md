---
title: Unwrapping Zod Types
---

```typescript filename="examples/getting-started/05-unwrapping-zod-types.sqla.ts"
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as ta from "https://deno.land/std@0.191.0/testing/asserts.ts";
import * as za from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vX.Y.Z/lib/universal/zod-aide.ts";

// define Zod types
const textOptional = z.string().optional();

// clone and unwrap Zod type
const textOptionalUC = za.coreZTA(za.clonedZodType(textOptional));
ta.assert(textOptional.isOptional() && !textOptionalUC.isOptional());

console.log("Original type is optional:", textOptional.isOptional());
console.log(
  "Cloned and unwrapped type is optional:",
  textOptionalUC.isOptional(),
);
```

```bash
deno run ./examples/getting-started/05-unwrapping-zod-types.sqla.ts
```

Produces:

```string
Original type is optional: true
Cloned and unwrapped type is optional: false
```
