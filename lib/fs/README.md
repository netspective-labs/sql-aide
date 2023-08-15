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

Extending: The library is designed to be extensible. If you have a unique file
system requirement, you can implement the core interfaces from governance.ts to
create your custom file system.

# Roadmap

- Implement AWS S3, OneDrive, and other "managed services" functionality with a
  `ManagedFileSystem` implementation base and subclasses for anything that
  requires REST services.
- Add a `walk` function to each FileSystem implementation that would walk all
  the entries and invoke a callback function for each entry.
- Add File, Directory, and FileSystem _Aide_ wrapper objects that would accept
  an instance of any of those and provide convenience functions like:
  - `netspective-labs/aide/fs/fs-tabular.ts` (for retriving CSVs and other
    tabular data elements)
  - move, copy, sync, etc. functionality that would work between FileSystems as
    well as within
- Consider porting `netspective-labs/aide/fs/fs-tree.ts` to support file system
  trees.
- Consider porting `netspective-labs/aide/fs/fs-route.ts` to support file system
  routes.
