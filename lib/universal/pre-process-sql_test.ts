import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { unindentWhitespace as uws } from "../../lib/universal/whitespace.ts";
import * as mod from "./pre-process-sql.ts";

Deno.test("setVarValueDirective correctly handles declarations", () => {
  const d = mod.setVarValueDirective();

  for (
    const c of [
      [d.handleDeclaration({ line: "\\set count 42", lineNum: 1 }), {
        state: "mutated",
        line: "-- \\set count 42 (variable: count, value: 42, srcLine: 1)",
      }],
      [d.handleDeclaration({ line: "\\set name John", lineNum: 2 }), {
        state: "mutated",
        line: "-- \\set name John (variable: name, value: John, srcLine: 2)",
      }],
      [
        d.handleDeclaration({
          line: "\\set url 'https://example.com'",
          lineNum: 3,
        }),
        {
          state: "mutated",
          line:
            "-- \\set url 'https://example.com' (variable: url, value: https://example.com, srcLine: 3)",
        },
      ],
      [
        d.handleDeclaration({
          line: "\\set var = value",
          lineNum: 4,
        }),
        {
          state: "mutated",
          line:
            "-- \\set var = value (variable: var, value: value, srcLine: 4)",
        },
      ],
      [
        d.handleDeclaration({
          line: "\\set greeting 'Hello, 'world'!'",
          lineNum: 5,
        }),
        {
          state: "mutated",
          line:
            "-- \\set greeting 'Hello, 'world'!' (variable: greeting, value: Hello, 'world'!, srcLine: 5)",
        },
      ],
      [
        d.handleDeclaration({
          line: `\\set greeting2 "Hello, \"world\"!"`,
          lineNum: 6,
        }),
        {
          state: "mutated",
          line:
            `-- \\set greeting2 "Hello, \"world\"!" (variable: greeting2, value: Hello, "world"!, srcLine: 6)`,
        },
      ],
    ]
  ) {
    assertEquals(c[0], c[1]);
  }

  assertEquals(
    Array.from(d.catalog.values()).map((e) => ({
      name: e.varName,
      value: e.varValue,
    })),
    [
      { name: "count", value: "42" },
      { name: "name", value: "John" },
      { name: "url", value: "https://example.com" },
      { name: "var", value: "value" },
      { name: "greeting", value: "Hello, 'world'!" },
      { name: "greeting2", value: 'Hello, "world"!' },
    ],
  );
});

Deno.test("setVarValueDirective correctly identifies directives", () => {
  const directive = mod.setVarValueDirective();
  assert(directive.isDirective({
    line: "\\set name John",
    lineNum: 1,
  }));
  assertEquals(
    directive.isDirective({
      line: "\\setx name John",
      lineNum: 1,
    }),
    false,
  );
});

Deno.test("setVarValueDirective correctly handles overrides", () => {
  const directive = mod.setVarValueDirective({
    overrides: {
      name: "Jane",
    },
  });
  directive.handleDeclaration({
    line: "\\set name John",
    lineNum: 1,
  });

  const vv = directive.varValue("name");
  assert(vv.found);
  assertEquals(vv.varValue, "Jane");
});

Deno.test("setVarValueDirective handles single quoted values correctly", () => {
  const directive = mod.setVarValueDirective();
  directive.handleDeclaration({
    line: "\\set greeting 'Hello, 'world'!'",
    lineNum: 1,
  });

  const vv = directive.varValue("greeting");
  assert(vv.found);
  assertEquals(vv.varValue, "Hello, 'world'!");
});

Deno.test("setVarValueDirective handles double quoted values correctly", () => {
  const directive = mod.setVarValueDirective();
  directive.handleDeclaration({
    line: `\\set greeting "Hello, \"world\"!"`,
    lineNum: 1,
  });

  const vv = directive.varValue("greeting");
  assert(vv.found);
  assertEquals(vv.varValue, `Hello, "world"!`);
});

Deno.test("Variable substitution, removed \\set from result, no overrides", () => {
  const sql = uws(`
    \\set name 'John Doe'
    \\set table users
    SELECT * FROM users WHERE username = :'name';
    SELECT * FROM :table WHERE username = :'name';
    SELECT * FROM :"table" WHERE username = :'name';`);

  const pp = mod.psqlPreprocess(sql, {
    setDirective: mod.setVarValueDirective({
      handleSetInResult: () => undefined,
    }),
  });
  assertEquals(
    pp.interpolatedText,
    uws(`
        SELECT * FROM users WHERE username = 'John Doe';
        SELECT * FROM users WHERE username = 'John Doe';
        SELECT * FROM "users" WHERE username = 'John Doe';`),
  );
});

Deno.test("Variable substitution, keep \\set in result, with overrides", () => {
  const sql = uws(`
      \\set name 'John Doe'
      \\set table users
      \\set unit_test_schema dcp_assurance
      SELECT * FROM users WHERE username = :'name';
      SELECT * FROM :table WHERE username = :'name';
      SELECT * FROM :"table" WHERE username = :'name';
      SELECT * FROM :"table" WHERE username::"varchar" = :'name';
      SELECT email FROM :unit_test_schema.upsert_test_user((1, 'Updated Name', 'john.doe@example.com'):::"unit_test_schema".test_user)`);

  const pp = mod.psqlPreprocess(sql, {
    setDirective: mod.setVarValueDirective({
      onVarValueNotFound: () => `?????`,
      overrides: { name: "Shahid Shah" },
    }),
  });
  assertEquals(
    pp.interpolatedText,
    uws(`
          -- \\set name 'John Doe' (variable: name, value: John Doe, srcLine: 1)
          -- \\set table users (variable: table, value: users, srcLine: 2)
          -- \\set unit_test_schema dcp_assurance (variable: unit_test_schema, value: dcp_assurance, srcLine: 3)
          SELECT * FROM users WHERE username = 'Shahid Shah';
          SELECT * FROM users WHERE username = 'Shahid Shah';
          SELECT * FROM "users" WHERE username = 'Shahid Shah';
          SELECT * FROM "users" WHERE username::"varchar" = 'Shahid Shah';
          SELECT email FROM dcp_assurance.upsert_test_user((1, 'Updated Name', 'john.doe@example.com')::"dcp_assurance".test_user)`),
  );
});
