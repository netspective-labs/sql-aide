/**
 * This TypeScript module persists text and other content into files. It
 * provides abstract definitions and methods for supplying the text and its
 * provenance and storing the content to a text file.
 *
 * PersistProvenance: An interface for content provenance which includes the
 * source of the content.
 *
 * PersistContent: A generic interface for the output any object which could be
 * a successful result with the text of the output or an error.
 *
 * persistCmdOutput: A function that runs a Deno command defined by the provided
 * provenance object and constructs a PersistContent object. This allows the
 * STDOUT result of a CLI command to be persisted as a text file. It serves as
 * both a useful implementation of PersistContent but also an example of how you
 * can get source text from anywhere.
 *
 * textFilesPersister: A function that persists an arbitrary set of text to an
 * arbitrary set of files supplied by async generator. It also reports successes
 * and failures according to the provided optional methods.
 *
 * This module is designed with flexibility in mind, allowing the user to define
 * their own output (via PersistProvenance and PersistContent), how those
 * commands' results should be stored (via PersistStrategy), and even how to
 * handle successes and failures. The user may compose these pieces as needed to
 * handle a variety of scenarios for persisting Deno command outputs.
 */

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PersistProvenance {
  readonly source: string;
}

export interface PersistContent<Provenance extends PersistProvenance> {
  readonly basename: () => Promise<string> | string;
  readonly content: () => Promise<
    {
      readonly provenance?: Provenance;
      readonly text: string;
    } | {
      readonly provenance?: Provenance;
      readonly error: Error;
    }
  >;
}

export function persistCmdOutput<Provenance extends PersistProvenance>(
  source: {
    readonly provenance: () => Provenance;
    readonly basename: () => Promise<string> | string;
  },
) {
  const provenance = source.provenance();
  const result: PersistContent<Provenance> = {
    basename: source.basename,
    content: async () => {
      try {
        const command = new Deno.Command(provenance.source);
        const { code, stdout, stderr } = await command.output();
        if (code === 0) {
          return { provenance, text: new TextDecoder().decode(stdout) };
        } else {
          return {
            provenance,
            error: new Error(new TextDecoder().decode(stderr)),
          };
        }
      } catch (error) {
        return { provenance, error };
      }
    },
  };
  return result;
}

export interface TextFilePersistSuccess<Provenance extends PersistProvenance> {
  readonly provenance?: Provenance;
  readonly text: string;
  readonly destFile: string;
}

export function textFilesPersister<Provenance extends PersistProvenance>(
  strategy: {
    readonly destPath: (target: string) => string;
    readonly content: () => AsyncGenerator<PersistContent<Provenance>>;
    readonly persist?: (destFile: string, content: string) => Promise<void>;
    readonly finalize?: (
      state: {
        readonly emitted: TextFilePersistSuccess<Provenance>[];
        readonly destPath: (target: string) => string;
        readonly persist: (destFile: string, content: string) => Promise<void>;
      },
    ) => Promise<void> | void;
    readonly reportSuccess?: (
      tfps: TextFilePersistSuccess<Provenance>,
    ) => Promise<void> | void;
    readonly reportFailure?: (
      result: {
        readonly provenance?: Provenance;
        readonly destFile: string;
        readonly error: Error;
      },
    ) => Promise<void> | void;
  },
) {
  const {
    persist = (destFile, content) => Deno.writeTextFile(destFile, content),
    destPath,
    content,
    finalize,
    reportSuccess,
    reportFailure,
  } = strategy;
  return {
    emitAll: async () => {
      const emitted: {
        readonly provenance?: Provenance;
        readonly text: string;
        readonly destFile: string;
      }[] = [];
      for await (const c of content()) {
        const destFile = destPath(await c.basename());
        const output = await c.content();
        if ("text" in output) {
          await persist(destFile, output.text);
          await reportSuccess?.({ ...output, destFile });
          emitted.push({ ...output, destFile });
        } else {
          await reportFailure?.({ ...output, destFile });
        }
      }
      if (finalize) finalize({ emitted, destPath, persist });
      return emitted;
    },
  };
}
