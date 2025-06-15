import { useEffect } from "react";
import type { Table } from "../types";
import { ColumnTypeSelect } from "./ColumnTypeSelect";

type Props = {
  selectedTable: Table | null;
  onUpdateTable: (table: Table) => void;
  onRenameTable: (oldName: string, newName: string) => void;
  onDeleteTable: (name: string) => void;
};

const TableEditor = ({ selectedTable, onUpdateTable, onRenameTable, onDeleteTable }: Props) => {
  useEffect(() => {
    if (selectedTable) {
      onUpdateTable(selectedTable);
    }
  }, [selectedTable]);

  const handleColumnChange = (index: number, value: string) => {
    if (!selectedTable) return;
    const newColumns = [...selectedTable.columns];
    newColumns[index] = { ...newColumns[index], name: value };
    onUpdateTable({ ...selectedTable, columns: newColumns });
  };

  const handleTypeChange = (index: number, value: string) => {
    if (!selectedTable) return;
    const newColumns = [...selectedTable.columns];
    newColumns[index] = { ...newColumns[index], type: value };
    onUpdateTable({ ...selectedTable, columns: newColumns });
  };

  const handleAddColumn = () => {
    if (!selectedTable) return;
    const updated = {
      ...selectedTable,
      columns: [...selectedTable.columns, { name: "", type: "varchar" }],
    };
    onUpdateTable(updated);
  };

  const handleRemoveColumn = (index: number) => {
    if (!selectedTable) return;
    const newColumns = [...selectedTable.columns];
    newColumns.splice(index, 1);
    onUpdateTable({ ...selectedTable, columns: newColumns });
  };

  if (!selectedTable) {
    return <div className="text-gray-500 italic">Click table to edit.</div>;
  }

  return (
    <div>
            <div className="flex items-center gap-4 mb-4">
                <span className="text-lg font-semibold">Table: </span>
                <input
                  value={selectedTable.name}
                  onChange={(e) =>
                  onRenameTable(selectedTable.name, e.target.value.trim())
                  }
                  className="text-lg font-semibold border rounded px-2 py-1 focus:outline-none focus:ring-0 focus:border-gray-300"
                />
                <button
                  onClick={() => onDeleteTable(selectedTable.name)}
                  className="bg-red-500 ml-auto hover:bg-red-600 text-white px-4 py-2 rounded"
                  title="Delete table"
                >
                   Delete table 🗑️
                </button>
            </div>
      <table className="w-full text-sm border rounded-md shadow-sm bg-white">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2 border">#</th>
            <th className="p-2 border">Column Name</th>
            <th className="p-2 border">Data Type</th>
            <th className="p-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {selectedTable.columns.map((col, index) => (
            <tr key={index}>
              <td className="p-2 border">{index + 1}</td>
              <td className="p-2 border">
                <input
                  value={col.name}
                  onChange={(e) => handleColumnChange(index, e.target.value)}
                  className="w-full border rounded px-2 py-1"
                />
              </td>
              <td className="p-2 border text-center">
                 <ColumnTypeSelect value={col.type} onChange={(newType) => handleTypeChange(index, newType)} />
              </td>
              <td className="p-2 border text-center">
                <button
                  onClick={() => handleRemoveColumn(index)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete column"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={handleAddColumn}
        className="mt-3 text-sm text-blue-600 hover:underline"
      >
        + Add column
      </button>
    </div>
  );
};

export default TableEditor;
