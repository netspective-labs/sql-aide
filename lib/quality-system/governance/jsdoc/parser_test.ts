import { testingAsserts as ta } from "../../../../deps-test.ts";
import { processCommentsAndGenerateJSON } from "./parser.ts";

Deno.test("Test processCommentsAndGenerateJSON function", async () => {
  const filePath = "comments.ts";

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

  /*const dataGovernanceInputJson = await processCommentsAndGenerateJSON(
    filePath,
  );
  */
  const dataGovernanceInputJson =
    '[{"lineage":{"input":{"source":"sales_data.csv","columns":["Date","Product","Revenue"]},"transformations":{"type":"aggregation","description":"Aggregate sales data by product and date"},"output":{"target":"sales_summary_table","columns":["Date","Product","TotalRevenue"]}},"traceability":{"jiraIssue":"SALES-123"},"codeReview":{}},{"lineage":{"input":{"source":"sales_data_new.csv","columns":["Date","Product","Revenue"]},"transformations":{"type":"aggregation","description":"Aggregate sales data by product and date"},"output":{"target":"sales_summary_table","columns":["Date","Product","TotalRevenue"]}},"traceability":{"jiraIssue":"SALES-234"},"codeReview":{}}]';
  ta.assertEquals(
    JSON.parse(dataGovernanceInputJson),
    expectedOutput,
  );
});
