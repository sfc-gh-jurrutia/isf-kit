---
name: isf-skill-discovery
description: >
  Discover industry-specific skills in the Cortex Code environment. Scans all
  available skills, matches against the industry from isf-context.md using
  frontmatter tags and fuzzy name/description matching, and produces an
  industry-skills.md artifact for the planning phase. Use when: starting a new
  ISF solution after spec curation, checking available domain skills for an
  industry, or updating skill mappings for an existing project. Triggers:
  discover skills, find industry skills, domain expertise, skill scan.
parent_skill: isf-solution-engine
---

# ISF Skill Discovery

## When to Use

Run this skill after `isf-spec-curation` has produced an `isf-context.md` with an industry field populated. It discovers domain-specific skills in the user's environment that can enhance the ISF pipeline with industry expertise.

This skill is optional -- if skipped, the pipeline proceeds with only the ISF framework skills.

## Workflow

### Step 1: Load Context

**Goal:** Extract the target industry from the curated spec.

**Actions:**
1. **Read** `specs/{solution}/isf-context.md`
2. **Extract** `isf_context.industry` (e.g., "FSI", "Energy", "HLS", "RET", "MFG")
3. **Extract** `isf_context.industry_segment` if present (e.g., "upstream_oil_gas", "commercial_banking")

**If isf-context.md is missing or industry field is empty:**
- **Ask** the user to provide the industry, or direct them to run `isf-spec-curation` first

**Output:** Industry identifier + optional segment

### Step 2: Scan Environment

**Goal:** Inventory all non-ISF skills available in the environment.

**Actions:**
1. **List** all skill directories available in the Cortex Code environment
2. **Read** the `SKILL.md` frontmatter (first 20 lines) of each skill
3. **Skip** ISF framework skills (`isf-*` prefix) -- only looking for domain-specific skills
4. **Record** each skill's name, description, and any `industry:` / `domain:` / `provides:` frontmatter fields

**Output:** List of candidate skills with metadata

### Step 3: Match Candidates

**Goal:** Identify skills relevant to the target industry.

**Actions:**
1. **Pass 1 -- Frontmatter tag match:**
   - Check for `industry:` or `domain:` field in the SKILL.md frontmatter
   - Match: exact or substring, case-insensitive
   - Example: `industry: energy` matches `isf_context.industry: "Energy"`

2. **Pass 2 -- Fuzzy name/description match:**
   - Check skill `name:` and `description:` for industry-related keywords
   - Example: skill `aviation-ops-patterns` with "airline" in description matches industry "AME"
   - Only include high-confidence fuzzy matches

3. **Exclude** clearly unrelated skills

**Output:** Ranked candidate list with match type (tag / fuzzy)

### Step 4: Present Candidates

**Goal:** Get user approval on which skills to incorporate.

**Actions:**
1. **Present** a table to the user:

```
Discovered Industry Skills for [industry]:

| Skill | Match | Provides | Suggested Phase |
|-------|-------|----------|-----------------|
| [name] | Tag: industry=energy | data_patterns, domain_terminology | Data Architecture |
| [name] | Fuzzy: "airline" in description | visualization_components | React App |
```

2. **Ask** the user to approve or reject each candidate
3. For approved skills, confirm the suggested pipeline phase mapping

**⚠️ MANDATORY STOPPING POINT**: Do NOT proceed until user responds. Present findings and wait for explicit approval.

**If no candidates found:**
- Report "No industry-specific skills found in your environment."
- Write an empty `industry-skills.md` and proceed to next skill

### Step 5: Write Output

**Goal:** Produce the `industry-skills.md` artifact.

**Actions:**
1. **Write** `specs/{solution}/industry-skills.md` with:
   - Header with industry and scan timestamp
   - Approved skills section: name, match type, what it provides, pipeline phase, load path
   - Rejected skills section (for context): name, reason for rejection
   - If no skills approved, note that the pipeline will use only ISF framework skills

**Output:** `specs/{solution}/industry-skills.md`

## Recommended Frontmatter for Industry Skill Authors

If you are creating domain-specific skills that should be discoverable by this scan, include these optional frontmatter fields:

```yaml
---
name: my-industry-skill
description: Domain expertise for [industry] solutions
industry: energy
industry_segment: upstream_oil_gas
provides:
  - data_patterns
  - style_overrides
  - domain_terminology
  - visualization_components
---
```

## How Industry Skills Influence the Pipeline

Approved industry skills act as **companion context** -- CoCo reads them alongside the primary ISF skills for domain patterns. The ISF skills remain the primary pipeline drivers.

| Pipeline Phase | How Industry Skill Helps |
|---------------|-------------------------|
| Data Architecture | Domain entity patterns, naming conventions, compliance requirements |
| Data Generation | Realistic value ranges, domain-specific distributions |
| Industry Context | Domain knowledge corpus, regulatory references |
| Cortex Analyst | Semantic model hints, KPI definitions |
| Style Guide | Industry accent colors, persona definitions |
| React App | Domain-specific visualization components |
| Testing | Domain validation rules, edge cases |

## Stopping Points

- ⚠️ After Step 4 (candidate presentation) -- user must confirm skill selections
- ⚠️ If `isf-context.md` is missing -- ask user before proceeding

## Output

`specs/{solution}/industry-skills.md` containing:
- Approved industry skills with pipeline phase mappings and load paths
- Rejected skills for reference
- Empty artifact if no skills found (pipeline continues normally)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No `isf-context.md` found | Direct user to run `isf-spec-curation` first |
| No industry field in spec | Ask user to provide their industry identifier |
| No skills found | Normal -- write empty artifact, pipeline continues with ISF skills only |
| Skill frontmatter unreadable | Skip that skill, log a warning, continue scanning |
| Too many false positives | Tighten matching: prefer tag matches over fuzzy, ask user to confirm |

## Contract

**Inputs:**
- `specs/{solution}/isf-context.md` (from `isf-spec-curation`)

**Outputs:**
- `specs/{solution}/industry-skills.md` (consumed by `isf-solution-planning`)

## Next Skill

**Continue to** `../isf-solution-planning/SKILL.md` to plan the solution architecture, incorporating any approved industry skills.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 2.
