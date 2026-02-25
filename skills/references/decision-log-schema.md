# Decision Log Schema

> Reference for the structured decision log that traces user choices across specify_solution and build_solution workflows.

## Overview

Every stopping point in the workflow writes a JSONL entry to `specs/{solution}/decision-log.jsonl`. This creates a traceable audit trail from requirements through deployed architecture. When a Snowflake connection is available (guaranteed during `build_solution`), the local log syncs to a Snowflake table for cross-user querying.

## Storage

| Layer | Location | When Written | Purpose |
|-------|----------|-------------|---------|
| Local | `specs/{solution}/decision-log.jsonl` | Every stopping point | Always available, no dependencies |
| Snowflake | `{PROJECT_DATABASE}.LOGS.DECISION_LOG` | During `build_solution` Step 1 | Cross-user querying, analytics |

## JSONL Entry Format

Each line in the JSONL file is a single JSON object:

```json
{
  "timestamp": "2026-02-22T14:30:00Z",
  "session_id": "uuid-of-current-session",
  "solution": "003-edge-to-cloud",
  "skill": "specify_solution",
  "step": "Step 1.5: Complexity Assessment",
  "decision_type": "mode_selection",
  "prompt_shown": "Mode: Express. Rationale: single persona, Zone B only...",
  "value_selected": "Accept",
  "alternatives": ["Accept", "Override to Full"],
  "rationale": "User accepted Express — single persona, straightforward scope",
  "user": "system-user"
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | ISO 8601 string | Yes | When the decision was made |
| `session_id` | UUID string | Yes | Groups decisions within a single session |
| `solution` | string | Yes | Solution slug (e.g., `003-edge-to-cloud`) |
| `skill` | string | Yes | Skill name (e.g., `specify_solution`, `build-implement`) |
| `step` | string | Yes | Step identifier (e.g., `Step 1.5: Complexity Assessment`) |
| `decision_type` | enum string | Yes | Category of decision (see below) |
| `prompt_shown` | string | Yes | The prompt or summary presented to the user |
| `value_selected` | string | Yes | What the user chose |
| `alternatives` | string array | Yes | All options that were available |
| `rationale` | string | No | Why this choice was made (user-provided or LLM-inferred) |
| `user` | string | No | Username or identifier |

## Decision Types

| Type | Used When | Example |
|------|-----------|---------|
| `path_selection` | Choosing a workflow path | Path A (Document Import) vs Path B (Conversational) vs Path C (Repo Analysis) |
| `mode_selection` | Selecting an operating mode | Express vs Full, Full Auto vs Phase by Phase |
| `architecture_choice` | Making a technical architecture decision | Zone pattern, data architecture, Cortex features |
| `approval` | Confirming a presented plan or result | "Ready to build? [Proceed]", quality gate pass |
| `override` | Overriding a recommendation | Override Express to Full, proceed despite warnings |
| `configuration` | Setting a parameter value | Batch size, temperature, output format, save location |
| `tool_selection` | Choosing which tool/feature to use | Data generation mode, Cortex feature selection |

## How to Write Log Entries

At each stopping point in a skill, after the user makes their choice:

```
**Log**: Record `{decision_type}` — append to `specs/{solution}/decision-log.jsonl`:
  - step: "{step name}"
  - value_selected: "{what user chose}"
  - alternatives: [{all options}]
  - rationale: "{why, if known}"
```

The LLM constructs the full JSONL entry using the schema above, generating the `timestamp` and `session_id` (reuse the same session_id for the entire session).

## Snowflake Sync

### When to Sync

Sync happens during `build_solution` Step 1 (Validate Spec Artifacts), after confirming a Snowflake connection exists. Read `specs/{solution}/decision-log.jsonl` and insert any entries that haven't been synced yet.

### Table DDL

See `templates/sql/decision_log_table.sql` for the full DDL. The table lives in the project database under a `LOGS` schema:

```sql
CREATE SCHEMA IF NOT EXISTS {PROJECT_DATABASE}.LOGS;

CREATE TABLE IF NOT EXISTS {PROJECT_DATABASE}.LOGS.DECISION_LOG (
  ID NUMBER AUTOINCREMENT PRIMARY KEY,
  TIMESTAMP TIMESTAMP_NTZ NOT NULL,
  SESSION_ID VARCHAR NOT NULL,
  SOLUTION VARCHAR NOT NULL,
  SKILL VARCHAR NOT NULL,
  STEP VARCHAR NOT NULL,
  DECISION_TYPE VARCHAR NOT NULL,
  PROMPT_SHOWN VARCHAR,
  VALUE_SELECTED VARCHAR NOT NULL,
  ALTERNATIVES ARRAY,
  RATIONALE VARCHAR,
  USERNAME VARCHAR,
  SYNCED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

### Sync Logic

```sql
INSERT INTO {PROJECT_DATABASE}.LOGS.DECISION_LOG
  (TIMESTAMP, SESSION_ID, SOLUTION, SKILL, STEP, DECISION_TYPE,
   PROMPT_SHOWN, VALUE_SELECTED, ALTERNATIVES, RATIONALE, USERNAME)
VALUES
  ({timestamp}, '{session_id}', '{solution}', '{skill}', '{step}',
   '{decision_type}', '{prompt_shown}', '{value_selected}',
   PARSE_JSON('{alternatives_json}'), '{rationale}', '{user}');
```

### Querying Decision History

```sql
-- All decisions for a specific solution
SELECT * FROM LOGS.DECISION_LOG
WHERE SOLUTION = '003-edge-to-cloud'
ORDER BY TIMESTAMP;

-- Architecture decisions across all solutions
SELECT SOLUTION, STEP, VALUE_SELECTED, RATIONALE
FROM LOGS.DECISION_LOG
WHERE DECISION_TYPE = 'architecture_choice'
ORDER BY TIMESTAMP DESC;

-- Decision patterns by user
SELECT USERNAME, DECISION_TYPE, VALUE_SELECTED, COUNT(*) AS FREQUENCY
FROM LOGS.DECISION_LOG
GROUP BY USERNAME, DECISION_TYPE, VALUE_SELECTED
ORDER BY FREQUENCY DESC;
```
