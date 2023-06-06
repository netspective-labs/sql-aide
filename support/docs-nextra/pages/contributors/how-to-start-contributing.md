---
title: How to start contributing
---

# Your First Contribution

Welcome to SQLa (SQL Aide)! We're thrilled that you're interested in making your
first contribution to our open-source project. Here are some suggestions on how
to discover what to contribute to first:

## Review Open Tickets and Issues

A great starting point is to review the open tickets and issues on our GitHub
repository. These tickets represent areas where help is needed, including bug
fixes, feature enhancements, and documentation updates. Look for issues labeled
as "good first issue" or "help wanted" as they are often beginner-friendly
tasks.

To find open tickets and issues:

- Visit our
  [GitHub repository]([link-to-github-repo](https://github.com/netspective-labs/sql-aide/issues)).
- Navigate to the "Issues" tab.
- Filter the issues using labels like "good first issue" or "help wanted".

Choose an issue that aligns with your skills and interests. Feel free to ask
questions and seek clarification if needed.

## Check the Roadmap and Feature Requests

Visit our [project's roadmap](../roadmap/) or feature request page to get an
overview of the planned enhancements and upcoming features. This will give you
an understanding of the project's direction and areas where your contributions
can make a significant impact. Consider the following:

- Explore the project's website or GitHub repository for the roadmap.
- Look for planned features or enhancements that align with your interests and
  expertise.
- Review the feature requests to see if there are any that you can help
  implement.

Contributing to the roadmap or feature requests ensures that you're working on
features that are aligned with the project's goals.

## Explore Other SQL Generator Packages

Take a look at other third-party SQL generator packages to gain insights into
the features and functionalities they offer. While exploring these packages,
including dbt and other similar libraries, keep in mind that SQLa takes a
distinct approach as an aide to SQL developers, emphasizing type safety,
composability, version control, and other unique features. Consider the
following:

- **dbt**: dbt (data build tool) is a widely-used SQL-based transformation and
  modeling tool. It provides a framework for managing data transformation
  workflows, including SQL code generation and documentation. While SQLa shares
  some similarities with dbt, it's important to note that SQLa focuses on being
  a comprehensive SQL generation library rather than a full-fledged data
  transformation tool or ORM. SQLa prioritizes features like type-safe schemas,
  multi-dialect SQL generation, and support for relational tables, columns,
  views, stored procedures, and stored functions.

- **SQLFluff**: SQLFluff is a linter and formatter for SQL code. It helps
  maintain a consistent and clean SQL codebase by detecting syntax errors,
  enforcing coding standards, and providing suggestions for improvement. SQLa,
  on the other hand, goes beyond code formatting and linter capabilities by
  offering advanced features such as type-safe schema definitions using Zod,
  powerful SQL template generation using TypeScript and JavaScript string
  template literals, and multi-dialect SQL support.

- **sqlalchemy**: sqlalchemy is a SQL toolkit and Object-Relational Mapping
  (ORM) library for Python. While sqlalchemy offers comprehensive tools for
  working with databases and generating SQL statements programmatically, SQLa
  does not aim to provide ORM capabilities. Instead, SQLa focuses on being an
  aide to SQL developers, empowering them with type safety, composable SQL
  templates, and the ability to generate multi-dialect SQL code, while leaving
  the connection management and execution of SQL to other libraries or
  frameworks.

- **Knex.js**: Knex.js is a SQL query builder for Node.js that supports multiple
  database systems. It provides an expressive and fluent API for building SQL
  queries in JavaScript. While Knex.js and SQLa both offer SQL generation
  capabilities, SQLa distinguishes itself by providing a more TypeScript-centric
  approach with type safety and the ability to define schemas using Zod.

- **Flyway**: Flyway is a database migration tool that simplifies the process of
  managing and applying database schema changes. While Flyway focuses on
  database migrations, SQLa focuses on SQL generation and providing an aide for
  SQL developers. SQLa can be used in conjunction with migration tools like
  Flyway to generate the necessary SQL statements for schema changes.

- **Prisma**: Prisma is a modern database toolkit and ORM for TypeScript and
  Node.js. It simplifies database access and provides a type-safe query builder.
  While Prisma offers an ORM-like experience, SQLa focuses specifically on SQL
  generation, allowing developers to define and compose SQL templates with type
  safety and multi-dialect support.

By exploring these and other similar libraries, you can gain inspiration and
insights into different approaches to SQL generation. Identify features,
techniques, or patterns that align with SQLa's focus on type safety,
composability, version control, and other unique features. Analyze their
strengths and weaknesses to identify areas where SQLa can provide even more
value and differentiate itself as a comprehensive SQL generation library.

Remember to respect the licenses and terms of use of these third-party libraries
and give credit where it's due. While exploring the competition, always keep in
mind SQLa's distinct focus as an aide to SQL developers, providing powerful
tools and features to enhance SQL development workflows and code quality.

Based on your findings, you can contribute by implementing similar features or
improvements within SQLa.

## Seek Feedback and Guidance

If you're still unsure about what to contribute, don't hesitate to reach out for
guidance. You can:

- Join our community forums or chat channels and ask for suggestions.
- Reach out to the project maintainers or experienced contributors for advice.
- Engage in discussions and ask questions on relevant GitHub issues.

We're here to help you find the right contribution opportunity and provide
support along the way.

Remember, no contribution is too small, and learning through exploration and
collaboration is an essential part of the process. We appreciate your interest
in contributing to SQLa, and we look forward to your valuable contributions!

If you have any questions or need further assistance, please don't hesitate to
reach out to us through the following channels:

- GitHub Issues: https://github.com/netspective-labs/sql-aide/issues
- Discord: [coming soon](link-to-chat)

Happy contributing!
