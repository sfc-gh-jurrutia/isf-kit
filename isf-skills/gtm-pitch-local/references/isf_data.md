# ISF Core Data — Account Lookup & Industry Mapping

Reference queries for Step 1: account resolution and industry context. All queries use `snowflake_sql_execute`.

**ISF_BASE:** `https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app`

## Account Lookup

### Primary: ENRICHED_ACCOUNTS_DAILY

The main account dimension. Returns ARR, APS, Fortune rank, firmographics, territory model.

```sql
SELECT ACCOUNT_ID, ACCOUNT_NAME, ACCOUNT_TYPE, ACCOUNT_STATUS,
  REP_NAME AS ae_name, RVP, GVP, DM, REGION, TERRITORY, GEO,
  NAMED_ACCOUNT, ARR, APS, INDUSTRY, SUBINDUSTRY,
  COUNTRY, STATE, ANNUAL_REVENUE, DNB_EMPLOYEE_COUNT,
  FORTUNE_1000_RANK, ES_WEBSITE AS website
FROM SNOWHOUSE.SALES.ENRICHED_ACCOUNTS_DAILY
WHERE LOWER(ACCOUNT_NAME) LIKE LOWER('%<company>%')
QUALIFY DS = MAX(DS) OVER (PARTITION BY ACCOUNT_ID)
ORDER BY ARR DESC NULLS LAST
LIMIT 5
```

### Supplementary: RAVEN (SE name, tier, G2K, tech stack)

Run after the primary lookup using the resolved ACCOUNT_ID. Adds fields not in ENRICHED_ACCOUNTS_DAILY.

```sql
SELECT SALESFORCE_ACCOUNT_ID, LEAD_SALES_ENGINEER_NAME AS se_name,
       ACCOUNT_TIER, IS_G2K, GLOBAL_2000_RANK, TECH_STACK, SEGMENT
FROM SALES.RAVEN.D_SALESFORCE_ACCOUNT_CUSTOMERS
WHERE SALESFORCE_ACCOUNT_ID = '<account_id>'
```

### Fallback: Prospects

If not found in either source above, check prospects:
```sql
SELECT SALESFORCE_ACCOUNT_ID, SALESFORCE_ACCOUNT_NAME, INDUSTRY, SUB_INDUSTRY,
       SEGMENT, SALESFORCE_OWNER_NAME AS AE_NAME,
       LEAD_SALES_ENGINEER_NAME AS SE_NAME, DM, RVP, GVP,
       IS_G2K, GLOBAL_2000_RANK, TYPE
FROM SALES.RAVEN.D_SALESFORCE_ACCOUNT_PROSPECTS
WHERE LOWER(SALESFORCE_ACCOUNT_NAME) LIKE LOWER('%<company>%')
LIMIT 5
```

## Map Account to ISF Industry

### Step 1: SOT Industry Resolution (preferred)

The canonical source-of-truth industry label per account. Use the ACCOUNT_ID from the lookup above.

```sql
SELECT ACCOUNT_ID, SOT_INDUSTRY AS industry_name,
       SOT_SUBINDUSTRY AS subindustry_name, SOURCE_OF_TRUTH
FROM SNOWHOUSE.SALES.INDUSTRY
WHERE ACCOUNT_ID = '<account_id>'
QUALIFY DS = MAX(DS) OVER (PARTITION BY ACCOUNT_ID)
```

### Step 2: SOT_INDUSTRY → ISF INDUSTRY_ID Bridge

Use this static mapping to convert the SOT_INDUSTRY value to an ISF parent INDUSTRY_ID:

| SOT_INDUSTRY | ISF INDUSTRY_ID |
|---|---|
| Healthcare & Life Sciences | IND-HLS |
| Financial Services | IND-FSI |
| Retail & Consumer Goods | IND-RET |
| Media & Entertainment | IND-MED |
| Manufacturing & Industrial | IND-MFG |
| Technology | IND-TECH |
| Telecom | IND-TEL |
| Public Sector | IND-PUB |
| Travel & Hospitality | IND-TRV |
| Hotels and Accommodations | IND-TRV |
| Airlines, Car, Rail, Cruise, Bus | IND-TRV |
| Activities, Parks, Attractions | IND-TRV |
| QSR, Restaurants & Food Service | IND-TRV |
| Travel Tech, OTAs and TMCs | IND-TRV |
| Other Travel and Hospitality | IND-TRV |
| Consulting & Professional Services | *(no ISF parent — ask user for closest industry)* |

### Step 3: Fallback — Fuzzy ISF Lookup

Only use if SOT_INDUSTRY is NULL (rare). Match the SFDC INDUSTRY string against ISF:

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
       '{ISF_BASE}/industry/' || INDUSTRY_ID as ISF_LINK
FROM SUPPORT.ISF.INDUSTRIES
WHERE INDUSTRY_ID = '<parent_industry_id>'
```

Sub-industries:
```sql
SELECT INDUSTRY_ID, INDUSTRY_NAME, DESCRIPTION
FROM SUPPORT.ISF.INDUSTRIES
WHERE PARENT_INDUSTRY_ID = '<parent_industry_id>'
```
