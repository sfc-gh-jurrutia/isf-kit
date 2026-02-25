# render-reactflow-no-transform

## Rule

NEVER use `transform` in React Flow node styles. React Flow uses CSS `transform: translate(x, y)` internally to position nodes. Setting `transform` in node style overrides this positioning, causing all nodes to render at (0,0).

## Why It Matters

React Flow positions nodes by applying `transform: translate(x, y)` to each node's DOM element based on the `position` property in node data. When you override `transform` with your own value (e.g., `transform: 'scale(1.1)'`), you completely replace React Flow's positioning, making all nodes stack at the origin.

This bug is particularly confusing because:
- Edges render correctly (they use position data directly, not CSS transform)
- MiniMap renders correctly (also uses position data directly)
- The position data is correct in React DevTools
- Only the visual node positions are wrong

## Incorrect

```tsx
const styledNodes = useMemo(() => {
  return nodes.map(node => ({
    ...node,
    style: {
      ...node.style,
      opacity: 1,
      transform: isHighlighted ? 'scale(1.1)' : 'scale(1)',  // BREAKS POSITIONING
      transition: 'all 0.3s ease-out'
    }
  }))
}, [nodes, highlightedIds])
```

## Correct

```tsx
const styledNodes = useMemo(() => {
  return nodes.map(node => ({
    ...node,
    style: {
      ...node.style,
      opacity: 1,
      transition: 'all 0.3s ease-out'
    },
    className: isHighlighted ? 'scale-110' : '',  // Use Tailwind class instead
    data: {
      ...node.data,
      highlighted: isHighlighted  // Or pass to custom node for internal scaling
    }
  }))
}, [nodes, highlightedIds])
```

## Alternative: Scale Inside Custom Node

```tsx
function CustomNode({ data }: NodeProps) {
  return (
    <div className={`node-content ${data.highlighted ? 'scale-110' : ''} transition-transform`}>
      {data.label}
    </div>
  )
}
```

## Debugging Tips

If nodes cluster at (0,0) but edges render correctly:
1. Search for `transform:` or `transform =` in your React Flow components
2. Check useMemo/useCallback hooks that modify node styles
3. Verify positions in console: `console.log(nodes.map(n => n.position))`
4. If positions are correct but nodes still cluster, it's a CSS transform override

## Related Issues

- Box shadows on nodes: Use filter drop-shadow instead of box-shadow for better performance
- Node z-index: Use React Flow's `zIndex` property, not CSS z-index
- Node visibility: Use `hidden: true` property, not `display: none`
