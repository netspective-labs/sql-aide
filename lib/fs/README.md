# SQL Aide (SQLa) Virtual File System (VFS)

SQLa VFS provides a seamless interface to interact with various file systems, be
it local, in-memory, or even within a zip archive. With SQLa VFS, you can
abstract away the complexities of file operations and focus on building robust
applications.

## Features

- **Local File System**: Interact with files and directories on your local
  machine.
- **Memory-mapped File System**: Perform file operations in memory, ideal for
  temporary data storage or testing.
- **Zip File System**: Work directly with zip archives, reading and writing
  files within them.
- **Unified Interface**: All file systems provide a consistent interface, making
  it easy to switch or combine them in your applications.
- **Extensibility**: Designed with extensibility in mind, you can easily add
  more file system types in the future.

## Installation

[Provide installation instructions, e.g., how to import the library in a
project.]

## Quick Start

### Local File System

```typescript
import { LocalFileSystem } from "./local-fs.ts";

const fs = new LocalFileSystem();
const file = fs.file({ canonicalPath: "/path/to/file.txt" });
// ... perform operations on the file ...
```

### Memory-mapped File System

```typescript
import { MemoryFileSystem } from "./memory-fs.ts";

const fs = new MemoryFileSystem();
const file = fs.file({ canonicalPath: "/virtual/path/to/file.txt" });
// ... perform operations on the file ...
```

### Zip File System

```ts
import { ZipFileSystem } from "./zip-fs.ts";

const fs = new ZipFileSystem(zipContent);
const file = fs.file({ canonicalPath: "/path/within/zip/file.txt" });
// ... perform operations on the file ...
```

## Files Overview

- `governance.ts`: This file defines the core interfaces for the VFS. It lays
  out the contract that all file systems must adhere to.
- `content.ts`: Content-specific (e.g. binary vs. text) interfaces and helpers.
- `entry.ts`: File system entry interfaces and helpers (like finding path
  parts).
- `local-fs.ts`: Implementation of the local file system. Allows for interaction
  with files and directories on your machine.
- `memory-fs.ts`: Provides an in-memory file system. Useful for temporary
  storage or testing purposes.
- `zip-fs.ts`: Allows for interaction with zip archives, treating them as a file
  system (uses JSZip internally).

## Key Interfaces

- `FileSystemEntry`: Represents a generic entry in the file system, be it a file
  or a directory.
- `File`: Represents a file in the file system. Provides methods for reading
  content.
- `MutableFile`: Extends the File interface, adding methods for writing content.
- `Directory`: Represents a directory in the file system. Provides methods to
  list files, subdirectories, and other entries.
- `MutableDirectory`: Extends the Directory interface, adding methods to add new
  files or subdirectories.

## Usage Instructions

Initialization: Start by initializing the file system you want to use:

```typescript
const fs = new LocalFileSystem(); // or MemoryFileSystem or ZipFileSystem
```

Reading a file:

```typescript
const file = fs.file({ canonicalPath: "/path/to/file.txt" });
const content = await file.content();
```

Writing to a file (for mutable file systems):

```typescript
const mutableFile = new MemoryMutableFile({
  canonicalPath: "/virtual/path.txt",
});
const writer = mutableFile.writer();
await writer.write(new TextEncoder().encode("Hello, SQLa VFS!"));
```

Directory Operations: Directories can be used to list files, subdirectories, or
add new entries:

```typescript
const dir = fs.directory({ canonicalPath: "/path/to/directory" });
for await (const file of dir.files()) {
  // Process each file
}
```

# Extending

The library is designed to be extensible. If you have a unique file system
requirement, you can implement the core interfaces from `governance.ts` to
create your custom file system.

Be careful and only introduce functions into `governance.ts` are not merely for
convenience but for actual functionality that needs to be supported across all
`FileSystem`s. If you need convenience wrappers, put those into an `fs-aide.ts`
or similar set of modules.

# Roadmap

- Implement AWS S3, OneDrive, and other "managed services" functionality with a
  `ManagedFileSystem` implementation base and subclasses for anything that
  requires REST services.
- Implement `GitHubFileSystem` and downloadable `GitHubAsset` (files). Start
  with flat filesystem then add `GitHubDirectory` for hierarchical organizations
  and repos. Use Fetch to download GitHub assets. For example:
  `await (await fetch(url)).body?.pipeTo(Deno.stdout.writable)`. See
  `netspective-labs/aide/task/github.ts` for good pattern. We can also do
  similar for almost any web asset by creating a general purpose `WebFileSystem`
  where the any file may be downloaded as a URL.
- Add utility methods to update file permissions (e.g. executables) so that we
  can implement `GitHubBinary` in addition to `GitHubAsset`.
- Implement SQL interface like
  [github.com/FSou1/fsquery](https://github.com/FSou1/fsquery) which is a
  TypeScript library like Rust-based
  [github.com/jhspetersson/fselect](https://github.com/jhspetersson/fselect);
  the best implementation would be to create a `select` function which would
  accept a `FileSystem` instance and an SQL query and return all entries that
  match.
- Create a new supplier for `udi-pgp-sqld` which embeds Deno and the virtual
  file system module to allow SQL access to all content across all file systems
- Implement content addressable hashes so that two files' content could be
  compared across file systems (best place is likely `FileSystemEntry`).
- Implement events infrastructure for type-safe listeners.
- Implement plugins infrastructure for transformation pipelines (using
  `SQLa Flow` or other means).
- Add a `walk` function to each FileSystem implementation that would walk all
  the entries and invoke a callback function for each entry.
- Add `watch` functionality for directories and files to call events when
  content changes.
- Add File, Directory, and FileSystem _Aide_ wrapper objects that would accept
  an instance of any of those and provide convenience functions like:
  - `netspective-labs/aide/fs/fs-tabular.ts` (for retriving CSVs and other
    tabular data elements) and for taking SQL and other results and storing them
    as data assets.
  - `move`, `copy`, `sync`, etc. functionality that would work between
    FileSystems as well as within.
- Consider porting from older Netspective Aide `lib/fs` package:
  - `netspective-labs/aide/fs/fs-tree.ts` to support file system trees.
  - `netspective-labs/aide/fs/fs-route.ts` to support file system routes.
- Review
  [github.com/AliBasicCoder/fs-pro](https://github.com/AliBasicCoder/fs-pro) for
  missing features and add them.
- Add tRPC interface for TypeScript clients so that front-end frameworks can use
  type-safe capabilities.
- Add GraphQL interface for non-TypeScript clients so that any language can use
  type-safe capabilities.
- Implement as FUSE for servers so that a single FUSE instance could use
  libraries for multiple FileSystems.
- Add stress tests to test memory, performance, etc. to ensure no FS handle
  leaks, memory leaks, etc.
