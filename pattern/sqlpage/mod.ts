import { zod as z } from "../../deps.ts";
import * as chainNB from "../../lib/notebook/chain-of-responsibility.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

// we want to auto-unindent our string literals and remove initial newline
export const markdown = (
  literals: TemplateStringsArray,
  ...expressions: unknown[]
) => {
  const literalSupplier = ws.whitespaceSensitiveTemplateLiteralSupplier(
    literals,
    expressions,
    {
      unindent: true,
      removeInitialNewLine: true,
    },
  );
  let interpolated = "";

  // Loop through each part of the template
  for (let i = 0; i < literals.length; i++) {
    interpolated += literalSupplier(i); // Add the string part
    if (i < expressions.length) {
      interpolated += expressions[i]; // Add the interpolated value
    }
  }
  return interpolated;
};

export function sqlPageNotebook<EmitContext extends SQLa.SqlEmitContext>(
  instanceSupplier: () => SQLPageNotebook<EmitContext>,
  ctxSupplier: () => EmitContext,
) {
  const kernel = chainNB.ObservableKernel.create(
    SQLPageNotebook.prototype,
    SQLPageNotebook.nbd,
  );
  const instance = instanceSupplier();
  return {
    kernel,
    instance,
    SQL: async () => {
      const irs = await kernel.initRunState();
      const pkcf = SQLa.primaryKeyColumnFactory<
        EmitContext,
        SQLa.SqlDomainQS
      >();

      const sqlPageFiles = SQLa.tableDefinition("sqlpage_files", {
        path: pkcf.primaryKey(z.string()),
        contents: z.string(),
        last_modified: z.date().default(new Date()).optional(),
      }, {
        isIdempotent: true,
        qualitySystem: {
          description: markdown`
                [SQLPage](https://sql.ophir.dev/) app server content`,
        },
      });
      const sqlPageFilesCRF = SQLa.tableColumnsRowFactory<
        typeof sqlPageFiles.tableName,
        typeof sqlPageFiles.zoSchema.shape,
        EmitContext,
        SQLa.SqlDomainQS,
        SQLa.SqlDomainsQS<SQLa.SqlDomainQS>
      >(
        sqlPageFiles.tableName,
        sqlPageFiles.zoSchema.shape,
      );

      const ctx = ctxSupplier();
      const sqlEngineNow = { SQL: () => `CURRENT_TIMESTAMP` };
      const notebookSQL: SQLa.SqlTextSupplier<EmitContext>[] = [sqlPageFiles];
      irs.runState.eventEmitter.afterCell = (cell, state) => {
        if (state.status == "successful") {
          notebookSQL.push(sqlPageFilesCRF.insertDML({
            path: cell, // the class's method name is the "cell"
            // deno-fmt-ignore
            contents: SQLa.isSqlTextSupplier<EmitContext>(state.execResult)
                  ? state.execResult.SQL(ctx)
                  : `select 'alert' as component,
                              'MutationSqlNotebook.SQLPageSeedDML() issue' as title,
                              'SQLPageNotebook cell "${cell}" did not return SQL (found: ${typeof state.execResult})' as description;`,
            last_modified: sqlEngineNow,
          }, {
            onConflict: {
              SQL: () =>
                `ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents, last_modified = CURRENT_TIMESTAMP`,
            },
          }));
        }
      };

      await kernel.run(instance, irs);
      return notebookSQL;
    },
  };
}

/**
 * Encapsulates [SQLPage](https://sql.ophir.dev/) content. SqlPageNotebook has
 * methods with the name of each [SQLPage](https://sql.ophir.dev/) content that
 * we want in the database. The MutationSqlNotebook sqlPageSeedDML method
 * "reads" the cells in the SqlPageNotebook (each method's result) and
 * generates SQL to insert the content of the page in the database in the format
 * and table expected by [SQLPage](https://sql.ophir.dev/).
 * NOTE: we break our PascalCase convention for the name of the class since SQLPage
 *       is a proper noun (product name).
 */
export class SQLPageNotebook<EmitContext extends SQLa.SqlEmitContext>
  extends SQLa.SqlNotebook<EmitContext> {
  // if you want to add any annotations, use this like:
  //   @SQLPageNotebook.nbd.init(), .finalize(), etc.
  //   @SQLPageNotebook.nbd.disregard(), etc.
  static nbd = new chainNB.NotebookDescriptor<
    SQLPageNotebook<Any>,
    chainNB.NotebookCell<
      SQLPageNotebook<Any>,
      chainNB.NotebookCellID<SQLPageNotebook<Any>>
    >
  >();

  constructor(readonly SQL: ReturnType<typeof SQLa.SQL<EmitContext>>) {
    super();
  }

  "index.sql"() {
    return this.SQL`
        SELECT
          'list' as component,
          'Get started: where to go from here ?' as title,
          'Here are some useful links to get you started with SQLPage.' as description;
        SELECT 'Information Schema (base)' as title,
          'info-schema.sql' as link,
          'TODO' as description,
          'blue' as color,
          'download' as icon;`;
  }

  "info-schema.sql"() {
    return this.SQL`
        ${this.infoSchemaMarkdown()}

        -- :info_schema_markdown should be defined in the above query
        SELECT 'text' as component,
               'Information Schema' as title,
               :info_schema_markdown as contents_md`;
  }

  /**
   * SQL which generates the Markdown content lines (rows) which describes all
   * the tables, columns, indexes, and views in the database. This should really
   * be a view instead of a query but SQLite does not support use of pragma_* in
   * views for security reasons.
   * TODO: check out https://github.com/k1LoW/tbls and make this query equivalent
   *       to that utility's output including generating PlantUML through SQL.
   */
  @SQLPageNotebook.nbd.disregard()
  infoSchemaMarkdown() {
    return this.SQL`
      -- TODO: https://github.com/lovasoa/SQLpage/discussions/109#discussioncomment-7359513
      --       see the above for how to fix for SQLPage but figure out to use the same SQL
      --       in and out of SQLPage (maybe do what Ophir said in discussion and create
      --       custom output for SQLPage using componetns?)
      WITH TableInfo AS (
        SELECT
          m.tbl_name AS table_name,
          CASE WHEN c.pk THEN '*' ELSE '' END AS is_primary_key,
          c.name AS column_name,
          c."type" AS column_type,
          CASE WHEN c."notnull" THEN '*' ELSE '' END AS not_null,
          COALESCE(c.dflt_value, '') AS default_value,
          COALESCE((SELECT pfkl."table" || '.' || pfkl."to" FROM pragma_foreign_key_list(m.tbl_name) AS pfkl WHERE pfkl."from" = c.name), '') as fk_refs,
          ROW_NUMBER() OVER (PARTITION BY m.tbl_name ORDER BY c.cid) AS row_num
        FROM sqlite_master m JOIN pragma_table_info(m.tbl_name) c ON 1=1
        WHERE m.type = 'table'
        ORDER BY table_name, row_num
      ),
      Views AS (
        SELECT '## Views ' AS markdown_output
        UNION ALL
        SELECT '| View | Column | Type |' AS markdown_output
        UNION ALL
        SELECT '| ---- | ------ |----- |' AS markdown_output
        UNION ALL
        SELECT '| ' || tbl_name || ' | ' || c.name || ' | ' || c."type" || ' | '
        FROM
          sqlite_master m,
          pragma_table_info(m.tbl_name) c
        WHERE
          m.type = 'view'
      ),
      Indexes AS (
        SELECT '## Indexes' AS markdown_output
        UNION ALL
        SELECT '| Table | Index | Columns |' AS markdown_output
        UNION ALL
        SELECT '| ----- | ----- | ------- |' AS markdown_output
        UNION ALL
        SELECT '| ' ||  m.name || ' | ' || il.name || ' | ' || group_concat(ii.name, ', ') || ' |' AS markdown_output
        FROM sqlite_master as m,
          pragma_index_list(m.name) AS il,
          pragma_index_info(il.name) AS ii
        WHERE
          m.type = 'table'
        GROUP BY
          m.name,
          il.name
      )
      SELECT
          markdown_output AS info_schema_markdown
      FROM
        (
          SELECT '## Tables' AS markdown_output
          UNION ALL
          SELECT
            CASE WHEN ti.row_num = 1 THEN '
      ### \`' || ti.table_name || '\` Table
      | PK | Column | Type | Req? | Default | References |
      | -- | ------ | ---- | ---- | ------- | ---------- |
      ' ||
              '| ' || is_primary_key || ' | ' || ti.column_name || ' | ' || ti.column_type || ' | ' || ti.not_null || ' | ' || ti.default_value || ' | ' || ti.fk_refs || ' |'
            ELSE
              '| ' || is_primary_key || ' | ' || ti.column_name || ' | ' || ti.column_type || ' | ' || ti.not_null || ' | ' || ti.default_value || ' | ' || ti.fk_refs || ' |'
            END
          FROM TableInfo ti
          UNION ALL SELECT ''
          UNION ALL SELECT * FROM	Views
          UNION ALL SELECT ''
          UNION ALL SELECT * FROM Indexes
      );`;
  }
}
