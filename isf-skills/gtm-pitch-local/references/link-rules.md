# Mandatory Link Rules

This is the HIGHEST PRIORITY output rule. Every pitch output — whether markdown or Word doc — MUST include clickable links for EVERY entity. **Never output a solution name, pain point, story, use case, or persona without its link.**

## ISF Deep Links (REQUIRED for every entity)

| Entity | Link Format | Example |
|--------|------------|--------|
| Solution | `[{SOLUTION_NAME}]({ISF_BASE}/solution/{SOLUTION_ID})` | [Aura Marketing Intelligence](https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/solution/SOL-HLS-219536) |
| Story | `[{TITLE}]({ISF_BASE}/story/{STORY_ID})` | [Anthem Population Health](https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app/story/STY-1765472498055-1) |
| Pain Point | `[{PAIN_NAME}]({ISF_BASE}/pain/{PAIN_ID})` | Link to ISF pain point detail |
| Industry | `[{INDUSTRY_NAME}]({ISF_BASE}/industry/{INDUSTRY_ID})` | Link to ISF industry brief |
| Persona | `[{PERSONA_NAME}]({ISF_BASE}/persona/{PERSONA_ID})` | Link to ISF persona detail |
| Use Case | `[{USECASE_NAME}]({ISF_BASE}/usecase/{USECASE_ID})` | Link to ISF use case |

## External Links (REQUIRED where available)

| Asset Type | When to Include | How to Find |
|-----------|----------------|------------|
| Public Case Study | Every customer story | Use `REFERENCE_URL` from STORIES query. If NULL, search `site:snowflake.com "{CUSTOMER_NAME}" case study` |
| Snowflake Customer Page | Every customer story | `https://www.snowflake.com/en/customers/all-customers/case-study/{slug}/` or `/video/{slug}/` |
| CoCo CLI Product Page | Every CoCo section | https://www.snowflake.com/en/product/features/cortex-code/ |
| CoCo CLI Blog | Every CoCo section | https://www.snowflake.com/en/blog/cortex-code-cli-expands-support/ |
| CoCo Compass (Internal) | Every CoCo section | https://snowflake.seismic.com/Link/Content/DCq6VH9PcX6h3GWPVGhTgVPgXqHd |
| CoCo Docs | Every CoCo section | https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code-cli |
| CoCo Try Free | Every CoCo section | https://signup.snowflake.com/cortex-code |
| GA Press Release | CoCo Detailed section | https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/ |

## Link Enforcement Checklist (verify before output)

- [ ] Every solution in Top 3 Solutions has `[Name](ISF_LINK)`
- [ ] Every solution in All Recommended Solutions table has `[Name](ISF_LINK)` + `[View full brief](ISF_LINK)`
- [ ] Every pain point has `[Name](ISF_LINK)` if PAIN_ID is available
- [ ] Every customer story has `[Title](ISF_LINK)` + `[Public Case Study](URL)` if available
- [ ] Industry section has `[View {Industry} in ISF](ISF_LINK)`
- [ ] CoCo CLI sections have ALL 5 resource links (Product Page, Blog, Compass, Docs, Try Free)
- [ ] Proof Point story has both ISF link and public case study link
- [ ] Word doc output uses proper OOXML clickable hyperlinks (display text only, no raw URLs) via `add_hyperlink()` helper
