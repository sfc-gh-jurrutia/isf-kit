# ISF Solution Project Structure

```
project/
├── specs/
│   └── {solution}/
│       ├── isf-context.md          # Curated contract
│       ├── plan.md                 # Planning decisions
│       ├── tasks.md                # Ordered implementation tasks
│       └── pipeline-state.yaml     # Canonical phase/gate resume state
│
├── .github/workflows/            # CI/CD for Snowflake (schemachange) & React
│
├── deploy/                       # Deployment orchestration
│   ├── setup.sql                 # One-time infra provisioning (database, schemas, roles, grants)
│   └── spcs/                     # SPCS service specs and Dockerfiles
│       ├── Dockerfile
│       └── service-spec.yaml
│
├── src/
│   ├── ui/                       # React + TypeScript Application
│   │   ├── src/
│   │   │   ├── components/       # Reusable UI components
│   │   │   ├── hooks/            # Custom hooks (useCortexAgent, useSnowflakeQuery)
│   │   │   ├── services/         # API / Cortex integration logic
│   │   │   └── types/            # TypeScript type definitions
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   ├── database/                 # Snowflake "Data-as-Code"
│   │   ├── migrations/           # Versioned DDL (V1.1.1__initial_tables.sql)
│   │   ├── procs/                # Stored Procedures (Python/SQL/Javascript)
│   │   ├── functions/            # UDFs and UDTFs for business logic
│   │   ├── roles/                # RBAC and access control configuration
│   │   └── cortex/               # Cortex object definitions
│   │       ├── agent_strategic.sql
│   │       ├── agent_operational.sql
│   │       ├── agent_technical.sql
│   │       ├── grants.sql        # Agent grants for persona agents
│   │       ├── semantic_views/   # YAML specs deployed as Snowflake Semantic Views
│   │       │   └── operational.yaml
│   │       └── search_service.sql
│   │
│   └── data_engine/              # Synthetic Data & ETL
│       ├── generators/           # Data generation logic (Faker, seed=42)
│       ├── loaders/              # Snowpark code to push data to stages
│       └── specs/                # JSON/YAML defining data shapes (from isf-context)
│
├── api/                          # FastAPI Backend (deployed to SPCS)
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, /health, /ready, routers
│   │   ├── snowflake_conn.py     # Shared Snowflake pool + SPCS detection
│   │   ├── backend_patterns.py   # Cache + serialization helpers
│   │   ├── cortex_agent_service.py # Persona agent REST proxy
│   │   ├── routers/              # Endpoint modules (agent, analyst, health)
│   │   └── services/             # SnowflakeService, CortexAgentService
│   ├── requirements.txt
│   └── Dockerfile
│
├── models/                       # Cortex specs and supporting metadata
│   ├── semantic-view-catalog.yaml # Optional local index of deployed Semantic Views
│   └── cortex-spec.yaml          # Cortex feature configuration
│
├── docs/                         # Architecture Specs (Markdown)
│   ├── SOLUTION_ARCH.md          # From isf-context architecture section
│   ├── DATA_MODEL.md             # Schema design and data flow
│   └── INTEGRATION.md            # Partner and API integration details
│
├── tests/
│   ├── ui/                       # Playwright / Cypress for React
│   ├── api/                      # pytest for FastAPI endpoints
│   └── data/                     # dbt tests or Great Expectations
│
├── notebooks/                    # Snowflake Notebooks (if ML component)
│   ├── environment.yml
│   └── *.ipynb
│
├── .env.example                  # Template: SF_ACCOUNT, SF_USER, SF_ROLE, etc.
└── Makefile                      # Shortcut commands
```

## Makefile Commands

```makefile
deploy:          # Full Snowflake provisioning + data load + SPCS deploy
deploy-db:       # Run schemachange migrations only
deploy-data:     # Generate and load synthetic data
deploy-app:      # Build React, build Docker, push to SPCS
dev-ui:          # Start React dev server (npm run dev)
dev-api:         # Start FastAPI locally (uvicorn)
test:            # Run all tests (data + api + ui)
test-data:       # Run data quality tests
test-api:        # Run API tests
test-ui:         # Run Playwright tests
clean:           # Teardown all Snowflake objects (with confirmation)
generate-data:   # Regenerate synthetic data with seed=42
```

## Key Conventions

| Convention | Rule |
|-----------|------|
| Database migrations | schemachange versioning: `V{major}.{minor}.{patch}__{description}.sql` |
| Synthetic data | Pre-generated with `seed=42`, committed to repo via `src/data_engine/` |
| Cortex objects | Defined in `src/database/cortex/`, including `agent_{persona}.sql` + `grants.sql` |
| Analyst semantic layer | Author YAML Semantic View specs in Git, deploy as Snowflake Semantic Views, reference the deployed objects at runtime |
| API backend | FastAPI on SPCS, uses `SNOWFLAKE_CONNECTION_NAME` locally and persona env mappings everywhere |
| React frontend | Vite + TypeScript + Tailwind, built and served from SPCS |
| Secrets | Never hardcoded — use `.env` locally, Snowflake secrets in production |
| SPCS deployment | Service spec in `deploy/spcs/`, readiness probe on `8080/health` |
| Resume | `specs/{solution}/pipeline-state.yaml` is the canonical phase tracker |
