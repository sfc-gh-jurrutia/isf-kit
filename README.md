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
│   │   ├── plan/              # Generate implementation plan
│   │   ├── tasks/             # Break plan into tasks
│   │   ├── generate/          # Generate data and artifacts
│   │   └── implement/         # Execute implementation
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
