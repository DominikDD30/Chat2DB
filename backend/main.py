import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import SchemaRequest, SchemaResponse, ScriptResponse, ScriptRequest
from services.database_service import DatabaseService
from services.llm_service import LLMClient, TokenLimitError, OpenAiClient
from services.script_service import SQLScriptService

load_dotenv()

model="gpt-4.1-mini"
token_limit=1000000
remote_frontend_url = "https://chat2db.netlify.app/"

APP_MODE = os.getenv("APP_MODE", "local")

app = FastAPI()

origins = ["*"] if APP_MODE == "local" else remote_frontend_url

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# llm_service: LLMClient = OllamaClient()
llm_service: LLMClient = OpenAiClient(
    api_key=os.getenv("OPENAI_API_KEY"),
    model=model,
    token_limit=token_limit)

database_service = DatabaseService(llm_service=llm_service)
script_service = SQLScriptService(llm_service=llm_service)


@app.get("/")
def root():
    return {"message": f"API is running in {APP_MODE} mode"}


@app.post("/generate/dbsql")
def generate_sql_script(request: ScriptRequest) -> ScriptResponse:
    try:
        return script_service.generate_sql_script(request.currentDb, request.dialect)
    except TokenLimitError:
        return ScriptResponse(sql="", message="Sorry, our service reached token limit. Try again later.")


@app.post("/generate/schema")
def generate_schema(request: SchemaRequest) -> SchemaResponse:
    print(f"Received request: {request.messages}")
    if request.currentDb:
        print(f"Current DB state: {request.currentDb}")

    try:
        schema_response = database_service.generate_schema(request)
    except TokenLimitError:
        return SchemaResponse(
            response="Sorry, our service reached token limit. Try again later.",
            updatedDb=request.currentDb
        )

    print(f"""
    Message: {schema_response.response}
    Generated Schema: {schema_response.updatedDb.model_dump_json(indent=2)}
    """)
    return schema_response


if APP_MODE == "lambda":
    from mangum import Mangum
    handler = Mangum(app)

if __name__ == "__main__" and APP_MODE == "local":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5050)
