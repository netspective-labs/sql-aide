#!/usr/bin/env -S deno run --allow-all
// the #! (`shebang`) descriptor allows us to run this script as a binary on Linux

// IMPORTANT: when you use this outside of library use this type of import with pinned versions:
// import * as dvp from "https://raw.githubusercontent.com/netspective-labs/sql-aide/v0.0.10/pattern/data-vault/mod.ts";
import * as dvp from "../../pattern/data-vault/mod.ts";

// high-modules provide convenient access to internal imports
const { typical: typ, typical: { SQLa, ws } } = dvp;

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

typ.typicalCLI({
  resolve: (specifier) =>
    specifier ? import.meta.resolve(specifier) : import.meta.url,
  prepareSQL: (options) => ws.unindentWhitespace(sqlDDL(options).SQL(ctx)),
  prepareDiagram: () => {
    // "executing" the following will fill dvts.tablesDeclared but we don't
    // care about the SQL output, just the state management (tablesDeclared)
    sqlDDL().SQL(ctx);
    return dvts.pumlERD(ctx).content;
  },
}).commands.parse(Deno.args);
