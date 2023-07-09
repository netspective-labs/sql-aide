/*
 * This module provides functions for working with different types of graphs.
 * As of July 2023 the focus for this module is on DAGs but more types can be
 * added later.
 *
 * General Graph Interfaces:
 * - Graph: Represents the graph structure containing nodes and edges.
 * - Node: Represents a vertex in a DAG or node for any other kind of graph.
 * - Edge: Represents a directed edge connecting two nodes in the graph.
 * - NodeIdentitySupplier: A function that supplies a unique node identifier.
 * - NodeComparator: A function that compares two nodes for equality.
 *
 * Graphs, Nodes, Edges, Identities, and Comparators should remain graph-type-
 * indepenedent (meaning whether it's a DAG or any other kind of graph). The
 * interfaces should be generic and type-safe and assume to be used in a
 * functional composition model (not class-based). Classes may be created on
 * top of functions if desired.
 *
 * Using the interfaces described above, this module provides functions for
 * working with Directed Acyclic Graphs (DAGs). All DAG-specific functions are
 * prefixed with `dag`. It includes operations such as topological sort, cycle
 * detection, traversal, and computing dependencies and parallelizability of
 * nodes.
 */

/**
 * A function that supplies the identity of a node. Used to uniquely identify a
 * node in the graph.
 */
export type NodeIdentitySupplier<Node, NodeID> = (n: Node) => NodeID;

/**
 * A function that compares two nodes. Used for sorting and comparing nodes.
 * Returns -1 if n1 is "less than" n2, 0 if equal, +1 if "greater than".
 */
export type NodeComparator<Node> = (n1: Node, n2: Node) => number;

/**
 * Represents an edge in the graph with a `from` node and a `to` node
 */
export interface Edge<FromNode, ToNode> {
  readonly from: FromNode;
  readonly to: ToNode;
}

/**
 * Represents a graph data structure with a list of nodes and edges
 */
export interface Graph<Node> {
  readonly nodes: Iterable<Node>;
  readonly edges: Iterable<Edge<Node, Node>>;
}

/**
 * Build a graph from a set of nodes and edges
 * @param nodesSupplier a function, generator or array of nodes
 * @param edgesSupplier a function, generator or array of edges
 * @returns a Graph instance
 */
export function graph<Node>(
  nodesSupplier:
    | Iterable<Node>
    | ArrayLike<Node>
    | Generator<Node>
    | (() => Iterable<Node> | ArrayLike<Node> | Generator<Node>),
  edgesSupplier:
    | Iterable<Edge<Node, Node>>
    | ArrayLike<Edge<Node, Node>>
    | Generator<Edge<Node, Node>>
    | ((
      nodes: Array<Node>,
    ) =>
      | Iterable<Edge<Node, Node>>
      | ArrayLike<Edge<Node, Node>>
      | Generator<Edge<Node, Node>>),
) {
  const nodes = Array.from(
    typeof nodesSupplier === "function" ? nodesSupplier() : nodesSupplier,
  );

  const edges = Array.from(
    typeof edgesSupplier === "function" ? edgesSupplier(nodes) : edgesSupplier,
  );

  const invalidEdges = edges.filter(
    (edge) => !nodes.includes(edge.from) || !nodes.includes(edge.to),
  );

  const result: Graph<Node> = { nodes, edges };
  return invalidEdges.length > 0 ? { ...result, invalidEdges } : result;
}

/**
 * Build a graph from a set of edges, inferring the nodes from the edges
 * @param edgesSupplier a function, generator or array of edges
 * @returns a Graph instance
 */
export function edgesGraph<Node>(
  edgesSupplier:
    | Iterable<Edge<Node, Node>>
    | ArrayLike<Edge<Node, Node>>
    | Generator<Edge<Node, Node>>
    | (() =>
      | Iterable<Edge<Node, Node>>
      | ArrayLike<Edge<Node, Node>>
      | Generator<Edge<Node, Node>>),
) {
  const edges = Array.from(
    typeof edgesSupplier === "function" ? edgesSupplier() : edgesSupplier,
  );

  // create a set to keep unique nodes
  const nodesSet = new Set<Node>();

  // iterate over each edge and add 'from' and 'to' nodes to the set
  for (const edge of edges) {
    nodesSet.add(edge.from);
    nodesSet.add(edge.to);
  }

  return graph<Node>(Array.from(nodesSet), edges);
}

/**
 * Returns true if a cycle is detected in the graph. It uses depth-first search
 * and keeps track of visited nodes and the recursion stack. If a node is
 * encountered that is already in the recursion stack, a cycle is detected.
 */
export function dagIsCyclicalDFS<Node, NodeID>(
  graph: Graph<Node>,
  identity: NodeIdentitySupplier<Node, NodeID>,
  compare: NodeComparator<Node>,
): boolean {
  const visited: Set<NodeID> = new Set();
  const recursionStack: Set<NodeID> = new Set();

  for (const node of graph.nodes) {
    if (dagDFS(node, visited, recursionStack)) return true;
  }

  function dagDFS(
    node: Node,
    visited: Set<NodeID>,
    recursionStack: Set<NodeID>,
  ): boolean {
    const nodeId = identity(node);
    visited.add(nodeId);
    recursionStack.add(nodeId);

    for (const edge of graph.edges) {
      if (compare(edge.from, node) === 0) {
        const neighbour = edge.to;

        if (
          !visited.has(identity(neighbour)) &&
          dagDFS(neighbour, visited, recursionStack)
        ) return true;
        else if (recursionStack.has(identity(neighbour))) return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  return false;
}

/**
 * Returns all the nodes and edges that form cycles in the graph. It uses depth-
 * first search and keeps track of visited nodes and the recursion stack. If a
 * node is encountered that is already in the recursion stack, a cycle is
 * detected and stored.
 */
export function dagCyclesDFS<Node, NodeID>(
  graph: Graph<Node>,
  identity: NodeIdentitySupplier<Node, NodeID>,
  compare: NodeComparator<Node>,
): Array<{ cycleNodes: Array<Node>; cycleEdges: Array<Edge<Node, Node>> }> {
  const visited: Set<NodeID> = new Set();
  const recursionStack: Set<NodeID> = new Set();
  const cycleList: Array<
    { cycleNodes: Array<Node>; cycleEdges: Array<Edge<Node, Node>> }
  > = [];

  for (const node of graph.nodes) {
    if (!visited.has(identity(node))) {
      const cycleNodes: Array<Node> = [];
      const cycleEdges: Array<Edge<Node, Node>> = [];
      if (dagDFS(node, visited, recursionStack, cycleNodes, cycleEdges)) {
        cycleList.push({ cycleNodes, cycleEdges });
      }
    }
  }

  function dagDFS(
    node: Node,
    visited: Set<NodeID>,
    recursionStack: Set<NodeID>,
    cycleNodes: Array<Node>,
    cycleEdges: Array<Edge<Node, Node>>,
  ): boolean {
    const nodeId = identity(node);
    visited.add(nodeId);
    recursionStack.add(nodeId);
    cycleNodes.push(node);

    for (const edge of graph.edges) {
      if (compare(edge.from, node) === 0) {
        const neighbour = edge.to;
        cycleEdges.push(edge);

        if (!visited.has(identity(neighbour))) {
          if (
            dagDFS(neighbour, visited, recursionStack, cycleNodes, cycleEdges)
          ) return true;
        } else if (recursionStack.has(identity(neighbour))) {
          return true;
        }

        cycleEdges.pop();
      }
    }

    recursionStack.delete(nodeId);
    cycleNodes.pop();
    return false;
  }

  return cycleList;
}

/**
 * Performs a topological sort on the directed acyclic graph and returns an
 * array of nodes in sorted order. It relies on the fact that a directed acyclic
 * graph (DAG) can be sorted in a linear order.
 */
export function dagTopologicalSortDFS<Node, NodeID>(
  graph: Graph<Node>,
  identity: NodeIdentitySupplier<Node, NodeID>,
  compare: NodeComparator<Node>,
): Array<Node> {
  const visited: Set<NodeID> = new Set();
  const stack: Array<Node> = [];

  for (const node of graph.nodes) {
    if (!visited.has(identity(node))) {
      dagDFS(node);
    }
  }

  function dagDFS(node: Node) {
    visited.add(identity(node));

    for (const edge of graph.edges) {
      if (compare(edge.from, node) === 0) {
        const neighbour = edge.to;
        if (!visited.has(identity(neighbour))) {
          dagDFS(neighbour);
        }
      }
    }

    stack.push(node);
  }

  return stack.reverse();
}

/**
 * Computes the dependencies of a given node in a DAG. It takes the graph, the
 * node identity supplier, and the target node. Returns an array of dependencies
 * of the specified node.
 */
export function dagDependencies<Node, NodeID>(
  graph: Graph<Node>,
  identity: NodeIdentitySupplier<Node, NodeID>,
  targetNode: Node,
) {
  const dependencies: Node[] = [];
  for (const edge of graph.edges) {
    if (identity(edge.to) === identity(targetNode)) {
      dependencies.push(edge.from);
    }
  }
  return dependencies;
}

/**
 * Function dagAncestors - Computes all the dependencies (ancestors) of a given node in a DAG.
 * It takes the graph, the node identity supplier, and the target node.
 * Returns an array of all the ancestors (dependencies) of the specified node.
 */
export function dagAncestors<Node, NodeID>(
  graph: Graph<Node>,
  identity: (node: Node) => NodeID,
  targetNode: Node,
) {
  const edges = Array.from(graph.edges);
  const visited = new Set<Node>();
  const ancestors: Node[] = [];

  // Depth-first traversal to find all ancestors
  function traverse(node: Node) {
    visited.add(node);

    const dependencies = edges
      .filter((edge) => identity(edge.to) === identity(node))
      .map((edge) => edge.from);

    for (const dependency of dependencies) {
      if (!visited.has(dependency)) {
        ancestors.push(dependency);
        traverse(dependency);
      }
    }
  }

  traverse(targetNode);
  return ancestors;
}

/**
 * A parallelizable node in a DAG is one that can be executed concurrently with
 * other tasks, offering the opportunity for parallel execution and potential
 * performance improvements.
 *
 * In a DAG, nodes represent tasks or operations, and edges represent
 * dependencies between the tasks. The dependencies determine the order in which
 * the tasks need to be executed. However, some nodes in the graph may not have
 * any dependencies or have dependencies that can be satisfied concurrently.
 *
 * These nodes are considered parallelizable because they can be executed
 * simultaneously without affecting the correctness or order of execution of
 * other nodes.
 */
export function dagIsNodeParallelizable<Node, NodeID>(
  graph: Graph<Node>,
  identity: NodeIdentitySupplier<Node, NodeID>,
  targetNode: Node,
) {
  const edges = Array.from(graph.edges);

  for (const edge of graph.edges) {
    if (identity(edge.to) === identity(targetNode)) {
      const fromId = identity(edge.from);
      if (!edges.some((e) => identity(e.to) === fromId)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Iterates each node in topological sort order and manages state for visited
 * nodes and parallelizability. It takes the graph and the topological sort of
 * the graph. Returns a generator that provides the current node, whether it is
 * parallelizable, and marking nodes as visited (as "predecessors").
 */
export function* dagExecutionPlan<Node, NodeID>(
  graph: Graph<Node>,
  identity: NodeIdentitySupplier<Node, NodeID>,
  compare: NodeComparator<Node>,
  topologicalSortSupplier: (
    graph: Graph<Node>,
    identity: NodeIdentitySupplier<Node, NodeID>,
    compare: NodeComparator<Node>,
  ) => Array<Node>,
) {
  const topologicalSort = topologicalSortSupplier(graph, identity, compare);
  const predecessors = new Set<Node>();

  // Iterate over the topological sort
  for (const node of topologicalSort) {
    yield {
      node,
      predecessors,
      ancestors: () => dagAncestors(graph, identity, node),
      deps: () => dagDependencies(graph, identity, node),
      isParallelizable: () => dagIsNodeParallelizable(graph, identity, node),
    };
    predecessors.add(node);
  }
}

export function dagExecutionPlantUmlDiagram<Node, NodeID>(
  graph: Graph<Node>,
  identity: NodeIdentitySupplier<Node, NodeID>,
  compare: NodeComparator<Node>,
  topologicalSortSupplier: (
    graph: Graph<Node>,
    identity: NodeIdentitySupplier<Node, NodeID>,
    compare: NodeComparator<Node>,
  ) => Array<Node>,
): string {
  const topologicalSort = topologicalSortSupplier(graph, identity, compare);
  const nodeLines: string[] = [];
  const edgeLines: string[] = [];

  for (const node of topologicalSort) {
    const text = identity(node);
    const isP = dagIsNodeParallelizable(graph, identity, node);
    const nodeLine = `${isP ? `label` : "queue"} dag${text} as "${text}"`;
    nodeLines.push(nodeLine);
  }

  if (topologicalSort.length > 1) {
    edgeLines.push(`DAG --> dag${identity(topologicalSort[0])}`);
    for (let i = 0; i < topologicalSort.length - 1; i++) {
      const node = topologicalSort[i];
      // deno-fmt-ignore
      const edgeLine = `dag${identity(node)} --> dag${identity(topologicalSort[i+1])}`;
      edgeLines.push(edgeLine);
    }
  }

  for (const node of graph.nodes) {
    const text = identity(node);
    const nodeLine = `rectangle g${text} as "${text}"`;
    nodeLines.push(nodeLine);
  }

  let first = true;
  for (const edge of graph.edges) {
    if (first) {
      edgeLines.push(`Graph --> g${identity(edge.from)}`);
      first = false;
    }
    const edgeLine = `g${identity(edge.from)} --> g${identity(edge.to)}`;
    edgeLines.push(edgeLine);
  }

  // Generate the PlantUML diagram
  const diagram = `@startuml\nleft to right direction\n${
    nodeLines.join("\n")
  }\n${edgeLines.join("\n")}\n@enduml`;
  return diagram;
}

/**
 * Directed Acyclic Graph (DAG) depth-first algorithm bundle. This is the object
 * that should typically be used for DAG interactions. The `dag*` functions are
 * available when you need more flexibility.
 * @param identity function which uniquely identify a node in the graph.
 * @param compare function that compares two nodes, used for sorting and comparing nodes.
 * @returns an object with functions to manage a DAG using depth-first algorithm
 */
export const dagDepthFirst = <Node, NodeID>(
  identity: NodeIdentitySupplier<Node, NodeID>,
  compare: NodeComparator<Node>,
) => {
  return {
    isCyclical: (graph: Graph<Node>) =>
      dagIsCyclicalDFS<Node, NodeID>(graph, identity, compare),
    cycles: (graph: Graph<Node>) =>
      dagCyclesDFS<Node, NodeID>(graph, identity, compare),
    topologicalSort: (graph: Graph<Node>) =>
      dagTopologicalSortDFS<Node, NodeID>(graph, identity, compare),
    ancestors: (graph: Graph<Node>, node: Node) =>
      dagAncestors<Node, NodeID>(graph, identity, node),
    deps: (graph: Graph<Node>, node: Node) =>
      dagDependencies<Node, NodeID>(graph, identity, node),
    executionPlan: (graph: Graph<Node>) =>
      dagExecutionPlan<Node, NodeID>(
        graph,
        identity,
        compare,
        dagTopologicalSortDFS,
      ),
    diagram: (graph: Graph<Node>) =>
      dagExecutionPlantUmlDiagram(
        graph,
        identity,
        compare,
        dagTopologicalSortDFS,
      ),
  };
};

/**
 * Generates a PlantUML diagram of a given graph.
 * It accepts a graph, node configuration, and edge configuration to customize the diagram.
 * Returns a string representing the PlantUML diagram.
 */
export function graphPlantUmlDiagram<Node>(
  graph: Graph<Node>,
  pumlOptions: {
    readonly diagramFeatures?: string;
    readonly node: (
      node: Node,
    ) => { readonly text: string; readonly features?: string };
    readonly edge: (
      edge: Edge<Node, Node>,
    ) => {
      readonly fromText: string;
      readonly toText: string;
      readonly features?: string;
    };
  },
): string {
  const nodeLines: string[] = [];
  const edgeLines: string[] = [];

  // Process nodes
  for (const node of graph.nodes) {
    const { text, features } = pumlOptions.node(node);
    const nodeLine = `${text}${features ? ` ${features}` : ""}`;
    nodeLines.push(nodeLine);
  }

  // Process edges
  for (const edge of graph.edges) {
    const { fromText, toText, features } = pumlOptions.edge(edge);
    const edgeLine = `${fromText} --> ${toText}${
      features ? ` ${features}` : ""
    }`;
    edgeLines.push(edgeLine);
  }

  // Generate the PlantUML diagram
  const diagram = `@startuml${
    pumlOptions?.diagramFeatures ? `\n${pumlOptions.diagramFeatures}` : ""
  }\n${nodeLines.join("\n")}\n${edgeLines.join("\n")}\n@enduml`;
  return diagram;
}

export function typicalPlantUmlDiagram<Node>(graph: Graph<Node>) {
  return graphPlantUmlDiagram(graph, {
    diagramFeatures: `left to right direction\n`,
    node: (node) => ({ text: `rectangle ${node}` }),
    edge: (edge) => ({
      fromText: String(edge.from),
      toText: String(edge.to),
    }),
  });
}
