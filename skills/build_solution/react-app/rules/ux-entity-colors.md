# Rule: Consistent Entity Colors Across UI

## Impact: MEDIUM - Important for data visualization clarity

## Pattern

Define colors globally and reuse across selection UI and charts:

```tsx
// colors.ts
export const ENTITY_COLORS: Record<string, string> = {
  'Entity-A': '#3b82f6',   // Blue
  'Entity-B': '#10b981',   // Green
  'Entity-C': '#f59e0b',   // Amber
  'Entity-D': '#ef4444',   // Red
  'Entity-E': '#8b5cf6',   // Purple
  'Entity-F': '#06b6d4',   // Cyan
  'Entity-G': '#f97316',   // Orange
  'Entity-H': '#ec4899',   // Pink
}

// Fallback for unknown entities
export function getEntityColor(name: string): string {
  return ENTITY_COLORS[name] || '#3b82f6'
}
```

## Selection Chips

```tsx
{entities.map(entity => (
  <button
    key={entity.name}
    onClick={() => toggleEntity(entity.name)}
    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
      selected.includes(entity.name)
        ? 'text-white shadow-lg'
        : 'bg-gray-100 text-gray-600'
    }`}
    style={{
      backgroundColor: selected.includes(entity.name)
        ? ENTITY_COLORS[entity.name]
        : undefined,
      boxShadow: selected.includes(entity.name)
        ? `0 0 12px ${ENTITY_COLORS[entity.name]}40`
        : undefined,
    }}
  >
    {entity.name}
  </button>
))}
```

## Chart Lines

```tsx
<LineChart data={chartData}>
  {selectedEntities.map(name => (
    <Line
      key={name}
      dataKey={name}
      stroke={ENTITY_COLORS[name]}
      strokeWidth={2}
      dot={false}
    />
  ))}
</LineChart>
```

## Table Rows

```tsx
<tr key={entity.name}>
  <td>
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: ENTITY_COLORS[entity.name] }}
      />
      <span style={{ color: ENTITY_COLORS[entity.name] }}>
        {entity.name}
      </span>
    </div>
  </td>
</tr>
```

## Why

- Visual consistency helps users track entities across views
- Color coding provides immediate recognition
- Glow effects on selection reinforce active state
- Single source of truth prevents color drift
