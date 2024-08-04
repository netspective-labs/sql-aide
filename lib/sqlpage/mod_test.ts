import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { ComponentsRenderer, SQLPageAide } from "./mod.ts";

Deno.test("SQLPageAide with SQL pages class", () => {
  // Define a class with SQL methods
  class MySqlPages {
    "index.sql"() {
      return "SELECT * FROM users;";
    }

    "page1.sql"() {
      return "INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');";
    }
  }

  const sqlAide = new SQLPageAide(MySqlPages);
  const sqlStatements = sqlAide.SQL();

  assertEquals(sqlStatements.length, 2);
  assertEquals(
    sqlStatements[0],
    "INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('index.sql', 'SELECT * FROM users;', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents, last_modified = CURRENT_TIMESTAMP;",
  );
  assertEquals(
    sqlStatements[1],
    "INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('page1.sql', 'INSERT INTO users (name, email) VALUES (''John Doe'', ''john@example.com'');', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents, last_modified = CURRENT_TIMESTAMP;",
  );
});

Deno.test("SQLPageAide with MySqlPages custom instance and custom args", () => {
  // Define a class with SQL methods
  class MySqlPages {
    constructor(readonly cr: ComponentsRenderer) {
    }
    "index.sql"(user: string) {
      return this.cr.component({
        component: "alert",
        message: `${user}`,
      }).SQL();
    }
  }

  // Define a contentsArgsSupplier function
  const sqlPageAide = new SQLPageAide(new MySqlPages(new ComponentsRenderer()))
    .withContentsArgsSupplier((_source, _path, user) => [user]);

  const sqlStatements = sqlPageAide.SQL("John Doe");

  assertEquals(sqlStatements.length, 1);
  assertEquals(
    sqlStatements[0],
    "INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('index.sql', 'SELECT ''alert'' AS component, ''John Doe'' AS message;', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents, last_modified = CURRENT_TIMESTAMP;",
  );
});

Deno.test("SQLPageAide with SQL pages object and custom args", () => {
  const sqlAide = new SQLPageAide({
    "index.sql"() {
      return "SELECT * FROM users;";
    },
    "page1.sql": (user: string, email: string) => {
      return `INSERT INTO users (name, email) VALUES ('${user}', '${email}');`;
    },
  }).withContentsArgs(["John Doe", "john@example.com"]);

  const sqlStatements = sqlAide.SQL();
  assertEquals(sqlStatements.length, 2);
  assertEquals(
    sqlStatements[0],
    "INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('index.sql', 'SELECT * FROM users;', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents, last_modified = CURRENT_TIMESTAMP;",
  );
  assertEquals(
    sqlStatements[1],
    "INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('page1.sql', 'INSERT INTO users (name, email) VALUES (''John Doe'', ''john@example.com'');', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents, last_modified = CURRENT_TIMESTAMP;",
  );
});

Deno.test("SQLPageAide with SQL pages object and custom args", () => {
  // this is a "special" test case to ensure the SQLPageAide works with SQLa instances
  // without requiring SQLa as a dependency
  interface SpecialSQL {
    SQL: () => string;
  }

  function isSpecialSQL(instance: unknown): instance is SpecialSQL {
    // deno-lint-ignore no-explicit-any
    if (instance && typeof instance === "object" && (instance as any)["SQL"]) {
      return true;
    }
    return false;
  }

  const sqlAide = new SQLPageAide({
    "index.sql"() {
      return "SELECT * FROM users;";
    },
    "page1.sql": (user: string, email: string) => {
      return `INSERT INTO users (name, email) VALUES ('${user}', '${email}');`;
    },
    "page2.sql": (user: string, email: string) => {
      return {
        SQL: () =>
          `INSERT INTO users (name, email) VALUES ('${user}', '${email}');`,
      };
    },
    "page3.sql": () => {
      return {
        "shouldBeBad": "isBad",
      };
    },
  })
    .withContentsArgs(["John Doe", "john@example.com"])
    .onNonStringContents((result) =>
      isSpecialSQL(result) ? result.SQL() : `/* Bad result ${typeof result} */`
    );

  const sqlStatements = sqlAide.SQL();
  assertEquals(sqlStatements.length, 4);
  assertEquals(
    sqlStatements[0],
    "INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('index.sql', 'SELECT * FROM users;', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents, last_modified = CURRENT_TIMESTAMP;",
  );
  assertEquals(
    sqlStatements[1],
    "INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('page1.sql', 'INSERT INTO users (name, email) VALUES (''John Doe'', ''john@example.com'');', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents, last_modified = CURRENT_TIMESTAMP;",
  );
  assertEquals(
    sqlStatements[2],
    "INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('page2.sql', 'INSERT INTO users (name, email) VALUES (''John Doe'', ''john@example.com'');', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents, last_modified = CURRENT_TIMESTAMP;",
  );
  assertEquals(
    sqlStatements[3],
    "INSERT INTO sqlpage_files (path, contents, last_modified) VALUES ('page3.sql', '/* Bad result object */', CURRENT_TIMESTAMP) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents, last_modified = CURRENT_TIMESTAMP;",
  );
});
