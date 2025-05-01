# Backend Implementation Plan

## 1. Project Vision & Goals

*   **Vision:** To provide a robust and scalable backend API for managing sports organizations, competitions, teams, players, games, and related data, supporting real-time updates and complex workflows.
*   **Goals:**
    *   Implement CRUD operations for all core entities defined in the ERD.
    *   Model relationships accurately between entities.
    *   Implement necessary business logic and validation (e.g., competition rules, lineup approvals).
    *   Provide secure and well-documented API endpoints.
    *   Support real-time game event handling via WebSockets (or alternative).
    *   Integrate with Auth0 for authentication and basic authorization.
    *   Containerize the application using Docker.
    *   Implement basic audit logging (manual or via Strapi features).

## 2. Core Features/Modules

*   **Core Data Management:** Organizations, Sports, Game Formats, Rules
*   **Competition Management:** Competitions, Competition Rules, Competition Teams
*   **Team & Personnel Management:** Teams, Persons, Players, Team Staff, Player Memberships, Staff Memberships, Officials
*   **Game Management:** Games, Game Appearances (PlayersOfTeamForGame), Game Officials, Game Events (Goals, Cards)
*   **Sanctions & Suspensions:** Player Competition Sanctions, Sanction Triggering Events
*   **User & Access Control:** Users, Roles, Permissions (leveraging Strapi RBAC + Auth0)
*   **Real-time Service:** WebSocket handling for live game updates.
*   **CMS Content:** Basic content management (e.g., news, reports).
*   **Audit Trail:** Logging significant actions.

## 3. Key Technologies & Architecture

*   **Framework:** Strapi v5
*   **Language:** TypeScript
*   **Database:** PostgreSQL (managed via Docker)
*   **Authentication:** Auth0 (integrated with Strapi Users & Permissions plugin)
*   **Real-time:** WebSockets (potentially via Strapi plugin or separate service if needed)
*   **Architecture:** RESTful API (Strapi default), potential custom controllers/services for complex logic.
*   **Deployment:** Docker container.

## 4. Detailed Tasks/Todos

*(Note: This is a high-level breakdown. Each task implies defining schema, implementing controllers/services/routes, adding validation, and considering relationships)*

### Setup & Configuration

*   `[X]` Initialize Strapi project.
*   `[X]` Set up environment variables (`.env`).
*   `[X]` Configure Docker (`./BE/Dockerfile`, `./BE/docker-compose.yml`).
*   `[X]` Run `docker-compose up -d --build`.

### Core Data Management

*   **Organization:**
    *   `[X]` Define Content Type (`name`, `type`). *(Assumed done based on previous state)*
    *   `[X]` Implement CRUD API. *(Assumed done)*
*   **Sport:**
    *   `[ ]` Define Content Type (`name`, `description`).
    *   `[ ]` Implement CRUD API.
*   **GameFormat:**
    *   `[ ]` Define Content Type (`sport` relation, `name`, durations, periods).
    *   `[ ]` Implement CRUD API.
*   **SportRule:**
    *   `[ ]` Define Content Type (`sport` relation, `rule_name`, `rule_value`, `description`).
    *   `[ ]` Implement CRUD API.

### Competition Management

*   **Competition:**
    *   `[ ]` Define Content Type (`organization`, `sport` relations, `name`, `type`, dates, `status_`).
    *   `[ ]` Implement CRUD API.
    *   `[ ]` Add logic for status transitions (Draft -> Published -> InProgress -> Completed).
*   **CompetitionRule:**
    *   `[ ]` Define Content Type (`competition`, `sport_rule` relations, `rule_name`, `rule_value`, `value_unit`).
    *   `[ ]` Implement CRUD API.
*   **CompetitionTeam:**
    *   `[ ]` Define Content Type (`team`, `competition` relations, `status_`).
    *   `[ ]` Implement API for registering/managing teams in a competition.

### Team & Personnel Management

*   **Person:**
    *   `[ ]` Define Content Type (`first_name`, `last_name`, `dob`, `gender`).
    *   `[ ]` Implement CRUD API (consider privacy/access control).
*   **Player:** (Component or separate CT linked 1:1 to Person)
    *   `[ ]` Define (`person` relation, `registration_number`).
    *   `[ ]` Implement API.
*   **TeamStaff:** (Component or separate CT linked 1:1 to Person)
    *   `[ ]` Define (`person` relation, `staff_role_type`).
    *   `[ ]` Implement API.
*   **Official:** (Component or separate CT linked 1:1 to Person)
    *   `[ ]` Define (`person` relation, `certification_level`).
    *   `[ ]` Implement API.
*   **Team:**
    *   `[ ]` Define Content Type (`organization` relation, `name`, `logo_url`, `uniform_colors`).
    *   `[ ]` Implement CRUD API.
*   **PlayerTeamMembership:**
    *   `[ ]` Define Content Type (`player`, `team`, `competition` relations, `shirt_number`, `role`, `registration_date`, `status_`).
    *   `[ ]` Implement API for managing player rosters per competition.
    *   `[ ]` Add logic/validation for status (`Registered`, `Approved`).
*   **StaffTeamMembership:**
    *   `[ ]` Define Content Type (`staff`, `team`, `competition` relations, `role`).
    *   `[ ]` Implement API for managing staff rosters per competition.

### Game Management

*   **Game:**
    *   `[ ]` Define Content Type (`competition`, `game_format`, `home_team`, `away_team` relations, `scheduled_datetime`, `venue`, `pitch`, `status_`, scores, lineup statuses).
    *   `[ ]` Implement CRUD API.
    *   `[ ]` Add logic for status transitions (Scheduled -> LineupsSubmitted -> Live -> Finished).
    *   `[ ]` Add logic for updating scores based on GameEvents.
*   **PlayersOfTeamForGame:** (Game Appearance/Lineup)
    *   `[ ]` Define Content Type (`game`, `person`, `team` relations, `role_in_game`, `shirt_number`, `status_`).
    *   `[ ]` Implement API for submitting/viewing lineups.
    *   `[ ]` Add logic/validation for lineup submission/approval (updating `Game.lineup_status`).
*   **GameOfficial:**
    *   `[ ]` Define Content Type (`official`, `game` relations, `role`).
    *   `[ ]` Implement API for assigning officials to games.
*   **GameEvent:**
    *   `[ ]` Define Content Type (`game`, `player`, `team` relations, `event_type`, `timestamp`, period info, `details` JSON). Use Single Type inheritance or components for Goal/Card if needed.
    *   `[ ]` Implement API for creating game events (likely triggered via WebSocket service).
    *   `[ ]` Add logic to update `Game` score on "Goal" event.
    *   `[ ]` Add logic to trigger sanction checks on "Card" events.

### Sanctions & Suspensions

*   **PlayerCompetitionSanction:**
    *   `[ ]` Define Content Type (`player`, `competition`, `triggering_rule` relations, `sanction_type`, reason, duration info, `status`).
    *   `[ ]` Implement API (likely internal creation logic, maybe read endpoint).
    *   `[ ]` Implement service logic to create sanctions based on `CompetitionRule` and `GameEvent`s.
*   **SanctionTriggeringEvent:**
    *   `[ ]` Define Content Type (`sanction`, `game_event` relations).
    *   `[ ]` Implement logic to link sanctions to the specific events causing them.

### User & Access Control

*   **User:** (Leverage Strapi's built-in User)
    *   `[ ]` Link User to `Person` entity (e.g., via a relation field).
*   **Role / Permission:** (Leverage Strapi's RBAC)
    *   `[ ]` Define necessary roles (Admin, CompetitionDirector, TeamManager, Umpire, etc.).
    *   `[ ]` Configure permissions for each role on relevant Content Types and API actions.
    *   `[ ]` Ensure Auth0 roles map correctly to Strapi roles upon login.

### Real-time Service

*   `[ ]` Implement WebSocket server/handler.
*   `[ ]` Handle connections/subscriptions (e.g., clients subscribing to game updates).
*   `[ ]` Receive events from authorized clients (e.g., Umpire PWA).
*   `[ ]` Validate incoming events.
*   `[ ]` Trigger creation of `GameEvent` entities via Strapi service/API.
*   `[ ]` Broadcast relevant updates (score changes, new events) to subscribed clients.

### CMS Content

*   **CMSContent:**
    *   `[ ]` Define Content Type (`content_type`, `title`, `body`, `publish_date`, `status`).
    *   `[ ]` Implement read API for public consumption.

### Audit Trail

*   `[ ]` **Option A (Strapi Enterprise):** Enable and configure built-in Audit Log feature.
*   `[ ]` **Option B (Strapi Community):**
    *   `[ ]` Define `AuditTrail` Content Type (`user`, `action`, `entity`, `entity_id`, `timestamp`, `details_before/after` JSON).
    *   `[ ]` Implement lifecycle hooks or middleware on critical Content Types (Game, PlayerTeamMembership, etc.) to create `AuditTrail` entries on CUD operations.

## 5. Non-Functional Requirements

*   **Error Handling:** Consistent API error responses.
*   **Security:** RBAC enforced, JWT validation, input sanitization.
*   **Logging:** Configure Strapi logging levels. Add specific logs in custom logic.
*   **Performance:** Optimize database queries, consider indexing.
*   **Testing:** Plan for unit/integration tests for custom services and controllers.

## 6. Milestones (Suggested)

*   **M1: Core Setup & Foundational Data:** Docker, Auth0 integration, Org, Sport, GameFormat, SportRule CRUD.
*   **M2: Competition & Team Setup:** Competition, CompRule, Team, Person, Player, Staff, Official CRUD. Roster management (Memberships).
*   **M3: Basic Game Management:** Game CRUD, Assign Officials, Submit/View Lineups (PlayersOfTeamForGame).
*   **M4: Real-time Game Events:** WebSocket setup, GameEvent creation (manual API first), Score updates. Live event input -> WebSocket -> GameEvent -> Score update loop.
*   **M5: Sanctions & Advanced Logic:** Sanctions logic, Approval workflows (lineups, registrations).
*   **M6: CMS & Audit Trail:** CMS Content type, Audit Trail implementation.
*   **M7: Refinement & Testing:** API testing, performance tuning, security review.
