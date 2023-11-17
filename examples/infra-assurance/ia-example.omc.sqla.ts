#!/usr/bin/env -S deno run --allow-all

import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import * as z from "https://deno.land/x/zod@v3.21.4/mod.ts";
import * as ulid from "https://deno.land/std@0.203.0/ulid/mod.ts";
import * as sqliteCLI from "../../lib/sqlite/cli.ts";
import * as iam from "../../pattern/infra-assurance/models.ts";
import * as udm from "../../pattern/udm/mod.ts";
import * as emit from "../../render/emit/mod.ts";
import * as typical from "../../pattern/typical/mod.ts";

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

const { SQLa, ws } = typical;

export const ddlOptions = SQLa.typicalSqlTextSupplierOptions();
export const ctx = SQLa.typicalSqlEmitContext();
export const SQL = SQLa.SQL<Context>(ddlOptions);
export type Context = typeof ctx;
type EmitContext = typeof ctx;
// const { typical: tp } = typical;

const gts = typical.governedTemplateState<
  typical.TypicalDomainQS,
  typical.TypicalDomainsQS,
  EmitContext
>();

type px = z.infer<typeof udm.person.zoSchema>;

// these are the "governed models" (`GM`) and can be used to build our types
type PersonGM = z.infer<typeof udm.person.zoSchema>;
type OrganizationGM = z.infer<typeof udm.organization.zoSchema>;
type ContactLandGM = z.infer<typeof udm.contactLand.zoSchema>;

type PartyRelationGM = z.infer<typeof udm.partyRelation.zoSchema>;
type OrganizationRoleGM = z.infer<typeof udm.organizationRole.zoSchema>;
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
  // & Partial<Pick<PersonGM, "person_type_id">>
  & {
    person_type_id?: emit.SqlTextSupplier<emit.SqlEmitContext>;
  }
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
  "organization_role_id"
>;

type OrganizationRole = OrganizationType & {
  person_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
  organization_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
  organization_role_type_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
  party_role_id?: emit.SqlTextSupplier<emit.SqlEmitContext>;
};
type PartyRelation = PartyRole & OrganizationRole & {
  party_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
  related_party_id: emit.SqlTextSupplier<emit.SqlEmitContext>;
};

const person = {
  insertDML: (person: Person) => {
    const partyDML = udm.party.insertDML({
      party_name: (`${person.person_first_name} ${person.person_last_name}`)
        .trim(),
      party_type_id: "PERSON",
    });
    const partyIdSS = udm.party.select(partyDML.insertable);
    const personTypeId = person.person_type_id
      ? person.person_type_id
      : "INDIVIDUAL";
    const personDML = udm.person.insertDML({
      party_id: udm.party.select(partyDML.insertable),
      person_first_name: person.person_first_name,
      person_last_name: person.person_last_name,
      person_type_id: udm.personType.select({
        code: personTypeId,
      }),
    });
    const personIdSS = udm.person.select(personDML.insertable);
    const contactElectronicDML = {
      email: udm.contactElectronic.insertDML({
        party_id: udm.party.select(partyDML.insertable),
        contact_type_id: udm.contactType.select({
          code: "OFFICIAL_EMAIL",
        }),
        electronics_details: person.email_address,
      }),
      phoneNumber: udm.contactElectronic.insertDML({
        party_id: udm.party.select(partyDML.insertable),
        contact_type_id: udm.contactType.select({
          code: "MOBILE_PHONE_NUMBER",
        }),
        electronics_details: person.phone_number,
      }),
      ALL: () =>
        SQL`
          ${contactElectronicDML.email}
          ${contactElectronicDML.phoneNumber}
          `,
    };
    const contactLandDML = udm.contactLand.insertDML({
      party_id: udm.party.select(partyDML.insertable),
      contact_type_id: udm.contactType.select({
        code: "OFFICIAL_ADDRESS",
      }),
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
    const partyDML = udm.party.insertDML({
      party_name: organization.name,
      party_type_id: "ORGANIZATION",
    });
    const partyIdSS = udm.party.select(partyDML.insertable);
    const organizationDML = udm.organization.insertDML({
      party_id: udm.party.select(partyDML.insertable),
      name: organization.name,
      license: organization.license ? organization.license : "",
      registration_date: organization.registration_date,
    });
    const organizationIdSS = udm.organization.select(
      {
        name: organization.name,
        license: organization.license ? organization.license : "",
      },
    );
    const contactElectronicDML = {
      email: udm.contactElectronic.insertDML({
        party_id: udm.party.select(partyDML.insertable),
        contact_type_id: udm.contactType.select({
          code: "OFFICIAL_EMAIL",
        }),
        electronics_details: organization.email_address,
      }),
      phoneNumber: udm.contactElectronic.insertDML({
        party_id: udm.party.select(partyDML.insertable),
        contact_type_id: udm.contactType.select({
          code: "LAND_PHONE_NUMBER",
        }),
        electronics_details: organization.phone_number,
      }),
      ALL: () =>
        SQL`
        ${contactElectronicDML.email}
        ${contactElectronicDML.phoneNumber}
        `,
    };
    const contactLandDML = udm.contactLand.insertDML({
      party_id: udm.party.select(partyDML.insertable),
      contact_type_id: udm.contactType.select({
        code: "OFFICIAL_ADDRESS",
      }),
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
  registration_date: new Date("2010-01-15T00:00:00.000Z"),
  email_address: "orgnization@email.com",
  phone_number: "0523 852 9945",
  ...organizationContact,
});

const personToOrganizationRelation = {
  insertDML: (
    partyRelation: PartyRelation,
  ) => {
    const partyRoleId = partyRelation.party_role_id
      ? partyRelation.party_role_id
      : "VENDOR";
    const partyRelationDML = udm.partyRelation.insertDML({
      party_id: partyRelation.party_id,
      related_party_id: partyRelation.related_party_id,
      relation_type_id: "ORGANIZATION_TO_PERSON",
      party_role_id: udm.partyRole.select({
        code: partyRoleId,
      }),
    });
    const oraganizationRoleDML = udm.organizationRole.insertDML({
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

const organizationRoleTypeCode = udm.organizationRoleType.select({
  code: "LEAD_SOFTWARE_ENGINEER",
});

const organizationToPerson = personToOrganizationRelation.insertDML({
  party_id: personDetails.partyIdSS,
  related_party_id: organizationDetails.partyIdSS,
  organization_role_type_id: organizationRoleTypeCode,
  person_id: personDetails.personIdSS,
  organization_id: organizationDetails.organizationIdSS,
});

const personDetailsSkill = {
  reactJS: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "REACTJS" }),
    proficiency_scale_id: "INTERMEDIATE",
  }),
  javaScript: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "JAVASCRIPT" }),
    proficiency_scale_id: "ADVANCED",
  }),
  hugo: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "HUGO" }),
    proficiency_scale_id: "FUNDAMENTAL_AWARENESS",
  }),
  deno: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "DENO" }),
    proficiency_scale_id: "INTERMEDIATE",
  }),
  angular: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "ANGULAR" }),
    proficiency_scale_id: "INTERMEDIATE",
  }),
  typeScript: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "TYPESCRIPT" }),
    proficiency_scale_id: "INTERMEDIATE",
  }),
  postgreSQL: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "POSTGRESQL" }),
    proficiency_scale_id: "INTERMEDIATE",
  }),
  mySQL: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "MYSQL" }),
    proficiency_scale_id: "INTERMEDIATE",
  }),
  php: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "PHP" }),
    proficiency_scale_id: "INTERMEDIATE",
  }),
  python: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "PYTHON" }),
    proficiency_scale_id: "FUNDAMENTAL_AWARENESS",
  }),
  dotNet: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "DOT_NET" }),
    proficiency_scale_id: "NA",
  }),
  oracle: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "ORACLE" }),
    proficiency_scale_id: "NA",
  }),
  java: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "JAVA" }),
    proficiency_scale_id: "FUNDAMENTAL_AWARENESS",
  }),
  jQuery: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "JQUERY" }),
    proficiency_scale_id: "ADVANCED",
  }),
  osQuery: iam.personSkill.insertDML({
    person_skill_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    skill_nature_id: iam.skillNature.select({ code: "SOFTWARE" }),
    skill_id: iam.skill.select({ code: "OSQUERY" }),
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
      awareness_training_id: ulid.ulid(),
      training_subject_id: iam.trainingSubject.select({ code: "HIPAA" }),
      person_id: personDetails.personIdSS,
      organization_id: organizationDetails.organizationIdSS,
      training_status_id: iam.statusValues.select({ code: "YES" }),
      attended_date: new Date("2022-02-21T00:00:00.000Z"),
    }),

  ALL: () =>
    SQL`
     ${awarenessTraining.personDetails}`,
};

const personSecurityIncidentResponse = iam.securityIncidentResponseTeam
  .insertDML({
    security_incident_response_team_id: ulid.ulid(),
    person_id: personDetails.personIdSS,
    organization_id: organizationDetails.organizationIdSS,
  });

const personRatingToOrganization = iam.rating.insertDML({
  rating_id: ulid.ulid(),
  author_id: personDetails.personIdSS,
  rating_given_to_id: organizationDetails.organizationIdSS,
  rating_value_id: iam.ratingValue.select({ code: "FOUR" }),
  best_rating_id: iam.ratingValue.select({ code: "FIVE" }),
  rating_explanation: "Good Service",
  review_aspect: "Satisfied",
  worst_rating_id: iam.ratingValue.select({ code: "THREE" }),
});

const personToOrganizationGeneralContract = iam.contract.insertDML({
  contract_id: ulid.ulid(),
  contract_from_id: personDetails.partyIdSS,
  contract_to_id: organizationDetails.partyIdSS,
  contract_status_id: iam.contractStatus.select({ code: "FINISHED" }),
  document_reference: "google.com",
  payment_type_id: iam.paymentType.select({ code: "RENTS" }),
  periodicity_id: iam.periodicity.select({ code: "WEEKLY" }),
  start_date: new Date("2021-04-20T00:00:00.000Z"),
  end_date: new Date("2021-04-20T00:00:00.000Z"),
  contract_type_id: iam.contractType.select({
    code: "GENERAL_CONTRACT_FOR_SERVICES",
  }),
  date_of_last_review: new Date("2021-04-20T00:00:00.000Z"),
  date_of_next_review: new Date("2021-04-20T00:00:00.000Z"),
  date_of_contract_review: new Date("2021-04-20T00:00:00.000Z"),
  date_of_contract_approval: new Date("2021-04-20T00:00:00.000Z"),
});

const personRiskRegister = iam.riskRegister.insertDML({
  risk_register_id: ulid.ulid(),
  description: "Risk description",
  risk_subject_id: iam.riskSubject.select({ code: "TECHNICAL_RISK" }),
  risk_type_id: iam.riskType.select({ code: "QUALITY" }),
  impact_to_the_organization: "Impact to the organization",
  rating_likelihood_id: iam.ratingValue.select({ code: "THREE" }),
  rating_impact_id: iam.ratingValue.select({ code: "THREE" }),
  rating_overall_risk_id: iam.ratingValue.select({ code: "THREE" }),
  controls_in_place: "Try forgot password",
  control_effectivenes: 1,
  mitigation_further_actions: "Mitigation further actions",
  control_monitor_mitigation_actions_tracking_strategy:
    "Control monitor mitigation actions tracking strategy",
  control_monitor_action_due_date: new Date("2022-06-13T00:00:00.000Z"),
  control_monitor_risk_owner_id: personDetails.personIdSS,
});

const assetDetail = iam.asset.insertDML({
  asset_id: ulid.ulid(),
  organization_id: organizationDetails.organizationIdSS,
  asset_retired_date: undefined,
  asset_status_id: iam.assetStatus.select({ code: "IN_USE" }),
  asset_tag: "",
  name: "Asset Name",
  description: "Service used for asset etc",
  asset_type_id: iam.assetType.select({ code: "VIRTUAL_MACHINE" }),
  asset_workload_category: "",
  assignment_id: iam.assignment.select({ code: "IN_USE" }),
  barcode_or_rfid_tag: "",
  installed_date: new Date("2021-04-20T00:00:00.000Z"),
  planned_retirement_date: undefined,
  purchase_delivery_date: new Date("2021-04-20T00:00:00.000Z"),
  purchase_order_date: new Date("2021-04-20T00:00:00.000Z"),
  purchase_request_date: new Date("2021-04-20T00:00:00.000Z"),
  serial_number: "",
  tco_amount: "100",
  tco_currency: "dollar",
});

const assetDetailAssetId = iam.asset.select(
  {
    name: "Asset Name",
    description: "Service used for asset etc",
    asset_type_id: iam.assetType.select({ code: "VIRTUAL_MACHINE" }),
  },
);

const serverDownIncident = iam.incident.insertDML({
  incident_id: ulid.ulid(),
  title: "Server Down - Due to CPU utilization reached 100%",
  incident_date: new Date("2021-04-20T00:00:00.000Z"),
  time_and_time_zone: new Date("2021-04-20T00:00:00.000Z"),
  asset_id: assetDetailAssetId,
  category_id: iam.incidentCategory.select({ code: "PERFORMANCE" }),
  sub_category_id: iam.incidentSubCategory.select({ code: "HARDWARE_FAILURE" }),
  severity_id: "MAJOR",
  priority_id: "HIGH",
  internal_or_external_id: iam.incidentType.select({
    code: "COMPLAINT",
  }),
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
  assigned_date: new Date("2021-04-20T00:00:00.000Z"),
  investigation_details:
    "Server was facing issue using due to insufficient harware specfication which cause high CPU utilization, resulting in Crashing of the application",
  containment_details:
    "Migrated few services to another server in that network range and Restarted server",
  eradication_details:
    "Migrated few services to another server in that network range",
  business_impact: "Application was completely down",
  lessons_learned:
    "We need to evlaute the hardware specification and remaining CPU/Memory resources before deploying new applications",
  status_id: iam.incidentStatus.select({ code: "CLOSED" }),
  closed_date: undefined,
  reopened_time: undefined,
  feedback_from_business: "",
  reported_to_regulatory: "",
  report_date: new Date("2021-04-20T00:00:00.000Z"),
  report_time: new Date("2021-04-20T00:00:00.000Z"),
});

const serverDownIncidentRootCause = iam.incidentRootCause.insertDML({
  incident_root_cause_id: ulid.ulid(),
  incident_id: iam.incident.select({
    title: "Server Down - Due to CPU utilization reached 100%",
    sub_category_id: iam.incidentSubCategory.select({
      code: "HARDWARE_FAILURE",
    }),
    severity_id: "MAJOR",
    priority_id: "HIGH",
    internal_or_external_id: iam.incidentType.select({
      code: "COMPLAINT",
    }),
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

export const sqlDDLValues = [
  organizationDetails.seedDDL,
  organizationAllPersons.ALL,
  organizationToPersonAllRelations.ALL,
  personDetailsSkill.ALL,
  awarenessTraining.ALL,
  personSecurityIncidentResponse,
  personRatingToOrganization,
  personToOrganizationGeneralContract,
  personRiskRegister,
  assetDetail,
  serverDownIncident,
  serverDownIncidentRootCause,
];

export function sqlDDL() {
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
    ${serverDownIncidentRootCause}`
}

if (import.meta.main) {
  const CLI = sqliteCLI.typicalCLI({
    resolveURI: (specifier) =>
      specifier ? import.meta.resolve(specifier) : import.meta.url,
    defaultSql: () => ws.unindentWhitespace(sqlDDL().SQL(ctx)),
  });

  await CLI.commands
    .command(
      "diagram",
      sqliteCLI.diagramCommand(CLI.clii, () => {
        return typical.diaPUML.plantUmlIE(ctx, function* () {
          for (const table of iam.allContentTables) {
            if (SQLa.isGraphEntityDefinitionSupplier(table)) {
              yield table.graphEntityDefn();
            }
          }
        }, typical.diaPUML.typicalPlantUmlIeOptions()).content;
      }),
    )
    .command(
      "test-fixtures",
      new typical.cli.Command()
        .description("Emit all test fixtures")
        .action(async () => {
          const CLI = relativeFilePath("./ia-example.omc.sqla.ts");
          const [sql, puml, sh] = [".sql", ".puml", ".sh"].map((extn) =>
            relativeFilePath(`./ia-example.omc.sqla.fixture${extn}`)
          );
          Deno.writeTextFileSync(sql, await $`./${CLI} sql`.text());
          Deno.writeTextFileSync(puml, await $`./${CLI} diagram`.text());
          Deno.writeTextFileSync(sh, await $`./${CLI} bash`.text());
          [sql, puml, sh].forEach((f) => console.log(f));
        }),
    ).parse(Deno.args);
}
