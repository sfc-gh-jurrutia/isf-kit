# ISF Ontology & Structure Queries

Reference queries for Step 2: ISF graph walks, platform features, and accelerators. Customer stories and RAVEN evidence are handled by the evidence-gatherer subagent (`.cortex/agents/evidence-gatherer.md`). All queries use `snowflake_sql_execute`.

**ISF_BASE:** `https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app`

---

## Ontology Graph Walks

### Pain → Use Case → Solution Chain (PRIMARY)

Returns connected triples. Each row links a pain to its use case and the solution that addresses it. Use this as the primary data source for building the pitch narrative — it gives the LLM the full argument chain, not separate lists.

```sql
SELECT
  pi2.INDUSTRY_ID,
  p.PAIN_ID, p.TITLE AS pain_title, p.DESCRIPTION AS pain_description,
  p.SEVERITY, p.SIGNALS_VERBATIMS, p.FREQUENCY,
  pu.USECASE_ID, uc.NAME AS usecase_name, uc.DESCRIPTION AS usecase_description, uc.MATURITY_LEVEL,
  su.SOLUTION_ID, s.SOLUTION_NAME, s.VALUE_POSITIONING, s.SNOWFLAKE_PRODUCTS, s.HAS_ACCELERATOR,
  '{ISF_BASE}/pain/' || p.PAIN_ID AS pain_isf_link,
  '{ISF_BASE}/usecase/' || uc.USECASE_ID AS usecase_isf_link,
  '{ISF_BASE}/solution/' || s.SOLUTION_ID AS solution_isf_link
FROM SUPPORT.ISF.PAINS p
JOIN SUPPORT.ISF.PAIN_INDUSTRY pi2 ON p.PAIN_ID = pi2.PAIN_ID
LEFT JOIN SUPPORT.ISF.PAIN_USECASE pu ON p.PAIN_ID = pu.PAIN_ID
LEFT JOIN SUPPORT.ISF.USE_CASES uc ON pu.USECASE_ID = uc.USECASE_ID
LEFT JOIN SUPPORT.ISF.SOLUTION_USECASE su ON uc.USECASE_ID = su.USECASE_ID
LEFT JOIN SUPPORT.ISF.SOLUTIONS s ON su.SOLUTION_ID = s.SOLUTION_ID AND s.STATUS = 'Published'
WHERE pi2.INDUSTRY_ID = '<parent_industry_id>' AND p.ACTIVE = TRUE
ORDER BY p.SEVERITY DESC
```

**Fallback:** `SELECT * FROM SUPPORT.ISF.VW_AE_PAIN_USECASE_BY_INDUSTRY WHERE INDUSTRY_ID = '<parent_industry_id>'`

### Solution → Story Chain

Links each solution to the customer stories that validate it. Use this to attach proof points to specific solutions in the pitch.

```sql
SELECT ss.SOLUTION_ID, s_sol.SOLUTION_NAME,
  st.STORY_ID, st.TITLE AS story_title, st.CUSTOMER_NAME,
  st.OUTCOMES_SUMMARY, st.REFERENCE_URL, st.ANONYMIZED,
  '{ISF_BASE}/story/' || st.STORY_ID AS story_isf_link,
  '{ISF_BASE}/solution/' || ss.SOLUTION_ID AS solution_isf_link
FROM SUPPORT.ISF.STORY_SOLUTIONS ss
JOIN SUPPORT.ISF.STORIES st ON ss.STORY_ID = st.STORY_ID
JOIN SUPPORT.ISF.SOLUTIONS s_sol ON ss.SOLUTION_ID = s_sol.SOLUTION_ID
WHERE s_sol.INDUSTRY_ID = '<parent_industry_id>' AND st.PUBLICATION_STATUS = 'Published'
```

### Persona → Use Cases

Use cases relevant to a specific persona. Pair with the existing PAIN_PERSONA and SOLUTION_PERSONAS queries in `references/persona_pitch.md`.

```sql
SELECT uc.USECASE_ID, uc.NAME, uc.DESCRIPTION, uc.MATURITY_LEVEL,
       '{ISF_BASE}/usecase/' || uc.USECASE_ID AS usecase_isf_link
FROM SUPPORT.ISF.USECASE_PERSONA up
JOIN SUPPORT.ISF.USE_CASES uc ON up.USECASE_ID = uc.USECASE_ID
WHERE up.PERSONA_ID = '<persona_id>'
```

---

## Top Solutions for Industry

```sql
SELECT s.SOLUTION_ID, s.SOLUTION_NAME, s.VALUE_POSITIONING,
       s.KEY_DIFFERENTIATORS, s.BUSINESS_CHALLENGES, s.SUCCESS_METRICS,
       s.SNOWFLAKE_PRODUCTS, s.TYPICAL_INTEGRATIONS, s.STATUS,
       s.HAS_ACCELERATOR,
       '{ISF_BASE}/solution/' || s.SOLUTION_ID as ISF_LINK
FROM SUPPORT.ISF.SOLUTIONS s
WHERE s.INDUSTRY_ID = '<parent_industry_id>'
  AND s.STATUS = 'Published'
ORDER BY s.SOLUTION_NAME
```

### Solution Link Rules

Every solution in output MUST include clickable links:

1. **ISF Link** (always): `{ISF_BASE}/solution/{SOLUTION_ID}`
2. **Snowflake Products**: list the SNOWFLAKE_PRODUCTS column
3. **Accelerator link**: if accelerators exist (see Accelerators section below), link directly to the asset URL instead of just noting "accelerator available"

Format: `**[{Solution Name}]({ISF_LINK})** — {VALUE_POSITIONING} | Products: {SNOWFLAKE_PRODUCTS} | [View full brief]({ISF_LINK})`

### Solution Competitive Landscape (sparse)

Only populated for select industries. Check row count before rendering.
```sql
SELECT sl.SOLUTION_ID, s.SOLUTION_NAME, sl.COMPETITOR_PLATFORM, sl.COMPETITOR_PRODUCTS,
       sl.COEXIST_STRATEGY, sl.REPLACE_STRATEGY, sl.RATIONALIZE_STRATEGY
FROM SUPPORT.ISF.SOLUTION_LANDSCAPE sl
JOIN SUPPORT.ISF.SOLUTIONS s ON sl.SOLUTION_ID = s.SOLUTION_ID
WHERE s.INDUSTRY_ID = '<parent_industry_id>'
  AND s.STATUS = 'Published'
ORDER BY s.SOLUTION_NAME
```

---

## Platform Features per Solution

What Snowflake features power each solution. Use to ground "Why Snowflake" in specific, verifiable capabilities.

```sql
SELECT sf.SOLUTION_ID, s.SOLUTION_NAME,
  pf.FEATURE_NAME, pf.SHORT_DESCRIPTION, pf.LIFECYCLE_STATUS, pf.GA_DATE,
  pf.AWS_AVAILABLE, pf.AZURE_AVAILABLE, pf.GCP_AVAILABLE,
  pf.DOCS_URL, pf.CAPABILITY_TAGS,
  pl.LAYER_NAME AS platform_layer, sf.IS_PRIMARY, sf.MATCH_CONFIDENCE
FROM SUPPORT.ISF.SOLUTION_FEATURES sf
JOIN SUPPORT.ISF.PLATFORM_FEATURES pf ON sf.FEATURE_ID = pf.FEATURE_ID
JOIN SUPPORT.ISF.SOLUTIONS s ON sf.SOLUTION_ID = s.SOLUTION_ID
LEFT JOIN SUPPORT.ISF.PLATFORM_LAYERS pl ON pf.LAYER_ID = pl.LAYER_ID
WHERE s.INDUSTRY_ID = '<parent_industry_id>'
  AND s.STATUS = 'Published' AND pf.IS_ACTIVE = TRUE
  AND (sf.IS_PRIMARY = TRUE OR sf.MATCH_CONFIDENCE = 'high')
ORDER BY s.SOLUTION_NAME, sf.IS_PRIMARY DESC
LIMIT 50
```

Filtered to IS_PRIMARY or high-confidence to keep context manageable (~50 rows vs 700+ raw). For the full feature set, remove the filter.

**Heuristics:**
- Filter to `LIFECYCLE_STATUS = 'GA'` for production claims. Mention Preview only as "upcoming."
- Prefer `IS_PRIMARY = TRUE` and `MATCH_CONFIDENCE = 'high'`.
- Include `DOCS_URL` as clickable link when citing a feature.
- Check cloud availability columns if customer's cloud is known.

---

## Accelerators per Solution

Quickstarts, demo kits, sales plays with direct URLs. Include in output only when rows exist.

```sql
SELECT sa.SOLUTION_ID, s.SOLUTION_NAME,
  sa.ACCELERATOR_NAME, sa.DESCRIPTION, sa.ASSET_TYPE, sa.URL, sa.SOURCE_TYPE
FROM SUPPORT.ISF.SOLUTION_ACCELERATORS sa
JOIN SUPPORT.ISF.SOLUTIONS s ON sa.SOLUTION_ID = s.SOLUTION_ID
WHERE s.INDUSTRY_ID = '<parent_industry_id>'
  AND s.STATUS = 'Published' AND sa.IS_ACTIVE = TRUE
ORDER BY s.SOLUTION_NAME, sa.DISPLAY_ORDER
```

Asset types: Quickstart, Best Practice Guide, Demo Kit, Sales Play.

---

## Top Use Cases for Industry

```sql
SELECT uc.USECASE_ID, uc.NAME, uc.DESCRIPTION, uc.MATURITY_LEVEL, uc.INTENDED_OUTCOMES,
       uc.SUCCESS_METRICS, uc.TYPICAL_INTEGRATIONS,
       '{ISF_BASE}/usecase/' || uc.USECASE_ID as ISF_LINK
FROM SUPPORT.ISF.USE_CASES uc
JOIN SUPPORT.ISF.USECASE_INDUSTRY ui ON uc.USECASE_ID = ui.USECASE_ID
WHERE ui.INDUSTRY_ID = '<parent_industry_id>'
ORDER BY uc.NAME
```

---

## Pre-Joined Views (fast alternatives)

```sql
SELECT * FROM SUPPORT.ISF.VW_AE_PAIN_USECASE_BY_INDUSTRY
WHERE INDUSTRY_ID = '<parent_industry_id>'
```

```sql
SELECT * FROM SUPPORT.ISF.VW_SOLUTIONS_OVERVIEW
WHERE INDUSTRY_ID = '<parent_industry_id>'
```

---

**Tables that do NOT exist or are empty (as of March 2026):**
- `SOLUTION_ARCHITECTURE` — does not exist. `SOLUTION_ARCHITECTURE_DIAGRAMS` exists but contains binary images.
- `OUTCOMES` — 0 rows. Do NOT query.

**Note:** Customer stories (ISF + RAVEN) and account-level initiatives are gathered by the evidence-gatherer subagent. See `.cortex/agents/evidence-gatherer.md`.
