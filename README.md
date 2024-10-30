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
