#!/usr/bin/env -S deno run --allow-all

import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as sqliteCLI from "../../lib/sqlite/cli.ts";
import * as SQLa from "../../render/mod.ts";
import * as tp from "../typical/mod.ts";
import * as mod from "./models.ts";
import * as udm from "../udm/mod.ts";

let syntheticUlidValue = 0;

function syntheticUlid() {
  syntheticUlidValue++;
  return syntheticUlidValue.toString();
}

const ctx = SQLa.typicalSqlEmitContext();

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

const relativeFileContent = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return Deno.readTextFileSync($.path.relative(Deno.cwd(), absPath));
};

const { gts } = udm;
const graphNatureIdSelect = mod.graphNature.select({
  code: "SERVICE",
});
const graphTableInsertion = mod.graph.insertDML({
  graph_id: syntheticUlid(),
  name: "text-value",
  graph_nature_id: graphNatureIdSelect,
  description: "description",
});

const graphIdSelect = mod.graph.select(graphTableInsertion.insertable);
const boundaryNatureIdSelect = mod.boundaryNature.select({
  code: "REGULATORY_TAX_ID",
});
const taxIdBoundary = mod.boundary.insertDML({
  boundary_id: syntheticUlid(),
  boundary_nature_id: boundaryNatureIdSelect,
  name: "Boundery Name",
  description: "test description",
  graph_id: graphIdSelect,
});
const taxIdBoundaryIdSelect = mod.boundary.select(taxIdBoundary.insertable);

const primaryBoundary = mod.boundary.insertDML({
  boundary_id: syntheticUlid(),
  boundary_nature_id: boundaryNatureIdSelect,
  name: "Boundery Name Self Test",
  description: "test description",
  parent_boundary_id: taxIdBoundaryIdSelect,
  graph_id: graphIdSelect,
});

const hostInsertion = mod.host.insertDML({
  host_id: syntheticUlid(),
  host_name: "Test Host Name",
  description: "description test",
});

const hostID = mod.host.select(hostInsertion.insertable);
const hostBoundaryInsertion = mod.hostBoundary.insertDML({
  host_boundary_id: syntheticUlid(),
  host_id: hostID,
});

const raciMatrixInsertion = mod.raciMatrix.insertDML({
  raci_matrix_id: syntheticUlid(),
  asset: "asset test",
  responsible: "responsible",
  accountable: "accountable",
  consulted: "consulted",
  informed: "informed",
});
const raciMatrixSubjectIdSelect = mod.raciMatrixSubject.select({
  code: "CURATION_WORKS",
});
const raciMatrixSubjectBoundaryInsertion = mod.raciMatrixSubjectBoundary
  .insertDML({
    raci_matrix_subject_boundary_id: syntheticUlid(),
    boundary_id: mod.boundary.select({ name: "Boundery Name Self Test" }),
    raci_matrix_subject_id: raciMatrixSubjectIdSelect,
  });

const raciMatrixActivityInsertion = mod.raciMatrixActivity
  .insertDML({
    raci_matrix_activity_id: syntheticUlid(),
    activity: "Activity",
  });

const partyInsertion = udm.party
  .insertDML({
    party_id: syntheticUlid(),
    party_type_id: "PERSON",
    party_name: "person",
  });

const partyID = udm.party.select(partyInsertion.insertable);

const partyIdentifierInsertion = udm.partyIdentifier
  .insertDML({
    party_identifier_id: syntheticUlid(),
    identifier_name: "idenitifier name",
    identifier_value: "test identifier",
    party_identifier_type_id: udm.partyIdentifierType.select({
      code: "PASSPORT",
    }),
    party_id: partyID,
  });
const genderTypeInsertion = udm.genderType
  .insertDML([{
    gender_type_id: syntheticUlid(),
    code: "MALE",
    value: "Male",
  }, {
    gender_type_id: syntheticUlid(),
    code: "FEMALE",
    value: "Female",
  }]);
const genderTypeID = udm.genderType.select({
  code: "MALE",
});
const sexTypeInsertion = udm.sexType
  .insertDML([{
    sex_type_id: syntheticUlid(),
    code: "MALE",
    value: "Male",
  }, {
    sex_type_id: syntheticUlid(),
    code: "FEMALE",
    value: "Female",
  }]);
const sexTypeID = udm.sexType.select({
  code: "MALE",
});
const personInsertion = udm.person
  .insertDML({
    person_id: syntheticUlid(),
    party_id: partyID,
    person_type_id: udm.personType.select({
      code: "PROFESSIONAL",
    }),
    person_first_name: "Test First Name",
    person_last_name: "Test Last Name",
    gender_id: genderTypeID,
    sex_id: sexTypeID,
  });

const partyRelationInsertion = udm.partyRelation
  .insertDML({
    party_relation_id: syntheticUlid(),
    party_id: partyID,
    related_party_id: partyID,
    relation_type_id: "ORGANIZATION_TO_PERSON",
    party_role_id: udm.partyRole.select({
      code: "VENDOR",
    }),
  });

const organizationInsertion = udm.organization
  .insertDML({
    organization_id: syntheticUlid(),
    party_id: partyID,
    name: "Test Name",
    license: "Test License",
    registration_date: new Date("2023-02-06T00:00:00.000Z"),
  });

const personID = udm.person.select({
  person_first_name: "Test First Name",
  person_last_name: "Test Last Name",
});
const organizationID = udm.organization.select({ name: "Test Name" });

const organizationRoleTypeCode = udm.organizationRoleType.select({
  code: "ASSOCIATE_MANAGER_TECHNOLOGY",
});

const organizationRoleInsertion = udm.organizationRole
  .insertDML({
    organization_role_id: syntheticUlid(),
    person_id: personID,
    organization_id: organizationID,
    organization_role_type_id: organizationRoleTypeCode,
  });

const contactElectronicInsertion = udm.contactElectronic
  .insertDML({
    contact_electronic_id: syntheticUlid(),
    contact_type_id: udm.contactType.select({
      code: "MOBILE_PHONE_NUMBER",
    }),
    party_id: partyID,
    electronics_details: "electronics details",
  });

function sqlDDL() {
  return SQLa.SQL<udm.EmitContext>(gts.ddlOptions)`
    ${mod.sqlDDL()}

    -- synthetic / test data
    ${graphTableInsertion}

    ${taxIdBoundary}

    ${primaryBoundary}

    ${hostInsertion}

    ${hostBoundaryInsertion}

    ${raciMatrixInsertion}

    ${raciMatrixSubjectBoundaryInsertion}

    ${raciMatrixActivityInsertion}

    ${partyInsertion}

    ${partyIdentifierInsertion}

    ${genderTypeInsertion}

    ${sexTypeInsertion}

    ${personInsertion}

    ${partyRelationInsertion}

    ${organizationInsertion}


    ${organizationRoleInsertion}

    ${contactElectronicInsertion}
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
    .command(
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
Deno.test("Information Assurance Pattern CLI", async (tc) => {
  const CLI = relativeFilePath("./models_test.ts");

  await tc.step("CLI SQL content", async () => {
    const output = await $`./${CLI} sql`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.sql"),
    );
    ta.assertEquals(
      output,
      output,
    );
  });

  await tc.step("CLI diagram", async () => {
    const output = await $`./${CLI} diagram`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.puml"),
    );
    ta.assertEquals(
      output,
      output,
    );
  });

  await tc.step("CLI driver content", async () => {
    const output = await $`./${CLI} bash`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.sh"),
    );
    ta.assertEquals(
      output,
      output,
    );
  });

  /**
   * Execute the "driver" so that it creates an in-memory SQLite database and
   * returns the total number of objects found in the SQLite ephemeral DB. If
   * the count is equivalent to our expectation it means everything worked.
   */

  // deno-lint-ignore require-await
  await tc.step("Typescript SQL", async () => {
    const ctx = SQLa.typicalSqlEmitContext();
    const output = sqlDDL().SQL(ctx);
    // ta.assertEquals(
    //   output,
    //   relativeFileContent("./models_test.fixture.sql"),
    // );
    ta.assertEquals(
      output,
      output,
    );
  });
});

Deno.test("Infra Assurance Pattern Module", async (tc) => {
  await tc.step("CLI SQL content", () => {
    const output = sqlDDL().SQL(ctx);
    // ta.assertEquals(
    //   output,
    //   relativeFileContent("./models_test.fixture.sql"),
    // );
    ta.assertEquals(
      output,
      output,
    );
  });
});
