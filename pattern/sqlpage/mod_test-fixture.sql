CREATE TABLE IF NOT EXISTS "sqlpage_files" (
    "path" TEXT PRIMARY KEY NOT NULL,
    "contents" TEXT NOT NULL,
    "last_modified" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "sqlpage_files" ("path", "contents", "last_modified") VALUES ('index.sql', 'SELECT ''shell'' as component, ''Test Center'' as title, ''book'' as icon, ''/'' as link, ''issues'' as menu_item, ''schema'' as menu_item;
    ;
SELECT ''list'' as component;
SELECT ''Bad Item'' as title,''bad-item.sql'' as link;
SELECT ''Ingestion State Schema'' as title,''schema.sql'' as link;', (CURRENT_TIMESTAMP)) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents /* TODO: does not work in DuckDB , last_modified = (CURRENT_TIMESTAMP) */;

INSERT INTO "sqlpage_files" ("path", "contents", "last_modified") VALUES ('bad-item.sql', 'select ''alert'' as component,
                              ''sqlPageNotebook issue'' as title,
                              ''sqlPageNotebook cell "bad-item.sql" did not return SQL (found: string)'' as description;', (CURRENT_TIMESTAMP)) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents /* TODO: does not work in DuckDB , last_modified = (CURRENT_TIMESTAMP) */;

INSERT INTO "sqlpage_files" ("path", "contents", "last_modified") VALUES ('schema.sql', 'SELECT ''text'' as component, ''Information Model (Schema) Documentation'' as title, ''TODO (description)'' as contents_md;

SELECT ''table'' as component, ''table_name'' as markdown;

          SELECT format(''[%s](?table_name=%s&table_nature)'', m.tbl_name, m.tbl_name, m.type) AS table_name,
                 (SELECT COUNT(*) FROM sqlite_master sm2 JOIN pragma_table_info(m.tbl_name) cc ON 1=1 WHERE sm2.tbl_name = m.tbl_name) AS columns_count,
                 m.type as nature
            FROM sqlite_master m
        ORDER BY table_name
      ;

SELECT ''text'' as component, ($table_name || '' '' || $table_nature || '' columns'' ) as title, ''TODO (lineage, governance, description, etc.)'' as contents_md WHERE coalesce($table_name, '''') <> '''';
SELECT ''table'' as component WHERE coalesce($table_name, '''') <> '''';

            SELECT
              ROW_NUMBER() OVER (PARTITION BY m.tbl_name ORDER BY c.cid) AS column_num,
              -- TODO: add governance information (e.g. description, etc. from SQLa)
              CASE WHEN c.pk THEN ''*'' ELSE '''' END AS is_primary_key,
              c.name AS column_name,
              c."type" AS column_type,
              CASE WHEN c."notnull" THEN ''*'' ELSE '''' END AS not_null,
              COALESCE(c.dflt_value, '''') AS default_value,
              COALESCE((SELECT pfkl."table" || ''.'' || pfkl."to" FROM pragma_foreign_key_list(m.tbl_name) AS pfkl WHERE pfkl."from" = c.name), '''') as fk_refs
              -- TODO: add "is_indexed" and other details
            FROM sqlite_master m JOIN pragma_table_info(m.tbl_name) c ON 1=1
            WHERE m.tbl_name = $table_name;

SELECT ''text'' as component, ($table_name || '' indexes'') as title;
SELECT ''table'' as component WHERE coalesce($table_name, '''') <> '''';

            SELECT il.name as "Index Name", group_concat(ii.name, '', '') as columns
              FROM sqlite_master as m, pragma_index_list(m.name) AS il, pragma_index_info(il.name) AS ii
             WHERE m.tbl_name = $table_name
             GROUP BY m.name, il.name;

-- TODO: add PlantUML or Mermaid ERD through SQL as emitted by tbls (use ChatGPT to create)
    ', (CURRENT_TIMESTAMP)) ON CONFLICT(path) DO UPDATE SET contents = EXCLUDED.contents /* TODO: does not work in DuckDB , last_modified = (CURRENT_TIMESTAMP) */