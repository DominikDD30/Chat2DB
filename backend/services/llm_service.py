from abc import ABC, abstractmethod
import requests
import boto3
import tiktoken
from botocore.exceptions import ClientError
from datetime import datetime
import decimal



class TokenLimitError(Exception):
    pass

class LLMClient(ABC):
    """
    Abstract base class for any Large Language Model client.
    """

    def __init__(self, url: str, model: str, token_limit: int):
        self.url = url
        self.model = model
        self.token_limit = token_limit
        self.year_month = datetime.now().strftime("%Y-%m")
        self.dynamodb_table = "Chat2dbTokenUsage"
        self.current_tokens = self._fetch_current_tokens()

    @abstractmethod
    def send_prompt(self, user_prompt: str, system_prompt: str, temperature: float = 0) -> str:
        pass

    def _fetch_current_tokens(self) -> int:
        """
        Fetch current monthly token usage from DynamoDB.
        """
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(self.dynamodb_table)

        try:
            response = table.get_item(Key={'year_month': self.year_month})
            item = response.get('Item', {})
            return int(item.get('tokens_used', 0))
        except ClientError as e:
            print(f"DynamoDB get_item error: {e.response['Error']['Message']}")
            return 0

    def _check_and_update_token_usage(self, estimated_tokens: int):
        """
        Atomically check and update token usage in DynamoDB to avoid race conditions.
        """
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(self.dynamodb_table)

        try:
            response = table.update_item(
                Key={'year_month': self.year_month},
                UpdateExpression="SET tokens_used = if_not_exists(tokens_used, :zero) + :inc",
                ConditionExpression="tokens_used <= :limit OR attribute_not_exists(tokens_used)",
                ExpressionAttributeValues={
                    ':inc': decimal.Decimal(estimated_tokens),
                    ':limit': decimal.Decimal(self.token_limit - estimated_tokens),
                    ':zero': decimal.Decimal(0)
                },
                ReturnValues="UPDATED_NEW"
            )
            self.current_tokens = int(response["Attributes"]["tokens_used"])
            print("tokens used ",self.current_tokens)

        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                raise TokenLimitError("Token limit exceeded. Please try again later.")
            else:
                raise

    def _estimate_tokens(self, *texts: str) -> int:
        """
        Estimate token usage as word count sum.
        """
        encoding = tiktoken.get_encoding("o200k_base")
        return sum(len(encoding.encode(text)) for text in texts)

class OpenAiClient(LLMClient):
    """
    Implementation of LLMClient using OpenAI API.
    """

    def __init__(self, api_key: str, token_limit: int, model: str):
        super().__init__(url="https://api.openai.com/v1/chat/completions", model=model, token_limit=token_limit)
        self.api_key = api_key

    def send_prompt(self, user_prompt: str, system_prompt: str, temperature: float = 0.7) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt.strip()}
        ]

        estimated_tokens = self._estimate_tokens(system_prompt, user_prompt)
        self._check_and_update_token_usage(estimated_tokens)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature
        }

        response = requests.post(self.url, headers=headers, json=payload)

        if response.status_code != 200:
            raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")

        json_response = response.json()
        content = json_response["choices"][0]["message"]["content"]

        total_tokens = json_response.get("usage", {}).get("total_tokens")
        if total_tokens is not None:
            self._add_token_usage(total_tokens)

        return content

    def _add_token_usage(self, tokens: int):
        """
        Add actual token usage (from OpenAI API response) to DynamoDB without condition.
        """
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(self.dynamodb_table)

        try:
            table.update_item(
                Key={'year_month': self.year_month},
                UpdateExpression="SET tokens_used = if_not_exists(tokens_used, :zero) + :inc",
                ExpressionAttributeValues={
                    ':inc': decimal.Decimal(tokens),
                    ':zero': decimal.Decimal(0)
                }
            )
        except ClientError as e:
            print(f"Failed to update output tokens: {e}")


class OllamaClient(LLMClient):
    """
    Implementation of LLMClient using Ollama.
    Ollama does not enforce or require token limits.
    """

    def __init__(self, url: str = "http://localhost:11434/api/chat", model: str = "llama3"):
        super().__init__(url=url, model=model, token_limit=0)

    def send_prompt(self, user_prompt: str, system_prompt: str, temperature: float = 0) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt.strip()}
        ]

        # Skip token tracking entirely for Ollama
        response = requests.post(
            self.url,
            json={
                "model": self.model,
                "messages": messages,
                "stream": False,
                "temperature": temperature
            }
        )

        if response.status_code != 200:
            raise Exception(f"Ollama error: {response.status_code} - {response.text}")

        result = response.json()["message"]["content"]
        return result

    def _fetch_current_tokens(self) -> int:
        # Override to avoid DynamoDB call
        return 0

    def _check_and_update_token_usage(self, estimated_tokens: int):
        # Override to skip any token tracking
        pass

