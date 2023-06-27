---
title: Overview of Examples
---

<!-- # Getting Started -->

The "Getting Started" section is divided into three sub-sections: "Governed
Examples", "Ungoverned Examples", and "SQLa Preprocessor." These sections offer
insights into using SQLa for SQL generation in different contexts. Let's take a
closer look at each section:

## Ungoverned Examples (full Typescript/Javascript templates)

The Ungoverned Examples section provides insights on how to use Zod-based
schemas directly to generate SQL. Zod is a powerful TypeScript library that
enables the definition of types and schema validations. By leveraging Zod-based
schemas, you can generate SQL code based on your specific requirements without
the need for a predefined governance structure. This section offers flexibility
and freedom for projects that don't require strict governance but still benefit
from the strong typing and schema validations provided by Zod.

## Governed Examples (full Typescript/Javascript templates)

This section showcases how to implement governed schemas in SQLa to ensure
consistency, adherence to conventions, and robust SQL generation. Governed
schemas leverage the integration between Zod and SQLa to create a powerful
infrastructure for generating SQL statements. By defining governed schemas, you
can enforce governance rules, maintain information model and data model
consistency, and benefit from the type-safety and validation capabilities
provided by Zod.

Within this section, you will explore practical examples that demonstrate the
usage of governed schemas in SQLa. These governed schemas act as wrappers around
Zod schemas, allowing for seamless integration with SQLa's SQL generation
capabilities. They provide a structured approach to SQL generation,
incorporating naming conventions, primary key conventions, and other rules that
ensure standardized and high-quality SQL code.

By following the governed approach, you can establish consistent patterns for
SQL generation and enforce predefined rules within your SQLa projects. Governed
schemas provide a solid foundation for maintaining integrity and conformity
across information models and data models, resulting in reliable and scalable
SQL generation workflows.

The integration between Zod and SQLa enables the extension of Zod types, such as
strings, numbers, dates, and more, to incorporate additional metadata and
content needed for generating SQL statements. This integration ensures that Zod
structures seamlessly integrate within SQLa's ecosystem, enabling the generation
of SQL code directly from the defined governed schemas.

In summary, the governed examples in this section demonstrate how to leverage
governed schemas in SQLa to establish consistency, adhere to conventions, and
enforce rules within your SQL generation workflow. By combining the power of Zod
and SQLa, you can achieve type-safety, maintain standardized SQL generation
practices, and ensure the integrity of your generated SQL code.

## `SQLpp` Preprocess (for migrating existing SQL files)

If you have existing SQL files that need to be re-used, check out
[`SQLa`'s `SQLpp` (SQL preprocessor)](../emit/pre-process-sql/) which serves as
an intermediary stepping stone in the progression from raw SQL to complex SQL
generation.

For developers starting with raw SQL or DBAs that are not developers, jumping
directly into the deep end with sophisticated SQL generators might be a daunting
challenge. SQLpp, with its simpler templating and basic functionalities like
`include` statements and variable setting, provides a more gradual transition.

It allows users to enhance their SQL scripting capabilities beyond raw SQL,
without the immediate complexity of full-scale SQL generators. This enables a
smoother learning curve, building confidence and familiarity with SQL scripting
conventions before progressing to more advanced SQL generation techniques.

This phased approach also allows developers to appreciate and better understand
the nuances and power of SQL generation, ultimately resulting in more effective
and efficient SQL operations when they transition to using full-fledged SQL
generators.

## Mix and Match

By exploring the `SQLpp`, Governed Examples and Ungoverned Examples sections,
you can gain a comprehensive understanding of how to utilize SQLa for SQL
generation in different scenarios. Whether you need to enforce governance and
consistency or require flexibility with schema definitions, SQLa provides the
necessary tools and features to streamline your SQL generation workflow and
ensure high-quality SQL code. And if you just need some minimal templating
capabilities while you learn the full power of Typescript and Javascript
templates you can start with `SQLpp`.
