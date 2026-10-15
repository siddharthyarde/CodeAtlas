# CodeAtlas AI — Complete Project Documentation

> A comprehensive reference for every feature, file, function, technology, and integration in the CodeAtlas AI platform.

---

## Table of Contents

1. [What Is CodeAtlas AI?](#1-what-is-codeatlas-ai)
2. [How It Works — The Big Picture](#2-how-it-works--the-big-picture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Backend — Deep Dive](#5-backend--deep-dive)
   - [Entry Point — server.js](#51-entry-point--serverjs)
   - [Configuration](#52-configuration)
   - [Database Models](#53-database-models)
   - [Controllers](#54-controllers)
   - [Routes](#55-routes)
   - [Middleware](#56-middleware)
   - [Services](#57-services)
   - [Job Queue System](#58-job-queue-system)
   - [Sockets](#59-sockets)
   - [Utilities](#510-utilities)
6. [Frontend — Deep Dive](#6-frontend--deep-dive)
   - [Entry Point & App Shell](#61-entry-point--app-shell)
   - [Context Providers](#62-context-providers)
   - [Services](#63-services)
   - [Pages](#64-pages)
   - [Components](#65-components)
7. [APIs & Integrations](#7-apis--integrations)
8. [OAuth Authentication Flows](#8-oauth-authentication-flows)
9. [Data Flow Walkthroughs](#9-data-flow-walkthroughs)
10. [Security Model](#10-security-model)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Environment Variables Reference](#12-environment-variables-reference)

---

## 1. What Is CodeAtlas AI?

CodeAtlas AI is an **AI-powered codebase intelligence platform** built for software developers. The core idea is simple: paste any public GitHub repository URL and within minutes you get:

- A **visual dependency graph** showing how every file imports from every other file
- **AI explanations** of what each file does, written in plain English
- **Complexity analysis** identifying which files are risky and hard to maintain
- **Auto-generated API documentation** extracted directly from your route definitions
- **PR code reviews** — paste a GitHub Pull Request URL and get a full AI code review with security issues, bugs, and suggestions

The platform is designed as a **SaaS product** (Software as a Service) with:
- Free tier (3 repos, 50 AI calls/month)
- Pro tier (unlimited) — future paid feature
- Team collaboration via invite links
- User-owned Anthropic API keys (you pay for your own AI usage)

### The Problem It Solves

When you join a new codebase or inherit old code, understanding "what does this file do?" and "how are things connected?" takes hours of reading. CodeAtlas AI compresses that into minutes by combining static code analysis (AST parsing) with Claude AI explanations.

---

## 2. How It Works — The Big Picture

```
User pastes GitHub URL
         │
         ▼
Backend validates URL → Creates repo record in MongoDB
         │
         ▼
Job dispatched to Redis queue (BullMQ)
         │
         ▼
Worker process (runs in background):
  Step 1: Validate URL exists
  Step 2: Clone repo from GitHub to temp folder
  Step 3: Upload every file to Cloudflare R2 (cloud storage)
  Step 4: Parse all files → save File records to MongoDB
  Step 5: Mark repo as "complete"
         │
         ▼  (Socket.io streams progress to browser in real time)
         │
         ▼
User sees repo is ready → Explores:
  • Dependency Graph  → AST parse on demand → React Flow visualization
  • Files + AI        → Fetch file from R2 → Claude explains it → Cache result
  • Complexity        → AST metrics → risk scoring → Heatmap UI
  • API Docs          → Extract route declarations → Group by resource
  • PR Review         → Fetch GitHub diff → Claude reviews it → Cache result
```

---

## 3. Technology Stack

### Backend Technologies

| Technology | What It Is | Why We Use It |
|------------|-----------|---------------|
| **Node.js 18+** | JavaScript runtime | Runs the backend server; non-blocking I/O is great for handling many concurrent connections |
| **Express.js** | Web framework for Node | Simple, minimal framework for defining HTTP routes and middleware |
| **MongoDB** | NoSQL document database | Stores all app data (users, repos, files, AI results); flexible schema suits our varied data shapes |
| **Mongoose** | MongoDB object modeler | Provides schemas, validation, and helper methods on top of raw MongoDB |
| **Redis** | In-memory data store | Used as the job queue storage for BullMQ; lightning-fast for task management |
| **BullMQ** | Job queue library | Manages background tasks (repo cloning, uploading); ensures jobs survive server restarts |
| **Socket.io** | Real-time websocket library | Streams live progress updates to the browser while a repo is being processed |
| **JSON Web Token (JWT)** | Auth token standard | Stateless authentication; user logs in once and gets a token valid for 7 days |
| **bcryptjs** | Password hashing library | Hashes passwords before storing; even if DB is leaked, raw passwords are safe |
| **@anthropic-ai/sdk** | Anthropic Claude API client | Official SDK for calling Claude AI; used for file explanations and PR reviews |
| **@aws-sdk/client-s3** | AWS S3 client | Talks to Cloudflare R2 (which is S3-compatible) for file storage |
| **@babel/parser + @babel/traverse** | JavaScript AST tools | Parse JS/TS/JSX files into Abstract Syntax Trees to extract imports, exports, functions, routes |
| **simple-git** | Git operations in Node | Clones GitHub repos to a temp directory during import |
| **compression** | HTTP compression | Gzip-compresses responses to reduce bandwidth |
| **helmet** | HTTP security headers | Sets secure headers (prevents XSS, clickjacking, etc.) |
| **morgan** | HTTP request logger | Logs every HTTP request with status, duration, and method |
| **cors** | Cross-Origin Resource Sharing | Allows the frontend (different domain) to call the backend API |
| **express-rate-limit** | Rate limiting middleware | Protects against abuse (100 req/15min general, 10/hr for auth, 20/hr for AI) |
| **express-validator** | Input validation | Validates request bodies (email format, password length, etc.) |
| **dotenv** | Environment variables | Loads `.env` file into `process.env` so secrets are never in code |
| **ioredis** | Redis client | Connects Node.js to Upstash Redis for BullMQ |

### Frontend Technologies

| Technology | What It Is | Why We Use It |
|------------|-----------|---------------|
| **React 18** | UI library | Builds the interactive user interface with components |
| **Vite** | Build tool & dev server | Extremely fast bundler and hot-reload dev server |
| **React Router v6** | Client-side routing | Handles navigation between pages without full page reloads |
| **TailwindCSS** | Utility-first CSS framework | Custom dark theme with utility classes; no writing raw CSS for most things |
| **Framer Motion** | Animation library | Smooth page transitions and element animations |
| **React Flow** | Node-based graph library | Renders the interactive dependency graph with zoom, pan, minimap |
| **Monaco Editor** | Code editor component | The same editor as VS Code; renders file content with syntax highlighting |
| **Recharts** | Chart library | Bar charts for usage statistics on the Usage page |
| **Socket.io-client** | Client-side websockets | Connects to the backend Socket.io server to receive real-time progress |
| **Axios** | HTTP client | Makes API calls to the backend with automatic JSON parsing and token headers |
| **react-hot-toast** | Toast notifications | Shows success/error messages in the corner of the screen |
| **Lucide React** | Icon library | SVG icons used throughout the UI |

### Cloud Services

| Service | What It Is | Role in the Project |
|---------|-----------|---------------------|
| **MongoDB Atlas** | Cloud-hosted MongoDB | Production database; stores all app data |
| **Cloudflare R2** | S3-compatible object storage | Stores every file from every cloned repository (10 GB free) |
| **Upstash Redis** | Serverless Redis | Stores BullMQ job queue data between server restarts |
| **Anthropic Claude** | AI language model | Powers all AI features: file explanation, PR review |
| **GitHub OAuth** | GitHub identity provider | Lets users sign in with their GitHub account |
| **Google OAuth** | Google identity provider | Lets users sign in with their Google account |
| **Vercel** | Frontend hosting | Deploys the React app globally with a CDN |
| **Render** | Backend hosting | Runs the Node.js server as a persistent web service |

---

## 4. Project Structure

```
codeatlas-ai/
├── backend/                    ← Node.js/Express API server
│   ├── server.js               ← Entry point
│   ├── package.json
│   ├── .env                    ← Secret keys (never committed to git)
│   ├── .env.example            ← Template showing all required env vars
│   ├── .gitignore
│   └── src/
│       ├── config/
│       │   ├── db.js           ← MongoDB connection
│       │   ├── redis.js        ← Redis connection
│       │   └── s3.js           ← Cloudflare R2 / S3 client
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── repo.controller.js
│       │   ├── ai.controller.js
│       │   ├── complexity.controller.js
│       │   ├── docs.controller.js
│       │   ├── pr.controller.js
│       │   └── team.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   ├── error.middleware.js
│       │   ├── rateLimit.middleware.js
│       │   └── validate.middleware.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Repository.js
│       │   ├── File.js
│       │   ├── AISummary.js
│       │   ├── ComplexityReport.js
│       │   ├── TeamMember.js
│       │   ├── UsageLog.js
│       │   └── PRReviewCache.js
│       ├── queues/
│       │   ├── repo.queue.js   ← BullMQ job producer
│       │   └── repoProcessor.js← BullMQ worker (does the actual work)
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── repo.routes.js
│       │   ├── ai.routes.js
│       │   ├── complexity.routes.js
│       │   ├── docs.routes.js
│       │   ├── pr.routes.js
│       │   ├── team.routes.js
│       │   └── usage.routes.js
│       ├── services/
│       │   ├── ai.service.js
│       │   ├── ast.service.js
│       │   ├── complexity.service.js
│       │   ├── docs.service.js
│       │   ├── graph.service.js
│       │   └── pr.service.js
│       ├── sockets/
│       │   └── repoProgress.socket.js
│       └── utils/
│           ├── fileScanner.js
│           ├── helpers.js
│           └── treeBuilder.js
│
└── frontend/                   ← React application
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── vercel.json             ← Vercel SPA routing config
    └── src/
        ├── main.jsx            ← React entry point
        ├── App.jsx             ← Routes + providers
        ├── index.css           ← Global styles + CSS variables
        ├── context/
        │   ├── AuthContext.jsx
        │   └── SocketContext.jsx
        ├── services/
        │   └── api.js          ← Axios instance
        ├── components/
        │   ├── Layout.jsx
        │   ├── Shared.jsx
        │   ├── Icons.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── ErrorBoundary.jsx
        │   ├── FileTree.jsx
        │   ├── NodeDetailPanel.jsx
        │   ├── ComplexityCard.jsx
        │   └── EndpointCard.jsx
        └── pages/
            ├── LandingPage.jsx
            ├── LoginPage.jsx
            ├── SignupPage.jsx
            ├── AuthCallbackPage.jsx
            ├── DashboardPage.jsx
            ├── RepositoryPage.jsx
            ├── GraphPage.jsx
            ├── FilesPage.jsx
            ├── ComplexityPage.jsx
            ├── DocsPage.jsx
            ├── PRAnalysisPage.jsx
            ├── TeamPage.jsx
            ├── UsagePage.jsx
            ├── SettingsPage.jsx
            ├── JoinPage.jsx
            └── NotFoundPage.jsx
```

---

## 5. Backend — Deep Dive

### 5.1 Entry Point — `server.js`

This is the first file that runs when you start the backend (`node server.js`). It wires everything together.

**What it does, line by line:**

1. **`require('dotenv').config()`** — Loads the `.env` file so secrets are available via `process.env`
2. **`require('./src/queues/repoProcessor')`** — Imports the BullMQ worker. Just importing it registers the worker and starts listening for jobs. This is intentional — the worker runs alongside the HTTP server in the same process.
3. **`app.use(compression())`** — Every HTTP response is gzip-compressed, reducing bandwidth by ~70%
4. **`app.use(helmet())`** — Sets 11 security-related HTTP headers automatically (Content-Security-Policy, X-Frame-Options, etc.)
5. **`app.use(morgan(...))`** — Logs every request to the console. Uses `'combined'` format in production (Apache-style logs with IP, user-agent) and `'dev'` in development (colorized, concise)
6. **30-second timeout** — Any request that takes longer than 30 seconds automatically returns a 503 error. This protects against hung requests consuming server resources
7. **CORS setup** — Reads `FRONTEND_URL` and `ALLOWED_ORIGINS` from env. Only whitelisted origins can call the API. `credentials: true` allows cookies and Authorization headers cross-origin
8. **Route mounting** — Each route file is mounted at its prefix: `/api/auth`, `/api/repo`, `/api/ai`, etc.
9. **`GET /api/health`** — A simple endpoint that returns `{ status: 'ok' }`. Used by Render's health checker to confirm the server is alive.
10. **`app.use('/api/*', 404 handler)`** — Any API path that didn't match a real route returns a JSON 404 (not an HTML page)
11. **Socket.io** — The WebSocket server is attached to the same HTTP server. This lets the frontend maintain a real-time connection for live progress updates
12. **`start()`** — Connects to MongoDB first, then starts the HTTP server. If MongoDB fails, the server never starts.

---

### 5.2 Configuration

#### `src/config/db.js` — MongoDB Connection

Connects to MongoDB Atlas using the `MONGODB_URI` environment variable.

**Key features:**
- **Retry logic**: If the first connection attempt fails, it waits 3 seconds and tries again, up to 3 total attempts. After 3 failures, the process exits (a crashed server is restarted by Render automatically)
- **`family: 4`** — Forces IPv4 DNS resolution. This fixes a common Windows DNS issue where Node.js tries IPv6 first and times out

#### `src/config/redis.js` — Redis Connection

Creates a single Redis client (singleton pattern) that is shared across the entire backend. BullMQ uses this client to store job state.

**Why a singleton?** Redis connections are expensive to create. We create one and reuse it everywhere instead of creating a new connection per request.

**`rediss://` (double-s)** — The double `s` means TLS-encrypted Redis. Upstash requires this for security.

#### `src/config/s3.js` — Cloudflare R2 Storage

Creates an AWS S3 client configured to point at Cloudflare R2 instead of Amazon S3. Cloudflare R2 is S3-compatible (uses the same API) but much cheaper — the first 10 GB of storage is free.

**Functions:**
- **`uploadFileToS3(key, content)`** — Uploads a file to R2. `key` is the path inside the bucket (like `repos/userId/repoId/src/index.js`), `content` is the file contents as a string or Buffer
- **`getFileFromS3(key)`** — Downloads a file from R2 and returns its contents as a string. Used when the user wants to view a file or run AI analysis on it
- **`deletePrefix(prefix)`** — Deletes all files under a path prefix. Used when deleting a repo — instead of deleting 200 files one by one, we delete everything under `repos/userId/repoId/` in one efficient batch operation
- **`listFilesInPrefix(prefix)`** — Returns all file keys under a prefix. Used for verifying what was uploaded

**Why store files in R2?**
Files are never stored on the server's disk in production. Render (and cloud hosts generally) can restart your server at any time, wiping any local files. R2 is persistent, globally accessible, and cheap.

---

### 5.3 Database Models

Every model is a Mongoose schema that defines the shape of documents stored in MongoDB.

#### `User.js`

The central model. Every user account is one document.

**Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| `name` | String | Display name shown in the UI |
| `email` | String | Login identifier, must be unique |
| `password` | String | Stored as a bcrypt hash, never plain text |
| `avatar` | String | URL to a profile image (set by OAuth) |
| `plan` | String | `'free'` or `'pro'` — determines limits |
| `githubId` | String | GitHub's internal user ID for OAuth matching |
| `githubToken` | String | GitHub access token (for future API calls) |
| `anthropicApiKey` | String | User's own Anthropic key for AI features |
| `aiCallsThisMonth` | Number | Counter reset each month; enforces the 50-call limit |
| `aiCallsLimit` | Number | Default 50 for free tier |
| `repoLimit` | Number | Default 3 for free tier |
| `createdAt` | Date | Auto-set by Mongoose timestamps |

**Key methods on the User model:**

- **`comparePassword(candidatePassword)`** — Uses bcrypt to compare a plain-text password against the stored hash. Returns true/false. Never stores or logs the plain password.
- **`canMakeAICall()`** — Checks if `aiCallsThisMonth < aiCallsLimit`. Called before every Claude API call.
- **`incrementAIUsage()`** — Atomically increments `aiCallsThisMonth` by 1. Also creates a `UsageLog` record for the audit trail.

**Pre-save hook:**
```js
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```
This runs automatically before every `.save()`. It only hashes the password if it was actually changed (so profile updates don't re-hash unnecessarily). The `12` is the bcrypt cost factor — higher = slower hashing = harder for attackers to brute-force.

#### `Repository.js`

Tracks each imported GitHub repository.

**Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| `userId` | ObjectId | Which user imported this repo |
| `url` | String | The original GitHub URL |
| `owner` | String | GitHub username (e.g., `expressjs`) |
| `name` | String | Repo name (e.g., `express`) |
| `status` | String | `pending → processing → complete → error` |
| `s3Prefix` | String | Base path in R2 (e.g., `repos/userId/repoId`) |
| `totalFiles` | Number | How many files were found and stored |
| `filesByCategory` | Object | Count of files by type (component, route, model, etc.) |
| `jobId` | String | BullMQ job ID for status tracking |
| `errorMessage` | String | Set if processing failed |
| `clonedAt` | Date | When the git clone completed |
| `analyzedAt` | Date | When the file scan completed |

#### `File.js`

One document per file in a repository. Stores metadata extracted by the AST parser.

**Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| `repoId` | ObjectId | Links back to the Repository |
| `filePath` | String | Relative path (e.g., `src/routes/auth.js`) |
| `extension` | String | File type (`.js`, `.ts`, `.py`, etc.) |
| `category` | String | What kind of file: `component`, `route`, `controller`, `model`, `service`, `middleware`, `util`, `config`, `test`, `style`, `doc`, `other` |
| `lineCount` | Number | Total lines in the file |
| `imports` | Array | Files this file imports from |
| `exports` | Array | What this file exports |
| `functions` | Array | Function names defined in the file |
| `routes` | Array | Express route declarations (method + path) |
| `astData` | Object | Full parsed AST metadata for graph building |

**Why store all this?**
When the user opens the Graph page or Files page, all this data is already in MongoDB. We don't need to re-parse the code on every page load — it was done once during import.

#### `AISummary.js`

A cache of Claude AI explanations. One document per file per repo.

**Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| `repoId` | ObjectId | Which repo this summary is for |
| `filePath` | String | Which file was explained |
| `summary` | Object | The Claude response: `{ purpose, architectureRole, keyResponsibilities, dependencies, potentialIssues, optimizationTips, complexity }` |
| `embeddingVector` | Array | A numerical vector (1536 numbers) representing the file's semantic meaning. Used for search. |
| `model` | String | Which Claude model was used |
| `promptTokens` | Number | How many tokens the prompt used |
| `completionTokens` | Number | How many tokens the response used |
| `cached` | Boolean | Whether this was served from cache |

**Why cache AI results?**
Claude API calls cost money and take 2-5 seconds. If 10 users look at the same file in the same repo, we call Claude once and serve the cached result to the other 9 users instantly for free.

#### `ComplexityReport.js`

Stores complexity metrics for each analyzed file.

**Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| `repoId` | ObjectId | Links to Repository |
| `filePath` | String | Which file |
| `cyclomaticComplexity` | Number | Count of independent paths through the code (see complexity section) |
| `maxNestingDepth` | Number | Deepest level of nested code blocks |
| `functionCount` | Number | How many functions are defined |
| `avgFunctionLength` | Number | Average lines per function |
| `riskScore` | Number | 0–100 composite score |
| `riskLevel` | String | `low`, `medium`, `high`, or `critical` |

#### `TeamMember.js`

Tracks collaboration invites.

**Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| `email` | String | Email of the invited person |
| `invitedBy` | ObjectId | The user who sent the invite |
| `role` | String | `viewer` or `editor` |
| `inviteToken` | String | A random 48-character hex string used in the invite URL |
| `status` | String | `pending` or `accepted` |
| `expiresAt` | Date | Invites expire after 7 days |
| `userId` | ObjectId | Set when the invited person creates an account and accepts |

#### `UsageLog.js`

An append-only audit trail of every AI call.

**Fields:** `userId`, `repoId`, `action` (e.g., `explain_file`), `filePath`, `promptTokens`, `completionTokens`, `createdAt`

This powers the Usage page's bar chart — we aggregate these logs by day for the last 30 days.

#### `PRReviewCache.js`

Caches PR review results so the same PR isn't reviewed twice.

**Fields:** `cacheKey` (e.g., `pr:expressjs/express/5573`), `userId`, `result` (the full Claude review object)

---

### 5.4 Controllers

Controllers contain the business logic. A route calls a controller function, which reads the request, does work, and sends a response.

#### `auth.controller.js`

**`signup(req, res, next)`**
1. Checks if email is already registered → returns 409 if so
2. Creates a new User document (password is automatically hashed by the pre-save hook)
3. Signs a JWT containing `{ id: user._id }` with 7-day expiry
4. Returns the token + user data to the frontend

**`login(req, res, next)`**
1. Finds user by email → returns 401 if not found
2. Calls `user.comparePassword(password)` → returns 401 if wrong
3. Signs a new JWT and returns it with user data

**`getMe(req, res)`**
Called by the frontend on every page load to verify the stored JWT and get fresh user data. Returns everything the frontend needs: name, email, plan, AI usage, whether an Anthropic key is saved, a masked hint of the key (like `sk-ant-••••••••••••abc123`).

**`saveApiKey(req, res)`**
Validates the API key starts with `sk-ant-` then saves it to the user document. Never logged or exposed in full.

**`removeApiKey(req, res)`**
Sets `anthropicApiKey` to null.

**`refreshToken(req, res)`**
Issues a new JWT for an already-authenticated user. Used to extend sessions before they expire.

**`updateProfile(req, res, next)`**
Updates `name` and/or `avatar`. Only updates fields that were actually sent.

**`changePassword(req, res, next)`**
1. Fetches the full user from DB (needed for `comparePassword`)
2. Verifies `currentPassword` is correct
3. Sets `user.password = newPassword` (triggers the pre-save bcrypt hook)
4. Calls `user.save()` to persist

**`deleteAccount(req, res, next)`**
Full cascade delete:
1. Finds all repos for this user, gets their S3 prefixes
2. Deletes all S3/R2 files for each repo
3. Deletes all File records, AISummary records, Repositories, TeamMember records, UsageLog records
4. Deletes the User document

**`githubRedirect(req, res)`**
Redirects the browser to GitHub's OAuth authorization page with the correct parameters. When the user clicks "Continue with GitHub", this is what runs.

**`githubCallback(req, res)`**
Called by GitHub after the user approves OAuth:
1. Receives a temporary `code` from GitHub
2. Exchanges it for an access token via a POST to `https://github.com/login/oauth/access_token`
3. Uses the token to fetch the user's GitHub profile from `https://api.github.com/user`
4. Resolves the user's email (may require a second API call to `/user/emails` if the email is private)
5. Email fallback: if GitHub account has "Keep email private" enabled, uses `{id}+{login}@users.noreply.github.com`
6. Upserts the user (creates if new, updates token if existing)
7. Signs a JWT and redirects to `/auth-callback?token=JWT`

**`googleRedirect(req, res)`**
Redirects to Google's OAuth authorization page.

**`googleCallback(req, res)`**
Same flow as GitHub: receive code → exchange for token → fetch profile from `https://www.googleapis.com/oauth2/v3/userinfo` → upsert user → sign JWT → redirect to `/auth-callback?token=JWT`.

**`httpsGet(url, headers)` / `httpsPost(url, body)`**
Internal helper functions (not routes) that make HTTPS requests without any external library — only Node's built-in `https` module. This avoids adding `axios` or `node-fetch` as a dependency on the backend.

---

#### `repo.controller.js`

**`importRepo(req, res)`**
1. Validates the GitHub URL format with a regex
2. Checks if the user has hit their repo limit (3 for free plan)
3. Checks if this exact URL was already imported (prevents duplicates)
4. Creates a `Repository` document with `status: 'pending'`
5. Dispatches a BullMQ job with `{ repoId, userId, url }`
6. Returns immediately with `repoId` — the actual work happens in the background

**`getUserRepos(req, res)`**
Returns all repositories for the logged-in user, sorted newest first.

**`getRepoById(req, res)`**
Returns a single repository. Includes `filesByCategory` breakdown.

**`getRepoStatus(req, res)`**
A lightweight endpoint the frontend polls to check if a repo import is done. Returns `{ status, totalFiles, errorMessage, filesByCategory }`.

**`getRepoFiles(req, res)`**
Returns all File documents for a repo. Supports `?category=route` filtering. Used by the Files page to build the file tree.

**`getFileContent(req, res)`**
1. Looks up the file record in MongoDB to get the S3 key
2. Downloads the file content from R2
3. Returns it (capped at 100KB to prevent sending massive files)

**`analyzeRepo(req, res)`**
Builds the dependency graph:
1. Fetches all File records for the repo
2. Creates React Flow nodes from file records (colored by category)
3. Creates edges by resolving import paths to actual files
4. Returns `{ nodes, edges, stats }`
This is called when the user opens the Graph page.

**`deleteRepo(req, res)`**
Deletes a repo and everything associated with it: S3 files, File documents, AISummary documents.

**`getDashboardStats(req, res)`**
Aggregates: total repos, total files, AI calls this month, recent repos (last 5), recent AI summaries.

---

#### `ai.controller.js`

**`explain(req, res)`**
The core AI feature:
1. Verifies the repo belongs to this user
2. Checks `AISummary` cache — if found, returns immediately with `cached: true`
3. Checks the user has an Anthropic API key saved
4. Calls `canMakeAICall()` — returns 429 if limit reached
5. Fetches file content from R2
6. Calls Claude via `explainFile()` in `ai.service.js`
7. Saves the result to `AISummary`
8. Creates a `UsageLog` record
9. Calls `incrementAIUsage()`
10. Returns the explanation

**`search(req, res)`**
Semantic search over a repo's files:
1. Fetches all `AISummary` records for the repo that have `embeddingVector` set
2. Generates an embedding for the search query
3. Computes cosine similarity between the query vector and each file's vector
4. Returns the top 5 most similar files, sorted by score

---

#### `complexity.controller.js`

**`getRepoComplexity(req, res)`**
Runs complexity analysis on all parseable files in the repo:
1. Fetches File records with analyzable extensions (js, jsx, ts, tsx, py, go)
2. Checks which files already have cached `ComplexityReport` documents
3. For uncached files: fetches content from R2, runs `analyzeFile()`, saves to `ComplexityReport`
4. Batches analysis in groups of 20 to avoid overwhelming the server
5. Returns all results merged together

This is cached aggressively — once a file is analyzed, the result is stored forever (until the repo is deleted).

---

#### `docs.controller.js`

**`getRepoDocs(req, res)`**
Generates API documentation by reading route files:
1. Fetches all File records where `category` is `route` or `controller`
2. For each file: downloads from R2, parses with `parseFile()` to extract route declarations
3. Filters out middleware mounts (only keeps actual API routes)
4. Deduplicates routes (same method + path from different files)
5. Passes to `groupRoutes()` to organize by resource

---

#### `pr.controller.js`

**`prReview(req, res)`**
1. Parses and validates the GitHub PR URL
2. Checks `PRReviewCache` — returns cached result if found
3. Requires user's Anthropic API key
4. Fetches the raw diff from GitHub API
5. Parses the diff into per-file change stats
6. Calls Claude with the diff for a structured code review
7. Caches the result
8. Tracks usage

---

### 5.5 Routes

Each route file maps HTTP methods + URL paths to controller functions. All protected routes require the `auth` middleware to run first.

#### `auth.routes.js`
```
POST   /api/auth/signup            → signup
POST   /api/auth/login             → login
GET    /api/auth/github            → githubRedirect (starts OAuth)
GET    /api/auth/github/callback   → githubCallback (OAuth return)
GET    /api/auth/google            → googleRedirect
GET    /api/auth/google/callback   → googleCallback
GET    /api/auth/me                → getMe (protected)
POST   /api/auth/refresh           → refreshToken (protected)
PUT    /api/auth/profile           → updateProfile (protected)
PATCH  /api/auth/profile           → updateProfile (protected, same handler)
PUT    /api/auth/password          → changePassword (protected)
PATCH  /api/auth/password          → changePassword (protected, same handler)
PATCH  /api/auth/api-key           → saveApiKey (protected)
DELETE /api/auth/api-key           → removeApiKey (protected)
DELETE /api/auth/account           → deleteAccount (protected)
```

Note: Both `PUT` and `PATCH` are registered for profile/password so the frontend can use either HTTP method.

#### `repo.routes.js`
```
GET    /api/repo/dashboard-stats   → getDashboardStats
GET    /api/repo                   → getUserRepos
POST   /api/repo/import            → importRepo
GET    /api/repo/:id               → getRepoById
GET    /api/repo/:id/status        → getRepoStatus
GET    /api/repo/:id/files         → getRepoFiles
GET    /api/repo/:id/analyze       → analyzeRepo (builds graph)
GET    /api/repo/:id/complexity    → getRepoComplexity
GET    /api/repo/:id/docs          → getRepoDocs
GET    /api/repo/:id/file          → getFileContent (?path=...)
DELETE /api/repo/:id               → deleteRepo
```

#### `ai.routes.js`
```
POST   /api/ai/explain             → explain
POST   /api/ai/search              → search
POST   /api/ai/pr-review           → prReview
```

#### `team.routes.js`
```
GET    /api/team/accept            → accept invite (public, no auth)
GET    /api/team                   → get team members + pending invites
POST   /api/team/invite            → send invite
DELETE /api/team/:id               → remove member
```

#### `usage.routes.js`
```
GET    /api/usage                  → usage stats (last 30 days)
```

---

### 5.6 Middleware

#### `auth.middleware.js`

Every protected route runs this first. It:
1. Reads the `Authorization` header and extracts the Bearer token
2. Verifies the JWT signature using `JWT_SECRET`
3. Looks up the user in MongoDB by the `id` from the token payload
4. Attaches the user document to `req.user`
5. Calls `next()` to proceed to the controller

If anything fails (missing token, invalid signature, expired token, user not found), it returns 401 immediately.

#### `rateLimit.middleware.js`

Three limiters using `express-rate-limit`:

- **`generalLimiter`**: 100 requests per 15 minutes per IP. Applied to all routes.
- **`authLimiter`**: 10 requests per hour per IP. Applied to login and signup only. Prevents brute-force attacks.
- **`aiLimiter`**: 20 requests per hour per IP. Applied to AI endpoints as a secondary layer (the user-level limit of 50/month is the primary one).

#### `validate.middleware.js`

Works with `express-validator`. After validation rules run (e.g., `body('email').isEmail()`), this middleware checks if any validation errors were found and returns a 400 with a list of error messages if so. If all valid, calls `next()`.

#### `error.middleware.js`

The global error handler — Express calls this when any controller calls `next(err)`. It logs the error and returns a standardized JSON error response. Prevents raw Node.js stack traces from reaching the client.

---

### 5.7 Services

Services contain the "heavy lifting" logic. Controllers call services.

#### `ai.service.js`

**`explainFile(content, filePath, apiKey)`**
The main AI function. Builds a prompt describing the task, sends the file content to Claude, and parses the response.

- Uses model: `claude-sonnet-4-20250514`
- `max_tokens: 1500`
- The prompt instructs Claude to return **strict JSON** with this exact structure:
  ```json
  {
    "purpose": "One sentence what this file does",
    "architectureRole": "Where it fits in the system",
    "keyResponsibilities": ["list", "of", "things", "it", "does"],
    "dependencies": ["list", "of", "what", "it", "depends", "on"],
    "potentialIssues": ["any", "concerns", "or", "anti-patterns"],
    "optimizationTips": ["suggestions", "for", "improvement"],
    "complexity": "low | medium | high"
  }
  ```
- If the response can't be parsed as JSON, the raw text is wrapped in a `{ raw }` object as a fallback

**`generateEmbedding(text)`**
Converts text into a vector of 1536 numbers. This is a lightweight bag-of-words implementation:
1. Cleans and tokenizes the text (lowercases, removes special chars, splits on whitespace)
2. Counts word frequencies
3. Normalizes to a unit vector (L2 norm)
The result is a fingerprint of the text's word content.

**`cosineSimilarity(vecA, vecB)`**
Measures how similar two embedding vectors are. Returns a value from -1 (opposite) to 1 (identical). Used by the search feature to rank files by relevance to a query.

---

#### `ast.service.js`

The code parser. Takes source code and extracts structured information.

**`parseJSFile(content, filePath)`**
Uses `@babel/parser` with all plugins enabled (JSX, TypeScript, decorators, etc.) to handle any JS/TS variant. Then traverses the AST with `@babel/traverse` and extracts:

- **imports**: `import X from 'y'` → source paths (like `'../utils/helpers'`)
- **exports**: `export const X` or `module.exports.X = ...`
- **functions**: `function foo()`, arrow functions assigned to constants
- **classes**: `class Foo extends Bar`
- **routes**: `router.get('/path', handler)` — method and path
- **React components**: functions that return JSX and are PascalCase
- **Hooks**: functions starting with `use`

**`parsePythonFile(content)`**
No Python AST library — uses regex patterns instead:
- `import X` and `from X import Y` for imports
- `def functionName(` for functions
- `class ClassName(` for classes

**`parseGoFile(content)`**
Same regex approach for Go:
- `import "path"` and `import (\n...\n)` blocks
- `func functionName(` for functions

**`parseFile(content, filePath)`**
Routes to the correct parser based on file extension. Falls back to returning empty arrays if the extension is unrecognized.

---

#### `complexity.service.js`

**`analyzeFile(content, filePath)`**
Computes three metrics by walking the AST:

- **Cyclomatic Complexity**: Counts decision points — every `if`, `else if`, `for`, `while`, `case`, `catch`, `&&`, `||`, `?` adds 1. A file with complexity 1 is a straight line of code. Complexity 10+ is considered complex, 20+ is very complex.
- **Max Nesting Depth**: Tracks how deep the code goes into nested blocks. `if (a) { for (b) { if (c) { ... } } }` is depth 3. Deep nesting is a signal of complex logic.
- **Function Count**: Total number of function definitions.

**`computeRisk(cyclomaticComplexity, maxNestingDepth, functionCount)`**
Combines the three metrics into a 0–100 risk score:
```
riskScore = (cc * 3) + (depth * 2) + (functions * 1)
```
Then maps to risk levels:
- 0–20: `low` (green)
- 21–40: `medium` (yellow)
- 41–70: `high` (orange)
- 71+: `critical` (red)

---

#### `graph.service.js`

**`buildGraph(files)`**
Converts an array of File records into React Flow nodes and edges.

**Nodes**: Each file becomes a node. Color is determined by `category`:
- component → blue
- route → green
- model → amber
- service → purple
- middleware → pink
- controller → teal
- util/config → gray

**Edges**: For each file's `imports`, we try to resolve the import path to another file in the repo. If found, we create an edge between the two nodes. This represents the dependency relationship.

**Layout**: Nodes are positioned using a BFS (Breadth-First Search) algorithm. Files with no incoming edges (root files) go in column 0. Files they import go in column 1. And so on. This creates a left-to-right dependency flow.

---

#### `docs.service.js`

**`groupRoutes(routes)`**
Takes a flat list of route declarations and groups them by the first path segment:
- `/api/auth/login` and `/api/auth/signup` → group `auth`
- `/api/repo` and `/api/repo/:id/files` → group `repo`

**`generateDescription(method, path, handler)`**
Converts camelCase handler names into readable descriptions:
- `getUserRepos` → "Get User Repos"
- `deleteAccount` → "Delete Account"
Also adds standard descriptions based on HTTP method + pattern:
- `GET /...` → "Retrieve..."
- `POST /...` → "Create..."
- `DELETE /...` → "Remove..."

---

#### `pr.service.js`

**`parsePRUrl(url)`**
Extracts `owner`, `repo`, and `number` from a GitHub PR URL like `https://github.com/expressjs/express/pull/5573`.

**`fetchPRDiff(owner, repo, number)`**
Calls the GitHub API with `Accept: application/vnd.github.v3.diff` header. This returns the raw unified diff of all changed files. No authentication required for public repos.

**`parseDiff(diffText)`**
Splits the diff on `diff --git` markers to get per-file chunks. For each file, counts added lines (`+`) and removed lines (`-`). Returns `{ files: [{path, additions, deletions}], totalAdditions, totalDeletions }`.

**`reviewPR(diffText, parsedDiff, apiKey)`**
Sends the diff to Claude with a detailed prompt requesting a structured JSON review:
```json
{
  "summary": "Brief overview",
  "overallVerdict": "Approved | Needs Changes | Rejected",
  "score": 0-100,
  "securityIssues": [{"severity": "HIGH", "location": "...", "description": "..."}],
  "bugs": [{"location": "...", "description": "...", "fix": "..."}],
  "styleIssues": [...],
  "positiveHighlights": [...],
  "recommendedChanges": [...],
  "testingNotes": "..."
}
```

---

### 5.8 Job Queue System

#### `queues/repo.queue.js`

Creates a BullMQ `Queue` named `'repo-processing'`. The `addRepoJob(data)` function adds a job to this queue. The job data includes `repoId`, `userId`, and `url`.

Why use a queue instead of doing it in the HTTP request?
- Cloning a repo can take 10–30 seconds. HTTP requests should respond in < 1 second.
- The queue worker can retry failed jobs automatically.
- If the server restarts mid-clone, Redis stores the job state and the worker picks up where it left off.

#### `queues/repoProcessor.js`

The BullMQ Worker. This runs in the same Node.js process as the HTTP server. It listens for jobs on the `'repo-processing'` queue and processes them.

**5-step pipeline for each job:**

1. **Validate** (`emitProgress(..., 'validating', 0%)`)
   - Verify the GitHub URL is reachable (basic format check)

2. **Clone** (`emitProgress(..., 'cloning', 20%)`)
   - Uses `simple-git` to `git clone` the repo into a temp directory under `tmp/`
   - Only clones the latest commit (`--depth 1`) to save time and space

3. **Upload** (`emitProgress(..., 'uploading', 50%)`)
   - Walks every file in the cloned directory
   - Skips: `node_modules`, `.git`, `dist`, `build`, `.next`, `__pycache__`, binary files
   - Uploads each file to R2 with key `repos/{userId}/{repoId}/{relativePath}`
   - Updates the Repository document with the S3 prefix and file count

4. **Scan** (`emitProgress(..., 'scanning', 80%)`)
   - Calls `scanFiles()` from `fileScanner.js`
   - For each uploaded file: reads from R2, parses with AST service, saves a `File` document to MongoDB

5. **Complete** (`emitProgress(..., 'complete', 100%)`)
   - Sets `repo.status = 'complete'`, sets `analyzedAt`, updates `filesByCategory`
   - Deletes the temp clone directory

If any step throws an error, the job catches it, sets `repo.status = 'error'` and `repo.errorMessage`, and emits a failure progress event.

---

### 5.9 Sockets

#### `sockets/repoProgress.socket.js`

**`initSocket(io)`**
Sets up Socket.io with JWT authentication. When a client connects:
1. The connection handshake includes the JWT token in `socket.handshake.auth.token`
2. The server verifies the JWT
3. If valid, the socket joins a private room named after the user's ID: `socket.join(userId)`
4. Invalid tokens → connection is rejected

**`emitProgress(io, userId, data)`**
Sends a `repoProgress` event to all of a user's connected browser tabs. The data includes:
```json
{
  "repoId": "...",
  "stage": "cloning",
  "message": "Cloning repository...",
  "percent": 20,
  "status": "processing"
}
```
The frontend's `SocketContext` listens for this event and updates the UI.

---

### 5.10 Utilities

#### `utils/fileScanner.js`

**`categorizeFile(filePath)`**
Determines what kind of file something is based on its path and name:
- Path contains `/components/` or `/component/` → `component`
- Path contains `/routes/` or `/route/` → `route`
- Path contains `/controllers/` or `/controller/` → `controller`
- Path contains `/models/` or `/model/` → `model`
- Path contains `/services/` or `/service/` → `service`
- Path contains `/middleware/` → `middleware`
- Path contains `/utils/` or `/helpers/` or `/util/` → `util`
- Name is `package.json`, `.env`, config file → `config`
- Extension `.md`, `.txt`, `.rst` → `doc`
- Extension `.css`, `.scss`, `.less` → `style`
- Extension `.test.`, `.spec.` → `test`
- Everything else → `other`

**`scanFiles(repoId, s3Prefix, io, userId)`**
1. Lists all files stored in R2 under the repo's prefix
2. For each file: fetches content from R2, parses with `parseFile()`, creates a `File` document in MongoDB
3. Processes in batches of 10 to avoid memory issues on large repos

#### `utils/helpers.js`

Two tiny wrapper functions used in every controller:

**`sendSuccess(res, data, statusCode = 200)`**
```js
res.status(statusCode).json({ success: true, data });
```

**`sendError(res, message, statusCode = 500)`**
```js
res.status(statusCode).json({ success: false, error: message });
```

Every API response in the project follows this format. The frontend can always check `response.data.success` to know if the call worked.

---

## 6. Frontend — Deep Dive

### 6.1 Entry Point & App Shell

#### `main.jsx`

The very first file that runs in the browser. Calls `ReactDOM.createRoot()` on the `<div id="root">` in `index.html` and renders `<App />`.

#### `App.jsx`

The root of the React component tree. Responsible for:

1. **Providers**: Wraps everything in `<AuthProvider>` (auth state) → `<SocketProvider>` (websocket) → `<BrowserRouter>` (routing). Order matters — SocketProvider needs auth to connect.
2. **`<Toaster />`**: The notification system. Placed here so toasts work from any page.
3. **Routes**: Defines all URL paths. Public routes (`/`, `/login`, `/signup`, `/auth-callback`, `/join`) don't need auth. Protected routes are wrapped in `<ProtectedRoute>` and `<ErrorBoundary>`.
4. **`<EB>`** (shorthand ErrorBoundary): Each protected page gets its own error boundary so one page crashing doesn't take down the whole app.

#### `index.css`

Defines the visual design system as CSS custom properties (variables):

```css
:root {
  --bg:          #070714;   /* Main page background — deep dark purple-black */
  --bg-card:     #0F0F1A;   /* Card backgrounds */
  --border-soft: rgba(255,255,255,0.07); /* Subtle borders */
  --text-1:      #F9FAFB;   /* Primary text — near white */
  --text-2:      #9CA3AF;   /* Secondary text — medium gray */
  --text-3:      #6B7280;   /* Tertiary text — dark gray */
  --purple:      #7C3AED;   /* Brand accent — Violet 600 */
}
```

Also defines reusable CSS classes used throughout components:
- `.card` — Dark card with border and border-radius
- `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger` — Button variants
- `.input` — Form input field
- `.pill` — Small rounded tag
- `.mono` — Monospace font for code paths
- `.fade-up` — Framer Motion-style entrance animation
- `.shimmer` — Skeleton loading animation

---

### 6.2 Context Providers

#### `AuthContext.jsx`

Manages the user's authentication state globally. Any component can call `useAuth()` to access the user and auth functions.

**State:**
- `user` — The current user object (or null if not logged in)
- `token` — The JWT string
- `loading` — True while checking stored tokens on startup

**On mount (app startup):**
1. Checks for a `?token=` parameter in the URL (legacy OAuth support)
2. Reads stored token from `localStorage`
3. Calls `GET /auth/me` to verify the token and get fresh user data
4. If the token is expired or invalid, clears everything and the user sees the login page

**Functions:**
- **`login(email, password)`** — Calls the API, stores token, sets user state
- **`signup(name, email, password)`** — Same as login but with signup endpoint
- **`logout()`** — Clears localStorage and state. The `ProtectedRoute` sees `user = null` and redirects to login.
- **`loginWithToken(token)`** — Used by `AuthCallbackPage` after OAuth. Stores the token, then calls `/auth/me` to get the full user object before navigating.
- **`updateUser(updates)`** — Merges updates into the current user state. Used by SettingsPage when the user changes their name or API key status.

#### `SocketContext.jsx`

Manages the Socket.io connection. The socket connects when a user logs in and disconnects when they log out.

**Connection**: When `user` is available, calls `io(BACKEND_URL, { auth: { token } })`. The token is sent in the WebSocket handshake so the server can verify identity.

**Exposed**: The `socket` instance. Pages that need real-time updates (like `RepositoryPage`) read this via `useContext(SocketContext)` and call `socket.on('repoProgress', handler)`.

---

### 6.3 Services

#### `services/api.js`

A configured Axios instance. All API calls in the frontend go through this instead of raw `fetch`.

**Base URL**: `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`

**Request interceptor**: Before every request, reads the JWT from `localStorage` and adds `Authorization: Bearer <token>` to the headers.

**Response interceptor**: If any response is a 401 (unauthorized):
- If the failing request was not `/auth/me`, clears localStorage and redirects to `/login`
- If the failing request was `/auth/me`, does nothing — `AuthContext` handles this case

---

### 6.4 Pages

#### `LandingPage.jsx`

The public homepage at `/`. A marketing page showing what CodeAtlas AI does with animated sections, feature cards, and links to sign up/log in. Uses Framer Motion for scroll-triggered animations.

---

#### `LoginPage.jsx`

Email/password login form with additional OAuth buttons.

- Reads `?oauthError=` from the URL — if an OAuth attempt failed (e.g., user denied GitHub access), this shows a red banner with the error message
- "Continue with GitHub" → navigates to `{BACKEND_URL}/api/auth/github`
- "Continue with Google" → navigates to `{BACKEND_URL}/api/auth/google`
- On form submit: calls `login()` from `AuthContext`, then navigates to `/dashboard`

---

#### `SignupPage.jsx`

Same as LoginPage but calls `signup()` and includes a Name field.

---

#### `AuthCallbackPage.jsx`

A public page at `/auth-callback` that exists solely to handle OAuth redirects. GitHub and Google both redirect back to this page after authentication.

**Why this page exists**: OAuth redirects the browser to a URL with `?token=` in the query string. This page:
1. Reads `?token=` or `?error=` from the URL
2. If there's an error: maps error codes to human-readable messages and navigates to `/login?oauthError=...`
3. If there's a token: calls `loginWithToken(token)` from AuthContext, then navigates to `/dashboard`

Without this page, OAuth would redirect to a protected route, which would race with ProtectedRoute's auth check and cause an infinite login redirect loop.

---

#### `DashboardPage.jsx`

The home screen after login.

**What it shows:**
- **Greeting**: "Good morning, [name]" etc. based on current hour
- **4 stat cards**: Total repos, total files analyzed, AI calls this month (with a progress bar), repos completed
- **AI usage bar**: Shows percentage of monthly AI calls used. Turns orange at >80%, red at >95%
- **Recent repos table**: Last 5 imported repos with status badges and delete buttons
- **Recent AI insights**: Last 5 AI explanations generated across all repos
- **Quick action grid**: Import repo, View graph, Analyze complexity, Review PR — links to the relevant pages

All data comes from `GET /api/repo/dashboard-stats`.

---

#### `RepositoryPage.jsx`

The repository management page.

**Import flow:**
1. User types a GitHub URL and clicks "Import"
2. Frontend calls `POST /api/repo/import`
3. On success: starts polling `GET /api/repo/:id/status` AND listens for `repoProgress` Socket.io events
4. The `ProgressStepper` component shows 5 steps: Validating → Cloning → Uploading → Scanning → Complete
5. Each step lights up as Socket.io events arrive with `stage` and `percent`
6. On completion: the repo appears in the list below

**Repo list:**
- Shows all repos with name, owner, file count, status badge, creation date
- Delete button (with confirmation) calls `DELETE /api/repo/:id`
- Clicking a repo links to the Graph or Files page

---

#### `GraphPage.jsx`

The dependency graph visualization page. This is one of the most complex pages.

**How it works:**
1. Fetches `GET /api/repo/:id/analyze` which returns `{ nodes, edges }`
2. Renders a `ReactFlow` canvas with all nodes and edges
3. Nodes are colored by file category (blue = component, green = route, etc.)
4. Edges show which files import each other
5. Dagre layout positions nodes automatically (left-to-right dependency flow)
6. Clicking a node opens a slide-in panel (right side) showing:
   - File name and category
   - Imports list
   - Exported names
   - Functions defined
   - Routes declared
   - "Explain with AI" button
7. Filter toolbar lets you show only certain categories
8. MiniMap shows a bird's-eye view of the full graph
9. Export as PNG saves a screenshot of the graph

---

#### `FilesPage.jsx`

A split-panel file explorer.

**Left panel (28%)**:
- File tree organized by category, collapsed by default
- Each folder (e.g., "Routes", "Components") expands to show individual files
- Files show complexity dot indicators (green/yellow/orange/red)
- Search/filter input filters the visible files
- Selecting a file shows its content on the right

**Right panel (72%)**:
- **Monaco Editor** (top): Renders the file content with VS Code-style syntax highlighting. Read-only.
- **AI Analysis panel** (bottom): Shows the Claude explanation in 4 cards:
  - Purpose
  - Architecture Role
  - Key Responsibilities (bullet list)
  - Potential Issues + Optimization Tips
  - Complexity badge
  - "Cached" green badge if result came from cache
- **Semantic search bar**: Type a query (like "authentication logic") → calls `POST /api/ai/search` → highlights the most relevant files

---

#### `ComplexityPage.jsx`

The code complexity heatmap.

**Header summary bar**: 4 colored counters showing how many files are low/medium/high/critical risk.

**Sort controls**: Sort by risk score (default), cyclomatic complexity, nesting depth, or function count.

**File cards grid**: 3 columns of cards. Each card shows:
- File path
- Risk badge (color-coded)
- A circular progress ring showing risk score (0–100)
- Cyclomatic complexity, max nesting depth, function count
- Link to view the file in the Files page

All data comes from `GET /api/repo/:id/complexity`.

---

#### `DocsPage.jsx`

Auto-generated API documentation.

**Left sidebar**: List of resource groups (auth, repo, ai, team, etc.) — clicking scrolls to that section.

**Right content area**: Each group shows its endpoint cards. Each card has:
- HTTP method badge (GET=blue, POST=green, PUT=yellow, DELETE=red)
- Path (e.g., `/api/repo/:id/files`)
- Human-readable description
- Source file path (where this route is defined)
- "Copy cURL" button — generates a `curl` command you can paste in a terminal

All data comes from `GET /api/repo/:id/docs`.

---

#### `PRAnalysisPage.jsx`

GitHub Pull Request reviewer.

**Input**: GitHub PR URL field + "Analyze PR" button.

**Loading state**: Shows skeleton placeholders while Claude is thinking (can take 10–20 seconds).

**Result view** (2-column layout):
- Left (main): Summary card with verdict badge (Approved/Needs Changes/Rejected), quality score gauge (SVG circle), and metric chips (security issues count, bugs count, etc.). Below that: 5-tab panel showing Security Issues, Bugs, Recommended Changes, Testing Notes, Positive Highlights.
- Right sidebar: List of changed files with add/remove line counts.
- Bottom: History of last 5 PR reviews done in this session.

---

#### `TeamPage.jsx`

Team collaboration management.

**Members table**: Shows all accepted members (name, email, role, joined date) plus the owner (always first). "Remove" button calls `DELETE /api/team/:id`.

**Invite form**: Enter email + select role (Viewer/Editor) → calls `POST /api/team/invite` → displays a copyable invite link.

**Pending invites**: Shows invites that were sent but not yet accepted, with expiry dates.

---

#### `UsagePage.jsx`

AI usage statistics and limits.

**Plan card**: Shows current plan (Free/Pro) with the repo limit and AI call limit.

**3 stat cards**: AI calls this month, total repos, total files analyzed.

**Bar chart**: `Recharts` bar chart showing AI calls per day for the last 30 days.

**Top repos table**: Which repos have generated the most AI calls.

**Upgrade CTA**: Shown for free tier users at the bottom.

---

#### `SettingsPage.jsx`

User settings, split into 4 sections.

**Profile**: Name field (editable) + email (read-only). Save calls `PATCH /api/auth/profile`.

**Change Password**: Current password + new password + confirm. Password strength meter (Weak/Fair/Good/Strong based on length, uppercase, numbers, symbols). Save calls `PATCH /api/auth/password`.

**API & Integrations**:
- Anthropic API key: Shows a masked hint if a key is saved (e.g., `sk-ant-••••••••••••abc123`). Input to add/replace key. Toggle show/hide. Remove button.
- GitHub Connection: Shows connected status. "Connect/Reconnect" button navigates to GitHub OAuth flow.

**Danger Zone**: "Delete Account" button opens a modal requiring the user to type "DELETE" to confirm. On confirm: calls `DELETE /api/auth/account`, logs out, navigates to home.

---

#### `JoinPage.jsx`

A simple page at `/join?token=...` that immediately redirects to the backend's `GET /api/team/accept?token=...` endpoint. That backend route validates the invite token and redirects to either the dashboard (if the invited email already has an account) or the signup page with the email pre-filled.

---

#### `NotFoundPage.jsx`

The 404 page. Shown for any URL that doesn't match a defined route. Has a "Go back home" button.

---

### 6.5 Components

#### `Layout.jsx`

Contains the shell that wraps every protected page.

**`Sidebar`**: Fixed 240px left sidebar with:
- Logo + app name at the top
- Navigation links (Dashboard, Repositories, Graph, Files, Complexity, Docs, PR Analyzer, Team, Usage, Settings)
- Active link is highlighted in purple
- Each nav item has a Lucide icon
- User info at the bottom (avatar circle with first letter, name, email, "Sign out" button)
- **Responsive collapse**: Below 1024px screen width, the sidebar collapses to 56px icon-only mode using a `resize` event listener

**`PageWrapper`**: The main content area. Has `margin-left` matching the sidebar width with a CSS transition so it smoothly adjusts when the sidebar collapses.

---

#### `Shared.jsx`

A collection of reusable UI components:

**`PageHeader({ title, subtitle })`**: The title + subtitle at the top of each page.

**`StatCard({ icon, label, value, color })`**: A dashboard metric card with an icon, a large number, and a label.

**`StatusBadge({ status })`**: A colored pill showing repo status. `pending`=gray, `processing`=blue (animated), `complete`=green, `error`=red.

**`EmptyState({ icon, title, subtitle, action })`**: The empty-state illustration shown when a list has no items. Has an icon, heading, subtitle, and optional action button.

**`Skeleton`**: An animated shimmer div for skeleton loading screens. Accepts `width`, `height`, `borderRadius` style props.

**`SkeletonCard`**: A card-shaped skeleton placeholder with multiple rows.

**`ProgressStepper({ steps, currentStep })`**: The 5-step progress indicator shown during repo import. Each step is a circle with a label. Completed steps show a checkmark, the current step animates.

---

#### `ProtectedRoute.jsx`

A wrapper component. If `loading` is true (checking auth on startup), shows a spinner. If `user` is null (not logged in), redirects to `/login`. Otherwise renders children.

---

#### `ErrorBoundary.jsx`

A React class component (must be a class — hooks can't do error boundaries). Implements `getDerivedStateFromError()` and `componentDidCatch()`.

If a child component throws an unhandled error during render:
- Catches it and logs to the console
- Shows a user-friendly "Something went wrong" message with a "Try Again" button instead of a blank white screen

---

#### `Icons.jsx`

Hand-crafted SVG icons as React components. Each icon uses a common `Ic` wrapper that sets `viewBox`, `width`, `height`, `stroke`, `fill`, and `strokeLinecap` to match the Lucide icon style.

Includes: FileCode, FolderTree, GitBranch, BarChart2, BookOpen, GitPullRequest, Users, Settings, Activity, Sparkles, Code, Shield, Bug, CheckCircle, AlertTriangle, and more.

---

#### `FileTree.jsx`

The collapsible file browser used on the Files page.

- Groups files by category into folders
- Each folder can be expanded/collapsed
- Clicking a file calls `onSelect(file)`
- Shows file extension, line count, and a complexity dot (color based on risk level if available)
- Supports a search/filter input that highlights matching files

---

#### `NodeDetailPanel.jsx`

The slide-in panel on the Graph page. Appears when you click a node.

Shows:
- File name (large) + category badge
- Imports list (what this file depends on)
- Exports list
- Functions/classes defined
- Routes declared (if any)
- "Explain with AI" button that triggers the AI explanation flow

---

## 7. APIs & Integrations

### Anthropic Claude API

**Used for:**
- `POST /api/ai/explain` — Explains what a file does
- `POST /api/ai/pr-review` — Reviews a GitHub PR diff

**Model used:** `claude-sonnet-4-20250514`

**How prompts are structured:**
Claude is instructed to return strict JSON. The system prompt establishes the context ("You are a senior software architect analyzing a codebase"). The user prompt includes the file content and asks for specific fields.

**Who pays?** Each user must add their own Anthropic API key in Settings. When they make an AI call, their key is used. This means the platform doesn't pay for AI usage — users do. This is called a "BYOK" (Bring Your Own Key) model.

**Rate limits enforced:** 50 calls/month for free tier (tracked in `User.aiCallsThisMonth`).

---

### GitHub API

**Used for:**
- **OAuth**: `GET https://github.com/login/oauth/authorize` — Redirect user to GitHub login
- **Token Exchange**: `POST https://github.com/login/oauth/access_token` — Exchange OAuth code for access token
- **User Profile**: `GET https://api.github.com/user` — Get the authenticated user's profile
- **User Emails**: `GET https://api.github.com/user/emails` — Get email list (needed when email is private)
- **PR Diffs**: `GET https://api.github.com/repos/{owner}/{repo}/pulls/{number}` with `Accept: application/vnd.github.v3.diff` — Get the raw diff of a PR

**Authentication:** OAuth App credentials (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) are used for the OAuth flow. The GitHub access token is stored in the `User` document for future use.

---

### Google OAuth API

**Used for:** Signing in with Google.

**OAuth 2.0 Flow:**
1. Redirect to `https://accounts.google.com/o/oauth2/v2/auth` with `response_type=code`, `scope=openid email profile`
2. Google redirects back with a `code`
3. Exchange code at `https://oauth2.googleapis.com/token` for `access_token`
4. Fetch user profile from `https://www.googleapis.com/oauth2/v3/userinfo`

**Why no Passport.js?** Both OAuth flows are implemented manually using Node's `https` module. This avoids adding a large dependency (Passport has many transitive deps) and gives full control over the flow.

---

### Cloudflare R2 (S3-Compatible Storage)

**Used for:** Storing every file from every cloned repository.

**How it works:** The S3 SDK doesn't know it's talking to Cloudflare — it thinks it's Amazon S3. The only difference is the endpoint URL, which points to Cloudflare's servers instead of Amazon's.

**Why R2 over S3?**
- Free tier: 10 GB storage, 1 million Class A operations, 10 million Class B operations per month
- No egress fees (Amazon S3 charges for downloads; Cloudflare doesn't)
- Fully compatible API

**Object key structure:** `repos/{userId}/{repoId}/{filePath}`

Example: `repos/6a07/6a08/src/routes/auth.js`

---

### Upstash Redis

**Used for:** BullMQ job queue storage.

**Why Upstash?** It's serverless Redis — you pay per request, not per hour. Perfect for apps that have bursty traffic. Also provides TLS by default (hence `rediss://` with double-s).

**What's stored in Redis:** BullMQ stores job state (pending, active, completed, failed) and job data. If the server restarts while a repo is being processed, Redis remembers the job and it can be retried.

---

### MongoDB Atlas

**Used for:** All application data (users, repos, files, AI summaries, etc.).

**Why MongoDB?** The data shapes in this project vary a lot — a File document has different fields than a User document, and AI summaries have nested JSON (the Claude response). MongoDB's flexible document model handles this naturally.

**Atlas free tier:** 512 MB storage, shared cluster, always free.

---

## 8. OAuth Authentication Flows

### GitHub OAuth — Step by Step

```
Browser                    Backend                   GitHub
   │                          │                         │
   │── Click "Login w/ GitHub"│                         │
   │                          │                         │
   │── GET /api/auth/github──►│                         │
   │                          │── 302 Redirect ────────►│
   │◄──────────────── 302 ────│  https://github.com/    │
   │                          │  login/oauth/authorize  │
   │                                                    │
   │────── Follow redirect ─────────────────────────────►
   │                                                    │
   │           User approves on GitHub.com              │
   │                                                    │
   │◄── GitHub redirects to GITHUB_CALLBACK_URL ────────┤
   │    /api/auth/github/callback?code=XXXX             │
   │                          │                         │
   │                          │── POST /login/oauth/access_token ──►
   │                          │◄── { access_token } ────────────────
   │                          │                         │
   │                          │── GET /api/github/user ─────────────►
   │                          │◄── { id, email, name, avatar } ──────
   │                          │                         │
   │                          │  Upsert User in MongoDB │
   │                          │  Sign JWT               │
   │                          │                         │
   │◄── 302 /auth-callback?token=JWT ──│                │
   │                          │                         │
   │  AuthCallbackPage reads  │                         │
   │  token, calls /auth/me   │                         │
   │  navigates to /dashboard │                         │
```

### Google OAuth — Same Flow

The Google flow is identical in structure, but uses different URLs:
- Auth page: `https://accounts.google.com/o/oauth2/v2/auth`
- Token exchange: `https://oauth2.googleapis.com/token`
- Profile: `https://www.googleapis.com/oauth2/v3/userinfo`

---

## 9. Data Flow Walkthroughs

### Repo Import Flow

```
1. User types GitHub URL, clicks "Import"
2. Frontend: POST /api/repo/import { url }
3. Backend: creates Repository doc (status: pending), adds BullMQ job
4. Backend returns { repoId } immediately
5. Frontend listens to socket: socket.on('repoProgress', handler)
6. BullMQ Worker starts:
   a. Clones repo to tmp/ → emits { stage: 'cloning', percent: 20 }
   b. Uploads files to R2 → emits { stage: 'uploading', percent: 50 }
   c. Parses files → saves File docs to MongoDB → emits { stage: 'scanning', percent: 80 }
   d. Sets status = 'complete' → emits { stage: 'complete', percent: 100 }
7. Frontend: ProgressStepper fills up, repo appears in list
```

### AI File Explanation Flow

```
1. User selects file in Files page, clicks "Explain with AI"
2. Frontend: POST /api/ai/explain { repoId, filePath }
3. Backend: checks AISummary cache
   a. Cache hit → return { summary, cached: true } ← immediate
   b. Cache miss → continue:
      - Verify user has Anthropic API key
      - Check aiCallsThisMonth < aiCallsLimit
      - GET file content from R2
      - Call Claude with file content
      - Parse JSON response
      - Save to AISummary collection
      - Create UsageLog record
      - Increment aiCallsThisMonth
      - Return { summary, cached: false }
4. Frontend: renders 4 cards with Purpose, Role, Issues, Tips
```

### PR Review Flow

```
1. User pastes GitHub PR URL, clicks "Analyze PR"
2. Frontend: POST /api/ai/pr-review { url }
3. Backend:
   a. Parses URL → extracts owner, repo, PR number
   b. Checks PRReviewCache → return if found
   c. Fetches diff from GitHub API (raw unified diff format)
   d. Parses diff → counts per-file additions/deletions
   e. Sends diff to Claude → structured JSON review
   f. Saves to PRReviewCache
   g. Returns full review
4. Frontend: shows verdict badge, score gauge, 5-tab results panel
```

---

## 10. Security Model

### Authentication

- **JWT with 7-day expiry**: Tokens are signed with a 64-character random `JWT_SECRET`. Only the server can verify tokens. No session is stored server-side — the token itself is the session.
- **Token storage**: Stored in `localStorage` in the browser. Sent as `Authorization: Bearer <token>` in every API request.
- **Never store passwords**: bcrypt with cost factor 12. Even if the database is leaked, passwords can't be reversed in any practical timeframe.

### Authorization

- Every protected route runs `auth.middleware.js` which verifies the JWT and looks up the user
- Repository ownership is checked in every repo controller: `Repository.findOne({ _id, userId: req.user._id })` — users can only access their own repos
- TeamMember access is a planned extension of this

### API Key Security

- Anthropic API keys are stored in the `User` document in MongoDB
- Never returned in full — only a masked hint is shown (`sk-ant-••••••••••••last6chars`)
- Never logged anywhere

### Rate Limiting

Three layers:
1. **IP-based general limit**: 100 req/15min — prevents basic abuse
2. **IP-based auth limit**: 10/hr — prevents credential stuffing/brute force
3. **User-level AI limit**: 50 AI calls/month — prevents a single free user from running up your Anthropic bill

### CORS

Only the frontend's domain can call the API. The allowed origins list is loaded from environment variables so it can be updated for production.

### HTTP Security Headers (Helmet)

Automatically set by the `helmet` middleware:
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Content-Security-Policy` — limits where the browser can load resources from
- `Strict-Transport-Security` — forces HTTPS in production

---

## 11. Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                   USER'S BROWSER                │
│                                                 │
│  React App (served from Vercel CDN globally)    │
│  → HTTPS calls to backend API                   │
│  → WebSocket to backend for real-time updates   │
└─────────────┬───────────────────────────────────┘
              │ HTTPS / WSS
              ▼
┌─────────────────────────────────────────────────┐
│             RENDER (Backend Server)             │
│                                                 │
│  Node.js / Express server                       │
│  Port 5000 → exposed as https://app.onrender.com│
│  BullMQ Worker runs in same process             │
└──────┬──────────────┬──────────────┬────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────────────┐
│ MongoDB  │   │ Upstash  │   │  Cloudflare R2   │
│  Atlas   │   │  Redis   │   │  (file storage)  │
│ (app data│   │ (job queue│  │  repos/          │
│ users,   │   │  state)  │   │  userId/repoId/  │
│ repos,   │   └──────────┘   │  filepath        │
│ files..) │                  └──────────────────┘
└──────────┘
```

### Vercel (Frontend)

- Serves the static React build from a global CDN
- `vercel.json` configures SPA routing: all URL paths return `index.html` so React Router handles navigation client-side
- Environment variables: `VITE_API_URL` (backend URL) and `VITE_SOCKET_URL` (same backend URL for WebSockets)

### Render (Backend)

- Runs `node server.js` as a persistent web service
- Free tier spins down after 15 minutes of inactivity (first request after sleep is slow ~30s)
- All environment variables set in the Render dashboard

---

## 12. Environment Variables Reference

### Backend (`.env`)

| Variable | Example | Required | Purpose |
|----------|---------|----------|---------|
| `PORT` | `5000` | No | Port to listen on (Render sets this automatically) |
| `NODE_ENV` | `production` | No | Controls logging format and behavior |
| `MONGODB_URI` | `mongodb+srv://...` | **Yes** | MongoDB Atlas connection string |
| `JWT_SECRET` | `64-char-hex-string` | **Yes** | Signs and verifies JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | No | Token lifetime (default 7 days) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | No | Platform-level key (not used for user calls) |
| `R2_ACCOUNT_ID` | `abc123` | **Yes** | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | `...` | **Yes** | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | `...` | **Yes** | R2 API secret key |
| `R2_BUCKET_NAME` | `codeatlas-repos` | **Yes** | Name of the R2 bucket |
| `R2_ENDPOINT` | `https://{id}.r2.cloudflarestorage.com` | **Yes** | R2 endpoint URL |
| `REDIS_URL` | `rediss://default:...@host:6379` | **Yes** | Upstash Redis connection string |
| `GITHUB_CLIENT_ID` | `Ov23...` | **Yes** | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | `...` | **Yes** | GitHub OAuth App secret |
| `GITHUB_CALLBACK_URL` | `https://backend.onrender.com/api/auth/github/callback` | **Yes** | Must match GitHub OAuth App settings |
| `GOOGLE_CLIENT_ID` | `....apps.googleusercontent.com` | **Yes** | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | **Yes** | Google OAuth secret |
| `GOOGLE_CALLBACK_URL` | `https://backend.onrender.com/api/auth/google/callback` | **Yes** | Must match Google Console settings |
| `FRONTEND_URL` | `https://app.vercel.app` | **Yes** | Used for CORS and OAuth redirects |
| `BACKEND_URL` | `https://backend.onrender.com` | **Yes** | Used for team invite links |
| `ALLOWED_ORIGINS` | `https://other-domain.com` | No | Comma-separated extra CORS origins |

### Frontend (Vite env)

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `https://backend.onrender.com/api` | All API calls go here |
| `VITE_SOCKET_URL` | `https://backend.onrender.com` | Socket.io connection URL (no /api suffix) |

---

*Document generated for CodeAtlas AI v1.0 — Built with Node.js, Express, MongoDB, Redis, BullMQ, Socket.io, React, Vite, TailwindCSS, React Flow, Monaco Editor, Anthropic Claude, Cloudflare R2, GitHub OAuth, and Google OAuth.*
