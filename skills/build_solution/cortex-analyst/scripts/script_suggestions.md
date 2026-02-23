# Script Suggestions

Potential automation scripts for future implementation:

## Semantic View Deployment Scripts (Recommended)

- **deploy_semantic_view.sql**: Deploy YAML semantic model as a Semantic View
  ```sql
  -- Example: Read YAML from file and deploy as Semantic View
  CALL SYSTEM$CREATE_SEMANTIC_VIEW_FROM_YAML(
    'DB.SCHEMA',
    $$<yaml content>$$,
    TRUE  -- validate
  );
  ```

- **export_semantic_view.sql**: Export Semantic View back to YAML for version control
  ```sql
  SELECT SYSTEM$READ_YAML_FROM_SEMANTIC_VIEW('DB.SCHEMA.SEMANTIC_VIEW_NAME');
  ```

- **grant_semantic_view_access.sql**: Set up permissions for Semantic Views
  ```sql
  GRANT SELECT, REFERENCES ON SEMANTIC VIEW DB.SCHEMA.MODEL TO ROLE ANALYST_ROLE;
  GRANT MONITOR ON SEMANTIC VIEW DB.SCHEMA.MODEL TO ROLE OPS_ROLE;
  ```

## CI/CD Integration Scripts

- **deploy_from_git.sh**: CI/CD script to deploy YAML from Git to Semantic View
  ```bash
  #!/bin/bash
  YAML_CONTENT=$(cat semantic_model.yaml)
  snow sql -q "CALL SYSTEM\$CREATE_SEMANTIC_VIEW_FROM_YAML('DB.SCHEMA', \$\$${YAML_CONTENT}\$\$, TRUE);" -c connection
  ```

- **validate_semantic_model.py**: Validate YAML structure before deployment

## Legacy Stage-Based Scripts

- **deploy_model.sh**: Upload YAML to stage (legacy approach)
- **validate_yaml.py**: Check YAML structure and references

## Testing Scripts

- **test_verified_queries.py**: Run all verified queries and validate results
- **benchmark_questions.py**: Test against sample questions

## Validation Scripts

- **check_tables.py**: Verify base tables exist and accessible
- **check_metrics.py**: Validate metric expressions

## Observability Scripts

- **query_analyst_logs.sql**: Query Cortex Analyst request history
  ```sql
  SELECT REQUEST_TIMESTAMP, USER_NAME, QUERY_TEXT, GENERATED_SQL, STATUS
  FROM TABLE(SNOWFLAKE.LOCAL.CORTEX_ANALYST_REQUESTS(INTERVAL => '7 days'))
  ORDER BY REQUEST_TIMESTAMP DESC;
  ```
