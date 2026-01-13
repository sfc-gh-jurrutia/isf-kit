# snowflake-project-template

This project serves as a boilerplate template for creating new projects within GitLab. It is designed to streamline the setup process and ensure consistency across projects.

## Overview

It contains certain security specific configuration files
- **.gitlab/repo_meta.yaml**: This file is used for project tagging and is a mandatory file to be present in each GitLab project. Project maintainers are supposed to properly edit this file following this [guideline](https://snowflakecomputing.atlassian.net/wiki/spaces/EEA/pages/3757867124/GitLab+Project+Tagging+Guideline) after creating a new project
- **.pre-commit-config.yaml**: Configuration for managing pre-commit hooks to maintain code quality.
- **CODEOWNERS**: A file to define code ownership and streamline code review processes. This file is required for a GitLab production project, and optional for a non-production project, hence can be deleted. For production projects, follow this [guideline](https://docs.gitlab.com/ee/user/project/codeowners/) to have proper content in the CODEOWNERS file.
- **.gitignore**: A standard ignore file to prevent unnecessary files from being tracked in the repository.

## Contributing

If you have suggestions or improvements for this template, please feel free to submit a merge request.
# Snowflake Development Environment

Onboarding setup for Snowflake development tools in Cursor IDE.

## What's Included

**After running the setup script**, you get:
- **MCP Server** - Query Snowflake directly from chat (**global** - works in any project)
- **SnowSQL** - Command-line interface for Snowflake

**When you open this project in Cursor**, you also get:
- **Team Rules** - Snowflake development standards (project-level)
- **Cursor Commands** - Development workflow helpers (project-level)

## Prerequisites

- [ ] **Homebrew** (macOS)
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```
- [ ] **Snowflake account access**
- [ ] **Programmatic Access Token (PAT)** from Snowflake

## Quick Start

```bash
./scripts/setup-snowflake-mcp.sh
```

This will install and configure:
- **Global MCP** - `~/.cursor/mcp.json` (works in any project)
- **uv** - Python package manager for MCP server
- **SnowSQL** - Snowflake command-line interface
- **Credentials** - Connection configs for both tools

After running the script, **restart Cursor** and you can use Snowflake MCP in **any directory**.

## Documentation

See [docs/mcp-snowflake-setup.md](docs/mcp-snowflake-setup.md) for detailed setup instructions.

## Environment Switching

| Environment | MCP (Cursor) | SnowSQL |
|-------------|--------------|---------|
| Development | `snowflake-default` | `snowsql -c default` |
| Staging | `snowflake-staging` | `snowsql -c staging` |
| Production | `snowflake-prod` | `snowsql -c prod` |
