---
title: Zod Schema Proxy
---

```typescript filename="examples/getting-started/07-zod-schema-proxy.sqla.ts"
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as ta from "https://deno.land/std@0.191.0/testing/asserts.ts";
import * as za from "https://raw.githubusercontent.com/netspective-labs/sql-aide/vX.Y.Z/lib/universal/zod-aide.ts";

// define a Zod schema
const syntheticSchema = z.object({
  text: z.string(),
  url: z.string().url(),
  number: z.number(),
});

// add methods to Zod schema using zodSchemaProxy
const proxiedSchema = za.zodSchemaProxy(syntheticSchema, {
  isText: (synthetic, value: string) => {
    return synthetic.text === value;
  },
  isNumberInRange: (synthetic) => {
    return synthetic.number >= 10 && synthetic.number <= 100;
  },
  aliasForText() {
    return this.text;
  },
});

// parse a value using the proxied schema
const parsedSynthetic = proxiedSchema.parse({
  text: "Sample text",
  url: "https://github.com/shah",
  number: 52,
});

ta.assert(parsedSynthetic.isText("Sample text")); // use added method

console.log("Parsed synthetic:", parsedSynthetic);
console.log("isText method output:", parsedSynthetic.isText("Sample text"));
console.log(
  "isNumberInRange method output:",
  parsedSynthetic.isNumberInRange(),
);
console.log("aliasForText method output:", parsedSynthetic.aliasForText());
```

```bash
deno run ./examples/getting-started/07-zod-schema-proxy.sqla.ts
```

Produces:

```object
Parsed synthetic: { text: 'Sample text', url: 'https://github.com/shah', number: 52 }
isText method output: true
isNumberInRange method output: true
aliasForText method output: 'Sample text'
```
