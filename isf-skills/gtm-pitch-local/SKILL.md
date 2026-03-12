---
name: gtm-pitch-local
description: "Fast, focused GTM pitch generator for Snowflake field teams. Combines industry context + persona targeting + competitive positioning into a unified Top-3 pitch. Use when: pitching a company, preparing a quick pitch, need a focused sell sheet, company pitch with persona angle. Triggers: pitch, quick pitch, sell, pitch deck, gtm pitch, company pitch, pitch me, how do I sell, value prop"
---

# GTM Pitch — Fast, Focused Pitch Generator

You generate concise, actionable pitches for Snowflake field teams. Unlike broad meeting prep, you produce a **focused "Top 3" pitch** that combines industry + persona + competitive positioning into a single, time-optimized output.

## When to Use

- User says "pitch [company]", "how do I sell to [company]", "quick pitch for [company]"
- User asks for a focused sell sheet or company pitch with persona angle
- User says "persona pitch for [title]" or "pitch for [industry]"
- Do NOT use for full meeting prep — that's `isf-intelligence`

## Prerequisites

- Snowflake access (for ISF queries via `snowflake_sql_execute`)
- `web_search` tool for real-time company context
- `uv` installed (for .docx generation script)

## Setup

1. **Load** `references/link-rules.md` — link formatting rules for all output
2. **Load** `references/exemplar.md` — canonical output structure to follow exactly

## Constants

```
ISF_BASE = https://kcxcbaixd-sfcogsops-snowhouse-aws-us-west-2.snowflakecomputing.app
```

## ISF Deep Link Rules

Every ISF entity returned MUST include a clickable link:

| Entity | URL Pattern |
|--------|------------|
| Industry | `{ISF_BASE}/industry/{INDUSTRY_ID}` |
| Solution | `{ISF_BASE}/solution/{SOLUTION_ID}` |
| Persona | `{ISF_BASE}/persona/{PERSONA_ID}` |
| Use Case | `{ISF_BASE}/usecase/{USECASE_ID}` |
| Pain Point | `{ISF_BASE}/pain/{PAIN_ID}` |
| Story | `{ISF_BASE}/story/{STORY_ID}` |

Format: `[{ENTITY_NAME}]({URL})`

---

## Workflow Decision Tree

```
Start
  ↓
Parse user request
  ↓
  ├─→ Company name provided     → WORKFLOW: Unified Pitch
  │
  ├─→ Industry only (no company)→ WORKFLOW: Quick Pitch (Industry Only)
  │
  └─→ Persona focus requested   → WORKFLOW: Persona-Focused Pitch
```

---

## WORKFLOW: Unified Pitch

**Trigger:** User says "pitch [company]", "how do I sell to [company]", or any pitch-related request with a company name.

### Step 1: Parse Request & Account Lookup

**Goal:** Identify company, persona, product focus and resolve account + ISF industry.

**Actions:**

1. Extract from user input: **Company name** (required), **Persona** (optional), **Product focus** (optional)
2. **Load** `references/isf_data.md`
3. Run primary account lookup (ENRICHED_ACCOUNTS_DAILY). Get ACCOUNT_ID, ARR, APS, Fortune rank, territory.
4. Run supplementary RAVEN lookup by ACCOUNT_ID for SE name, tier, G2K rank, segment, tech stack.
5. Resolve SOT_INDUSTRY via SNOWHOUSE.SALES.INDUSTRY → use bridge mapping table to get ISF parent INDUSTRY_ID.
6. Fallback: if SOT_INDUSTRY is NULL, use fuzzy LIKE match on SFDC INDUSTRY field.
7. If not found in ENRICHED_ACCOUNTS_DAILY, check RAVEN prospects table.

**If multiple matches:** Ask user to confirm.

**If company not found in SFDC AND web research returns no useful results:**
1. Tell user: "I couldn't find {company} in our systems or on the web."
2. Ask: "What industry are they in?"
3. If user provides industry → use Quick Pitch (Industry Only) workflow
4. If user declines → explain that a pitch requires at least a company name or industry

**⚠️ MANDATORY STOPPING POINT** if disambiguation needed. Do NOT proceed until user responds.

**Output:** Validated account context (company, industry, SFDC ID, tier, segment)

### Step 2: Parallel Data Gather (run ALL in parallel)

**Goal:** Collect all data needed for pitch synthesis.

Execute these simultaneously:

**A) ISF Ontology Walk** (`references/isf_ontology.md`):
1. Industry context from `references/isf_data.md` (MARKET_TRENDS, SNOWFLAKE_POV)
2. Pain → Use Case → Solution chain query (primary graph walk — returns connected triples)
3. Solution → Story chain (links proof points to specific solutions)
4. Top solutions with platform features (SOLUTION_FEATURES → PLATFORM_FEATURES for feature grounding)
5. Accelerators per solution (SOLUTION_ACCELERATORS for quickstart/demo URLs)

**⚠️ MANDATORY — A2) Evidence Gatherer Subagent** (launch in parallel with A):
You MUST launch a `general-purpose` subagent with this prompt:
  `"Read agents/evidence-gatherer.md and follow the workflow. Parameters: industry_id: {industry_id}, industry_name: {industry_name}, account_id: {account_id}, connection: {connection_name}, output_path: /tmp/evidence_pool.json"`
The subagent queries ISF stories + RAVEN quality stories + account initiatives, merges, ranks, enriches with web search for public URLs, and writes JSON to `/tmp/evidence_pool.json`.
**Do NOT proceed to Step 3 without launching this subagent. Proof Point and Customer Stories depend on its output.**

**B) Persona Data** (`references/persona_pitch.md` + `references/isf_ontology.md`) — only if persona specified:
1. Persona lookup with industry context
2. Solutions that solve for this persona (CORE_PROBLEM, WHAT_WE_SOLVE_FOR)
3. Pain points by persona
4. Use cases by persona (USECASE_PERSONA junction — from `references/isf_ontology.md`)

**C) Competitive Intel** — SKIPPED for v1. File retained at `references/competitive.md` for future use.

**D) Web Research** (4+ parallel `web_search` calls):
1. `"{company_name} data strategy AI cloud 2026"`
2. `"{company_name} {industry} technology investments"`
3. `"{company_name} earnings announcements news"`
4. `"{company_name}" data sovereignty data residency compliance regulations`

If account GEO is **EMEA**, also run:
5. `"{company_name} GDPR data sovereignty data residency Europe"`
6. `"{company_name} EU cloud strategy"`

If account GEO is **APAC** or **Japan**, also run:
5. `"{company_name} data residency Asia Pacific"`
6. `"{company_name} cloud strategy APAC"`

**E) CoCo CLI** (`references/coco_cli.md`):
1. Load CoCo CLI value props, customer quotes, benchmarks
2. Run `web_search` for `"Cortex Code" OR "CoCo CLI" site:snowflake.com` for latest announcements

**F) Native CoCo Capabilities** (run in parallel with A-E):
1. Run `cortex skill list` via bash to get all discovered skills
2. Parse TWO categories: **[BUNDLED]** (ship with every CoCo) and **marketplace** (from `~/.snowflake/cortex/skills.json`)
3. EXCLUDE [EXTERNAL] skills (user-created, not Snowflake-native)
4. During Step 3 synthesis, match native skills to customer's INDUSTRY, PERSONA, and Top 3 "Why Snowflake" reasons
5. Use Skill-to-Pillar Mapping Hints from `references/coco_cli.md`

**If error occurs:**
- ISF query fails: Skip that data source, note in output "ISF data unavailable"
- Web search fails: Continue with ISF data only
- CoCo skill list fails: Skip CoCo skills appendix, note limitation
- Evidence subagent fails: Fall back to ISF stories only from Solution → Story chain (Step 2A item 3)
- TEMP table query fails: Skip silently (optional enrichment)

**Output:** Complete data for synthesis

**⚠️ MANDATORY CHECKPOINT before Step 3:** Verify `/tmp/evidence_pool.json` exists (from the evidence subagent). If it does not exist, the subagent was not launched — go back and launch it now. Do NOT synthesize without evidence data.

### Step 3: Synthesize — Two-Tier Output + Auto-Generate .docx

**Goal:** Produce TIER 1 (Summary) + TIER 2 (Detailed) pitch, then auto-generate Word doc.

**Load** `references/exemplar.md` — follow the CANONICAL output structure exactly.

**Theme Propagation:** After synthesizing the Top 3 "Why Snowflake" reasons:
1. Extract key themes (e.g., "data sovereignty", "real-time analytics", "AI/ML modernization")
2. Connect back to these themes in EACH subsequent section
3. Weave web research context into detailed sections — not just the executive summary
4. For sovereignty themes: mention Snowflake regions, FedRAMP/SOC2, data residency capabilities

**Regional Context:** If account GEO is EMEA or APAC:
- In "Why Snowflake": mention Snowflake's regional deployment options and data residency capabilities
- Reference GDPR compliance for EMEA accounts, data sovereignty for APAC
- When citing platform features, check AWS_AVAILABLE/AZURE_AVAILABLE/GCP_AVAILABLE columns for regional availability
- For sovereignty themes: mention Snowflake regions, cross-region inference controls, FedRAMP/SOC2 where relevant

**Feature Grounding:** Cross-reference SOLUTION_FEATURES when building "Why Snowflake" — cite specific GA features by name with docs links. Prefer IS_PRIMARY and high-confidence matches. Do not claim features that aren't in SOLUTION_FEATURES for the recommended solutions.

**Accelerator Linking:** When a solution has SOLUTION_ACCELERATORS rows, include direct URLs to quickstarts/demos instead of just "accelerator available."

**Evidence Pool:** Read `/tmp/evidence_pool.json` (written by the evidence subagent). Use the ranked evidence for:
- Proof Point (TIER 1): pick `evidence[0]` (top-ranked item from merged ISF + RAVEN pool)
- Reference Customers (TIER 1): pick top 3-5 from evidence list
- Customer Stories table (TIER 2): full evidence list with Source column (ISF/RAVEN)
- Account Initiatives (TIER 2, conditional): from `account_initiatives` array in the JSON
If the evidence JSON is not available, fall back to Solution → Story chain from Step 2A.

**Recommended Solutions & Use Cases:** Synthesize ISF solutions (from the ontology walk) with RAVEN use case patterns (from evidence_pool.json `raven_use_case_patterns`):
- ISF solutions have structured data: solution ID, value positioning, features, accelerators, ISF links
- RAVEN patterns have field context: business impact narratives, reference account names, topic clustering
- When an ISF solution and a RAVEN pattern address the same topic, merge them: use ISF for the solution name/link/features, use RAVEN for the business impact language and reference accounts
- When a RAVEN pattern has no ISF equivalent, include it as a use case recommendation with RAVEN's description and business impact
- Present as one unified list ranked by relevance to the account's industry and the Top 3 pitch themes

**Product Focus Override** (if user specified a product area):
1. Rerank ISF solutions: prioritize those whose SNOWFLAKE_PRODUCTS include the specified product
2. In "Why Snowflake": make reason #1 about the specified product area
3. In CoCo Prompts: ensure all 3 prompts demonstrate the product area
4. In section titles: include product focus, e.g., "Why Snowflake Cortex AI for Apple"

**TIER 1: SUMMARY PITCH** (always show first) — follow `references/exemplar.md` TIER 1 structure exactly. Includes:
- Account header, Why Snowflake (Top 3), Why CoCo CLI (3 pillars + quote)
- Top 3 Recommended Solutions & Use Cases, Top 3 Pain Points, Proof Point, Reference Customers
- Persona section (if specified)
- CoCo CLI Prompts (3 copy-paste-ready prompts mapped to Top 3 reasons)
- Appendix: CoCo Skills Reference table (min 5 skills)

**⚠️ MANDATORY: Generate ALL TIER 1 sections including CoCo Prompts and Appendix BEFORE starting TIER 2.**

**TIER 2: DETAILED PITCH** (show after summary) — follow `references/exemplar.md` TIER 2 structure exactly. Includes:
- Industry Context, All Recommended Solutions & Use Cases table (with Top Capabilities column)
- Customer Stories table (unified from evidence_pool.json — includes ISF and RAVEN sources with Source column)
- Assets & Accelerators (conditional — only when SOLUTION_ACCELERATORS has rows)
- Account Initiatives (conditional — from evidence_pool.json `account_initiatives` array)
- CoCo CLI Pitch Detail (3 pillars expanded + benchmarks + quotes + resources)
- Recommended Personas (if none specified)

**CoCo Prompt Rules:**
1. Each prompt MUST map to one of the Top 3 pitch ideas
2. Use customer's ACTUAL industry domain (e.g., "claims and member tables" for healthcare)
3. Reference specific Snowflake capabilities (dbt, Streamlit, Cortex Agent, semantic views, etc.)
4. Reference native CoCo skills by name when they enable a pitch idea
5. Make prompts realistic and immediately executable

**If error occurs:**
- Missing ISF data for a section: skip silently (don't show empty sections)
- No pain point IDs: describe pain point but note "(industry-derived — no ISF link)"

**Output:** Complete two-tier pitch in chat

### Step 3b: Auto-Generate Word Document

**This step is AUTOMATIC.** Every pitch MUST generate a .docx — do NOT wait for user to ask.

**Actions:**

1. **Execute** the reusable generator:
   ```bash
   uv run --project <SKILL_DIRECTORY> python <SKILL_DIRECTORY>/scripts/generate_pitch_docx.py
   ```
   Or import directly: `from generate_pitch_docx import generate_pitch_docx`

2. Assemble pitch data dict from Step 2 + Step 3 outputs with these keys:
   - `company_name`, `industry`, `persona_title`, `sfdc_id`, `account_line`
   - `why_snowflake` — list of (title, description) tuples
   - `why_coco` — list of (pillar_title, description) tuples
   - `coco_quote` — (quote_text, attribution, source_url) tuple
   - `top_solutions` — list of dicts: `name`, `id`, `value`, `products`
   - `pain_points` — list of (title, isf_link, description) tuples
   - `competitive` — dict: `competitors`, `approach`, `edge`
   - `proof_point` — dict: `title`, `url`, `summary`, optional `public_url`
   - `persona` — dict: `fields` (label/value tuples), `isf_link`
   - `industry_context` — dict: `trends_label`, `trends`, `company_context_label`, `company_context`, `snowflake_pov`, `industry_id`, `industry_name`
   - `all_solutions`, `competitive_deep_dive`, `stories`, `coco_detail`, `coco_prompts`, `coco_skills_appendix`, `sources`

3. Save to `~/Downloads/{Company_Name}_{Persona}_GTM_Pitch.docx`
4. Confirm file path and size to user

**If error occurs:**
- `uv` not installed: Warn user, provide install command: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Script import fails: Check `python-docx` is available, run `uv pip install python-docx`
- File write fails: Try alternative path, report error

### Step 4: Offer Enrichment & Next Steps

**Goal:** Present follow-up options.

**Load** `references/enrichments.md` and present the enrichment menu to user.

When user requests an enrichment, **Load** `references/enrichments.md` for query details.

---

## WORKFLOW: Quick Pitch (Industry Only)

**Trigger:** User says "pitch for [industry]" without a company name.

### Step 1: Industry Lookup

**Load** `references/isf_data.md`. Look up industry in ISF. Get INDUSTRY_ID, MARKET_TRENDS, SNOWFLAKE_POV.

**If industry not found:** Ask user to clarify or pick from available industries.

### Step 2: Parallel Data Gather

**A) ISF Data** (`references/isf_ontology.md`): Pain → Use Case → Solution chain, top solutions (LIMIT 5), use cases (LIMIT 5), platform features, accelerators

**A2) Evidence Gatherer Subagent**: Launch with industry_id and industry_name only (no account_id). Writes to `/tmp/evidence_pool.json`.

**B) Web Research**: `"{industry} data analytics AI trends 2026"`, `"{industry} digital transformation priorities"`

### Step 3: Output Industry Pitch

Use same two-tier format from `references/exemplar.md` but without account-specific data:
- TIER 1: Top 3 solutions, Top 3 pains, industry trends, proof point
- TIER 2: Full solutions list, all pain points, all stories, use cases, recommended personas

---

## WORKFLOW: Persona-Focused Pitch

**Trigger:** User says "persona pitch for [title]" or "how do I sell to a [title]"

### Step 1: Context Check

If we already have company/industry context from a prior pitch, reuse it. Otherwise, ask user for company or industry.

**⚠️ MANDATORY STOPPING POINT** if no prior context. Do NOT proceed without industry.

### Step 2: Persona Data

**Load** `references/persona_pitch.md`

1. Find persona by title
2. Get industry-specific perspective
3. Get solution-persona mappings (CORE_PROBLEM, WHAT_WE_SOLVE_FOR, JOBS_TO_BE_DONE)
4. Get pain points by persona

### Step 3: Web Research

Run `web_search`: `"{persona_title} {industry} priorities challenges 2026"`

### Step 4: Output Persona Pitch

```
## 🎯 Persona Pitch: {Persona Name} in {Industry}

**Type:** {PERSONA_TYPE_NAME} | [View in ISF]({ISF_LINK})

### What They Care About
{GOALS_KPIS from PERSONAS_SEARCH_VIEW}

### Their Top Concerns
{TOP_CONCERNS from PERSONAS_SEARCH_VIEW}

### Industry-Specific Angle
{INDUSTRY_TOP_CONCERNS + INDUSTRY_GOALS_KPIS from PERSONA_INDUSTRIES}

### Top 3 Things We Solve
1. **{CORE_PROBLEM_1}** → {WHAT_WE_SOLVE_FOR_1} ([{Solution}]({ISF_LINK}))
2. **{CORE_PROBLEM_2}** → {WHAT_WE_SOLVE_FOR_2} ([{Solution}]({ISF_LINK}))
3. **{CORE_PROBLEM_3}** → {WHAT_WE_SOLVE_FOR_3} ([{Solution}]({ISF_LINK}))

### Objection Handling
{DECISION_FACTORS_OBJECTIONS from PERSONAS base table}

### Demo Hooks
{DEMO_HOOKS from PERSONAS base table}

### CoCo CLI Value for This Persona
{**Load** `references/coco_cli.md` — matched value prop + capabilities to demo + customer quote + resource links}

### Measuring Success
{MEASURING_SUCCESS from top solution-persona match}
```

---

## Tools

### Tool 1: generate_pitch_docx.py

**Description**: Generates a formatted Word document from pitch data with OOXML clickable hyperlinks, styled tables, and branded formatting.

**Usage:**
```bash
uv run --project <SKILL_DIRECTORY> python <SKILL_DIRECTORY>/scripts/generate_pitch_docx.py
```

**Entry point:** `generate_pitch_docx(data: dict, output_path: str) -> str`

**Parameters:**
- `data`: Pitch data dictionary (see Step 3b for full key schema)
- `output_path`: File path for output .docx

**When to use:** Automatically after every pitch synthesis (Step 3b)
**When NOT to use:** For enrichment-only outputs (those stay in chat)

---

## Stopping Points

- ✋ After Step 1 if multiple account matches (disambiguation)
- ✋ After Step 1 if company not found (industry fallback)
- ✋ Before Step 3 if evidence subagent was not launched (go back and launch it)
- ✋ In Persona workflow if no prior context exists

**Resume rule:** Upon user response, proceed directly to next step without re-asking.

## Output

1. **TIER 1: Summary Pitch** — scannable Top 3 format with ISF deep links
2. **TIER 2: Detailed Pitch** — expanded tables, competitive deep dive, CoCo detail
3. **Word document** — auto-saved to `~/Downloads/{Company}_{Persona}_GTM_Pitch.docx`
4. **Enrichment menu** — optional follow-up sections

## Output Rules

1. **Always** show TIER 1 first, then TIER 2
2. **MANDATORY:** Include ISF deep links for EVERY entity (see `references/link-rules.md`)
3. **Always** cite data sources (ISF, SNOWHOUSE, web)
4. **Top 3 format** — never list more than 3 items in TIER 1 sections
5. **Performance target** — complete pitch in under 2 minutes
6. **Web research** — always include for real-time company context
7. If a query returns no results, skip that section silently
8. **CoCo CLI sections** — structure around 3 official value pillars (Faster Innovation, Deep Awareness, Enterprise-Ready) with pillar-matched customer quotes
9. **CoCo Prompts** — ALWAYS generate 3 copy-paste-ready prompts in TIER 1
10. **Word doc** — ALWAYS auto-generate on every pitch run
11. **CoCo Skills Appendix** — ALWAYS include in TIER 1 (min 5 skills)
12. **Formatting** — follow `references/exemplar.md` exactly. Emoji pillar headers ONLY for CoCo (🚀 🧠 🏛️). Use "Summary Pitch" / "Detailed Pitch" naming.
13. **Top Capabilities** — if SOLUTION_FEATURES returns rows, include "Top Capabilities" column in the solutions table citing specific GA features with docs links.
14. **Assets & Accelerators** — if SOLUTION_ACCELERATORS returns rows, include section in TIER 2 with direct URLs. Omit if empty.
15. **Account Initiatives** — if evidence_pool.json has `account_initiatives` entries, include section in TIER 2. Omit if empty.
16. **Customer Stories** — use evidence_pool.json as the unified source. Include Source column (ISF/RAVEN). Include problem_challenge and snowflake_solution columns when populated from RAVEN.
17. **Conditional sections** — all new sections (13-16) are omitted when no data exists. Never show empty sections.

## Success Criteria

- ✅ Two-tier pitch rendered with all ISF deep links working
- ✅ Word doc saved to ~/Downloads/ with proper hyperlinks
- ✅ CoCo prompts are domain-specific and executable
- ✅ All entities linked per `references/link-rules.md`
- ✅ Complete in under 2 minutes
