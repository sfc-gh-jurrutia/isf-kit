# Architecture Diagram Guide

## Purpose

Translates the solution narrative into **deployable technical patterns**. Answers "How would we actually implement this?"

## Pattern Selection

| Pattern | Use When | Emphasis |
|---------|----------|----------|
| **Left-to-Right** | Most solutions | Data journey from sources to outcomes |
| **Hub-and-Spoke** | Data mesh/multi-BU | Data product ownership |
| **App-Centric** | App-focused | End-user experience |
| **Data Journey** | Governance emphasis | Lineage and trust |

## Detail Levels

| Level | Audience | Content |
|-------|----------|---------|
| L1 | Executives | High-level components, 5-7 boxes |
| L2 | Architects | Service layers, integration points |
| L3 | Engineers | Detailed implementation patterns |

## Required Elements

### Data Flow
- Source systems (left side)
- Processing layers (center)
- Outputs/consumers (right side)

### Annotations
- What data flows
- How often (real-time, hourly, daily)
- Volume indicators

### Snowflake Components
- Stages, Streams, Tasks
- Snowpark, ML Functions
- Data Sharing, Marketplace

## Design Rules

1. **Left-to-right flow**: Sources → Processing → Outcomes
2. **Labeled arrows**: "What" and "how often"
3. **Appropriate abstraction**: Match audience level
4. **Real system names**: Use customer's actual systems

## Quality Checkpoint

- [ ] Diagram follows left-to-right source→outcome flow
- [ ] All components from walkthrough are represented
- [ ] Arrows labeled with "what" and "how often"
- [ ] Snowflake capabilities named at appropriate abstraction
- [ ] Customer-specific systems noted (if account-specific)

