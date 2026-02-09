# isf-kit

A skill and spec-driven solution generator for Snowflake demos, powered by Cortex Code.

## What is this?

**isf-kit** helps you rapidly build Snowflake demo applications through:

1. **Skills** - Reusable Cortex Code instructions that guide AI-assisted workflows
2. **Specs** - Complete demo specifications with domain models, semantic models, and implementation plans
3. **Templates** - UI components, data generators, and boilerplate code

## Quick Start

Open Cortex Code and type:

```
/activate-kit
```

Or invoke any skill directly:

| Command | Purpose |
|---------|---------|
| `/onboarding` | Set up Snowflake connection (first-time setup) |
| `/specify` | Create a new demo specification |
| `/switch-connection` | Change active Snowflake profile |
| `/skill-development` | Create or audit Cortex Code skills |

## Repository Structure

```
isf-kit/
├── skills/                    # Cortex Code skills
│   ├── activate-kit/          # Entry point / main menu
│   ├── onboarding/            # Connection setup
│   ├── switch-connection/     # Profile switching
│   ├── specify/               # Demo specification workflow
│   │   ├── clarify/           # Resolve ambiguities
│   │   ├── plan/              # Generate implementation plan
│   │   ├── tasks/             # Break plan into tasks
│   │   ├── analyze/           # Pre-implementation review
│   │   ├── generate/          # Generate data and artifacts
│   │   │   ├── llm-powered/   # Cortex COMPLETE generation
│   │   │   └── rule-based/    # Statistical generation
│   │   ├── semantic-model/    # Generate Cortex Analyst YAML
│   │   └── implement/         # Execute implementation
│   ├── references/            # Knowledge library (no routing)
│   │   ├── ml/                # ML rules: sklearn-only, registry patterns
│   │   ├── synthetic-data/    # Industry patterns: betting, streaming, etc.
│   │   └── native-app/        # Jinja2 templates for app packaging
│   └── skill-development/     # Meta: create & audit skills
│       ├── audit-skill/
│       ├── create-from-scratch/
│       ├── publish/
│       └── summarize-session/
├── specs/                     # Demo specifications
│   └── retail-demo/           # Example: Retail Analytics
│       ├── spec.md            # Business requirements
│       ├── domain-model.yaml  # Data entities
│       ├── semantic-model.yaml# Cortex Analyst model
│       ├── plan.md            # Implementation phases
│       ├── tasks.md           # Executable task list
│       ├── backend/           # FastAPI + Snowflake connector
│       └── frontend/          # React + Tailwind UI
├── docs/                      # Documentation
└── scripts/                   # Setup utilities
```

## Skills

Skills are markdown files (`SKILL.md`) that instruct Cortex Code how to perform specific workflows. Each skill includes:

- **Triggers** - Keywords that activate the skill
- **Workflow** - Step-by-step instructions
- **Stopping Points** - Where to pause for user input
- **References** - Supporting documentation

See `skills/skill-development/SKILL_BEST_PRACTICE.md` for authoring guidelines.

## References

The `skills/references/` directory contains **knowledge documents** that existing skills load when context is needed. These encode project-specific rules from [ai_solution_framework](https://github.com/...) without creating new workflow skills.

| Directory | Content |
|-----------|---------|
| `ml/` | sklearn-only constraint, `_ENCODED` column naming, Feature Store workarounds, Model Registry patterns |
| `synthetic-data/` | Industry data schemas for betting, streaming, music, healthcare, retail |
| `native-app/` | Jinja2 templates for manifest.yml and setup_script.sql |

**Design principle:** These are references, not workflows. Cortex Code already handles SQL execution, Python generation, and model training. References provide the project-specific rules that guide those native capabilities.

## Specs

A spec is a complete demo definition including:

| File | Purpose |
|------|---------|
| `spec.md` | Business context, user stories, key questions |
| `domain-model.yaml` | Data entities, relationships, row estimates |
| `semantic-model.yaml` | Cortex Analyst semantic layer |
| `plan.md` | Phased implementation approach |
| `tasks.md` | Granular task checklist |

The `/specify` workflow guides you through creating all of these.

## Data Generation

The `/specify` workflow includes flexible data generation with three modes:

| Mode | Command | Use Case |
|------|---------|----------|
| **Standard** | `/speckit.generate` | Python/Faker for simple data, SQL for scale |
| **LLM-Powered** | `/speckit.generate` → Option 2 | Creative, varied data using Cortex COMPLETE |
| **Rule-Based** | `/speckit.generate` → Option 3 | Deterministic with field correlations (age→income→credit) |

### LLM-Powered Generation
Uses `SNOWFLAKE.CORTEX.COMPLETE()` with industry-specific prompts to generate realistic, varied data. Best for demos requiring natural-looking content.

### Rule-Based Generation
Uses statistical distributions (normal, uniform, weighted choice) with configurable correlations between fields. Deterministic output, no Cortex credits consumed.

## Semantic Model Generator

Generate Cortex Analyst YAML automatically from existing tables:

```
/speckit.semantic-model
```

This will:
1. Query `INFORMATION_SCHEMA.COLUMNS` for table structure
2. Auto-classify columns as dimensions or measures
3. Generate complete semantic model YAML
4. Optionally create sample validation questions

## Example: Retail Demo

The `specs/retail-demo/` directory contains a complete example:

- **Industry**: Retail
- **Persona**: Operations Manager
- **Features**: Natural language sales analysis via Cortex Analyst
- **Stack**: FastAPI backend + React frontend + Snowflake

Run it locally:

```bash
# Backend
cd specs/retail-demo/backend
uv sync && uv run uvicorn app.main:app --reload

# Frontend (separate terminal)
cd specs/retail-demo/frontend
npm install && npm run dev
```

## Snowflake Connection Setup

If you need to configure your Snowflake connection:

```
/onboarding
```

This will:
1. Scan for existing config files (`~/.snowflake/config.toml`, `connections.toml`, `~/.snowsql/config`)
2. Detect available profiles
3. Test connectivity
4. Guide you through setup if needed

## Contributing

1. Create a new skill in `skills/` following the patterns in existing skills
2. Run `/audit-skill` to validate against best practices
3. Test the workflow end-to-end

---

*Built for Cortex Code*
