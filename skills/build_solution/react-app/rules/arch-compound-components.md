---
title: Compound Components Over Boolean Props
impact: HIGH
impactDescription: Improved maintainability, API flexibility
tags: architecture, composition, props, patterns
---

## Compound Components Over Boolean Props

Structure complex components with shared context instead of adding boolean props to customize behavior.

**Why it matters**: Boolean props lead to exponential complexity. With 5 boolean props, you have 32 possible combinations to test and maintain. Compound components scale linearly and make the API self-documenting.

**Incorrect (boolean prop explosion):**

```tsx
<DataTable 
  data={data}
  showPagination
  showSearch
  showFilters
  showExport
  showColumnToggle
  stickyHeader
  stripedRows
  highlightOnHover
  // 256 possible combinations!
/>
```

**Correct (compound components):**

```tsx
<DataTable data={data}>
  <DataTable.Toolbar>
    <DataTable.Search />
    <DataTable.Filters />
    <DataTable.ColumnToggle />
    <DataTable.Export />
  </DataTable.Toolbar>
  
  <DataTable.Content stickyHeader>
    <DataTable.Head />
    <DataTable.Body striped highlightOnHover />
  </DataTable.Content>
  
  <DataTable.Pagination />
</DataTable>
```

**Implementation pattern:**

```tsx
import { createContext, useContext, ReactNode } from 'react'

interface DataTableContextValue {
  data: any[]
  columns: Column[]
  selectedRows: Set<string>
  onSelectRow: (id: string) => void
}

const DataTableContext = createContext<DataTableContextValue | null>(null)

function useDataTable() {
  const ctx = useContext(DataTableContext)
  if (!ctx) throw new Error('Must be used within DataTable')
  return ctx
}

function DataTable({ data, children }: { data: any[]; children: ReactNode }) {
  const [selectedRows, setSelectedRows] = useState(new Set<string>())
  
  return (
    <DataTableContext.Provider value={{ data, selectedRows, onSelectRow: ... }}>
      <div className="card">{children}</div>
    </DataTableContext.Provider>
  )
}

DataTable.Toolbar = function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex gap-2 p-4 border-b">{children}</div>
}

DataTable.Search = function Search() {
  const { data } = useDataTable()
  // Implementation using context
}

DataTable.Pagination = function Pagination() {
  const { data } = useDataTable()
  // Implementation using context
}

export { DataTable }
```

**Benefits**:
- Self-documenting API
- Flexible composition
- Better tree-shaking (unused sub-components are removed)
- Easier testing (test each piece independently)
