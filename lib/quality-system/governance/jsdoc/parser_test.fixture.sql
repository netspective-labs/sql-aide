/**
 * @governance {
 *   dataSteward: "John Doe",
 *   dataOwner: "HR Department",
 *   classification: "Restricted"
 * }
 * @lineage {
 *   input: {
 *     source: "hr_management_system",
 *     columns: ["employee_id", "first_name", "last_name", "email", "phone_number", "hire_date", "job_id", "salary"]
 *   },
 *   transformations: {
 *     type: "dataEntry",
 *     description: "Data entered manually by HR personnel"
 *   },
 *   output: {
 *     target: "Employee",
 *     columns: ["employee_id", "first_name", "last_name", "email", "phone_number", "hire_date", "job_id", "salary"]
 *   }
 * } 
 * @traceability {
 *   jiraIssue: "HR-456"
 * }
 * @schema {
 *   table: "Employee",
 *   description: "Table to store employee personal and work-related information.",
 *   columns: {
 *     employee_id: "Primary key identifier for employees.",
 *     first_name: "Employee's first name.",
 *     last_name: "Employee's last name.",
 *     email: "Employee's email address.",
 *     phone_number: "Employee's contact number.",
 *     hire_date: "Date the employee was hired.",
 *     job_id: "Identifier for the employee's job title.",
 *     salary: "Employee's salary."
 *   }
 * }
 */
CREATE TABLE Employee (
    employee_id INT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(75),
    phone_number VARCHAR(15),
    hire_date DATE,
    job_id VARCHAR(10),
    salary DECIMAL(8, 2)
);

/**
 * @governance {
 *   dataSteward: "John Doe",
 *   dataOwner: "HR Department",
 *   classification: "Restricted"
 * }
 * @lineage {
 *   input: {
 *     source: "Employee",
 *     columns: ["employee_id", "first_name", "last_name"]
 *   },
 *   transformations: {
 *     type: "concatenation",
 *     description: "Concatenating first and last names to generate full name."
 *   },
 *   output: {
 *     target: "full_name",
 *     columns: ["full_name"]
 *   }
 * }
 * @traceability {
 *   jiraIssue: "HR-123"
 * }
 * @param {
 *   employee_id: "101"
 * } employee_id - Identifier of the employee.
 * @returns {
 *   full_name: "Mathews"
 * } - The full name of the employee.
 */
CREATE FUNCTION get_full_name(employee_id INT) RETURNS VARCHAR(101) AS
$$
DECLARE
    full_name VARCHAR(101);
BEGIN
    SELECT first_name || ' ' || last_name INTO full_name
    FROM Employee
    WHERE Employee.employee_id = get_full_name.employee_id;
    RETURN full_name;
END;
$$ LANGUAGE plpgsql;
