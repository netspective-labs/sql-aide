#!/usr/bin/env -S deno run --allow-all

import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as typ from "../typical/mod.ts";
import * as govn from "./governance.ts";

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
  float,
  floatNullable,
  bigFloat,
  bigFloatNullable,
} = gm.domains;
export const { autoIncPrimaryKey: autoIncPK } = gm.keys;

export const execCtx = gm.textEnumTable(
  "execution_context",
  govn.ExecutionContext,
  { isIdempotent: true },
);

export const partyRole = gm.autoIncPkTable(
  "party_role",
  {
    party_role_id: autoIncPK(),
    code: tcf.unique(text()),
    value: text(),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Entity to store different types of party roles. Each role is identified by a unique code and has an associated value/description.",
    },
  },
);

export const partyIdentifierType = gm.autoIncPkTable(
  "party_identifier_type",
  {
    party_identifier_type_id: autoIncPK(),
    code: tcf.unique(text()),
    value: text(),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description: "Entity to store different types of party identifiers.",
    },
  },
);

export const contactType = gm.autoIncPkTable(
  "contact_type",
  {
    contact_type_id: autoIncPK(),
    code: tcf.unique(text()),
    value: text(),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Entity Table to store different types of contact information.",
    },
  },
);

export const organizationRoleType = gm.autoIncPkTable(
  "organization_role_type",
  {
    organization_role_type_id: autoIncPK(),
    code: tcf.unique(text()),
    value: text(),
    ...gm.housekeeping.columns,
  },
  {
    qualitySystem: {
      description:
        "Entity to store different types of organization roles. Each role is identified by a unique code and has an associated value/description.",
    },
  },
);

export const partyRoleType = gm.autoIncPkTable(
  "party_role_type",
  {
    party_role_type_id: autoIncPK(),
    code: tcf.unique(text()),
    value: text(),
    ...gm.housekeeping.columns,
  },
);

export const personType = gm.autoIncPkTable(
  "person_type",
  {
    person_type_id: autoIncPK(),
    code: tcf.unique(text()),
    value: text(),
    ...gm.housekeeping.columns,
  },
);

export const partyType = gm.textEnumTable(
  "party_type",
  govn.PartyType,
  { isIdempotent: true },
);

export const partyRelationType = gm.textEnumTable(
  "party_relation_type",
  govn.PartyRelationType,
  { isIdempotent: true },
);

// Typescript inference would work here but we're explicit about the array
// type to improve performance
export const allReferenceTables: (
  & SQLa.TableDefinition<Any, EmitContext, typ.TypicalDomainQS>
  & typ.EnumTableDefn<EmitContext>
)[] = [
  execCtx,
  partyType,
  partyRelationType,
];

export const party = gm.autoIncPkTable("party", {
  party_id: autoIncPK(),
  party_type_id: partyType.references.code(),
  party_name: text(),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description:
      "Entity representing parties involved in business transactions.",
  },
});

/**
 * Reference URL: https://help.salesforce.com/s/articleView?id=sf.c360_a_partyidentification_object.htm&type=5
 */

export const partyIdentifier = gm.autoIncPkTable("party_identifier", {
  party_identifier_id: autoIncPK(),
  identifier_number: text(),
  party_identifier_type_id: partyIdentifierType.references
    .party_identifier_type_id(),
  party_id: party.references.party_id(),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description:
      "Entity to associate identifiers with parties. Each party identifier has a unique ID and is associated with a specific party and identifier type.",
  },
});

/**
 * Reference URL: https://schema.org/honorificPrefix
 * Reference URL: https://schema.org/honorificSuffix
 */

export const person = gm.autoIncPkTable("person", {
  person_id: autoIncPK(),
  party_id: party.references.party_id(),
  person_type_id: personType.references.person_type_id(),
  person_first_name: text(),
  person_last_name: text(),
  honorific_prefix: textNullable(),
  honorific_suffix: textNullable(),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description:
      "Entity to store information about individuals as persons. Each person has a unique ID associated with them.",
  },
});

/**
 * Reference URL: https://docs.oracle.com/cd/E29633_01/CDMRF/GUID-F52E49F4-AE6F-4FF5-8EEB-8366A66AF7E9.htm
 */

export const partyRelation = gm.autoIncPkTable("party_relation", {
  party_relation_id: autoIncPK(),
  party_id: party.references.party_id(),
  related_party_id: party.references.party_id(),
  relation_type_id: partyRelationType.references.code(),
  party_role_id: partyRole.references.party_role_id().optional(),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description:
      "Entity to define relationships between parties. Each party relation has a unique ID associated with it.",
  },
});

export const organization = gm.autoIncPkTable("organization", {
  organization_id: autoIncPK(),
  party_id: party.references.party_id(),
  name: text(),
  license: text(),
  registration_date: date(),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description:
      "Entity to store information about organizations. Each organization has a unique ID associated with it.",
  },
});

export const organizationRole = gm.autoIncPkTable("organization_role", {
  organization_role_id: autoIncPK(),
  person_id: person.references.person_id(),
  organization_id: organization.references.organization_id(),
  organization_role_type_id: organizationRoleType.references
    .organization_role_type_id(),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description:
      "Entity to associate individuals with roles in organizations. Each organization role has a unique ID associated with it.",
  },
});

export const contactElectronic = gm.autoIncPkTable("contact_electronic", {
  contact_electronic_id: autoIncPK(),
  contact_type_id: contactType.references.contact_type_id(),
  party_id: party.references.party_id(),
  electronics_details: text(),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description:
      "Entity to store electronic contact information associated with parties. Each electronic contact has a unique ID associated with it.",
  },
});

export const contactLand = gm.autoIncPkTable("contact_land", {
  contact_land_id: autoIncPK(),
  contact_type_id: contactType.references.contact_type_id(),
  party_id: party.references.party_id(),
  address_line1: text(),
  address_line2: text(),
  address_zip: text(),
  address_city: text(),
  address_state: text(),
  address_country: text(),
  ...gm.housekeeping.columns,
}, {
  qualitySystem: {
    description:
      "Entity to store land-based contact information associated with parties. Each land contact has a unique ID associated with it.",
  },
});

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

// Typescript inference would work here but we're explicit about the array
// type to improve performance
export const allContentTables: SQLa.TableDefinition<
  Any,
  EmitContext,
  typ.TypicalDomainQS
>[] = [
  organizationRoleType,
  partyRole,
  partyIdentifierType,
  contactType,
  party,
  partyIdentifier,
  person,
  partyRelation,
  organization,
  organizationRole,
  contactElectronic,
  contactLand,
  personType,
];

export const vendorView = SQLa.safeViewDefinition(
  "vendor_view",
  {
    name: text(),
    email: text(),
    address: text(),
    state: text(),
    city: text(),
    zip: text(),
    country: text(),
  },
)`
  SELECT pr.party_name as name,
  e.electronics_details as email,
  l.address_line1 as address,
  l.address_state as state,
  l.address_city as city,
  l.address_zip as zip,
  l.address_country as country
  FROM party_relation prl
  INNER JOIN party pr ON pr.party_id = prl.party_id
  INNER JOIN contact_electronic e ON e.party_id = pr.party_id AND e.contact_type_id = (SELECT contact_type_id FROM contact_type WHERE code='OFFICIAL_EMAIL')
  INNER JOIN contact_land l ON l.party_id = pr.party_id AND l.contact_type_id = (SELECT contact_type_id FROM contact_type WHERE code='OFFICIAL_ADDRESS')
  WHERE prl.party_role_id = 'VENDOR' AND prl.relation_type_id = 'ORGANIZATION_TO_PERSON'`;

export const allContentViews: SQLa.ViewDefinition<Any, EmitContext>[] = [
  vendorView,
];

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
    ${allContentViews}

    -- seed Data
    ${allReferenceTables.map(e => e.seedDML).flat()}
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
