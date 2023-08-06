# Key/Value Pairs (`kv`) Aide

The `kv` module provides utilities to convert complex, nested objects into a
more manageable structure for storage in a key-value (KV) store.

- `keysValues` takes an object and converts it into an array of key-value pairs,
  each with an associated version number (if a versioning function is supplied).
  It flattens nested structures into a list of key paths, and assigns a version
  number to each distinct path if requested.

* `entityKeys` returns sn object with the same shape as the input but values are
  keys (arrays of path parts).
