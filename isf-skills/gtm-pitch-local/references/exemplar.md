# Reference Exemplar: Gold-Standard Pitch Output

The following is the CANONICAL output structure. Every pitch MUST follow this exact section ordering, link formatting, and content depth. Use this as your template for reliable, consistent output.

**Exemplar: Elevance Health CMO Pitch (March 2026)**

## TIER 1 Structure (follow exactly):

```
## 🎯 Pitch: {Company Name} ({Industry})

**Account:** {Tier} | {Segment} | AE: {AE} | SE: {SE} | GVP: {GVP} | ARR: {ARR} | Fortune: {rank} | {Existing/Prospect}

### Why Snowflake for {Company}
Top 3 reasons synthesized from industry trends + company context + web research:
1. **{Reason 1 — tied to #1 business priority}** — {2-3 sentence value prop with specific company context from web research, naming executive quotes/initiatives where found}
2. **{Reason 2 — tied to industry trend}** — {2-3 sentence value prop referencing specific market dynamics and how Snowflake addresses them}
3. **{Reason 3 — tied to tech stack/data strategy}** — {2-3 sentence value prop connecting their known tech investments to Snowflake capabilities}

### Why CoCo CLI for {Company}
1. **🚀 Faster Innovation** — {persona-matched capability: Streamlit, dbt, agents, notebooks etc. tied to their specific workflow need}
2. **🧠 Deep Awareness** — {how CoCo's data context solves their specific data challenge — catalog, schema, admin}
3. **🏛️ Enterprise-Ready** — {governance/compliance angle for their industry — HIPAA, NIST, SOX, FINRA etc. + MCP/agents.md}

> _{ONE customer quote from references/coco_cli.md — pick from same industry or regulated industry if healthcare/financial}_
> _Source: [{source_label}]({source_url})_

Links: [Product Page](...) | [Blog](...) | [Compass](...) | [Docs](...) | [Try Free](...)

### Top 3 Recommended Solutions & Use Cases
1. **[{Solution/Use Case Name}]({ISF_LINK or n/a})** — {value positioning or business impact} | Products: {products if ISF} | [View brief]({link if ISF})
2. **[{Solution/Use Case Name}]({ISF_LINK or n/a})** — {value positioning or business impact} | Products: {products if ISF} | [View brief]({link if ISF})
3. **[{Solution/Use Case Name}]({ISF_LINK or n/a})** — {value positioning or business impact} | Products: {products if ISF} | [View brief]({link if ISF})

### Top 3 Pain Points to Lead With
1. **[{Pain}]({ISF_BASE}/pain/{PAIN_ID})** — {description}
2. **[{Pain}]({ISF_BASE}/pain/{PAIN_ID})** — {description}
3. **[{Pain}]({ISF_BASE}/pain/{PAIN_ID})** — {description}

### Proof Point
**[{Story Title}]({ISF_BASE}/story/{STORY_ID})** — {CUSTOMER_NAME}: {OUTCOMES_SUMMARY}
Links: [ISF Detail]({ISF_LINK}) | [Public Case Study]({URL})

### Reference Customers
1. **{Customer 1}** — {one-line outcome} | [Case Study]({URL})
2. **{Customer 2}** — {one-line outcome} | [Case Study]({URL})
3. **{Customer 3}** — {one-line outcome} | [Case Study]({URL})

### Persona: {Title} ({PERSONA_TYPE_NAME})
**Their Priority:** ...
**Industry Concerns:** ...
**Lead With:** ...
**We Solve:** ...
**Demo Hook:** ...
**Objections:** ...
**CoCo Value:** ...
```

## TIER 2 Structure (follow exactly):

```
---
## 📋 Detailed Pitch

### Industry Context
{MARKET_TRENDS as bullet list}
{Company-specific context from web research — executive quotes, AI strategy, financials, recent announcements}
{SNOWFLAKE_POV}
[View {Industry} in ISF]({ISF_BASE}/industry/{INDUSTRY_ID})

### All Recommended Solutions & Use Cases
| Solution / Use Case | Value Positioning | Top Capabilities | Source | Links |
|---------------------|------------------|-----------------|--------|-------|
| **[{ISF Solution}]({ISF_LINK})** | {value positioning} | {2-3 GA features with docs links} | ISF | [View brief]({ISF_LINK}) |
| {RAVEN Use Case Pattern} | {business impact} | — | RAVEN | {reference accounts} |
{ISF rows have features, accelerators, and ISF links. RAVEN rows have business impact and reference accounts. Unified list ranked by relevance.}

### Customer Stories (from evidence_pool.json — unified ISF + RAVEN)
| Story | Customer | Outcomes | Source | ACV | Links |
|-------|----------|----------|--------|-----|-------|
| {title} | {customer_name} | {outcomes} | ISF | — | [{detail_link}]({detail_link}) \| [Public]({public_url}) |
| {title} | {inferred} | {outcomes} | RAVEN | {acv} | [Public]({public_url}) |
{Ranked by the evidence subagent. Include problem_challenge and snowflake_solution when available from RAVEN rows.}

### Assets & Accelerators (conditional — only when SOLUTION_ACCELERATORS returns rows)
| Solution | Asset | Type | Link |
|----------|-------|------|------|
| {Solution Name} | {Accelerator Name} | {Quickstart / Guide / Demo} | [{URL}]({URL}) |

### Account Initiatives (conditional — from evidence_pool.json account_initiatives array)
| Initiative | Topic | Description |
|-----------|-------|-------------|
| {use_case_name} | {topic} | {description} |

### CoCo CLI Pitch Detail
**Pillar 1 — Faster Innovation:**
- {3 bullet points specific to this customer}

**Pillar 2 — Deep Awareness:**
- {3 bullet points specific to this customer}

**Pillar 3 — Enterprise-Ready:**
- {3 bullet points specific to this customer}

**Benchmarks:** ADE-Bench: 65% vs Claude Code 58% | evolv: $100K in 20 days

**Customer Quotes:**
> "{quote 1}" — **{name, title, company}** (relevance note) | [Source]({source_url})
> "{quote 2}" — **{name, title, company}** (relevance note) | [Source]({source_url})
> "{quote 3}" — **{name, title, company}** (relevance note) | [Source]({source_url})

**Resources:** [Product Page](...) | [Blog](...) | [Compass](...) | [Docs](...) | [Try Free](...) | [GA Press Release](...)

### 🖥️ Try It in CoCo CLI — Top 3 Pitch Ideas in Action

**Pitch Idea 1: {Title matches Why Snowflake #1}**
> `{CoCo prompt customized to their industry/domain/tables}`
> *What CoCo will build:* {1-line description}

**Pitch Idea 2: {Title matches Why Snowflake #2}**
> `{CoCo prompt}`
> *What CoCo will build:* {1-line description}

**Pitch Idea 3: {Title matches Why Snowflake #3}**
> `{CoCo prompt}`
> *What CoCo will build:* {1-line description}

💡 **Getting started:** Install CoCo CLI: `curl -LsS https://ai.snowflake.com/static/cc-scripts/install.sh | sh`
Or sign up at https://signup.snowflake.com/cortex-code ($40 free credits for 30 days)

### Appendix: CoCo Skills Reference
| Skill | Type | Pillar | Description | Relevance to {Company} |
|-------|------|--------|-------------|----------------------|
| {skill_name} | {BUNDLED/Marketplace} | {Innovation/Awareness/Enterprise} | {description} | {1-line customer relevance} |
{Minimum 5 skills. NEVER omit this section.}

---
*Data Sources: {list sources used, e.g., ISF, RAVEN Quality Stories, RAVEN Catalog, Web Research}*
*Generated: {date}*
```

## Key Patterns to Replicate

1. **Why Snowflake reasons are RICH** — 2-3 sentences each, citing specific executive names, initiatives, and financial context from web research
2. **CoCo section uses emoji pillar headers** (🚀 🧠 🏛️) for quick scanning
3. **Solutions table has LINKS column** — every row has [View full brief] link
4. **Stories table has LINKS column** — every row has [ISF] and [Public] links
5. **CoCo Prompts are domain-specific** — use healthcare terms like "claims", "member", "AEP", "HEDIS" for healthcare; "orders", "inventory" for retail; etc.
6. **CoCo quotes include relevance note AND source link** — e.g., "(regulated industry parallel)" + `| [Source](url)`. Source URLs are in `references/coco_cli.md` Quote Sources table.
7. **Competitive section names executives** — e.g., "Lavu comes from Nike/Kohl's with deep AWS experience"
8. **Word doc is AUTO-GENERATED every run** — use the reusable module at `<SKILL_DIRECTORY>/scripts/generate_pitch_docx.py`. Call `generate_pitch_docx(data, output_path)` with the assembled pitch data dict. Uses proper OOXML hyperlinks (blue, underlined, no raw URLs). Always confirm file path and size at the end of chat output.
9. **Top Capabilities cite specific GA features** with docs links, not generic claims. Sourced from SOLUTION_FEATURES → PLATFORM_FEATURES.
10. **Accelerator links replace boolean HAS_ACCELERATOR** with direct URLs to quickstarts, demo kits, and sales plays.
11. **Account Initiatives only appear when evidence_pool.json has account_initiatives entries.** Omit if empty.
12. **Customer Stories are a unified pool** from the evidence subagent — ISF and RAVEN merged, ranked, with public URLs enriched via web search. The Source column shows provenance.
