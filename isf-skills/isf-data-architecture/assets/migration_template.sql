-- schemachange migration: V{version}__{description}.sql
-- Project: {PROJECT_NAME}
-- Created: {DATE}

USE ROLE {PROJECT_ROLE};
USE WAREHOUSE {PROJECT_WAREHOUSE};

-- ============================================================
-- {DESCRIPTION}
-- ============================================================

-- [DDL statements go here]

-- Verify
SELECT 'Migration complete' AS STATUS;
