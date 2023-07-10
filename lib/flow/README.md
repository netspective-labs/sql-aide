# SQL Aide Flow (SQLa Flow)

SQL Aide Flow is a data operations workflow library similar to Apache Airflow or
Dagster but built for TypeScript-based SQL-first workflows. It helps you
orchestrate stateful SQL tasks such as acquiring source data, preparing SQL,
loading into a database. It handles task scheduling, dependencies, retries,and
more.

## Core Strategy

- Each flow is defined as a set of type-safe TypeScript modules that can operate
  independently as a CLI or as a library to be included by other flows in a DAG.
  Flow code can operate outside of Flow or as part of the Flow framework. It's a
  design goal to ensure that Flow does not become a dependency and that there's
  no vendor lock-in.
- Each flow can be scheduled using `cron` or other external utilities or can
  have a built-in scheduler or be executed via a `sensor` like a file watcher.
  It's a design goal to allow Flow code to be scheduled and executed with or
  without help from the Flow infrastructure.
- Every Flow step should be type-safe on the incoming and outgoing sides.
  Creating maintainable and decoupled code is a design goal and type-safety
  helps achieve that goal.
- Each Flow step should have explicit dependencies that are easy to follow. Ease
  of debugging is a design goal so implicit dependencies should be reduced.
- Every Flow step should be independently unit testable. Creating maintainable
  and decoupled code is a design goal and unit testing helps achieve that goal.
- Flow steps should be stateless whenever possible but if they are stateful they
  should allow their state to be stored using Open Telememtry traces, logs, and
  metrics plus be storage independent. It is a design goal to elminate state
  management dependencies by storing state in files, databases, or in memory.
- Flow steps must be able to store their own Quality System (documentation)
  content such as descriptions, lineage, stewardship, etc.
