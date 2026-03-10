import json
import os
import re
from typing import Any, Optional, Type

import httpx
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field


class CortexAgentInput(BaseModel):
    query: str = Field(description="The natural language query to send to the Cortex Agent")


class CortexAgentTool(BaseTool):
    name: str = "cortex_agent"
    description: str = "Query Snowflake data using a Cortex Agent with natural language"
    args_schema: Type[BaseModel] = CortexAgentInput

    account: str = Field(description="Snowflake account identifier")
    database: str = Field(description="Database containing the agent")
    schema_name: str = Field(description="Schema containing the agent", alias="schema")
    agent_name: str = Field(description="Name of the Cortex Agent")
    warehouse: str = Field(description="Warehouse for execution")
    oauth_token: Optional[str] = Field(default=None, description="OAuth token for authentication")
    
    model_config = {"populate_by_name": True}

    def __init__(
        self,
        account: str,
        database: str,
        schema_name: str,
        agent_name: str,
        warehouse: str,
        oauth_token: Optional[str] = None,
        name: str = "cortex_agent",
        description: str = "Query Snowflake data using a Cortex Agent",
        **kwargs
    ):
        super().__init__(
            name=name,
            description=description,
            account=account,
            database=database,
            schema_name=schema_name,
            agent_name=agent_name,
            warehouse=warehouse,
            oauth_token=oauth_token,
            **kwargs
        )

    def _get_headers(self, token: str) -> dict:
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }

    def _get_token(self) -> str:
        if self.oauth_token:
            return self.oauth_token
        token = os.environ.get("SNOWFLAKE_OAUTH_TOKEN")
        if not token:
            raise ValueError(
                "OAuth token required. Set SNOWFLAKE_OAUTH_TOKEN env var or pass oauth_token parameter."
            )
        return token

    def _run(self, query: str) -> str:
        api_url = f"https://{self.account}.snowflakecomputing.com/api/v2/databases/{self.database}/schemas/{self.schema_name}/agents/{self.agent_name}:run"
        
        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"type": "text", "text": query}]
                }
            ]
        }

        with httpx.Client(timeout=120) as client:
            response = client.post(
                api_url,
                headers=self._get_headers(self._get_token()),
                json=payload,
            )

            if response.status_code != 200:
                return f"Error: {response.status_code} - {response.text}"

            return self._parse_sse_response(response.text)

    async def _arun(self, query: str) -> str:
        api_url = f"https://{self.account}.snowflakecomputing.com/api/v2/databases/{self.database}/schemas/{self.schema_name}/agents/{self.agent_name}:run"
        
        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"type": "text", "text": query}]
                }
            ]
        }

        full_response = ""
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                api_url,
                headers=self._get_headers(self._get_token()),
                json=payload,
            ) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    return f"Error: {response.status_code} - {error_body.decode()}"

                async for chunk in response.aiter_bytes():
                    chunk_str = chunk.decode("utf-8", errors="replace")
                    full_response += chunk_str

        return self._parse_sse_response(full_response)

    def _parse_sse_response(self, sse_text: str) -> str:
        result_text = ""
        sql_results = []
        
        events = re.split(r"\n\n+", sse_text.strip())
        
        for event in events:
            if "event: message.delta" in event and "data:" in event:
                try:
                    data_match = re.search(r"data:\s*({.*})", event, re.DOTALL)
                    if data_match:
                        data = json.loads(data_match.group(1))
                        delta_content = data.get("delta", {}).get("content", [])
                        
                        for content_item in delta_content:
                            if content_item.get("type") == "text":
                                result_text += content_item.get("text", "")
                            elif content_item.get("type") == "tool_results":
                                tool_results = content_item.get("tool_results", [])
                                for tr in tool_results:
                                    if "content" in tr:
                                        for c in tr["content"]:
                                            if c.get("type") == "json":
                                                sql_results.append(c.get("json", {}))
                except json.JSONDecodeError:
                    continue

        if sql_results:
            result_text += f"\n\nSQL Results: {json.dumps(sql_results, indent=2)}"
        
        return result_text.strip() or "No response from agent"
