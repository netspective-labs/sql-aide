---
title: Domains
description: ""
---


In SQL, a _domain_ refers to a specific set of allowed values that a column
(field) can have in a database table. It defines the possible values for a
certain data type, which may also include constraints like NOT NULL, CHECK,
DEFAULT, etc. This concept is closely related to the notion of data types and
constraints.

SQL domains provide a way to constrain the kind of data that can be stored in a
table column. By using a domain, you can ensure that only certain types of data
are inserted into specific fields, helping to maintain the integrity and
consistency of your data.

For example, suppose we have a domain called "positive_integer" that ensures the
value is an integer and greater than zero. Any column defined with this domain
can only contain positive integers. If someone tries to insert non-compliant
data (like a negative number, a decimal, or a string), the SQL engine would
throw an error.

It's important to note that not all database systems support the SQL DOMAIN
feature directly. PostgreSQL and some others do, but MySQL and SQLite, for
example, do not. In those cases, similar functionality can often be achieved
with the appropriate use of data types, constraints, and/or triggers.

## `SqlDomain`

A SQL domain, encapsulated via the `render/domain/domain.ts:SqlDomain` type,
should be considered an atomic data type, created using Zod as an infrastructure
library, with optional constraints or restrictions that should be placed on what
kind of data can go into an attribute or column.

`render/domain/domain.ts` is the primary file which manages the core Zod data
types and how they are mapped to SQL _domains_.

`SqlDomain` instances are wrapped in Zod scalar schema valuable for many use
cases:

- defining a column of a table that may generate create table DDL
- defining a column in a select clause
- defining a column of a view that may generate create view DDL
- defining an argument of a stored function or procedure

A domain should be a simple JS/TS object that has no other relationships or
dependencies (see 'domains' below for relationships). Domains are effective when
they remain type-safe through Zod and should be composable through simple
functions and spread operators. This allows, e.g., a column defined for a
"create table" DDL defintion to be used as an argument definition for a stored
function and vice-versa. Favoring composability over inheritance is the reason
why a data definition domain remains a simple JS object instead of a class.

For example, `text`, `integer`, etc. are generic domains but a domain may also
be `person_id`, `daily_purchase_amount`, or any custom business data.

## `SqlDomains`

A `render/domain/domains.ts:SqlDomains` object groups multiple domains and
treats them as a collection. Domains are abstract types valuable for these use
cases:

- defining a list of columns in a table for DDL
- defining a list of select clause columns in SQL statement
- defining a list of arguments for a stored function

## Diagrams

Doctave comes with Mermaid.js support, which means you can create intricate
diagrams directly in your Markdown files:

```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

You can read more about Mermaid JS in the
[Doctave docs](https://cli.doctave.com/features/mermaid-js) or by going through
the Mermaid JS
[tutorials](https://mermaid-js.github.io/mermaid/diagrams-and-syntax-and-examples/n00b-syntaxReference.html).

## Syntax highlighting

Syntax highlighting is provided by [Prism](https://prismjs.com/) and Doctave
supports most popular languages out of the box.

```rust
impl Watcher {
    fn notify<S: Into<String>>(&self, path: PathBuf, msg: S) -> bool {
        self.channel.send((path, msg.into())).is_ok()
    }
}
```

You can refer to the Doctave
[Markdown reference](https://cli.doctave.com/features/markdown) to see how to
use syntax highlighting.

## Search

Doctave automatically indexes all your pages and allows you to search for them
without any 3rd party services. You can see the search bar at the top of the
page - hit the `s` key, and you can start searching all the content of the site.

Note - the results are keyboard-friendly. Use either the tab key or arrow keys
to navigate them.

## Dark mode

You can turn on dark mode by clicking on the button on the left side of the
page - the one with the moon icon. Your browser will remember your selection for
each Doctave site.
