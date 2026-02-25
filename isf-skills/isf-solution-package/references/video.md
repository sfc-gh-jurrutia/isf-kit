# Viral Video Guide

## Purpose

Condenses entire narrative into **60-120 seconds** for social distribution.

## Structure

| Section | Time | Content |
|---------|------|---------|
| Hook | 0-10s | One shocking statistic |
| Stakes | 10-30s | Cost of inaction |
| Solution | 30-70s | How it works + Snowflake value |
| CTA | 70-90s | Single clear action |

## The 80/20 Rule

From your full solution package, extract ONLY:

- **One statistic** that creates urgency
- **One technical insight** showing Snowflake's unique value
- **One call to action** that converts interest

Everything else is cut.

## Platform Specifications

| Platform | Length | Aspect | Captions |
|----------|--------|--------|----------|
| LinkedIn | 60-90s | 16:9 or 1:1 | Separate .srt |
| YouTube Shorts | 60s max | 9:16 | Burn-in |
| Twitter/X | 60-120s | 16:9 | Burn-in |
| Internal | 90-120s | 16:9 | Optional |

## Script Template

```
HOOK (0-10s):
"[Shocking statistic] — [consequence]."

STAKES (10-30s):
"[Industry context]. [Cost of inaction]. [Without X, companies face Y]."

SOLUTION (30-70s):
"[Solution name] uses Snowflake to [core action].
Here's how it works:
1. [Data ingestion]
2. [Processing/ML]
3. [Insight delivery]

[Snowflake differentiator]."

CTA (70-90s):
"[Clear action]. [Link/resource]. [Snowflake branding]."
```

## Production Checklist

- [ ] Hook captures attention in 3 seconds
- [ ] Single clear message (viewer can state takeaway)
- [ ] Captions complete and accurate
- [ ] Snowflake Blue present, logo in CTA
- [ ] CTA destination tested and working

---

## TTS-Optimized Narration Block

**ALWAYS append this section** at the end of every video script markdown file.

This version is optimized for AI Text-to-Speech synthesis (ElevenLabs, etc.) following best practices:

### TTS Optimization Guidelines

1. **Audio Tags**: Use `[emotion]` tags for delivery cues (e.g., `[curious]`, `[excited]`, `[thoughtful]`)
2. **Pauses**: Use ellipses (…) for natural pauses, not SSML break tags
3. **Emphasis**: Use CAPS for stressed words
4. **Numbers**: Spell out fully (e.g., "three hundred thirty-nine" not "339")
5. **Abbreviations**: Expand fully (e.g., "Tier two" not "T2")
6. **Pacing**: Add `[sighs]`, `[short pause]`, or `[long pause]` for rhythm
7. **No Sound Effects**: Tags like `[music]` or `[gunshot]` are voice-only

### TTS Block Template

```markdown
---

## TTS-Ready Narration

> Copy this block directly into ElevenLabs or similar TTS service.
> Voice recommendation: Professional, confident tone. Stability: Natural setting.

[curious] What if you could see a crisis coming… three months before it happens?

[thoughtful] Most companies think they have diversity. They see fifty vendors across fifteen categories. [short pause] But underneath?

[concerned] Hidden dependencies. Shared suppliers. Concentration risks that don't show up… until it's too late.

[confident] The problem isn't your data. [emphatic] It's how you're LOOKING at it.

[excited] Spreadsheets see suppliers. Graph Neural Networks see the NETWORK.

[building] Now imagine knowing which suppliers are truly critical. Where your single points of failure hide. How a disruption cascades to YOUR production line.

[emphatic] Not after the crisis. BEFORE.

[confident] Three hundred thirty-nine hidden relationships discovered. Risk assessment seventy-five percent faster. Bottlenecks automatically ranked.

[warm] All running on Snowflake. Your data never moves. Your insights multiply.

[urgent] The next disruption is forming somewhere in your blind spot. [short pause] Will you see it coming?

[resolute] N-tier visibility. It's not the future. [pause] It's available NOW.
```

### Voice Settings Recommendations

| Setting | Value | Notes |
|---------|-------|-------|
| Model | Eleven v3 or Multilingual v2 | Best for audio tags |
| Stability | Natural (middle) | Balances expression and consistency |
| Speed | 1.0 (default) | Adjust only if needed |
| Voice Type | Professional narrator | Clear diction, tech experience |

