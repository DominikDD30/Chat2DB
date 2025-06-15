import { useState } from "react";
import type { Table,Relation } from "../types";
import TableEditor from "./TableEditor";
import RelationEditor from "./RelationEditor";

type Props = {
  selectedTable: Table | null;
  onUpdateTable: (table: Table) => void;
  onRenameTable: (oldName: string, newName: string) => void;
  onDeleteTable: (name: string) => void;
  tables: Table[];
  relations: Relation[];
  onUpdateRelations: (relations: Relation[]) => void;
};

const FooterPanel = ({ selectedTable, onUpdateTable, onRenameTable, onDeleteTable, tables, relations, onUpdateRelations }: Props) => {
  const [mode, setMode] = useState<"table" | "relations">("relations");

  return (
    <div className="h-[30vh] border-t shadow-inner p-4 bg-gray-50 overflow-y-auto relative">
      
      <div className="mb-4 flex gap-4">
        
        <button
          onClick={() => setMode("relations")}
          className={`px-4 py-2 rounded border ${mode === "relations" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
        >
          Edit relations
        </button>
        <button
          onClick={() => setMode("table")}
          className={`px-4 py-2 rounded border transition-all duration-200 ${mode === "table" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
        >
          Edit table
        </button>
      </div>

      <div className="w-full pr-4">
        {mode === "table" ? (
          <TableEditor selectedTable={selectedTable} onUpdateTable={onUpdateTable} onRenameTable={onRenameTable} onDeleteTable={onDeleteTable} />
        ) : (
          <RelationEditor
            tables={tables}
            relations={relations}
            onUpdateRelations={onUpdateRelations}
  />
        )}
      </div>
    </div>
  );
};

export default FooterPanel;
