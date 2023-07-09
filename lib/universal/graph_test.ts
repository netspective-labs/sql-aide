import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./graph.ts";

const syntheticNodeID: mod.NodeIdentitySupplier<string, string> = (node) =>
  node;
const syntheticNodeComparator: mod.NodeComparator<string> = (a, b) =>
  a.localeCompare(b);
const syntheticDagDF = mod.dagDepthFirst(
  syntheticNodeID,
  syntheticNodeComparator,
);

// deno-fmt-ignore
const complexGraph: mod.Graph<"A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P"> = {
  nodes: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"],
  edges: [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "B", to: "E" },
    { from: "C", to: "D" },
    { from: "C", to: "F" },
    { from: "D", to: "G" },
    { from: "D", to: "H" },
    { from: "E", to: "I" },
    { from: "E", to: "J" },
    { from: "F", to: "K" },
    { from: "F", to: "L" },
    { from: "G", to: "M" },
    { from: "G", to: "N" },
    { from: "H", to: "O" },
    { from: "H", to: "P" },
  ],
};

// DEBUG HINT: Use PlantText.com to generate SVG from PlantUML output, it will
//             allow you to visualize the DAG
//console.log(mod.typicalPlantUmlDiagram(complexGraph));

Deno.test("DAG type-safe graph builder", async (tc) => {
  type Node = "A" | "B" | "C" | "D" | "E";
  const nodes: Array<Node> = ["A", "B", "C", "D", "E"];
  const expectedGraph = {
    nodes: ["A", "B", "C", "D", "E"],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" },
    ],
  };

  await tc.step("nodes array, edges array", () => {
    ta.assertEquals(
      mod.graph<Node>(nodes, [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" },
      ]),
      expectedGraph,
    );
  });

  await tc.step("nodes array, edges generator", () => {
    ta.assertEquals(
      mod.graph<Node>(nodes, function* () {
        yield { from: "A", to: "B" };
        yield { from: "B", to: "C" };
        yield { from: "C", to: "A" };
      }),
      expectedGraph,
    );
  });

  await tc.step("nodes generator, edges generator", () => {
    ta.assertEquals(
      mod.graph<Node>(function* () {
        for (const n of nodes) yield n;
      }, function* () {
        yield { from: "A", to: "B" };
        yield { from: "B", to: "C" };
        yield { from: "C", to: "A" };
      }),
      expectedGraph,
    );
  });

  await tc.step("nodes inferred, edges generator", () => {
    ta.assertEquals(
      mod.edgesGraph<Node>(function* () {
        yield { from: "A", to: "B" };
        yield { from: "B", to: "C" };
        yield { from: "C", to: "A" };
      }),
      {
        // instead of all items in `nodes` we only have those referred to in edges
        nodes: ["A", "B", "C"],
        edges: [
          { from: "A", to: "B" },
          { from: "B", to: "C" },
          { from: "C", to: "A" },
        ],
      },
    );
  });
});

Deno.test("DAG isCyclical should return true for a cyclic graph", () => {
  // Create a cyclic graph
  const cyclicGraph: mod.Graph<"A" | "B" | "C"> = {
    nodes: ["A", "B", "C"],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" }, // cyclical
    ],
  };

  // Test the isCyclical function
  const isCyclical = mod.dagIsCyclicalDFS(
    cyclicGraph,
    syntheticNodeID,
    syntheticNodeComparator,
  );
  ta.assert(isCyclical);

  // test the dagDepthFirst.isCyclical object is equivalent to the primary function
  ta.assertEquals(syntheticDagDF.isCyclical(cyclicGraph), isCyclical);
});

Deno.test("DAG isCyclical should return false for an acyclic graph", () => {
  // Test the isCyclical function
  const isCyclical = mod.dagIsCyclicalDFS(
    complexGraph,
    syntheticNodeID,
    syntheticNodeComparator,
  );
  ta.assert(!isCyclical);

  // test the dagDepthFirst.isCyclical object is equivalent to the primary function
  ta.assertEquals(syntheticDagDF.isCyclical(complexGraph), isCyclical);
});

Deno.test("DAG cycles should return the correct cycles in a graph", () => {
  const graphWithCycles: mod.Graph<"A" | "B" | "C" | "D" | "E"> = {
    nodes: ["A", "B", "C", "D", "E"],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" }, // cycle
      { from: "C", to: "D" },
      { from: "D", to: "E" },
      { from: "E", to: "C" }, // cycle
    ],
  };

  // Test the cycles function
  const cycles = mod.dagCyclesDFS(
    graphWithCycles,
    syntheticNodeID,
    syntheticNodeComparator,
  );
  ta.assert(cycles.length === 2);
  ta.assert(cycles[0].cycleNodes.length === 3);
  ta.assert(cycles[1].cycleNodes.length === 2);

  // Test the dagDepthFirst.cycles function in the object is equivalent to the primary function
  const cycles2 = syntheticDagDF.cycles(graphWithCycles);
  ta.assertEquals(cycles2, cycles);
});

Deno.test("DAG topologicalSort should return the nodes in the correct order", () => {
  const graphForTopologicalSort: mod.Graph<"A" | "B" | "C" | "D" | "E"> = {
    nodes: ["A", "E", "B", "D", "C"],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "D" },
      { from: "D", to: "E" },
    ],
  };

  // Test the topologicalSort function
  const sortedNodes = mod.dagTopologicalSortDFS(
    graphForTopologicalSort,
    syntheticNodeID,
    syntheticNodeComparator,
  );
  ta.assertEquals(sortedNodes, ["A", "B", "C", "D", "E"]);

  // Test the dagDepthFirst.topologicalSort function in object is equivalent to the primary function
  ta.assertEquals(
    syntheticDagDF.topologicalSort(graphForTopologicalSort),
    sortedNodes,
  );
});

Deno.test("DAG numeric type instead of string", () => {
  const dagDF = mod.dagDepthFirst<number, number>(
    (node) => node,
    (a, b) => a - b,
  );

  const graph: mod.Graph<number> = {
    nodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    edges: [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 7 },
      { from: 6, to: 8 },
      { from: 6, to: 9 },
      { from: 7, to: 10 },
      { from: 8, to: 11 },
      { from: 9, to: 11 },
      { from: 10, to: 12 },
      { from: 11, to: 12 },
      { from: 12, to: 13 },
      { from: 13, to: 14 },
      { from: 13, to: 15 },
      { from: 14, to: 16 },
      { from: 15, to: 16 },
    ],
  };

  ta.assert(!dagDF.isCyclical(graph));
  ta.assertEquals(dagDF.topologicalSort(graph), [
    1,
    3,
    2,
    5,
    7,
    10,
    4,
    6,
    9,
    8,
    11,
    12,
    13,
    15,
    14,
    16,
  ]);
});

Deno.test("DAG dagDependencies should return the correct dependencies", () => {
  // Test the dagDependencies function
  const dependencies = mod.dagDependencies(complexGraph, syntheticNodeID, "D");
  ta.assertEquals(dependencies.sort(), ["B", "C"]);

  // Test the dagDepthFirst.deps function in object is equivalent to the primary function
  const result2 = syntheticDagDF.deps(complexGraph, "D");
  ta.assertEquals(result2.sort(), dependencies.sort());
});

Deno.test("DAG dagAncestors should return the correct ancestors (all dependencies)", () => {
  // Test the dagDependencies function
  const ancestors = mod.dagAncestors(complexGraph, syntheticNodeID, "O");
  ta.assertEquals(ancestors.sort(), ["A", "B", "C", "D", "H"]);

  // Test the dagDepthFirst.deps function in object is equivalent to the primary function
  const result2 = syntheticDagDF.ancestors(complexGraph, "O");
  ta.assertEquals(result2.sort(), ancestors.sort());
});

Deno.test("DAG execution plan should generate iterable nodes", () => {
  const executionPlan: {
    node: string;
    predecessors: string[];
    deps: string[];
    ancestors: string[];
    isParallelizable: boolean;
  }[] = [];
  for (const entry of syntheticDagDF.executionPlan(complexGraph)) {
    executionPlan.push({
      node: entry.node,
      predecessors: Array.from(entry.predecessors.values()),
      deps: entry.deps(),
      ancestors: entry.ancestors(),
      isParallelizable: entry.isParallelizable(),
    });
  }

  // deno-fmt-ignore
  ta.assertEquals(executionPlan, [
    {
      node: "A",
      predecessors: [],
      deps: [],
      ancestors: [],
      isParallelizable: true,
    },
    {
      node: "C",
      predecessors: ["A"],
      deps: ["A"],
      ancestors: ["A"],
      isParallelizable: false,
    },
    {
      node: "F",
      predecessors: ["A", "C"],
      deps: ["C"],
      ancestors: ["C", "A"],
      isParallelizable: true,
    },
    {
      node: "L",
      predecessors: ["A", "C", "F"],
      deps: ["F"],
      ancestors: ["F", "C", "A"],
      isParallelizable: true,
    },
    {
      node: "K",
      predecessors: ["A", "C", "F", "L"],
      deps: ["F"],
      ancestors: ["F", "C", "A"],
      isParallelizable: true,
    },
    {
      node: "B",
      predecessors: ["A", "C", "F", "L", "K"],
      deps: ["A"],
      ancestors: ["A"],
      isParallelizable: false,
    },
    {
      node: "E",
      predecessors: ["A", "C", "F", "L", "K", "B"],
      deps: ["B"],
      ancestors: ["B", "A"],
      isParallelizable: true,
    },
    {
      node: "J",
      predecessors: [ "A", "C", "F", "L", "K", "B", "E" ],
      deps: ["E"],
      ancestors: ["E", "B", "A"],
      isParallelizable: true,
    },
    {
      node: "I",
      predecessors: [ "A", "C", "F", "L", "K", "B", "E", "J" ],
      deps: ["E"],
      ancestors: ["E", "B", "A"],
      isParallelizable: true,
    },
    {
      node: "D",
      predecessors: [ "A", "C", "F", "L", "K", "B", "E", "J", "I" ],
      deps: ["B", "C"],
      ancestors: ["B", "A", "C"],
      isParallelizable: true,
    },
    {
      node: "H",
      predecessors: [ "A", "C", "F", "L", "K", "B", "E", "J", "I", "D" ],
      deps: ["D"],
      ancestors: ["D", "B", "A", "C"],
      isParallelizable: true,
    },
    {
      node: "P",
      predecessors: [ "A", "C", "F", "L", "K", "B", "E", "J", "I", "D", "H" ],
      deps: ["H"],
      ancestors: ["H", "D", "B", "A", "C"],
      isParallelizable: true,
    },
    {
      node: "O",
      predecessors: [ "A", "C", "F", "L", "K", "B", "E", "J", "I", "D", "H", "P" ],
      deps: ["H"],
      ancestors: ["H", "D", "B", "A", "C"],
      isParallelizable: true,
    },
    {
      node: "G",
      predecessors: [ "A", "C", "F", "L", "K", "B", "E", "J", "I", "D", "H", "P", "O" ],
      deps: ["D"],
      ancestors: ["D", "B", "A", "C"],
      isParallelizable: true,
    },
    {
      node: "N",
      predecessors: [ "A", "C", "F", "L", "K", "B", "E", "J", "I", "D", "H", "P", "O", "G" ],
      deps: ["G"],
      ancestors: ["G", "D", "B", "A", "C"],
      isParallelizable: true,
    },
    {
      node: "M",
      predecessors: [ "A", "C", "F", "L", "K", "B", "E", "J", "I", "D", "H", "P", "O", "G", "N", ],
      deps: ["G"],
      ancestors: ["G", "D", "B", "A", "C"],
      isParallelizable: true,
    },
  ]);
});

Deno.test("graphPlantUmlDiagram should generate the correct PlantUML diagram", () => {
  const diagram = mod.graphPlantUmlDiagram(complexGraph, {
    diagramFeatures: `left to right direction\n`,
    node: (node) => ({ text: `rectangle ${node}` }),
    edge: (edge) => ({
      fromText: edge.from,
      toText: edge.to,
    }),
  });

  // Define the expected PlantUML diagram
  const expectedDiagram = `@startuml
left to right direction

rectangle A
rectangle B
rectangle C
rectangle D
rectangle E
rectangle F
rectangle G
rectangle H
rectangle I
rectangle J
rectangle K
rectangle L
rectangle M
rectangle N
rectangle O
rectangle P
A --> B
A --> C
B --> D
B --> E
C --> D
C --> F
D --> G
D --> H
E --> I
E --> J
F --> K
F --> L
G --> M
G --> N
H --> O
H --> P
@enduml`;

  // Compare the generated diagram with the expected diagram
  ta.assertEquals(diagram, expectedDiagram);
});
