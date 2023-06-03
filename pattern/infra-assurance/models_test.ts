#!/usr/bin/env -S deno run --allow-all

import $ from "https://deno.land/x/dax@0.30.1/mod.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as ws from "../../lib/universal/whitespace.ts";
import * as SQLa from "../../render/mod.ts";
import * as tp from "../typical/mod.ts";
import * as mod from "./models.ts";

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
const gts = tp.governedTemplateState<tp.GovernedDomain, EmitContext>();

const graphTableInsertion = mod.graph.insertDML({
  name: "text-value",
  graph_nature_code: "SERVICE",
  description: "description",
});

const boundaryInsertion = mod.boundary.insertDML({
  boundary_nature_id: "REGULATORY_TAX_ID",
  name: "Boundery Name",
  description: "test description",
  parent_boundary_id: 0,
});

const parentBoundaryID = mod.boundary.select(boundaryInsertion.insertable);

const boundarySelfInsertion = mod.boundary.insertDML({
  boundary_nature_id: "REGULATORY_TAX_ID",
  name: "Boundery Name Self Test",
  description: "test description",
  parent_boundary_id: parentBoundaryID,
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
    boundary_id: parentBoundaryID,
    raci_matrix_subject_id: "CURATION_WORKS",
  });

const raciMatrixActivityInsertion = mod.raciMatrixActivity
  .insertDML({
    activity: "Activity",
  });

const partyInsertion = mod.party
  .insertDML({
    party_type_id: "PERSON",
    party_name: "person",
  });

const partyID = mod.party.select(partyInsertion.insertable);

const partyIdentifierInsertion = mod.partyIdentifier
  .insertDML({
    identifier_number: "test identifier",
    party_identifier_type_id: "PASSPORT",
    party_id: partyID,
  });

const personInsertion = mod.person
  .insertDML({
    party_id: partyID,
    person_type_id: "PROFESSIONAL",
    person_first_name: "Test First Name",
    person_last_name: "Test Last Name",
  });

const partyRelationInsertion = mod.partyRelation
  .insertDML({
    party_id: partyID,
    related_party_id: partyID,
    relation_type_id: "ORGANIZATION_TO_PERSON",
    party_role_id: "VENDOR",
  });

const organizationInsertion = mod.organization
  .insertDML({
    party_id: partyID,
    name: "Test Name",
    license: "Test License",
    registration_date: new Date("02/06/2023"),
  });

const personID = mod.person.select(personInsertion.insertable);
const organizationID = mod.organization.select(
  organizationInsertion.insertable,
);

const organizationRoleInsertion = mod.organizationRole
  .insertDML({
    person_id: personID,
    organization_id: organizationID,
    organization_role_type_id: "ASSOCIATE_MANAGER_TECHNOLOGY",
  });

const contactElectronicInsertion = mod.contactElectronic
  .insertDML({
    contact_type_id: "MOBILE_PHONE_NUMBER",
    party_id: partyID,
    electronics_details: "electronics details",
  });

function sqlDDL() {
  return SQLa.SQL<EmitContext>(gts.ddlOptions)`
    ${mod.sqlDDL()}

    -- synthetic / test data
    ${graphTableInsertion}

    ${boundaryInsertion}

    ${boundarySelfInsertion}

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
  tp.typicalCLI({
    resolve: (specifier) =>
      specifier ? import.meta.resolve(specifier) : import.meta.url,
    prepareSQL: () => ws.unindentWhitespace(sqlDDL().SQL(ctx)),
    prepareDiagram: () => {
      // "executing" the following will fill gm.tablesDeclared but we don't
      // care about the SQL output, just the state management (tablesDeclared)
      sqlDDL().SQL(ctx);
      return gts.pumlERD(ctx).content;
    },
  }).commands.command("driver", tp.sqliteDriverCommand(sqlDDL, ctx))
    .parse(Deno.args);
}

Deno.test("Information Assurance Pattern", async (tc) => {
  const CLI = relativeFilePath("./models_test.ts");

  // this is mainly an "end-to-end" test strategy; we generate our fixtures
  // whenever our information model (schema) changes and git-track those files
  // so that if SQLa or other library changes impact what's generated we'll
  // know because the Deno test will fail.

  // to re-generate the fixtures:
  // $ ./models_test.ts sql --dest models_test.fixture.sql
  // $ ./models_test.ts diagram --dest models_test.fixture.puml
  // $ ./models_test.ts driver --dest ./models_test.fixture.sh && chmod +x ./models_test.fixture.sh

  await tc.step("CLI SQL", async () => {
    const output = await $`./${CLI} sql`.text();
    ta.assertEquals(
      output,
      relativeFileContent("./models_test.fixture.sql"),
    );
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
