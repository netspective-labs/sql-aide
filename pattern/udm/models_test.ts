#!/usr/bin/env -S deno run --allow-all

import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as sqliteCLI from "../../lib/sqlite/cli.ts";
import * as SQLa from "../../render/mod.ts";
import * as tp from "../typical/mod.ts";
import * as mod from "./models.ts";

let syntheticUlidValue = 0;

function syntheticUlid() {
  syntheticUlidValue++;
  return syntheticUlidValue.toString();
}

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

const relativeFileContent = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return Deno.readTextFileSync($.path.relative(Deno.cwd(), absPath));
};

type EmitContext = typeof ctx;
const ctx = SQLa.typicalSqlEmitContext();
const gts = tp.governedTemplateState<
  tp.TypicalDomainQS,
  tp.TypicalDomainsQS,
  EmitContext
>();

const partyTypeInsertion = mod.partyType
  .insertDML({
    party_type_id: syntheticUlid(),
    code: "PERSON",
    value: "person",
  });

const partyTypeID = mod.partyType.select({ code: "PERSON" });

const partyRelationTypeInsertion = mod.partyRelationType
  .insertDML({
    party_relation_type_id: syntheticUlid(),
    code: "PERSON_TO_PERSON",
    value: "personToPerson",
  });

const partyRelationTypeID = mod.partyRelationType.select({
  code: "PERSON_TO_PERSON",
});

const partyInsertion = mod.party
  .insertDML({
    party_id: syntheticUlid(),
    party_type_id: partyTypeID,
    party_name: "person name",
  });

const partyID = mod.party.select({ party_name: "person name" });

const partyIdentifierType = mod.partyIdentifierType
  .insertDML([{
    party_identifier_type_id: syntheticUlid(),
    code: "PASSPORT",
    value: "Passport",
  }, {
    party_identifier_type_id: syntheticUlid(),
    code: "UUID",
    value: "UUID",
  }, {
    party_identifier_type_id: syntheticUlid(),
    code: "DRIVING_LICENSE",
    value: "Driving License",
  }]);

const partyIdentifierTypeID = mod.partyIdentifierType.select({
  code: "PASSPORT",
});

const partyIdentifierInsertion = mod.partyIdentifier
  .insertDML({
    party_identifier_id: syntheticUlid(),
    identifier_name: "test name",
    identifier_value: "test value",
    party_identifier_type_id: partyIdentifierTypeID,
    party_id: partyID,
  });

const genderTypeInsertion = mod.genderType
  .insertDML([{
    gender_type_id: syntheticUlid(),
    code: "MALE",
    value: "Male",
  }, {
    gender_type_id: syntheticUlid(),
    code: "FEMALE",
    value: "Female",
  }]);

const genderTypeID = mod.genderType.select({
  code: "MALE",
});

const sexTypeInsertion = mod.sexType
  .insertDML([{
    sex_type_id: syntheticUlid(),
    code: "MALE",
    value: "Male",
  }, {
    sex_type_id: syntheticUlid(),
    code: "FEMALE",
    value: "Female",
  }]);

const sexTypeID = mod.sexType.select({
  code: "MALE",
});

const personTypeInsertion = mod.personType
  .insertDML([{
    person_type_id: syntheticUlid(),
    code: "INDIVIDUAL",
    value: "Individual",
  }, {
    person_type_id: syntheticUlid(),
    code: "PROFESSIONAL",
    value: "Professional",
  }]);

const personTypeID = mod.personType.select({
  code: "PROFESSIONAL",
});
const personInsertion = mod.person
  .insertDML({
    person_id: syntheticUlid(),
    party_id: partyID,
    person_type_id: personTypeID,
    person_first_name: "Test First Name",
    person_last_name: "Test Last Name",
    gender_id: genderTypeID,
    sex_id: sexTypeID,
  });

const partyRole = mod.partyRole
  .insertDML([{
    party_role_id: syntheticUlid(),
    code: "VENDOR",
    value: "Vendor",
  }, {
    party_role_id: syntheticUlid(),
    code: "CUSTOMER",
    value: "Customer",
  }]);

const partyRoleID = mod.partyRole.select({ code: "VENDOR" });

const partyRelationInsertion = mod.partyRelation
  .insertDML({
    party_relation_id: syntheticUlid(),
    party_id: partyID,
    related_party_id: partyID,
    relation_type_id: partyRelationTypeID,
    party_role_id: partyRoleID,
  });

const organizationInsertion = mod.organization
  .insertDML({
    organization_id: syntheticUlid(),
    party_id: partyID,
    name: "Test Name",
    license: "Test License",
    registration_date: new Date("2023-02-06T00:00:00.000Z"),
  });

const personID = mod.person.select({
  person_first_name: "Test First Name",
  person_last_name: "Test Last Name",
});
const organizationID = mod.organization.select({ name: "Test Name" });

const organizationRoleTypeInsertion = mod.organizationRoleType
  .insertDML({
    organization_role_type_id: syntheticUlid(),
    code: "ASSOCIATE_MANAGER_TECHNOLOGY",
    value: "Associate Manager Technology",
  });

const organizationRoleTypeCode = mod.organizationRoleType.select({
  code: "ASSOCIATE_MANAGER_TECHNOLOGY",
});

const organizationRoleInsertion = mod.organizationRole
  .insertDML({
    organization_role_id: syntheticUlid(),
    person_id: personID,
    organization_id: organizationID,
    organization_role_type_id: organizationRoleTypeCode,
  });

const contactType = mod.contactType
  .insertDML([{
    contact_type_id: syntheticUlid(),
    code: "HOME_ADDRESS",
    value: "Home Address",
  }, {
    contact_type_id: syntheticUlid(),
    code: "OFFICIAL_ADDRESS",
    value: "Official Address",
  }, {
    contact_type_id: syntheticUlid(),
    code: "MOBILE_PHONE_NUMBER",
    value: "Mobile Phone Number",
  }, {
    contact_type_id: syntheticUlid(),
    code: "LAND_PHONE_NUMBER",
    value: "Land Phone Number",
  }, {
    contact_type_id: syntheticUlid(),
    code: "OFFICIAL_EMAIL",
    value: "Official Email",
  }, {
    contact_type_id: syntheticUlid(),
    code: "PERSONAL_EMAIL",
    value: "Personal Email",
  }]);

const contactTypeID = mod.contactType.select({ code: "MOBILE_PHONE_NUMBER" });

const contactElectronicInsertion = mod.contactElectronic
  .insertDML({
    contact_electronic_id: syntheticUlid(),
    contact_type_id: contactTypeID,
    party_id: partyID,
    electronics_details: "electronics details",
  });

const contactElectronicInsertionID = mod.contactElectronic.select({
  contact_electronic_id: "27",
});

const contactElectronicAssuranceInsertion = mod.contactElectronicAssurance
  .insertDML({
    contact_electronic_assurance_id: syntheticUlid(),
    contact_electronic_id: contactElectronicInsertionID,
    from_state: "INACTIVE",
    to_state: "ACTIVE",
    transition_reason: "Party became active",
    transition_result: "",
  });

const partyState = mod.partyState.insertDML({
  party_id: partyID,
  party_state_id: syntheticUlid(),
  from_state: "INACTIVE",
  to_state: "ACTIVE",
  transition_reason: "Party became active",
  transition_result: "",
});

function sqlDDL() {
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    ${mod.sqlDDL()}

    -- synthetic / test data

    ${partyRole}
    ${partyTypeInsertion}
    ${partyInsertion}
    ${genderTypeInsertion}
    ${sexTypeInsertion}
    ${personTypeInsertion}
    ${partyRelationTypeInsertion}
    ${partyIdentifierType}

    ${partyIdentifierInsertion}

    ${personInsertion}

    ${partyRelationInsertion}

    ${organizationInsertion}

    ${organizationRoleTypeInsertion}

    ${organizationRoleInsertion}

    ${contactType}
    ${contactElectronicInsertion}
    ${contactElectronicAssuranceInsertion}
    ${partyState}
    `;
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
        return tp.diaPUML.plantUmlIE(ctx, function* () {
          for (const table of mod.allContentTables) {
            if (SQLa.isGraphEntityDefinitionSupplier(table)) {
              yield table.graphEntityDefn();
            }
          }
        }, tp.diaPUML.typicalPlantUmlIeOptions()).content;
      }),
    )
    .command("driver", tp.sqliteDriverCommand(sqlDDL, ctx)).command(
      "test-fixtures",
      new tp.cli.Command()
        .description("Emit all test fixtures")
        .action(async () => {
          const CLI = relativeFilePath("./models_test.ts");
          const [sql, puml, sh] = [".sql", ".puml", ".sh"].map((extn) =>
            relativeFilePath(`./models_test.fixture${extn}`)
          );
          Deno.writeTextFileSync(sql, await $`./${CLI} sql`.text());
          Deno.writeTextFileSync(puml, await $`./${CLI} diagram`.text());
          Deno.writeTextFileSync(sh, await $`./${CLI} bash`.text());
          [sql, puml, sh].forEach((f) => console.log(f));
        }),
    ).parse(Deno.args);
}

/**
 * This is an "end-to-end" test strategy; we generate our fixtures whenever
 * our information model (schema) changes and git-track those files so that
 * if SQLa or other library changes impact what's generated we'll know because
 * the Deno test will fail.
 *
 * to re-generate all fixtures
 * $ ./models_test.ts test-fixtures
 *
 * to re-generate the fixtures one at a time:
 * $ ./models_test.ts sql --dest models_test.fixture.sql
 * $ ./models_test.ts diagram --dest models_test.fixture.puml
 * $ ./models_test.ts driver --dest ./models_test.fixture.sh && chmod +x ./models_test.fixture.sh
 */
Deno.test("Information Assurance Pattern", async (tc) => {
  const CLI = relativeFilePath("./models_test.ts");

  await tc.step("CLI SQL content", async () => {
    const output = await $`./${CLI} sql`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.sql"),
    );
  });

  await tc.step("CLI diagram", async () => {
    const output = await $`./${CLI} diagram`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.puml"),
    );
  });

  await tc.step("CLI driver content", async () => {
    const output = await $`./${CLI} bash`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.sh"),
    );
  });

  /**
   * Execute the "driver" so that it creates an in-memory SQLite database and
   * returns the total number of objects found in the SQLite ephemeral DB. If
   * the count is equivalent to our expectation it means everything worked.
   */
  await tc.step("CLI driver execution result", async () => {
    const sh = relativeFilePath("./models_test.fixture.sh");
    // TODO: right now we just check the total count of object but this should be
    // improved to actually check the names of each table, view, etc.
    // deno-fmt-ignore
    const output = await $`./${sh} :memory: "select count(*) as objects_count from sqlite_master"`.text();
    ta.assertEquals(output, "55");
  });

  // deno-lint-ignore require-await
  await tc.step("Typescript SQL", async () => {
    const output = sqlDDL().SQL(ctx);
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.sql"),
    );
  });
});

Deno.test("Infra Assurance Pattern Module", async (tc) => {
  await tc.step("CLI SQL content", () => {
    const output = sqlDDL().SQL(ctx);
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.sql"),
    );
  });
});
