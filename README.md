# Sports Organisation Management System

A comprehensive web application for managing sports organizations, competitions, teams, players, and live games. Built with SvelteKit and Convex, following Hexagonal Architecture for clean separation of concerns.

## Technology Stack

| Layer              | Technology                                       |
| ------------------ | ------------------------------------------------ |
| **Frontend**       | SvelteKit 2 + Svelte 5, TypeScript, Tailwind CSS |
| **Backend**        | Convex (real-time BaaS)                          |
| **Authentication** | Clerk (v6) with Convex RBAC                      |
| **Local Storage**  | Dexie (IndexedDB) with bidirectional Convex sync |
| **Architecture**   | Hexagonal (Ports and Adapters)                   |
| **Testing**        | Vitest                                           |
| **Deployment**     | Vercel                                           |
| **PWA**            | Service worker + manifest for offline support    |

## Project Structure

```
frontend/
├── convex/                  # Convex backend (schema, mutations, queries, auth)
│   ├── schema.ts            # 38 tables (33 synced entity + 5 system)
│   ├── sync.ts              # Bidirectional sync mutations/queries
│   ├── authorization.ts     # RBAC permission system
│   ├── seed_permissions.ts  # Permission seeding
│   └── lib/
│       └── auth_middleware.ts  # Clerk identity + RBAC enforcement
│
├── src/
│   ├── lib/
│   │   ├── core/            # Domain layer (entities, use cases, interfaces)
│   │   ├── adapters/        # Port implementations (repositories, IAM, persistence)
│   │   ├── infrastructure/  # DI container, event bus, sync services, caching
│   │   └── presentation/    # Svelte components, stores, page logic
│   └── routes/              # 40+ pages (see Features below)
│
└── static/
    ├── manifest.json        # PWA manifest
    └── sw.js                # Service worker for offline support
```

## Architecture

The application follows **Hexagonal Architecture** (Ports and Adapters) with a Convex real-time backend.

```
[User] → SvelteKit UI → Use Cases (ports) → Repositories (adapters) → Dexie (IndexedDB)
                                                                            ↕ bidirectional sync
                                                                        Convex (cloud)
                                                                            ↕ real-time subscriptions
                                                                      Other Clients
```

### Data Flow

1. **User actions** go through **Use Case ports** (internal interfaces)
2. Use cases call **Repository ports** (external interfaces) implemented by **Dexie-backed adapters**
3. **Background sync** pushes local changes to Convex and pulls remote changes down
4. **Real-time subscriptions** notify connected clients of changes immediately
5. **Clerk authentication** + **Convex RBAC** enforce security at every layer

### Key Patterns

- **Result types** over exceptions for explicit error handling
- **Dependency injection** via containers for testability
- **EventBus** pub/sub for cross-component communication
- **Generalized CRUD** via entity metadata registry (one implementation for all entities)
- **Zero Trust security** with per-request authorization checks

## Features

### Organization Management

- Multi-organization support with branding customization
- Sport configuration with customizable game periods (halves, quarters, etc.)
- Competition formats (league, knockout, group stage)
- Venue management with capacity tracking

### Team and Player Management

- Team rosters with player positions
- Player profiles with identification documents and qualifications
- Player-team membership tracking with transfer history
- Team staff management with role assignments
- Jersey color assignments with clash detection

### Competition Management

- Competition creation with format selection and rule overrides
- Team registration per competition
- Fixture scheduling with venue and official assignments
- Competition results tracking

### Live Game Management

- Real-time scoreboard with countdown clock
- Sport-aware period management (halves, quarters, breaks — configurable per sport)
- Game event recording (goals, cards, substitutions, fouls, corners, etc.)
- Add Time / stoppage time support
- Team lineups with starter/substitute designation
- Match report PDF generation
- Event timeline display

### Officials

- Official registration with role assignments
- Fixture official assignments (referee, assistant, etc.)

### Calendar

- Activity calendar with Schedule-X integration
- Shareable calendar via token-based API

### Security and Access Control

- 6 user roles: super_admin, org_admin, officials_manager, team_manager, official, player
- Per-entity CRUD permissions with data category groupings
- Scope-based data isolation (organization, team, individual)
- Role-aware sidebar navigation
- Audit logging with field-level change tracking

### Sync and Offline

- Bidirectional sync between IndexedDB and Convex (35 tables)
- Real-time subscriptions for instant multi-client updates
- Background sync with debounced push and conflict detection
- Offline-first PWA with service worker caching
- Demo data reset with full Convex sync

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Convex account (for backend)
- A Clerk account (for authentication)

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

Create `frontend/.env.local` with:

```env
PUBLIC_CONVEX_URL=<your-convex-deployment-url>
PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CONVEX_DEPLOYMENT=<your-convex-deployment-name>
```

### Development

```bash
cd frontend
npx convex dev    # Start Convex dev server (watches for schema/function changes)
npm run dev       # Start SvelteKit dev server at http://localhost:5173
```

### Testing

```bash
cd frontend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Building

```bash
cd frontend
npm run build
npm run preview   # Preview production build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests first (TDD)
4. Commit your changes
5. Push to the branch
6. Open a Pull Request

## License

This project is licensed under the MIT License.
