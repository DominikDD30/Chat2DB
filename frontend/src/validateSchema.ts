import type { DatabaseSchema } from "./types";

export const validateSchema = (schema: DatabaseSchema): string[] => {
  const errors: string[] = [];

  const tableNames = new Set<string>();
  const columnErrors = new Set<string>();

    if (schema.tables.length === 0) {
        errors.push("❌ Schemat nie zawiera żadnych tabel.");
    }
  for (const table of schema.tables) {
    if (tableNames.has(table.name)) {
      errors.push(`🔁 Duplikująca się tabela: "${table.name}"`);
    }
    tableNames.add(table.name);

    if (table.columns.length === 0) {
      errors.push(`⚠️ Tabela "${table.name}" nie zawiera żadnych kolumn.`);
    }

    const columnNames = new Set<string>();
    for (const col of table.columns) {
      if (columnNames.has(col.name)) {
        columnErrors.add(
          `🔁 Duplikująca się kolumna "${col.name}" w tabeli "${table.name}"`
        );
      }
      columnNames.add(col.name);

      if (!col.type) {
        errors.push(`❌ Kolumna "${col.name}" w "${table.name}" nie ma typu.`);
      }
    }
  }

  columnErrors.forEach((e) => errors.push(e));

  for (const rel of schema.relations) {
    if (!tableNames.has(rel.from_table)) {
      errors.push(`❌ Relacja wychodzi z nieistniejącej tabeli "${rel.from_table}"`);
    }
    if (!tableNames.has(rel.to_table)) {
      errors.push(`❌ Relacja prowadzi do nieistniejącej tabeli "${rel.to_table}"`);
    }

    if (rel.from_table === rel.to_table) {
      errors.push(`⚠️ Relacja z tabeli "${rel.from_table}" do samej siebie`);
    }

    if (!["one-to-one", "one-to-many", "many-to-many"].includes(rel.type)) {
      errors.push(`❌ Nieznany typ relacji "${rel.type}"`);
    }
  }

  return errors;
};
