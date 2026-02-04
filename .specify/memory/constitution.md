# Demo Development Constitution

> These 9 principles guide all spec-driven demo development.

## The Principles

### 1. Schema-First
Every demo starts with an isolated Snowflake schema. No sharing production data. No cross-contamination between demos.

### 2. API-First
FastAPI contracts are defined before React components. The backend is the source of truth; the frontend is a view layer.

### 3. Contract-First
DDL + API specs are written before implementation. If you can't define the interface, you don't understand the requirement.

### 4. Spec-Driven
Business requirements drive technical decisions, not the other way around. Code serves the specification.

### 5. Portable
No hardcoded credentials. No absolute paths. Environment-agnostic configuration. A demo should run anywhere.

### 6. Demonstrable
Every feature has a clear demo narrative. If you can't show it in 30 seconds, it's not demo-ready.

### 7. Minimal
Only build what the spec requires. No gold-plating. No "while we're at it" features. Scope is sacred.

### 8. Testable
Every user story has acceptance criteria. Every acceptance criterion has a test. If it's not tested, it's not done.

### 9. Documented
Code serves the specification. Comments explain why, not what. The spec is the documentation.

### 10. Standards-Compliant
Follow Snowflake standards to avoid runtime errors. No guessing at formats or APIs.

**Semantic Model Requirements:**
- `verified_at` must be Unix timestamp (int64), NOT ISO date strings
- `metrics` and `filters` must be inside table definitions, NOT top-level
- All tables in relationships MUST have `primary_key` defined
- Use `@DATABASE.SCHEMA.STAGE/path` format for semantic model references

**Python Project Requirements:**
- Target Python `>=3.10,<3.12` for Snowflake compatibility
- Use `httpx` for HTTP clients (not `requests`) - better async support
- Use REST API for Cortex Analyst (not Python SDK) - fewer dependencies
- Account URLs: convert underscores to hyphens (`ORGNAME_ACCOUNT` → `orgname-account`)

**API Requirements:**
- SSE events must include both `event:` and `data:` lines
- Use consistent event names: `thinking`, `sql`, `data`, `error`, `done`

---

## Applying the Principles

### During Specify
- Principle 4 (Spec-Driven): Capture business context before technical choices
- Principle 7 (Minimal): Define out-of-scope explicitly
- Principle 6 (Demonstrable): Every feature needs a narrative

### During Plan
- Principle 1 (Schema-First): Design isolated Snowflake objects
- Principle 2 (API-First): Define endpoints before components
- Principle 3 (Contract-First): Write interfaces before implementation

### During Tasks
- Principle 8 (Testable): Map tasks to acceptance criteria
- Principle 7 (Minimal): Cut tasks that don't trace to user stories

### During Implement
- Principle 5 (Portable): Use environment variables
- Principle 9 (Documented): Reference spec in code comments
- Principle 8 (Testable): Write tests alongside code

---

## Anti-Patterns to Avoid

| Anti-Pattern | Violated Principle | Correct Approach |
|--------------|-------------------|------------------|
| "Let's add this cool feature" | Minimal | Does the spec require it? |
| "I'll document it later" | Documented | Write spec first |
| "It works on my machine" | Portable | Use env vars, test in container |
| "The UI should do this logic" | API-First | Move logic to FastAPI |
| "Let's use the prod database" | Schema-First | Create isolated schema |
| "We can test manually" | Testable | Write automated tests |
