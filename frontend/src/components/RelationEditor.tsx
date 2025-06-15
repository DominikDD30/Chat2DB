import { useState } from "react";
import type { Relation, Table } from "../types";

type Props = {
  tables: Table[];
  relations: Relation[];
  onUpdateRelations: (updated: Relation[]) => void;
};

const emptyRelation: Relation = {
  from_table: "",
  to_table: "",
  from_table_id: "",
  to_table_id: "",
  type: "one-to-many",
};

const RelationEditor = ({ tables, relations, onUpdateRelations }: Props) => {
  const [newRelation, setNewRelation] = useState<Relation>(emptyRelation);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleSaveRelation = () => {
    const from = tables.find((t) => t.table_id === newRelation.from_table_id);
    const to = tables.find((t) => t.table_id === newRelation.to_table_id);

    if (!from || !to) return;

    const updatedRelation: Relation = {
      ...newRelation,
      from_table: from.name,
      to_table: to.name,
    };

    const updated = [...relations];
    if (editIndex !== null) {
      updated[editIndex] = updatedRelation;
    } else {
      updated.push(updatedRelation);
    }

    onUpdateRelations(updated);
    setNewRelation(emptyRelation);
    setEditIndex(null);
  };

  const handleEditRelation = (index: number) => {
    const rel = relations[index];
    setNewRelation({
      from_table: rel.from_table,
      to_table: rel.to_table,
      from_table_id: rel.from_table_id,
      to_table_id: rel.to_table_id,
      type: rel.type,
    });
    setEditIndex(index);
  };

  const handleRemoveRelation = (index: number) => {
    const updated = relations.filter((_, i) => i !== index);
    onUpdateRelations(updated);
    if (editIndex === index) {
      setNewRelation(emptyRelation);
      setEditIndex(null);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Relations</h2>

      <div className="grid grid-cols-4 gap-4 items-end mb-6">
        <div>
          <label className="block text-sm mb-1">Source Table</label>
          <select
            value={newRelation.from_table_id}
            onChange={(e) => setNewRelation({ ...newRelation, from_table_id: e.target.value })}
            className="w-full border rounded px-2 py-1"
          >
            <option value="">-- select --</option>
            {tables.map((t) => (
              <option key={t.table_id} value={t.table_id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Target Table</label>
          <select
            value={newRelation.to_table_id}
            onChange={(e) => setNewRelation({ ...newRelation, to_table_id: e.target.value })}
            className="w-full border rounded px-2 py-1"
          >
            <option value="">-- select --</option>
            {tables.map((t) => (
              <option key={t.table_id} value={t.table_id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Relation Type</label>
          <select
            value={newRelation.type}
            onChange={(e) => setNewRelation({ ...newRelation, type: e.target.value as Relation["type"] })}
            className="w-full border rounded px-2 py-1"
          >
            <option value="one-to-one">1 : 1</option>
            <option value="one-to-many">1 : N</option>
            <option value="many-to-many">N : N</option>
          </select>
        </div>

        <button
          onClick={handleSaveRelation}
          className={`${
            editIndex !== null ? "bg-yellow-500 hover:bg-yellow-600" : "bg-indigo-500 hover:bg-indigo-600"
          } text-white px-4 py-2 rounded transition-colors col-span-4 sm:col-span-1`}
        >
          {editIndex !== null ? "Save changes" : "Add relation"}
        </button>
      </div>

      {relations.length === 0 ? (
        <p className="text-gray-500 italic">No relations in the schema.</p>
      ) : (
        <table className="w-full text-sm border rounded-md shadow-sm bg-white">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2 border">Source</th>
              <th className="p-2 border">Target</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {relations.map((rel, index) => (
              <tr key={index}>
                <td className="p-2 border">{rel.from_table}</td>
                <td className="p-2 border">{rel.to_table}</td>
                <td className="p-2 border">{rel.type}</td>
                <td className="p-2 border text-center space-x-2">
                  <button
                    onClick={() => handleEditRelation(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleRemoveRelation(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RelationEditor;
