# Frontend Implementation Plan

## 1. Project Vision & Goals

*   **Vision:** To provide an intuitive, responsive, and real-time user interface for interacting with the Sports Organization Management System backend, supporting various user roles and workflows.
*   **Goals:**
    *   Allow users to view and manage all core data entities (Organizations, Sports, Competitions, Teams, Players, Games, etc.) based on their roles.
    *   Implement forms for creating and editing entities.
    *   Provide interfaces for specific workflows (registering teams for competitions, submitting lineups, managing game events live).
    *   Display real-time game updates (scores, events).
    *   Ensure the UI is mobile-first, responsive, and accessible.
    *   Provide clear user feedback (loading, success, error states).
    *   Leverage PWA features (installability, potential offline caching).

## 2. Core Features/Modules

*   **Authentication:** Login/Logout flow (integrating with Auth0).
*   **Dashboard/Navigation:** Role-based navigation and overview.
*   **Core Data Views:** Read-only views for foundational data (Sports, Formats, Rules).
*   **Organization Management:** CRUD interface.
*   **Competition Management:** CRUD interface, view details, manage participating teams, manage competition rules.
*   **Team Management:** CRUD interface, manage rosters (Players, Staff) for competitions.
*   **Personnel Management:** View/Manage Persons, Players, Staff, Officials (role-dependent).
*   **Game Management:** View game schedules, view game details, manage officials, submit/approve lineups, live game interface (for Umpires/Officials).
*   **Live Scoreboard/Viewer:** Real-time display of ongoing game scores and events.
*   **Sanctions View:** Display active/historical player sanctions.
*   **CMS Content Display:** View news, reports, etc.

## 3. Key Technologies & Architecture

*   **Framework:** SvelteKit
*   **Language:** TypeScript
*   **Styling:** CSS / Tailwind CSS
*   **State Management:** Svelte Stores, potentially context API for complex state.
*   **API Interaction:** `fetch` API, encapsulated in service modules (`organizationService`, `competitionService`, etc.).
*   **Real-time:** WebSocket client (native or library like `socket.io-client`) to connect to backend.
*   **Architecture:** Component-based UI, route-based code splitting, service layer for API abstraction (Hexagonal/Onion influence), PWA features (Service Worker, Manifest).
*   **Testing:** Vitest (unit/component), Playwright (E2E).

## 4. Detailed Tasks/Todos

*(Note: This is a high-level breakdown. Each task implies creating routes/components, implementing API calls via services, handling state, styling, responsiveness, and testing.)*

### Setup & Configuration

*   `[ ]` Initialize SvelteKit project.
*   `[ ]` Configure base layout (`+layout.svelte`), navigation structure.
*   `[ ]` Set up styling (Tailwind CSS integration if chosen).
*   `[ ]` Configure environment variables (`.env`) for API URL, Auth0 config.
*   `[ ]` Set up Auth0 Svelte SDK or equivalent for authentication flow.
*   `[ ]` Implement basic Service Worker and Web Manifest for PWA features.
*   `[ ]` Set up WebSocket client connection logic.

### Core Service Layer (`./src/lib/services/`)

*   `[X]` Create `organizationService.ts` (CRUD). *(Assumed done)*
*   `[ ]` Create `sportService.ts` (CRUD).
*   `[ ]` Create `gameFormatService.ts` (CRUD).
*   `[ ]` Create `sportRuleService.ts` (CRUD).
*   `[ ]` Create `competitionService.ts` (CRUD, manage teams, manage rules).
*   `[ ]` Create `teamService.ts` (CRUD, manage rosters).
*   `[ ]` Create `personnelService.ts` (CRUD for Person, Player, Staff, Official - consider access control).
*   `[ ]` Create `membershipService.ts` (CRUD for Player/Staff memberships, handle approvals).
*   `[ ]` Create `gameService.ts` (CRUD, manage officials, manage lineups, get game details).
*   `[ ]` Create `gameEventService.ts` (Create events - likely via WebSocket, potentially read events).
*   `[ ]` Create `sanctionService.ts` (Read sanctions).
*   `[ ]` Create `cmsContentService.ts` (Read content).
*   `[ ]` **General:** Ensure all services handle API responses, errors, loading states consistently. Use TypeScript types matching backend schemas.

### Authentication & Navigation

*   `[ ]` Implement Login page/component redirecting to Auth0.
*   `[ ]` Implement Auth callback handler page.
*   `[ ]` Implement Logout functionality.
*   `[ ]` Create global auth store to hold user profile, roles, token.
*   `[ ]` Implement route guards based on authentication status and roles.
*   `[ ]]` Design and implement main navigation (sidebar/header) adapting to user roles.
*   `[ ]` Create basic Dashboard page showing relevant info based on role.

### Core Data Views

*   `[ ]` Create pages/components to list Sports, Game Formats, Sport Rules (likely admin-only).

### Organization Management

*   `[ ]` Create route/page for listing Organizations.
*   `[ ]` Create route/page for viewing Organization details.
*   `[ ]` Create route/page/form for creating/editing Organizations.

### Competition Management

*   `[ ]` Create route/page for listing Competitions.
*   `[ ]` Create route/page for viewing Competition details (overview, schedule, participating teams, rules).
*   `[ ]` Create route/page/form for creating/editing Competitions.
*   `[ ]` Implement UI for adding/removing Teams from a Competition (`CompetitionTeam`).
*   `[ ]` Implement UI for managing Competition-specific Rules (`CompetitionRule`).

### Team Management

*   `[ ]` Create route/page for listing Teams (possibly filtered by Organization).
*   `[ ]` Create route/page for viewing Team details (info, associated players/staff).
*   `[ ]` Create route/page/form for creating/editing Teams.
*   `[ ]` Implement UI within Competition or Team context for managing Player Rosters (`PlayerTeamMembership`).
    *   `[ ]` Form to add players (search existing Persons/Players).
    *   `[ ]` Assign shirt numbers, roles.
    *   `[ ]` Handle registration status/approval flow.
*   `[ ]` Implement UI for managing Staff Rosters (`StaffTeamMembership`).

### Personnel Management

*   `[ ]` Create routes/pages/forms for managing Persons, Players, Staff, Officials (access controlled by role).
    *   `[ ]` Consider a unified search/management interface.

### Game Management

*   `[ ]` Create route/page for viewing Game Schedules (list view, calendar view?). Filter by competition.
*   `[ ]` Create route/page for viewing Game Details (teams, score, time, venue, officials, events, lineups).
*   `[ ]` Create route/page/form for creating/editing Games (manual creation).
*   `[ ]` Implement UI for assigning Officials to a Game (`GameOfficial`).
*   **Lineup Management:**
    *   `[ ]` Create route/page for Team Manager to submit lineup (`PlayersOfTeamForGame`) for a specific game.
    *   `[ ]` Create route/page for authorized role (e.g., Official) to view submitted lineups.
    *   `[ ]` Implement approval mechanism for lineups.
*   **Live Game Interface (Umpire/Official Role):**
    *   `[ ]` Create dedicated route/page for managing a live game.
    *   `[ ]` Display current score, period, timer.
    *   `[ ]` Buttons/controls to trigger game events (Start/Stop Period, Goal, Card, Substitution - if modeled).
    *   `[ ]` Send triggered events via WebSocket to backend.
    *   `[ ]` Display confirmation/feedback.

### Live Scoreboard/Viewer

*   `[ ]` Create component/page to display live game scores/details.
*   `[ ]` Subscribe to WebSocket updates for specific games.
*   `[ ]` Update UI in real-time based on received WebSocket messages (score changes, events).

### Sanctions View

*   `[ ]` Create route/page to list Player Competition Sanctions (filter by player, competition).

### CMS Content Display

*   `[ ]` Create routes/components to display fetched CMS content (e.g., `/news`, `/reports/:id`).

## 5. Non-Functional Requirements

*   **Responsiveness:** Mobile-first design for all views and forms. Test thoroughly on various screen sizes.
*   **Accessibility (A11y):** Semantic HTML, keyboard nav, contrast, ARIA.
*   **Performance:** Optimize component rendering, lazy load routes/components, efficient data fetching in `load` functions.
*   **Error Handling:** User-friendly display of API/validation errors. Clear loading indicators.
*   **Code Quality:** Follow Svelte/TS best practices, modular components, DRY, testable functions (as per coding instructions).

## 6. Milestones (Mirroring Backend)

*   **M1: Core Setup & Auth:** SvelteKit setup, Auth0 integration, basic layout/nav, Org CRUD UI. View Sports, Formats, Rules.
*   **M2: Competition & Team Setup UI:** Competition CRUD UI, Team CRUD UI, Person/Player/Staff basic management UI. Roster management UI (add/view).
*   **M3: Basic Game Management UI:** View Game Schedule/Details, Assign Officials UI, Submit/View Lineup UI.
*   **M4: Real-time Game Viewer:** WebSocket client setup, Live Scoreboard component receiving updates. Basic Live Game Interface (buttons sending events via API/WS).
*   **M5: Advanced Workflows:** Sanctions View UI, Approval UI flows (lineups, registrations).
*   **M6: CMS & Audit:** Display CMS Content. (Audit Trail likely backend/admin panel only).
*   **M7: Refinement & Testing:** E2E tests, responsiveness polish, accessibility checks, PWA enhancements.
