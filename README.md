# Volleyball 4.2

[![CI](https://github.com/ChristianDenniss/volleyProject/actions/workflows/ci.yml/badge.svg)](https://github.com/ChristianDenniss/volleyProject/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

A full-stack TypeScript app for Roblox Volleyball League stats, teams, players, seasons, games, awards, articles, and registrations. Live: [volleyball4-2.com](https://volleyball4-2.com/).

Contributions are welcome. Start with [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) and the [`good first issue`](https://github.com/ChristianDenniss/volleyProject/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) list.

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
  - Tailwind CSS v4: Utility classes on converted pages; shared tokens in `FE/src/styles/tokens.css`

- **Routing**: React Router DOM
  - Handles client-side routing
  - Manages navigation between pages

- **HTTP Client**: Axios
  - Makes HTTP requests to backend
  - Handles API communication

- **UI Components**:
  - React Icons & FontAwesome: Icon libraries for UI elements
  - React Select: Enhanced dropdown components

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
- Jest: Testing framework for the backend
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
    │   ├── styles/    # Design tokens, Tailwind, remnant CSS
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
- Frontend: `cd FE && npm run lint` and `cd FE && npm run build`

### Production
- Backend: `cd BE && npm run build` then deploy/`npm run start:prod`
- Frontend: `cd FE && npm run build`

## Contributing

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for branching, commits, and
the PR checklist. Local setup is in
[`docs/guides/local-setup.md`](docs/guides/local-setup.md). Releases are
automated from Conventional Commits —
[docs/architecture/versioning.md](docs/architecture/versioning.md).

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security reports go
through [SECURITY.md](SECURITY.md), not public issues.

## License

[ISC](LICENSE)
