---
name: repo-scanner
description: "Clone and analyze existing repos to extract project context for solution specification. Use when: scanning a GitHub repo, analyzing an existing demo/solution, reverse-engineering a project into a spec, or importing a codebase. Triggers: scan repo, analyze project, reverse engineer, import repo"
---

# Repo Scanner - Codebase Analysis for Solution Specification

> Clone a repo, run repomix, analyze the output, and produce structured project context that feeds into specify_solution as Path C.

## When to Use

- User provides a GitHub URL or local path to an existing project
- User wants to turn an existing demo/solution into a standardized spec
- User says "scan repo", "analyze project", "reverse engineer", or "import repo"
- Called from `specify_solution` Path C

## Prerequisites

- **Node.js / npm** must be installed (required for `npx repomix`)
- **git** must be installed (required for cloning)
- No global installs needed — repomix runs via `npx`

## Workflow

### Step 1: Accept Input

Determine the source:

| Input Type | Detection | Action |
|------------|-----------|--------|
| GitHub URL | Starts with `https://github.com/` or `git@github.com:` | Clone to temp directory |
| Local path | Starts with `/`, `./`, or `~` | Use directly |
| "Current project" | User says "scan this repo" or "current project" | Use workspace root |

```
What repo would you like to scan?

Enter a GitHub URL, local path, or say "current project":
```

**⚠️ MANDATORY STOPPING POINT**: Confirm the target before cloning/scanning.

**Log**: Record `configuration` — append to `specs/{solution}/decision-log.jsonl`: step "Repo Scanner, Step 1: Input", value_selected (URL/path), rationale.

### Step 2: Clone (if URL)

If the input is a GitHub URL, shallow-clone to minimize download:

```bash
git clone --depth 1 {url} /tmp/repo-scan-{slug}
```

If clone fails (private repo, bad URL), present the error and ask for alternatives:

```
Clone failed: {error}

Options:
1. Try a different URL
2. Provide a local path instead
3. Cancel

[1/2/3]
```

### Step 3: Run Repomix

Generate a single-file representation of the codebase:

```bash
cd {repo_path}
npx repomix --output repomix-output.xml
```

This produces an XML file containing:
- Directory structure
- All file contents (respecting .gitignore)
- Repository metadata

If the repo is very large (>50MB output), use repomix with filters:

```bash
npx repomix --output repomix-output.xml --ignore "node_modules,dist,build,.next,data/synthetic"
```

### Step 4: Analyze Repomix Output

Read `repomix-output.xml` and extract structured findings. Look for these indicators:

#### 4.1 Project Identity

| What | Where to Look | Extract |
|------|---------------|---------|
| Project name | README.md title, package.json `name`, pyproject.toml `name` | Solution name |
| Description | README.md first paragraph, package.json `description` | Problem statement |
| Industry clues | README content, domain terms, table names | Industry classification |

#### 4.2 Framework Detection

| Indicator | Framework | Maps to |
|-----------|-----------|---------|
| `package.json` with `react`, `vite` | React + Vite | App Type: React |
| `requirements.txt` with `fastapi` | FastAPI | Backend: FastAPI |
| `requirements.txt` with `streamlit` | Streamlit (legacy) | Note: will convert to React |
| `environment.yml` with `snowflake` | Snowflake Streamlit (SiS) | Note: will convert to React |
| `*.ipynb` files | Jupyter notebooks | Notebook component |
| `Dockerfile`, `spec.yaml` | SPCS container | Deployment: SPCS |

#### 4.3 Data Architecture

| Indicator | Extract |
|-----------|---------|
| `sql/` directory with numbered files | DDL execution order |
| CREATE TABLE/VIEW statements | Table names, columns, types |
| Schema names (RAW, ATOMIC, *_MART) | Layer architecture |
| `data/` or `data/synthetic/` | Seed data patterns |
| `seed=42` or similar | Deterministic generation |

#### 4.4 Cortex Features

| Indicator | Feature |
|-----------|---------|
| `CREATE AGENT` or agent spec JSON | Cortex Agent |
| `semantic_model.yaml` or Semantic View DDL | Cortex Analyst |
| `CREATE CORTEX SEARCH SERVICE` | Cortex Search |
| `SNOWFLAKE.CORTEX.COMPLETE()` | LLM Functions |
| `PARSE_DOCUMENT` | Document processing |

#### 4.5 Personas and Documentation

| Indicator | Extract |
|-----------|---------|
| README with "personas" or role titles | Persona definitions |
| DRD or spec documents | Requirements, user stories |
| Page/route names (e.g., `ExecutiveDashboard`) | UI patterns, persona hints |
| Comment blocks with user story format | Feature requirements |

#### 4.6 Deployment

| Indicator | Extract |
|-----------|---------|
| `deploy.sh` in root | Three-script model compliance |
| `run.sh` in root | Runtime commands |
| `clean.sh` in root | Teardown procedure |
| SPCS service spec | Container deployment |
| `snowflake.yml` | Streamlit in Snowflake config |

### Step 5: Generate Project Analysis

Produce a structured analysis document. Present to the user:

```
## Project Analysis: {project_name}

### Identity
- **Name**: {name}
- **Source**: {url or path}
- **Industry**: {detected or Unknown}
- **Description**: {extracted description}

### Architecture
- **Frontend**: {React+FastAPI / Streamlit / None}
- **Backend**: {FastAPI / None}
- **Database**: {schema list with layer mapping}
- **Deployment**: {SPCS / SiS / Manual}

### Cortex Features Detected
| Feature | Evidence | Status |
|---------|----------|--------|
| Agent | {evidence} | {Found/Not found} |
| Analyst | {evidence} | {Found/Not found} |
| Search | {evidence} | {Found/Not found} |
| LLM Functions | {evidence} | {Found/Not found} |

### Data Architecture
- **Schemas**: {list}
- **Tables**: {count} ({list of key tables})
- **Seed data**: {Yes with seed=X / No}
- **Layer pattern**: {RAW→ATOMIC→MART / Flat / Other}

### Personas
| Persona | Source | Confidence |
|---------|--------|------------|
| {persona} | {where found} | {High/Medium/Low} |

### Compliance with ISF-Kit Standards
| Standard | Status | Notes |
|----------|--------|-------|
| Three-script model | {Yes/No/Partial} | {details} |
| React + FastAPI | {Yes/No - Streamlit} | {conversion needed?} |
| Seed data pre-generated | {Yes/No} | |
| No hardcoded credentials | {Yes/No} | |
| Cortex specs present | {Yes/No/Partial} | |

### Missing for Spec Generation
- {list of what the LLM will need to fill in}

### Recommendations
- {list of changes needed to meet ISF-Kit standards}
```

**⚠️ MANDATORY STOPPING POINT**: Present analysis for user review before feeding into specify_solution.

**Log**: Record `approval` — append to `specs/{solution}/decision-log.jsonl`: step "Repo Scanner, Step 5: Analysis Review", value_selected (Proceed/Modify/Cancel), rationale.

```
[Proceed to spec generation] [Modify findings] [Scan another repo] [Cancel]
```

### Step 6: Clean Up

If a temp clone was created, remove it:

```bash
rm -rf /tmp/repo-scan-{slug}
```

Keep the `repomix-output.xml` in the specs folder for reference:

```bash
cp {repo_path}/repomix-output.xml specs/{solution}/repomix-output.xml
```

## Output

The skill produces:

1. **Project analysis document** — structured findings presented to user
2. **`repomix-output.xml`** — archived in specs folder for reference
3. **Structured context** — passed to `specify_solution` Path C for spec generation

The analysis maps directly to spec template sections, enabling `specify_solution` to generate a spec from an existing codebase rather than from scratch.

## Error Handling

- **Clone failure**: "Could not clone {url}. Check the URL is correct and the repo is accessible. Provide a local path instead?"
- **Repomix failure**: "repomix failed. Ensure Node.js/npm is installed. Error: {message}"
- **Empty repo**: "Repo appears empty or contains no analyzable code. Switch to conversational intake?"
- **Very large repo**: "Repo is large ({size}). Scanning with filters to exclude build artifacts and dependencies."
- **Private repo**: "Authentication required. Clone the repo locally first, then provide the local path."
