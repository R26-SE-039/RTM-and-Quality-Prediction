# Component 4: ML-Based Test Quality Prediction & Requirements Traceability Matrix

Full-stack implementation: FastAPI + SQLAlchemy + PostgreSQL backend, scikit-learn
quality model, and a React (Vite) dashboard.

## Project structure

```
/backend
  /app
    main.py            FastAPI app, CORS, router registration
    config.py           Settings (pydantic-settings) — single source of truth for
                         GITHUB_USERNAME/GITHUB_TOKEN/COVERAGE_JOB_TIMEOUT_SECONDS
    database.py         SQLAlchemy engine/session
    models.py            ORM models (7 tables)
    schemas.py           Pydantic request/response models
    services.py          RTM generation, gap detection, portfolio analysis logic
    seed.py               Sample data loader
    /ml
      weights.py          Shared weighted-formula baseline + feature order
      train_model.py       Trains & saves RandomForestRegressor (model.joblib)
      predict.py            Runtime scoring (ML model, falls back to formula)
    /routers
      quality.py           Test CRUD, coverage, POST .../predict-quality
      rtm.py                 Requirements/AC CRUD, GET/POST /api/rtm, /api/rtm/regenerate
      gaps.py                 GET /api/rtm/gaps
      portfolio.py             GET /api/portfolio/analysis
      project.py                GET/PUT /api/project-settings (singleton project metadata)
      dashboard.py                GET /api/dashboard/summary (stat cards + trend + coverage donut)
      coverage.py                 POST /api/coverage/analyze, GET /status, GET /report
      github.py                    GET /api/github/status (connection health check)
    /coverage             GitHub coverage feature (see section below)
      identity.py          Verifies credentials actually work — distinguishes
                            missing / invalid-token / username-mismatch / valid
      github_client.py     GitHub REST API wrapper (identity, repo, collaborator check)
      access_control.py     Owner/collaborator gate — raises AccessDenied or GitHubAPIError
      clone.py                Shallow git clone via a short-lived auth header (no token in URL)
      language.py               Detects Python vs JS/TS from repo-root marker files
      python_runner.py            venv + pytest --cov + coverage.json parsing
      js_runner.py                  npm + jest --coverage + coverage-summary.json parsing
      coverage_math.py                Shared statement/branch/overall % helpers
      state.py                          Run lock + CoverageReport (singleton row) persistence
      runner.py                           Background job orchestration
  requirements.txt
  init_db.sql            Raw-SQL equivalent of the schema (reference only)
  .env.example
/frontend
  /src
    api/client.js        axios client, one function per endpoint
    components/          Sidebar, Layout, Modal, AddMatrixRecordModal, StatusBadge, RiskBadge,
                         LogTerminal (live coverage-run log panel), ConcentricRings
    pages/                Dashboard, RTMMatrix, TestInventory, QualityPrediction,
                           CodeCoverage, Gaps, Portfolio, RequirementDetail
  .env.example
docker-compose.yml      Postgres 16 container
```

### Frontend UI

Built with Tailwind CSS v4 (via `@tailwindcss/vite`), `lucide-react` icons,
and `recharts`. A fixed left `Sidebar` links to six pages; `Layout` wraps
every route in the sidebar + light-lavender content area:

- **Dashboard** (`/dashboard`) — 4 gradient stat cards (tests analyzed, avg
  quality score, coverage rate, success rate), an area chart of quality/
  coverage trend (bucketed by test creation date — see note below), and a
  donut chart of requirement coverage. All data from `GET /api/dashboard/summary`.
- **RTM Matrix** (`/rtm`) — editable project info box (`GET`/`PUT
  /api/project-settings`), Refresh / Auto-Generate Matrix / Add Matrix
  Record / Download PDF Report actions, 4 stat cards, and the full RTM as a
  flattened requirement×test table. "Add Matrix Record" opens a modal that
  creates a requirement (with source/type/WBS deliverables) plus an
  optional acceptance criterion and test in one flow. PDF export runs
  client-side via `jspdf`/`jspdf-autotable` — no backend involved.
- **Test Inventory** (`/inventory`), **Quality Prediction**
  (`/quality-prediction`), **Coverage Gaps** (`/gaps`), **Code Coverage**
  (`/coverage`) — supporting pages reachable from the sidebar.
- **Portfolio Analysis** (`/portfolio`) and requirement detail
  (`/requirements/:id`) — still fully functional, reached by drill-down
  links (Test Inventory → Portfolio, RTM Matrix row → requirement detail)
  rather than top-level sidebar items, since the sidebar spec has a fixed
  six-item list.

## GitHub Code & Branch Coverage feature

Lets you point the app at a GitHub repo and get real statement/branch
coverage by actually cloning it and running its test suite.

### Setup

1. Create a GitHub Personal Access Token (classic `repo` scope, or a
   fine-grained token with read access to Contents + Metadata, plus enough
   access to query collaborators on repos you want to analyze).
2. Add to `backend/.env` (never commit real values — already gitignored):
   ```
   GITHUB_USERNAME=your-github-username
   GITHUB_TOKEN=ghp_your_token_here
   ```
3. Restart the backend. The frontend never sees the token — every GitHub
   API call happens server-side in `app/coverage/github_client.py`. Both
   values are read once at startup into a single `app.config.settings`
   object (`pydantic-settings`) — nothing else reads `os.environ` directly.

### Connection status

`GET /api/github/status` verifies the configured credentials actually work
and is what drives the "GitHub MCP Connected/Disconnected" badge on the
Code Coverage page (checked once when the page loads):

- **Missing:** `GITHUB_USERNAME`/`GITHUB_TOKEN` not set →
  `"GitHub credentials are not configured on the backend. Set GITHUB_USERNAME
  and GITHUB_TOKEN in backend/.env and restart the server."`
- **Invalid/expired token:** the GitHub API rejects it with 401 →
  `"GitHub authentication failed. Check that your token is valid and has not
  expired."`
- **Username mismatch:** the token authenticates fine, but as a different
  user than `GITHUB_USERNAME` names → `"Username mismatch: the token belongs
  to '<real-login>', but GITHUB_USERNAME is set to '<configured>'."`
- **Valid:** `{"connected": true, "reason": null, "username": "<login>"}`

`app/coverage/identity.py` holds this logic and is reused by
`access_control.check_access` (so a bad/expired token surfaces the same
specific message when you try to run an analysis, not just when checking
the badge).

### Access control

`POST /api/coverage/analyze` first calls the GitHub API to confirm the
token's identity, then checks the target repo: analysis is allowed only if
the repo's owner matches `GITHUB_USERNAME`, or if `GITHUB_USERNAME` has
**explicit collaborator access** (checked via GitHub's dedicated
`/repos/{owner}/{repo}/collaborators/{username}` endpoint — not the repo's
`permissions.pull` field, which is `true` for any public repo regardless of
collaborator status). Anything else returns `403 Access denied: you don't
have permission to analyze this repository.` This check is synchronous and
fast (a couple of API calls); only the actual clone + test run is
backgrounded and polled via `GET /api/coverage/status`.

### Live execution logs

Every analysis run — successful, failed, or access-denied — produces a
timestamped, step-by-step log transcript (`app/coverage/state.append_log`),
persisted on the same `CoverageReport` row and returned by both
`GET /api/coverage/status` and `GET /api/coverage/report` as a `logs` array.
The frontend polls `/status` every second while `RUNNING` and renders the
transcript in a terminal-style panel (`LogTerminal.jsx`), color-coded by
level (info/success/error/tip). Because the access-control gate itself logs
("🔑 Authenticating...", then either "✅ Access granted" or "❌ Error:
Access denied...") before the background job even starts, a repo you don't
have access to shows the same live-transcript experience as a real run —
there's no separate "silent" error path.

### What actually runs, and its limits

On an allowed repo, the backend shallow-clones it (auth passed via a
short-lived `git -c http.extraHeader`, never embedded in the URL), then
scans the repo root **and one level of subdirectories** for recognizable
project roots (`app/coverage/language.py: find_project_dirs`) — this covers
a typical MERN-style `client/` + `server/` layout, or any simple monorepo,
as multiple projects rather than requiring one stack at the repo root.
Every detected project is analyzed and the results are merged into one
report, with per-file paths prefixed by their subdirectory
(`server/app.py`, `client/src/App.js`, ...) and the top-level
statement/branch percentages combined as a **weighted** average (by
statement/branch count, not a naive average of percentages), so a large
project isn't diluted by a tiny one.

> **Auth scheme note:** the clone header uses HTTP **Basic** auth
> (`Authorization: Basic base64(username:token)`), not `Bearer` — GitHub's
> git-over-HTTPS smart protocol on `github.com` responds `401` +
> `WWW-Authenticate: Basic` to a Bearer token, even though `api.github.com`
> (used everywhere else in this app, via `github_client.py`) accepts Bearer
> fine. Confirmed against a real repo with a real token; without
> `GIT_TERMINAL_PROMPT=0` set on the subprocess, a rejected header also
> surfaces as an opaque `Device not configured` / `could not read Username`
> error instead of a clear auth failure, since git falls back to an
> interactive credential prompt that has no terminal to talk to in a
> background thread.

Per detected project:

- **Python:** creates a fresh venv, installs `pytest`/`pytest-cov`/
  `coverage` plus the repo's own `requirements.txt`, runs
  `pytest --cov --cov-branch --cov-report=json`, parses coverage.py's JSON
  report.
- **JS/TS:** runs `npm ci`/`npm install`, then picks the test runner from
  `package.json`'s declared dependencies — **Jest**
  (`jest --coverage --coverageReporters=json-summary`) or **Mocha**
  (wrapped in `nyc --reporter=json-summary`, since nyc is a coverage
  instrumentor rather than a test framework — it doesn't need to be a
  declared dependency, the same way `pytest-cov` isn't required from Python
  repos). Vitest and other JS runners, and any non-Python/non-JS stack
  (Java, Go, Ruby, PHP, .NET, ...), aren't wired up yet — an undetected
  stack logs a clear "not yet supported" error (naming what *is*
  supported) instead of a silent or fake result. The runner dispatch is a
  small registry (`runner.py: _run_coverage_tool`), so adding another
  ecosystem is a scoped addition, not a rewrite.

"Overall coverage" is defined uniformly as the average of statement and
branch coverage (not each tool's own differently-defined blended metric),
so ecosystems are comparable.

**This executes the analyzed repo's own test suite and install scripts on
the backend host** — pip/npm installs can run arbitrary setup code, and so
can the tests themselves. There's a per-step timeout
(`COVERAGE_JOB_TIMEOUT_SECONDS`, default 300s) and each run happens in a
throwaway temp directory that's deleted afterward, but there is **no
container/VM sandboxing**. The access-control rule restricts this to repos
you own or are an explicit collaborator on, which is the right boundary for
a personal QA tool — it is not sufficient isolation to point at arbitrary
third-party repos, and shouldn't be exposed that way.

> **Verification note:** the access-control logic and all four
> connection-status outcomes (missing/invalid/mismatch/valid) were verified
> with mocked GitHub responses; the Python (pytest), Jest, and Mocha+nyc
> coverage-parsing pipelines, plus monorepo detection with weighted
> aggregation, were verified against local synthetic sample projects
> (including a synthetic `client/`+`server/` monorepo). The feature has also
> been run for real end-to-end against a live GitHub repo with a real token
> — real clone, real `pytest --cov` execution, real numbers through to the
> UI, with the log panel visibly growing across repeated polls during the
> run — which is what surfaced the Basic-vs-Bearer auth mismatch noted
> above. The access-denied path was also verified against a real
> not-owned public repo, confirming the log transcript (not just a bare
> error) renders for that path too.

> **Trend chart note:** the backend only stores current-state data, not
> historical daily snapshots. `services.compute_dashboard_summary` buckets
> test cases by their `created_at` date to build a real (if sparse) trend
> line — with fresh seed data (all created the same day) this renders as a
> flat line rather than a multi-day trend.

## Database schema

7 tables, created automatically on backend startup via SQLAlchemy
(`Base.metadata.create_all`) — no migration step required. `init_db.sql` has
the equivalent raw SQL if you want to inspect or hand-run it.

- `requirements` — id, title, description, source, req_type,
  wbs_deliverables, created_at
- `acceptance_criteria` — id, requirement_id FK, description
- `test_cases` — id, title, steps, acceptance_criteria_id FK, 5 ML feature
  columns (assertion_strength, coverage_percent, boundary_coverage,
  error_handling, mutation_resistance), quality_score, status
- `code_coverage` — id, test_case_id FK, module_name, coverage_percent
- `rtm_entries` — materialized RTM rows (requirement → AC → test → status),
  regenerated whenever the underlying requirement/AC/test data changes
- `coverage_gaps` — id, requirement_id FK, risk_level, recommendation
- `portfolio_actions` — id, test_case_id FK, action_type
  (redundant/critical/weak), reason
- `project_settings` — singleton row (project_name, project_manager,
  project_description) shown/edited on the RTM Matrix page

`source`/`req_type`/`wbs_deliverables` and `project_settings` were added
after the initial schema via `ALTER TABLE ... ADD COLUMN` (existing data
preserved) — see `init_db.sql` for the current full schema.

## How to run

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts Postgres 16 on **host port 5433** (mapped to container port 5432)
to avoid colliding with any other local Postgres instance. Credentials:
`rtm_user` / `rtm_password`, database `rtm_db`.

> If port 5433 is also taken on your machine, edit `docker-compose.yml`'s
> port mapping and `backend/.env`'s `DATABASE_URL` to match.

### 2. Backend (FastAPI, port 8000)

```bash
cd backend
python3.11 -m venv venv        # 3.11 recommended for wheel compatibility
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # adjust DATABASE_URL / CORS_ORIGINS if needed

python -m app.ml.train_model   # trains and saves the quality model (~few seconds)
python -m app.seed             # loads sample requirements/tests (idempotent — skips if data exists)

uvicorn app.main:app --reload --port 8000
```

Tables are created automatically on startup. Verify with:

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/rtm
```

### 3. Frontend (React/Vite, port 5173)

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:8000
npm run dev
```

Open the printed URL (normally http://localhost:5173 — Vite will pick the
next free port, e.g. 5174, if 5173 is occupied by another process on your
machine; if so, add that origin to `CORS_ORIGINS` in `backend/.env` and
restart the backend).

## Sub-objectives implemented

**4.1 — Test Quality Prediction.** `app/ml/train_model.py` trains a
`RandomForestRegressor` on synthetic data labeled by the weighted formula
(assertion 25% / coverage 30% / boundary 20% / error-handling 15% /
mutation-resistance 10%) plus noise. `app/ml/predict.py` loads the saved
model at runtime and falls back to the pure weighted formula if no model
file is present. `POST /api/tests/{id}/predict-quality` scores the test,
sets `status=approved` or `rejected` (score < 60), and triggers an RTM
recompute for the parent requirement.

**4.2 — Automated RTM Generation.** `services.recompute_rtm_for_requirement`
deletes and rebuilds `rtm_entries` for a requirement, and is called from
every write path that can affect coverage (creating a requirement, an
acceptance criterion, a test case, adding code coverage, or scoring a
test). `GET /api/rtm` / `GET /api/rtm/{id}` build the nested JSON matrix
(requirement → AC → tests) from live data, computing FULLY COVERED /
PARTIAL / NOT COVERED per requirement.

**4.3 — Coverage Gap Detection.** `services.classify_risk` keyword-matches
requirement title/description against CRITICAL (payment, auth, security,
compliance…), HIGH (error handling, validation, data integrity…), and
MEDIUM (performance, UI, reporting…) term lists, defaulting to LOW.
`GET /api/rtm/gaps` recomputes gaps for every non-fully-covered requirement
and returns them sorted by risk, each with a generated recommendation
naming the uncovered acceptance criteria and suggested test names.

**4.4 — Test Portfolio Management.** `GET /api/portfolio/analysis` groups
tests by acceptance criteria and flags near-duplicate titles (via
`difflib.SequenceMatcher`, threshold 0.6) as **redundant** (keeping the
higher-quality test); flags approved tests on CRITICAL/HIGH-risk
requirements as **critical**; flags tests scoring below 60 as **weak**,
regardless of category overlap.

## Sample data

`python -m app.seed` loads 5 requirements (auth, payment, search,
notifications, profile) spanning fully-covered, partially-covered, and
uncovered states, with realistic ML feature values so the quality model,
gap detection, and portfolio analysis all have real signal to work with on
first run.
# RTM-and-Quality-Prediction
