import sqlglot
from sqlglot import ParseError
from models import DbSchema, ScriptResponse
from prompts.script_prompts import ScriptPrompts
from services.llm_service import LLMClient


class SQLScriptService:
    def __init__(self, llm_service: LLMClient):
        self.llm_service = llm_service

    def generate_sql_script(self, current_db_state: DbSchema, dialect: str)->ScriptResponse:
        sql_script = self.llm_service.send_prompt(
            user_prompt=ScriptPrompts.generate_sql_schema_script_template(current_db_state, dialect),
            system_prompt="You are an expert in relational databases and SQL.",
            temperature=0.2
        )
        print(sql_script)
        if sql_script.startswith("```sql") and sql_script.endswith("```"):
            sql_script = sql_script[7:-3].strip()
        is_valid, message = self._is_valid_sql(sql_script, dialect)

        return ScriptResponse(
            sql=sql_script if is_valid else "",
            message=message
        )

    def _is_valid_sql(self, sql: str, dialect: str = "postgresql") -> tuple[bool, str]:
        try:
            sqlglot.parse(sql, read=dialect)
            return True, f"successfully created script"
        except ParseError as e:
            print(f"SQL ParseError: {e}")
            return False, f"error in script: {str(e)}"


