#!/usr/bin/env -S deno run --allow-all

import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as typ from "../typical/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type EmitContext = SQLa.SqlEmitContext;

export const tcf = SQLa.tableColumnFactory<Any, Any, typ.TypicalDomainQS>();
export const gts = typ.governedTemplateState<
  typ.TypicalDomainQS,
  typ.TypicalDomainsQS,
  EmitContext
>();
export const gm = typ.governedModel<
  typ.TypicalDomainQS,
  typ.TypicalDomainsQS,
  EmitContext
>(
  gts.ddlOptions,
);
export const {
  text,
  textNullable,
  integer,
  date,
  dateNullable,
  dateTime,
  selfRef,
  dateTimeNullable,
} = gm.domains;
export const { textPrimaryKey: textPK, autoIncPrimaryKey: autoIncPK } = gm.keys;

export const lineageSourceType = gm.textPkTable(
  "lineage_source_type",
  {
    lineage_source_type_id: textPK(),
    lineage_source_type: text(),
    ...gm.housekeeping.columns,
  },
);

export const lineageDestinationType = gm.textPkTable(
  "lineage_destination_type",
  {
    lineage_destination_type_id: textPK(),
    lineage_destination_type: text(),
    ...gm.housekeeping.columns,
  },
);

export const lineageTransformType = gm.textPkTable(
  "lineage_transform_type",
  {
    lineage_transform_type_id: textPK(),
    lineage_transform_type: text(),
    ...gm.housekeeping.columns,
  },
);

// Typescript inference would work here but we're explicit about the array
// type to improve performance
export const allReferenceTables: SQLa.TableDefinition<
  Any,
  EmitContext,
  typ.TypicalDomainQS
>[] = [
  lineageSourceType,
  lineageDestinationType,
  lineageTransformType,
];

export const lineageSource = gm.autoIncPkTable("lineage_source", {
  lineage_source_id: autoIncPK(),
  lineage_source_type_id: lineageSourceType.references.lineage_source_type_id(),
  source_name: text(),
  description: text(),
  ...gm.housekeeping.columns,
}, {
  descr: "Entity representing sources of data transformations.",
});

export const lineageDestination = gm.autoIncPkTable("lineage_destination", {
  lineage_destination_id: autoIncPK(),
  lineage_dest_type_id: lineageDestinationType.references
    .lineage_destination_type_id(),
  dest_name: text(),
  description: text(),
  ...gm.housekeeping.columns,
}, {
  descr: "Entity representing destinations of data transformations.",
});

export const lineageTransform = gm.autoIncPkTable("lineage_transform", {
  lineage_transform_id: autoIncPK(),
  lineage_transform_type_id: lineageTransformType.references
    .lineage_transform_type_id(),
  transform_name: text(),
  description: text(),
  ...gm.housekeeping.columns,
}, {
  descr: "Entity representing transformations of data transformations.",
});

export const lineageGraphNode = gm.autoIncPkTable("lineage_graph_node", {
  lineage_graph_node_id: autoIncPK(),
  lineage_source_id: lineageSource.references.lineage_source_id(),
  lineage_dest_id: lineageDestination.references.lineage_destination_id(),
  lineage_transform_id: lineageTransform.references.lineage_transform_id(),
  graph_node_name: text(),
  description: text(),
  ...gm.housekeeping.columns,
}, {
  descr: "Entity representing a single node of the lineage graph.",
});

// Typescript inference would work here but we're explicit about the array
// type to improve performance
export const allContentTables: SQLa.TableDefinition<
  Any,
  EmitContext,
  typ.TypicalDomainQS
>[] = [
  lineageSource,
  lineageDestination,
  lineageTransform,
  lineageGraphNode,
];

// const vendorView = SQLa.safeViewDefinition(
//   "vender_view",
//   {
//     name: text(),
//     email: text(),
//     address: text(),
//     state: text(),
//     city: text(),
//     zip: text(),
//     country: text(),
//   },
// )`
//   SELECT pr.party_name as name,
//   e.electronics_details as email,
//   l.address_line1 as address,
//   l.address_state as state,
//   l.address_city as city,
//   l.address_zip as zip,
//   l.address_country as country
//   FROM party_relation prl
//   INNER JOIN party pr ON pr.party_id = prl.party_id
//   INNER JOIN contact_electronic e ON e.party_id = pr.party_id AND e.contact_type_id = 'OFFICIAL_EMAIL'
//   INNER JOIN contact_land l ON l.party_id = pr.party_id AND l.contact_type_id = 'OFFICIAL_ADDRESS'
//   WHERE prl.party_role_id = 'VENDOR' AND prl.relation_type_id = 'ORGANIZATION_TO_PERSON'`;

// export const allContentViews: SQLa.ViewDefinition<Any, EmitContext>[] = [
//   vendorView,
// ];

export function sqlDDL() {
  // NOTE: every time the template is "executed" it will fill out tables, views
  //       in gm.tablesDeclared, etc.
  // deno-fmt-ignore
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    PRAGMA foreign_keys = on; -- check foreign key reference, slightly worst performance

    -- reference tables
    ${allReferenceTables}

    -- content tables
    ${allContentTables}

    --content views
    -- {allContentViews}

    -- seed Data
    -- {allReferenceTables.map(e => e.seedDML).flat()}
    `;
}

if (import.meta.main) {
  const ctx = SQLa.typicalSqlEmitContext();
  typ.typicalCLI({
    resolve: (specifier) =>
      specifier ? import.meta.resolve(specifier) : import.meta.url,
    prepareSQL: () => ws.unindentWhitespace(sqlDDL().SQL(ctx)),
    prepareDiagram: () => {
      // "executing" the following will fill gm.tablesDeclared but we don't
      // care about the SQL output, just the state management (tablesDeclared)
      sqlDDL().SQL(ctx);
      return gts.pumlERD(ctx).content;
    },
  }).commands.command("driver", typ.sqliteDriverCommand(sqlDDL, ctx))
    .parse(Deno.args);
}
