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
  no vendor lock-in. The way we accomplish this is to allow a Flow to be a plain
  TypeScript Class.
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

## Flow Runner Status

- [x] Each flow can be executed as Deno script
- [x] Each flow can be scheduled using `cron` or other external utilities
- [ ] Each flow can be executed as a daemon/service
  - [ ] Can have a built-in scheduler via `croner` or similar
  - [ ] Can be executed via a `sensor` like a file watcher.

## Flow Class Status

- [x] Each flow is a TypeScript class
  - [ ] Flow classes do not not require any base classes or inheritence (though
        does support inheritable workflows).
  - [ ] Flow classes can be unit tested independently of the Flow framework
- [x] Each flow step is a synchronous or asynchronous class method.
- [x] Each flow step may have one or more decorators that can specify aspects.
- [ ] Each flow can have one or more initialization methods declared by
      decorators; initialization can also occur in flow class constructor but
      since constructors cannot be asynchronous you can use decorated async
      methods when required
  - [ ] ??Flow initialization can inject database connections and store them as
        instance properties
  - [ ] ??Flow initialization can inject files or content being watched
- [x] Each flow step class method is called in linear order unless it has a
      dependency decorator. If there are any dependencies the flow will become a
      DAG that is toplogically sorted and executed.
- [ ] Each flow step can optionally inject database connections as a parameter
- [ ] Each flow step can optionally inject files or content being watched
- [x] Each flow step has a common set of arguments
  - [x] The current flow state and step context is the first argument.
  - [x] The previous step's result (either an Error or its `return` statement
        value) is the second argument
- [ ] Each flow step can optionally request memoization of its results through a
      decorator.
- [ ] Each flow step can provide an interruption decorator to specify
      preconditions.
- [ ] Each flow step can provide decorator to specify what happens on error
  - [ ] Supply a different result
  - [ ] Retries
  - [ ] Timeouts
- [ ] Each flow can one or more finalization methods delcared by decorators.
- [x] Flow execution has complete observability of all initialization, execution
      of steps, errors, and finalization through EventEmitter pattern
  - [ ] EventEmitter allows unlimited typed listeners for each flow step
