# Austrian Business Cycle Monitor - Frontend

Modern React frontend for the Austrian Business Cycle Monitor.

## 🚀 Features

- ✅ React 18 with TypeScript
- ✅ Vite for fast development
- ✅ Tailwind CSS + ShadCN UI components
- ✅ JWT authentication with token refresh
- ✅ React Query for data fetching
- ✅ Zustand for state management
- ✅ React Router for navigation
- ✅ Form validation with React Hook Form + Zod
- ✅ Recharts for data visualization
- ✅ Fully responsive design
- ✅ Dark mode support

## 📋 Prerequisites

- Node.js 18+
- npm or pnpm

## 🏃 Quick Start

### Installation

```bash
# From frontend directory
cd packages/frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env if needed (default: API at localhost:8000)

# Start development server
npm run dev
```

The frontend will be available at: **http://localhost:8080**

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Layout components (MainLayout, AuthLayout)
│   ├── ui/             # ShadCN UI components
│   └── ...             # Feature components
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Registration
│   ├── Profile.tsx     # User profile
│   ├── Analysis.tsx    # Cycle analysis
│   └── Market.tsx      # Market data
├── lib/                # Utilities
│   ├── api.ts          # Axios client with interceptors
│   └── utils.ts        # Helper functions
├── stores/             # Zustand stores
│   └── authStore.ts    # Authentication state
├── hooks/              # Custom React hooks
├── types/              # TypeScript types
└── App.tsx             # Main app component
```

## 🎨 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 8080)

# Build
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking

# Testing
npm test                 # Run tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
```

## 🔐 Authentication Flow

1. **Login/Register** → Get JWT tokens
2. **Token Storage** → Tokens stored in Zustand (persisted to localStorage)
3. **API Requests** → Axios interceptor adds `Authorization: Bearer <token>`
4. **Token Refresh** → Auto-refresh on 401 errors
5. **Logout** → Clear tokens and redirect

## 🛣️ Routes

### Public Routes
- `/login` - User login
- `/register` - User registration

### Protected Routes (require authentication)
- `/` - Dashboard (overview)
- `/analysis` - Cycle analysis details
- `/market` - Market data
- `/profile` - User profile

## 🎨 UI Components (ShadCN)

The project uses ShadCN UI components for a consistent, accessible design:

- **Button** - Various button styles
- **Card** - Content containers
- **Input** - Form inputs
- **Label** - Form labels
- **Badge** - Status indicators
- **Avatar** - User avatars
- **DropdownMenu** - Dropdown menus
- **Dialog** - Modal dialogs
- **Toast** - Notifications (via Sonner)

## 📊 Data Fetching

Using **React Query** for efficient data fetching:

```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['analysis'],
  queryFn: () => api.get('/api/analysis/current'),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

## 🎯 State Management

**Zustand** for global state:

```typescript
import { useAuthStore } from './stores/authStore'

const { user, isAuthenticated, login, logout } = useAuthStore()
```

## 🎨 Styling

**Tailwind CSS** with custom theme:

```tsx
<div className="bg-background text-foreground">
  <h1 className="text-4xl font-bold">Austrian Monitor</h1>
</div>
```

## 🌐 API Integration

The frontend connects to the FastAPI backend:

```typescript
// Configured in lib/api.ts
const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
})
```

**Automatic features:**
- ✅ Auth token injection
- ✅ Token refresh on 401
- ✅ Error handling
- ✅ Request/response logging (dev mode)

## 🧪 Testing

```bash
# Run tests
npm test

# With UI
npm run test:ui

# Coverage
npm run test:coverage
```

## 🏗️ Building for Production

```bash
# Build
npm run build

# Output in dist/
# - Optimized bundles
# - Code splitting
# - Tree shaking
# - Minification
```

## 📦 Code Splitting

Automatic code splitting by route and vendor:

- `react-vendor` - React core
- `query-vendor` - React Query
- `form-vendor` - Form libraries
- `chart-vendor` - Recharts

## 🎨 Dark Mode

Toggle dark mode:

```typescript
const toggleDark = () => {
  document.documentElement.classList.toggle('dark')
}
```

## 🔧 Configuration

### Vite Config
- Port: 8080
- Proxy: `/api` → `http://localhost:8000`
- Path alias: `@/` → `src/`

### TypeScript
- Strict mode enabled
- Path aliases configured
- Full type checking

### Tailwind
- Custom theme colors
- Dark mode support
- ShadCN component styling

## 🐛 Troubleshooting

### Port in use
```bash
# Change port in vite.config.ts
server: { port: 3000 }
```

### API connection failed
```bash
# Check backend is running
curl http://localhost:8000/api/health

# Check .env VITE_API_URL
```

### Build errors
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

## 📚 Further Reading

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)

## 🤝 Contributing

See main repository [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📝 License

MIT License - see [LICENSE](../../LICENSE)
