---
title: SQLa Concepts
description: A guide in my new Starlight docs site.

---

## Domain

In SQL, a `domain` refers to a specific set of allowed values that a column
(field) can have in a database table. It defines the possible values for a
certain data type, which may also include constraints like NOT NULL, CHECK,
DEFAULT, etc. This concept is closely related to the notion of data types and
constraints.

## Attribute or Property

`attribute` or `property` refers to a named instance of a specific domain. For
example, `person_id` can be a domain but once it's a named column of a table it
becomes an _attribute_ or a _property_.

## Entity

`entity` is a concrete instance of a group of domain instances such as
_attributes_ or _properties_. An _entity_ is usally a _table_ in SQL but might
also be represented as a view or a stored function.

## Link

`link` is a 1:n, n:1, or n:n relationship between entities.

- Links are typically defined as foreign keys in SQL but could be represented as
  arrays in stored procedures or an ORM.
- For example, if you had an Order entity (table) with order line and customer
  table foreign keys then the Order's links could be 1:n `items[]` and 1:1
  `customer`.

## Namespace

`namespace` refers to _physical_ storage grouping (e.g. `schemas` in some
databases).

## Information Model Module (`IMM`)

`information model module` (`IMM`) is a _logical_ grouping of multiple domains,
entities, tables, views, schemas, namespaces, etc.
