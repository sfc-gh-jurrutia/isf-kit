#!/bin/bash
###############################################################################
# Snowflake Notebook Deployment Template
# Replace placeholders: NOTEBOOK_NAME, COMPUTE_POOL, WAREHOUSE, DB, SCHEMA
###############################################################################

set -e

NOTEBOOK_FILE="my_notebook.ipynb"
NOTEBOOK_NAME="MY_NOTEBOOK"
COMPUTE_POOL="MY_GPU_POOL"
QUERY_WAREHOUSE="MY_WAREHOUSE"
DATABASE="MY_DB"
SCHEMA="PUBLIC"
STAGE="${DATABASE}.${SCHEMA}.NOTEBOOKS"
CONNECTION="demo"

SNOW_CONN="-c $CONNECTION"

# Upload files to stage
snow stage copy "$NOTEBOOK_FILE" "@${STAGE}/" --overwrite $SNOW_CONN
snow stage copy "environment.yml" "@${STAGE}/" --overwrite $SNOW_CONN

# Create notebook with GPU configuration
snow sql $SNOW_CONN -q "
USE DATABASE ${DATABASE};
USE SCHEMA ${SCHEMA};

CREATE OR REPLACE NOTEBOOK ${NOTEBOOK_NAME}
  FROM '@${STAGE}/'
  MAIN_FILE = '${NOTEBOOK_FILE}'
  COMPUTE_POOL = '${COMPUTE_POOL}'
  QUERY_WAREHOUSE = '${QUERY_WAREHOUSE}'
  RUNTIME_NAME = 'SYSTEM\$GPU_RUNTIME';

-- Enable headless execution
ALTER NOTEBOOK ${NOTEBOOK_NAME} ADD LIVE VERSION FROM LAST;

-- Enable external access for package downloads
ALTER NOTEBOOK ${NOTEBOOK_NAME} SET EXTERNAL_ACCESS_INTEGRATIONS = (ALLOW_ALL_INTEGRATION);
"

echo "Notebook ${NOTEBOOK_NAME} deployed successfully"

