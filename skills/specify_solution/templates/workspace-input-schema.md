# Workspace Input Schema

> Reference schema for the document import path in `specify_solution`

## Overview

The document import path accepts JSON, PDF, or pasted text. This schema documents the ideal structured JSON format. For PDFs and other documents, the LLM extracts equivalent information by semantic meaning — not all fields need to be present or follow this exact structure.

## Required Fields

### `solution.positioning` (required)

```json
{
  "solution": {
    "positioning": {
      "name": "Solution display name",
      "industryId": "healthcare|financial|retail|manufacturing|energy|media|saas",
      "description": "1-2 paragraph solution description",
      "valueProposition": "Core value statement",
      "businessChallenges": ["Challenge 1", "Challenge 2"],
      "successMetrics": ["Metric 1: target", "Metric 2: target"],
      "differentiators": ["Differentiator 1", "Differentiator 2"],
      "snowflakeProducts": ["Cortex Analyst", "Cortex Agent", "Cortex Search"],
      "platformCapabilities": ["capability1", "capability2"]
    }
  }
}
```

| Field | Required | Maps to Spec |
|-------|----------|-------------|
| `name` | Yes | Section 1: Solution Name |
| `industryId` | Yes | Section 1: Industry |
| `description` | Yes | Section 1: Problem Statement |
| `valueProposition` | No | Section 1: Problem Statement |
| `businessChallenges` | No | Section 1: Pain Points |
| `successMetrics` | No | Section 1: Target Business Goals |
| `differentiators` | No | Section 1: The "Wow" Moment |
| `snowflakeProducts` | No | Section 4: Cortex Feature Matrix |
| `platformCapabilities` | No | Section 4: Feature Matrix |

### `personas` (at least 1 required)

```json
{
  "personas": [
    {
      "persona_name": "Chief Data Officer",
      "persona_type": "strategic",
      "goalsKPIs": ["Goal 1", "Goal 2"],
      "concerns": ["Concern 1"],
      "solution_context": {
        "core_problem": "Current state / gap description",
        "jobs_to_be_done": ["Job 1", "Job 2"],
        "measuring_success": ["Success metric 1"]
      }
    }
  ]
}
```

| Field | Required | Maps to Spec |
|-------|----------|-------------|
| `persona_name` | Yes | Section 2: Role Title |
| `persona_type` | Yes | Section 2: Persona Level (`strategic`/`operational`/`technical`) |
| `goalsKPIs` | No | Section 2: Key User Story |
| `concerns` | No | Section 2: Persona context |
| `solution_context.core_problem` | No | Section 2: STAR Situation |
| `solution_context.jobs_to_be_done` | No | Section 2: STAR Task |
| `solution_context.measuring_success` | No | Section 2: STAR Result |

### `useCases` (at least 1 required)

```json
{
  "useCases": [
    {
      "name": "Use case name",
      "description": "What this use case covers",
      "discoveryQuestions": ["Question 1?", "Question 2?"],
      "intendedOutcomes": ["Outcome 1", "Outcome 2"]
    }
  ]
}
```

| Field | Required | Maps to Spec |
|-------|----------|-------------|
| `name` | Yes | Feature name |
| `description` | No | Feature description |
| `discoveryQuestions` | No | Key Questions table |
| `intendedOutcomes` | No | Success Criteria |

## Optional Fields

### `painPoints`

```json
{
  "painPoints": [
    {
      "name": "Pain point name",
      "description": "Impact description",
      "severity": "high|medium|low"
    }
  ]
}
```

### `architectureDiagrams`

Provide architecture context for diagram generation. Do NOT include base64 images.

```json
{
  "architectureDiagrams": [
    {
      "name": "Solution Architecture",
      "description": "Text description of the architecture — the LLM generates a Mermaid diagram from this",
      "mermaid": "Optional: raw Mermaid syntax if you already have it"
    }
  ]
}
```

- If `mermaid` is provided, it is used directly in the spec
- If only `description` is provided, the LLM generates Mermaid syntax from the description
- Base64 image data is ignored

## Validation Rules

1. `solution.positioning.name` must be non-empty
2. `solution.positioning.industryId` must match a known industry
3. At least 1 persona with `persona_name` and `persona_type`
4. At least 1 use case with `name`
5. `persona_type` must be one of: `strategic`, `operational`, `technical`

## Example (Minimal Valid Input)

```json
{
  "solution": {
    "positioning": {
      "name": "Supply Chain Optimizer",
      "industryId": "manufacturing",
      "description": "Real-time supply chain visibility and predictive analytics"
    }
  },
  "personas": [
    {
      "persona_name": "VP of Operations",
      "persona_type": "strategic",
      "goalsKPIs": ["Reduce lead time by 15%"]
    }
  ],
  "useCases": [
    {
      "name": "Demand Forecasting",
      "discoveryQuestions": ["What is the forecasted demand for next quarter?"]
    }
  ]
}
```
