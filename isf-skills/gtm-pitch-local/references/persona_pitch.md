# Persona Pitch Data — SUPPORT.ISF

Persona-specific queries for targeted pitch messaging.

**ISF_BASE:** `https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app`

## Find Persona by Title/Role

```sql
SELECT PERSONA_ID, PERSONA_NAME, TYPE, CANONICAL_NAME,
       'https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/persona/' || PERSONA_ID as ISF_LINK
FROM SUPPORT.ISF.PERSONAS
WHERE LOWER(PERSONA_NAME) LIKE LOWER('%<title>%')
   OR LOWER(TYPE) LIKE LOWER('%<title>%')
   OR LOWER(CANONICAL_NAME) LIKE LOWER('%<title>%')
```

## Persona with Industry Context

Two queries needed — PERSONAS_SEARCH_VIEW for core persona + PERSONA_INDUSTRIES for industry context:

```sql
SELECT p.PERSONA_ID, p.PERSONA_NAME, p.PERSONA_TYPE_NAME,
       p.ROLE_DESCRIPTION, p.KEY_RESPONSIBILITIES,
       p.GOALS_KPIS, p.TOP_CONCERNS, p.DECISION_FACTORS,
       p.SYSTEMS_USED, p.DATA_SOURCES,
       'https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/persona/' || p.PERSONA_ID as ISF_LINK
FROM SUPPORT.ISF.PERSONAS_SEARCH_VIEW p
WHERE (LOWER(p.PERSONA_NAME) LIKE LOWER('%<persona_title>%')
       OR LOWER(p.PERSONA_TYPE_NAME) LIKE LOWER('%<persona_title>%'))
  AND p.INDUSTRY_ID = '<parent_industry_id>'
```

Then get industry-specific perspective:
```sql
SELECT pi.INDUSTRY_TOP_CONCERNS, pi.INDUSTRY_GOALS_KPIS,
       pi.INDUSTRY_ROLE_DESCRIPTION, pi.INDUSTRY_RESPONSIBILITIES,
       pi.INDUSTRY_DECISION_FACTORS, pi.AI_BRIEF
FROM SUPPORT.ISF.PERSONA_INDUSTRIES pi
WHERE pi.PERSONA_ID = '<persona_id>'
  AND pi.INDUSTRY_ID = '<parent_industry_id>'
```

Note: If FSI-specific persona (e.g. PER-CHIEF-REVENUE-OFFICE-FSI) has no PERSONA_INDUSTRIES row, try the CORE variant (e.g. PER-CHIEF-REVENUE-OFFICE-CORE) with INDUSTRY_ID = '<parent_industry_id>'.

Also check PERSONAS base table for additional fields:
```sql
SELECT PERSONA_ID, PERSONA_NAME, TYPE, DEMO_HOOKS,
       DECISION_FACTORS_OBJECTIONS, AI_BRIEF,
       ROLE_INFLUENCE, SYSTEMS_DATA
FROM SUPPORT.ISF.PERSONAS
WHERE PERSONA_ID = '<persona_id>'
```

Key columns for pitch:
- `GOALS_KPIS` — what this persona measures success by (from PERSONAS_SEARCH_VIEW)
- `TOP_CONCERNS` — their pain points and worries (from PERSONAS_SEARCH_VIEW)
- `DECISION_FACTORS` — buy decision drivers (from PERSONAS_SEARCH_VIEW)
- `DECISION_FACTORS_OBJECTIONS` — objections and pushback (from PERSONAS base table)
- `DEMO_HOOKS` — what to show in a demo (from PERSONAS base table)
- `ROLE_INFLUENCE` — this persona's influence level in buying decisions (from PERSONAS base table)
- `SYSTEMS_DATA` — systems and data sources this persona works with daily (from PERSONAS base table)
- `INDUSTRY_TOP_CONCERNS` — industry-specific concerns (from PERSONA_INDUSTRIES)
- `INDUSTRY_GOALS_KPIS` — industry-specific KPIs (from PERSONA_INDUSTRIES)

## Solutions That Solve for This Persona

```sql
SELECT sp.SOLUTION_ID, s.SOLUTION_NAME,
       sp.CORE_PROBLEM, sp.WHAT_WE_SOLVE_FOR, sp.JOBS_TO_BE_DONE, sp.MEASURING_SUCCESS,
       'https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/solution/' || s.SOLUTION_ID as ISF_LINK
FROM SUPPORT.ISF.SOLUTION_PERSONAS sp
JOIN SUPPORT.ISF.SOLUTIONS s ON sp.SOLUTION_ID = s.SOLUTION_ID
WHERE sp.PERSONA_ID = '<persona_id>'
  AND s.INDUSTRY_ID = '<parent_industry_id>'
  AND s.STATUS = 'Published'
```

Key pitch fields:
- `CORE_PROBLEM` — the exact problem this persona faces
- `WHAT_WE_SOLVE_FOR` — how Snowflake solves it
- `JOBS_TO_BE_DONE` — functional/emotional jobs
- `MEASURING_SUCCESS` — ROI metrics to cite

## Pain Points by Persona

```sql
SELECT p.PAIN_ID, p.TITLE, p.SEVERITY, p.DESCRIPTION,
       'https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/pain/' || p.PAIN_ID as ISF_LINK
FROM SUPPORT.ISF.PAIN_PERSONA pp
JOIN SUPPORT.ISF.PAINS p ON pp.PAIN_ID = p.PAIN_ID
WHERE pp.PERSONA_ID = '<persona_id>'
ORDER BY p.SEVERITY DESC
```

## Combined Pain → Use Case → Solution by Persona

```sql
SELECT * FROM SUPPORT.ISF.VW_AE_PAIN_USECASE_BY_PERSONA
WHERE PERSONA_ID = '<persona_id>'
```

## CoCo CLI Value Props by Persona Type

Use these when pitching Cortex Code (CoCo) to specific personas:

| Persona Type | CoCo Value Prop |
|---|---|
| CDO / Chief Data Officer | "One AI IDE across your entire data org — governs who queries what, enforces policies, tracks lineage" |
| CRO / Chief Revenue Officer | "Real-time revenue and cost visibility — CoCo surfaces cross-sell analytics, credit usage, and pipeline insights directly in the developer workflow" |
| VP Engineering / Platform | "Your devs ship Snowflake pipelines 3x faster — AI-assisted SQL, dbt, Streamlit, all with RBAC built in" |
| Data Engineer | "Stop context-switching — write SQL, build dbt models, deploy Streamlit apps, manage stages, all in one terminal" |
| Data Scientist / ML Engineer | "Train, register, and deploy ML models to Snowflake without leaving your IDE — notebooks, model registry, SPCS" |
| Analytics Engineer | "Semantic models, dynamic tables, and dbt in one flow — CoCo understands your schema and writes correct SQL" |
| CISO / Security | "Every query audited, secrets never stored in code, RBAC enforced at IDE level — compliance by default" |
| CFO / Finance | "Real-time cost visibility — CoCo surfaces credit usage, warehouse spend, and optimization recommendations" |
