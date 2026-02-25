# Rule: Multi-Agent Orchestration with Intent Classification

## Impact: HIGH - Critical for complex AI-powered apps

## Pattern

Use intent classification to route messages to specialized agents:

```python
class AgentOrchestrator:
    def __init__(self):
        self.historian = HistorianAgent()  # RAG/search
        self.advisor = AdvisorAgent()       # recommendations
        self.watchdog = WatchdogAgent()     # monitoring
        self.context = {}                    # conversation state
    
    async def process_message(self, message: str, entity_id: Optional[str] = None) -> Dict[str, Any]:
        intent = self._classify_intent(message)
        
        if intent == "analytical":
            return await self._handle_analytical(message)
        elif intent in ["search", "history"]:
            return await self._handle_search(message)
        elif intent in ["recommend", "optimize"]:
            return await self._handle_recommendation(message)
        elif intent == "status":
            return await self._handle_status(message)
        else:
            return await self._handle_general(message)
    
    def _classify_intent(self, message: str) -> str:
        message_lower = message.lower()
        
        analytical_patterns = [r"how many", r"total", r"count", r"average", r"which.*best"]
        for pattern in analytical_patterns:
            if re.search(pattern, message_lower):
                return "analytical"
        
        search_patterns = [r"what happened", r"find", r"search", r"incidents?"]
        for pattern in search_patterns:
            if re.search(pattern, message_lower):
                return "search"
        
        recommend_patterns = [r"recommend", r"suggest", r"what should", r"optimal"]
        for pattern in recommend_patterns:
            if re.search(pattern, message_lower):
                return "recommend"
        
        return "general"
```

## Agent Base Class

```python
from abc import ABC, abstractmethod

class BaseAgent(ABC):
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    @abstractmethod
    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def get_tools(self) -> List[Dict[str, Any]]:
        pass
```

## Singleton Pattern for Orchestrator

```python
_orchestrator: Optional[AgentOrchestrator] = None

def get_orchestrator() -> AgentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator
```

## Why

- Modular: Each agent handles one concern
- Extensible: Add new agents without modifying orchestrator
- Testable: Test agents in isolation
- Context-aware: Maintain conversation state across messages
