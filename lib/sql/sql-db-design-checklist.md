# Database Design and SQL Best Practices Checklist

## Database Design

### Always use proper data types
- **Checklist/Recommendation**: Use data types based on the nature of data.
- **Remarks**: Example: Using `varchar(20)` to store date time values instead of `DATETIME` datatype will lead to errors during date time-related calculations and there is also a possible case of storing invalid data.

### Avoid spaces in object names
- **Checklist/Recommendation**: Using spaces makes the code more confusing, inconsistent with other queries and objects, and arguably harder to work with.
- **Remarks**: A better way is to use underscores instead of spaces.

### Use CHAR data type to store fixed length data only
- **Checklist/Recommendation**: Using `char(100)` instead of `varchar(100)` will consume more space if the length of data is less than 100 characters.

### Key Columns Indexing
- **Checklist/Recommendation**: Ensure indexing columns which are used in JOIN clauses so that queries return faster.

### Don't create index on each column
- **Checklist/Recommendation**: It’s not a good idea to put index on each column of a table. This will badly affect DML (Insert/Update) performance. Analyze SQL queries predicates and wisely create indexes.

### Always have a clustered (Primary) key on a table
- **Checklist/Recommendation**: Clustered Key (Primary) helps in storing table data in the same order as clustered key. This improves scan efficiency in queries by skipping data that does not match filtering predicates.

### Avoid multiple columns in a single table
- **Checklist/Recommendation**: Though there is no such limitation on keeping many columns in a table, it is always a good idea to divide into different tables based on design.

### Don't store calculated fields in a table
- **Checklist/Recommendation**: Example - Store DOB instead of age of a person.

### Avoid Over-Normalization Practice
- **Checklist/Recommendation**: While normalization is important, avoid over-normalizing to the point where queries become complex and slow due to excessive joins.

### Understand your Data and Domain
- **Checklist/Recommendation**: Thoroughly understand the data and its domain before designing the database schema to ensure relevant tables, columns, and relationships are defined.

### Consider Use Cases
- **Checklist/Recommendation**: Design the database schema based on anticipated use cases to ensure that it supports the required queries and operations efficiently.

## SQL Best Practices / Tuning

### Use SELECT * only if needed
- **Checklist/Recommendation**: Always explicitly type out the column names which are actually needed. This will improve response time particularly if you send the result to front-end applications.

### Use ORDER BY only if needed
- **Checklist/Recommendation**: `ORDER BY` & `DISTINCT` require the database engine to sort the result before it is sent to the client. Doing this in SQL may slow down response time in a multi-user environment.

### Don't use Functions over indexed columns
- **Checklist/Recommendation**: Using functions over indexed columns defeats the purpose of the index. Suppose you want to get data where the first two characters of customer code is AK, do not write:
  ```sql
  SELECT columns FROM table WHERE left(customer_code, 2) = 'AK'
  SELECT columns FROM table WHERE customer_code like ‘AK%’
  which will make use of index which results in faster response time.

- **LIMIT 1 When Getting a Unique Row**  
  - **Checklist/Recommendation**: This reduces execution time because the database engine will stop scanning for records after it finds the first matching record, instead of going through the whole table or index.

- **Create views to simplify / abstract complex SQL**  
  - **Checklist/Recommendation**: Views help to both simplify complex schemas and to implement security. One way that views contribute to security is to hide auditing fields from developers.

- **Analyze Query Structure / Artifacts**  
  - Review the SQL query to understand its purpose and logic.  
  - Identify unnecessary or redundant parts of the query.

- **Define Appropriate Indexes**  
  - Ensure that the tables involved in the query have appropriate indexes based on the WHERE clause.  
  - Avoid over-indexing, as it can negatively impact insert/update/delete performance.  
  - Use composite indexes when appropriate for multiple columns frequently used together in queries.  
  - Group by columns can be added in the INCLUDE part of the index.

- **Avoid SELECT \***  
  - Specify only the columns you need in the SELECT statement instead of retrieving all columns.  
  - Retrieving unnecessary columns increases I/O and network traffic.

- **Use JOINs Wisely**  
  - Choose the appropriate type of JOIN (INNER, LEFT, RIGHT, etc.) based on your data relationships.  
  - Use JOIN conditions that can take advantage of indexes for better performance.  
  - Avoid JOIN conditions that use functions (e.g., LTRIM, RTRIM, UPPER, LOWER).

- **Limit Data Returned**  
  Use the LIMIT or FETCH FIRST clauses to restrict the number of rows returned, especially for large result sets.

- **Use WHERE Clause Efficiently**  
  - Restrict the number of rows retrieved using the WHERE clause to avoid unnecessary data processing.  
  - Avoid using functions on indexed columns in the WHERE clause, as it can prevent index usage.

- **Avoid Subqueries Whenever Possible**  
  Replace subqueries with JOINs or temporary tables when feasible, as subqueries can be performance bottlenecks.

- **Use Proper Data Types**  
  Choose the most appropriate data types for your columns to save storage space and improve query performance.

- **Tune & Optimize Grouping and Aggregation**  
  - Use GROUP BY and aggregate functions efficiently to avoid unnecessary data processing.  
  - Consider creating summary tables for frequently used aggregations.

- **Update Database Statistics**  
  - Regularly update the statistics of the database to ensure the query optimizer makes accurate decisions.  
  - Use ANALYZE for Postgres or Auto Analyze feature.

- **Avoid Using DISTINCT**  
  Use GROUP BY instead of DISTINCT for better performance when aggregating data.

- **Consider Caching Mechanism**  
  Implement caching mechanisms to store frequently accessed query results and reduce database load.

- **Save & Monitor Execution Plans**  
  Use database tools to analyze query execution plans and identify bottlenecks or inefficient operations.

- **Use Bind Variables**  
  Use bind variables (parameterized queries) to allow the database to reuse query execution plans.

- **Regularly Perform Query Reviews**  
  Periodically review and analyze the performance of your frequently executed queries to identify optimization opportunities.

- **Consider Denormalization for Reporting Queries**  
  In some cases, denormalizing data (combining tables for performance reasons) can improve query performance, but it comes with trade-offs in terms of data integrity and maintenance.

- **Use Database Indexing and Table Partitioning**  
  Utilize advanced database features like indexing and partitioning for very large tables to improve query performance.

- **Monitor and Tune Regularly**  
  Database performance can change over time due to data growth or other factors, so make SQL tuning an ongoing process.

- **Backup and Test Changes**  
  Before making significant changes to your queries, ensure you have backups and test changes in a controlled environment to avoid disruptions.

- **Analyze Query Execution Plan**  
  - Understand the query execution plan using tools like EXPLAIN in SQL databases.  
  - Identify performance bottlenecks, such as full table scans, inefficient joins, or excessive sorting.

- **Index Optimization**  
  - Ensure that appropriate indexes are present on columns used in WHERE, JOIN, and ORDER BY clauses.  
  - Avoid over-indexing, as too many indexes can slow down write operations.

- **Use Proper Joins**  
  - Choose the correct join types (INNER, LEFT, RIGHT, FULL) based on the relationships between tables.  
  - Use proper join conditions to avoid Cartesian products.

- **Avoid Using Functions in WHERE Clauses**  
  Applying functions to columns in WHERE clauses can prevent the use of indexes. Consider rewriting queries to avoid this.

- **Avoid Long-running Updates/Inserts**  
  Long-running transactions can cause locks and contention. Keep transactions as short as possible.

- **Avoid Data Type Conversion**  
  Minimize data type conversions in your queries, as they can impact performance.

- **Batch Processing**  
  Use batch processing for bulk data operations instead of processing individual records.

- **Use Connection Pooling**  
  Implement connection pooling to efficiently manage database connections.

- **Hardware and Infrastructure**  
  Ensure that the underlying hardware and infrastructure meet the database's performance requirements.

- **Monitor and Optimize Temp Tables and Disk Usage**  
  Keep an eye on temporary table usage and disk space utilization, as excessive disk I/O can impact performance.

- **Avoid Using ORDER BY with Large Result Sets**  
  If possible, avoid using ORDER BY with large result sets, as it requires sorting, which can be resource-intensive.

- **Use Stored Procedures for Frequently Executed Logic**  
  Wrap frequently executed queries in stored procedures to promote code reusability and reduce query parsing overhead.

- **Use UNION Instead of UNION ALL with Caution**  
  Use UNION when you want to eliminate duplicate rows, but if duplicates are not an issue, use UNION ALL for better performance.

- **Database Parameter Tuning**  
  Adjust database configuration parameters (such as memory allocation, cache size, and parallelism) based on workload characteristics.

