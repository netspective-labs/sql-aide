import { path } from "../../../../deps.ts";
import { testingAsserts as ta } from "../../../../deps-test.ts";
import {
  governedSourceComments,
  unsafeSourceComments,
  validatedSourceComments,
} from "./parser.ts";

// Define a common function to read file content
const relativeFileContent = (name: string) => {
  const absPath = path.fromFileUrl(import.meta.resolve(name));
  return Deno.readTextFileSync(path.relative(Deno.cwd(), absPath));
};

const expecteUnMergeddData = [
  {
    governance: {
      dataSteward: "John Doe",
      dataOwner: "HR Department",
      classification: "Restricted",
    },
    lineage: {
      input: {
        source: "hr_management_system",
        columns: [
          "employee_id",
          "first_name",
          "last_name",
          "email",
          "phone_number",
          "hire_date",
          "job_id",
          "salary",
        ],
      },
      transformations: {
        type: "dataEntry",
        description: "Data entered manually by HR personnel",
      },
      output: {
        target: "Employee",
        columns: [
          "employee_id",
          "first_name",
          "last_name",
          "email",
          "phone_number",
          "hire_date",
          "job_id",
          "salary",
        ],
      },
    },
    codeReview: {},
    traceability: { jiraIssue: "HR-456" },
    informationSchema: {
      table: "Employee",
      description:
        "Table to store employee personal and work-related information.",
      columns: {
        employee_id: "Primary key identifier for employees.",
        first_name: "Employee's first name.",
        last_name: "Employee's last name.",
        email: "Employee's email address.",
        phone_number: "Employee's contact number.",
        hire_date: "Date the employee was hired.",
        job_id: "Identifier for the employee's job title.",
        salary: "Employee's salary.",
      },
    },
    param: {},
    returns: {},
  },
  {
    governance: {
      dataSteward: "John Doe",
      dataOwner: "HR Department",
      classification: "Restricted",
    },
    lineage: {
      input: {
        source: "Employee",
        columns: ["employee_id", "first_name", "last_name"],
      },
      transformations: {
        type: "concatenation",
        description:
          "Concatenating first and last names to generate full name.",
      },
      output: { target: "full_name", columns: ["full_name"] },
    },
    codeReview: {},
    traceability: { jiraIssue: "HR-123" },
    informationSchema: {},
    param: { employee_id: "101" },
    returns: { full_name: "Mathews" },
  },
];

const expecteMergeddData = [
  {
    governance: {
      dataSteward: "John Doe",
      dataOwner: "HR Department",
      classification: "Restricted",
      lineage: {
        input: {
          source: "hr_management_system",
          columns: [
            "employee_id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "hire_date",
            "job_id",
            "salary",
          ],
        },
        transformations: {
          type: "dataEntry",
          description: "Data entered manually by HR personnel",
        },
        output: {
          target: "Employee",
          columns: [
            "employee_id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "hire_date",
            "job_id",
            "salary",
          ],
        },
      },
    },
    codeReview: {},
    traceability: { jiraIssue: "HR-456" },
    informationSchema: {
      table: "Employee",
      description:
        "Table to store employee personal and work-related information.",
      columns: {
        employee_id: "Primary key identifier for employees.",
        first_name: "Employee's first name.",
        last_name: "Employee's last name.",
        email: "Employee's email address.",
        phone_number: "Employee's contact number.",
        hire_date: "Date the employee was hired.",
        job_id: "Identifier for the employee's job title.",
        salary: "Employee's salary.",
      },
    },
    param: {},
    returns: {},
  },
  {
    governance: {
      dataSteward: "John Doe",
      dataOwner: "HR Department",
      classification: "Restricted",
      lineage: {
        input: {
          source: "Employee",
          columns: ["employee_id", "first_name", "last_name"],
        },
        transformations: {
          type: "concatenation",
          description:
            "Concatenating first and last names to generate full name.",
        },
        output: { target: "full_name", columns: ["full_name"] },
      },
    },
    codeReview: {},
    traceability: { jiraIssue: "HR-123" },
    informationSchema: {},
    param: { employee_id: "101" },
    returns: { full_name: "Mathews" },
  },
];
// Success test for unsafeSourceComments
Deno.test("Success test parsing unsafely the JSDoc comments in SQL", () => {
  const filePath = "./parser_test.fixture.sql";
  const sqlContent = relativeFileContent(filePath);
  const parsedComments = unsafeSourceComments(sqlContent);
  ta.assertEquals(parsedComments, expecteUnMergeddData);
});

// Failure test for unsafeSourceComments
Deno.test("Fail test parsing unsafely the JSDoc comments in SQL", () => {
  const filePath = "./parser_test.fixture-fail.sql";
  const sqlContent = relativeFileContent(filePath);
  const parsedComments = unsafeSourceComments(sqlContent);
  ta.assertNotEquals(parsedComments, expecteUnMergeddData);
});

// Success test for validatedSourceComments
Deno.test("Success test parsing and validating the JSDoc comments in SQL", () => {
  const filePath = "./parser_test.fixture.sql";
  const sqlContent = relativeFileContent(filePath);
  const parsedComments = validatedSourceComments(sqlContent);
  ta.assertEquals(parsedComments, expecteUnMergeddData);
});

// Failure test for validatedSourceComments
Deno.test("Fail test parsing and validating the JSDoc comments in SQL", () => {
  const filePath = "./parser_test.fixture-fail.sql";
  const sqlContent = relativeFileContent(filePath);
  const parsedComments = validatedSourceComments(sqlContent);
  ta.assertNotEquals(parsedComments, expecteUnMergeddData);
});

// Success test for governedSourceComments
Deno.test("Success test parsing and validating and merging the JSDoc comments in SQL", () => {
  const filePath = "./parser_test.fixture.sql";
  const sqlContent = relativeFileContent(filePath);
  const parsedComments = governedSourceComments(sqlContent);
  ta.assertEquals(parsedComments, expecteMergeddData);
});

// Failure test for governedSourceComments
Deno.test("Fail test parsing and validating and merging  the JSDoc comments in SQL", () => {
  const filePath = "./parser_test.fixture-fail.sql";
  const sqlContent = relativeFileContent(filePath);
  const parsedComments = governedSourceComments(sqlContent);
  ta.assertNotEquals(parsedComments, expecteMergeddData);
});
