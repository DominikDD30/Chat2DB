import dagre from "dagre";
import type { Node, Edge } from "reactflow";

// Rozmiar węzła — powinien być zbliżony do Twoich komponentów
const nodeWidth = 200;
const nodeHeight = 100;

export function layoutGraph(
  nodes: Node[],
  edges: Edge[],
  direction: "LR" | "TB" = "LR"
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  // Dodajemy węzły do grafu
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Dodajemy krawędzie do grafu
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target, {
      minlen: edge.data?.type === "one-to-one" ? 1 : 2,
      weight: 2,
      labeloffset: 20,
    });
  });

  dagre.layout(dagreGraph);

  // Przepisujemy pozycje z dagre do reactflow
  const layoutedNodes = nodes.map((node) => {
    const { x, y } = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x, y },
      // wymagane przez ReactFlow do unikania przeliczeń layoutu
      positionAbsolute: { x, y },
    };
  });

  return { nodes: layoutedNodes, edges };
}
