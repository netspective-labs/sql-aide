---
title: Directory Structure
description: A guide in my new Starlight docs site.

---

<Callout>
  This guide describes the directory of the SQLa source repo and none of the
  structures are imposed on your own SQL or Typescript files. You are free to
  follow any structure conventions.
</Callout>

## Important Top-level Directories

<FileTree>
  <FileTree.Folder name="SQLa Repo" defaultOpen>
    <FileTree.Folder name="examples" />
    <FileTree.Folder name="lib" />
    <FileTree.Folder name="pattern" />
    <FileTree.Folder name="render" />
    <FileTree.Folder name="support" />
    <FileTree.File name="deps-test.ts" />
    <FileTree.File name="deps.ts" />
  </FileTree.Folder>
</FileTree>

## Examples

<FileTree>
  <FileTree.Folder name="SQLa Repo" defaultOpen>
    <FileTree.Folder name="examples" defaultOpen />
  </FileTree.Folder>
</FileTree>

The `examples` directory in the SQLa source code repository serves as a valuable resource for developers looking to explore and understand the capabilities of SQLa (SQL Aide). It contains a collection of practical examples that demonstrate various aspects of SQLa's functionality, showcasing its power and flexibility in generating SQL code.

Each example within the directory focuses on a specific use case, scenario, or feature of SQLa, providing hands-on guidance and illustrating how to leverage SQLa effectively in real-world scenarios. Whether you are new to SQLa or an experienced user, the examples offer valuable insights and serve as a reference to help you kickstart your SQL generation workflow.

By examining the examples, you can gain a deeper understanding of how to define database schemas, generate SQL statements using SQL templates, handle advanced SQL features, incorporate TypeScript and JavaScript logic, and more. The examples cover a range of topics, including table definitions, column specifications, relationships, views, stored procedures, and more.

To get started, navigate to the `examples` directory in the SQLa source code repository. Each example is accompanied by clear explanations, comments, and code snippets that walk you through the implementation. Feel free to explore, modify, and experiment with the provided examples to enhance your understanding of SQLa and its capabilities.

By leveraging the `examples` directory, you can accelerate your learning journey with SQLa and unlock its full potential for SQL generation. Start exploring the examples today to discover the power of SQLa and streamline your SQL code generation process.

## `Lib`

<FileTree>
  <FileTree.Folder name="SQLa Repo" defaultOpen>
    <FileTree.Folder name="lib" defaultOpen>
        <FileTree.Folder name="osquery" />
        <FileTree.Folder name="pre-process" defaultOpen>
            <FileTree.Folder name="psql" />
        </FileTree.Folder>
        <FileTree.Folder name="sql" defaultOpen>
            <FileTree.Folder name="pg" />
            <FileTree.Folder name="sqlite" />
        </FileTree.Folder>
        <FileTree.Folder name="universal" />
    </FileTree.Folder>
  </FileTree.Folder>
</FileTree>

The ``lib`` directory in the SQLa source code repository encompasses several subdirectories that contribute to the functionality and versatility of SQLa (SQL Aide). Each subdirectory serves a specific purpose and enhances different aspects of SQL generation and database-related tasks. Let's explore the subdirectories within the `lib` directory:

### `osquery`
The `osquery` subdirectory hosts modules and utilities that facilitate seamless integration with osquery, an open-source SQL-powered operating system instrumentation tool. The `osquery` subdirectory within the SQLa source code repository hosts modules and utilities that facilitate seamless integration with osquery, an open-source SQL-powered operating system instrumentation tool. This subdirectory provides specialized functionality for working with osquery and offers features such as Automatic Table Construction (ATC) configuration file generation capabilities.

### `pre-process`
The `pre-process` subdirectory contains a PostgreSQL `psql` pre-processor, which excels at handling meta commands like `\set` and `\include`. This pre-processor significantly enhances SQLa's capabilities by providing `psql` template features to databases that lack such functionality, such as SQLite, DuckDB, and Dolt. By leveraging the pre-processor, you can enjoy advanced features like variable substitution and file inclusion, improving your SQL generation workflow across different database systems.

### `sql`
The `sql` subdirectory is a repo of reusable SQL files, schemas, and objects. These resources cater to various purposes and support different SQL dialects. You can utilize this directory as-is for different database dialects, or you can import its contents into any SQLa TypeScript project through local file access or web URLs. By leveraging this extensive `lib`rary, you can save time and effort by leveraging pre-defined SQL code and schema structures for your SQL generation needs.

### `universal`
The `universal` subdirectory houses TypeScript modules that offer universal functionality and can be seamlessly integrated into any project. While primarily included in this repository for convenience, these modules can be utilized across diverse projects to enhance development efficiency. The `universal` subdirectory provides a set of reusable TypeScript modules that transcend specific database systems or SQL dialects, ensuring flexibility and versatility in your SQLa projects.

By organizing functionality into these subdirectories, the `lib` directory fosters a modular and reusable architecture. Each subdirectory addresses specific needs and empowers you to work with different aspects of SQL generation, osquery integration, pre-processing, and cross-database compatibility.

As you explore the `lib` directory, you can leverage the resources within each subdirectory to enhance your SQL generation workflows. The `sql` subdirectory, in particular, offers a convenient `lib`rary of reusable SQL files, schemas, and objects, adaptable to different database dialects. The `universal` subdirectory provides TypeScript modules that can be seamlessly integrated into any project for added convenience and flexibility.

Take advantage of the resources within the `lib` directory to streamline your SQL generation process, enhance cross-database compatibility, and improve overall development efficiency.

## `Pattern` Directory

<FileTree>
  <FileTree.Folder name="SQLa Repo" defaultOpen>
    <FileTree.Folder name="pattern" defaultOpen>
        <FileTree.Folder name="configuration" />
        <FileTree.Folder name="data-vault" />
        <FileTree.Folder name="observability" />
        <FileTree.Folder name="typical" />
    </FileTree.Folder>
  </FileTree.Folder>
</FileTree>

The pattern directory in the SQLa source code repository serves a distinct purpose compared to the examples and `lib` directories. While the `examples` directory is primarily for learning and exploration, and the `lib` directory contains code that can be used as-is or built upon, the pattern directory focuses on providing underlying models and templates that need to be assembled and composed with consumer `lib`raries to be useful. Let's delve into the details:

The pattern directory houses a collection of subdirectories that offer structured and reusable patterns for various SQLa features, configurations, observability components, and more. These patterns serve as foundational building blocks, providing standardized models, schemas, and SQL objects that can be tailored and composed to meet specific requirements.

Unlike the `examples` directory, which offers self-contained examples for learning purposes, the pattern directory emphasizes the assembly and composition of patterns with consumer `lib`raries. Patterns are not meant to be used in isolation but rather combined with other `lib`raries and customizations to create robust and tailored solutions. They provide a starting point and a set of best practices that developers can leverage to accelerate their development process.

Similarly, the pattern directory differs from the `lib` directory in that it focuses on providing underlying models rather than ready-to-use code. While the `lib` directory offers reusable code and modules that can be used as-is or extended, the pattern directory provides foundational patterns that need to be combined with consumer `lib`raries, configurations, and code to be fully utilized. These patterns establish the structure, rules, and conventions that enable consistent and maintainable SQL generation workflows.

By organizing resources into the pattern directory, SQLa promotes a modular and composable approach to SQL generation. Each subdirectory within the pattern directory represents a specific pattern, offering standardized models, schemas, and SQL objects that can be assembled, customized, and integrated with consumer `lib`raries to create powerful and tailored SQLa implementations.

When working with the pattern directory, developers should leverage these patterns as foundational building blocks and combine them with their own `lib`raries, configurations, and code to create comprehensive SQL generation solutions that meet their specific needs. The patterns provide a consistent and reliable starting point, enabling developers to focus on the higher-level customization and implementation details to achieve their desired SQL generation workflows.

### `configuration`
The `configuration` directory contains a set of SQLa feature toggles, feature flags, and configuration information models, schemas, and SQL objects. These resources enable flexible configuration management within SQLa, allowing you to customize the behavior and options of the `lib`rary according to your specific requirements. Feature toggles and feature flags are mechanisms used in software development to control the availability and behavior of certain features. They provide the ability to enable or disable specific features dynamically at runtime or execute specific code based on configuration settings.

### `data-vault`
The `data-vault` directory provides a pattern for SQLa Data Vault information models, schemas, and SQL objects. Data Vault is a data modeling and methodology approach designed to handle large-scale data integration and historical data storage. It provides a scalable and flexible solution for data warehousing and analytics.

SQLa incorporates the Data Vault methodology by generating SQL code for consistent Data Vault concepts such as hubs, satellites, links, and other related entities. By utilizing the Data Vault pattern in SQLa, you can efficiently implement Data Vault structures in your SQL generation workflows. SQLa takes care of generating the required SQL code, ensuring consistency and adherence to Data Vault principles. This allows you to focus on the logical design and transformation of your data, while SQLa handles the underlying SQL generation for Data Vault structures.

### `observability`
The `observability` directory encompasses a pattern for SQLa telemetry, metrics, and observability information models, schemas, and SQL objects. These resources enable you to integrate observability components into your SQLa projects, capturing valuable insights into the performance, health, and behavior of your SQL code. By adopting the observability pattern, you can enhance monitoring, troubleshooting, and optimization of your SQLa-based applications.

### `typical` (Most Important)
The most significant subdirectory within the pattern directory is the `typical` directory. It contains a comprehensive pattern called "typical" that serves as a foundation for SQLa's built-in patterns and is designed to be used by all consumers of the SQLa `lib`rary. The typical pattern encompasses SQLa governance rules, SQL domains, table types, information models, schemas, and SQL objects. It provides a robust and standardized set of resources that ensure consistency, maintainability, and best practices across SQLa projects.

By organizing resources into these subdirectories, the pattern directory facilitates a modular and reusable architecture within SQLa. Each subdirectory represents a specific pattern, offering pre-defined SQLa components that align with common use cases and industry best practices. These patterns enable you to leverage SQLa's features, configurations, observability components, and more, seamlessly within your projects.

When working with the pattern directory, developers should leverage these patterns as foundational building blocks and combine them with their own `lib`raries, configurations, and code to create comprehensive SQL generation solutions that meet their specific needs. The patterns provide a consistent and reliable starting point, enabling developers to focus on the higher-level customization and implementation details to achieve their desired SQL generation workflows.

## Render Directory

<FileTree>
  <FileTree.Folder name="SQLa Repo" defaultOpen>
    <FileTree.Folder name="render" defaultOpen>
        <FileTree.Folder name="ddl" defaultOpen>
            <FileTree.Folder name="table" />
        </FileTree.Folder>
        <FileTree.Folder name="diagram" />
        <FileTree.Folder name="dialect" defaultOpen>
            <FileTree.Folder name="pg" />
        </FileTree.Folder>
        <FileTree.Folder name="dml" />
        <FileTree.Folder name="domain" />
        <FileTree.Folder name="dql" />
        <FileTree.Folder name="emit" />
        <FileTree.Folder name="pl" />
        <FileTree.File name="graph.ts" />
    </FileTree.Folder>
  </FileTree.Folder>
</FileTree>

The `render` directory in the SQLa source code repository contains the core SQL generation TypeScript modules. It serves as the foundation for SQLa's SQL generation capabilities, providing essential tools for composing and generating SQL statements. Let's explore the subdirectories within the `render` directory in alphabetical order:

### `diagram`
The diagram subdirectory hosts modules that enable the generation of various types of diagrams, including PlantUML diagrams. Diagrams provide visual representations of database structures, relationships, and other SQLa components. By utilizing the modules within the diagram subdirectory, you can generate PlantUML diagrams and other visual representations that aid in understanding and communicating the architecture of your SQLa projects.

### `dialect`
The dialect subdirectory contains modules that cater to dialect-specific objects and features. Different database systems often have their own unique syntax and functionality. The modules within the dialect subdirectory provide support for dialect-specific objects, such as PostgreSQL stored procedures and stored functions. This ensures compatibility and enables the generation of SQL code that aligns with the requirements of specific database systems.

### `DDL`
The ddl subdirectory contains modules that focus on SQL Data Definition Language (DDL) operations. DDL statements are responsible for defining and modifying the structure of database objects such as tables, views, indexes, and constraints. The modules within the ddl subdirectory facilitate the generation of SQL statements for creating, altering, and dropping database objects, allowing you to effectively manage the schema and structure of your database.

### `DML`
The dml subdirectory encompasses modules that handle SQL Data Manipulation Language (DML) operations. DML statements are responsible for inserting, updating, and deleting data within the database. The modules within the dml subdirectory facilitate the generation of SQL statements for manipulating data, allowing you to efficiently perform data modifications and updates.

### `domain`
The domain subdirectory serves as a mapping layer between Zod types (defined using the Zod library) and SQL domains, including data types and column types. The modules within the domain subdirectory enable seamless mapping between Zod types and the appropriate SQL domain definitions. This ensures consistency and accuracy when generating SQL statements based on the defined types and domains.

### `emit`
The emit subdirectory contains modules responsible for the core SQLa composition work. These modules leverage the power of TypeScript's string template literals to compose and generate SQL statements. The emit functionality within the emit subdirectory plays a crucial role in assembling the SQLa components, allowing for dynamic and flexible SQL generation based on predefined templates and models.

### `pl` (Procedural Language)
The `pl` subdirectory encompasses modules related to procedural languages. Procedural languages, such as SQL stored procedures and stored functions (also known as stored routines), enable the creation of reusable code blocks within the database. The modules within the PL subdirectory provide the necessary tools to generate SQL code for procedural language constructs, allowing you to define and manage complex business logic and database operations. These modules form the foundation for generating SQL stored procedures and stored functions in SQLa, empowering you to implement custom logic and encapsulate frequently used operations within your SQL generation workflows.

The `render` directory, with its various subdirectories, provides a comprehensive set of tools and functionality for SQL generation in SQLa. Each subdirectory focuses on a specific aspect of SQL operations, allowing you to effectively manage database structures, compose queries, perform data manipulations, work with dialect-specific features, generate diagrams, and more. By utilizing the modules within the `render` directory, you can streamline your SQL generation workflow and build robust SQLa projects.
