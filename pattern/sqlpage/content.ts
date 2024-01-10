import * as SQLa from "../../render/mod.ts";
import * as comp from "./component.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export function sqliteContent<EmitContext extends SQLa.SqlEmitContext>(
  SQL: ReturnType<typeof SQLa.SQL<EmitContext>>,
) {
  const tc = comp.typicalComponents();
  const customComponents = {
    info_model_schema_tables: "info_model_schema_tables",
  } as const;
  type CustomComponentName = keyof typeof customComponents;
  const customCB = new comp.ComponentBuilder<
    CustomComponentName,
    EmitContext
  >();

  function infoModelSchemaTables() {
    type TopLevelArgs = { readonly caption?: string };
    type Row = {
      readonly nature: string;
      readonly table_name: string;
      readonly columns_count: string;
    };
    type PageParams = {
      readonly table_nature: string;
      readonly table_name: string;
    };
    // for type-safety:
    // tla=top level args, pp=page params, rc=row column name, hc=handlebars colum name
    const [tla, pp, rc, hc] = [
      comp.safeHandlebars<TopLevelArgs>(),
      comp.safePropNames<PageParams>(),
      comp.safePropNames<Row>(),
      comp.safeHandlebars<Row>(),
    ];
    const customComp: comp.CustomTemplateSupplier<
      EmitContext,
      typeof customComponents.info_model_schema_tables,
      TopLevelArgs,
      Row
    > = {
      templatePath: customCB.customTemplatePath(
        customComponents.info_model_schema_tables,
      ),
      handlebarsCode: () => {
        return {
          SQL: () =>
            comp.text`
            ${tla.caption ? tla.caption : ""}
            <ul>
            {{#each_row}}
                <li><a href="?${pp.table_nature}=${hc.nature}&${pp.table_name}=${hc.table_name}">${hc.table_name}</a> (${hc.columns_count})</li>
            {{/each_row}}
            </ul>`,
        };
      },
      component: (tlaArg) => {
        const tla = tlaArg ?? { caption: "Information Model (Schema) Tables" };
        return {
          ...tla,
          ...customCB.custom(
            customComponents.info_model_schema_tables,
            tla,
            (topLevel) =>
              SQL`
                ${topLevel}
                SELECT
                  m.type as nature,
                  m.tbl_name AS ${rc.table_name},
                  (SELECT COUNT(*) FROM sqlite_master sm2 JOIN pragma_table_info(m.tbl_name) cc ON 1=1 WHERE sm2.tbl_name = m.tbl_name) AS ${rc.columns_count}
                  FROM sqlite_master m
                  ORDER BY table_name`,
          ),
        };
      },
    };
    return customComp;
  }

  const sqliteMaster = () => {
    const { text, table } = tc;
    const imst = infoModelSchemaTables();

    // deno-fmt-ignore
    return SQL`
      ${text({ title: "Information Model (Schema) Documentation", content: { markdown: 'Test' }})}

      ${imst.component()}

      ${text({ title: { SQL: () => `($table_name || ' (' || $table_nature || ')' )` }, content: { markdown: 'Test' }})}
      ${table({ search: true, sort: true, rows: [
        { SQL: () => `
            SELECT
              ROW_NUMBER() OVER (PARTITION BY m.tbl_name ORDER BY c.cid) AS column_num,
              -- TODO: add governance information (e.g. description, etc. from SQLa)
              CASE WHEN c.pk THEN '*' ELSE '' END AS is_primary_key,
              c.name AS column_name,
              c."type" AS column_type,
              CASE WHEN c."notnull" THEN '*' ELSE '' END AS not_null,
              COALESCE(c.dflt_value, '') AS default_value,
              COALESCE((SELECT pfkl."table" || '.' || pfkl."to" FROM pragma_foreign_key_list(m.tbl_name) AS pfkl WHERE pfkl."from" = c.name), '') as fk_refs
              -- TODO: add "is_indexed" and other details
            FROM sqlite_master m JOIN pragma_table_info(m.tbl_name) c ON 1=1
            WHERE m.tbl_name = $table_name`}]})}

      -- TODO: add indexes, views, etc. as emitted by tbls
      -- TODO: add PlantUML or Mermaid ERD through SQL as emitted by tbls (use ChatGPT to create)
    `;
  };
  /**
   * SQL which generates the Markdown content lines (rows) which describes all
   * the tables, columns, indexes, and views in the database. This should really
   * be a view instead of a query but SQLite does not support use of pragma_* in
   * views for security reasons.
   * TODO: check out https://github.com/k1LoW/tbls and make this query equivalent
   *       to that utility's output including generating PlantUML through SQL.
   */
  const infoSchemaSQL = () =>
    SQL`
      -- TODO: https://github.com/lovasoa/SQLpage/discussions/109#discussioncomment-7359513
      --       see the above for how to fix for SQLPage but figure out to use the same SQL
      --       in and out of SQLPage (maybe do what Ophir said in discussion and create
      --       custom output for SQLPage using components?)
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
          'text' as component,
          'Information Schema' as title,
          group_concat(markdown_output, '
      ') AS contents_md
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

  return {
    components: {
      infoModelSchemaTables,
    },
    sqliteMaster,
    infoSchemaSQL,
  };
}
