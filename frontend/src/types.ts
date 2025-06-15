export type Column ={
  name: string;
  type: string;
}

export type Table = {
  table_id: string;
  name: string;
  columns: Column[];
};

export type Relation = {
  from_table: string;
  from_table_id: string;
  to_table: string;
  to_table_id: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
};

export type DatabaseSchema = {
  tables: Table[];
  relations: Relation[];
};