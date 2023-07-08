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

Deno.test("DAG type-safe graph builder", async (tc) => {
  type Node = "A" | "B" | "C" | "D" | "E";
  const nodes: Array<Node> = ["A", "B", "C", "D", "E"];

  await tc.step("node array, edges array", () => {
    ta.assert(mod.graph<Node>(nodes, [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" },
    ]));
  });

  await tc.step("node array, edges generator", () => {
    ta.assert(mod.graph<Node>(nodes, function* () {
      yield { from: "A", to: "B" };
      yield { from: "B", to: "C" };
      yield { from: "C", to: "A" };
    }));
  });

  await tc.step("node generator, edges generator", () => {
    ta.assert(mod.graph<Node>(function* () {
      for (const n of nodes) yield n;
    }, function* () {
      yield { from: "A", to: "B" };
      yield { from: "B", to: "C" };
      yield { from: "C", to: "A" };
    }));
  });
});

Deno.test("DAG isCyclical should return true for a cyclic graph", () => {
  // Create a cyclic graph
  const cyclicGraph: mod.Graph<"A" | "B" | "C"> = {
    nodes: ["A", "B", "C"],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" },
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
  // Create an acyclic graph
  const acyclicGraph: mod.Graph<"A" | "B" | "C"> = {
    nodes: ["A", "B", "C"],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
    ],
  };

  // Test the isCyclical function
  const isCyclical = mod.dagIsCyclicalDFS(
    acyclicGraph,
    syntheticNodeID,
    syntheticNodeComparator,
  );
  ta.assert(!isCyclical);

  // test the dagDepthFirst.isCyclical object is equivalent to the primary function
  ta.assertEquals(syntheticDagDF.isCyclical(acyclicGraph), isCyclical);
});

Deno.test("DAG cycles should return the correct cycles in a graph", () => {
  // Create a graph with cycles
  const graphWithCycles: mod.Graph<"A" | "B" | "C" | "D" | "E"> = {
    nodes: ["A", "B", "C", "D", "E"],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" },
      { from: "C", to: "D" },
      { from: "D", to: "E" },
      { from: "E", to: "C" },
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
  // Create a graph for topological sorting
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

Deno.test("DAG dagDependencies should return the correct dependencies and dependents", () => {
  // Create a graph for testing
  const graph: mod.Graph<"A" | "B" | "C" | "D" | "E"> = {
    nodes: ["A", "B", "C", "D", "E"],
    edges: [
      { from: "A", to: "B" },
      { from: "A", to: "C" },
      { from: "B", to: "D" },
      { from: "C", to: "D" },
      { from: "D", to: "E" },
    ],
  };

  // Test the dagDependencies function
  const result = mod.dagDependencies(
    graph,
    syntheticNodeID,
    syntheticNodeComparator,
    mod.dagTopologicalSortDFS,
    "D",
  );

  ta.assertEquals(result.dependencies.sort(), ["A", "B", "C"]);
  ta.assertEquals(result.dependents, ["E"]);

  // Test the dagDepthFirst.deps function in object is equivalent to the primary function
  const result2 = syntheticDagDF.deps(graph, "D");
  ta.assertEquals(result2.dependencies.sort(), result.dependencies.sort());
  ta.assertEquals(result2.dependents, result.dependents);
});

Deno.test("graphPlantUmlDiagram should generate the correct PlantUML diagram", () => {
  // Create a graph for testing
  const graph: mod.Graph<"A" | "B" | "C" | "D" | "E" | "F"> = {
    nodes: ["A", "B", "C", "D", "E", "F"],
    edges: [
      { from: "A", to: "B" },
      { from: "A", to: "C" },
      { from: "B", to: "D" },
      { from: "B", to: "E" },
      { from: "C", to: "D" },
      { from: "C", to: "F" },
      { from: "D", to: "E" },
      { from: "D", to: "F" },
      { from: "E", to: "F" },
      { from: "F", to: "A" },
    ],
  };

  // Generate the PlantUML diagram
  const diagram = mod.graphPlantUmlDiagram(graph, {
    node: (node) => ({ text: `rectangle ${node}` }),
    edge: (edge) => ({
      fromText: edge.from,
      toText: edge.to,
    }),
  });

  // Define the expected PlantUML diagram
  const expectedDiagram = `@startuml
rectangle A
rectangle B
rectangle C
rectangle D
rectangle E
rectangle F
A --> B
A --> C
B --> D
B --> E
C --> D
C --> F
D --> E
D --> F
E --> F
F --> A
@enduml`;

  // Compare the generated diagram with the expected diagram
  ta.assertEquals(diagram, expectedDiagram);
});
