---
title: Icon Buttons Need aria-label
impact: MEDIUM
impactDescription: Required for screen reader users
tags: accessibility, aria, buttons, icons
---

## Icon Buttons Need aria-label

Every button containing only an icon must have an accessible name via `aria-label`.

**Why it matters**: Screen readers announce buttons by their text content. An icon-only button has no text, so users hear "button" with no indication of its purpose. This violates WCAG 2.1 Success Criterion 4.1.2.

**Incorrect (no accessible name):**

```tsx
<button onClick={onSend} className="btn-primary">
  <Send size={18} />
</button>
// Screen reader announces: "button"

<button onClick={toggleSidebar}>
  {isOpen ? <X size={18} /> : <Menu size={18} />}
</button>
// Screen reader announces: "button"
```

**Correct (with aria-label):**

```tsx
<button 
  onClick={onSend} 
  className="btn-primary"
  aria-label="Send message"
>
  <Send size={18} aria-hidden="true" />
</button>
// Screen reader announces: "Send message, button"

<button 
  onClick={toggleSidebar}
  aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
  aria-expanded={isOpen}
>
  {isOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
</button>
// Screen reader announces: "Close sidebar, button, expanded"
```

**Best practices:**

1. Use `aria-label` for the accessible name
2. Add `aria-hidden="true"` to the icon (it's decorative)
3. For toggle buttons, reflect the current state in the label
4. Use `aria-expanded` for expandable controls
5. Keep labels action-oriented: "Send message" not "Send icon"

**Common patterns:**

```tsx
// Icon button with tooltip (both visual and accessible)
<button 
  aria-label="Delete item"
  title="Delete item"  // Visual tooltip
>
  <Trash size={16} aria-hidden="true" />
</button>

// Icon button in a list (identify the target)
<button 
  aria-label={`Edit ${item.name}`}
>
  <Pencil size={16} aria-hidden="true" />
</button>

// Loading state
<button 
  aria-label="Send message"
  aria-busy={isLoading}
  disabled={isLoading}
>
  {isLoading ? <Spinner aria-hidden="true" /> : <Send aria-hidden="true" />}
</button>
```

**Testing**: Use browser devtools Accessibility tab or run Lighthouse to find buttons missing accessible names.
