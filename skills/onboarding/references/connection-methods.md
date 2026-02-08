# Snowflake Connection Methods

## Overview

Snowflake supports multiple ways to configure connections. Understanding which method you're using helps avoid configuration conflicts.

## Methods Comparison

| Method | Location | Format | Best For |
|--------|----------|--------|----------|
| `config.toml` | `~/.snowflake/config.toml` | TOML | Modern setups, multiple profiles |
| `connections.toml` | `~/.snowflake/connections.toml` | TOML | Alternate name, same format |
| `config` (SnowSQL) | `~/.snowsql/config` | INI | Legacy setups, SnowSQL users |
| Environment Variables | Shell/session | `SNOWFLAKE_*` | CI/CD, containers, temporary overrides |

## config.toml / connections.toml (Recommended)

The modern, recommended approach. Supports multiple named profiles. Both file names work the same way.

**Location:** `~/.snowflake/config.toml` or `~/.snowflake/connections.toml`

**Example:**
```toml
[default]
account = "myorg-myaccount"
user = "JSMITH"
authenticator = "externalbrowser"
warehouse = "COMPUTE_WH"
database = "MY_DB"
schema = "PUBLIC"

[dev]
account = "myorg-dev"
user = "DEV_USER"
password = "..." # Or use PAT token
warehouse = "DEV_WH"
```

**Switch profiles:**
```bash
snow connection set dev
```

## config (SnowSQL Legacy)

Older INI-style format used by SnowSQL CLI.

**Location:** `~/.snowsql/config`

**Example:**
```ini
[connections]
accountname = myorg-myaccount
username = JSMITH
password = ...

[connections.dev]
accountname = myorg-dev
username = DEV_USER
```

## Environment Variables

Override any config file setting. Useful for CI/CD and containers.

**Common variables:**
- `SNOWFLAKE_ACCOUNT`
- `SNOWFLAKE_USER`
- `SNOWFLAKE_PASSWORD`
- `SNOWFLAKE_AUTHENTICATOR`
- `SNOWFLAKE_WAREHOUSE`
- `SNOWFLAKE_DATABASE`
- `SNOWFLAKE_SCHEMA`
- `SNOWFLAKE_ROLE`

**Precedence:** Environment variables > config files

## Which Should I Use?

**Use `config.toml` or `connections.toml` if:**
- Starting fresh
- Need multiple profiles
- Using modern Snowflake CLI (`snow`)

**Use `config` if:**
- Already have it working
- Primarily use SnowSQL
- Legacy scripts depend on it

**Use Environment Variables if:**
- Running in CI/CD
- Container deployments
- Need temporary overrides

## Migration Path

If you have `~/.snowsql/config` and want to migrate to `config.toml`:

1. Keep both files (they don't conflict)
2. Create `~/.snowflake/config.toml` with your profiles
3. Test new config: `snow connection test`
4. Gradually update scripts to use new format
