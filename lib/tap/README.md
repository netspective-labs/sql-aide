# Test Anything Protocol Emitter

This Deno module aides in the generation of TAP Version 14 results files. As of
January 2024 it's only designed to serve the purpose of preparing TAP outputs in
a type-safe manner and emit them to text files. If you need to parse the files,
use `github.com/tap/tapjs`.

The primary use case is to use TAP formatted files as compliance assertion and
attestation artifacts (e.g. for SOC2, HITRUST, FISMA, FedRAMP, etc.) where
humans will be writing the TAP files instead of TAP files being machine
generated.
