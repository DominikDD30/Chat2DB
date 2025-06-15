import json

from pydantic import ValidationError

from models import SchemaRequest, SchemaResponse, DbSchema, Table, Column, Relation
from prompts.database_prompts import DatabasePrompts


class DatabaseService:
    def __init__(self, llm_service):
        self.llm_service = llm_service

    def generate_schema(self, request: SchemaRequest) -> SchemaResponse:
        intent_prompt = DatabasePrompts.check_if_generate_schema(request.messages)
        intent_response = self.llm_service.send_prompt(
            user_prompt=intent_prompt,
            system_prompt="You are an expert in relational databases and SQL.",
            temperature=0.2
        )

        try:
            llm_recognition = json.loads(intent_response)
        except json.JSONDecodeError:
            return SchemaResponse(
                response="Sorry, I couldn't understand your question. Please try again.",
                updatedDb=DbSchema(tables=[], relations=[])
            )

        if llm_recognition.get("was_related") != "yes":
            return SchemaResponse(
                response=llm_recognition.get("answer", "Sorry, I cannot help with that."),
                updatedDb=request.currentDb
            )

        updated_db = self._generate_sql_schema(
            user_messages=request.messages,
            database_dialect=request.dialect,
            current_db_state=request.currentDb
        )

        summary_prompt = DatabasePrompts.get_user_answer_template(
            previous_db_state=request.currentDb,
            current_db_state=updated_db.model_dump_json(indent=2),
            user_question=request.messages
        )

        response_for_user = self.llm_service.send_prompt(
            user_prompt=summary_prompt,
            system_prompt="You are an expert in relational databases and SQL.",
            temperature=0.9
        )

        return SchemaResponse(
            response=response_for_user,
            updatedDb=updated_db
        )

    def _generate_sql_schema(
        self,
        user_messages: list[dict[str, str]],
        database_dialect: str,
        current_db_state: DbSchema = None
    ) -> DbSchema:
        prompt = DatabasePrompts.generate_sql_schema(
            user_messages=user_messages,
            database_dialect=database_dialect,
            current_db_state=current_db_state.model_dump_json() if current_db_state else None
        )

        raw_response = self.llm_service.send_prompt(
            user_prompt=prompt,
            system_prompt="You are an expert in relational databases and SQL."
        )

        try:
            parsed = json.loads(raw_response)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON returned from LLM: {e}\nRaw response: {raw_response}")

        try:
            schema = parsed["schema"]
            raw_tables = schema["tables"]
            raw_relations = schema["relations"]

            tables = [Table(
                table_id=table.get("table_id"),
                name=table.get("name"),
                columns=[Column(**col) for col in table.get("columns", [])]
            ) for table in raw_tables]

            relations = self._deduplicate_many_to_many_relations(raw_relations)
            # relations = self.add_table_ids_to_relations(relations)

            return DbSchema(tables=tables, relations=relations)

        except (TypeError, KeyError, ValidationError) as e:
            print("Failed map schema, wrong schema structure:")
            print(json.dumps(parsed, indent=2))
            raise ValueError(f"error: {e}")

    @staticmethod
    def _deduplicate_many_to_many_relations(relations: list[dict]) -> list[Relation]:
        seen = set()
        filtered = []

        for rel in relations:
            if rel["type"] == "many-to-many":
                key = tuple(sorted([rel["from_table"], rel["to_table"]]))
                if key not in seen:
                    seen.add(key)
                    filtered.append(rel)
            else:
                filtered.append(rel)

        # Convert to Relation models
        return [Relation(**rel) for rel in filtered]
