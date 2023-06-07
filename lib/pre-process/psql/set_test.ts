import { testingAsserts as ta } from "../../../deps-test.ts";
import * as mod from "./set.ts";
import { PsqlSetMetaCmdTokens, psqlSetMetaCmdTokens } from "./set.ts";

Deno.test("psqlSetMetaCmdTokens simple unquoted", () => {
  const result: PsqlSetMetaCmdTokens = psqlSetMetaCmdTokens(
    `  \\set hello world`,
  );
  ta.assertEquals(result, {
    isSet: true,
    identifier: "hello",
    values: [{ token: "world", quoteType: undefined, hasColon: false }],
    resolve: result.resolve,
  });
});

Deno.test("psqlSetMetaCmdTokens simple single quotes", () => {
  const result: PsqlSetMetaCmdTokens = psqlSetMetaCmdTokens(
    `  \\set hello 'world'`,
  );
  ta.assertEquals(result, {
    isSet: true,
    identifier: "hello",
    values: [{ token: "world", quoteType: "'", hasColon: false }],
    resolve: result.resolve,
  });
});

Deno.test("psqlSetMetaCmdTokens simple single quotes with escaped single quote", () => {
  const result: PsqlSetMetaCmdTokens = psqlSetMetaCmdTokens(
    `  \\set hello 'wor''ld'`,
  );
  ta.assertEquals(result, {
    isSet: true,
    identifier: "hello",
    values: [{ token: "wor'ld", quoteType: "'", hasColon: false }],
    resolve: result.resolve,
  });
});

Deno.test("psqlSetMetaCmdTokens simple dependent variable", () => {
  const result: PsqlSetMetaCmdTokens = psqlSetMetaCmdTokens(
    `  \\set hello :world`,
  );
  ta.assertEquals(result, {
    isSet: true,
    identifier: "hello",
    values: [{ token: "world", quoteType: undefined, hasColon: true }],
    resolve: result.resolve,
  });
});

Deno.test("psqlSetMetaCmdTokens is not a set meta command", () => {
  const result: PsqlSetMetaCmdTokens = psqlSetMetaCmdTokens(
    `  hello world`,
  );
  ta.assertEquals(result, {
    isSet: false,
  });
});

Deno.test("psqlSetMetaCmdTokens with mixed quotes and dependent variable", () => {
  const result: PsqlSetMetaCmdTokens = psqlSetMetaCmdTokens(
    `  \\set hello 'world' "universe" :planet`,
  );
  ta.assertEquals(result, {
    isSet: true,
    identifier: "hello",
    values: [
      { token: "world", quoteType: "'", hasColon: false },
      { token: "universe", quoteType: '"', hasColon: false },
      { token: "planet", quoteType: undefined, hasColon: true },
    ],
    resolve: result.resolve,
  });
});

Deno.test("psqlSetMetaCmdTokens with mixed quotes and escapes for those quotes", () => {
  const result: PsqlSetMetaCmdTokens = psqlSetMetaCmdTokens(
    `  \\set hello 'wor''ld' "uni""verse"`,
  );
  ta.assertEquals(result, {
    isSet: true,
    identifier: "hello",
    values: [
      { token: "wor'ld", quoteType: "'", hasColon: false },
      { token: 'uni"verse', quoteType: '"', hasColon: false },
    ],
    resolve: result.resolve,
  });
});

Deno.test("psqlSetMetaCmdTokens with multiple dependent variables tokens", () => {
  const result: PsqlSetMetaCmdTokens = psqlSetMetaCmdTokens(
    `  \\set hello :world :'universe' :"planet"`,
  );
  ta.assertEquals(result, {
    isSet: true,
    identifier: "hello",
    values: [
      { token: "world", quoteType: undefined, hasColon: true },
      { token: "universe", quoteType: "'", hasColon: true },
      { token: "planet", quoteType: '"', hasColon: true },
    ],
    resolve: result.resolve,
  });
});

Deno.test("psqlSetMetaCmd correctly handles declarations", () => {
  const smc = mod.psqlSetMetaCmd();

  for (
    const c of [
      [smc.handleMetaCommand({ line: "\\set count 42", lineNum: 1 }), {
        state: "mutated",
        line: "-- \\set count 42 (variable: count, value: 42, srcLine: 1)",
      }],
      [smc.handleMetaCommand({ line: "\\set name John", lineNum: 2 }), {
        state: "mutated",
        line: "-- \\set name John (variable: name, value: John, srcLine: 2)",
      }],
      [
        smc.handleMetaCommand({
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
        smc.handleMetaCommand({
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
        smc.handleMetaCommand({
          line: "\\set greeting 'Hello, ''world''!'",
          lineNum: 5,
        }),
        {
          state: "mutated",
          line:
            "-- \\set greeting 'Hello, ''world''!' (variable: greeting, value: Hello, 'world'!, srcLine: 5)",
        },
      ],
      [
        smc.handleMetaCommand({
          line: `\\set greeting2 "Hello, ""world""!"`,
          lineNum: 6,
        }),
        {
          state: "mutated",
          line:
            `-- \\set greeting2 "Hello, ""world""!" (variable: greeting2, value: Hello, "world"!, srcLine: 6)`,
        },
      ],
    ]
  ) {
    ta.assertEquals(c[0], c[1]);
  }

  ta.assertEquals(
    Array.from(smc.catalog.values()).map((e) => ({
      name: e.mcTokens.identifier,
      value: e.mcTokens.resolve?.(smc),
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

Deno.test("psqlSetMetaCmd correctly identifies meta command", () => {
  const mc = mod.psqlSetMetaCmd();
  ta.assert(mc.isMetaCommand({ line: "\\set name John", lineNum: 1 }));
  ta.assertEquals(
    mc.isMetaCommand({ line: "\\setx name John", lineNum: 1 }),
    false,
  );
});

Deno.test("psqlSetMetaCmd correctly handles meta command", () => {
  const mc = mod.psqlSetMetaCmd({ overrides: { name: "Jane" } });
  mc.handleMetaCommand({ line: "\\set name John", lineNum: 1 });
  const vv = mc.varValue("name");
  ta.assert(vv.found);
  ta.assertEquals(vv.varValue, "Jane");
});

Deno.test("psqlSetMetaCmd correctly handles dependent variables", () => {
  const mc = mod.psqlSetMetaCmd({ overrides: { name: "Jane" } });
  mc.handleMetaCommand({ line: "\\set name John", lineNum: 1 });
  mc.handleMetaCommand({ line: "\\set greeting 'Hello ' :name", lineNum: 2 });
  mc.handleMetaCommand({
    line: "\\set greeting2 'Hello ' :'name' ', how are you?'",
    lineNum: 3,
  });
  const name = mc.varValue("name");
  ta.assert(name.found);
  ta.assertEquals(name.varValue, "Jane");

  const greeting = mc.varValue("greeting");
  ta.assert(greeting.found);
  ta.assertEquals(greeting.varValue, "Hello Jane");

  const greeting2 = mc.varValue("greeting2");
  ta.assert(greeting2.found);
  ta.assertEquals(greeting2.varValue, "Hello 'Jane', how are you?");
});

Deno.test("psqlSetMetaCmd handles single quoted values correctly", () => {
  const mc = mod.psqlSetMetaCmd();
  mc.handleMetaCommand({
    line: "\\set greeting 'Hello, ''world''!'",
    lineNum: 1,
  });

  const vv = mc.varValue("greeting");
  ta.assert(vv.found);
  ta.assertEquals(vv.varValue, "Hello, 'world'!");
});

Deno.test("psqlSetMetaCmd handles double quoted values correctly", () => {
  const mc = mod.psqlSetMetaCmd();
  mc.handleMetaCommand({
    line: `\\set greeting "Hello, ""world""!"`,
    lineNum: 1,
  });

  const vv = mc.varValue("greeting");
  ta.assert(vv.found);
  ta.assertEquals(vv.varValue, `Hello, "world"!`);
});
