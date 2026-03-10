# Kimball Technique Index

Complete taxonomy of dimensional modeling techniques from the Kimball methodology. Use as a quick-reference when selecting patterns or reviewing data models. Each entry provides a concise definition and guidance on when to apply the technique.

---

## Fundamental Concepts

### Four-Step Dimensional Design Process
1. Select the business process (operational activity generating events)
2. Declare the grain (what one row represents)
3. Identify the dimensions (descriptive context: who, what, where, when, why, how)
4. Identify the facts (numeric measurements at the declared grain)

### Star Schemas and OLAP Cubes
A star schema has a central fact table surrounded by denormalized dimension tables. An OLAP cube is a multi-dimensional aggregation of the same data. Star schemas are the foundation of all dimensional models in relational databases.

### Facts for Measurements
Facts are the numeric measurements of a business process. They live in fact tables and are typically additive (summable across all dimensions). The most useful facts are continuously valued and numeric.

### Dimensions for Descriptive Context
Dimensions contain the textual descriptors used to filter, group, and label facts. They answer the who/what/where/when/why/how questions. Dimension tables are wide (many columns) and shallow (fewer rows than facts).

### Grain
The grain defines what a single row in a fact table represents. It must be declared before any other design decision. Mixed-grain fact tables are a design error.

### Business Processes
A business process is an operational activity (taking orders, processing claims, registering students) that produces measurable events. Each process maps to a fact table or a small set of related fact tables.

### Gather Business Requirements and Data Realities
Effective dimensional models require both business requirements (what questions to answer) and data realities (what source data is available). The design must balance both.

### Collaborative Dimensional Modeling Workshops
Cross-functional sessions with business analysts, DBA staff, and subject-matter experts to define and validate the dimensional model. Critical for getting the grain and dimensions right.

### Graceful Extensions to Dimensional Models
Dimensional models can be extended without breaking existing queries: add new facts to an existing fact table, add new dimensions, add new attributes to a dimension. This is a core advantage over normalized models.

---

## Basic Fact Table Techniques

### Fact Table Structure
Fact tables contain foreign keys to dimension tables plus numeric fact columns. The primary key is usually the composite of all dimension foreign keys (or a subset plus a degenerate dimension). Fact tables are tall (many rows) and narrow (few columns).

### Transaction Fact Tables
One row per discrete business event. The most fundamental and common fact table type. All facts are typically additive. See `references/fact-table-patterns.md`.

### Periodic Snapshot Fact Tables
One row per entity per time period. Dense (every entity gets a row every period). Contains semi-additive facts like balances. See `references/fact-table-patterns.md`.

### Accumulating Snapshot Fact Tables
One row per process lifecycle instance. Updated as milestones are reached. Contains multiple date foreign keys and lag/duration facts. See `references/fact-table-patterns.md`.

### Factless Fact Tables
Fact tables containing only dimension keys with no numeric facts. Used for event tracking (what happened) and coverage analysis (what was eligible). See `references/fact-table-patterns.md`.

### Consolidated Fact Tables
Combine measurements from multiple business processes at a common grain into a single table. Use when users frequently compare metrics side-by-side and the grains align naturally.

### Aggregated Fact Tables or OLAP Cubes
Pre-aggregated summaries of base-level fact tables at a higher grain for query performance. Always maintain the base-level table as the source of truth.

### Conformed Facts
Facts that have the same definition, calculation, and units across multiple fact tables. Revenue should mean the same thing in `fct_orders` and `fct_returns`. Enables reliable cross-process comparison.

### Additive, Semi-Additive, and Non-Additive Facts
- **Additive**: summable across all dimensions (revenue, quantity)
- **Semi-additive**: summable across non-time dimensions only (balance, headcount)
- **Non-additive**: never directly summable (unit price, ratio, percentage)

### Nulls in Fact Tables
Null-valued measurements are acceptable in fact tables. NULLs in foreign key columns are NOT acceptable -- use a default "Unknown" dimension row instead. COALESCE or replace NULLs in additive facts with 0 where appropriate.

### Fact Table Surrogate Key
An optional single-column surrogate key on the fact table. Useful for ETL back-references, update tracking, and parent-child fact table relationships. Not required for query performance.

---

## Basic Dimension Table Techniques

### Dimension Table Structure
Wide, denormalized tables with a surrogate key primary key, natural key, and many descriptive attributes. Typically 50-100 columns. Flat (not normalized).

### Dimension Surrogate Keys
Synthetic integer keys assigned by the data warehouse. Decouple the warehouse from source system keys. Required for SCD Type 2 (multiple rows per natural key). See `references/dimension-patterns.md`.

### Natural, Durable, and Supernatural Keys
- **Natural key**: business-assigned identifier from the source system (customer_id, SKU)
- **Durable key**: a permanent identifier that survives source system changes
- **Supernatural key**: a surrogate key managed by the DW that persists across SCD changes

### Drilling Down
Adding a dimension attribute to a query to see finer-grained data. Dimensional models support drill-down naturally by joining to the more detailed attributes in any dimension.

### Denormalized Flattened Dimensions
Flatten all hierarchies into the dimension table. Do not normalize dimensions into snowflake sub-tables. Query performance and usability are paramount.

### Multiple Hierarchies in Dimensions
A single dimension can contain multiple hierarchies (e.g., product has brand->category and department->class). Store all hierarchy levels as flat columns in the dimension.

### Flags and Indicators as Dimension Attributes
Store flags (is_active, is_premium) as text values ('Yes'/'No' or 'Active'/'Inactive') not booleans, for better usability in BI tools. Alternatively, combine into a junk dimension.

### Null Attributes in Dimensions
Replace NULL dimension attribute values with descriptive strings ('Not Applicable', 'Unknown', 'Not Yet Determined'). Enables grouping and filtering without NULL-handling logic.

### Calendar Date Dimension
Every warehouse needs a date dimension. Pre-generate with attributes for day-of-week, month, quarter, fiscal periods, holidays. See `references/dimension-patterns.md`.

### Role-Playing Dimensions
A single physical dimension referenced multiple times in a fact table under different semantic roles (order_date, ship_date, due_date all reference dim_date). Implement as views or aliases. See `references/dimension-patterns.md`.

### Junk Dimensions
Combine miscellaneous low-cardinality flags and indicators into a single dimension. Keeps the fact table clean and avoids many small dimension foreign keys. See `references/dimension-patterns.md`.

### Degenerate Dimensions
Transaction identifiers (order_number, invoice_id) stored directly in the fact table with no associated dimension table. They serve as a dimension key for query purposes. See `references/dimension-patterns.md`.

### Snowflaked Dimensions
**Anti-pattern.** Normalizing a dimension into a hierarchy of sub-tables (dim_product -> dim_category -> dim_department). Hurts query performance and usability. Always denormalize.

### Outrigger Dimensions
A secondary dimension joined to a primary dimension (not to the fact). Use sparingly -- usually better to denormalize the outrigger attributes into the primary dimension. See `references/dimension-patterns.md`.

---

## Integration via Conformed Dimensions

### Conformed Dimensions
Dimension tables shared identically across multiple fact tables. The key to integrating data across business processes. Must have the same keys, attributes, and values everywhere. See `references/dimension-patterns.md`.

### Shrunken Rollup Dimensions
A subset (rollup) of a conformed dimension at a higher grain. For example, `dim_month` is a shrunken version of `dim_date`. The attributes must be a strict subset of the full dimension.

### Drilling Across
Combining facts from two or more fact tables by joining through shared conformed dimensions. Produces a merged result set. Requires conformed dimensions with identical keys.

### Value Chain
The natural flow of a business process from beginning to end (order -> fulfill -> ship -> invoice -> pay). Each step maps to a fact table. Conformed dimensions link them.

### Enterprise Data Warehouse Bus Architecture
A framework for incrementally building a data warehouse by identifying business processes (rows) and conformed dimensions (columns) in a bus matrix. Each intersection is a fact-dimension relationship.

### Enterprise Data Warehouse Bus Matrix
A grid mapping business processes to conformed dimensions. The planning tool for the bus architecture. Fill in one row at a time as you build out the warehouse.

### Opportunity/Stakeholder Matrix
Extends the bus matrix by mapping business stakeholders to business processes. Identifies who benefits from each analytical capability.

---

## Slowly Changing Dimension Techniques

### Type 0: Retain Original
Never update the attribute. The original value is preserved forever. Use for attributes where the initial value has permanent business meaning.

### Type 1: Overwrite
Replace the old value with the new value. No history preserved. Use for corrections or attributes where history is not needed.

### Type 2: Add New Row
Insert a new row for each attribute change. Track with effective_from, effective_to, and is_current. The gold standard for historical tracking. See `references/dimension-patterns.md`.

### Type 3: Add New Attribute
Add a "previous_value" column to store the prior value alongside the current value. Limited to one level of history. Use when only current-vs-previous comparison matters.

### Type 4: Add Mini-Dimension
Split rapidly changing attributes into a separate mini-dimension table. The main dimension stays stable (Type 1 or Type 2 on slow attributes). The fact table gets a foreign key to both. See `references/dimension-patterns.md`.

### Type 5: Add Mini-Dimension and Type 1 Outrigger
Type 4 mini-dimension plus a Type 1 reference from the base dimension to the current mini-dimension row. Gives the convenience of accessing current volatile attributes from the base dimension.

### Type 6: Add Type 1 Attributes to Type 2 Dimension
Hybrid of Types 1, 2, and 3. Type 2 rows for full history, plus a Type 1 "current_value" column overwritten on all rows. Enables grouping by both as-was and as-is values. See `references/dimension-patterns.md`.

### Type 7: Dual Type 1 and Type 2 Dimensions
Maintain both a Type 1 (current-only) dimension and a Type 2 (historical) dimension as separate tables. The fact table has foreign keys to both. Use when different queries need different views of the same dimension.

---

## Dimension Hierarchy Techniques

### Fixed Depth Positional Hierarchies
Hierarchies with a known, constant number of levels (Company -> Division -> Department -> Team). Store each level as a named column in the dimension. The most common and simplest approach.

### Slightly Ragged/Variable Depth Hierarchies
Hierarchies where most branches have the same depth but some are shorter (geographic hierarchies where some countries have states/provinces and others do not). Pad shorter branches by repeating the leaf value.

### Ragged/Variable Depth Hierarchies
Hierarchies with truly variable depth (organizational reporting chains, bill-of-materials). Model using a bridge table with a row for each ancestor-descendant pair at every depth, or use Snowflake's CONNECT BY / recursive CTEs.

---

## Advanced Fact Table Techniques

### Fact Table Surrogate Key
A single-column synthetic key on the fact table, independent of the dimension keys. Useful for ETL operations and parent-child fact relationships.

### Centipede Fact Tables
**Anti-pattern.** A fact table with an excessive number of dimension foreign keys (typically >15-20), usually indicating a mixed grain or design error. Split into separate fact tables aligned to distinct business processes.

### Numeric Values as Attributes or Facts
If a numeric value is used for calculations (revenue, quantity), it's a fact. If it's used for filtering or grouping (year, version_number), it's a dimension attribute. When ambiguous, store it in both.

### Lag/Duration Facts
Computed facts measuring the elapsed time between milestones in an accumulating snapshot (order_to_ship_days, ship_to_delivery_days). Calculate during ETL using DATEDIFF.

### Header/Line Fact Tables
A common source pattern (order header + order lines). Model as a single fact table at the line-item grain with header-level attributes either denormalized into each line or referenced via a degenerate dimension (order_number).

### Allocated Facts
Facts from a header distributed proportionally across line items. For example, allocating a flat shipping charge across order lines by revenue weight.

### Profit and Loss Fact Tables Using Allocations
A consolidated view of revenues and costs at a common grain, enabled by allocating costs from different source grains. Requires careful allocation methodology.

### Multiple Currency Facts
Store amounts in both the original transaction currency and a standard reporting currency. Include the exchange rate as a fact. Use the rate effective at the time of the transaction.

### Multiple Units of Measure
Store quantities in both the original unit and a standard unit. Include the conversion factor. Similar approach to multiple currencies.

### Year-to-Date Facts
**Anti-pattern as stored facts.** Never store cumulative YTD values in a fact table -- they are semi-additive across time and break aggregation. Calculate YTD at query time using window functions.

### Multipass SQL to Avoid Fact-to-Fact Table Joins
Never join two fact tables directly. Instead, query each fact table separately against shared conformed dimensions, then combine the results. In Snowflake, use CTEs or UNION ALL patterns.

### Timespan Tracking in Fact Tables
For facts that span a time range (insurance policy in effect, subscription active period), store start_date_key and end_date_key. Join to a date spine to explode into daily rows when needed.

### Late Arriving Facts
Facts that arrive after the dimension context has been loaded for that period. Post to the fact table with the correct date key, even if it means inserting into a historical partition.

---

## Advanced Dimension Table Techniques

### Late Arriving Dimensions
When a fact arrives before its dimension context is known, create a placeholder dimension row with the unresolved natural key and "Unknown" attributes. Update with Type 1 overwrite when the actual dimension data arrives.

### Dimension-to-Dimension Table Joins
Avoid joining dimensions to dimensions unless modeling an outrigger. The fact table should be the nexus of all joins. If you need dimension-to-dimension relationships, consider a bridge table.

### Multivalued Dimensions and Bridge Tables
When a fact has a many-to-many relationship with a dimension (patient with multiple diagnoses), use a bridge table. Include a weighting factor for allocating facts. See `references/dimension-patterns.md`.

### Behavior Tag Time Series
A dimension attribute that records a time-series pattern of behavior (purchase frequency code: 'HHMLH' for 5 months). Compact representation for behavioral segmentation.

### Behavior Study Groups
A fixed group of customers identified at a point in time for longitudinal analysis. Modeled as a dimension with a group_key and member_key. The group definition does not change after creation.

### Aggregated Facts as Dimension Attributes
Place useful pre-computed aggregations in the dimension (customer lifetime value, total_orders_last_12_months). Updated periodically. Enables filtering and grouping by derived behavioral attributes.

### Dynamic Value Banding
Create a dimension of value ranges (0-100, 101-500, 501+) and join facts to the appropriate band at query time using BETWEEN. Avoids hardcoding ranges in queries.

### Text Comments
Large text fields (customer notes, order comments) stored as dimension attributes. Consider placing in a separate table to avoid dimension bloat, or store as VARIANT in Snowflake.

### Multiple Time Zones
Store timestamps in UTC in the fact table. Add a dimension attribute or second date key for the local timezone. The date dimension should support both UTC and local calendar dates.

### Measure Type Dimensions
A dimension that identifies the type of measurement in a generic fact table. Useful when a fact table stores multiple metric types in a single row (metric_name + metric_value pattern).

### Step Dimensions
A dimension that tracks the current step in a sequential process (claim status, application stage). The step dimension describes the process state at the time of the fact measurement.

### Hot Swappable Dimensions
A technique for associating different dimension views with the same fact table at query time. The user selects which version of a dimension to apply (different product hierarchies, alternate geographic groupings).

### Abstract Generic Dimensions
**Anti-pattern.** A single dimension table that tries to represent multiple unrelated entity types (a "party" table for both customers and employees). Leads to sparse attributes and confusing semantics. Use separate, specific dimensions.

### Audit Dimensions
A dimension attached to fact rows that records ETL metadata: load timestamp, source system, batch ID, data quality score. Enables lineage tracking and debugging.

---

## Special Purpose Schemas

### Supertype and Subtype Schemas for Heterogeneous Products
When a business has many divergent product types (checking accounts, mortgages, business loans), create a supertype fact table with shared metrics and separate subtype fact tables with type-specific metrics. Pair with supertype/subtype dimensions.

### Real-Time Fact Tables
Fact tables updated more frequently than daily batch. In Snowflake, use streams and tasks for near-real-time loading, or Snowpipe for continuous ingestion. Consider a "hot" staging table merged into the main fact on a schedule.

### Error Event Schemas
A dimensional schema in the ETL back room for tracking data quality issues. An error event fact table (one row per error detected) with dimensions for error type, source system, severity, and affected table/column.
