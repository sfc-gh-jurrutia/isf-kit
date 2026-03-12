# Competitive Intelligence for Pitch

Multi-source competitive data for positioning Snowflake against competitors. All sources below are stable production tables.

## Tech Stack from Technographics

```sql
SELECT ACCOUNT_ID, ACCOUNT_NAME,
       DATABRICKS_TEAM_COUNT_SUMBLE, DATABRICKS_JOB_POST_1YR_COUNT_SUMBLE, DATABRICKS_JOB_POST_6MO_GROWTH_SUMBLE,
       AWS_REDSHIFT_TEAM_COUNT_SUMBLE, AWS_REDSHIFT_JOB_POST_1YR_COUNT_SUMBLE, AWS_REDSHIFT_JOB_POST_6MO_GROWTH_SUMBLE,
       GCP_BIGQUERY_TEAM_COUNT_SUMBLE, GCP_BIGQUERY_JOB_POST_1YR_COUNT_SUMBLE, GCP_BIGQUERY_JOB_POST_6MO_GROWTH_SUMBLE,
       SNOWFLAKE_TEAM_COUNT_SUMBLE, SNOWFLAKE_JOB_POST_1YR_COUNT_SUMBLE, SNOWFLAKE_JOB_POST_6MO_GROWTH_SUMBLE,
       DATABRICKS_UNITY_CATALOG_TEAM_COUNT_SUMBLE, DATABRICKS_WORKFLOWS_TEAM_COUNT_SUMBLE
FROM SNOWHOUSE.SALES.COMPETITIVE_INTELLIGENCE
WHERE ACCOUNT_ID = '<sfdc_account_id>'
  AND DS = (SELECT MAX(DS) FROM SNOWHOUSE.SALES.COMPETITIVE_INTELLIGENCE)
```

### Signal Interpretation
- **High team count + growing job posts (positive 6MO_GROWTH)** = active investment, harder to displace
- **High team count + declining job posts (negative 6MO_GROWTH)** = potential migration opportunity
- **Multiple high counts** = multi-vendor environment, coexist strategy first
- **6MO_GROWTH columns** show momentum direction — positive means growing, negative means declining

## Third-Party Tech Stack

```sql
SELECT SALESFORCE_ACCOUNT_ID, SALESFORCE_ACCOUNT_NAME,
       TECH_STACK_LIST, TECH_PEOPLE_COUNT, TECH_JOB_POST_1YR_COUNT,
       DATA_PEOPLE_COUNT, ENGINEER_PEOPLE_COUNT
FROM SALES.RAVEN.DIM_3P_ACCOUNT_VIEW
WHERE SALESFORCE_ACCOUNT_ID = '<sfdc_account_id>'
```

TECH_STACK_LIST is an ARRAY. When analyzing it, look for:
- **Data platforms:** Databricks, Redshift, BigQuery, Teradata, Oracle, SQL Server, Fabric
- **AI/ML:** SageMaker, Vertex AI, Azure ML, MLflow, Kubeflow
- **Vector DBs:** Pinecone, Qdrant, Weaviate, Faiss, Milvus, ChromaDB *(multiple = active GenAI exploration)*
- **BI:** Tableau, Power BI, Looker, Qlik, ThoughtSpot
- **ETL/ELT:** Fivetran, dbt, Informatica, Matillion, Airbyte

## SFDC Competitor Fields on Opportunities

```sql
SELECT o.NAME, o.STAGE_NAME, o.CLOSE_DATE, o.AMOUNT,
       o.PRIMARY_COMPETITOR_C, o.COMPETING_AGAINST_C, o.COMPETITION_C
FROM FIVETRAN.SALESFORCE.OPPORTUNITY o
WHERE o.ACCOUNT_ID = '<sfdc_account_id>'
  AND o.IS_CLOSED = FALSE
ORDER BY o.CLOSE_DATE ASC
```

## ISF Solution Competitive Positioning

```sql
SELECT s.SOLUTION_ID, s.SOLUTION_NAME,
       s.PLATFORM_COMPETITORS, s.SNOWFLAKE_ADVANTAGE,
       s.COEXIST_STRATEGY, s.REPLACE_STRATEGY, s.RATIONALIZE_STRATEGY,
       'https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/solution/' || s.SOLUTION_ID as ISF_LINK
FROM SUPPORT.ISF.SOLUTIONS s
WHERE s.INDUSTRY_ID = '<parent_industry_id>'
  AND s.STATUS = 'Published'
  AND s.PLATFORM_COMPETITORS IS NOT NULL
```

Key competitive fields per solution:
- `PLATFORM_COMPETITORS` — who we compete with for this solution
- `SNOWFLAKE_ADVANTAGE` — our differentiator
- `COEXIST_STRATEGY` — how to sell alongside competitor
- `REPLACE_STRATEGY` — how to displace competitor
- `RATIONALIZE_STRATEGY` — how to consolidate onto Snowflake

## Presenting Competitive Context in Pitch

Structure as:
1. **Their Current Stack** — aggregate from technographics + 3P + SFDC opps
2. **Key Competitor** — primary threat and their strengths
3. **Our Advantage** — from ISF SNOWFLAKE_ADVANTAGE
4. **Recommended Approach** — coexist/replace/rationalize based on signals

---

## Optional Enrichment (unstable sources)

These tables live in personal/team TEMP schemas and may be dropped without notice. Use only as supplementary enrichment — never depend on them for core pitch logic. Skip silently if unavailable.

### Industry Loss Patterns (TEMP — unstable)

```sql
SELECT COMPETITORS, COUNT(*) as loss_cnt, AVG(AMOUNT) as avg_deal_size,
       LISTAGG(DISTINCT LOST_REASON, '; ') as common_reasons
FROM TEMP.DEAL_INTELLIGENCE.COMPETITIVE_LOSSES
WHERE INDUSTRY = '<industry>'
GROUP BY COMPETITORS
ORDER BY loss_cnt DESC
LIMIT 5
```

### Win/Loss Interviews (TEMP — unstable)

```sql
SELECT ACCOUNT_NAME, COMPETITORS, INCUMBANT, WORKLOADS,
       TOP_REASONS, SALES_STRATEGY, GTM_GAPS, COMPETITIVE_NOTES, WIN_LOSS_RESULT
FROM TEMP.ASANDERSON.WIN_LOSS_INTERVIEWS_Q4_2025
WHERE LOWER(INDUSTRY) LIKE LOWER('%<industry>%')
ORDER BY WIN_LOSS_RESULT
LIMIT 10
```

⚠️ Both TEMP tables above are best-effort. If they error, skip and rely on stable sources above.
