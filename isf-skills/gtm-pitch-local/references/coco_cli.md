# CoCo CLI Pitch Data — Latest Content & References

Authoritative source for Cortex Code (CoCo CLI) pitch content. **Load this whenever generating CoCo CLI sections.**

**Last Updated:** 2026-03-09
**Sources:** snowflake.com product page, GA press release, blog post, Compass, customer quotes, ADE-Bench

## Key Links (always include in pitch output)

| Resource | URL |
|----------|-----|
| Product Page | https://www.snowflake.com/en/product/features/cortex-code/ |
| Blog: CLI Expands Support | https://www.snowflake.com/en/blog/cortex-code-cli-expands-support/ |
| Compass (Internal) | https://snowflake.seismic.com/Link/Content/DCq6VH9PcX6h3GWPVGhTgVPgXqHd |
| Documentation | https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code-cli |
| GA Press Release | https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/ |
| Developer Guides | https://www.snowflake.com/en/developers/guides |
| Install CLI | `curl -LsS https://ai.snowflake.com/static/cc-scripts/install.sh \| sh` |
| Self-Serve Subscription | https://signup.snowflake.com/cortex-code |

## What Is Cortex Code

Cortex Code is the **AI coding agent built to support your entire data stack**. It turns complex data engineering, analytics, ML and agent-building tasks into simple, informed interactions with high accuracy — all in natural language. Available in Snowsight and as a CLI that runs in a local shell.

**Key tagline (Christian Kleinerman, EVP Product):** "With Cortex Code, we're reimagining how teams build and operate by embedding AI directly into the development lifecycle with critical data context and controls teams can trust."

---

## The 3 Core Value Pillars

These are the official product page value pillars. Use EXACTLY this 3-pillar structure when building the "Why CoCo CLI" section in pitches. Each pillar maps to a specific customer pain and has an associated quote.

### PILLAR 1: Faster Innovation — Speed Up End-to-End Development

**Pain it solves:** Teams are under pressure to deliver AI/data projects faster but juggle too many tools and manual steps across dbt, Airflow, notebooks, and deployment.

**What CoCo delivers:**
- Build, manage and optimize complex data workflows with support for **dbt** and **Apache Airflow**
- Build and deploy **Snowflake Intelligence agents** that interact directly with enterprise data using natural language
- Generate fully executable **ML pipelines** autonomously, ready to run directly in Snowflake Notebooks
- **dbt example:** "Create a CLV model joining orders and customers" → generates, auto-diffs, debugs with full context
- **Airflow example:** Build DAGs with dependency awareness, debug from task to query
- **v0 by Vercel integration:** Vibe-code rich AI-powered data apps with natural language, deploy via SPCS

**Associated quote:** ([GA-PR](https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/) | [Product Page](https://www.snowflake.com/en/product/features/cortex-code/))
> "Cortex Code gives our teams a simple, in-platform way to move quickly from exploring ideas to delivering AI-driven workflows directly on Snowflake. It has the power to help us shape how we roll out AI-powered capabilities for more personalized consumer experiences and smarter financial decisioning."
> — **Srinivas Madabushi, Sr. VP Technology, LendingTree**

### PILLAR 2: Deep Awareness of Snowflake's Data and Semantics

**Pain it solves:** Generic coding assistants don't understand enterprise data context — they generate syntactically correct but semantically wrong code because they lack knowledge of your catalog, governance, and operational semantics.

**What CoCo delivers:**
- Leverages deep understanding of your **specific data catalog** to simplify discovery and management
- Debug and refactor code with **intelligent suggestions tailored to your Snowflake environment**, tables and views
- Perform complex admin tasks conversationally: managing catalogs, setting permissions, creating users, optimizing costs
- **Data discovery example:** Ask "Which tables contain revenue?" and get RBAC-filtered results, dbt lineage and live statistics — not stale code

**Associated quote:** ([GA-PR](https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/) | [Product Page](https://www.snowflake.com/en/product/features/cortex-code/))
> "Cortex Code helps our engineers improve the performance of our business intelligence tools, meaningfully reducing the time it takes to improve quality and speed of Natural Language Query responses."
> — **Tony Leopold, Chief Technology and Strategy Officer, United Rentals**

### PILLAR 3: Enterprise-Ready by Design

**Pain it solves:** Security, governance, and compliance requirements slow down AI adoption. Teams need to move fast without compromising on controls, auditability, and vendor interoperability.

**What CoCo delivers:**
- Manage permissions and usage policies through **centralized configuration** and robust admin controls
- Connect to **Jira, GitHub and other agents** via out-of-the-box **Model Context Protocol (MCP)** support
- Build, share and refine **specialized agent skills**, or migrate existing workflows using the **open agents.md** framework
- Optimize for quality, latency and cost with model choice: **Claude Opus 4.6, Claude Sonnet 4.5, GPT 5.2**

**Associated quote:** ([GA-PR](https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/) | [Product Page](https://www.snowflake.com/en/product/features/cortex-code/))
> "Cortex Code helps us reduce friction in everyday data and AI development while maintaining the controls and oversight we need in a regulated environment. Our teams can build faster with the context they need to be successful."
> — **Vibhor Gupta, VP of Enterprise Data & AI, Shelter Mutual Insurance**

---

## Benchmarks & Proof Points

### ADE-Bench (dbt + Snowflake)
- Cortex Code completed **28 of 43 tasks (65%)** vs Claude Code **25 of 43 (58%)** on same model (Claude Opus 4.6)
- Nearly **50% fewer total calls** to reach correct solution
- **2x fewer file reads** and **4x fewer bash commands** — SQL-native execution via snowflake_sql_execute

### evolv Consulting ROI
- **500+ hours saved** in first 20 days of adoption
- Approximately **$100,000 in value** in 20 days
- Full React app development to complex data engineering tasks

### Self-Serve Subscription
- $40 free inference credits for first 30 days
- $20/month after trial — non-Snowflake customers can start immediately
- Standard Snowflake compute/storage billed separately

---

## All Customer Quotes (organized by pillar relevance)

**Quote Sources (verified March 2026):**
| Short Key | Source | URL |
|-----------|--------|-----|
| GA-PR | GA Press Release (Feb 3, 2026) | https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/ |
| Expand-PR | Expanded Support Press Release (Feb 23, 2026) | https://www.snowflake.com/en/news/press-releases/snowflake-cortex-code-expands-towards-supporting-any-data-anywhere/ |
| Product | Product Page | https://www.snowflake.com/en/product/features/cortex-code/ |

### Innovation / Speed Quotes

**LendingTree — Srinivas Madabushi, Sr. VP Technology** | Source: [GA-PR](https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/), [Product Page](https://www.snowflake.com/en/product/features/cortex-code/)
> "Cortex Code gives our teams a simple, in-platform way to move quickly from exploring ideas to delivering AI-driven workflows directly on Snowflake. It has the power to help us shape how we roll out AI-powered capabilities for more personalized consumer experiences and smarter financial decisioning."

**FYUL — Miks Lūsītis, Senior Director of Data** | Source: [GA-PR](https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/)
> "By bringing context-aware AI directly into our development workflows, Cortex Code has helped us move from experimentation to production faster without having to switch between tools or question if the agent understands our business context."

**evolv Consulting — Trent Foley, CTO** | Source: [Expand-PR](https://www.snowflake.com/en/news/press-releases/snowflake-cortex-code-expands-towards-supporting-any-data-anywhere/)
> "Cortex Code has transformed solution development at evolv Consulting by providing a direct, context-aware connection to the Snowflake ecosystem, allowing our team to interact seamlessly with databases, objects and git repositories... This translated into over 500 hours in time saving — roughly $100,000 in value — in just the first 20 days of adoption."

**TextNow — Ganesan Saminathan, Head of Data Engineering** | Source: [GA-PR](https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/)
> "Cortex Code enables our teams to move faster from data to action by supporting AI-powered capabilities directly in our data workflows. That agility is key as we continue expanding access to free and flexible wireless services for millions."

### Data Context / Semantics Quotes

**United Rentals — Tony Leopold, Chief Technology and Strategy Officer** | Source: [GA-PR](https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/), [Product Page](https://www.snowflake.com/en/product/features/cortex-code/)
> "Cortex Code helps our engineers improve the performance of our business intelligence tools, meaningfully reducing the time it takes to improve quality and speed of Natural Language Query responses."

**Braze — Spencer Burke, SVP Growth** | Source: [Expand-PR](https://www.snowflake.com/en/news/press-releases/snowflake-cortex-code-expands-towards-supporting-any-data-anywhere/)
> "Cortex Code is transforming how we approach agentic analytics at Braze. Its native understanding of our data sets, schemas and columns means our engineers spend less time wrestling with context and more time getting precise, actionable outputs. We're deploying it against more complex data integrations and using it to automate and enrich our insights layer."

**WHOOP — Matt Luizzi, Senior Director of Business Analytics** | Source: [GA-PR](https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/)
> "Using Cortex Code, we've been able to optimize our existing Cortex Agents and benchmark against different Evaluation Sets to improve performance and accuracy. It's accelerated how we turn knowledge into usable AI experiences while maintaining the operational rigor we need."

### Enterprise / Governance Quotes

**Shelter Insurance — Vibhor Gupta, VP of Enterprise Data & AI** | Source: [GA-PR](https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/), [Product Page](https://www.snowflake.com/en/product/features/cortex-code/)
> "Cortex Code helps us reduce friction in everyday data and AI development while maintaining the controls and oversight we need in a regulated environment. Our teams can build faster with the context they need to be successful."

**dentsu — Joe Tobey, Head of Data Products Engineering** | Source: [GA-PR](https://www.snowflake.com/en/news/press-releases/snowflake-unveils-cortex-code-an-ai-coding-agent-that-drastically-increases-productivity-by-understanding-your-enterprise-data-context/)
> "Cortex Code CLI aligns naturally with how our teams work, enabling them to translate data and evolving requirements into AI-powered solutions on Snowflake faster, supporting our ability to meet growing market expectations without disrupting established workflows."

---

## CoCo CLI Value Props by Persona Type

Use these when pitching Cortex Code to specific personas. Pick the closest match. Each row maps to one or more pillars.

| Persona Type | CoCo Value Prop | Key Capabilities to Demo | Primary Pillar |
|---|---|---|---|
| CDO / Chief Data Officer | "One AI IDE across your entire data org — governs who queries what, enforces policies, tracks lineage" | Admin controls, RBAC, MCP integrations, skills framework | Pillar 3: Enterprise-Ready |
| CRO / Chief Revenue Officer | "Real-time revenue and cost visibility — CoCo surfaces cross-sell analytics, credit usage, and pipeline insights directly in the developer workflow" | Semantic views, Cortex Analyst, cost management | Pillar 2: Data Awareness |
| CMO / Chief Marketing Officer | "Self-service analytics for marketing teams — build customer 360, attribution models, and campaign dashboards without waiting on engineering" | Streamlit apps, semantic views, SQL execution, Snowflake Intelligence agents | Pillar 1: Faster Innovation |
| VP Engineering / Platform | "Your devs ship Snowflake pipelines 3x faster — AI-assisted SQL, dbt, Airflow, Streamlit, all with RBAC built in" | dbt integration, Airflow DAGs, MCP, model choice | Pillar 1 + 3 |
| Data Engineer | "Stop context-switching — write SQL, build dbt models, deploy Streamlit apps, manage stages, all in one terminal" | dbt, Dynamic Tables, Streams/Tasks, Snowpipe | Pillar 1: Faster Innovation |
| Data Scientist / ML Engineer | "Train, register, and deploy ML models to Snowflake without leaving your IDE — notebooks, model registry, SPCS" | Notebooks, Snowpark ML, Model Registry, SPCS | Pillar 1: Faster Innovation |
| Analytics Engineer | "Semantic models, dynamic tables, and dbt in one flow — CoCo understands your schema and writes correct SQL" | Semantic views, dbt, Cortex Analyst | Pillar 2: Data Awareness |
| CISO / Security | "Every query audited, secrets never stored in code, RBAC enforced at IDE level — compliance by default" | Admin controls, governance, audit trail | Pillar 3: Enterprise-Ready |
| CFO / Finance | "Real-time cost visibility — CoCo surfaces credit usage, warehouse spend, and optimization recommendations" | Cost management skills, FinOps | Pillar 2: Data Awareness |
| CDIO / CIO / CTO | "Embed AI into the dev lifecycle with data context and governance controls your org can trust — one platform for build, deploy, operate" | All capabilities, MCP, skills, admin controls, model choice | All 3 Pillars |

## Skill-to-Pillar Mapping Hints

When native skills are discovered at runtime via `cortex skill list` and skills.json, use these hints to assign them to the right CoCo pillar in pitch output.

### Pillar 1: Faster Innovation
| Skill | Pitch Angle |
|-------|-------------|
| dbt-projects-on-snowflake | Deploy dbt as native Snowflake objects with task scheduling |
| developing-with-streamlit | Build and deploy Streamlit apps with 15+ specialized sub-skills |
| build-react-app | Scaffold Next.js + shadcn/ui apps with live Snowflake data |
| machine-learning | Full ML lifecycle: train, register, deploy, monitor |
| cortex-agent | Create, test, evaluate, optimize Snowflake Intelligence agents |
| semantic-view-optimization | Create/optimize semantic views for Cortex Analyst text-to-SQL |
| dynamic-tables | Incremental pipelines, troubleshoot refresh, migrate from streams+tasks |
| deploy-to-spcs | Containerize any app and deploy to SPCS |
| openflow | NiFi-based CDC, batch, API connectors |
| create_semantic_view | Guided semantic view creation workflow (marketplace) |
| create-cortex-agent | Guided agent creation workflow (marketplace) |
| dbt-data-modeling | Design and optimize dbt data models (marketplace) |

### Pillar 2: Deep Awareness
| Skill | Pitch Angle |
|-------|-------------|
| cost-management | 12+ cost categories, anomaly detection, optimization recommendations |
| search-optimization | Build and optimize Cortex Search Services for RAG and retrieval |
| coco-usage-analysis | Cortex Code adoption metrics and usage patterns (marketplace) |
| verification-skill | Read-only SQL previews, dbt show/test, structured result verification |

### Pillar 3: Enterprise-Ready
| Skill | Pitch Angle |
|-------|-------------|
| data-governance | Horizon catalog analysis, grants, access history, role hierarchies |
| sensitive-data-classification | Auto-classify PII/PHI, custom classifiers, SYSTEM$CLASSIFY |
| data-policy | Masking, row access, projection policies with anti-pattern detection |
| snowflake-postgres | Managed Postgres instances with secure credential handling |
| skill-development | Create custom team-specific workflow skills |
| skill-creator | AI-assisted skill creation from session context (marketplace) |
| cortex-code-guide | Reference guide for CoCo features, commands, MCP, sessions |

## CoCo Skill Appendix Reference

Full descriptions for each native CoCo skill. Use this table to populate the "Appendix: CoCo Skills Reference" section in pitch output. Include skills referenced in the pitch PLUS any additional skills relevant to the customer's industry or tech stack.

| Skill Name | Type | Pillar | Description |
|------------|------|--------|-------------|
| dbt-projects-on-snowflake | BUNDLED | Innovation | Manages the complete dbt lifecycle on Snowflake: deploy models as native objects, schedule with Snowflake Tasks, run/test/seed, retrieve logs, handle runtime variables, and full-refresh materializations. Supports `snow dbt` CLI commands. |
| developing-with-streamlit | BUNDLED | Innovation | Creates, edits, debugs, beautifies, and deploys Streamlit applications in Snowflake. Covers UI components, state management, theming/CSS, and deployment workflows. 15+ specialized sub-skills. |
| build-react-app | BUNDLED | Innovation | Scaffolds modern React/Next.js applications with shadcn/ui components connected to live Snowflake data. Generates full project structure with data fetching and visualization. |
| machine-learning | BUNDLED | Innovation | End-to-end ML on Snowflake: data analysis, model training (scikit-learn, XGBoost, PyTorch), Model Registry registration, deployment to warehouse or SPCS, experiment tracking, and model monitoring/drift detection. |
| cortex-agent | BUNDLED | Innovation | Creates, audits, evaluates, and debugs Snowflake Intelligence agents. Configures tools (Cortex Search, Cortex Analyst), optimizes prompts, and runs evaluation workflows. |
| semantic-view | BUNDLED | Innovation | Creates and optimizes semantic views for Cortex Analyst text-to-SQL. Includes creation workflows, SQL generation debugging, verified query suggestions, and agentic optimization. |
| dynamic-tables | BUNDLED | Innovation | Creates and manages Dynamic Tables for incremental data pipelines. Handles target lag configuration, refresh troubleshooting (including UPSTREAM_FAILED), and migration from Streams+Tasks patterns. |
| deploy-to-spcs | BUNDLED | Innovation | Containerizes applications and deploys them to Snowpark Container Services. Handles Docker image building, pushing to Snowflake registry, service creation, and networking configuration. |
| openflow | BUNDLED | Innovation | NiFi-based data integration for Snowflake. Deploys CDC, batch, and API connectors. Configures data replication flows and custom transformations. |
| cost-intelligence | BUNDLED | Awareness | Analyzes Snowflake credit consumption across 12+ cost categories (compute, storage, serverless, data transfer). Detects cost anomalies, identifies optimization opportunities, and provides budget tracking. |
| search-optimization | BUNDLED | Awareness | Builds and optimizes Cortex Search Services for RAG and document retrieval. Handles document upload, processing into searchable tables, and search service creation/tuning. |
| lineage | BUNDLED | Awareness | Traces data lineage across Snowflake objects — tables, views, dynamic tables, dbt models. Visualizes dependencies and impact analysis for schema changes. |
| data-governance | BUNDLED | Enterprise | Comprehensive Horizon governance: access control analysis, audit trails, permission verification, role hierarchy visualization, grant management, and compliance monitoring. Bundles sub-skills for sensitive data classification, data masking policies, and Horizon catalog. |
| trust-center | BUNDLED | Enterprise | Runs CIS benchmark security scans against your Snowflake account. Generates remediation SQL for findings and produces compliance posture reports. |
| data-cleanrooms | BUNDLED | Enterprise | Creates and manages Snowflake Data Clean Rooms for secure multi-party data collaboration without exposing raw data. Supports advertising measurement, audience overlap, and joint analytics use cases. |
| snowflake-postgres | BUNDLED | Enterprise | Manages Snowflake-hosted Postgres instances: create, suspend, resume, reset credentials, describe, and import connections. Handles network policies and IP allowlisting. |
| iceberg | BUNDLED | Enterprise | Creates and manages Apache Iceberg tables in Snowflake. Handles catalog integration, external volume configuration, and interoperability with open table formats. |
| skill-development | BUNDLED | Enterprise | Creates custom CoCo skills for team-specific workflows. Captures session work as reusable skills, documents skill interfaces, and manages skill lifecycle. |
| cortex-ai-functions | BUNDLED | Innovation | Invokes Cortex AI functions (COMPLETE, EXTRACT_ANSWER, CLASSIFY_TEXT, SENTIMENT, SUMMARIZE, TRANSLATE) directly from CoCo for ad-hoc AI tasks on Snowflake data. |
| create_semantic_view | Marketplace | Innovation | Guided workflow for creating a new Snowflake Semantic View YAML file. Gathers table information, user preferences, and generates the complete YAML definition. |
| create-cortex-agent | Marketplace | Innovation | Step-by-step workflow for creating a new Cortex Agent with tools (Cortex Search Services and Semantic Views). Handles tool configuration and agent testing. |
| dbt-data-modeling | Marketplace | Innovation | Designs and optimizes dbt data models on Snowflake. Handles staging datasets, incremental strategies, data quality debugging, and architecture planning. |
| coco-usage-analysis | Marketplace | Awareness | Analyzes Cortex Code usage metrics across Desktop, CLI, and UI surfaces. Reports on sessions, users, prompts, and cost estimates for adoption tracking. |

---

## Industry-Specific CoCo Angles

| Industry | CoCo Angle | Example CoCo Prompt |
|----------|-----------|-------------------|
| Financial Services | Audit trail on every query + RBAC at IDE level for regulatory compliance (OCC/Fed/FINRA/SEC). dbt for governed FRTB/CCAR pipelines. | `"Build a dbt model for FRTB risk aggregation joining positions and market data with SLA checks"` |
| Healthcare & Life Sciences | HIPAA-ready workflows with governed access to PHI data. Semantic views for self-service member/claims analytics. dbt for HEDIS/STAR reporting. | `"Create a semantic view over our claims and member tables for self-service HEDIS quality reporting"` |
| Retail & Consumer Goods | Rapid prototyping of AI agents and Streamlit apps for merchandising teams. Cortex Agent development for demand forecasting. | `"Build a Streamlit demand forecasting dashboard pulling from our inventory and sales tables"` |
| Technology / Media / Telecom | Full-stack development: React apps via SPCS, Streamlit dashboards, dbt pipelines, ML model deployment — all in one IDE. | `"Create a React analytics dashboard connected to our Snowflake engagement data and deploy to SPCS"` |
| Manufacturing | IoT data pipeline orchestration with Airflow. Dynamic Tables for real-time supply chain analytics. Snowpark for predictive maintenance ML. | `"Build an Airflow DAG to orchestrate our IoT sensor data pipeline with quality checks"` |
| Public Sector | FedRAMP-aligned controls. RBAC enforcement at IDE level. Governed SQL execution for sensitive citizen data. | `"Set up RBAC policies for our citizen data tables ensuring PII columns are masked for analyst roles"` |

---

## CoCo Prompt Templates by Use Case

These are ready-to-use prompts that field teams and customers can copy-paste into CoCo CLI to demonstrate value immediately. Include relevant prompts in the "CoCo Prompts for Top 3 Pitch Ideas" section.

### Data Engineering Prompts
- `"Create a dbt project with staging, intermediate, and mart layers for our {domain} data. Use our existing {SOURCE_TABLE} as source."`
- `"Build a Dynamic Table pipeline that incrementally processes {data_type} with a 1-minute target lag"`
- `"Debug why my dbt model {model_name} is failing — check the compiled SQL, run it, and fix the issue"`
- `"Build an Airflow DAG that orchestrates our nightly {pipeline_name} pipeline with error handling and Slack notifications"`

### Analytics & BI Prompts
- `"Create a semantic view over {TABLE_1} and {TABLE_2} for self-service analytics with pre-built metrics for {KPI_1}, {KPI_2}, and {KPI_3}"`
- `"Build a Streamlit dashboard showing {metric} trends by {dimension} with drill-down capability, connected to our Snowflake tables"`
- `"Analyze our warehouse costs over the last 30 days and recommend optimizations — show me the top 5 most expensive queries"`

### AI / ML Prompts
- `"Build a Snowflake Intelligence agent that can answer questions about our {domain} data using Cortex Search and Cortex Analyst"`
- `"Create an ML pipeline in a Snowflake Notebook that trains a {model_type} model on {TABLE}, registers it in the Model Registry, and generates predictions"`
- `"Use Cortex AI to classify {TEXT_COLUMN} in {TABLE} into categories and write results to a new column"`

### Governance & Admin Prompts
- `"Audit who has access to {DATABASE}.{SCHEMA} and show me the role hierarchy with all grants"`
- `"Create a masking policy for PII columns in {TABLE} that shows full data to {ROLE} but masks for all others"`
- `"Run a Well-Architected Framework security assessment on my account"`

### Member/Customer 360 Prompts (Healthcare/Insurance/Retail)
- `"Build a customer 360 view joining {MEMBERS_TABLE}, {CLAIMS_TABLE}, and {INTERACTIONS_TABLE} with deduplication logic"`
- `"Create a Streamlit app for care managers to look up member profiles with claims history, risk scores, and care gaps"`
- `"Build an attribution model that tracks member engagement across digital channels using our {EVENTS_TABLE}"`

### Cost of Care / Population Health Prompts (Healthcare)
- `"Create a risk stratification model using our claims and member data to identify rising-risk members"`
- `"Build a HEDIS quality measure dashboard using our {CLAIMS_TABLE} and {MEMBER_TABLE} with automated measure calculations"`
- `"Create a Cortex Agent that lets care managers ask natural language questions about member populations and care gaps"`

---

## How to Use in Pitch

### TIER 1 (Summary — "Why CoCo CLI for {Company}"):
Structure the 3 reasons around the 3 pillars, customized to the customer's context:
1. **Pillar match #1** — Pick the pillar most relevant to the customer's PRIMARY pain. Use the persona-matched value prop. Reference the specific capability (dbt, Airflow, agents, semantic views, etc.)
2. **Pillar match #2** — Pick the pillar tied to the customer's INDUSTRY or DATA STRATEGY. Use the industry-specific angle.
3. **Pillar match #3** — Pick the pillar tied to the customer's TECH STACK or GOVERNANCE requirements. Reference how CoCo integrates/replaces their current tools.

Include ONE customer quote (pick the quote associated with the most relevant pillar). Include resource links.

### TIER 2 (Detailed — "CoCo CLI Pitch Detail"):
Expand with ALL of the following:
- **For their persona/role:** Full pillar breakdown with matched value prop + capabilities to demo
- **For their tech stack:** How CoCo integrates with or replaces their current tools (dbt/Airflow support, MCP integrations, model choice)
- **For their industry:** Industry-specific angle from table above with example prompt
- **Benchmarks:** ADE-Bench results (65% vs 58%), evolv ROI ($100K in 20 days) where relevant
- **Customer Quotes:** Include 2-3 quotes organized by pillar relevance
- **Resources:** All key links

### TIER 2 (NEW — "CoCo Prompts for Top 3 Pitch Ideas"):
For EACH of the Top 3 pitch reasons from "Why Snowflake for {Company}", generate a **ready-to-use CoCo CLI prompt** that the field/customer can copy-paste to demonstrate that pitch idea in action. Structure:

```
### 🖥️ Try It in CoCo CLI — Top 3 Pitch Ideas in Action

For each pitch idea, here's a prompt you can paste directly into CoCo CLI to bring it to life:

**Pitch Idea 1: {Title}**
> `{CoCo prompt that implements or demonstrates this pitch idea using the customer's actual data context — reference their tables/domain where known}`
> *What this does:* {1-line description of what CoCo will build}

**Pitch Idea 2: {Title}**
> `{CoCo prompt}`
> *What this does:* {1-line description}

**Pitch Idea 3: {Title}**
> `{CoCo prompt}`
> *What this does:* {1-line description}
```

Always include links: [Product Page](https://www.snowflake.com/en/product/features/cortex-code/) | [Blog](https://www.snowflake.com/en/blog/cortex-code-cli-expands-support/) | [Compass](https://snowflake.seismic.com/Link/Content/DCq6VH9PcX6h3GWPVGhTgVPgXqHd) | [Docs](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code-cli) | [Install](https://signup.snowflake.com/cortex-code)
