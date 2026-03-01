---
name: spcs-user-onboarding
description: "Add new users to an SPCS app. Auto-detects project context from Dockerfiles, service specs, and setup SQL. Use for: create user, add user, onboard user, new user access, grant app access, invite user, provision user, set up login, give access. Triggers: add user, new user, create user, onboard, user access, grant access, invite user, provision user, create login, give access, set up user, share app access."
---

# SPCS User Onboarding

Add a new Snowflake user with access to an SPCS app. Detects app context automatically from the current project.

## When to Use

- User wants to add someone to an SPCS app
- User needs to grant access to a containerized Snowflake service
- User says "add user", "onboard", "grant access"

## Workflow

### Step 1: Detect SPCS App Context

**Goal:** Identify the database, schema, service name, consumer role, and app URL.

**Try these sources in order:**

1. **Session context** -- check `cortex ctx show memory` for previously stored SPCS app details (database, schema, service, role, app URL)

2. **Project files** -- scan the working directory for SPCS artifacts:

   | File pattern | What to extract |
   |---|---|
   | `**/spcs-spec.yaml`, `**/service-spec.yaml` | Image path (encodes database/schema/repo), container port, endpoint config |
   | `**/spcs-setup.sql`, `**/setup.sql`, `**/deploy*.sql` | `CREATE DATABASE`, `CREATE SCHEMA`, `CREATE SERVICE`, `CREATE ROLE`, `GRANT` statements |
   | `**/Dockerfile` | Exposed port (confirms SPCS app exists) |
   | `**/DEPLOYMENT.md`, `**/USER_ONBOARDING.md` | App URL, registry URL, role names |

   **Detection heuristics:**
   - Database: from `CREATE DATABASE <name>` or image path segment in spec YAML
   - Schema: from `CREATE SCHEMA <db>.<name>` or spec YAML
   - Service: from `CREATE SERVICE <name>` in setup SQL
   - Consumer role: from `GRANT ROLE <name>` or `DEFAULT_ROLE` in user creation SQL
   - App URL: from deployment docs or derive from account name (`https://<hash>-<account>.snowflakecomputing.app`)

3. **ISF convention** -- if a `PROJECT_PREFIX` or similar naming convention is detected, derive:
   - Database: `${PREFIX}`
   - Service: `${PREFIX}_SERVICE`
   - Role: `${PREFIX}_ROLE`

4. **Ask the user** -- for any values not detected.

**Present detected config for confirmation:**

```
## Detected SPCS App Context

| Field    | Value              | Source            |
|----------|--------------------|-------------------|
| Database | <DATABASE>         | <detected from>   |
| Schema   | <SCHEMA>           | <detected from>   |
| Service  | <SERVICE>          | <detected from>   |
| Role     | <ROLE>             | <detected from>   |
| App URL  | <URL>              | <detected from>   |

Is this correct?
```

**STOP**: Wait for user to confirm or correct the values.

**After confirmation**, save context for the session (check for existing first):

```bash
cortex ctx search "SPCS app"
# If no existing entry, remember:
cortex ctx remember "SPCS app: database=<DATABASE>, schema=<SCHEMA>, service=<SERVICE>, role=<ROLE>, url=<URL>"
# If exists, skip (already stored)
```

### Step 2: Verify Prerequisites

**Execute** the following checks:

```sql
-- Verify the service exists and is running
SHOW SERVICES LIKE '<SERVICE>' IN SCHEMA <DATABASE>.<SCHEMA>;
```

```sql
-- Verify the consumer role exists
SHOW ROLES LIKE '<ROLE>';
```

**If service not found or not running:** Stop and inform the user. The service must be deployed first.

**If role not found:** Offer to create it with the required grant chain (see Step 2b).

### Step 2b: Create Role (if needed)

**Present SQL for approval:**

```sql
CREATE ROLE IF NOT EXISTS <ROLE>;
GRANT USAGE ON DATABASE <DATABASE> TO ROLE <ROLE>;
GRANT USAGE ON SCHEMA <DATABASE>.<SCHEMA> TO ROLE <ROLE>;
GRANT USAGE ON SERVICE <DATABASE>.<SCHEMA>.<SERVICE> TO ROLE <ROLE>;
GRANT SERVICE ROLE <DATABASE>.<SCHEMA>.<SERVICE>!ALL_ENDPOINTS_USAGE TO ROLE <ROLE>;
```

**STOP**: Get approval before executing.

### Step 3: Gather User Details

**Ask** the user:

```
To add a new user, I need:
1. Full name (e.g., "Jane Smith")
2. Email (e.g., jane.smith@snowflake.com)
3. (Optional) Custom username -- default: first initial + last name, e.g., JSMITH
4. (Optional) Custom temporary password -- default: auto-generated
```

**Derive defaults:**
- Username: first initial + last name, uppercased (e.g., "Jane Smith" -> `JSMITH`)
- Password: `Temp_<4 random alphanumeric chars>!` (e.g., `Temp_xK9m!`). Generate a fresh random password each time.

**For multiple users:** Accept a list of names/emails upfront. Repeat Steps 3-6 for each user.

**STOP**: Confirm username and details before proceeding.

### Step 4: Generate and Execute SQL

**Present the full SQL for approval:**

```sql
-- 1. Create the user
CREATE USER <USERNAME>
  LOGIN_NAME = '<USERNAME>'
  DISPLAY_NAME = '<Full Name>'
  EMAIL = '<email>'
  PASSWORD = '<password>'
  MUST_CHANGE_PASSWORD = FALSE
  DEFAULT_ROLE = '<ROLE>';

-- 2. Grant the consumer role
GRANT ROLE <ROLE> TO USER <USERNAME>;
```

**IMPORTANT:** Always set `MUST_CHANGE_PASSWORD = FALSE`. Setting it to `TRUE` blocks SPCS endpoint authentication until the user logs into Snowsight separately.

**STOP**: Get explicit approval before executing.

**On approval:** Execute statements sequentially.

### Step 5: Verify Access

**Execute:**

```sql
SHOW GRANTS TO USER <USERNAME>;
```

Confirm the output shows the consumer role is granted.

### Step 6: Present Credentials

```
## New User Created

| Field    | Value        |
|----------|--------------|
| Username | <USERNAME>   |
| Email    | <email>      |
| Password | <password>   |
| Role     | <ROLE>       |
| App URL  | <URL>        |

Share these credentials securely with the new user.
```

## Stopping Points

- After Step 1: Confirm detected SPCS context
- After Step 2b: Approve role creation (if needed)
- After Step 3: Confirm username and details
- After Step 4: Approve SQL before execution
- After Step 6: Verify user can share credentials

**Resume rule:** On approval, proceed directly to the next step without re-asking.

## Troubleshooting

### "Could not find the service associated with endpoint"

The user's role is missing part of the grant chain. Check and fix:

```sql
SHOW GRANTS TO ROLE <ROLE>;

-- Grant any missing pieces
GRANT USAGE ON DATABASE <DATABASE> TO ROLE <ROLE>;
GRANT USAGE ON SCHEMA <DATABASE>.<SCHEMA> TO ROLE <ROLE>;
GRANT USAGE ON SERVICE <DATABASE>.<SCHEMA>.<SERVICE> TO ROLE <ROLE>;
GRANT SERVICE ROLE <DATABASE>.<SCHEMA>.<SERVICE>!ALL_ENDPOINTS_USAGE TO ROLE <ROLE>;
```

### User can't log in

Check `MUST_CHANGE_PASSWORD`:

```sql
DESCRIBE USER <USERNAME>;
-- If MUST_CHANGE_PASSWORD is TRUE:
ALTER USER <USERNAME> SET MUST_CHANGE_PASSWORD = FALSE;
```

### User exists already

If `CREATE USER` fails because the user exists, offer to grant the role to the existing user instead:

```sql
GRANT ROLE <ROLE> TO USER <USERNAME>;
```

## Output

A fully provisioned Snowflake user with immediate access to the SPCS app, plus credentials summary to share.
