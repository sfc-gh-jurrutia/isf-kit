# Rule: Cortex Analyst with SQL Fallback

## Impact: HIGH - Critical for text-to-SQL reliability

## Pattern

Always implement a fallback chain when using Cortex Analyst:

```python
async def _handle_analytical(self, message: str) -> Dict[str, Any]:
    # 1. Try Cortex Analyst first
    try:
        result = self.sf.cortex_analyst_query(message)
        if result.get("results") and len(result["results"]) > 0:
            return self._format_results(result, source="Cortex Analyst")
    except Exception as e:
        logger.warning(f"Cortex Analyst failed: {e}")
    
    # 2. Fallback to pattern-matched SQL
    result = self.sf.direct_sql_query(message)
    if result.get("results") and len(result["results"]) > 0:
        return self._format_results(result, source="Direct SQL")
    
    # 3. Explain capabilities
    return {
        "response": (
            "I couldn't process that query. I can answer:\n"
            "• How many [entities] are there?\n"
            "• List all [entity] names\n"
            "• What's the average/max/min [metric]?"
        )
    }
```

## Direct SQL Pattern Matching

```python
def direct_sql_query(self, question: str) -> Dict[str, Any]:
    q = question.lower()
    
    if "how many" in q and "well" in q:
        sql = "SELECT COUNT(DISTINCT WELL_NAME) as count FROM table"
        explanation = "Counting distinct wells"
    
    elif ("list" in q or "name" in q) and "well" in q:
        sql = "SELECT DISTINCT WELL_NAME FROM table ORDER BY WELL_NAME"
        explanation = "Listing all wells"
    
    elif "deepest" in q or ("which" in q and "deep" in q):
        sql = """
            SELECT WELL_NAME, MAX(DEPTH) as max_depth 
            FROM table GROUP BY WELL_NAME 
            ORDER BY max_depth DESC LIMIT 1
        """
        explanation = "Finding deepest well"
    
    # ... more patterns
    
    if sql:
        results = self.execute_query(sql)
        return {"sql": sql, "results": results, "explanation": explanation}
    
    return {"error": "Could not understand the question"}
```

## Why

- Cortex Analyst may be unavailable or misconfigured
- Some queries may not match the deployed Semantic View
- Fallback provides consistent user experience
- Pattern matching handles common queries reliably
