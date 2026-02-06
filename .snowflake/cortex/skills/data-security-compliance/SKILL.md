---
name: data-security-compliance
description: "Audit sensitive data access, find unauthorized role/user permissions, and set up alerts for compliance monitoring."
---

# Data Security Compliance Auditor

## Overview
This skill helps platform administrators audit sensitive data access in Snowflake, identify roles and users with unauthorized access to sensitive data, and configure alerts for future unauthorized access detection.

## Workflow

### Step 1: Identify Sensitive Data
First, identify tables/columns containing sensitive data:
- Query `SNOWFLAKE.ACCOUNT_USAGE.TAG_REFERENCES` for data classification tags (PII, PHI, CONFIDENTIAL)
- Check `SNOWFLAKE.ACCOUNT_USAGE.POLICY_REFERENCES` for existing masking/row access policies
- List tables that should be protected but may lack proper classification

### Step 2: Audit Current Access Permissions
Analyze who has access to sensitive objects:
- Query `SNOWFLAKE.ACCOUNT_USAGE.GRANTS_TO_ROLES` to find roles with SELECT/UPDATE on sensitive tables
- Query `SNOWFLAKE.ACCOUNT_USAGE.GRANTS_TO_USERS` for direct user grants
- Map role hierarchy using `SNOWFLAKE.ACCOUNT_USAGE.GRANTS_TO_ROLES` where GRANTED_ON='ROLE'
- Identify over-privileged roles (roles with access they shouldn't have)

### Step 3: Review Access History
Check historical access patterns:
- Query `SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY` for who accessed sensitive tables
- Filter by sensitive object names and time range
- Identify unusual access patterns (off-hours, excessive queries, unexpected users)

### Step 4: Generate Compliance Report
Produce actionable findings:
- List roles/users with unauthorized access
- Show access history for sensitive data
- Recommend privilege revocations
- Highlight compliance gaps

### Step 5: Configure Alerts (Optional)
Set up monitoring for future unauthorized access:
- Create a stored procedure to check ACCESS_HISTORY periodically
- Use Snowflake ALERT objects or TASK + STREAM for real-time monitoring
- Configure email notifications via external function or Snowflake notification integration

## Key Queries

### Find roles with access to sensitive tables
```sql
SELECT DISTINCT
    grantee_name AS role_name,
    table_catalog || '.' || table_schema || '.' || table_name AS object_name,
    privilege
FROM SNOWFLAKE.ACCOUNT_USAGE.GRANTS_TO_ROLES
WHERE table_name IN (<sensitive_tables>)
  AND privilege IN ('SELECT', 'UPDATE', 'INSERT', 'DELETE')
  AND deleted_on IS NULL;
```

### Query access history for sensitive data
```sql
SELECT
    query_start_time,
    user_name,
    role_name,
    base_objects_accessed
FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY,
LATERAL FLATTEN(input => base_objects_accessed) AS obj
WHERE obj.value:objectName::STRING IN (<sensitive_tables>)
  AND query_start_time >= DATEADD('day', -30, CURRENT_TIMESTAMP())
ORDER BY query_start_time DESC;
```

## Examples

**Example Input**: "Which roles have accessed the CUSTOMERS table with PII data in the last 7 days?"

**Example Output**:
- Found 3 roles with access: ANALYST_ROLE, DATA_ENGINEER_ROLE, ADMIN_ROLE
- ANALYST_ROLE accessed 47 times (expected)
- DATA_ENGINEER_ROLE accessed 3 times (unexpected - review needed)
- Recommendation: Revoke DATA_ENGINEER_ROLE access or document justification

## When to Apply
- User asks about sensitive data access audit
- User wants to find unauthorized access to tables
- User asks who has access to PII/PHI/confidential data
- User wants to set up alerts for data access monitoring
- User needs a compliance report on data access
- User mentions "sensitive data", "unauthorized access", "data compliance", or "access audit"
