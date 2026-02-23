# Prompt Plan: {Solution Name}

> Reasoning and prompts used to generate this solution specification

## Generation Context

| Attribute | Value |
|-----------|-------|
| Generated | {timestamp} |
| Source Spec | specs/{solution}/spec.md |
| Industry | {industry} |
| Primary Persona | {persona} |
| Solution Purpose | {purpose} |

## Intake Decisions

### Round 1: Context

**Purpose Selection**
- **User Input**: {raw input}
- **Interpreted As**: {Sales / POC / Training / Event / Customer Success}
- **Reasoning**: {why this classification}

**Industry Selection**
- **User Input**: {raw input}
- **Interpreted As**: {industry}
- **Sub-segment**: {sub-segment if specified}
- **Reasoning**: {why this industry was selected}
- **Defaults Applied**: {list of industry defaults used}

**Audience Selection**
- **User Input**: {raw input}
- **Interpreted As**: {Customer / Internal / Partner}
- **Impact**: {how this affects narrative tone}

**Persona Selection**
- **User Input**: {raw input}
- **Interpreted As**: {Executive / Analyst / Technical / Operations / Developer}
- **Technical Level**: {Low / Medium / High / Very High}
- **Reasoning**: {why this persona was selected}

### Round 2: Discovery

**Pain Points Identified**
- **User Input**: {raw pain points}
- **Expanded Pain Points**:
  1. {pain point 1 with business impact}
  2. {pain point 2 with business impact}
- **Cost of Status Quo**: {quantified if possible}

**Hidden Discovery**
- **User Input**: {user's hidden discovery idea}
- **Discovery Statement**: {one sentence}
- **Surface Appearance**: {what data looks like before analysis}
- **Revealed Reality**: {what emerges after solution}
- **Business Impact**: {why this matters}
- **Reasoning**: {why this discovery was chosen}

**Self-Guided Requirements**
- **User Input**: {yes/no + details}
- **Implementation**:
  - Tooltips: {yes/no}
  - Callout boxes: {yes/no}
  - Guided mode: {yes/no}
  - Story flow: {description}

**Cortex Features Selected**
- **User Input**: {features requested}
- **Features Included**:
  | Feature | Included | Reasoning |
  |---------|----------|-----------|
  | Cortex Analyst | {Yes/No} | {why} |
  | Cortex Agent | {Yes/No} | {why} |
  | Cortex Search | {Yes/No} | {why} |
  | LLM Functions | {Yes/No} | {why} |

## Architecture Decisions

### Zone Pattern
- **Decision**: {Zone A only / Zone B only / Both}
- **Zone A (Postgres)**: {what's stored here}
- **Zone B (Snowflake)**: {what's stored here}
- **Reasoning**: {justification for pattern choice}

### App Type
- **Decision**: {Streamlit / React / Both}
- **Reasoning**: {why this app type}

### Data Architecture
- **Tables Created**: {list of tables}
- **Row Estimates**: {estimated row counts}
- **Data Scale**: {Minimal / Realistic / Scale Test}
- **Time Range**: {start} to {end}

## Feature Reasoning

| Feature | Included | Business Justification | Technical Justification |
|---------|----------|----------------------|------------------------|
| {feature1} | Yes | {business reason} | {tech reason} |
| {feature2} | No | {why excluded} | {tech constraint} |
| {feature3} | Yes | {business reason} | {tech reason} |

## UI Strategy

### Page Template
- **Selected**: {ExecutiveDashboard / ChatAnalytics / DataExplorer}
- **Reasoning**: {why this template fits persona + features}

### Theme Configuration
| Setting | Value | Reasoning |
|---------|-------|-----------|
| Industry Overlay | {industry} | Matches target vertical |
| Persona Accent | {persona} | Matches primary user role |
| Primary Color | {color} | {reasoning} |

### Visualization Assignments
| Question | Tags | Chart Type | Reasoning |
|----------|------|------------|-----------|
| "{question 1}" | {tags} | {chart} | {why this chart} |
| "{question 2}" | {tags} | {chart} | {why this chart} |

## Prompts Used

### Spec Generation Prompt
```
{actual prompt or template used to generate spec.md}
```

### Domain Model Generation Prompt
```
{actual prompt or template used to generate domain-model.yaml}
```

### Sample Questions Generation Prompt
```
{actual prompt or template used to generate sample-questions.yaml}
```

## Validation Notes

### Ambiguities Resolved
- {ambiguity 1}: {how it was resolved}
- {ambiguity 2}: {how it was resolved}

### Quality Gate Results
- **Analyze Pass**: {Yes/No}
- **Issues Found**: {count}
- **Critical Issues**: {count}
- **Resolutions**: {list of how issues were addressed}

## Downstream Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Specification | specs/{solution}/spec.md | Generated |
| Domain Model | specs/{solution}/domain-model.yaml | Generated |
| Sample Questions | specs/{solution}/sample-questions.yaml | Generated |
| Plan | specs/{solution}/plan.md | {Generated/Pending} |
| Tasks | specs/{solution}/tasks.md | {Generated/Pending} |
| React App | react/ | {Generated/Pending} |
| SPCS Deployment | {service_url} | {Deployed/Pending} |
