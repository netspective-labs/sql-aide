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
  readonly nodes: Array<Node>;
  readonly edges: Array<Edge<Node, Node>>;
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
 * A function that supplies the identity of a node. Used to uniquely identify a
 * node in the graph.
 */
export type NodeIdentitySupplier<Node, NodeID> = (n: Node) => NodeID;

/**
 * A function that compares two nodes. Used for sorting and comparing nodes.
 */
export type NodeComparator<Node> = (n1: Node, n2: Node) => number;

/**
 * Returns true if a cycle is detected in the directed acyclic graph.
 * It uses depth-first search and keeps track of visited nodes and the recursion stack.
 * If a node is encountered that is already in the recursion stack, a cycle is detected.
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
 * Returns all the nodes and edges that form cycles in the directed acyclic
 * graph. It uses depth-first search and keeps track of visited nodes and the
 * recursion stack. If a node is encountered that is already in the recursion
 * stack, a cycle is detected and stored.
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
 * Returns the dependencies and dependents of a given node in a directed acyclic
 * graph (DAG) based on a provided topological sort. The function takes the
 * graph, topological sort, and the target node as input. It returns an object
 * with `dependencies` and `dependents` properties.
 */
export function dagDependencies<Node, NodeID>(
  graph: Graph<Node>,
  identity: NodeIdentitySupplier<Node, NodeID>,
  compare: NodeComparator<Node>,
  topologicalSortSupplier: (
    graph: Graph<Node>,
    identity: NodeIdentitySupplier<Node, NodeID>,
    compare: NodeComparator<Node>,
  ) => Array<Node>,
  targetNode: Node,
) {
  // Create a map of node ID to index in the topological sort
  const topologicalSort = topologicalSortSupplier(graph, identity, compare);

  const nodeIndexMap = new Map<NodeID, number>();
  const dependencies: Node[] = [];

  // Create a map of node ID to index in the topological sort
  for (let i = 0; i < topologicalSort.length; i++) {
    const node = topologicalSort[i];
    const nodeId = identity(node);
    nodeIndexMap.set(nodeId, i);
  }

  // Compute dependencies
  const targetNodeId = identity(targetNode);
  const targetIndex = nodeIndexMap.get(targetNodeId)!;
  for (const edge of graph.edges) {
    const fromId = identity(edge.from);
    const toId = identity(edge.to);
    const fromIndex = nodeIndexMap.get(fromId)!;
    const toIndex = nodeIndexMap.get(toId)!;

    if (toId === targetNodeId) {
      dependencies.push(edge.from);
    }

    if (fromIndex < targetIndex && toIndex > targetIndex) {
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
): Node[] {
  const visited = new Set<Node>();
  const ancestors: Node[] = [];

  // Depth-first traversal to find all ancestors
  function traverse(node: Node) {
    visited.add(node);

    const dependencies = graph.edges
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
      dagIsCyclicalDFS(graph, identity, compare),
    cycles: (graph: Graph<Node>) => dagCyclesDFS(graph, identity, compare),
    topologicalSort: (graph: Graph<Node>) =>
      dagTopologicalSortDFS(graph, identity, compare),
    ancestors: (graph: Graph<Node>, node: Node) =>
      dagAncestors(graph, identity, node),
    deps: (graph: Graph<Node>, node: Node) =>
      dagDependencies(graph, identity, compare, dagTopologicalSortDFS, node),
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
  const diagram = `@startuml\nleft to right direction\n\n${
    nodeLines.join("\n")
  }\n${edgeLines.join("\n")}\n@enduml`;
  return diagram;
}
