---
name: onboarding
description: "Snowflake connection discovery and setup. Use for: first-time setup, checking connection status, understanding config methods. Triggers: onboarding, setup snowflake, check connection, get started"
---

# Onboarding - Connection Discovery & Setup

> Discover existing Snowflake configuration and set up connections safely

## When to Use

- User is setting up isf-kit for the first time
- User wants to check their current Snowflake connection status
- User is unsure which configuration method they're using

## Workflow

### Step 1: Scan for Existing Configuration

Check for all possible Snowflake configuration methods:

```bash
# Check for config.toml (TOML format)
ls -la ~/.snowflake/config.toml 2>/dev/null

# Check for connections.toml (TOML format, alternate name)
ls -la ~/.snowflake/connections.toml 2>/dev/null

# Check for config (SnowSQL INI format)
ls -la ~/.snowsql/config 2>/dev/null

# Check for environment variables
env | grep -i SNOWFLAKE
```

### Step 2: Report What Was Found

Present findings to the user:

```
## Connection Configuration Detected

✓ {detected_config_path} ({num_profiles} profiles: {profile_list})
✗ {other_config_path} - not found
✗ No SNOWFLAKE_* environment variables set

Your active connection method: {config_method}
Active profile: "{active_profile}"
  Account: {account}
  User: {user}
```

**If no configuration found:**

```
## No Connection Configuration Found

No Snowflake configuration detected:
✗ ~/.snowflake/config.toml - not found
✗ ~/.snowflake/connections.toml - not found
✗ ~/.snowsql/config - not found
✗ No SNOWFLAKE_* environment variables

Would you like to create a new connection profile?
```

### Step 3: Present Options

**⚠️ MANDATORY STOPPING POINT**: Wait for user selection.

```
What would you like to do?

1. **Use current setup** - Keep your existing default, proceed with isf-kit
2. **Add a new profile** - Create a new named profile (won't affect existing)
3. **Learn more** - Explain the difference between config methods
4. **Switch active profile** - Change which profile is active
5. **Something else** - Describe what you need

[1/2/3/4/5] or [Cancel]
```

### Step 4: Route Based on Selection

**If 1 (Use current setup):**
- Test connection to verify it works
- If successful, proceed to next onboarding step
- If fails, offer troubleshooting

**If 2 (Add a new profile):**
- Load `references/add-profile-flow.md`
- Guide through profile creation

**If 3 (Learn more):**
- Load `references/connection-methods.md`
- Return to menu after explanation

**If 4 (Switch profile):**
- Load `/switch-connection` skill

**If 5 (Something else):**
- **Ask** user to describe their need, then assist or route accordingly

## Add Profile Flow

When user selects "Add a new profile":

```
## Add New Profile

I'll help you create a new Snowflake connection profile.

Profile name: _______________
(This won't affect your existing "{active_profile}" profile)

Account identifier: _______________
Username: _______________

Authentication method:

  1. PAT (Personal Access Token)
     → Recommended for: CI/CD, scripts, automated workflows
     
  2. SSO/Browser (externalbrowser)
     → Recommended for: Interactive development, enterprise SSO
     
  3. Key-pair
     → Recommended for: Service accounts, high-security environments
     
  4. MFA/Passcode
     → Recommended for: When MFA is enforced by org policy

---

[Continue] [Cancel - return to menu]
```

**⚠️ MANDATORY STOPPING POINT**: Confirm before creating profile.

```
## Confirm New Profile

Create this profile?

  Name: {new_profile_name}
  Account: {account}
  User: {user}
  Auth: {auth_method}
  Config file: {target_config_path}

[Create] [Edit] [Cancel - return to menu]
```

## Connection Test

After setup or when verifying:

```bash
# Test using snow CLI
snow connection test --connection-name {profile_name}
```

**Success:**
```
✓ Connection successful

  Profile: {name}
  Config: {path}
  Account: {account}
  User: {user}
  Warehouse: {warehouse}
  Role: {role}
```

**Failure:**
```
✗ Connection failed

  Error: {error_message}

Would you like to:
  1. Edit the profile credentials
  2. Try a different profile
  3. Cancel
```

## Output

On successful completion:

```
✅ Onboarding complete

Active connection: {profile_name}
Config method: {detected_config_method}

You can switch profiles anytime with /switch-connection

Next: Ready to use isf-kit skills
```

## Stopping Points

- ✋ After presenting options menu
- ✋ Before creating new profile (confirmation)
- ✋ After connection test failure

## References

- `references/connection-methods.md` - Detailed explanation of config methods
