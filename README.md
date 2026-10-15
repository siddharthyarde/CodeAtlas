# CodeAtlas AI

**Understand an unfamiliar GitHub repository before you spend days reading it.**

CodeAtlas AI is a full-stack codebase-intelligence prototype for public GitHub repositories. Import a repository URL and explore its file structure, dependency graph, complexity hotspots, inferred Express API routes, and AI-generated code explanations. It also offers an AI-assisted review for public GitHub pull requests.

> **Project status:** portfolio/MVP. It is useful for learning and small-to-medium public repositories, but is not production-ready for private, security-sensitive, or enterprise codebases. See [Current limitations](#current-limitations) before deploying it for real users.

## What it does

- Imports a public GitHub repository through an asynchronous background job.
- Clones, filters, categorizes, and indexes supported source files.
- Stores imported source files in S3-compatible object storage.
- Streams import progress to the browser with Socket.io.
- Shows an interactive file dependency graph based on relative imports.
- Lets users browse indexed files in a Monaco Editor-based viewer.
- Generates structured Claude-powered file explanations and caches them.
- Offers lightweight search over previously generated explanations.
- Calculates cyclomatic-complexity-inspired risk scores for supported files.
- Infers Express-style HTTP route documentation.
- Reviews a public GitHub PR diff with Claude and returns structured findings.
- Supports email/password authentication, GitHub and Google OAuth, teams, usage tracking, and account deletion.

## Architecture

```text
React + Vite frontend
        │  REST API + Socket.io
Node.js + Express backend
        │
        ├── MongoDB        users, repositories, file metadata, cached analyses
        ├── Redis/BullMQ   repository import queue and worker
        ├── S3/R2/MinIO    imported source-file storage
        ├── GitHub         public repository cloning and PR diff retrieval
        └── Anthropic      file explanations and PR reviews
```

### Repository import flow

```text
GitHub URL → API validation → MongoDB record → BullMQ job
    → shallow clone → scan/filter files → upload to object storage
    → index metadata in MongoDB → emit live progress → explore repository
```

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Framer Motion |
| Visualizations | React Flow, Dagre, Recharts |
| Code viewing | Monaco Editor |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Jobs and real time | Redis, BullMQ, Socket.io |
| Storage | Cloudflare R2, MinIO, or another S3-compatible provider |
| Static analysis | Babel parser and custom AST traversal |
| AI | Anthropic SDK / Claude |
| Authentication | JWT, bcrypt, GitHub OAuth, Google OAuth |
| Security baseline | Helmet, CORS, rate limits, request validation |

## Project structure

```text
codeatlas-ai/
├── frontend/              # React/Vite client
│   └── src/
│       ├── pages/         # Dashboard, graph, files, docs, complexity, PR review
│       ├── components/    # Reusable UI components
│       ├── context/       # Authentication and socket state
│       └── services/      # API client
└── backend/               # Express API and background worker
    └── src/
        ├── controllers/   # HTTP request handling
        ├── services/      # AI, AST, graph, docs, complexity, PR logic
        ├── queues/        # BullMQ producer and import processor
        ├── models/        # Mongoose schemas
        ├── config/        # MongoDB, Redis, and S3 configuration
        ├── middleware/    # Auth, errors, validation, limits
        └── sockets/       # Repository-progress events
```

## Run locally

### Prerequisites

- Node.js 18 or later
- MongoDB database
- Redis instance
- An S3-compatible object-storage bucket (Cloudflare R2 or MinIO work)
- Git installed and available on `PATH`
- An Anthropic API key for AI features

### 1. Configure the backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Update `backend/.env` with the required values:

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://...
JWT_SECRET=use-a-long-random-secret
REDIS_URL=redis://...
R2_ENDPOINT=http://localhost:9000
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=codeatlas-repos
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

GitHub and Google OAuth settings are optional for local email/password authentication. Public PR diff retrieval can use an optional `GITHUB_TOKEN` to avoid GitHub API rate limits.

Start the backend and import worker (the worker is registered by `server.js`):

```powershell
npm run dev
```

### 2. Configure and start the frontend

In a second terminal:

```powershell
cd frontend
npm install
```

Create `frontend/.env` if needed:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Then start Vite:

```powershell
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Scripts

### Frontend

```powershell
npm run dev      # Start Vite development server
npm run build    # Create a production build
npm run lint     # Run ESLint
npm run preview  # Serve the production build locally
```

### Backend

```powershell
npm run dev      # Start Express with nodemon
npm start        # Start Express with Node.js
```

## Core API surface

| Route group | Purpose |
| --- | --- |
| `/api/auth` | Sign-up, sign-in, profile, API-key, OAuth, and account actions |
| `/api/repo` | Import, list, inspect, delete, graph, files, docs, and complexity |
| `/api/ai` | File explanation, explanation search, and PR review |
| `/api/team` | Team invitations and membership |
| `/api/usage` | AI usage data |
| `/api/health` | Health-check response |

## Current limitations

This README intentionally describes the system as it exists, rather than overselling it.

- Public GitHub repositories are the intended import target; private-repository installation and synchronization are not implemented.
- The dependency graph is capped at 150 files and tracks relative file imports, not a complete symbol/call/data-flow graph.
- Complexity analysis is capped at 120 eligible files. JavaScript/TypeScript are AST-parsed; Python and Go parsing is regex-based and other languages receive limited analysis.
- AI file analysis is capped at 8 KB of source and PR review diffs at 24,000 characters, so results can omit important context.
- Search uses hashed bag-of-words vectors over previously generated AI summaries. It is not a full embedding-powered repository search engine.
- API documentation discovers literal Express-style routes; it does not generate a verified OpenAPI specification or infer complete request/response schemas.
- User-supplied AI keys and OAuth tokens need encryption-at-rest and stronger secrets management before a real deployment.
- Automated tests are not yet configured, and lint should be made clean before treating this as a production release.

## Recommended next steps

1. Add unit, integration, and end-to-end tests; enforce them with CI.
2. Replace regex parsing with Tree-sitter and language-aware analyzers.
3. Add TypeScript path-alias/monorepo resolution and symbol-level graphs.
4. Use a GitHub App with signed webhooks and incremental indexing on pushes and PR updates.
5. Replace lightweight search with code chunking, real embeddings, and vector retrieval.
6. Integrate deterministic security tooling such as Semgrep or CodeQL; use AI to explain findings, not invent them.
7. Encrypt third-party credentials, add OAuth CSRF/PKCE protections, and implement audit logs and observability.

## License

No license has been declared. Add a license before distributing or accepting external contributions.
