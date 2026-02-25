-- Decision Log Table
-- Stores user decisions made during specify_solution and build_solution workflows.
-- Synced from local JSONL files during build_solution Step 1.
--
-- Usage: Replace <PROJECT_DATABASE> with the actual project database name.

CREATE SCHEMA IF NOT EXISTS <PROJECT_DATABASE>.LOGS;

CREATE TABLE IF NOT EXISTS <PROJECT_DATABASE>.LOGS.DECISION_LOG (
  ID                NUMBER AUTOINCREMENT PRIMARY KEY,
  TIMESTAMP         TIMESTAMP_NTZ       NOT NULL,
  SESSION_ID        VARCHAR(36)         NOT NULL,
  SOLUTION          VARCHAR(255)        NOT NULL,
  SKILL             VARCHAR(255)        NOT NULL,
  STEP              VARCHAR(500)        NOT NULL,
  DECISION_TYPE     VARCHAR(50)         NOT NULL,
  PROMPT_SHOWN      VARCHAR(4000),
  VALUE_SELECTED    VARCHAR(1000)       NOT NULL,
  ALTERNATIVES      ARRAY,
  RATIONALE         VARCHAR(4000),
  USERNAME          VARCHAR(255),
  SYNCED_AT         TIMESTAMP_NTZ       DEFAULT CURRENT_TIMESTAMP()
);
