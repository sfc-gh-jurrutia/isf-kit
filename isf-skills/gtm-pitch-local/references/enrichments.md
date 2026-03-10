# Enrichment Sections

Load this file when user requests enrichment sections after the base pitch is delivered.

## Available Enrichments

Offer these after presenting the pitch:

> **Want more depth?** Say any of these to add enrichment sections powered by ISF data:
> - **"buyer signals"** — actual buyer quotes (SIGNALS_VERBATIMS) and frequency data for each pain point
> - **"solution architecture"** — technical architecture patterns by maturity level
> - **"outcomes & KPIs"** — measurable targets with timeframes for each solution
> - **"story shareability"** — which stories are safe to share externally + reference call guidance
> - **"use case maturity"** — maturity certification details, success metrics, integration patterns
> - **"compliance brief"** — industry-specific compliance frameworks
> - **"all enrichments"** — include everything above
>
> **Other options:**
> - Say **"persona pitch for [title]"** for persona-specific messaging
> - Say **"competitive deep dive"** to expand competitive analysis
> - Say **"meeting prep for [company]"** for full meeting prep (via isf-intelligence)

## Enrichment Query Details

### "buyer signals"
- Query PAINS with `SIGNALS_VERBATIMS`, `FREQUENCY`, `IMPACTED_METRICS` columns
- Format: for each pain point, show buyer quote in blockquote, frequency badge, and list of impacted metrics
- Lead with highest-severity, highest-frequency pains

### "solution architecture"
- Query `SOLUTION_ARCHITECTURE` table (see isf_data.md enrichment section)
- Format: for each solution, show architecture patterns at each maturity level, organized by platform category
- Highlight patterns that match the customer's current maturity

### "outcomes & KPIs"
- Query `OUTCOMES` table (see isf_data.md enrichment section)
- Format: table with Solution | KPI | Target | Timeframe
- Flag outcomes that align with the persona's GOALS_KPIS

### "story shareability"
- Use CONFIDENTIALITY_LEVEL, ANONYMIZED, ASSET_LEVEL from stories query
- Format: table showing each story's shareability status (Public/Customer-OK/Internal/Confidential)
- Guidance: which to use in external decks, which need anonymization, which have video/PDF assets

### "use case maturity"
- Use SUCCESS_METRICS, TYPICAL_INTEGRATIONS, MATURITY_LEVEL from use cases query
- Format: grouped by maturity level (L3 Foundational → L1 Emerging)
- Show integration patterns and success metrics for each

### "compliance brief"
- Run `web_search` for `"{industry}" compliance frameworks data governance 2026`
- Cross-reference with ISF industry data (MARKET_TRENDS, SNOWFLAKE_POV)
- Industry frameworks:
  - Healthcare: HIPAA, HEDIS, STAR, FHIR, HL7
  - FSI: SOX, FINRA, OCC, FRTB, CCAR, Basel III
  - Public Sector: FedRAMP, FISMA, NIST 800-53
- Map to relevant CoCo skills: `data-governance`, `sensitive-data-classification`, `data-policy`

### "all enrichments"
Run all of the above in parallel, output as additional sections after the base pitch.
