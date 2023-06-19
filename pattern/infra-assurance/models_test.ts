#!/usr/bin/env -S deno run --allow-all

import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as tp from "../typical/mod.ts";
import * as mod from "./models.ts";
import * as udm from "../udm/mod.ts";

const relativeFilePath = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return $.path.relative(Deno.cwd(), absPath);
};

const relativeFileContent = (name: string) => {
  const absPath = $.path.fromFileUrl(import.meta.resolve(name));
  return Deno.readTextFileSync($.path.relative(Deno.cwd(), absPath));
};

const { ctx, gts } = udm;

const graphTableInsertion = mod.graph.insertDML({
  name: "text-value",
  graph_nature_id: "SERVICE",
  description: "description",
});

const graphIdSelect = mod.graph.select(graphTableInsertion.insertable);
const taxIdBoundary = mod.boundary.insertDML({
  boundary_nature_id: "REGULATORY_TAX_ID",
  name: "Boundery Name",
  description: "test description",
  graph_id: graphIdSelect,
});
const taxIdBoundaryIdSelect = mod.boundary.select(taxIdBoundary.insertable);

const primaryBoundary = mod.boundary.insertDML({
  boundary_nature_id: "REGULATORY_TAX_ID",
  name: "Boundery Name Self Test",
  description: "test description",
  parent_boundary_id: taxIdBoundaryIdSelect,
  graph_id: graphIdSelect,
});

const hostInsertion = mod.host.insertDML({
  host_name: "Test Host Name",
  description: "description test",
});

const hostID = mod.host.select(hostInsertion.insertable);
const hostBoundaryInsertion = mod.hostBoundary.insertDML({
  host_id: hostID,
});

const raciMatrixInsertion = mod.raciMatrix.insertDML({
  asset: "asset test",
  responsible: "responsible",
  accountable: "accountable",
  consulted: "consulted",
  informed: "informed",
});

const raciMatrixSubjectBoundaryInsertion = mod.raciMatrixSubjectBoundary
  .insertDML({
    boundary_id: mod.boundary.select({ name: "Boundery Name Self Test" }),
    raci_matrix_subject_id: "CURATION_WORKS",
  });

const raciMatrixActivityInsertion = mod.raciMatrixActivity
  .insertDML({
    activity: "Activity",
  });

const partyInsertion = udm.party
  .insertDML({
    party_type_id: "PERSON",
    party_name: "person",
  });

const partyID = udm.party.select(partyInsertion.insertable);

const partyIdentifierInsertion = udm.partyIdentifier
  .insertDML({
    identifier_number: "test identifier",
    party_identifier_type_id: "PASSPORT",
    party_id: partyID,
  });

const personInsertion = udm.person
  .insertDML({
    party_id: partyID,
    person_type_id: "PROFESSIONAL",
    person_first_name: "Test First Name",
    person_last_name: "Test Last Name",
  });

const partyRelationInsertion = udm.partyRelation
  .insertDML({
    party_id: partyID,
    related_party_id: partyID,
    relation_type_id: "ORGANIZATION_TO_PERSON",
    party_role_id: "VENDOR",
  });

const organizationInsertion = udm.organization
  .insertDML({
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

const organizationRoleInsertion = udm.organizationRole
  .insertDML({
    person_id: personID,
    organization_id: organizationID,
    organization_role_type_id: "ASSOCIATE_MANAGER_TECHNOLOGY",
  });

const contactElectronicInsertion = udm.contactElectronic
  .insertDML({
    contact_type_id: "MOBILE_PHONE_NUMBER",
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

    ${personInsertion}

    ${partyRelationInsertion}

    ${organizationInsertion}

    ${organizationRoleInsertion}

    ${contactElectronicInsertion}
    `;
}

if (import.meta.main) {
  await tp.typicalCLI({
    resolve: (specifier) =>
      specifier ? import.meta.resolve(specifier) : import.meta.url,
    prepareSQL: () => ws.unindentWhitespace(sqlDDL().SQL(ctx)),
    prepareDiagram: () => {
      return tp.diaPUML.plantUmlIE(ctx, function* () {
        for (const table of mod.allContentTables) {
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
        const CLI = relativeFilePath("./models_test.ts");
        const [sql, puml, sh] = [".sql", ".puml", ".sh"].map((extn) =>
          relativeFilePath(`./models_test.fixture${extn}`)
        );
        Deno.writeTextFileSync(sql, await $`./${CLI} sql`.text());
        Deno.writeTextFileSync(puml, await $`./${CLI} diagram`.text());
        Deno.writeTextFileSync(sh, await $`./${CLI} driver`.text());
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
    const output = await $`./${CLI} driver`.text();
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
    ta.assertEquals(output, "155");
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
