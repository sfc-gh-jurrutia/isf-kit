-- =============================================================================
-- Schema Template: Standard 3-Layer Snowflake Architecture
-- =============================================================================
-- Usage: Copy into your project's sql/ directory. Replace:
--   <PROJECT_DATABASE>  → Your database name (e.g., YIELD_OPTIMIZATION_DB)
--   <DATA_MART_NAME>    → Your data mart schema (e.g., YO_SWEET_SPOT)
-- =============================================================================

-- Section 1: Database
CREATE DATABASE IF NOT EXISTS <PROJECT_DATABASE>;

-- Section 2: Required schemas (3-layer architecture)
USE DATABASE <PROJECT_DATABASE>;

CREATE SCHEMA IF NOT EXISTS RAW
  COMMENT = 'Landing zone for external data in original format. CDC staging and file loads.';

CREATE SCHEMA IF NOT EXISTS ATOMIC
  COMMENT = 'Enterprise Relational Model. Normalized, canonical business entities.';

CREATE SCHEMA IF NOT EXISTS <DATA_MART_NAME>
  COMMENT = 'Consumer-facing data products. Denormalized views and aggregations.';

-- Section 3: Optional schemas (uncomment if needed)
-- CREATE SCHEMA IF NOT EXISTS DATA_ENGINEERING
--   COMMENT = 'Intermediate processing for complex ETL pipelines.';
--
-- CREATE SCHEMA IF NOT EXISTS DATA_SCIENCE
--   COMMENT = 'Feature engineering, model training, and experiment tracking.';
--
-- CREATE SCHEMA IF NOT EXISTS ML_PROCESSING
--   COMMENT = 'ML inference outputs and prediction staging.';

-- Section 4: Permission model (uncomment and customize)
-- GRANT USAGE ON DATABASE <PROJECT_DATABASE> TO ROLE DATA_ENGINEER;
-- GRANT USAGE ON DATABASE <PROJECT_DATABASE> TO ROLE DATA_ANALYST;
--
-- GRANT ALL ON SCHEMA RAW TO ROLE DATA_ENGINEER;
-- GRANT ALL ON SCHEMA ATOMIC TO ROLE DATA_ENGINEER;
-- GRANT USAGE ON SCHEMA <DATA_MART_NAME> TO ROLE DATA_ANALYST;
-- GRANT SELECT ON ALL TABLES IN SCHEMA <DATA_MART_NAME> TO ROLE DATA_ANALYST;
-- GRANT SELECT ON ALL VIEWS IN SCHEMA <DATA_MART_NAME> TO ROLE DATA_ANALYST;
