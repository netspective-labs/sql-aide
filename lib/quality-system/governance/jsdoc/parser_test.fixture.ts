/**
 * @governance {}
 * @lineage {input: {source: "sales_data.csv", columns: ["Date", "Product", "Revenue"]}, transformations: {type: "aggregation", description: "Aggregate sales data by product and date"}, output: {target: "sales_summary_table", columns: ["Date", "Product", "TotalRevenue"]}}
 * @traceability {"jiraIssue": "SALES-123"}
 */

/**
 * @governance {}
 * @lineage {input: {source: "sales_data_new.csv", columns: ["Date", "Product", "Revenue"]}, transformations: {type: "aggregation", description: "Aggregate sales data by product and date"}, output: {target: "sales_summary_table", columns: ["Date", "Product", "TotalRevenue"]}}
 * @traceability {"jiraIssue": "SALES-234"}
 */
