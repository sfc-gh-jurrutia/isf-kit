import os
from typing import Annotated, TypedDict

from langchain_core.messages import AnyMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from cortex_agent_tool import CortexAgentTool


class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]


def create_langgraph_cortex_agent(
    account: str,
    database: str,
    schema_name: str,
    agent_name: str,
    warehouse: str,
    token: str,
    openai_model: str = "gpt-4o",
) -> StateGraph:
    cortex_tool = CortexAgentTool(
        account=account,
        database=database,
        schema_name=schema_name,
        agent_name=agent_name,
        warehouse=warehouse,
        oauth_token=token,
        name="snowflake_sales_agent",
        description="Query Snowflake sales data. Use this tool to answer questions about products, categories, regions, sales amounts, and trends.",
    )

    tools = [cortex_tool]

    llm = ChatOpenAI(model=openai_model)
    llm_with_tools = llm.bind_tools(tools)

    system_prompt = SystemMessage(content="""You are an intelligent assistant that helps users analyze business data.

You have access to a Snowflake Cortex Agent that can query sales data. Use the snowflake_sales_agent tool when users ask about:
- Sales figures, totals, or averages
- Product information
- Regional performance
- Category breakdowns
- Sales trends

Always use the tool to get accurate data rather than making assumptions.""")

    def call_model(state: AgentState) -> dict:
        messages = [system_prompt] + state["messages"]
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    def should_continue(state: AgentState) -> str:
        last_message = state["messages"][-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return END

    tool_node = ToolNode(tools)

    workflow = StateGraph(AgentState)
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", tool_node)
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    workflow.add_edge("tools", "agent")

    return workflow.compile()


def run_agent(agent, query: str) -> str:
    result = agent.invoke({"messages": [HumanMessage(content=query)]})
    return result["messages"][-1].content


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    agent = create_langgraph_cortex_agent(
        account=os.environ["SNOWFLAKE_ACCOUNT"],
        database=os.environ.get("SNOWFLAKE_DATABASE", "SANDBOX_DB"),
        schema_name=os.environ.get("SNOWFLAKE_SCHEMA", "SANDBOX_SCHEMA"),
        agent_name="sales_agent",
        warehouse=os.environ.get("SNOWFLAKE_WAREHOUSE", "SANDBOX_WH"),
        token=os.environ["SNOWFLAKE_PAT"],
    )

    queries = [
        "What are the total sales by category?",
        "Which region has the highest sales?",
        "What is the average sale amount?",
    ]

    for q in queries:
        print(f"\n{'='*60}")
        print(f"Query: {q}")
        print(f"{'='*60}")
        response = run_agent(agent, q)
        print(f"Response: {response}")
