---
name: switch-connection
description: "Safely switch between Snowflake connection profiles with confirmation. Use for: changing active connection, switching profiles, connection management. Triggers: switch connection, change profile, use different account"
---

# Switch Connection - Profile Switching with Protection

> Safely switch between Snowflake connection profiles

## When to Use

- User wants to switch to a different Snowflake profile
- User needs to change active connection
- User wants to see available profiles

## Workflow

### Step 1: Show Current Connection & Available Profiles

**Scan for config files** in this order:
- `~/.snowflake/config.toml`
- `~/.snowflake/connections.toml`
- `~/.snowsql/config`
- Environment variables (`SNOWFLAKE_*`)

**Present what was found:**

```
## Current Connection

  Active: {active_profile}
  Config: {detected_config_path}
  Account: {account}
  User: {user}

## Available Profiles

  Source: {config_path_1}
  1. {profile_name} (active)
  2. {profile_name}
  3. {profile_name}

  Source: {config_path_2}  <!-- only if multiple config files found -->
  4. {profile_name}

Which profile do you want to switch to? (1-N)

[Cancel] [Something else]
```

**⚠️ MANDATORY STOPPING POINT**: Wait for user selection.

### Step 2: Confirmation

**⚠️ MANDATORY STOPPING POINT**: Require explicit confirmation by typing profile name.

```
## Confirm Switch

  FROM: {current_profile} ({config_source})
  TO:   {target_profile} ({config_source})

Type "{target_profile}" to confirm:
```

Wait for user to type the exact profile name. Do NOT proceed without exact match.

### Step 3: Switch and Test Connection

```
## Switching Connection...

Testing connection to {target_profile}...
```

**Test command:**
```bash
snow connection test --connection-name {target_profile}
```

### Step 4a: Success

```
## Switching Connection...

Testing connection to {target_profile}...

✓ Connection successful

  Profile: {target_profile}
  Config: {detected_config_path}
  Account: {account}
  User: {user}
  Warehouse: {warehouse}
  Role: {role}

You are now using "{target_profile}".
```

### Step 4b: Failure with Retry

If connection fails, retry up to 3 times:

```
## Switching Connection...

Testing connection to {target_profile}...

✗ Connection failed (Attempt 1/3)

  Error: {error_message}

Retrying in 3 seconds...
```

```
✗ Connection failed (Attempt 2/3)

  Error: {error_message}

Retrying in 3 seconds...
```

```
✗ Connection failed (Attempt 3/3)

  Error: {error_message}
```

### Step 5: Diagnose Failure

After 3 failed attempts, validate the tool works by testing another profile:

```
## Connection Failed

✗ Could not connect to "{target_profile}" after 3 attempts.

  Error: {error_message}

---

## Diagnosing...

Testing another profile to verify connectivity tool is working...

Testing "{fallback_profile}"...
✓ Connection successful

Tool is working. The issue is with "{target_profile}" configuration.
```

### Step 6: Analyze Config Issues

```
## Analyzing "{target_profile}" Config

  Source: {detected_config_path}
  
  Checking configuration...

  ⚠️  Potential issues found:

  1. {issue_description}
     Current: {current_value}
     Expected: {expected_value}

  2. {issue_description}

---

**⚠️ MANDATORY STOPPING POINT**: Wait for user to select fix option.

Would you like me to help fix these issues?

  1. {fix_option_1}
  2. {fix_option_2}
  3. Fix all issues
  4. Cancel - return to previous connection

[1/2/3/4]
```

### Step 7: Apply Fixes

**If user selects fix:**

```
## Fix: {fix_type}

{fix_action}...

  Old: {old_value}
  New: {new_value}

✓ Updated in {detected_config_path}

---

## Retesting Connection...

Testing connection to {target_profile}...

✓ Connection successful

  Profile: {target_profile}
  Config: {detected_config_path}
  Account: {account}
  User: {user}

You are now using "{target_profile}".
```

### If No Other Profiles to Validate

```
## Connection Failed

✗ Could not connect to "{target_profile}" after 3 attempts.

  Error: {error_message}

---

## Diagnosing...

No other profiles available to test connectivity tool.

Analyzing "{target_profile}" config for common issues...
```

Then proceed directly to config analysis.

## Diagnostic Checks

| Check | Common Issue |
|-------|--------------|
| Account format | Underscores vs hyphens |
| Token expiry | PAT > 90 days old |
| Username format | Case sensitivity |
| Missing fields | Warehouse, role not set |
| File permissions | Config not readable |
| Authenticator mismatch | SSO config but no browser |

## Stopping Points

- ✋ After showing available profiles (wait for selection)
- ✋ Confirmation (wait for typed profile name)
- ✋ After failed attempts (offer diagnostic options)
- ✋ Before applying fixes (confirm which fixes)

## Output

On successful switch:

```
✅ Connection switched

  Profile: {name}
  Config: {method}
  Account: {account}

Ready to use.
```

On cancel:

```
Connection unchanged. Still using "{previous_profile}".
```
