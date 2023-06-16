#!/usr/bin/env -S deno run --allow-all

import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as dvp from "../../pattern/data-vault/data-vault.ts";
import * as sqlsp from "../../render/dialect/pg/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const ctx = SQLa.typicalSqlEmitContext({
  sqlDialect: SQLa.postgreSqlDialect(),
});

type EmitContext = typeof ctx;

const dvts = dvp.dataVaultTemplateState<EmitContext>();
const { text, date } = dvts.domains;
const { ulidPrimaryKey: primaryKey } = dvts.keys;

const nfDvSchema = SQLa.sqlSchemaDefn(
  "stateful_service_nf_rdv_miniflux",
  {
    isIdempotent: true,
  },
);

const dvContentHub = dvts.hubTable("content", {
  hub_content_id: primaryKey(),
  ...dvts.housekeeping.columns,
});

const dvClassificationHub = dvts.hubTable("classification", {
  hub_classification_id: primaryKey(),
  ...dvts.housekeeping.columns,
});

const tblAlgorithmMetaTable = SQLa.tableDefinition("algorithm", {
  algorithm_name: text(),
  algorithm_id: primaryKey(),
});

const dvJobHub = dvts.hubTable("job", {
  hub_job_id: primaryKey(),
  hub_job_name: text(),
  ...dvts.housekeeping.columns,
});

const dvContentHubSat = dvContentHub.satelliteTable("content_attribute", {
  hub_content_id: dvContentHub.references.hub_content_id(),
  content: text(),
  content_type: text(),
  ...dvts.housekeeping.columns,
  sat_content_content_attribute_id: primaryKey(),
});

const dvClassificationHubSat = dvClassificationHub.satelliteTable(
  "classification_attribute",
  {
    hub_classification_id: dvClassificationHub.references
      .hub_classification_id(),
    classification: text(),
    ...dvts.housekeeping.columns,
    sat_classification_classification_attribute_id: primaryKey(),
  },
);

const dvJobHubSat = dvJobHub.satelliteTable("job_detail", {
  run_date_time: date(),
  status: text(),
  ...dvts.housekeeping.columns,
  hub_job_id: dvJobHub.references.hub_job_id(),
  sat_job_job_detail_id: primaryKey(),
});

const dvContentClassificationLink = dvts.linkTable("classified_content", {
  hub_content_id: dvContentHub.references.hub_content_id(),
  hub_classification_id: dvClassificationHub.references.hub_classification_id(),
  ...dvts.housekeeping.columns,
  link_classified_content_id: primaryKey(),
});

const dvContentClassificationJobLink = dvts.linkTable(
  "classified_content_job",
  {
    hub_content_id: dvContentHub.references.hub_content_id(),
    hub_classification_id: dvClassificationHub.references
      .hub_classification_id(),
    hub_job_id: dvJobHub.references.hub_job_id(),
    algorithm: tblAlgorithmMetaTable.references.algorithm_id(),
    link_classified_content_job_id: primaryKey(),
    ...dvts.housekeeping.columns,
  },
);

const dvContentClassificationLinkSat = dvContentClassificationLink
  .satelliteTable("classified_content_algorithm", {
    algorithm: tblAlgorithmMetaTable.references.algorithm_id(),
    scores: text(),
    ...dvts.housekeeping.columns,
    link_classified_content_id: dvContentClassificationLink.references
      .link_classified_content_id(),
    sat_classified_content_classified_content_algorithm_id: primaryKey(),
  });

const dvGeneralContentClassificationLinkSat = dvContentClassificationLink
  .satelliteTable("classified_general_topics", {
    algorithm: tblAlgorithmMetaTable.references.algorithm_id(),
    ...dvts.housekeeping.columns,
    link_classified_content_id: dvContentClassificationLink.references
      .link_classified_content_id(),
    sat_classified_content_classified_general_topics_id: primaryKey(),
  });

// create view - complete results  langchain predictions
const dvResultsView = SQLa.viewDefinition("results_view_all_topics", {
  embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
  isIdempotent: false,
  before: (viewName) => SQLa.dropView(viewName),
})`SELECT sc.content,
    sc.content_type,
    a.algorithm_id,
    string_agg(scc_classification.classification, ', '::text) AS classification
   FROM ${nfDvSchema.sqlNamespace}.link_classified_content l
     JOIN ${nfDvSchema.sqlNamespace}.hub_content hc ON l.hub_content_id = hc.hub_content_id
     JOIN ${nfDvSchema.sqlNamespace}.hub_classification hcl ON l.hub_classification_id = hcl.hub_classification_id
     JOIN ${nfDvSchema.sqlNamespace}.sat_classified_content_classified_content_algorithm sacca ON l.link_classified_content_id = sacca.link_classified_content_id
     JOIN ${nfDvSchema.sqlNamespace}.sat_content_content_attribute sc ON hc.hub_content_id = sc.hub_content_id
     JOIN ${nfDvSchema.sqlNamespace}.sat_classification_classification_attribute scc ON hcl.hub_classification_id = scc.hub_classification_id
     JOIN ${nfDvSchema.sqlNamespace}.algorithm a ON sacca.algorithm = a.algorithm_id
     JOIN LATERAL ( SELECT json_array_elements_text(scc.classification::json) AS classification) scc_classification ON true
  GROUP BY sc.content, sc.content_type, a.algorithm_id;`;

// create view - complete results general topics
const dvResultsViewGeneral = SQLa.viewDefinition(
  "results_view_general_topics",
  {
    embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
    isIdempotent: false,
    before: (viewName) => SQLa.dropView(viewName),
  },
)`SELECT sc.content,
    a.algorithm_id,
    string_agg(scc_classification.classification, ', '::text) AS classification
   FROM ${nfDvSchema.sqlNamespace}.link_classified_content l
     JOIN ${nfDvSchema.sqlNamespace}.hub_content hc ON l.hub_content_id = hc.hub_content_id
     JOIN ${nfDvSchema.sqlNamespace}.hub_classification hcl ON l.hub_classification_id = hcl.hub_classification_id
     JOIN ${nfDvSchema.sqlNamespace}.sat_classified_content_classified_general_topics sccg ON l.link_classified_content_id = sccg.link_classified_content_id
     JOIN ${nfDvSchema.sqlNamespace}.sat_content_content_attribute sc ON hc.hub_content_id = sc.hub_content_id
     JOIN ${nfDvSchema.sqlNamespace}.sat_classification_classification_attribute scc ON hcl.hub_classification_id = scc.hub_classification_id
     JOIN ${nfDvSchema.sqlNamespace}.algorithm a ON sccg.algorithm = a.algorithm_id
     JOIN LATERAL ( SELECT json_array_elements_text(scc.classification::json) AS classification) scc_classification ON true
  GROUP BY sc.content, sc.content_type, a.algorithm_id;`;

//create stored procedure to add algorithm
const srbAlgorithm = sqlsp.storedRoutineBuilder("upsert_algorithm", {
  algorithm_id: z.string(),
  algorithm_name: z.string(),
});
const { argsSD: { sdSchema: spa }, argsIndex: spi } = srbAlgorithm;
const spAlgorithmUpsert = sqlsp.storedProcedure(
  srbAlgorithm.routineName,
  srbAlgorithm.argsDefn,
  (name, args, _) => sqlsp.typedPlPgSqlBody(name, args, ctx),
  {
    embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
    autoBeginEnd: false,
    isIdempotent: false,
  },
)`BEGIN
  UPDATE ${nfDvSchema.sqlNamespace}.algorithm SET ${spa.algorithm_id} = ${spi.algorithm_id},${spa.algorithm_name} = ${spi.algorithm_name} WHERE ${tblAlgorithmMetaTable.tableName}.${spa.algorithm_id} = ${spi.algorithm_id};
  IF NOT FOUND THEN
      INSERT INTO ${nfDvSchema.sqlNamespace}.algorithm (${spa.algorithm_id},${spa.algorithm_name}) VALUES (${spi.algorithm_id},${spi.algorithm_name});
  END IF;
END;`;

//create stored function to load the all topics prediction results to dv
const srbPredictionResultUpsert = sqlsp.storedRoutineBuilder(
  "sf-load_output",
  {},
);
const returns = "void";
const sfLangChainResultUpsert = sqlsp.storedFunction(
  "sf_all_predictions_result_upsert",
  srbPredictionResultUpsert.argsDefn,
  returns,
  (name, args, _, bo) => sqlsp.typedPlPgSqlBody(name, args, ctx, bo),
  {
    embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
    autoBeginEnd: false,
    isIdempotent: false,
  },
)`
BEGIN
CREATE TEMPORARY TABLE temp_table as
SELECT feed_title AS content, related_topic_with_title AS classification, model_name as model_name ,prediction_score_title as scores,
md5(feed_title::text || model_name::text)::text as hub_content_id,md5(feed_title::text || model_name::text)::text as sat_content_content_attribute_id,md5(feed_title::text || model_name::text)::text as hub_classification_id,md5(feed_title::text || model_name::text)::text as sat_classification_classification_attribute_id,md5(feed_title::text || model_name::text)::text as link_classified_content_id,md5(feed_title::text || model_name::text)::text as sat_classified_content_classified_content_algorithm_id,
'feed_title' as content_type FROM ${nfDvSchema.sqlNamespace}.langchain_predictions
UNION all SELECT  feed_content AS content, related_topic_with_content AS classification,model_name as model_name,prediction_score_content as scores,
md5(feed_content::text || model_name::text)::text as hub_content_id,md5(feed_content::text || model_name::text)::text as sat_content_content_attribute_id,md5(feed_content::text || model_name::text)::text as hub_classification_id,md5(feed_content::text || model_name::text)::text as sat_classification_classification_attribute_id,md5(feed_content::text || model_name::text)::text as link_classified_content_id,md5(feed_content::text || model_name::text)::text as sat_classified_content_classified_content_algorithm_id,'feed_content' as content_type
FROM ${nfDvSchema.sqlNamespace}.langchain_predictions
UNION ALL SELECT feed_title_and_content AS content, related_topic_with_title_and_content AS classification, model_name as model_name,prediction_score_title_content as scores,
md5(feed_title_and_content::text || model_name::text)::text as hub_content_id,md5(feed_title_and_content::text || model_name::text)::text as sat_content_content_attribute_id,md5(feed_title_and_content::text || model_name::text)::text as hub_classification_id,md5(feed_title_and_content::text || model_name::text)::text as sat_classification_classification_attribute_id,md5(feed_title_and_content::text || model_name::text)::text as link_classified_content_id,md5(feed_title_and_content::text || model_name::text)::text as sat_classified_content_classified_content_algorithm_id,'feed_title_and_content' as content_type
FROM ${nfDvSchema.sqlNamespace}.langchain_predictions;

INSERT INTO ${nfDvSchema.sqlNamespace}.hub_content (hub_content_id, created_at, created_by, provenance)
select hub_content_id, current_timestamp, current_user,'test_source' from temp_table
ON CONFLICT (hub_content_id) DO update set created_at = EXCLUDED.created_at, created_by = EXCLUDED.created_by, provenance = EXCLUDED.provenance;

INSERT INTO ${nfDvSchema.sqlNamespace}.sat_content_content_attribute (hub_content_id, sat_content_content_attribute_id, content, content_type, created_at, created_by, provenance)
select hub_content_id,sat_content_content_attribute_id,content,content_type,current_timestamp,current_user,'test_source' from temp_table
ON CONFLICT (sat_content_content_attribute_id) DO update set sat_content_content_attribute_id = EXCLUDED.sat_content_content_attribute_id,content = EXCLUDED.content,content_type = EXCLUDED.content_type,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

INSERT INTO ${nfDvSchema.sqlNamespace}.hub_classification (hub_classification_id, created_at, created_by, provenance)
select hub_classification_id,current_timestamp,current_user,'test_source' from temp_table
ON CONFLICT (hub_classification_id) DO update set created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

INSERT INTO ${nfDvSchema.sqlNamespace}.sat_classification_classification_attribute (hub_classification_id, sat_classification_classification_attribute_id, classification, created_at, created_by, provenance)
select hub_classification_id,sat_classification_classification_attribute_id,classification,current_timestamp,current_user,'test_source' from temp_table
ON CONFLICT (sat_classification_classification_attribute_id) DO update set classification = EXCLUDED.classification,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

INSERT INTO ${nfDvSchema.sqlNamespace}.link_classified_content (link_classified_content_id, hub_content_id, hub_classification_id, created_at, created_by, provenance)
select link_classified_content_id,hub_content_id,hub_classification_id,current_timestamp,current_user,'test_source' from temp_table
ON CONFLICT (link_classified_content_id) DO update set hub_content_id = EXCLUDED.hub_content_id,hub_classification_id = EXCLUDED.hub_classification_id,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

INSERT INTO ${nfDvSchema.sqlNamespace}.sat_classified_content_classified_content_algorithm (sat_classified_content_classified_content_algorithm_id, link_classified_content_id, algorithm, scores, created_at, created_by, provenance)
select sat_classified_content_classified_content_algorithm_id,link_classified_content_id,model_name,scores,current_timestamp,current_user,'test_source'from temp_table
ON CONFLICT (sat_classified_content_classified_content_algorithm_id) DO update set algorithm = EXCLUDED.algorithm,scores = EXCLUDED.scores,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

DROP TABLE IF EXISTS temp_table;
END;`;

//create stored function to load the general-prediction results to dv
const srbGnPrediction = sqlsp.storedRoutineBuilder(
  "sf-load_output_general",
  {},
);
//const { argsSD: { sdSchema: spp }, argsIndex: sppi } = srbPredictionResultUpsert;
const greturns = "void";
const sfGeneralResultUpsert = sqlsp.storedFunction(
  "sf_general_predictions_result_upsert",
  srbGnPrediction.argsDefn,
  greturns,
  (name, args, _, bo) => sqlsp.typedPlPgSqlBody(name, args, ctx, bo),
  {
    embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
    autoBeginEnd: false,
    isIdempotent: false,
  },
)`
 BEGIN
 CREATE TEMPORARY TABLE temp_table as
 SELECT feed_title AS content, related_topic_with_title AS classification, model_name as model_name ,
  md5(feed_title::text || model_name::text)::text as hub_content_id,
  md5(feed_title::text || model_name::text)::text as sat_content_content_attribute_id,
  md5(feed_title::text || model_name::text)::text as hub_classification_id,
  md5(feed_title::text || model_name::text)::text as sat_classification_classification_attribute_id,
  md5(feed_title::text || model_name::text)::text as link_classified_content_id,
  md5(feed_title::text || model_name::text)::text as sat_classified_content_classified_general_topics_id,  'feed_title' as content_type
 FROM ${nfDvSchema.sqlNamespace}.general_predictions;


INSERT INTO ${nfDvSchema.sqlNamespace}.hub_content (hub_content_id, created_at, created_by, provenance)
select hub_content_id, current_timestamp, current_user,'general' from temp_table
ON CONFLICT (hub_content_id) DO update set created_at = EXCLUDED.created_at, created_by = EXCLUDED.created_by, provenance = EXCLUDED.provenance;


INSERT INTO ${nfDvSchema.sqlNamespace}.sat_content_content_attribute (hub_content_id, sat_content_content_attribute_id, content, content_type, created_at, created_by, provenance)
select hub_content_id,sat_content_content_attribute_id,content,content_type,current_timestamp,current_user,'general' from temp_table
ON CONFLICT (sat_content_content_attribute_id) DO update set sat_content_content_attribute_id = EXCLUDED.sat_content_content_attribute_id,content = EXCLUDED.content,content_type = EXCLUDED.content_type,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;


INSERT INTO ${nfDvSchema.sqlNamespace}.hub_classification (hub_classification_id, created_at, created_by, provenance)
select hub_classification_id,current_timestamp,current_user,'general' from temp_table
ON CONFLICT (hub_classification_id) DO update set created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;

INSERT INTO ${nfDvSchema.sqlNamespace}.sat_classification_classification_attribute (hub_classification_id, sat_classification_classification_attribute_id, classification, created_at, created_by, provenance)
select hub_classification_id,sat_classification_classification_attribute_id,classification,current_timestamp,current_user,'general' from temp_table
ON CONFLICT (sat_classification_classification_attribute_id) DO update set classification = EXCLUDED.classification,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;


INSERT INTO ${nfDvSchema.sqlNamespace}.link_classified_content (link_classified_content_id, hub_content_id, hub_classification_id, created_at, created_by, provenance)
select link_classified_content_id,hub_content_id,hub_classification_id,current_timestamp,current_user,'general' from temp_table
ON CONFLICT (link_classified_content_id) DO update set hub_content_id = EXCLUDED.hub_content_id,hub_classification_id = EXCLUDED.hub_classification_id,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;


INSERT INTO ${nfDvSchema.sqlNamespace}.sat_classified_content_classified_general_topics (sat_classified_content_classified_general_topics_id, link_classified_content_id, algorithm,created_at, created_by, provenance)
select sat_classified_content_classified_general_topics_id,link_classified_content_id,model_name,current_timestamp,current_user,'general' from temp_table
ON CONFLICT (sat_classified_content_classified_general_topics_id) DO update set algorithm = EXCLUDED.algorithm,created_at = EXCLUDED.created_at,created_by = EXCLUDED.created_by,provenance = EXCLUDED.provenance;
 DROP TABLE IF EXISTS temp_table;
END;`;

function sqlDDL(options: {
  destroyFirst?: boolean;
  schemaName?: string;
} = {}) {
  const { destroyFirst, schemaName } = options;

  // NOTE: every time the template is "executed" it will fill out tables, views
  //       in dvts.tablesDeclared, etc.
  // deno-fmt-ignore
  return SQLa.SQL<EmitContext>(dvts.ddlOptions)`
    ${
      destroyFirst && schemaName
        ? `drop schema if exists ${schemaName} cascade;`
        : "-- not destroying first (for development)"
    }

    ${ schemaName
       ? `create schema if not exists ${schemaName};`
       : "-- no schemaName provided" }
        SET search_path TO ${nfDvSchema.sqlNamespace};
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

        ${tblAlgorithmMetaTable}
        ${dvContentHub}
        ${dvClassificationHub}
        ${dvJobHub}
        ${dvContentHubSat}
        ${dvClassificationHubSat}
        ${dvJobHubSat}
        ${dvContentClassificationLink}
        ${dvContentClassificationJobLink}
        ${dvContentClassificationLinkSat}
        ${dvGeneralContentClassificationLinkSat}
        ${dvResultsView}
        ${dvResultsViewGeneral}
        ${spAlgorithmUpsert}
        ${sfLangChainResultUpsert}
        ${sfGeneralResultUpsert}
        `;
}

function handleSqlCmd(options: {
  dest?: string | undefined;
  destroyFirst?: boolean;
  schemaName?: string;
} = {}) {
  const output = ws.unindentWhitespace(sqlDDL(options).SQL(ctx));
  if (options.dest) {
    Deno.writeTextFileSync(options.dest, output);
  } else {
    console.log(output);
  }
}

// deno-fmt-ignore (so that command indents don't get reformatted)
await new cli.Command()
  .name("cc-dv-sqla")
  .version("0.0.1")
  .description("Content Classification Data Vault SQL Aide")
  .action(() => handleSqlCmd())
  .command("help", new cli.HelpCommand().global())
  .command("completions", new cli.CompletionsCommand())
  .command("sql", "Emit SQL")
    .option("-d, --dest <file:string>", "Output destination, STDOUT if not supplied")
    .option("--destroy-first", "Include SQL to destroy existing objects first (dangerous but useful for development)")
    .option("--schema-name <schemaName:string>", "If destroying or creating a schema, this is the name of the schema")
    .action((options) => handleSqlCmd(options))
  .command("diagram", "Emit Diagram")
    .option("-d, --dest <file:string>", "Output destination, STDOUT if not supplied")
    .action((options) => {
      // "executing" the following will fill dvts.tablesDeclared but we don't
      // care about the SQL output, just the state management (tablesDeclared)
      sqlDDL().SQL(ctx);
      const pumlERD = dvts.pumlERD(ctx).content;
      if(options.dest) {
        Deno.writeTextFileSync(options.dest, pumlERD)
      } else {
        console.log(pumlERD)
      }
    })
    .parse(Deno.args);
