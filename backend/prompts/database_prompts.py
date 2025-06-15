
class DatabasePrompts:

    @staticmethod
    def get_user_answer_template(previous_db_state, current_db_state, user_question) -> str:
        return f"""
        User just asked you to  create or update database schema and you tried you best
    
        schema before your work:
        {previous_db_state if previous_db_state
        else "This is first question in the chat"}
    
        schema after you finished your work:
        {current_db_state}
    
        Now you need to answer user question.
    
        Rules:
        1.you should answer very briefly what you did according to difference between schema before and after you work.
        2.Your answer should be very short and to the point (max 30 words).
    
        example answers:
        I have created new schema with tables: users, orders, products. I have updated the users table.
        I have updated the book table.
        
        
    
        here is user question:
        {user_question}
    
        now your answer:
        """

    @staticmethod
    def check_if_generate_schema(messages:list[dict[str,str]])->str:
        return f"""
            User jest asked you a question you have to decide if it is related to creating or updating database schema or not.
            If user question is not related to database schema you should politely inform user that you job is to help with creating database schema and you cannot help with this question.
            
            Rules:
            1. You answer always should be with JSON format.
            2. if user question is related to creating or updating database schema you should respond with "yes" and empty answer.
            3. if user don't directly ask you to create or update database schema but you can infer that he wants to do it you should respond with "yes" and empty answer.
            4. if user question is related to database schema you should respond with "yes" and empty answer.
            5. if user demand something that is beyond you job you should respond with "no" and polite answer that you cannot help with this question.
            6. user sometimes may question ask what you can do say hello or thank you for your work you for such question you should respond with "no" and natural answer
            7. Your answer should be very short and to the point (max 30 words).
            
            example answers: 
            {{
                "was_related": "yes",
                "answer": ""
            }}
            {{
                "was_related": "no",
                "answer": "Sorry, i cannot help with this question. My job is to help with creating or updating database schema."
            }}
            {{
                "was_related": "no",
                "answer": "hey"
            }}
            {{
                "was_related": "no",
                "answer": "Thank you i'm glad that you like it!"
            }}
            {{
                "was_related": "no",
                "answer": "I'm sorry that i couldn't help you."
            }}        
            
            
            
            Here is ur conversation history with user:{messages}
            
            Now your answer:
            """

    @staticmethod
    def generate_sql_schema(user_messages: list[dict[str, str]], database_dialect: str,
                            current_db_state: str = None) -> str:
        return f"""
        You are a helpful assistant for software developers. Your task is to generate or update an existing database schema
        based on the user's description.
    
        Rules:
        - Use SQL-compatible types for: {database_dialect}
        - Table fields should be in lowercase with snake_case naming.
        - if table has foreign keys include them as column with int type in the table.
        - Many to one is not valid relation type, use one to many instead.
        - don't made any additional changes to the schema if user didn't ask for it.
        - Each table must have a unique `table_id` that is not used in any column and any other table.
        - Don't change table_id of existing tables,you can only create new ones.
        - Respond ONLY with JSON, no explanations or extra text.
    
        Valid types for columns: ["int", "bigint", "smallint", "float", "decimal", "bool", "text", "varchar", "date", "timestamp","uuid","json","blob"]
    
        
        The JSON must follow **exactly** this structure:
    
        {{
            "schema": {{
                "tables": [
                    {{
                        "table_id": "table_id",   # Each table must have a unique table_id (use uuid for it) that is not used in any column.
                        "name": "table_name",
                        "columns": [
                            {{
                                "name": "column_name",
                                "type": "data_type"
                            }},
                            ...
                        ]
                    }},
                    ...
                ],
                "relations": [
                    {{
                        "from_table": "table_name",
                        "from_table_id": "table_id", # Use the same table_id as in the tables section.
                        "to_table": "table_name",
                        "to_table_id": "table_id",  # Use target table_id from the tables section.
                        "type": "RELATION_TYPE"  # valid options: "one-to-one", "one-to-many", "many-to-many"
                    }},
                    ...
                ]
            }}
        }}
    
        {f"Here is current database state: {current_db_state}" if current_db_state else ""}
    
        Your conversation history with user:
        \"\"\"
        {user_messages}
        \"\"\"
    
    
    
        Output ONLY valid JSON. No comments. No explanations.
        """