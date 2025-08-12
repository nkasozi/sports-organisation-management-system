# Backend Implementation Plan

## 1. Project Vision & Goals

- **Vision:** To provide a robust and scalable backend API for managing sports organizations, competitions, teams, players, games, and related data, supporting real-time updates and complex workflows.
- **Goals:**
  - Implement CRUD operations for all core entities defined in the ERD.
  - Model relationships accurately between entities.
  - Implement necessary business logic and validation (e.g., competition rules, lineup approvals).
  - Provide secure and well-documented API endpoints.
  - Support real-time game event handling via WebSockets (or alternative).
  - Integrate with Auth0 for authentication and basic authorization.
  - Deploy to Vercel for easy scaling and management.
  - Implement basic audit logging and monitoring.

## 2. Core Features/Modules

- **Core Data Management:** Organizations, Sports, Game Formats, Rules
- **Competition Management:** Competitions, Competition Rules, Competition Teams
- **Team & Personnel Management:** Teams, Persons, Players, Team Staff, Player Memberships, Staff Memberships, Officials
- **Game Management:** Games, Game Appearances (PlayersOfTeamForGame), Game Officials, Game Events (Goals, Cards)
- **Sanctions & Suspensions:** Player Competition Sanctions, Sanction Triggering Events
- **User & Access Control:** Users, Roles, Permissions (leveraging Auth0)
- **Real-time Service:** WebSocket handling for live game updates.
- **CMS Content:** Basic content management (e.g., news, reports).
- **Audit Trail:** Logging significant actions.

## 3. Key Technologies & Architecture

- **Framework:** Flask (Python)
- **Language:** Python with full type annotations
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Authentication:** Auth0 integration
- **Real-time:** WebSockets for live game updates
- **Architecture:** Onion Architecture (Clean Architecture) with clear separation of concerns:
  - **Core Domain:** Business entities, repository interfaces, use cases (independent of external concerns)
  - **Adapters:** Database implementations, web controllers, external service integrations
  - **Configuration:** Environment-specific settings and dependency injection
- **Deployment:** Vercel Functions (serverless)

## 4. Project Structure

The project follows the onion architecture pattern with the following structure:

```
api/                          # Vercel API folder
├── core/                     # Core business logic (inner layer)
│   ├── domain/
│   │   ├── entities/         # Business entities and value objects
│   │   └── repositories/     # Repository interfaces (contracts)
│   └── use_cases/           # Business use cases and orchestration
├── adapters/                # External adapters (outer layer)
│   ├── database/            # Database implementations
│   ├── web/                 # Flask routes and controllers
│   └── external_services/   # Auth0, notifications, etc.
├── config/                  # Configuration management
├── shared/                  # Common utilities and logging
└── index.py                # Main Flask application (Vercel entry point)

frontend/                    # SvelteKit frontend
├── src/
│   ├── lib/
│   │   └── services/       # API service clients
│   └── routes/             # SvelteKit pages and components
├── package.json
└── svelte.config.js

requirements.txt             # Python dependencies
vercel.json                 # Vercel deployment configuration
```

## 5. Detailed Tasks/Todos

_(Note: This is a high-level breakdown. Each task implies defining entities, implementing use cases, adding validation, and ensuring proper separation of concerns)_

### Setup & Configuration

- `[X]` Initialize Flask project with onion architecture.
- `[X]` Set up environment configuration (`.env` support).
- `[X]` Configure Vercel deployment (`vercel.json`).
- `[X]` Set up core domain structure (entities, repositories, use cases).
- `[ ]` Configure PostgreSQL database connection.
- `[ ]` Set up database migrations with Alembic.

### Core Data Management

- **Organization:**
  - `[X]` Define Entity class with type annotations.
  - `[X]` Define Repository interface.
  - `[X]` Implement Use Case for organization management.
  - `[X]` Implement in-memory repository (for development).
  - `[ ]` Implement PostgreSQL repository.
- **Sport:**
  - `[ ]` Define Entity class (`name`, `description`).
  - `[ ]` Define Repository interface.
  - `[ ]` Implement Use Case and API endpoints.
- **GameFormat:**
  - `[ ]` Define Entity class (`sport` relation, `name`, durations, periods).
  - `[ ]` Implement Repository and Use Case.
- **SportRule:**
  - `[ ]` Define Entity class (`sport` relation, `rule_name`, `rule_value`, `description`).
  - `[ ]` Implement Repository and Use Case.

### Competition Management

- **Competition:**
  - `[X]` Define Entity class (`organization`, `sport` relations, `name`, `type`, dates, `status`).
  - `[X]` Define Repository interface.
  - `[X]` Implement Use Case for competition management.
  - `[ ]` Add logic for status transitions (Draft -> Published -> InProgress -> Completed).
- **CompetitionRule:**
  - `[ ]` Define Entity class (`competition`, `sport_rule` relations, `rule_name`, `rule_value`, `value_unit`).
  - `[ ]` Implement Repository and Use Case.
- **CompetitionTeam:**
  - `[ ]` Define Entity class (`team`, `competition` relations, `status`).
  - `[ ]` Implement API for registering/managing teams in a competition.

### Team & Personnel Management

- **Person:**
  - `[X]` Define Entity class (`first_name`, `last_name`, `dob`, `gender`).
  - `[ ]` Implement Repository and Use Case (consider privacy/access control).
- **Player:**
  - `[X]` Define Entity class (`person` relation, `registration_number`).
  - `[X]` Define Repository interface.
  - `[ ]` Implement PostgreSQL repository and API endpoints.
- **TeamStaff:**
  - `[ ]` Define Entity class (`person` relation, `staff_role_type`).
  - `[ ]` Implement Repository and API.
- **Official:**
  - `[ ]` Define Entity class (`person` relation, `certification_level`).
  - `[ ]` Implement Repository and API.
- **Team:**
  - `[X]` Define Entity class (`organization` relation, `name`, `logo_url`, `uniform_colors`).
  - `[ ]` Implement Repository and Use Case.
- **PlayerTeamMembership:**
  - `[ ]` Define Entity class (`player`, `team`, `competition` relations, `shirt_number`, `role`, `registration_date`, `status`).
  - `[ ]` Implement API for managing player rosters per competition.
- **StaffTeamMembership:**
  - `[ ]` Define Entity class (`staff`, `team`, `competition` relations, `role`).
  - `[ ]` Implement API for managing staff rosters per competition.

### Game Management

- **Game:**
  - `[X]` Define Entity class (`competition`, `game_format`, `home_team`, `away_team` relations, `scheduled_datetime`, `venue`, `pitch`, `status`, scores, lineup statuses).
  - `[X]` Implement Repository interface and Use Case.
  - `[ ]` Add logic for status transitions (Scheduled -> LineupsSubmitted -> Live -> Finished).
  - `[X]` Add logic for updating scores based on GameEvents.
- **PlayerGameAppearance:** (Game Lineup)
  - `[X]` Define Entity class (`game`, `person`, `team` relations, `role_in_game`, `shirt_number`, `status`).
  - `[ ]` Implement API for submitting/viewing lineups.
- **GameOfficial:**
  - `[ ]` Define Entity class (`official`, `game` relations, `role`).
  - `[ ]` Implement API for assigning officials to games.
- **GameEvent:**
  - `[X]` Define Entity class (`game`, `player`, `team` relations, `event_type`, `timestamp`, period info, `details` JSON).
  - `[X]` Implement Repository interface and Use Case.
  - `[X]` Add logic to update `Game` score on "Goal" event.
  - `[ ]` Add logic to trigger sanction checks on "Card" events.

### Sanctions & Suspensions

- **PlayerCompetitionSanction:**
  - `[ ]` Define Entity class (`player`, `competition`, `triggering_rule` relations, `sanction_type`, reason, duration info, `status`).
  - `[ ]` Implement Use Case (likely internal creation logic).
  - `[ ]` Implement service logic to create sanctions based on `CompetitionRule` and `GameEvent`s.
- **SanctionTriggeringEvent:**
  - `[ ]` Define Entity class (`sanction`, `game_event` relations).
  - `[ ]` Implement logic to link sanctions to the specific events causing them.

### User & Access Control

- **User Management:**
  - `[ ]` Integrate Auth0 authentication.
  - `[ ]` Link Auth0 users to `Person` entities.
  - `[ ]` Implement role-based access control.
  - `[ ]` Define necessary roles (Admin, CompetitionDirector, TeamManager, Umpire, etc.).

### Real-time Service

- `[ ]` Implement WebSocket server/handler.
- `[ ]` Handle connections/subscriptions (e.g., clients subscribing to game updates).
- `[ ]` Receive events from authorized clients (e.g., Umpire PWA).
- `[ ]` Validate incoming events.
- `[ ]` Trigger creation of `GameEvent` entities via Use Cases.
- `[ ]` Broadcast relevant updates (score changes, new events) to subscribed clients.

### Database & Persistence

- `[ ]` Set up PostgreSQL database schema with SQLAlchemy.
- `[ ]` Implement concrete repository classes using SQLAlchemy.
- `[ ]` Set up database migrations with Alembic.
- `[ ]` Configure connection pooling for Vercel Functions.
- `[ ]` Add database indexing for performance.

### API Documentation & Testing

- `[ ]` Generate OpenAPI/Swagger documentation.
- `[ ]` Implement unit tests for use cases.
- `[ ]` Implement integration tests for API endpoints.
- `[ ]` Set up continuous integration pipeline.

### CMS Content

- **CMSContent:**
  - `[ ]` Define Entity class (`content_type`, `title`, `body`, `publish_date`, `status`).
  - `[ ]` Implement read API for public consumption.

### Audit Trail

- `[ ]` Define `AuditTrail` Entity class (`user`, `action`, `entity`, `entity_id`, `timestamp`, `details_before/after` JSON).
- `[ ]` Implement Use Case for audit logging.
- `[ ]` Add audit trail hooks to critical operations (Game, PlayerTeamMembership, etc.).

## 6. Non-Functional Requirements

- **Error Handling:** Consistent API error responses with proper HTTP status codes.
- **Security:** Type-safe code, input validation, Auth0 JWT validation.
- **Logging:** Structured logging with different levels for development and production.
- **Performance:** Optimized database queries, proper indexing, connection pooling.
- **Testing:** Comprehensive unit tests for use cases, integration tests for API endpoints.
- **Documentation:** Auto-generated API documentation, clear code documentation.
- **Monitoring:** Application health checks, error tracking.

## 7. Milestones (Suggested)

- **M1: Core Architecture & Foundation:**
  - Complete onion architecture setup
  - Basic entity definitions and repository interfaces
  - In-memory repositories for development
  - Core API endpoints for organizations
- **M2: Database Integration & Core Entities:**
  - PostgreSQL integration with SQLAlchemy
  - Database migrations setup
  - Complete core entities (Organization, Sport, GameFormat, Competition)
- **M3: Team & Personnel Management:**
  - Person, Player, Team entities and use cases
  - Roster management capabilities
  - Auth0 integration for user management
- **M4: Game Management Foundation:**
  - Game entity and basic CRUD operations
  - Game event recording system
  - Score tracking functionality
- **M5: Real-time Features:**
  - WebSocket implementation for live updates
  - Real-time game event broadcasting
  - Live score updates
- **M6: Advanced Features:**
  - Sanctions and suspensions system
  - Advanced validation and business rules
  - Audit trail implementation
- **M7: Production Readiness:**
  - Comprehensive testing suite
  - Performance optimization
  - Security hardening
  - Documentation completion
  - Vercel deployment optimization

## 8. Development Commands

### Backend Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
cd api && python index.py

# Run tests
pytest

# Database migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head

# Type checking
mypy api/

# Code formatting
black api/
flake8 api/
```

### Frontend Development

```bash
# Install dependencies
cd frontend && npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run check
```

### Deployment

```bash
# Deploy to Vercel
vercel --prod

# Environment variables setup
vercel env add [VARIABLE_NAME]
```
