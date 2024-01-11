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
                <li><a href="?${pp.table_nature}=${hc.nature}&${pp.table_name}=${hc.table_name}">${hc.table_name}</a> (${hc.nature}, ${hc.columns_count} columns)</li>
            {{/each_row}}
            </ul>`,
        };
      },
      component: (tlaArg) => {
        const tla = tlaArg ?? { caption: "Information Model Entities" };
        return {
          ...tla,
          ...customCB.custom(
            customComponents.info_model_schema_tables,
            tla,
            (topLevel) =>
              SQL`
                ${topLevel}
                  SELECT m.type as nature, m.tbl_name AS ${rc.table_name}, (SELECT COUNT(*) FROM sqlite_master sm2 JOIN pragma_table_info(m.tbl_name) cc ON 1=1 WHERE sm2.tbl_name = m.tbl_name) AS ${rc.columns_count}
                    FROM sqlite_master m
                ORDER BY table_name`,
          ),
        };
      },
    };
    return customComp;
  }

  /**
   * SQL page with self-refering links which which describes all the tables,
   * columns, indexes, and views in the database.
   * TODO: check out https://github.com/k1LoW/tbls and make this page equivalent
   *       to that utility's output including generating PlantUML through SQL.
   */
  const infoSchemaSQL = () => {
    const { text, table } = tc;

    type PageParams = {
      readonly table_nature: string;
      readonly table_name: string;
    };
    type Row = {
      readonly nature: string;
      readonly table_name: string;
      readonly columns_count: string;
    };
    // for type-safety:
    // tla=top level args, pp=page params, rc=row column name, hc=handlebars colum name
    const [pp, pv, rc] = [
      comp.safePropNames<PageParams>(),
      comp.safeUrlQueryParams<PageParams>(),
      comp.safePropNames<Row>(),
    ];

    const tableCond: comp.Component<EmitContext>["condition"] = {
      anyExists: pv.table_name,
    };

    // deno-fmt-ignore
    return SQL`
      ${text({ title: "Information Model (Schema) Documentation", content: { markdown: 'TODO (description)' }})}

      ${table({rows: [{SQL: () => `
          SELECT format('[%s](?${pp.table_name}=%s&${pp.table_nature})', m.tbl_name, m.tbl_name, m.type) AS ${rc.table_name},
                 (SELECT COUNT(*) FROM sqlite_master sm2 JOIN pragma_table_info(m.tbl_name) cc ON 1=1 WHERE sm2.tbl_name = m.tbl_name) AS ${rc.columns_count},
                 m.type as ${rc.nature}
            FROM sqlite_master m
        ORDER BY ${rc.table_name}
      `}], columns: {[rc.table_name]: { markdown: true }}})}

      ${text({ title: { SQL: () => `(${pv.table_name} || ' ' || ${pv.table_nature} || ' columns' )` }, content: { markdown: 'TODO (lineage, governance, description, etc.)' }, condition: tableCond })}
      ${table({ rows: [
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
            WHERE m.tbl_name = ${pv.table_name}`}],
        condition: tableCond })}

      ${text({ title: { SQL: () => `(${pv.table_name} || ' indexes')` }})}
      ${table({ rows: [
        { SQL: () => `
            SELECT il.name as "Index Name", group_concat(ii.name, ', ') as columns
              FROM sqlite_master as m, pragma_index_list(m.name) AS il, pragma_index_info(il.name) AS ii
             WHERE m.tbl_name = ${pv.table_name}
             GROUP BY m.name, il.name`}],
        condition: tableCond })}

      -- TODO: add PlantUML or Mermaid ERD through SQL as emitted by tbls (use ChatGPT to create)
    `;
  };

  return {
    components: {
      infoModelSchemaTables,
    },
    infoSchemaSQL,
  };
}
