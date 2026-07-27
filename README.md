# Volleyball Project

A full-stack TypeScript application for managing volleyball statistics, teams, players, seasons, games, awards, articles, website users, and migrations.

## Tech Stack

### Backend (BE)
- **Framework**: Express.js
  - RESTful API framework
  - Handles HTTP requests and responses
  - Manages routing for all endpoints
  - Provides middleware system for authentication and validation

- **Language**: TypeScript
  - Adds static typing to JavaScript
  - Catches errors during development
  - Provides better IDE support
  - Makes codebase more maintainable

- **Database**: 
  - PostgreSQL: Relational database storing all application data
  - TypeORM: 
    - Manages database connections
    - Handles database migrations
    - Provides type-safe database queries
    - Maps database tables to TypeScript classes

- **Authentication & Security**:
  - JWT (jsonwebtoken): Handles user authentication and creates secure tokens
  - Bcryptjs: Securely hashes passwords, prevents storing plain text
  - CORS: Enables safe communication between frontend and backend

- **Development Tools**:
  - Nodemon: Auto-restarts server during development
  - SWC: Fast TypeScript/JavaScript compiler for quick builds
  - Dotenv: Manages environment variables and sensitive data

- **Testing**:
  - Jest: Main testing framework for unit and integration tests
  - Supertest: Tests HTTP endpoints and API requests

- **Validation & Utilities**:
  - Zod: Validates request data and ensures schema compliance
  - @godaddy/terminus: Handles graceful server shutdown

### Frontend (FE)
- **Framework**: React with TypeScript
  - Main UI framework
  - Manages component state and rendering
  - TypeScript ensures type safety

- **Build Tools**:
  - Vite: Fast development server and production build optimizer
  - SASS: CSS preprocessor for better styling organization

- **Routing**: React Router DOM
  - Handles client-side routing
  - Manages navigation between pages

- **HTTP Client**: Axios
  - Makes HTTP requests to backend
  - Handles API communication

- **UI Components**:
  - React Icons & FontAwesome: Icon libraries for UI elements
  - React Select: Enhanced dropdown components
  - SimpleBar: Custom scrollbar for better UX

- **Code Quality**: ESLint
  - Enforces code style
  - Catches potential errors

### Development & Infrastructure
- **Containerization**: 
  - Docker: Containerizes application for consistent environments
  - Docker Compose: Manages multiple containers (backend, frontend, database)

- **Deployment**: Coolify
  - Hosts frontend and backend
  - Manages deployments

- **Networking**: Tailscale
  - Provides secure server connection
  - Enables safe remote access

- **Version Control**: Git
  - Tracks code changes
  - Manages version control

- **Runtime**: Node.js
  - JavaScript runtime environment
  - Executes backend code

- **Package Manager**: npm
  - Manages project dependencies
  - Runs scripts and commands

- **Code Quality**: 
  - TypeScript: Type checking and error prevention
  - ESLint: Code style enforcement
  - SWC: Fast compilation

### Testing & Quality Assurance
- Jest: Testing framework for both frontend and backend
- Supertest: API endpoint testing
- ESLint: Code quality and style enforcement
- TypeScript: Type checking and error prevention

### Deployment & Hosting
- Coolify: Application deployment and hosting platform
- Docker: Containerization for consistent deployment
- PostgreSQL: Production database
- Tailscale: Secure server networking

## Project Structure
```
volley-project/
├── BE/                 # Backend
│   ├── src/
│   │   ├── modules/    # Feature modules
│   │   ├── middleware/ # Express middleware
│   │   └── db/        # Database configuration
│   └── migrations/    # Database migrations
└── FE/                 # Frontend
    ├── src/
    │   ├── components/ # React components
    │   ├── styles/    # SASS styles
    │   └── types/     # TypeScript types
    └── public/        # Static assets
```

## Getting Started

### Prerequisites
- Node.js 20+
- Docker and Docker Compose (recommended) or a local PostgreSQL
- npm

### Installation (local)

1. Clone the repository
2. Backend env: `cd BE && cp .env.example .env` (Windows: copy `.env.example` `.env`)
3. Backend deps: `cd BE && npm install`
4. Frontend env: `cd FE && cp .env.example .env` (set `VITE_BACKEND_URL` if needed)
5. Frontend deps: `cd FE && npm install`
6. Start Postgres (e.g. root `docker compose up -d db` or your local instance)
7. Start API: `cd BE && npm run dev`
8. Start FE: `cd FE && npm run dev`

### Docker Compose

From the repo root:

```bash
docker compose up --build
```

See `docker-compose.yml` for ports (`BE` 3000, `FE` via `DOCKER_FE_PORT`, DB via `DOCKER_DB_PORT`).

### Development
- Backend: `cd BE && npm run dev`
- Frontend: `cd FE && npm run dev`

### Testing
- Backend: `cd BE && npm test`
- Frontend: `cd FE && npm test`

### Production
- Backend: `cd BE && npm run build` then deploy/`npm run start:prod`
- Frontend: `cd FE && npm run build`

## License
ISC 