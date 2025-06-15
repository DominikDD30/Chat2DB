from typing import List, Optional, Literal

from pydantic import BaseModel


class Column(BaseModel):
    name: str
    type: str


class Table(BaseModel):
    table_id:str
    name: str
    columns: List[Column]


class Relation(BaseModel):
    from_table: str
    from_table_id: str
    to_table: str
    to_table_id:str
    type: Literal["one-to-one", "one-to-many", "many-to-many"]


class DbSchema(BaseModel):
    tables: List[Table]
    relations: List[Relation]


class SchemaRequest(BaseModel):
    messages: list[dict[str, str]]
    dialect: Optional[str] = "postgresql"
    currentDb: Optional[DbSchema]


class ScriptRequest(BaseModel):
    dialect: str = "postgresql"
    currentDb: DbSchema


class SchemaResponse(BaseModel):
    response: str
    updatedDb: DbSchema


class ScriptResponse(BaseModel):
    sql: str
    message: str
