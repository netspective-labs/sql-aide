#!/usr/bin/env -S deno run --allow-all

import * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as dvp from "../../pattern/data-vault/data-vault.ts";
import * as sqlsp from "../../render/dialect/pg/mod.ts";
import * as tp from "../../pattern/typical/mod.ts";
import * as mod from "../../render/dialect/pg/primary-key.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const ctx = SQLa.typicalSqlEmitContext({
  sqlDialect: SQLa.postgreSqlDialect(),
});

type EmitContext = typeof ctx;

const dvts = dvp.dataVaultTemplateState<EmitContext>();
const gts = tp.governedTemplateState<
  tp.TypicalDomainQS,
  tp.TypicalDomainsQS,
  EmitContext
>();
const gm = tp.governedModel<
  tp.TypicalDomainQS,
  tp.TypicalDomainsQS,
  EmitContext
>(gts.ddlOptions);
const { textNullable, jsonTextNullable, text } = gm.domains;
const pkcf = mod.primaryKeyColumnFactory();

const nfDvSchema = SQLa.sqlSchemaDefn(
  "openai_general_prediction",
  {
    isIdempotent: true,
  },
);

const keySettings = SQLa.tableDefinition("settings", {
  general_predictions_id: pkcf.serialPrimaryKey(),
  openai_api_key: text(),
  name: text(),
});

const generalPrediction = gm.autoIncPkTable("general_predictions", {
  general_predictions_id: pkcf.serialPrimaryKey(),
  feed_title: textNullable(),
  model_name: textNullable(),
  related_topic_with_title: jsonTextNullable(),
  ...gm.housekeeping.columns,
}, {
  constraints: (props, tableName) => {
    const c = SQLa.tableConstraints(tableName, props);
    return [
      c.unique("feed_title", "model_name"),
    ];
  },
});
// stored function to create openai completions for the general feed titles
const srbPredictionResultUpsert = sqlsp.storedRoutineBuilder(
  "sf-gen_pred",
  {},
);
const returns = "void";
const sfGeneralPredictions = sqlsp.storedFunction(
  "sf_gen_predictions_result",
  srbPredictionResultUpsert.argsDefn,
  returns,
  (name, args, _, bo) => sqlsp.typedPlPgSqlBody(name, args, ctx, bo),
  {
    embeddedStsOptions: SQLa.typicalSqlTextSupplierOptions(),
    autoBeginEnd: false,
    isIdempotent: false,
  },
)`
 DECLARE
  OPENAI_API_KEY text;
  feed_row record;
  response json;
  feed_title_without_html text;
 BEGIN
  SELECT ${nfDvSchema.sqlNamespace}.settings.openai_api_key::text INTO OPENAI_API_KEY
  FROM ${nfDvSchema.sqlNamespace}.settings
  WHERE name = 'default';

  FOR feed_row IN (select title from fdw_stateful_service_miniflux.entries ORDER BY created_at DESC LIMIT 20 OFFSET 650) LOOP
    SELECT regexp_replace(feed_row.title, '<[^>]+>', '', 'g') INTO feed_title_without_html;
    SELECT json_agg(trim(choice)) into response
    FROM http (('POST',
      'https://api.openai.com/v1/engines/text-davinci-003/completions',
      ARRAY[http_header ('Authorization',
      'Bearer ' ||  OPENAI_API_KEY )],
      'application/json',
      jsonb_build_object('prompt','Please provide a list of related topics for the following content in descending order of relevance. No need for newlines. Separate the topics with commas.' || feed_title_without_html,
          'temperature',0.8,
          'max_tokens', 1000
          )::text
      )) CROSS JOIN LATERAL unnest(string_to_array(SUBSTRING((content::json->'choices'->0->>'text') FROM 2), ',')) AS choice;
    INSERT INTO ${nfDvSchema.sqlNamespace}.general_predictions(feed_title, model_name, related_topic_with_title, created_at, created_by) VALUES(feed_title_without_html, 'OpenAI', response, CURRENT_TIMESTAMP, CURRENT_USER) ON CONFLICT (feed_title,model_name) DO NOTHING;
  END LOOP;
  UPDATE ${nfDvSchema.sqlNamespace}.general_predictions SET related_topic_with_title = replace(replace(related_topic_with_title::json::text, '\\n', ''), ':', '')::json;
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
          CREATE EXTENSION IF NOT EXISTS http;
          LOAD 'http';
          ${keySettings}
          ${generalPrediction}
          ${sfGeneralPredictions}
          SELECT ${nfDvSchema.sqlNamespace}.sf_gen_predictions_result();`;
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
    .description("Openai General Topics Prediction")
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
