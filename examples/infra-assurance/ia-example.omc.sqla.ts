#!/usr/bin/env -S deno run --allow-all

import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import * as iam from "../../pattern/infra-assurance/mod.ts";
import * as z from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as emit from "../../render/emit/mod.ts";

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

const { SQLa, ws } = iam.typical;

export const ddlOptions = SQLa.typicalSqlTextSupplierOptions();
export const ctx = SQLa.typicalSqlEmitContext();
export const SQL = SQLa.SQL<Context>(ddlOptions);
export type Context = typeof ctx;
type EmitContext = typeof ctx;
const { typical: tp } = iam;

const gts = tp.governedTemplateState<iam.typical.GovernedDomain, EmitContext>();

type px = z.infer<typeof iam.person.zoSchema>;

// these are the "governed models" (`GM`) and can be used to build our types
type PersonGM = z.infer<typeof iam.person.zoSchema>;
type OrganizationGM = z.infer<typeof iam.organization.zoSchema>;
type ContactLandGM = z.infer<typeof iam.contactLand.zoSchema>;

type PartyRelationGM = z.infer<typeof iam.partyRelation.zoSchema>;
type OrganizationRoleGM = z.infer<typeof iam.organizationRole.zoSchema>;
type SecurityImpactAnalysisGM = z.infer<
  typeof iam.securityImpactAnalysis.zoSchema
>;
type ImpactOfRiskGM = z.infer<typeof iam.impactOfRisk.zoSchema>;
type ProposedControlsGM = z.infer<typeof iam.proposedControls.zoSchema>;
type AssetGM = z.infer<typeof iam.asset.zoSchema>;
type ThreatEventGM = z.infer<typeof iam.threatEvent.zoSchema>;
type VulnerabilityGM = z.infer<typeof iam.vulnerability.zoSchema>;
type AssetRiskGM = z.infer<typeof iam.assetRisk.zoSchema>;
export type Person =
  & Pick<
    PersonGM,
    "person_first_name" | "person_last_name"
  >
  & Partial<Pick<PersonGM, "person_type_id">>
  & Pick<
    ContactLandGM,
    | "address_line1"
    | "address_line2"
    | "address_city"
    | "address_state"
    | "address_country"
    | "address_zip"
  >
  & {
    email_address: string;
    phone_number: string;
  };

export type Organization =
  & Pick<OrganizationGM, "name" | "registration_date">
  & Partial<Pick<OrganizationGM, "license">>
  & Pick<
    ContactLandGM,
    | "address_line1"
    | "address_line2"
    | "address_city"
    | "address_state"
    | "address_country"
    | "address_zip"
  >
  & {
    email_address: string;
    phone_number: string;
  };

export type ContactLand = Pick<
  ContactLandGM,
  | "address_line1"
  | "address_line2"
  | "address_city"
  | "address_state"
  | "address_country"
  | "address_zip"
>;

export type SecurityImpactAnalysis =
  & Pick<
    SecurityImpactAnalysisGM,
    | "risk_level_id"
    | "impact_level_id"
    | "existing_controls"
    | "priority_id"
    | "reported_date"
  >
  & Pick<ImpactOfRiskGM, "impact">
  & Pick<ProposedControlsGM, "controls">
  & {
    vulnerability_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
    asset_risk_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
    reported_by_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
    responsible_by_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
  };

export type SecurityImpact =
  & Pick<
    SecurityImpactAnalysisGM,
    | "risk_level_id"
    | "impact_level_id"
    | "existing_controls"
    | "priority_id"
    | "reported_date"
  >
  & Pick<ImpactOfRiskGM, "impact">
  & Pick<ProposedControlsGM, "controls">
  & Pick<
    VulnerabilityGM,
    | "affected_software"
    | "reference"
    | "status_id"
    | "patch_availability"
    | "severity_id"
    | "solutions"
  >
  & Pick<
    AssetGM,
    | "asset_retired_date"
    | "asset_status_id"
    | "asset_tag"
    | "asset_type_id"
    | "asset_workload_category"
    | "assignment_id"
    | "barcode_or_rfid_tag"
    | "installed_date"
    | "planned_retirement_date"
    | "purchase_delivery_date"
    | "purchase_order_date"
    | "purchase_request_date"
    | "serial_number"
    | "tco_amount"
    | "tco_currency"
  >
  & Pick<
    ThreatEventGM,
    | "threat_event_type_id"
    | "event_classification"
    | "source_of_information"
  >
  & Pick<
    AssetRiskGM,
    | "asset_risk_type_id"
    | "relevance_id"
    | "likelihood_id"
    | "impact"
  >
  & {
    asset_name: string;
    asset_description: string;
    vulnerability_name: string;
    vulnerability_description: string;
    threat_event_title: string;
    threat_event_description: string;
    threat_event_identifier: string;
    vulnerability_source_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
    reported_by_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
    responsible_by_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
    organization_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
    threat_source_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
  };

type PartyRole = Pick<PartyRelationGM, "party_role_id">;
type OrganizationType = Pick<
  OrganizationRoleGM,
  "organization_role_type_id"
>;

type OrganizationRole = OrganizationType & {
  person_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
  organization_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
};
type PartyRelation = PartyRole & OrganizationRole & {
  party_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
  related_party_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
};

const person = {
  insertDML: (person: Person) => {
    const partyDML = iam.party.insertDML({
      party_name: (`${person.person_first_name} ${person.person_last_name}`)
        .trim(),
      party_type_id: "PERSON",
    });
    const partyIdSS = iam.party.select(partyDML.insertable);
    const personDML = iam.person.insertDML({
      party_id: iam.party.select(partyDML.insertable),
      person_first_name: person.person_first_name,
      person_last_name: person.person_last_name,
      person_type_id: person.person_type_id
        ? person.person_type_id
        : "INDIVIDUAL",
    });
    const personIdSS = iam.person.select(personDML.insertable);
    const contactElectronicDML = {
      email: iam.contactElectronic.insertDML({
        party_id: iam.party.select(partyDML.insertable),
        contact_type_id: "OFFICIAL_EMAIL",
        electronics_details: person.email_address,
      }),
      phoneNumber: iam.contactElectronic.insertDML({
        party_id: iam.party.select(partyDML.insertable),
        contact_type_id: "MOBILE_PHONE_NUMBER",
        electronics_details: person.phone_number,
      }),
      ALL: () =>
        SQL`
          ${contactElectronicDML.email}
          ${contactElectronicDML.phoneNumber}
          `,
    };
    const contactLandDML = iam.contactLand.insertDML({
      party_id: iam.party.select(partyDML.insertable),
      contact_type_id: "OFFICIAL_ADDRESS",
      address_line1: person.address_line1,
      address_line2: person.address_line2 ? person.address_line2 : "",
      address_city: person.address_city,
      address_state: person.address_state,
      address_country: person.address_country,
      address_zip: person.address_zip ? person.address_zip : "",
    });
    return {
      partyDML,
      partyIdSS,
      personDML,
      personIdSS,
      contactElectronicDML,
      contactLandDML,
      seedDDL: SQL`
        ${partyDML}
        ${personDML}
        ${contactElectronicDML.ALL}
        ${contactLandDML}`,
    };
  },
};

const organizationContact: ContactLand = {
  address_line1: "Address line 1",
  address_line2: "Address line 2",
  address_city: "City",
  address_state: "State",
  address_country: "Country",
  address_zip: "",
};

const personDetails = person.insertDML({
  person_first_name: "First Name",
  person_last_name: "Last Name",
  email_address: "person@org.com",
  phone_number: "+911234567890",
  ...organizationContact,
});

const organizationAllPersons = {
  ALL: () =>
    SQL`
      ${personDetails.seedDDL}
      `,
};

const organization = {
  insertDML: (organization: Organization) => {
    const partyDML = iam.party.insertDML({
      party_name: organization.name,
      party_type_id: "ORGANIZATION",
    });
    const partyIdSS = iam.party.select(partyDML.insertable);
    const organizationDML = iam.organization.insertDML({
      party_id: iam.party.select(partyDML.insertable),
      name: organization.name,
      license: organization.license ? organization.license : "",
      registration_date: organization.registration_date,
    });
    const organizationIdSS = iam.organization.select(
      {
        name: organization.name,
        license: organization.license ? organization.license : "",
      },
    );
    const contactElectronicDML = {
      email: iam.contactElectronic.insertDML({
        party_id: iam.party.select(partyDML.insertable),
        contact_type_id: "OFFICIAL_EMAIL",
        electronics_details: organization.email_address,
      }),
      phoneNumber: iam.contactElectronic.insertDML({
        party_id: iam.party.select(partyDML.insertable),
        contact_type_id: "LAND_PHONE_NUMBER",
        electronics_details: organization.phone_number,
      }),
      ALL: () =>
        SQL`
        ${contactElectronicDML.email}
        ${contactElectronicDML.phoneNumber}
        `,
    };
    const contactLandDML = iam.contactLand.insertDML({
      party_id: iam.party.select(partyDML.insertable),
      contact_type_id: "OFFICIAL_ADDRESS",
      address_line1: organization.address_line1,
      address_line2: organization.address_line2
        ? organization.address_line2
        : "",
      address_city: organization.address_city,
      address_state: organization.address_state,
      address_country: organization.address_country,
      address_zip: organization.address_zip ? organization.address_zip : "",
    });
    return {
      partyDML,
      partyIdSS,
      organizationDML,
      organizationIdSS,
      contactElectronicDML,
      contactLandDML,
      seedDDL: SQL`
        ${partyDML}
        ${organizationDML}
        ${contactElectronicDML.ALL}
        ${contactLandDML}`,
    };
  },
};

const organizationDetails = organization.insertDML({
  name: "Orgnization Name",
  license: "XXXX-XXXXX-XXXX",
  registration_date: new Date("2010-01-15"),
  email_address: "orgnization@email.com",
  phone_number: "0523 852 9945",
  ...organizationContact,
});

const personToOrganizationRelation = {
  insertDML: (
    partyRelation: PartyRelation,
  ) => {
    const partyRelationDML = iam.partyRelation.insertDML({
      party_id: partyRelation.party_id,
      related_party_id: partyRelation.related_party_id,
      relation_type_id: "ORGANIZATION_TO_PERSON",
      party_role_id: partyRelation.party_role_id
        ? partyRelation.party_role_id
        : "VENDOR",
    });
    const oraganizationRoleDML = iam.organizationRole.insertDML({
      person_id: partyRelation.person_id,
      organization_id: partyRelation.organization_id,
      organization_role_type_id: partyRelation.organization_role_type_id,
    });
    return {
      partyRelationDML,
      oraganizationRoleDML,
      seedDDL: SQL`
        ${partyRelationDML}
        ${oraganizationRoleDML}`,
    };
  },
};

const organizationToPerson = personToOrganizationRelation.insertDML({
  party_id: personDetails.partyIdSS,
  related_party_id: organizationDetails.partyIdSS,
  organization_role_type_id: "LEAD_SOFTWARE_ENGINEER",
  person_id: personDetails.personIdSS,
  organization_id: organizationDetails.organizationIdSS,
});

const personDetailsSkill = {
  reactJS: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "REACTJS",
    proficiency_scale_id: "INTERMEDIATE",
  }),
  javaScript: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "JAVASCRIPT",
    proficiency_scale_id: "ADVANCED",
  }),
  hugo: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "HUGO",
    proficiency_scale_id: "FUNDAMENTAL_AWARENESS",
  }),
  deno: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "DENO",
    proficiency_scale_id: "INTERMEDIATE",
  }),
  angular: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "ANGULAR",
    proficiency_scale_id: "INTERMEDIATE",
  }),
  typeScript: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "TYPESCRIPT",
    proficiency_scale_id: "INTERMEDIATE",
  }),
  postgreSQL: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "POSTGRESQL",
    proficiency_scale_id: "INTERMEDIATE",
  }),
  mySQL: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "MYSQL",
    proficiency_scale_id: "INTERMEDIATE",
  }),
  php: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "PHP",
    proficiency_scale_id: "INTERMEDIATE",
  }),
  python: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "PYTHON",
    proficiency_scale_id: "FUNDAMENTAL_AWARENESS",
  }),
  dotNet: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "DOT_NET",
    proficiency_scale_id: "NA",
  }),
  oracle: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "ORACLE",
    proficiency_scale_id: "NA",
  }),
  java: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "JAVA",
    proficiency_scale_id: "FUNDAMENTAL_AWARENESS",
  }),
  jQuery: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "JQUERY",
    proficiency_scale_id: "ADVANCED",
  }),
  osQuery: iam.personSkill.insertDML({
    person_id: personDetails.personIdSS,
    skill_nature_id: "SOFTWARE",
    skill_id: "OSQUERY",
    proficiency_scale_id: "FUNDAMENTAL_AWARENESS",
  }),
  ALL: () =>
    SQL`
    ${personDetailsSkill.reactJS}
    ${personDetailsSkill.javaScript}
    ${personDetailsSkill.hugo}
    ${personDetailsSkill.deno}
    ${personDetailsSkill.angular}
    ${personDetailsSkill.typeScript}
    ${personDetailsSkill.postgreSQL}
    ${personDetailsSkill.mySQL}
    ${personDetailsSkill.php}
    ${personDetailsSkill.python}
    ${personDetailsSkill.dotNet}
    ${personDetailsSkill.oracle}
    ${personDetailsSkill.java}
    ${personDetailsSkill.jQuery}
    ${personDetailsSkill.osQuery}`,
};

const organizationToPersonAllRelations = {
  ALL: () =>
    SQL`
      ${organizationToPerson.seedDDL}`,
};

const awarenessTraining = {
  personDetails: iam.awarenessTraining
    .insertDML({
      training_subject_id: "HIPAA",
      person_id: personDetails.personIdSS,
      organization_id: organizationDetails.organizationIdSS,
      training_status_id: "YES",
      attended_date: new Date("02/22/2022"),
    }),

  ALL: () =>
    SQL`
     ${awarenessTraining.personDetails}`,
};

const personSecurityIncidentResponse = iam.securityIncidentResponseTeam
  .insertDML({
    person_id: personDetails.personIdSS,
    organization_id: organizationDetails.organizationIdSS,
  });

const personRatingToOrganization = iam.rating.insertDML({
  author_id: personDetails.personIdSS,
  rating_given_to_id: organizationDetails.organizationIdSS,
  rating_value_id: "FOUR",
  best_rating_id: "FIVE",
  rating_explanation: "Good Service",
  review_aspect: "Satisfied",
  worst_rating_id: "THREE",
});

const personToOrganizationGeneralContract = iam.contract.insertDML({
  contract_from_id: personDetails.partyIdSS,
  contract_to_id: organizationDetails.partyIdSS,
  contract_status_id: "FINISHED",
  document_reference: "google.com",
  payment_type_id: "RENTS",
  periodicity_id: "WEEKLY",
  start_date: new Date("04/20/2021 00:00 AM"),
  end_date: new Date("04/20/2021 00:00 AM"),
  contract_type_id: "GENERAL_CONTRACT_FOR_SERVICES",
  date_of_last_review: new Date("04/20/2021 00:00 AM"),
  date_of_next_review: new Date("04/20/2021 00:00 AM"),
  date_of_contract_review: new Date("04/20/2021 00:00 AM"),
  date_of_contract_approval: new Date("04/20/2021 00:00 AM"),
});

const personRiskRegister = iam.riskRegister.insertDML({
  description: "Risk description",
  risk_subject_id: "TECHNICAL_RISK",
  risk_type_id: "QUALITY",
  impact_to_the_organization: "Impact to the organization",
  rating_likelihood_id: "THREE",
  rating_impact_id: "THREE",
  rating_overall_risk_id: "THREE",
  controls_in_place: "Try forgot password",
  control_effectivenes: 1,
  mitigation_further_actions: "Mitigation further actions",
  control_monitor_mitigation_actions_tracking_strategy:
    "Control monitor mitigation actions tracking strategy",
  control_monitor_action_due_date: new Date("06/14/2022 00:00 AM"),
  control_monitor_risk_owner_id: personDetails.personIdSS,
});

const assetDetail = iam.asset.insertDML({
  organization_id: organizationDetails.organizationIdSS,
  asset_retired_date: undefined,
  asset_status_id: "IN_USE",
  asset_tag: "",
  name: "Asset Name",
  description: "Service used for asset etc",
  asset_type_id: "VIRTUAL_MACHINE",
  asset_workload_category: "",
  assignment_id: "IN_USE",
  barcode_or_rfid_tag: "",
  installed_date: new Date("04/20/2021 00:00 AM"),
  planned_retirement_date: undefined,
  purchase_delivery_date: new Date("04/20/2021 00:00 AM"),
  purchase_order_date: new Date("04/20/2021 00:00 AM"),
  purchase_request_date: new Date("04/20/2021 00:00 AM"),
  serial_number: "",
  tco_amount: "100",
  tco_currency: "dollar",
});

const assetDetailAssetId = iam.asset.select(
  {
    name: "Asset Name",
    description: "Service used for asset etc",
    asset_type_id: "VIRTUAL_MACHINE",
  },
);

const serverDownIncident = iam.incident.insertDML({
  title: "Server Down - Due to CPU utilization reached 100%",
  incident_date: new Date("04/20/2021 00:00 AM"),
  time_and_time_zone: new Date("04/20/2021 00:00 AM"),
  asset_id: assetDetailAssetId,
  category_id: "PERFORMANCE",
  sub_category_id: "HARDWARE_FAILURE",
  severity_id: "MAJOR",
  priority_id: "HIGH",
  internal_or_external_id: "COMPLAINT",
  location: "USA",
  it_service_impacted: "Application down",
  impacted_modules: "",
  impacted_dept: "All",
  reported_by_id: personDetails.personIdSS,
  reported_to_id: personDetails.personIdSS,
  brief_description: "Server will down due to CPU utilization",
  detailed_description:
    "We got an alert message of server due to CPU utilization reaching 100% on 02-07-2022 07:30 GTM",
  assigned_to_id: personDetails.personIdSS,
  assigned_date: new Date("04/20/2021 00:00 AM"),
  investigation_details:
    "Server was facing issue using due to insufficient harware specfication which cause high CPU utilization, resulting in Crashing of the application",
  containment_details:
    "Migrated few services to another server in that network range and Restarted server",
  eradication_details:
    "Migrated few services to another server in that network range",
  business_impact: "Application was completely down",
  lessons_learned:
    "We need to evlaute the hardware specification and remaining CPU/Memory resources before deploying new applications",
  status_id: "CLOSED",
  closed_date: undefined,
  reopened_time: undefined,
  feedback_from_business: "",
  reported_to_regulatory: "",
  report_date: new Date("04/20/2021 00:00 AM"),
  report_time: new Date("04/20/2021 00:00 AM"),
});

const serverDownIncidentRootCause = iam.incidentRootCause.insertDML({
  incident_id: iam.incident.select({
    title: "Server Down - Due to CPU utilization reached 100%",
    sub_category_id: "HARDWARE_FAILURE",
    severity_id: "MAJOR",
    priority_id: "HIGH",
    internal_or_external_id: "COMPLAINT",
    location: "USA",
  }),
  source: "Server",
  description: "Sample description",
  probability_id: "HIGH",
  testing_analysis: "Sample testing analysis",
  solution: "Server restarted",
  likelihood_of_risk_id: "HIGH",
  modification_of_the_reported_issue: "No modifications",
  testing_for_modified_issue: "Sample test case",
  test_results: "Sample test result",
});

function sqlDDL() {
  // deno-fmt-ignore
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    ${iam.sqlDDL()}
    ${organizationDetails.seedDDL}
    ${organizationAllPersons.ALL}
    ${organizationToPersonAllRelations.ALL}
    ${personDetailsSkill.ALL}
    ${awarenessTraining.ALL}
    ${personSecurityIncidentResponse}
    ${personRatingToOrganization}
    ${personToOrganizationGeneralContract}
    ${personRiskRegister}
    ${assetDetail}
    ${serverDownIncident}
    ${serverDownIncidentRootCause}
  `
}

if (import.meta.main) {
  await tp.typicalCLI({
    resolve: (specifier) =>
      specifier ? import.meta.resolve(specifier) : import.meta.url,
    prepareSQL: () => ws.unindentWhitespace(sqlDDL().SQL(ctx)),
    prepareDiagram: () => {
      return tp.diaPUML.plantUmlIE(ctx, function* () {
        for (const table of iam.allContentTables) {
          if (SQLa.isGraphEntityDefinitionSupplier(table)) {
            yield table.graphEntityDefn();
          }
        }
      }, tp.diaPUML.typicalPlantUmlIeOptions()).content;
    },
  }).commands.command("driver", tp.sqliteDriverCommand(sqlDDL, ctx)).command(
    "test-fixtures",
    new tp.cli.Command()
      .description("Emit all test fixtures")
      .action(async () => {
        const CLI = relativeFilePath("./ia-example.omc.sqla.ts");
        const [sql, puml, sh] = [".sql", ".puml", ".sh"].map((extn) =>
          relativeFilePath(`./ia-example.omc.sqla.fixture${extn}`)
        );
        Deno.writeTextFileSync(sql, await $`./${CLI} sql`.text());
        Deno.writeTextFileSync(puml, await $`./${CLI} diagram`.text());
        Deno.writeTextFileSync(sh, await $`./${CLI} driver`.text());
        [sql, puml, sh].forEach((f) => console.log(f));
      }),
  ).parse(Deno.args);
}
