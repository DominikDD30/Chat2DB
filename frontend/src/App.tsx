import { useState, useRef, useEffect } from "react";
import ChatPanel from "./components/ChatPanel";
import DiagramPanel from "./components/DiagramPanel";
import type { DatabaseSchema, Table, Relation } from "./types";
import FooterPanel from "./components/FooterPanel";
import { validateSchema } from "./validateSchema";

function App() {
  const [isTooSmallScreen, setIsTooSmallScreen] = useState(false);
  const [currentDb, setCurrentDb] = useState<DatabaseSchema>({
    tables: [],
    relations: [],
  }
  );
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [generatedSql, setGeneratedSql] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);

  const chatRef = useRef<{ pushMessage: (text: string) => void } | null>(null);

  const [isSchemaValid, setIsSchemaValid] = useState(false);

  useEffect(() => {
  const checkScreenSize = () => {
    setIsTooSmallScreen(window.innerWidth < 900);
  };

  checkScreenSize(); // initial check
  window.addEventListener("resize", checkScreenSize);

  return () => window.removeEventListener("resize", checkScreenSize);
}, []);

  useEffect(() => {
    const errors = validateSchema(currentDb);
    setIsSchemaValid(errors.length === 0 && currentDb.tables.length > 0);
  }, [currentDb]);

  const handleUpdateTable = (updated: Table) => {
    setCurrentDb((prev) => ({
      ...prev,
      tables: prev.tables.map((t) => (t.name === updated.name ? updated : t)),
    }));
  };

  const handleGenerateDb = async () => {
  setIsLoading(true);
  try {
    const response = await fetch("http://localhost:5050/generate/dbsql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentDb: currentDb,
        dialect: "postgres",
      }),
    });

    const data = await response.json();

    if (data.sql && data.sql.trim() !== "") {
      setGeneratedSql(data.sql);
      setShowSqlModal(true);
    } 
    chatRef.current?.pushMessage(data.message);
  } catch (error) {
    console.error("An error occurred while connecting to the server:", error);
    chatRef.current?.pushMessage("⚠️ An error occurred while connecting to the server.");
  } finally {
    setIsLoading(false);
  }
};

  const handleUpdateRelations = (updated: Relation[]) => {
    setCurrentDb((prev) => ({
      ...prev,
      relations: updated,
    }));
  };

  const handleResetSchema = () => {
    setCurrentDb({ tables: [], relations: [] });
    chatRef.current?.pushMessage("🧹 Schema has been reseted.");
  };


  const handleRenameTable = (oldName: string, newName: string) => {
  setCurrentDb((prev) => ({
    ...prev,
    tables: prev.tables.map((t) =>
      t.name === oldName ? { ...t, name: newName } : t
    ),
    relations: prev.relations.map((r) => ({
      ...r,
      from_table: r.from_table === oldName ? newName : r.from_table,
      to_table: r.to_table === oldName ? newName : r.to_table,
    })),
  }));
  setSelectedTableName(newName);
};

const handleAddTable = () => {
  const newName = `table_${currentDb.tables.length + 1}`;
  const newTable: Table = {
    table_id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    name: newName,
    columns: [
      { name: "id", type: "uuid" },
    ],
  };

  setCurrentDb((prev) => ({
    ...prev,
    tables: [...prev.tables, newTable],
  }));

  setSelectedTableName(newName);
};

const handleDeleteTable = (tableName: string) => {
  setCurrentDb((prev) => ({
    tables: prev.tables.filter((t) => t.name !== tableName),
    relations: prev.relations.filter(
      (r) => r.from_table !== tableName && r.to_table !== tableName
    ),
  }));
  setSelectedTableName(null);
};

  if (isTooSmallScreen) {
  return (
    <div className="h-screen flex items-center justify-center p-8 text-center bg-yellow-100">
      <div className="max-w-md bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-4">🔍 To small display</h1>
        <p className="text-gray-700">
          This application does not support small screens. Please open it on a device with a larger resolution (min. 900px width).
        </p>
      </div>
    </div>
  );
}

  return (
    <div className="h-screen flex flex-col">
      <div className="absolute top-0 right-0 m-4 z-10 flex gap-2">
        <button
            onClick={handleAddTable}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            ➕ Add table
        </button>
        <button
          onClick={() => {
            const errors = validateSchema(currentDb);
            if (errors.length === 0) {
              chatRef.current?.pushMessage("✅ Schema is correct.");
            } else {
              chatRef.current?.pushMessage("❌ Detected issues:\n" + errors.join("\n"));
            }
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
        >
          Validate schema
        </button>

        <button
          onClick={handleResetSchema}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Reset schema
        </button>

        <button
          className={`px-4 py-2 w-38 rounded flex justify-center items-center ${
            isSchemaValid
              ? "bg-indigo-500 hover:bg-indigo-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isSchemaValid}
          onClick={handleGenerateDb}
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
              ></circle>
              <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          ) : (
            "Export db"
          )}
        </button>
      </div>

      <div className="flex flex-1">
        <div className="w-[35%] h-[70vh] border-r p-2">
          <ChatPanel ref={chatRef} currentDb={currentDb} onUpdateDb={setCurrentDb} />
        </div>
        <div className="w-[65%] h-[70vh]">
          <DiagramPanel onSelectTable={(table) => setSelectedTableName(table ? table.name : null)} currentDb={currentDb}/>
        </div>
      </div>

      <FooterPanel
        selectedTable={currentDb.tables.find(t => t.name === selectedTableName) || null}
        onUpdateTable={handleUpdateTable}
        onRenameTable={handleRenameTable}
        onDeleteTable={handleDeleteTable}
        tables={currentDb.tables}
        relations={currentDb.relations}
        onUpdateRelations={handleUpdateRelations}
      />
      {showSqlModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full relative">
              <h2 className="text-xl font-semibold mb-4">📄 Generated SQL</h2>
              <textarea
                className="w-full h-64 p-2 border rounded resize-none font-mono text-sm overflow-auto"
                readOnly
                value={generatedSql}
              />
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedSql);
                  }}
                >
                  Copy
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={() => setShowSqlModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default App;
