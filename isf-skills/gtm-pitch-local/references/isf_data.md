# ISF Core Data — SUPPORT.ISF

Reference queries for ISF industry content. All queries use `snowflake_sql_execute`.

**ISF_BASE:** `https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app`

## Account Lookup

```sql
SELECT SALESFORCE_ACCOUNT_ID, SALESFORCE_ACCOUNT_NAME, INDUSTRY, SUB_INDUSTRY,
       ACCOUNT_TIER, SEGMENT, SALESFORCE_OWNER_NAME AS AE_NAME,
       LEAD_SALES_ENGINEER_NAME AS SE_NAME, DM, RVP, GVP,
       TECH_STACK, IS_G2K, GLOBAL_2000_RANK, TYPE, SUB_TYPE
FROM SALES.RAVEN.D_SALESFORCE_ACCOUNT_CUSTOMERS
WHERE LOWER(SALESFORCE_ACCOUNT_NAME) LIKE LOWER('%<company>%')
ORDER BY ACCOUNT_TIER ASC NULLS LAST
LIMIT 5
```

If not found in customers, check prospects:
```sql
SELECT SALESFORCE_ACCOUNT_ID, SALESFORCE_ACCOUNT_NAME, INDUSTRY, SUB_INDUSTRY,
       SEGMENT, SALESFORCE_OWNER_NAME AS AE_NAME,
       LEAD_SALES_ENGINEER_NAME AS SE_NAME, DM, RVP, GVP,
       IS_G2K, GLOBAL_2000_RANK, TYPE
FROM SALES.RAVEN.D_SALESFORCE_ACCOUNT_PROSPECTS
WHERE LOWER(SALESFORCE_ACCOUNT_NAME) LIKE LOWER('%<company>%')
LIMIT 5
```

## Map SFDC Industry to ISF Industry

```sql
SELECT INDUSTRY_ID, INDUSTRY_NAME, PARENT_INDUSTRY_ID, DESCRIPTION
FROM SUPPORT.ISF.INDUSTRIES
WHERE LOWER(INDUSTRY_NAME) LIKE LOWER('%<sfdc_industry>%')
   OR LOWER(DESCRIPTION) LIKE LOWER('%<sfdc_industry>%')
```

Always resolve to PARENT `INDUSTRY_ID` for content queries (ISF content is tagged at parent level).

## Industry Context

```sql
SELECT INDUSTRY_ID, INDUSTRY_NAME, DESCRIPTION, MARKET_TRENDS, SNOWFLAKE_POV, AI_BRIEF,
       'https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/industry/' || INDUSTRY_ID as ISF_LINK
FROM SUPPORT.ISF.INDUSTRIES
WHERE INDUSTRY_ID = '<parent_industry_id>'
```

Sub-industries:
```sql
SELECT INDUSTRY_ID, INDUSTRY_NAME, DESCRIPTION
FROM SUPPORT.ISF.INDUSTRIES
WHERE PARENT_INDUSTRY_ID = '<parent_industry_id>'
```

## Top Solutions for Industry

```sql
SELECT s.SOLUTION_ID, s.SOLUTION_NAME, s.VALUE_POSITIONING,
       s.KEY_DIFFERENTIATORS, s.BUSINESS_CHALLENGES, s.SUCCESS_METRICS,
       s.SNOWFLAKE_PRODUCTS, s.TYPICAL_INTEGRATIONS, s.STATUS,
       s.HAS_ACCELERATOR,
       'https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/solution/' || s.SOLUTION_ID as ISF_LINK
FROM SUPPORT.ISF.SOLUTIONS s
WHERE s.INDUSTRY_ID = '<parent_industry_id>'
  AND s.STATUS = 'Published'
ORDER BY s.SOLUTION_NAME
```

64 total solutions. Include VALUE_POSITIONING and KEY_DIFFERENTIATORS in pitch output.

### Solution Link Rules

Every solution in output MUST include clickable links:

1. **ISF Link** (always available): `{ISF_BASE}/solution/{SOLUTION_ID}` — internal ISF detail page with full solution brief, architecture, competitive positioning
2. **Snowflake Products referenced**: List the SNOWFLAKE_PRODUCTS column — these map to product documentation pages
3. **Accelerator link** (if HAS_ACCELERATOR = true): Note that a solution accelerator is available in ISF

Format in output:
```
**[{Solution Name}]({ISF_LINK})** — {VALUE_POSITIONING}
Products: {SNOWFLAKE_PRODUCTS} | [View full solution brief]({ISF_LINK})
```

## Solution Competitive Landscape (Enrichment — sparse data)

Solution-level competitive positioning. **Note:** Only populated for select industries (check row count before rendering).
```sql
SELECT sl.SOLUTION_ID, s.SOLUTION_NAME, sl.COMPETITOR_PLATFORM, sl.COMPETITOR_PRODUCTS,
       sl.COEXIST_STRATEGY, sl.REPLACE_STRATEGY, sl.RATIONALIZE_STRATEGY
FROM SUPPORT.ISF.SOLUTION_LANDSCAPE sl
JOIN SUPPORT.ISF.SOLUTIONS s ON sl.SOLUTION_ID = s.SOLUTION_ID
WHERE s.INDUSTRY_ID = '<parent_industry_id>'
  AND s.STATUS = 'Published'
ORDER BY s.SOLUTION_NAME
```

**Tables that do NOT exist or are empty (as of March 2026):**
- `SOLUTION_ARCHITECTURE` — does not exist. `SOLUTION_ARCHITECTURE_DIAGRAMS` exists but contains binary images, not queryable text columns.
- `OUTCOMES` — table exists but has 0 rows. Do NOT query.

## Top Use Cases for Industry

```sql
SELECT uc.USECASE_ID, uc.NAME, uc.DESCRIPTION, uc.MATURITY_LEVEL, uc.INTENDED_OUTCOMES,
       uc.SUCCESS_METRICS, uc.TYPICAL_INTEGRATIONS,
       'https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/usecase/' || uc.USECASE_ID as ISF_LINK
FROM SUPPORT.ISF.USE_CASES uc
JOIN SUPPORT.ISF.USECASE_INDUSTRY ui ON uc.USECASE_ID = ui.USECASE_ID
WHERE ui.INDUSTRY_ID = '<parent_industry_id>'
ORDER BY uc.NAME
```

Enrichment columns (for optional "use case maturity" section):
- `SUCCESS_METRICS` — measurable KPIs for this use case
- `TYPICAL_INTEGRATIONS` — systems/tools commonly integrated
- `MATURITY_LEVEL` — L1 Emerging / L2 Validated / L3 Foundational

## Top Pain Points for Industry

**PRIMARY (view-first, faster):**
```sql
SELECT * FROM SUPPORT.ISF.VW_AE_PAIN_USECASE_BY_INDUSTRY
WHERE INDUSTRY_ID = '<parent_industry_id>'
```
Returns full Pain → Use Case → Solution chain in one query.

**FALLBACK (if view unavailable or need specific columns):**
```sql
SELECT p.PAIN_ID, p.TITLE, p.DESCRIPTION, p.SEVERITY,
       p.SIGNALS_VERBATIMS, p.FREQUENCY, p.IMPACTED_METRICS,
       'https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/pain/' || p.PAIN_ID as ISF_LINK
FROM SUPPORT.ISF.PAINS p
JOIN SUPPORT.ISF.PAIN_INDUSTRY pi ON p.PAIN_ID = pi.PAIN_ID
WHERE pi.INDUSTRY_ID = '<parent_industry_id>'
  AND p.ACTIVE = TRUE
ORDER BY p.SEVERITY DESC
```

Enrichment columns (for optional "buyer signals" section):
- `SIGNALS_VERBATIMS` — actual buyer quotes phrasing this pain
- `FREQUENCY` — how often this pain is mentioned
- `IMPACTED_METRICS` — business metrics affected by this pain

## Customer Stories for Industry

```sql
SELECT st.STORY_ID, st.TITLE, st.CUSTOMER_NAME, st.BUSINESS_CHALLENGES,
       st.NARRATIVE, st.OUTCOMES_SUMMARY, st.AI_BRIEF,
       st.REFERENCE_URL, st.REFERENCES_LINKS,
       st.CONFIDENTIALITY_LEVEL, st.PUBLICATION_STATUS, st.ARCHITECTURE_SUMMARY,
       st.ANONYMIZED, st.ASSET_LEVEL,
       'https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/story/' || st.STORY_ID as ISF_LINK
FROM SUPPORT.ISF.STORIES st
WHERE st.INDUSTRY_ID = '<parent_industry_id>'
  AND st.PUBLICATION_STATUS = 'Published'
ORDER BY st.TITLE
```

### Story Shareability Columns

**Note (March 2026):** `CONFIDENTIALITY_LEVEL` and `ASSET_LEVEL` are currently NULL for most industries. `ANONYMIZED` is populated (TRUE/FALSE). Until shareability columns are populated, the only actionable signal is:
- If `ANONYMIZED = TRUE`, use story but omit customer name (show anonymized title instead)
- Keep `CONFIDENTIALITY_LEVEL`, `ASSET_LEVEL` in the query — they will become useful once populated

### Story Link Rules

Every story in output MUST include clickable links. Provide ALL available links:

1. **ISF Link** (always available): `{ISF_BASE}/story/{STORY_ID}` — internal ISF detail page
2. **Public Case Study** (if REFERENCE_URL is populated): direct link to snowflake.com case study
3. **Public Search** (if REFERENCE_URL is empty and customer is NOT anonymized): run `web_search` for `site:snowflake.com "{CUSTOMER_NAME}" case study customer story` to find public case study URL
4. **Snowflake Customer Page**: `https://www.snowflake.com/en/customers/all-customers/case-study/{customer-name-slug}/` — check if exists via web_search

Format in output:
```
**[{Story Title}]({ISF_LINK})** — {CUSTOMER_NAME}: {OUTCOMES_SUMMARY}
Links: [ISF]({ISF_LINK}) | [Public Case Study]({REFERENCE_URL or found URL}) | [Compass]({compass_url if known})
```

If no public URL found, show only ISF link. Never show broken links.

## Pre-Joined Views

### Pain → Use Case → Solution by Industry
```sql
SELECT * FROM SUPPORT.ISF.VW_AE_PAIN_USECASE_BY_INDUSTRY
WHERE INDUSTRY_ID = '<parent_industry_id>'
```

### Solution Overview
```sql
SELECT * FROM SUPPORT.ISF.VW_SOLUTIONS_OVERVIEW
WHERE INDUSTRY_ID = '<parent_industry_id>'
```

Use VW_SOLUTIONS_OVERVIEW as a faster alternative to the raw SOLUTIONS query when you only need the overview (includes counts of use cases, stories, pain points per solution).
