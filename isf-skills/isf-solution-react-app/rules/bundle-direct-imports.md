---
title: Direct Icon Imports
impact: CRITICAL
impactDescription: 200-800ms import cost reduction
tags: bundle, imports, tree-shaking, icons, lucide
---

## Direct Icon Imports

Import icons directly from their source files instead of barrel exports to avoid loading thousands of unused modules.

**Why it matters**: Icon libraries like lucide-react have 1,500+ icons. Barrel imports (`from 'lucide-react'`) force the bundler to load all of them, adding 200-800ms to cold starts and significantly slowing development HMR.

**Incorrect (imports entire library):**

```tsx
import { Send, Bot, User, Menu, X, Sparkles } from 'lucide-react'
// Loads 1,583 modules (~2.8s in dev)
// Bundle impact: ~1MB before tree-shaking
```

**Correct (direct imports):**

```tsx
import Send from 'lucide-react/dist/esm/icons/send'
import Bot from 'lucide-react/dist/esm/icons/bot'
import User from 'lucide-react/dist/esm/icons/user'
import Menu from 'lucide-react/dist/esm/icons/menu'
import X from 'lucide-react/dist/esm/icons/x'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles'
// Loads only 6 modules (~2KB)
```

**Helper for consistent imports:**

Create `src/components/icons.ts`:
```tsx
export { default as Send } from 'lucide-react/dist/esm/icons/send'
export { default as Bot } from 'lucide-react/dist/esm/icons/bot'
export { default as User } from 'lucide-react/dist/esm/icons/user'
export { default as Menu } from 'lucide-react/dist/esm/icons/menu'
export { default as X } from 'lucide-react/dist/esm/icons/x'
export { default as Sparkles } from 'lucide-react/dist/esm/icons/sparkles'
// Add icons as needed
```

Then import from your helper:
```tsx
import { Send, Bot, User } from '../components/icons'
```

**Impact**: 15-70% faster dev boot, 28% faster builds, 40% faster cold starts.

**Also applies to**: `@mui/icons-material`, `@tabler/icons-react`, `react-icons`, `@heroicons/react`
