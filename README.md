# Sports Organisation Management System

A comprehensive web application for managing sports organizations, competitions, teams, players, and games. Built with Python/Flask backend using onion architecture and SvelteKit frontend, optimized for deployment on Vercel.

## 🏗️ Architecture Overview

This project follows the **Onion Architecture** (Clean Architecture) pattern, ensuring:

- **Separation of Concerns**: Business logic is independent of external frameworks
- **Testability**: Core logic can be tested in isolation
- **Maintainability**: Easy to modify and extend
- **Flexibility**: External dependencies can be swapped without affecting core logic

### Project Structure

````
├── api/                          # Backend API (Vercel Functions)
│   ├── core/                     # Core business logic (inner layer)
│   │   ├── domain/
│   │   │   ├── entities/         # Business entities (Organization, Game, etc.)
│   │   │   └── repositories/     # Repository interfaces
│   │   └── use_cases/           # Business use cases and orchestration
│   ├── adapters/                # External adapters (outer layer)
│   │   ├── database/            # Database implementations
│   │   ├── web/                 # Flask routes and controllers
│   │   └── external_services/   # Auth0, notifications, etc.
│   ├── config/                  # Configuration management
│   ├── shared/                  # Common utilities and logging
│   └── index.py                # Main Flask application (Vercel entry point)
├── frontend/                    # SvelteKit frontend
│   ├── src/
│   │   ├── lib/
│   │   │   └── services/       # API service clients
│   │   └── routes/             # SvelteKit pages and components
│   ├── package.json
│   └── svelte.config.js
├── requirements.txt             # Python dependencies
├── vercel.json                 # Vercel deployment configuration
├── BACKEND_PLAN.md             # Detailed backend implementation plan
└── FRONTEND_PLAN.md            # Frontend implementation plan
## 🛠️ Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Auth0
- **Real-time**: WebSockets
- **Deployment**: Vercel Functions (Serverless)
- **Type Safety**: Full Python type annotations

### Frontend
- **Framework**: SvelteKit (Svelte 5)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Deployment**: Vercel (Static Site Generation)

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL (for production)

### Backend Development

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
````

2. **Set up environment variables**:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the development server**:

   ```bash
   cd api
   python index.py
   ```

   The API will be available at `http://localhost:5000`

### Frontend Development

1. **Install Node.js dependencies**:

   ```bash
   cd frontend
   npm install
   ```

2. **Run the development server**:

   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Database Setup

1. **Create PostgreSQL database**:

   ```sql
   CREATE DATABASE sports_org_development;
   CREATE USER sports_user WITH ENCRYPTED PASSWORD 'sports_password';
   GRANT ALL PRIVILEGES ON DATABASE sports_org_development TO sports_user;
   ```

2. **Run database migrations**:

   ```bash
   # Initialize Alembic (first time only)
   alembic init alembic

   # Create migration
   alembic revision --autogenerate -m "Initial migration"

   # Apply migration
   alembic upgrade head
   ```

## 📦 Deployment

### Vercel Deployment

1. **Install Vercel CLI**:

   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:

   ```bash
   vercel --prod
   ```

3. **Set environment variables**:
   ```bash
   vercel env add DATABASE_URL
   vercel env add AUTH0_DOMAIN
   vercel env add AUTH0_CLIENT_ID
   vercel env add AUTH0_CLIENT_SECRET
   vercel env add SECRET_KEY
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/sports_org_db

# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=your-api-audience

# Flask Configuration
SECRET_KEY=your-secret-key-here
FLASK_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=api

# Run specific test file
pytest tests/test_organizations.py
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e
```

## 🔧 Development Commands

### Code Quality

```bash
# Format Python code
black api/

# Lint Python code
flake8 api/

# Type checking
mypy api/

# Format frontend code
cd frontend
npm run format

# Lint frontend code
npm run lint
```

### Database Management

```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history
```

## 📚 API Documentation

### Core Endpoints

#### Organizations

- `POST /api/v1/organizations` - Create new organization
- `GET /api/v1/organizations/{id}` - Get organization details
- `GET /api/v1/organizations/by-type/{type}` - List organizations by type

#### Competitions

- `POST /api/v1/competitions` - Create new competition
- `GET /api/v1/organizations/{id}/competitions` - Get organization competitions

#### Games

- `POST /api/v1/games` - Create new game
- `POST /api/v1/games/{id}/events` - Record game event

### Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00Z",
  "error": null
}
```

## 🎯 Core Features

### Implemented

- ✅ Organization management
- ✅ Competition creation and management
- ✅ Game creation and event recording
- ✅ Real-time score updates
- ✅ Type-safe Python codebase
- ✅ Onion architecture implementation

### In Development

- 🚧 Team and player management
- 🚧 User authentication with Auth0
- 🚧 Real-time WebSocket updates
- 🚧 Advanced game statistics

### Planned

- 📋 Player registration and transfers
- 📋 Competition brackets and standings
- 📋 Official assignment and management
- 📋 Sanctions and suspensions system
- 📋 Mobile-responsive PWA
- 📋 Notification system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow PEP 8 for Python code
- Use type annotations for all Python functions
- Follow the established onion architecture patterns
- Write comprehensive tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Backend Implementation Plan](BACKEND_PLAN.md)
- [Frontend Implementation Plan](FRONTEND_PLAN.md)
- [API Documentation](https://your-api-docs-url.com)
- [Live Demo](https://your-app.vercel.app)
  - **Interaction:** Uses game management UI to assign officials.
  - **System Action:** Creates `GameOfficial` record.
  - **Attributes:** `assignment_id`, `official_id` (links to James' `Official`/`Person`), `game_id`, `role` ("Umpire").

**21. `AuditTrail`**

- **Use Case (MVP Context):** This entity was removed from our ERD to rely on Strapi's built-in features for the MVP.
  - **If using Strapi Enterprise:** Actions like Sarah updating a game score would be automatically logged in Strapi's built-in Audit Log section within the Admin Panel, showing user, action, timestamp, and potentially changed data.
  - **If using Strapi Community:** There is no built-in audit log. Basic logging for critical actions (like score changes) would need to be manually implemented using Strapi's lifecycle hooks or custom controllers, perhaps logging to the console or a simple custom "Log" content type if absolutely needed for the MVP. The comprehensive tracking originally envisioned in our custom `AuditTrail` entity wouldn't be present without this custom work or upgrading.

**22. `CMSContent`**

- **Use Case:** David (Comms Officer) publishes a match report for the KHC vs WHG game.
  - **Interaction:** Uses Strapi Admin Panel (or dedicated CMS interface) to create content.
  - **System Action:** Creates `CMSContent` record.
  - **Attributes:** `content_id`, `content_type` ("MatchReport"), `title`, `body`, `publish_date`, `status` ("Published").
  - **Result:** Public website/PWA fetches via Strapi API to display.

---
