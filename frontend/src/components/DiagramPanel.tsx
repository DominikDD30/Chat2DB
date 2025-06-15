import { useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Relation, Table } from "../types";
import { layoutGraph } from "../lib/layoutGraph";

type Props = {
  currentDb: {
    tables: Table[];
    relations: Relation[];
  };
  onSelectTable: (table: Table | null) => void;
};

const Diagram = ({ currentDb, onSelectTable }: Props) => {
  const { tables, relations } = currentDb;
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [autoLayout, setAutoLayout] = useState(true);
  const layoutedNodesRef = useRef<Node[]>([]);
  const layoutedEdgesRef = useRef<Edge[]>([]);

  useEffect(() => {
    const baseNodes: Node[] = tables.map((table) => ({
      id: table.table_id,
      position: { x: 0, y: 0 },
      data: {
        label: (
          <div
            className={`transition-all duration-300 ${
              selectedTable === table.table_id ? "bg-yellow-100 rounded p-1" : ""
            }`}
          >
            <strong>{table.name}</strong>
            <ul className="text-xs text-left mt-1">
              {table.columns.map((col) => (
                <li key={col.name}>
                  • {col.name} | {col.type}
                </li>
              ))}
            </ul>
          </div>
        ),
      },
      type: "default",
    }));

    const baseEdges: Edge[] = relations.map((rel, i) => ({
      id: `e-${i}`,
      source: rel.from_table_id,
      target: rel.to_table_id,
      label: rel.type,
      type: "smoothstep",
      animated: true,
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutGraph(baseNodes, baseEdges, "LR");

    layoutedNodesRef.current = layoutedNodes;
    layoutedEdgesRef.current = layoutedEdges;

    if (autoLayout) {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } else {
      setNodes((prevNodes) =>
        baseNodes.map((node) => {
          const existing = prevNodes.find((n) => n.id === node.id);
          return existing ?? node;
        })
      );
      setEdges(baseEdges);
    }

    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  }, [currentDb]);

  useEffect(() => {
    if (autoLayout) {
      setNodes(layoutedNodesRef.current);
      setEdges(layoutedEdgesRef.current);
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 100);
    }
  }, [autoLayout]);

  const handleNodeClick = (_: unknown, node: Node) => {
    const table = tables.find((t) => t.table_id === node.id);
    setSelectedTable(table?.table_id ?? null);
    onSelectTable(table ?? null);
  };

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-2 left-2 z-10 bg-gray-300 p-2 rounded shadow flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          Auto layout
          <input
            type="checkbox"
            checked={autoLayout}
            onChange={() => setAutoLayout((prev) => !prev)}
            className="w-4 h-4 accent-indigo-500"
          />
        </label>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        panOnDrag
        nodesDraggable
        zoomOnScroll
        className="bg-white rounded shadow"
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

const DiagramPanel = (props: Props) => (
  <div className="w-full h-full p-2 bg-gray-100 rounded">
    <ReactFlowProvider>
      <Diagram {...props} />
    </ReactFlowProvider>
  </div>
);

export default DiagramPanel;
