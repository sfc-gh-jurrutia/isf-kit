---
name: publish-skill
description: "Publish a skill through a release gate: audit, tag, approve, deploy. Use when: publishing skills, deploying skills, releasing skills. Triggers: publish skill, deploy skill, release skill."
parent_skill: skill-development
---

# Publish Skill

Release gate for deploying skills. The skill must be publish-ready before entering this flow.

## Workflow

```
Identify Skill
       ↓
Audit (mandatory, must pass)
       ↓
Tag Version + Update Metadata
       ↓
Approve? _____
    |        |
   Yes      No → STOP (fix issues, re-enter)
    |
    ↓
Deploy (copy to target + git commit/tag)
```

### Step 1: Identify Skill

Ask for skill path or name. Search skills directories if name provided.

Parse: frontmatter, sections, file count, line count.

Present:
```
Skill: <name>
Path: <path>
Files: <count>
Lines: <total>

Is this the skill to publish?
```

**⚠️ STOP**: Confirm correct skill loaded.

### Step 2: Audit (Mandatory)

**Load** `audit-skill/SKILL.md` and run full audit against the skill.

Do NOT load `SKILL_BEST_PRACTICES.md` — too large for context. Use audit-skill's condensed checklist.

**If zero critical (🔴) findings:** proceed to Step 3.

**If critical findings exist:** pipeline STOPS. Present:

```
# Publish Blocked: <skill-name>

Status: FAILED (audit)
Critical issues: <count>

## Required Fixes
1. [Category]: [Issue] → [Specific suggestion to pass checklist]
2. ...

Fix these issues and re-run: "publish skill"
```

Suggestions must map to audit-skill checklist categories: **Frontmatter**, **Structure**, **Workflow**, **Tools**.

**⚠️ STOP**: If critical issues exist, pipeline ends here. Do NOT proceed.

### Step 3: Tag Version + Update Metadata

Ask user:
```
Version for this release?
1. Provide version (e.g., 1.0.0)
2. Auto-increment from last tag
```

Verify frontmatter metadata is complete:
- `name`: present, kebab-case
- `description`: includes purpose + triggers

Present:
```
Version: <version>
Name: <skill-name>
Description: <first 80 chars>...
Git tag: <skill-name>-v<version>
```

**⚠️ STOP**: Confirm version and metadata.

### Step 4: Approve

Present full publish summary:
```
# Publish Summary: <skill-name>

Version: <version>
Audit: PASSED (🔴 0 | 🟡 <n> | 🟢 <n>)
Target: <deploy-path>
Git tag: <skill-name>-v<version>

Approve publish? (Yes/No)
```

**If No:** STOP. User fixes issues outside this flow and re-enters fresh.

**If Yes:** Proceed to Step 5.

**⚠️ STOP**: Wait for explicit approval. NEVER proceed without it.

### Step 5: Deploy

1. **Copy** skill to target directory:
   ```bash
   cp -r <source-path> <target-path>/<skill-name>/
   ```

2. **Git commit:**
   ```bash
   git add <target-path>/<skill-name>/
   git commit -m "publish: <skill-name> v<version>"
   ```

3. **Git tag:**
   ```bash
   git tag <skill-name>-v<version>
   ```

4. **Present confirmation:**

```
# Publish Complete: <skill-name>

Status: APPROVED
Version: <version>
Timestamp: <ISO-8601>
Deployed to: <target-path>
Git tag: <skill-name>-v<version>
```

## Stopping Points

- ✋ Step 1: Confirm skill loaded
- ✋ Step 2: If audit fails, pipeline stops entirely
- ✋ Step 3: Confirm version + metadata
- ✋ Step 4: Approve before deploy

## Output

Published skill at target location with git commit and version tag.
