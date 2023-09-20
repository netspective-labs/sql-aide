import { path } from "../../../../deps.ts";
import { testingAsserts as ta } from "../../../../deps-test.ts";
import { sourceComments } from "./parser.ts";

const relativeFileContent = (name: string) => {
  const absPath = path.fromFileUrl(import.meta.resolve(name));
  return Deno.readTextFileSync(path.relative(Deno.cwd(), absPath));
};
const expectedOutput = [
  {
    lineage: {
      input: {
        source: "sales_data.csv",
        columns: ["Date", "Product", "Revenue"],
      },
      transformations: {
        type: "aggregation",
        description: "Aggregate sales data by product and date",
      },
      output: {
        target: "sales_summary_table",
        columns: ["Date", "Product", "TotalRevenue"],
      },
    },
    traceability: {
      jiraIssue: "SALES-123",
    },
    codeReview: {},
  },
  {
    lineage: {
      input: {
        source: "sales_data_new.csv",
        columns: ["Date", "Product", "Revenue"],
      },
      transformations: {
        type: "aggregation",
        description: "Aggregate sales data by product and date",
      },
      output: {
        target: "sales_summary_table",
        columns: ["Date", "Product", "TotalRevenue"],
      },
    },
    traceability: {
      jiraIssue: "SALES-234",
    },
    codeReview: {},
  },
];
Deno.test("Test sourceComments in files", () => {
  const dataGovernanceInputJson = sourceComments(relativeFileContent(
    "./parser_test.fixture.ts",
  ));

  ta.assertEquals(
    JSON.parse(dataGovernanceInputJson),
    expectedOutput,
  );
});
Deno.test("Test sourceComments in text", () => {
  const inputComment = `/**
  * @governance {}
  * @lineage {input: {source: "sales_data.csv", columns: ["Date", "Product", "Revenue"]}, transformations: {type: "aggregation", description: "Aggregate sales data by product and date"}, output: {target: "sales_summary_table", columns: ["Date", "Product", "TotalRevenue"]}}
  * @traceability {"jiraIssue": "SALES-123"}
  */

 /**
  * @governance {}
  * @lineage {input: {source: "sales_data_new.csv", columns: ["Date", "Product", "Revenue"]}, transformations: {type: "aggregation", description: "Aggregate sales data by product and date"}, output: {target: "sales_summary_table", columns: ["Date", "Product", "TotalRevenue"]}}
  * @traceability {"jiraIssue": "SALES-234"}
  */
 `;
  const dataGovernanceInputJson = sourceComments(inputComment);

  ta.assertEquals(
    JSON.parse(dataGovernanceInputJson),
    expectedOutput,
  );
});
