# Pre-Intake Research Protocol

> Load this reference at **Step 0 (Research)** — before intake questions. The goal is to learn the customer's language, pain points, and industry context so intake questions are targeted rather than generic.

## When to Run Research

Run research when:
- A specific company or account is identified
- An industry vertical is targeted (even without named company)
- The solution will reference real-world terminology or metrics

Skip research when:
- Building a generic capability solution (no industry context)
- Internal tooling or proof-of-concept only

## Research Sources

### Company-Specific (when named account)

| Source | What to Extract | Where to Find |
|--------|----------------|---------------|
| **10-K Filing** | Risk factors, business segments, key metrics | SEC EDGAR or investor relations page |
| **Earnings Call Transcripts** | Current priorities, pain points in leadership's words | Seeking Alpha, company IR page |
| **Annual Report** | Strategic initiatives, KPIs, growth areas | Company website |
| **Press Releases** | Recent partnerships, product launches, org changes | Company newsroom |
| **Job Postings** | Technology stack, team structure, skill gaps | LinkedIn, company careers page |

### Industry-Specific (always)

| Source | What to Extract |
|--------|----------------|
| **Industry analyst reports** | Market trends, common challenges, benchmark metrics |
| **Regulatory landscape** | Compliance requirements, reporting obligations |
| **Competitive dynamics** | Key players, differentiation factors |
| **Technology adoption** | Common tools, migration patterns, modernization trends |

## Research Output Format

Produce a research brief in this format:

```markdown
## Research Brief: {Company/Industry}

### Company Profile
- **Industry**: {industry vertical}
- **Size**: {revenue range, employee count}
- **Key Segments**: {business units or product lines}

### Terminology Map
| Their Term | Standard Term | Context |
|-----------|---------------|---------|
| {customer word} | {our equivalent} | {where they use it} |

### Identified Pain Points
1. {Pain point from 10-K risk factors or earnings call}
2. {Pain point from industry analysis}
3. {Pain point from job postings / team structure}

### Key Metrics They Track
- {Metric 1}: {definition, typical range}
- {Metric 2}: {definition, typical range}

### Regulatory / Compliance Context
- {Relevant regulations}
- {Reporting requirements}

### Technology Landscape
- **Current Stack**: {known tools, platforms}
- **Migration Signals**: {cloud adoption, modernization mentions}

### Hidden Discovery Candidates
Things they may not know they need:
1. {Insight from cross-referencing their data with industry benchmarks}
2. {Pattern that similar companies discovered after data centralization}
```

## How Research Feeds Into Intake

| Research Finding | Intake Impact |
|-----------------|---------------|
| Terminology map | Use their words in questions, not generic terms |
| Pain points | Ask "how do you currently handle {pain point}?" |
| Key metrics | Ask "would you want to see {metric} in the solution?" |
| Compliance context | Ask about data sensitivity and access controls |
| Technology stack | Tailor integration and deployment questions |
| Hidden discovery candidates | Seed the narrative arc for the solution |

## Industry Research Templates

### Manufacturing
- OEE (Overall Equipment Effectiveness) targets
- Quality metrics: FPY, scrap rate, rework cost
- Supply chain tiers: T1, T2, T3 supplier visibility
- Regulatory: ISO 9001, IATF 16949, FDA 21 CFR Part 11

### Financial Services
- AUM (Assets Under Management) or loan portfolio size
- Risk metrics: VaR, capital adequacy, liquidity ratios
- Regulatory: SOX, Basel III/IV, DORA, AML/KYC
- Trading vs. banking vs. wealth management focus

### Healthcare
- Patient volume, bed count, claims processed
- Quality metrics: readmission rates, length of stay, HCAHPS
- Regulatory: HIPAA, HITECH, CMS requirements
- Payer vs. provider vs. pharma distinction

### Retail / CPG
- SKU count, channel mix (DTC, wholesale, marketplace)
- Metrics: same-store sales, inventory turns, gross margin
- Seasonality patterns and promotional calendar
- Supply chain: vendor compliance, fill rates

### Technology / SaaS
- ARR, MRR, customer count
- Metrics: churn rate, NRR, CAC/LTV, DAU/MAU
- Product-led vs. sales-led growth model
- Data volume: events/day, storage growth rate

### Energy / Utilities
- Generation capacity, customer meters
- Metrics: SAIDI/SAIFI (reliability), load factor, line losses
- Regulatory: NERC CIP, state PUC requirements
- Renewable mix and decarbonization targets

## Research Checklist

Before moving to intake:

- [ ] Company/industry profile documented
- [ ] Terminology map created (minimum 5 term mappings)
- [ ] At least 3 pain points identified from public sources
- [ ] Key metrics cataloged with definitions
- [ ] Regulatory context noted
- [ ] Hidden discovery candidates identified (minimum 1)
- [ ] Research brief formatted and ready to reference during intake
