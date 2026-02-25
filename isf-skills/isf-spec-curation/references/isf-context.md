---
# ISF SOLUTION SPECIFICATION TEMPLATE
#
# INPUT TIERS:
#   T1 = Minimum viable input (user must provide)
#   T2 = Recommended input (improves output quality)
#   T3 = Skill-generated (populated by isf-spec-curation skill)
#
# To get started, fill T1 fields. The skill handles the rest.

# SOLUTION SPECIFICATION METADATA
spec_version: "1.0"                                                   # T3
spec_status: "draft | review | approved | implementation | deprecated" # T3
spec_type: "solution_architecture | technical_design | integration_spec" # T3
last_updated: "YYYY-MM-DD"                                            # T3
review_cycle: "weekly | bi-weekly | monthly"                           # T2
approval_required_from: ["solution_lead", "technical_architect", "customer_stakeholder"] # T2

# ISF FRAMEWORK CONTEXT
isf_context:
  industry: "FSI | HLS | RET | MFG | MED | PUB | TEL | AME | GOV"    # T1 — required
  industry_segment: "specific vertical within industry"                # T1 — required
  solution_ids: ["SOL-xxx", "SOL-yyy"]                                 # T3
  use_case_ids: ["UC-xxx", "UC-yyy"]                                   # T3
  pain_point_ids: ["PAIN-xxx", "PAIN-yyy"]                             # T3
  related_stories: ["STY-xxx", "STY-yyy"]                              # T3

# CUSTOMER CONTEXT
customer:
  name: "Customer Name"                                                # T1 — required
  size: "enterprise | mid-market | commercial"                         # T2
  region: "NA | EMEA | APJ | LATAM"                                    # T2
  maturity_level: "exploring | adopting | expanding | optimizing"      # T2
  current_state: "legacy systems, tech stack, challenges"              # T2

# STAKEHOLDERS & PERSONAS
stakeholders:
  primary_buyer:
    persona_id: "PER-xxx"                                              # T3
    role: "Chief Data Officer | VP Analytics | etc"                    # T2
    priorities: ["business priority 1", "business priority 2"]         # T2
    success_metrics: ["metric 1", "metric 2"]                          # T2

  technical_champion:
    persona_id: "PER-yyy"                                              # T3
    role: "Data Architect | Engineering Lead"                          # T2
    concerns: ["scalability", "security", "integration complexity"]    # T2
    evaluation_criteria: ["criterion 1", "criterion 2"]                # T2

  end_users:
    - persona_id: "PER-zzz"                                           # T3
      role: "Data Analyst | Business User"                             # T2
      workflows: ["workflow description"]                              # T2

# BUSINESS REQUIREMENTS
business_requirements:
  objectives:
    - id: "BR-001"                                                     # T3
      description: "Primary business objective"                        # T1 — required (at least one)
      success_criteria: "Measurable outcome"                           # T2
      priority: "P0 | P1 | P2"                                        # T2

  kpis:
    - name: "Revenue Impact"                                           # T2
      target: "$X increase or Y% improvement"                         # T2
      measurement: "How it will be measured"                           # T3
    - name: "Operational Efficiency"                                   # T2
      target: "Z% reduction in processing time"                       # T2
      measurement: "Baseline vs target metric"                         # T3

  timeline:
    proof_of_value: "X weeks"                                          # T2
    mvp_delivery: "Y weeks"                                            # T2
    full_production: "Z months"                                        # T3

# SOLUTION ARCHITECTURE SPECIFICATION
architecture:
  overview: "High-level solution description and approach"             # T3

  # SNOWFLAKE PLATFORM COMPONENTS
  snowflake_features:
    data_platform:
      - feature_id: "FT-xxx"                                          # T3
        component: "Snowpipe Streaming"                                # T3
        purpose: "Real-time data ingestion"                            # T3
        layer: "Data Engineering"                                      # T3
        status: "GA"                                                   # T3

    ai_ml:
      - feature_id: "FT-yyy"                                          # T3
        component: "Cortex AI Functions"                               # T3
        purpose: "ML-powered analytics"                                # T3
        layer: "AI/ML"                                                 # T3
        status: "GA"                                                   # T3

    governance:
      - feature_id: "FT-zzz"                                          # T3
        component: "Horizon Catalog"                                   # T3
        purpose: "Data governance and discovery"                       # T3
        layer: "Governance"                                            # T3
        status: "GA"                                                   # T3

    applications:
      - feature_id: "FT-aaa"                                          # T3
        component: "React + FastAPI"                                   # T3
        purpose: "User-facing application"                             # T3
        layer: "Application Development"                               # T3
        status: "GA"                                                   # T3

  # DATA ARCHITECTURE
  data_model:
    source_systems:
      - system: "ERP System"                                           # T2
        data_volume: "TB/day"                                          # T2
        ingestion_pattern: "batch | streaming | hybrid"                # T3
        latency_requirement: "real-time | near-real-time | batch"      # T2

    landing_zone:
      schema_design: "raw data structure"                              # T3
      retention_policy: "X days/months"                                # T3

    transformation_layers:
      - layer: "bronze | raw"                                          # T3
        purpose: "Immutable landing zone"                              # T3
        objects: ["raw_table_1", "raw_table_2"]                        # T3

      - layer: "silver | cleansed"                                     # T3
        purpose: "Cleansed and conformed data"                         # T3
        transformation_logic: "dbt models, stored procedures, or tasks" # T3
        objects: ["cleansed_table_1", "cleansed_table_2"]              # T3

      - layer: "gold | curated"                                        # T3
        purpose: "Business-ready analytics objects"                    # T3
        objects: ["fact_sales", "dim_customer"]                        # T3

    data_sharing:
      internal_shares: ["department 1", "department 2"]                # T3
      external_shares: ["partner 1", "partner 2"]                      # T3
      marketplace_listings: ["listing description"]                    # T3

  # INTEGRATION ARCHITECTURE
  integrations:
    data_sources:
      - source: "Salesforce"                                           # T2
        partner_id: "PTR-xxx"                                          # T3
        method: "Fivetran connector"                                   # T3
        frequency: "15 minutes"                                        # T2

    partner_tools:
      - partner_id: "PTR-yyy"                                         # T3
        name: "dbt Cloud"                                              # T2
        purpose: "Transformation orchestration"                        # T3
        integration_pattern: "Native integration"                      # T3

    custom_integrations:
      - name: "Legacy System API"                                      # T2
        method: "External Functions | API Integration"                 # T3
        authentication: "OAuth 2.0 | Key-based"                        # T3

# TECHNICAL REQUIREMENTS
technical_requirements:
  performance:
    query_response_time: "< X seconds for P95"                         # T2
    data_freshness: "< Y minutes latency"                              # T2
    concurrent_users: "Z users"                                        # T2

  scalability:
    data_volume_growth: "X TB/year"                                    # T2
    compute_scaling: "Auto-scale configuration"                        # T3

  security:
    authentication: "SSO | MFA | OAuth"                                # T2
    authorization: "RBAC model"                                        # T3
    encryption: "At-rest and in-transit"                                # T3
    compliance: ["GDPR", "HIPAA", "SOC 2"]                             # T2

  availability:
    sla_target: "99.9% uptime"                                         # T3
    failover_strategy: "Multi-region | replication"                    # T3
    disaster_recovery: "RPO/RTO requirements"                          # T3

# IMPLEMENTATION SPECIFICATION
implementation:
  accelerators:
    - accelerator_id: "ACC-xxx"                                        # T3
      name: "Industry Accelerator Name"                                # T3
      customization_needed: "Description of changes"                   # T3

  demos:
    - demo_id: "DEM-xxx"                                               # T3
      name: "Demo Name"                                                # T3
      poc_scope: "What will be demonstrated"                           # T3

  assets:
    - asset_id: "AST-xxx"                                              # T3
      name: "Reference Architecture"                                   # T3
      usage: "How it will be applied"                                  # T3

  # DEVELOPMENT PHASES
  phases:
    - phase: "1 - Discovery & Design"                                  # T3
      duration: "2 weeks"                                              # T3
      deliverables:
        - "Detailed requirements document"
        - "Architecture design review"
        - "Security & compliance assessment"

    - phase: "2 - Environment Setup"                                   # T3
      duration: "1 week"                                               # T3
      deliverables:
        - "Snowflake account provisioned"
        - "Role hierarchy configured"
        - "Network & security configured"

    - phase: "3 - Data Pipeline Development"                           # T3
      duration: "4 weeks"                                              # T3
      deliverables:
        - "Ingestion pipelines operational"
        - "Transformation logic implemented"
        - "Data quality checks in place"

    - phase: "4 - Analytics & Applications"                            # T3
      duration: "3 weeks"                                              # T3
      deliverables:
        - "Analytical views created"
        - "React + FastAPI app deployed"
        - "User acceptance testing complete"

    - phase: "5 - Production Launch"                                   # T3
      duration: "1 week"                                               # T3
      deliverables:
        - "Production cutover"
        - "User training complete"
        - "Monitoring & alerting active"

  # WORKSTREAM BREAKDOWN
  workstreams:
    - name: "Data Engineering"                                         # T3
      owner: "Data Engineer Name"                                      # T2
      tasks:
        - task: "Build ingestion pipelines"                            # T3
          spec_reference: "data_model.source_systems"                  # T3
          acceptance_criteria: "Pipeline processes X records/sec with Y% accuracy" # T3

    - name: "Analytics Development"                                    # T3
      owner: "Analytics Engineer Name"                                 # T2
      tasks:
        - task: "Create dimensional model"                             # T3
          spec_reference: "data_model.transformation_layers"           # T3
          acceptance_criteria: "Model supports all required KPIs"      # T3

    - name: "Application Development"                                  # T3
      owner: "App Developer Name"                                      # T2
      tasks:
        - task: "Build React + FastAPI application"                    # T3
          spec_reference: "architecture.snowflake_features.applications" # T3
          acceptance_criteria: "App loads in <2 seconds, supports Z concurrent users" # T3

# TESTING & VALIDATION
testing:
  test_strategy:
    - type: "Unit Testing"                                             # T3
      scope: "Individual transformations and functions"                # T3
      tools: ["dbt test", "Snowflake tasks"]                           # T3

    - type: "Integration Testing"                                      # T3
      scope: "End-to-end data pipeline"                                # T3
      validation: "Data quality, referential integrity"                # T3

    - type: "Performance Testing"                                      # T3
      scope: "Query performance, concurrency"                          # T3
      benchmarks: "Sub-second response times for key queries"          # T3

    - type: "User Acceptance Testing"                                  # T3
      scope: "Business user workflows"                                 # T3
      participants: ["Business users", "Data analysts"]                # T2

  acceptance_criteria:
    - id: "AC-001"                                                     # T3
      requirement_id: "BR-001"                                         # T3
      criteria: "Dashboard displays real-time sales data with <5 min latency" # T3
      test_method: "End-to-end data flow validation"                   # T3
      status: "pending | passed | failed"                              # T3

# OPERATIONAL SPECIFICATION
operations:
  monitoring:
    - metric: "Pipeline health"                                        # T3
      tool: "Snowflake Query History / Task History"                   # T3
      alert_threshold: "Any failed task"                               # T3

    - metric: "Query performance"                                      # T3
      tool: "Query Performance Dashboard"                              # T3
      alert_threshold: "P95 latency > X seconds"                      # T3

  maintenance:
    backup_strategy: "Time Travel + Fail-safe"                         # T3
    update_schedule: "Weekly deployment windows"                       # T3

  support:
    l1_support: "Help desk team"                                       # T3
    l2_support: "Data engineering team"                                 # T3
    l3_support: "Snowflake support"                                    # T3

  cost_management:
    budget: "$X/month"                                                 # T2
    optimization_strategy: "Auto-suspend, warehouse sizing"            # T3
    monitoring: "Resource monitors and alerts"                         # T3

# RISKS & MITIGATION
risks:
  - id: "RISK-001"                                                     # T3
    description: "Data quality issues from source systems"             # T3
    impact: "high | medium | low"                                      # T3
    probability: "high | medium | low"                                 # T3
    mitigation: "Implement comprehensive data quality checks"          # T3
    owner: "Data Engineer"                                             # T3

  - id: "RISK-002"                                                     # T3
    description: "Integration complexity with legacy systems"          # T3
    impact: "high"                                                     # T3
    probability: "medium"                                              # T3
    mitigation: "Build abstraction layer, allocate buffer time"        # T3
    owner: "Integration Architect"                                     # T3

# ASSUMPTIONS & DEPENDENCIES
assumptions:                                                           # T2
  - "Source systems will provide APIs with documented schemas"
  - "Customer has Snowflake Enterprise Edition"
  - "Network connectivity between on-prem and Snowflake is established"

dependencies:
  - dependency: "Customer IT to provision VPN access"                  # T2
    owner: "Customer IT Team"                                          # T2
    due_date: "YYYY-MM-DD"                                             # T2
    status: "pending | in-progress | complete"                         # T3

# CHANGE MANAGEMENT
change_log:
  - version: "0.1"                                                     # T3
    date: "YYYY-MM-DD"                                                 # T3
    author: "Architect Name"                                           # T3
    changes: "Initial draft"                                           # T3

# REFERENCES
references:
  isf_documentation: "Links to ISF solution pages"                     # T3
  snowflake_docs: "Links to relevant Snowflake documentation"          # T3
  partner_docs: "Links to partner integration guides"                  # T3
  customer_docs: "Links to customer-specific documentation"            # T2

---
