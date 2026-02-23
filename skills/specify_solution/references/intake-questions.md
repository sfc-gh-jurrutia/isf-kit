# Standard Intake Questions

> Load this reference during Step 1 (Intake) of the specify workflow.
> If Step 0 (Research) was completed, use the research brief to tailor questions.

## Question Framework

**Always ask these questions before generating a spec. Batch into 2 rounds to minimize stopping points.**

**If research brief is available**: Reference customer terminology, identified pain points, and key metrics in your questions instead of using generic phrasing.

## Round 1: Context Questions

Ask these together as a batch:

### 1.1 Industry

| Question | Follow-up |
|----------|-----------|
| What vertical is this solution targeting? | What specific sub-segment? |

**Industry Options:**

| Industry | Default Entities | Sample KPIs |
|----------|------------------|-------------|
| Healthcare | patients, encounters, claims, providers | readmission_rate, avg_los, cost_per_case |
| Financial | accounts, transactions, customers, products | aum, fraud_rate, customer_ltv |
| Retail | products, orders, customers, inventory, stores | revenue, basket_size, conversion_rate |
| Manufacturing | equipment, sensors, work_orders, inventory | oee, downtime, defect_rate |
| Energy | assets, readings, customers, outages | uptime, consumption, peak_demand |
| Media | content, users, sessions, subscriptions | dau_mau, watch_time, churn_rate |
| SaaS | users, accounts, events, subscriptions | mrr, churn, nps, feature_adoption |
| Aerospace | aircraft, components, maintenance_orders, certifications | fleet_availability, mtbf, dispatch_reliability |
| Agriculture | fields, crops, sensors, harvests | yield_per_acre, input_cost, crop_health |
| Automotive | vehicles, production_lines, suppliers, quality_events | throughput, defect_ppm, supplier_otd |
| Construction | projects, sites, permits, safety_events | schedule_variance, cost_overrun, incident_rate |
| Mining | sites, equipment, extraction_runs, safety_events | recovery_rate, cost_per_ton, safety_score |
| Oil & Gas | wells, pipelines, production_units, inspections | production_volume, uptime, leak_rate |
| Pharma / Life Sciences | trials, patients, compounds, regulatory_submissions | trial_duration, approval_rate, cost_per_patient |
| Sustainability / ESG | emissions, facilities, certifications, targets | scope1_2_3, reduction_rate, esg_score |
| Telecommunications | subscribers, network_elements, service_orders, tickets | arpu, churn, network_uptime |
| Transportation / Logistics | shipments, routes, vehicles, warehouses | on_time_delivery, cost_per_mile, fill_rate |
| Utilities | meters, circuits, outages, customers | saidi, saifi, load_factor |
| Insurance | policies, claims, agents, underwriting | loss_ratio, combined_ratio, claims_cycle_time |
| Government / Public Sector | agencies, programs, citizens, budgets | service_delivery_time, compliance_rate, utilization |

### 1.2 Audience

| Question | Purpose |
|----------|---------|
| Who is the primary audience? | Shapes narrative tone |

**Options:**

- **Customer** - Prospect or existing customer solution
- **Internal** - Team training or enablement
- **Partner** - Partner/reseller enablement

### 1.3 Primary Persona

| Question | Follow-up |
|----------|-----------|
| Who is the primary user in the solution? | What decisions do they make? |

**Persona Options:**

| Persona | Technical Level | Focus |
|---------|-----------------|-------|
| Executive / Decision Maker | Low | KPIs and trends |
| Business Analyst | Medium | Exploratory queries |
| Data Analyst / Scientist | High | SQL + natural language |
| Operations / Front-line | Low | Task-focused |
| Developer / Engineer | Very High | API-focused |

## Round 2: Discovery Questions

Ask these together as a batch:

### 2.1 Pain Points

| Question | Purpose |
|----------|---------|
| What's broken today? | The "why" of the solution |
| What's the cost of the status quo? | Quantifies business impact |

**If user cannot answer**, suggest industry-standard pain points:

| Industry | Common Pain Points |
|----------|-------------------|
| Healthcare | Data silos, manual chart review, delayed diagnoses |
| Financial | Fraud detection lag, manual compliance, siloed customer view |
| Retail | Inventory stockouts, demand forecasting errors, customer churn |
| Manufacturing | Unplanned downtime, quality defects, supply chain visibility |
| Energy | Outage prediction, demand spikes, asset maintenance |
| Media | Content recommendation accuracy, subscriber churn, engagement |
| SaaS | Feature adoption, churn prediction, usage analytics |

### 2.2 Hidden Discovery

| Question | Purpose |
|----------|---------|
| What non-obvious insight should emerge? | The "reveal" moment |
| What "hidden risk" or opportunity exists? | Creates "aha" experience |

**If user cannot answer**, propose patterns:

| Pattern | Example |
|---------|---------|
| Hidden dependency | "Minor supplier actually critical" |
| Emerging trend | "Stable metric accelerating in new segment" |
| Counterintuitive | "High-cost region has best ROI" |

### 2.3 Self-Guided Requirements

| Question | Purpose |
|----------|---------|
| Will this solution run without a presenter? | Affects tooltip/callout needs |

**If self-guided, add:**

- Contextual tooltips
- Callout boxes explaining insights
- Guided mode toggle
- Story flow from entry to conclusion

### 2.4 Data Context

| Question | Purpose |
|----------|---------|
| What data exists? Structured? Unstructured? | Determines Cortex features |
| What's missing? | Identifies data generation needs |

### 2.5 Data Architecture

| Question | Purpose |
|----------|---------|
| Does the customer have an existing data model or warehouse? | Informs RAW layer design |
| Are there CDC (change data capture) sources? | Determines RAW metadata columns needed |
| Is historical tracking required for any entities? | Triggers Type 2 SCD in ATOMIC |
| What is the primary data consumption pattern? | Shapes DATA_MART design |

**If user is unsure**, default to:
- RAW with file staging metadata
- ATOMIC with audit columns (no SCD2 unless stated)
- Single DATA_MART schema with views

### 2.6 Deployment & Packaging

| Question | Purpose |
|----------|---------|
| Who will run this solution after handoff? | Determines documentation depth |
| Does it need to deploy to multiple accounts? | Affects connection profile design |
| Is SPCS deployment required? | Triggers containerization spec |
| Should it be packaged as a Native App? | Triggers application package spec |

**If user is unsure**, default to:
- Three-script model (deploy.sh, run.sh, clean.sh)
- Single-account deployment
- Streamlit in Snowflake (no SPCS)

## Solution Purpose Classification

After Round 1, classify the solution purpose:

| Purpose | Description | Typical Duration |
|---------|-------------|------------------|
| Sales Demo | Showcase capabilities to prospect | 15-30 min |
| Proof of Concept | Validate technical fit | 60+ min |
| Internal Training | Teach team members | 30-60 min |
| Conference/Event | Public presentation | 5-15 min |
| Customer Success | Help customer expand usage | 30-60 min |

## Cortex Feature Triggers

Based on answers, determine which Cortex features to include:

| User Need | Cortex Feature |
|-----------|----------------|
| "Natural language queries" | Cortex Analyst |
| "Search documents", "RAG" | Cortex Search |
| "Multiple tools", "orchestration" | Cortex Agent |
| "Summarize", "complete", "translate" | LLM Functions |

## Data Scale Options

| Scale | Row Count | Use Case |
|-------|-----------|----------|
| Minimal | < 10K | Quick solutions, POCs |
| Realistic | 10K - 1M | Production-like solutions |
| Scale Test | > 1M | Performance validation |
