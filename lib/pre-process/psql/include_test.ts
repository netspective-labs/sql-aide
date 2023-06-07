import { path } from "../../../deps.ts";
import { testingAsserts as ta } from "../../../deps-test.ts";
import * as mod from "./include.ts";

/**
 * Given a file name, get its current location relative to this test script;
 * useful because unit tests can be run from any directory so we must find
 * the proper location automatically.
 */
const relativeFilePath = (name: string) => {
  const absPath = path.fromFileUrl(import.meta.resolve(name));
  return path.relative(Deno.cwd(), absPath);
};

Deno.test("includeDirective correctly handles in-memory targets", () => {
  const directive = mod.includeMetaCmd({
    content: (decl) => ({
      ...decl,
      content: [
        `-- synthetic line 1 (included ${decl.supplied})`,
        `-- synthetic line 2 (included ${decl.supplied})`,
      ],
    }),
  });

  for (
    const c of [
      [directive.handleMetaCommand({ line: `\\i 'file1.sql'`, lineNum: 1 }), {
        state: "replaced",
        lines: [
          `-- synthetic line 1 (included file1.sql)`,
          `-- synthetic line 2 (included file1.sql)`,
        ],
      }],
      [
        directive.handleMetaCommand({
          line: `\\include "file2.sql"`,
          lineNum: 2,
        }),
        {
          state: "replaced",
          lines: [
            `-- synthetic line 1 (included file2.sql)`,
            `-- synthetic line 2 (included file2.sql)`,
          ],
        },
      ],
      [
        directive.handleMetaCommand({
          line: `\\ir "file3.sql"`,
          lineNum: 2,
        }),
        {
          state: "replaced",
          lines: [
            `-- synthetic line 1 (included file3.sql)`,
            `-- synthetic line 2 (included file3.sql)`,
          ],
        },
      ],
      [
        directive.handleMetaCommand({ line: "\\i file4.sql", lineNum: 3 }),
        {
          state: "replaced",
          lines: [
            `-- synthetic line 1 (included file4.sql)`,
            `-- synthetic line 2 (included file4.sql)`,
          ],
        },
      ],
    ]
  ) {
    ta.assertEquals(c[0], c[1]);
  }

  ta.assertEquals(
    Array.from(directive.encountered.values()).map((e) => ({
      name: e.supplied,
      replCount:
        e.content?.filter((l) => l.indexOf(`included ${e.supplied}`)).length,
      method: e.metaCommand,
    })),
    [
      { method: "i", name: "file1.sql", replCount: 2 },
      { method: "include", name: "file2.sql", replCount: 2 },
      { method: "ir", name: "file3.sql", replCount: 2 },
      { method: "i", name: "file4.sql", replCount: 2 },
    ],
  );
});

Deno.test("includeDirective correctly handles file content", () => {
  const directive = mod.includeMetaCmd({
    resolve: (decl) => ({ ...decl, resolved: relativeFilePath(decl.supplied) }),
  });

  for (
    const c of [
      [
        directive.handleMetaCommand({
          line: `\\i './include_test.fixture-01.psql'`,
          lineNum: 1,
        }),
        {
          state: "replaced",
          lines: [
            `-- fixture-01`,
            ``,
            `\\set name 'John Doe'`,
            `\\set table users`,
            `\\set unit_test_schema dcp_assurance`,
            ``,
            `SELECT * FROM users WHERE username = :'name';`,
            `SELECT * FROM :table WHERE username = :'name';`,
            `SELECT * FROM :"table" WHERE username = :'name';`,
            `SELECT * FROM :"table" WHERE username::"varchar" = :'name';`,
            `SELECT email FROM :unit_test_schema.upsert_test_user((1, 'Updated Name', 'john.doe@example.com'):::"unit_test_schema".test_user);`,
          ],
        },
      ],
    ]
  ) {
    ta.assertEquals(c[0], c[1]);
  }

  ta.assertEquals(
    Array.from(directive.encountered.values()).map((e) => ({
      name: e.supplied,
      replCount: e.content?.length ?? 0,
    })),
    [
      { name: "./include_test.fixture-01.psql", replCount: 11 },
    ],
  );
});
