# Snowflake Diagnostics Skill

Systematic troubleshooting workflow for Snowflake infrastructure issues including connection failures, permission errors, warehouse problems, and object accessibility.

## Features

- **6-Step Diagnostic Workflow**: Structured troubleshooting process
- **Connection Verification**: Test connections and verify authentication
- **Role & Privilege Analysis**: Identify missing grants and permissions
- **Warehouse Status Checks**: Verify warehouse state and configuration
- **Object Accessibility Testing**: Check table/view access and grants
- **Structured Reporting**: Clear diagnostics with actionable solutions

## Installation

### Personal Installation (All Projects)

```bash
# Copy to personal skills directory
cp -r skills/snowflake-diagnostics ~/.snowflake/cortex/skills/
```

### Project-Level Installation (Team-Shared)

```bash
# Copy to project skills directory
cp -r skills/snowflake-diagnostics .cortex/skills/
git add .cortex/skills/snowflake-diagnostics
git commit -m "Add snowflake-diagnostics skill"
```

### Symlink Method (Developers)

```bash
# Link from personal directory to project
ln -s ~/.snowflake/cortex/skills/snowflake-diagnostics .cortex/skills/
```

## When to Use

The skill automatically activates when you encounter:

- Connection errors or authentication issues
- Permission denied errors
- Warehouse not responding or suspended
- Database/schema context issues
- Object accessibility problems

### Example Prompts

```
"Debug my Snowflake connection"
"Why am I getting permission denied?"
"Check my Snowflake environment"
"Warehouse not responding"
"Can't access this table"
```

## Workflow Steps

### 1. Connection Verification

Lists all available connections and tests active connection:

```sql
SELECT 
    CURRENT_USER(), 
    CURRENT_ROLE(), 
    CURRENT_WAREHOUSE(), 
    CURRENT_DATABASE(), 
    CURRENT_SCHEMA();
```

**Checks:**
- Network connectivity
- Authentication status
- Active connection matches intent

### 2. Role & Privilege Analysis

Analyzes grants and permissions:

```sql
-- User grants
SHOW GRANTS TO USER <current_user>;

-- Warehouse access
SHOW GRANTS ON WAREHOUSE <warehouse_name>;

-- Database/schema access
SHOW GRANTS ON DATABASE <db>;
SHOW GRANTS ON SCHEMA <schema>;
```

**Identifies:**
- Current role and available roles
- Missing privileges
- Grant hierarchies

### 3. Warehouse Status Check

Verifies warehouse configuration:

```sql
SHOW WAREHOUSES LIKE '<warehouse>';
```

**Checks:**
- Warehouse state (running/suspended)
- Size configuration
- Auto-suspend/resume settings
- Access permissions

### 4. Database/Schema Context

Validates context and availability:

```sql
-- Current context
SELECT CURRENT_DATABASE(), CURRENT_SCHEMA();

-- Available databases
SHOW DATABASES;

-- Available schemas
SHOW SCHEMAS IN DATABASE <db>;
```

**Identifies:**
- Context mismatches
- Case sensitivity issues
- Missing objects

### 5. Object Accessibility

Tests specific object access:

```sql
-- Table/view existence
SHOW TABLES LIKE '<table>';

-- Object grants
SHOW GRANTS ON TABLE <table>;
```

**Verifies:**
- Object exists
- Current role has access
- Column-level permissions (if applicable)

### 6. Common Issues Checklist

- [ ] Wrong connection selected
- [ ] Warehouse suspended or too small
- [ ] Role lacks necessary privileges
- [ ] Database/schema context not set
- [ ] Object name typo or case mismatch
- [ ] Network connectivity issues
- [ ] Expired credentials/tokens
- [ ] MFA/SSO authentication required

## Output Format

```
🔍 SNOWFLAKE DIAGNOSTICS REPORT

Connection: my_dev_connection
User: john.doe
Role: ANALYST_ROLE
Warehouse: COMPUTE_WH (STARTED)
Context: SALES_DB.PUBLIC

✅ PASSING CHECKS:
- Connection active
- Warehouse running
- Database accessible

❌ FAILING CHECKS:
- Role lacks SELECT privilege on target table
  → SOLUTION: GRANT SELECT ON TABLE CUSTOMERS TO ROLE ANALYST_ROLE

⚠️  WARNINGS:
- Warehouse auto-suspend is 60s (may suspend too quickly for workload)

RECOMMENDED ACTIONS:
1. Run: USE ROLE ACCOUNTADMIN; GRANT SELECT ON TABLE CUSTOMERS TO ROLE ANALYST_ROLE;
2. Increase warehouse auto-suspend to 300s for better query caching
```

## Value Proposition

### Before
- Ad-hoc queries to investigate issues
- Manual checking of multiple SHOW commands
- Inconsistent troubleshooting approaches
- Missing critical checks

### After
- Systematic 6-step diagnostic process
- Structured report with clear findings
- Actionable fixes with specific SQL commands
- Comprehensive environment validation

### Benefits
- **Time Saved**: ~10-15 minutes per troubleshooting session
- **Token Reduction**: ~2000 tokens (consolidated workflow vs. iterative exploration)
- **Consistency**: Same diagnostic approach every time
- **Completeness**: No missed checks or overlooked issues

## Best Practices

1. **Start Simple**: Check obvious issues first (suspended warehouse, wrong role)
2. **Use SHOW Commands**: Extensively use SHOW commands for discovery
3. **Test Minimally**: Use simple queries to isolate problems
4. **Check Context**: Always verify connection context before assumptions
5. **Case Sensitivity**: Remember Snowflake identifier case rules
6. **Provide SQL**: Give users specific commands they can run themselves

## Common Scenarios

### Scenario 1: Permission Denied Error

**User Request**: "I'm getting permission denied when querying SALES_DB.PUBLIC.CUSTOMERS"

**Skill Actions**:
1. Verifies connection and role
2. Checks grants on database, schema, table
3. Identifies missing SELECT privilege
4. Provides exact GRANT command to fix

### Scenario 2: Suspended Warehouse

**User Request**: "My queries aren't running"

**Skill Actions**:
1. Tests connection and role
2. Checks warehouse status
3. Identifies warehouse is SUSPENDED
4. Suggests either resuming or adjusting auto-suspend settings

### Scenario 3: Wrong Connection

**User Request**: "I can't find my tables"

**Skill Actions**:
1. Lists all available connections
2. Shows current connection context
3. Identifies user is connected to wrong account/database
4. Provides command to switch connections

## Troubleshooting

### Skill Not Activating

Check that the skill is properly installed:

```bash
ls ~/.snowflake/cortex/skills/snowflake-diagnostics/SKILL.md
```

### Permission to Run SHOW Commands

Some SHOW commands require specific privileges. If diagnostics fail:

```sql
-- Grant necessary monitoring privileges
USE ROLE ACCOUNTADMIN;
GRANT IMPORTED PRIVILEGES ON DATABASE SNOWFLAKE TO ROLE <your_role>;
```

### Timeout Issues

For accounts with many objects, increase query timeout:

```sql
ALTER SESSION SET STATEMENT_TIMEOUT_IN_SECONDS = 600;
```

## Related Skills

- **snowflake-performance-analysis**: For query performance and warehouse optimization
- **multi-env-deployment**: For deploying across multiple Snowflake environments

## Support & Feedback

For issues or suggestions, contact your Snowflake Solutions Engineer or file an issue in the repository.
