#!/usr/bin/env -S deno run --allow-all

import * as pa from "../../postgres/psql-aide.ts";
const { zod: z } = pa;

export const psql = () => {
  return pa.psqlAide(
    {
      lifecycleSchema: z.string(),
      ltreeSchema: z.string(),
      semverSchema: z.string(),
      // TODO: unitTestSchema: z.string(),
    },
    (
      {
        setables: {
          lifecycleSchema,
          ltreeSchema,
          semverSchema,
          // TODO: unitTestSchema,
        },
      },
      SQL,
    ) => {
      const fa = pa.formatAide(
        {
          lifecycleSchema,
          ltreeSchema,
          semverSchema,
          // TODO: unitTestSchema,
          versionTableSchema: z.string(),
          versionTableName: z.string(),
          versionedItemColName: z.string(),
          defaultCtx: z.string(),
          initVersion: z.string(),
        },
        (
          {
            injectables: {
              lifecycleSchema,
              ltreeSchema,
              semverSchema,
              // TODO: unitTestSchema,
              versionTableSchema,
              versionTableName,
              versionedItemColName,
              defaultCtx,
              initVersion,
            },
          },
          formatSQL,
        ) => {
          formatSQL`
            CREATE TABLE IF NOT EXISTS ${versionTableSchema.s}.${versionTableName.s}_store(
                id integer GENERATED BY DEFAULT AS IDENTITY,
                nature ${ltreeSchema.s}.ltree NOT NULL,
                context ${ltreeSchema.s}.ltree,
                ${versionedItemColName.s}_path ${ltreeSchema.s}.ltree NOT NULL,
                ${versionedItemColName.s} text NOT NULL,
                version ${semverSchema.s}.semver NOT NULL,
                description text,
                labels text[],
                ${versionedItemColName.s}_elaboration jsonb,
                meta_data jsonb,
                created_at timestamp with time zone NOT NULL default current_date,
                created_by name NOT NULL default current_user,
                CONSTRAINT ${versionTableName.s}_identity UNIQUE(id),
                CONSTRAINT ${versionTableName.s}_unq_row UNIQUE(nature, context, ${versionedItemColName.s}_path, ${versionedItemColName.s}, version)
            );
            CREATE INDEX IF NOT EXISTS ${versionTableName.s}_store_nature_idx ON ${versionTableSchema.s}.${versionTableName.s}_store USING gist (nature);
            CREATE INDEX IF NOT EXISTS ${versionTableName.s}_store_context_idx ON ${versionTableSchema.s}.${versionTableName.s}_store USING gist (context);
            CREATE INDEX IF NOT EXISTS ${versionTableName.s}_store_${versionedItemColName.s}_path_idx ON ${versionTableSchema.s}.${versionTableName.s}_store USING gist (${versionedItemColName.s}_path);
            CREATE INDEX IF NOT EXISTS ${versionTableName.s}_store_${versionedItemColName.s}_idx ON ${versionTableSchema.s}.${versionTableName.s}_store (${versionedItemColName.s});
            CREATE INDEX IF NOT EXISTS ${versionTableName.s}_store_version_idx ON ${versionTableSchema.s}.${versionTableName.s}_store (version);
            CREATE INDEX IF NOT EXISTS ${versionTableName.s}_store_version_hash_idx ON ${versionTableSchema.s}.${versionTableName.s}_store USING hash (version);
            CREATE INDEX IF NOT EXISTS ${versionTableName.s}_store_labels_idx ON ${versionTableSchema.s}.${versionTableName.s}_store USING gin (labels);

            -- TODO: add, optionally, {versionTableSchema}.{versionTableName}_pg_relationship table to connect {versionTableSchema}.{versionTableName}_store record
            --       to PostgreSQL object catalogs; that way, we can tie the official catalog to specific
            --       versions as well
            -- TODO: add, optionally, {versionTableSchema}.{versionTableName}_event_relationship table to connect {versionTableSchema}.{versionTableName}_store record
            --       to an existing event manager row; that way, we can tie an event to a version of something

            CREATE OR REPLACE FUNCTION ${versionTableSchema.s}.${versionTableName.s}_initial_revision() RETURNS semver LANGUAGE sql IMMUTABLE PARALLEL SAFE AS 'SELECT ''${initVersion.s}''::semver';

            -- TODO: add {versionTableSchema}.{versionTableName}_next_major, {versionTableSchema}.{versionTableName}_next_minor, and {versionTableSchema}.{versionTableName}_next_patch
            -- CREATE FUNCTION ${versionTableSchema.s}.${versionTableName.s}_next_major(version semver) RETURNS semver LANGUAGE sql IMMUTABLE PARALLEL SAFE AS '(get_semver_major($1))';

            CREATE OR REPLACE VIEW ${versionTableSchema.s}.${versionTableName.s} AS
                select *
                    from ${versionTableSchema.s}.${versionTableName.s}_store
                order by version, created_at desc;

            CREATE OR REPLACE VIEW ${versionTableSchema.s}.${versionTableName.s}_latest AS
                select distinct on (nature, context, ${versionedItemColName.s}_path, ${versionedItemColName.s}, max(version)) version, created_at, nature, context, ${versionedItemColName.s}_path, ${versionedItemColName.s}
                from ${versionTableSchema.s}.${versionTableName.s}_store
                group by version, created_at, nature, context, ${versionedItemColName.s}_path, ${versionedItemColName.s}
                order by nature, context, ${versionedItemColName.s}_path, ${versionedItemColName.s}, max(version), created_at desc;

            create or replace function ${versionTableSchema.s}.version_upsert_${versionTableName.s}() returns trigger as $genBody$
            declare
                ${versionTableName.s}Id integer;
            begin
                -- TODO: if nature, context, {versionedItemColName} already exists in the table, get the most recent record
                -- and increment it
                insert into ${versionTableSchema.s}.${versionTableName.s}_store (nature, context, ${versionedItemColName.s}_path, ${versionedItemColName.s}, version, description, labels, ${versionedItemColName.s}_elaboration, meta_data) select
                    NEW.nature,
                    (CASE WHEN (NEW.context IS NULL) THEN '${defaultCtx.s}' ELSE NEW.context END),
                    (CASE WHEN (NEW.${versionedItemColName.s}_path IS NULL) THEN NEW.${versionedItemColName.s}::ltree ELSE NEW.${versionedItemColName.s}_path END),
                    (CASE WHEN (NEW.${versionedItemColName.s} IS NULL) THEN NEW.${versionedItemColName.s}_path::text ELSE NEW.${versionedItemColName.s} END),
                    NEW.version,
                    NEW.description,
                    NEW.labels,
                    NEW.${versionedItemColName.s}_elaboration,
                    NEW.meta_data
                    on conflict on constraint asset_version_unq_row do nothing
                    returning id into ${versionTableName.s}Id ;
                return NEW;
            end;
            $genBody$ language plpgsql;

            DO $versionUpsertBody$
            BEGIN
                create trigger version_upsert_${versionTableName.s}_trigger
                instead of insert on ${versionTableSchema.s}.${versionTableName.s}
                for each row execute function ${versionTableSchema.s}.version_upsert_${versionTableName.s}();
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE 'Trigger already exists. Ignoring...';
            END
            $versionUpsertBody$;

            CREATE OR REPLACE PROCEDURE ${lifecycleSchema.I}."version_${versionTableSchema.s}_${versionTableName.s}_destroy_all_objects"() AS $genBody$
            BEGIN
                EXECUTE('drop table if exists ${versionTableSchema.s}.${versionTableName.s} cascade');
            END;
            $genBody$ LANGUAGE PLPGSQL;`;
        },
      );
      SQL`
        ${lifecycleSchema.set()}
        ${ltreeSchema.set()}
        ${semverSchema.set()}
        -- TODO: {unitTestSchema.set}

        CREATE OR REPLACE FUNCTION ${lifecycleSchema.I}.version_sql(schemaName text, versionTableName text, versionedItemColName text, defaultCtx text, initVersion semver) RETURNS text AS $$
        BEGIN
            return ${fa.indentedText(fa.format(), "      ")};
        END;
        $$ LANGUAGE PLPGSQL;

        CREATE OR REPLACE PROCEDURE ${lifecycleSchema.I}.version_construct(schemaName text, versionTableName text, versionedItemColName text, defaultCtx text, initVersion semver) AS $$
        BEGIN
            -- TODO: register execution in DCP Lifecyle event table
            EXECUTE(version_sql(schemaName, versionTableName, versionedItemColName, defaultCtx, initVersion));
        END;
        $$ LANGUAGE PLPGSQL;`;
    },
  );
};

if (import.meta.main) {
  console.log(psql().body);
}
