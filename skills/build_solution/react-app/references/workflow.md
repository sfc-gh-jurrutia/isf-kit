# Scaffold Workflow

Complete step-by-step workflow for creating a React+FastAPI application from Snowflake data.

## Step 1: Gather Requirements

Ask the user these questions using `ask_user_question`:

1. **Project Name**: What should the project be called? (kebab-case)
2. **Data Source**: What Snowflake database/schema contains the data?
3. **Features**: Which features are needed?
   - Chat interface (Cortex-powered)
   - Data visualizations (charts/tables)
   - Real-time updates (WebSocket)
   - Landing page
4. **Pages**: What main views/pages are needed? (e.g., Dashboard, Overview, Search)
5. **Existing Project**: Is there a Streamlit app or other reference to base this on?

## Step 2: Analyze Source Project (if applicable)

If converting from Streamlit or another project:

1. Read the existing Streamlit pages to understand:
   - Data queries and transformations
   - Visualization types used
   - User interactions/filters
   - Theme/color scheme

2. Identify Snowflake objects:
   - Tables and views being queried
   - Cortex Search services
   - Semantic models for Cortex Analyst
   - Stored procedures or UDFs

3. Map Streamlit components to React equivalents:
   - `st.metric` → MetricCard component
   - `st.plotly_chart` → Recharts component
   - `st.dataframe` → Table component
   - `st.sidebar` → Layout sidebar
   - `st.chat_input` → Chat component

## Step 3: Create Frontend Scaffold

### 3.1 Initialize Project

```bash
cd <project_dir>
mkdir -p frontend && cd frontend
npm create vite@latest . -- --template react-ts
npm install react-router-dom recharts clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer @types/react @types/react-dom
npx tailwindcss init -p
```

**IMPORTANT**: Install icons with direct imports pattern:
```bash
npm install lucide-react
# Then import directly: import Check from 'lucide-react/dist/esm/icons/check'
```

### 3.2 Configure Tailwind (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        accent: {
          blue: '#3b82f6',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          cyan: '#06b6d4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

### 3.3 Global Styles (src/styles/globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    color-scheme: dark;
  }
  body {
    @apply bg-navy-900 text-slate-200 font-sans antialiased;
  }
}

@layer components {
  .card {
    @apply bg-navy-800/80 backdrop-blur border border-navy-700/50 rounded-xl p-6;
  }
  
  .card-glow:hover {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
  }
  
  .btn-primary {
    @apply bg-gradient-to-r from-accent-blue to-cyan-500 
           text-white font-medium px-4 py-2 rounded-lg 
           hover:shadow-lg hover:shadow-accent-blue/30
           active:scale-95 transition-all;
  }
}

@layer utilities {
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
  
  @keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3.4 Layout Component (src/components/Layout.tsx)

```tsx
import { ReactNode, useState, memo } from 'react'
import Menu from 'lucide-react/dist/esm/icons/menu'
import X from 'lucide-react/dist/esm/icons/x'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  description: string
}

interface LayoutProps {
  children: ReactNode
  currentPage: string
  onNavigate: (page: string) => void
  navItems: NavItem[]
  appName: string
}

const NavButton = memo(function NavButton({ 
  item, 
  isActive, 
  onClick, 
  showLabel 
}: { 
  item: NavItem
  isActive: boolean
  onClick: () => void
  showLabel: boolean
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      aria-label={item.description}
      aria-current={isActive ? 'page' : undefined}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all
        focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:outline-none
        ${isActive ? 'bg-accent-blue/10 text-accent-blue' : 'text-slate-400 hover:bg-navy-700/50'}`}
    >
      <Icon size={18} />
      {showLabel && <span className="text-sm">{item.label}</span>}
    </button>
  )
})

export function Layout({ children, currentPage, onNavigate, navItems, appName }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-navy-900 flex">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-accent-blue focus:text-white focus:z-50">
        Skip to main content
      </a>
      
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-navy-800/50 border-r border-navy-700/50 flex flex-col transition-all`}>
        <div className="p-4 border-b border-navy-700/50 flex items-center justify-between">
          {sidebarOpen && <h1 className="font-bold text-slate-200">{appName}</h1>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-lg hover:bg-navy-700 focus-visible:ring-2 focus-visible:ring-accent-blue"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-1" role="navigation" aria-label="Main">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={currentPage === item.id}
              onClick={() => onNavigate(item.id)}
              showLabel={sidebarOpen}
            />
          ))}
        </nav>
      </aside>
      
      <main id="main-content" className="flex-1 overflow-auto" role="main">
        {children}
      </main>
    </div>
  )
}
```

### 3.5 Metric Card Component (src/components/MetricCard.tsx)

```tsx
import { memo } from 'react'
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up'
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down'
import Minus from 'lucide-react/dist/esm/icons/minus'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export const MetricCard = memo(function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  trendValue 
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-accent-green' : trend === 'down' ? 'text-accent-red' : 'text-slate-400'

  return (
    <article className="card card-glow">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-400 truncate">{title}</p>
          <p className="text-2xl font-semibold text-accent-blue tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trendColor}`} aria-label={`Trend: ${trend}`}>
            <TrendIcon size={16} aria-hidden="true" />
            {trendValue && <span className="text-sm tabular-nums">{trendValue}</span>}
          </div>
        )}
      </div>
    </article>
  )
})
```

## Step 4: Create Backend

### 4.1 Initialize Backend

```bash
cd <project_dir>
mkdir -p backend/api backend/services backend/config
cd backend
cat > requirements.txt << 'EOF'
fastapi>=0.100.0
uvicorn>=0.23.0
snowflake-connector-python>=3.0.0
pydantic>=2.0.0
httpx>=0.25.0
EOF
```

### 4.2 Main API (backend/api/main.py)

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

from services.snowflake_service import get_snowflake_service, close_snowflake_service

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize connection pool
    get_snowflake_service()
    yield
    # Shutdown: close connections
    close_snowflake_service()

app = FastAPI(title="<APP_NAME> API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    sources: List[str] = []

@app.get("/")
async def health():
    return {"status": "healthy"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    # Implement chat logic with Cortex
    return ChatResponse(response="Response here", sources=[])

@app.get("/api/data")
async def get_data():
    service = get_snowflake_service()
    try:
        data = service.execute_query("SELECT * FROM table LIMIT 100", timeout=30)
        return {"data": data}
    except Exception as e:
        logger.error(f"Query failed: {e}")
        raise HTTPException(status_code=500, detail="Query failed")
```

### 4.3 Snowflake Service with Connection Pool (backend/services/snowflake_service.py)

```python
import os
import snowflake.connector
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

class SnowflakeService:
    def __init__(self):
        self.connection_name = os.getenv("SNOWFLAKE_CONNECTION_NAME", "demo")
        self.database = os.getenv("SNOWFLAKE_DATABASE", "<DATABASE>")
        self.schema = os.getenv("SNOWFLAKE_SCHEMA", "<SCHEMA>")
        self._connection: Optional[snowflake.connector.SnowflakeConnection] = None
    
    def _get_connection(self) -> snowflake.connector.SnowflakeConnection:
        if self._connection is None or self._connection.is_closed():
            self._connection = snowflake.connector.connect(
                connection_name=self.connection_name,
                database=self.database,
                schema=self.schema,
            )
        return self._connection
    
    def close(self):
        if self._connection and not self._connection.is_closed():
            self._connection.close()
            self._connection = None
    
    def execute_query(
        self, 
        query: str, 
        params: Optional[Dict[str, Any]] = None,
        timeout: int = 60
    ) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            # Set query timeout
            cursor.execute(f"ALTER SESSION SET STATEMENT_TIMEOUT_IN_SECONDS = {timeout}")
            
            # Execute with parameterized query (sf-parameterized rule)
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        finally:
            cursor.close()

_service: Optional[SnowflakeService] = None

def get_snowflake_service() -> SnowflakeService:
    global _service
    if _service is None:
        _service = SnowflakeService()
    return _service

def close_snowflake_service():
    global _service
    if _service:
        _service.close()
        _service = None
```

## Step 5: Configure Development

### 5.1 Vite Proxy (frontend/vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'recharts': ['recharts'],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
})
```

## Step 6: Create Pages

For each page identified in requirements:

1. Create page component in `src/pages/`
2. Add to navigation in App.tsx
3. Create corresponding API endpoints
4. Wire up data fetching with SWR or custom hooks

### Example Page with SWR

```tsx
import useSWR from 'swr'
import { MetricCard } from '../components/MetricCard'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function Dashboard() {
  const { data, error, isLoading } = useSWR('/api/data', fetcher)

  if (error) return <ErrorState onRetry={() => mutate('/api/data')} />
  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data?.metrics.map((m: any) => (
          <MetricCard key={m.id} {...m} />
        ))}
      </div>
    </div>
  )
}
```

## Step 7: Test and Iterate

1. Start backend: `uvicorn api.main:app --reload`
2. Start frontend: `npm run dev`
3. Test each page and API endpoint
4. Run bundle analyzer: `npx vite-bundle-visualizer`
5. Audit accessibility: browser devtools → Lighthouse
