# Issues Encountered - Retail Demo Setup

This document captures issues encountered while getting the retail-demo working, intended to improve the specify process for future iterations.

**All issues resolved and integrated into `.specify/` workflow.**

---

## 1. Python SDK Incompatibility (snowflake-ml-python) ✅ RESOLVED

- **Problem**: `snowflake-ml-python` package (required for `from snowflake.cortex import Analyst`) depends on `llvmlite` which only supports Python <3.10. User has Python 3.13.
- **Error**: `RuntimeError: Cannot install on Python version 3.13.11; only versions >=3.6,<3.10 are supported`
- **Solution**: Rewrote connector to use Cortex Analyst REST API directly instead of Python SDK
- **Spec improvement**: Specify Python version constraints or default to REST API approach for broader compatibility

**✅ Resolution:** `.specify/templates/pyproject-template.toml` with `requires-python = ">=3.10,<3.12"` and REST API pattern in `.specify/skills/implement.md`

---

## 2. Semantic Model - verified_at Field Format ✅ RESOLVED

- **Problem**: `verified_at` in verified_queries section was a date string (`"2026-02-04"`) but Cortex Analyst expects Unix timestamp (int64)
- **Error**: `Invalid semantic model yaml: Not an int64 value: "2026-02-04"`
- **Solution**: Changed to Unix timestamp: `verified_at: 1738627200`
- **Spec improvement**: Semantic model generator should output Unix timestamps, not ISO date strings

**✅ Resolution:** `.specify/generators/semantic.py` now outputs Unix timestamps

---

## 3. Semantic Model - Unsupported Top-Level Fields ✅ RESOLVED

- **Problem**: Top-level `filters` and `metrics` sections are not supported in semantic model YAML (they must be inside table definitions)
- **Error**: `unknown field "filters"`
- **Solution**: Removed top-level `filters` and `metrics` sections
- **Spec improvement**: Validate semantic model schema against Cortex Analyst spec before generating

**✅ Resolution:** Documented in `.specify/memory/constitution.md` Principle 10

---

## 4. Semantic Model - Missing Primary Keys ✅ RESOLVED

- **Problem**: Tables used in relationships require `primary_key` definitions
- **Error**: `Table orders used in join relationship order_items_to_orders has no primary key`
- **Solution**: Added `primary_key.columns` to each table definition
- **Spec improvement**: Always generate primary_key for tables that participate in relationships

**✅ Resolution:** Documented in `.specify/memory/constitution.md` Principle 10

---

## 5. SSE Event Name Mismatch (Frontend/Backend) ✅ RESOLVED

- **Problem**: Backend sent `results` event but frontend expected `data` event
- **Symptom**: Frontend showed "Analyzing your question..." indefinitely, never displayed results
- **Solution**: Changed backend to emit `event: data` instead of `event: results`
- **Spec improvement**: Define event contract explicitly in API spec; ensure frontend/backend use same event names

**✅ Resolution:** SSE Event Contract table in `.specify/skills/plan.md` and `.specify/skills/implement.md`

---

## 6. Streaming Implementation Complexity ✅ RESOLVED

- **Problem**: Initial streaming implementation tried to parse Snowflake's SSE format which was complex and error-prone
- **Symptom**: Empty events, no SQL/results yielded
- **Solution**: Simplified to use non-streaming query internally, then yield results as simulated stream events
- **Spec improvement**: Start with simple polling/non-streaming approach; add true streaming as enhancement

**✅ Resolution:** "Simulated streaming" pattern in `.specify/skills/implement.md` B5 section

---

## 7. PAT Token Location in Config ✅ RESOLVED

- **Problem**: Code looked for `token` field in config.toml but user stored PAT in `password` field
- **Solution**: Check both `token` and `password` fields in config
- **Spec improvement**: Document expected config field names or support multiple field names

**✅ Resolution:** PAT configuration guidance in `.specify/skills/implement.md` F2 section

---

## Specify Workflow Updates (First Iteration)

All learnings integrated into `.specify/` folder:

| File | Updates |
|------|---------|
| `.specify/generators/semantic.py` | `verified_at` as Unix timestamp |
| `.specify/memory/constitution.md` | Principle 10: Standards-Compliant |
| `.specify/skills/implement.md` | REST API, SSE contract, simulated streaming, PAT config |
| `.specify/skills/plan.md` | SSE Event Contract table |
| `.specify/templates/pyproject-template.toml` | Python 3.10-3.11, httpx |

---

# Second Iteration - Improvements

These are enhancements to improve demo quality. Each should be implemented in retail-demo first, then integrated into `.specify/` for all future demos.

---

## 8. Dashboard Visualizations (Charts) ✅ RESOLVED

- **Current state**: Dashboard shows metrics as simple cards with numbers
- **Improvement**: Add charts/graphs for trends and comparisons
- **Recommendation**: Recharts (React-native, composable, good defaults)
- **Spec improvement**: Add chart component patterns to `.specify/skills/implement.md`

**Scope:**
- Sales trend line chart (time series) ✅
- Top products bar chart ✅
- Regional performance comparison (deferred)
- Category breakdown pie/donut chart ✅

**Specify integration:**
- Add `U6: Chart Components` section to `implement.md` ✅
- Add Recharts to frontend dependencies in templates ✅
- Create reusable chart wrapper patterns ✅

**✅ Resolution:** 
- retail-demo: Charts in `frontend/src/components/charts/`, API in `backend/app/routers/metrics.py`
- `.specify/skills/implement.md`: U6 Chart Components section with Line, Bar, Pie patterns

---

## 9. Dashboard Layout & Visual Hierarchy ✅ RESOLVED

- **Current state**: Basic grid of metric cards, minimal visual design
- **Improvement**: Polished layouts with clear information hierarchy
- **Recommendation**: Dashboard grid patterns with header, KPI row, charts section
- **Spec improvement**: Add dashboard layout templates to `.specify/skills/implement.md`

**Scope:**
- Header with title and date range selector ✅
- KPI summary row (4-5 key metrics) ✅
- Chart grid (2x2 or flexible) ✅
- Data table section for details ✅

**Specify integration:**
- Add `U7: Dashboard Layout` section to `implement.md` ✅
- Create Dashboard.tsx template with standard sections ✅
- Document layout patterns in plan.md (deferred)

**✅ Resolution:**
- retail-demo: Enhanced Dashboard.tsx with sections, RecentOrdersTable component, date range selector
- `.specify/skills/implement.md`: U7 Dashboard Layout with structure, selector, table, status badge patterns

---

## 10. Dark Mode Support ✅ RESOLVED

- **Current state**: Light mode only
- **Improvement**: Toggle between light/dark themes
- **Recommendation**: Tailwind dark mode with CSS variables
- **Spec improvement**: Add dark mode config to frontend setup patterns

**Scope:**
- Tailwind `darkMode: 'class'` configuration ✅
- Theme toggle component ✅
- CSS variables for consistent theming ✅
- Persist preference in localStorage ✅

**Specify integration:**
- Update `tailwind.config.js` template in `implement.md` ✅
- Add ThemeProvider pattern to frontend tasks ✅
- Document color palette standards ✅

**✅ Resolution:**
- retail-demo: ThemeContext, ThemeToggle, dark mode classes on all components
- `.specify/skills/implement.md`: U8 Dark Mode Support with complete implementation patterns

---

## 11. Mobile Responsiveness ✅ RESOLVED

- **Current state**: Desktop-focused layout, poor mobile experience
- **Improvement**: Responsive design that works on tablets and phones
- **Recommendation**: Mobile-first Tailwind breakpoints
- **Spec improvement**: Add responsive patterns to component templates

**Scope:**
- Collapsible sidebar navigation ✅
- Stacked layouts on mobile ✅
- Touch-friendly controls ✅
- Responsive chart sizing ✅

**Specify integration:**
- Add responsive breakpoint patterns to `implement.md` ✅
- Update component templates with mobile-first classes ✅
- Document responsive testing requirements (deferred)

**✅ Resolution:**
- retail-demo: Layout.tsx with hamburger menu, sticky header, responsive breakpoints throughout
- `.specify/skills/implement.md`: U9 Mobile Responsiveness with layout, grid, typography, touch patterns

---

## Second Iteration Summary

**All improvements resolved and integrated into `.specify/` workflow.**

| Improvement | retail-demo | `.specify/skills/implement.md` |
|-------------|-------------|-------------------------------|
| #8 Charts | 3 chart components + API | U6: Chart Components |
| #9 Layout | Dashboard sections, table | U7: Dashboard Layout |
| #10 Dark Mode | ThemeContext, toggle | U8: Dark Mode Support |
| #11 Mobile | Hamburger menu, breakpoints | U9: Mobile Responsiveness |

**New sections added to `implement.md`:**
- U6: Chart Components (Recharts) - Line, Bar, Pie patterns
- U7: Dashboard Layout & Visual Hierarchy - Structure, data tables
- U8: Dark Mode Support - Theme context, toggle, class patterns
- U9: Mobile Responsiveness - Layout, grids, touch patterns

---

# Runtime Issues (Post-Implementation)

Issues discovered during testing after implementing improvements #8-11.

---

## 12. Missing npm dependency (recharts) ✅ RESOLVED

- **Problem**: Recharts was added to package.json but not installed
- **Error**: `Failed to resolve import "recharts" from "src/components/charts/TopProductsChart.tsx"`
- **Solution**: Run `npm install recharts` in frontend directory
- **Spec improvement**: After adding dependencies to package.json, always run `npm install`

---

## 13. Schema mismatch - Column names ✅ RESOLVED

- **Problem**: SQL queries used assumed column names that didn't match actual schema
- **Errors**:
  - `invalid identifier 'P.NAME'` - products table uses `product_name` not `name`
  - `invalid identifier 'OI.SUBTOTAL'` - order_items uses `line_total` not `subtotal`
  - `invalid identifier 'O.STATUS'` - orders uses `order_status` not `status`
- **Solution**: Updated SQL queries to use correct column names from semantic model
- **Spec improvement**: Always verify column names against semantic model or `DESCRIBE TABLE` before writing queries

**Corrected mappings:**
| Assumed | Actual |
|---------|--------|
| `products.name` | `products.product_name` |
| `order_items.subtotal` | `order_items.line_total` |
| `orders.status` | `orders.order_status` |

---

## 14. Data type mismatch - order_id ✅ RESOLVED

- **Problem**: Backend model defined `order_id` as `int` but actual data is string format (`ORD-00099905`)
- **Error**: `invalid literal for int() with base 10: 'ORD-00099905'`
- **Solution**: Changed `order_id` type from `int` to `str` in both Pydantic model and response mapping
- **Spec improvement**: Check actual data types in source tables, not just assumed types. IDs are often strings with prefixes.

---

# Third Iteration - TODOs

Future enhancements identified during skill development and auditing.

---

## 15. Data Generators Module 🔲 TODO

- **Context**: `skills/specify/generate/SKILL.md` references data generation capabilities
- **Need**: Create reusable generators module for domain model validation and data generation
- **Scope**:
  - `generators/validate_domain_model.py` - Validate domain-model.yaml structure and relationships
  - `generators/generate_data.py` - Generate realistic demo data based on domain model
  - Support for industry-specific data patterns (Healthcare ICD-10, Retail SKUs, Financial transactions)
  - Output formats: SQL INSERT, Parquet, CSV, Direct Load
- **Spec improvement**: Add generators module to `skills/specify/generate/` with pyproject.toml for dependencies
