---
name: activate-kit
description: "Entry point for isf-kit. Discover available skills and get started. Use for: first time using repo, exploring capabilities, main menu. Triggers: activate, get started, help, what can I do, what can you do, menu, home, start"
---

# Activate Kit - Entry Point

> Discover what's available in isf-kit and get started

## When to Use

- User just cloned the repo
- User wants to see what's available
- User is unsure where to start

## Workflow

### Step 1: Welcome

```
## Welcome to isf-kit

A skill and spec-driven solution generator for Snowflake demos.

What would you like to do?

1. **Onboard** - NEW-USER setup (connection discovery & configuration)
2. **Specify** - Create a new demo specification
3. **Skill Development** - Create or audit Cortex Code skills
4. **Switch Connection** - Change active Snowflake profile
5. **Something else** - Describe what you need

[1/2/3/4/5]
```

**⚠️ MANDATORY STOPPING POINT**: Wait for user selection.

### Step 2: Route to Selected Skill

| Selection | Action |
|-----------|--------|
| 1. Onboard | **Load** `onboarding/SKILL.md` |
| 2. Specify | **Load** `specify/SKILL.md` |
| 3. Skill Development | **Load** `skill-development/SKILL.md` |
| 4. Switch Connection | **Load** `switch-connection/SKILL.md` |
| 5. Something else | **Ask** user to describe their need, then assist or route accordingly |

## Direct Access

Users can skip this menu and invoke any skill directly:

- `/onboarding` - First-time setup
- `/specify` - Create demo spec
- `/skill-development` - Create/audit skills
- `/switch-connection` - Change Snowflake profile

## Stopping Points

- ✋ After presenting menu (wait for user selection)

## Output

After routing, the selected skill takes over. No further action from this skill.
