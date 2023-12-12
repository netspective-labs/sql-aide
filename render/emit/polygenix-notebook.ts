import * as chainNB from "../../lib/notebook/chain-of-responsibility.ts";
import * as sql from "./sql.ts";
import * as pgen from "./polygenix.ts";

/**
 * Chain-of-Responsiblity style notebook base class for polyglot languages
 */
export abstract class PolygenNotebook<PolygenEmitContext> {
}

export function polygenlNotebookAnnotations<
  Notebook extends PolygenNotebook<Context>,
  Context extends sql.SqlEmitContext,
>() {
  return new chainNB.NotebookDescriptor<
    Notebook,
    chainNB.NotebookCell<Notebook, chainNB.NotebookCellID<Notebook>>
  >();
}

export function polygenNotebookFactory<
  Notebook extends PolygenNotebook<Context>,
  Context extends sql.SqlEmitContext,
>(
  prototype: Notebook,
  instance: () => Notebook,
  nbd = polygenlNotebookAnnotations<Notebook, Context>(),
) {
  type CellID = chainNB.NotebookCellID<Notebook>;
  const kernel = chainNB.ObservableKernel.create(prototype, nbd);

  type EventEmitter = Awaited<
    ReturnType<typeof kernel.initRunState>
  >["runState"]["eventEmitter"];
  return {
    nbd,
    kernel,
    instance,
    polygenContent: async (
      options: {
        separator?: (
          cell: Parameters<EventEmitter["afterCell"]>[0],
          state: Parameters<EventEmitter["afterCell"]>[1],
        ) => pgen.PolygenCellContentBehaviorSupplier<Context>;
        onNotSrcCodeSupplier?: (
          cell: Parameters<EventEmitter["afterCell"]>[0],
          state: Parameters<EventEmitter["afterCell"]>[1],
        ) => pgen.PolygenCellContentBehaviorSupplier<Context>;
      },
      ...srcCodeIdentities: CellID[]
    ) => {
      // prepare the run state with either a list of sql identities if passed
      // or all cells if no specific cells requested
      const initRunState = await kernel.initRunState({
        executeCells: (inb) => {
          if (srcCodeIdentities.length == 0) return inb.cells;
          const specific = srcCodeIdentities.map((si) =>
            inb.cells.find((c) => c.nbCellID == si)
          ).filter((c) => c != undefined) as typeof inb.cells;
          if (specific.length > 0) return specific;
          return inb.cells;
        },
      });

      const content: (
        | pgen.PolygenCellContentSupplier<Context>
        | pgen.PolygenCellContentBehaviorSupplier<Context>
      )[] = [];
      initRunState.runState.eventEmitter.afterCell = (cell, state) => {
        if (state.status == "successful") {
          if (
            pgen.isPolygenCellContentSupplier<Context>(state.execResult) ||
            pgen.isPolygenCellContentBehaviorSupplier<Context>(state.execResult)
          ) {
            if (options.separator) {
              content.push(options.separator(cell, state));
            }
            const sts = state.execResult as pgen.PolygenCellContentSupplier<
              Context
            >;
            content.push(sts);
          } else {
            const notSTS = options.onNotSrcCodeSupplier?.(cell, state);
            if (notSTS) content.push(notSTS);
          }
        }
      };
      await kernel.run(instance(), initRunState);
      return content;
    },
  };
}
