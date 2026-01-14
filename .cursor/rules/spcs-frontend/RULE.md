---
description: Next.js static export constraints for SPCS deployment
globs: ["frontend/**/*.tsx", "frontend/**/*.ts", "frontend/next.config.js", "frontend/next.config.mjs"]
---

# SPCS Frontend Rules (Next.js Static Export)

This rule enforces constraints for the Next.js frontend deployed as a static export in Snowpark Container Services (SPCS).

## Critical: Static Export Configuration

The frontend MUST be a static export served by NGINX. Next.js server features are NOT available.

### Required `next.config.js` Settings

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // REQUIRED: Static export for SPCS
  output: 'export',
  
  // REQUIRED: Disable image optimization (Snowflake CSP blocks external services)
  images: {
    unoptimized: true,
  },
  
  // REQUIRED: Trailing slashes for static file routing
  trailingSlash: true,
  
  // RECOMMENDED: Strict mode for React
  reactStrictMode: true,
};

module.exports = nextConfig;
```

## Forbidden Patterns

### ❌ FORBIDDEN: API Routes

Do NOT create any files in `/app/api/` or `/pages/api/`. All API logic lives in FastAPI.

```
frontend/
├── app/
│   ├── api/          ← DO NOT CREATE THIS DIRECTORY
│   │   └── *.ts      ← FORBIDDEN
│   └── page.tsx      ← OK
```

### ❌ FORBIDDEN: Server Actions

Do NOT use the `"use server"` directive. There is no server.

```typescript
// BAD - Server Actions don't work in static export
"use server"
export async function submitForm(data: FormData) {
  // This will NOT work
}
```

### ❌ FORBIDDEN: getServerSideProps / getStaticProps (Pages Router)

If using Pages Router, do NOT use SSR functions:

```typescript
// BAD - SSR doesn't work in static export
export async function getServerSideProps() {
  return { props: {} }
}
```

### ❌ FORBIDDEN: Dynamic Server Components

Do NOT use dynamic rendering or server-only features:

```typescript
// BAD - These don't work in static export
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation' // server-side redirect

export default async function Page() {
  const cookieStore = cookies()  // FORBIDDEN
  const headersList = headers()  // FORBIDDEN
}
```

## Required Patterns

### ✅ REQUIRED: Client-Side Data Fetching

Use React Query (TanStack Query) or SWR for all data fetching:

```typescript
// frontend/hooks/useUsers.ts
"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface IUser {
  id: string
  name: string
  email: string
}

export function useUsers() {
  return useQuery<IUser[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Omit<IUser, 'id'>) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create user')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
```

### ✅ REQUIRED: Relative API Paths

ALL API calls MUST use relative paths. NGINX routes `/api/*` to FastAPI.

```typescript
// CORRECT - Relative path through NGINX
const response = await fetch('/api/users')

// WRONG - Absolute URL bypasses NGINX routing
const response = await fetch('http://backend:8000/api/users')
```

### ✅ REQUIRED: Client Components for Interactivity

Mark interactive components with `"use client"`:

```typescript
// frontend/components/UserForm.tsx
"use client"

import { useState } from 'react'
import { useCreateUser } from '@/hooks/useUsers'

interface UserFormProps {
  onSuccess?: () => void
}

export function UserForm({ onSuccess }: UserFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const createUser = useCreateUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createUser.mutateAsync({ name, email })
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  )
}
```

## TypeScript Constraints

### Strict Typing Required

- Enable `strict: true` in `tsconfig.json`
- Do NOT use `any` type
- Do NOT use `@ts-ignore` or `@ts-expect-error` without justification

### Interface Naming Convention

Use one of these patterns for interface names:

```typescript
// Pattern 1: I-prefix for data interfaces
interface IUser {
  id: string
  name: string
}

interface IApiResponse<T> {
  data: T
  error?: string
}

// Pattern 2: Props suffix for component props
interface ButtonProps {
  variant: 'primary' | 'secondary'
  onClick: () => void
  children: React.ReactNode
}

interface UserCardProps {
  user: IUser
  onEdit?: (user: IUser) => void
}
```

### Type-Safe API Calls

```typescript
// frontend/lib/api.ts
interface IApiError {
  message: string
  code: string
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error: IApiError = await response.json()
    throw new Error(error.message)
  }

  return response.json()
}

// Usage
const users = await fetchApi<IUser[]>('/users')
```

## Image Handling

Since `images.unoptimized: true` is required, handle images carefully:

```typescript
// CORRECT - Using unoptimized Next.js Image
import Image from 'next/image'

export function Avatar({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={48}
      height={48}
      unoptimized  // Explicit, though globally set
    />
  )
}

// ALSO OK - Standard img tag
export function Logo() {
  return <img src="/logo.png" alt="Logo" width={120} height={40} />
}
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout (can be server component)
│   ├── page.tsx            # Home page
│   ├── providers.tsx       # Client-side providers ("use client")
│   └── (routes)/
│       └── dashboard/
│           └── page.tsx
├── components/
│   ├── ui/                 # Reusable UI components
│   └── features/           # Feature-specific components
├── hooks/
│   └── use*.ts             # Custom hooks (data fetching, state)
├── lib/
│   └── api.ts              # API utilities
├── types/
│   └── index.ts            # Shared TypeScript interfaces
├── next.config.js          # MUST have output: 'export'
└── tsconfig.json           # MUST have strict: true
```

## Environment Variables

Client-side environment variables MUST be prefixed with `NEXT_PUBLIC_`:

```typescript
// .env.local
NEXT_PUBLIC_APP_NAME=MyApp
NEXT_PUBLIC_API_VERSION=v1

// Usage in code
const appName = process.env.NEXT_PUBLIC_APP_NAME
```

**NEVER** expose secrets in `NEXT_PUBLIC_*` variables - they are bundled into the client.
