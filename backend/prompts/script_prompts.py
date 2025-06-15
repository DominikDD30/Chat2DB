
class ScriptPrompts:

    @staticmethod
    def generate_sql_schema_script_template(db_draft, dialect: str) -> str:
        return f"""
        Your task is to generate SQL script that creates database schema based on the current database draft.
    
        DATABASE_DRAFT:
        {db_draft}
    
        Rules:
        - Use SQL-compatible types for: {dialect}
        - Table fields should be with the same format as in DATABASE_DRAFT.
        - Include all tables and relations from DATABASE_DRAFT.
        - Output ONLY valid SQL script, no comments or extra text.
    
        if database draft is not valid and you won't be able to create sql script you should answer only  "INVALID"
    
        Your answer:
        """