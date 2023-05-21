#!/usr/bin/env -S deno run --allow-all
// the #! (`shebang`) descriptor allows us to run this script as a binary on Linux

import * as cli from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import * as ws from "https://raw.githubusercontent.com/netspective-labs/sql-aide/v0.0.9/lib/universal/whitespace.ts";
import * as SQLa from "https://raw.githubusercontent.com/netspective-labs/sql-aide/v0.0.9/render/mod.ts";
import * as dvp from "https://raw.githubusercontent.com/netspective-labs/sql-aide/v0.0.9/pattern/data-vault.ts";

const ctx = SQLa.typicalSqlEmitContext();
type EmitContext = typeof ctx;

const dvts = dvp.dataVaultTemplateState<EmitContext>();
const { text, integer, date } = dvts.domains;
const { ulidPrimaryKey: primaryKey } = dvts.keys;

const erEntityHub = dvts.hubTable("er_entity", {
  hub_er_entity_id: primaryKey(),
  ssn_business_key: text(),
  ...dvts.housekeeping.columns,
});

const erAlgorithmLookupTable = SQLa.tableDefinition("er_algorithm", {
  algorithm_id: primaryKey(),
  algorithm_name: text(),
  algorithm_version: text(),
  algorithm_sp: text(),
});

const erJobHub = dvts.hubTable("er_job", {
  hub_er_job_id: primaryKey(),
  job_business_job_name: text(),
  ...dvts.housekeeping.columns,
});

const erEntityHubSat = erEntityHub.satelliteTable("er_entity_attribute", {
  sat_er_entity_er_entity_attribute_id: primaryKey(),
  hub_er_entity_id: erEntityHub.references.hub_er_entity_id(),
  name: text(),
  address: text(),
  phone: text(),
  ...dvts.housekeeping.columns,
});

const erJobHubSat = erJobHub.satelliteTable("er_job_state", {
  sat_er_job_er_job_state_id: primaryKey(),
  hub_er_job_id: erJobHub.references.hub_er_job_id(),
  algorithm_id: integer(),
  run_date_time: date(),
  status: text(),
  ...dvts.housekeeping.columns,
});

const erEntityMatchLink = dvts.linkTable("er_entity_match", {
  link_er_entity_match_id: primaryKey(),
  hub_entity_id: erEntityHubSat.references
    .sat_er_entity_er_entity_attribute_id(),
  algorithm_ref: erAlgorithmLookupTable.references.algorithm_id(),
  ...dvts.housekeeping.columns,
});

const erEntityMatchLevenshteinLinkSat = erEntityMatchLink.satelliteTable(
  "er_entity_match_levenshtien",
  {
    sat_er_entity_match_er_entity_match_levenshtien_id: primaryKey(),
    link_er_entity_match_id: erEntityMatchLink.references
      .link_er_entity_match_id(),
    distance_value: integer(),
    similarity_score: integer(),
    normalized_distance: integer(),
    notes: text(),
    ...dvts.housekeeping.columns,
  },
);

const erEntityMatchSoundexLinkSat = erEntityMatchLink.satelliteTable(
  "er_entity_match_soundex",
  {
    sat_er_entity_match_er_entity_match_soundex_id: primaryKey(),
    link_er_entity_match_id: erEntityMatchLink.references
      .link_er_entity_match_id(),
    code: text(),
    similarity_score: integer(),
    index: integer(),
    ...dvts.housekeeping.columns,
  },
);

function sqlDDL(
  options: {
    destroyFirst?: boolean;
    schemaName?: string;
  } = {},
) {
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
    ${
      schemaName
        ? `create schema if not exists ${schemaName};`
        : "-- no schemaName provided"
    }

    ${erAlgorithmLookupTable}

    ${erEntityHub}

    ${erJobHub}

    ${erJobHubSat}

    ${erEntityMatchLink}

    ${erEntityMatchLevenshteinLinkSat}

    ${erEntityMatchSoundexLinkSat}`;
}

function handleSqlCmd(
  options: {
    dest?: string | undefined;
    destroyFirst?: boolean;
    schemaName?: string;
  } = {},
) {
  const output = ws.unindentWhitespace(sqlDDL(options).SQL(ctx));
  if (options.dest) {
    Deno.writeTextFileSync(options.dest, output);
  } else {
    console.log(output);
  }
}

// deno-fmt-ignore (so that command indents don't get reformatted)
await new cli.Command()
  .name("er-dv-sqla")
  .version("0.0.1")
  .description("Entity Resolution Data Vault SQL Aide")
  .action(() => handleSqlCmd())
  .command("help", new cli.HelpCommand().global())
  .command("completions", new cli.CompletionsCommand())
  .command("sql", "Emit SQL")
  .option(
    "-d, --dest <file:string>",
    "Output destination, STDOUT if not supplied",
  )
  .option(
    "--destroy-first",
    "Include SQL to destroy existing objects first (dangerous but useful for development)",
  )
  .option(
    "--schema-name <schemaName:string>",
    "If destroying or creating a schema, this is the name of the schema",
  )
  .action((options) => handleSqlCmd(options))
  .command("diagram", "Emit Diagram")
  .option(
    "-d, --dest <file:string>",
    "Output destination, STDOUT if not supplied",
  )
  .action((options) => {
    // "executing" the following will fill dvts.tablesDeclared but we don't
    // care about the SQL output, just the state management (tablesDeclared)
    sqlDDL().SQL(ctx);
    const pumlERD = dvts.pumlERD(ctx).content;
    if (options.dest) {
      Deno.writeTextFileSync(options.dest, pumlERD);
    } else {
      console.log(pumlERD);
    }
  })
  .parse(Deno.args);
