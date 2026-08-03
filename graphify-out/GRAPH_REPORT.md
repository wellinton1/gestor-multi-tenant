# Graph Report - app  (2026-08-02)

## Corpus Check
- Corpus is ~14,610 words - fits in a single context window. You may not need a graph.

## Summary
- 227 nodes · 446 edges · 18 communities
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Server & Route Wiring
- Dependencies & Package Config
- Admin SPA: Core & Auth UI
- Admin SPA: Modals & Forms
- Client Portal SPA
- Portal API & Booking Logic
- Admin SPA: Business Pages
- Admin SPA: Pages & Routing
- Auth Middleware & CRUD Factory
- Appointments API
- Cash Closings API
- Security Audit API
- Admin SPA: Settings & Users
- Establishments API
- Password Management API
- Users API
- Auth API
- Dashboard API

## God Nodes (most connected - your core abstractions)
1. `api()` - 32 edges
2. `escapeHtml()` - 25 edges
3. `toast()` - 25 edges
4. `renderAppShell()` - 18 edges
5. `showModal()` - 15 edges
6. `closeModal()` - 14 edges
7. `renderSelector()` - 12 edges
8. `renderCashClosingPage()` - 11 edges
9. `renderConfiguracoesPage()` - 11 edges
10. `requireLogin()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --calls--> `findAvailablePort()`  [EXTRACTED]
  server.js → src/utils/port.js
- `makeCrudRouter()` --indirect_call--> `requireLogin()`  [INFERRED]
  src/routes/makeCrudRouter.js → src/middleware/auth.js
- `makeCrudRouter()` --indirect_call--> `requireEstablishment()`  [INFERRED]
  src/routes/makeCrudRouter.js → src/middleware/auth.js

## Import Cycles
- None detected.

## Communities (18 total, 0 thin omitted)

### Community 0 - "Server & Route Wiring"
Cohesion: 0.05
Nodes (36): app, appointmentsRoutes, authLimiter, authRoutes, cashClosingsRoutes, clientsRoutes, cookieParser, crypto (+28 more)

### Community 1 - "Dependencies & Package Config"
Cohesion: 0.06
Nodes (30): bcryptjs, cookie-parser, dotenv, express, express-rate-limit, express-session, helmet, dependencies (+22 more)

### Community 2 - "Admin SPA: Core & Auth UI"
Cohesion: 0.18
Nodes (18): applyTheme(), boot(), cachedClients, cachedEmployees, cachedServices, establishments, getTheme(), ICONS (+10 more)

### Community 3 - "Admin SPA: Modals & Forms"
Cohesion: 0.44
Nodes (14): closeModal(), escapeHtml(), loadAdminUsers(), openAssociateModal(), openClientModal(), openCreateUserModal(), openEmployeeModal(), openNewEstablishmentModal() (+6 more)

### Community 4 - "Client Portal SPA"
Cohesion: 0.23
Nodes (13): availableSlots, boot(), escapeHtml(), formatDuration(), formatMoney(), getCsrfToken(), getEstablishmentId(), NICHE_ICON (+5 more)

### Community 5 - "Portal API & Booking Logic"
Cohesion: 0.18
Nodes (10): availableTimesQuerySchema, bookingSchema, express, { normalizeSelectedServices, buildServiceSummary }, router, store, { v4: uuid }, { z } (+2 more)

### Community 6 - "Admin SPA: Business Pages"
Cohesion: 0.24
Nodes (12): filterLastMonth(), formatDateTime(), formatMoney(), loadSecurityInspection(), openAppointmentModal(), openCashClosingModal(), renderCashClosingPage(), renderDashboardPage() (+4 more)

### Community 7 - "Admin SPA: Pages & Routing"
Cohesion: 0.42
Nodes (9): currentRoute(), logout(), mainEl(), render(), renderAppShell(), renderClientesPage(), renderSegurancaPage(), renderSenhasPage() (+1 more)

### Community 8 - "Auth Middleware & CRUD Factory"
Cohesion: 0.33
Nodes (7): requireEstablishment(), requireLogin(), express, makeCrudRouter(), { requireLogin, requireEstablishment }, store, { v4: uuid }

### Community 9 - "Appointments API"
Cohesion: 0.25
Nodes (6): express, { requireLogin, requireEstablishment }, router, store, { v4: uuid }, VALID_STATUSES

### Community 10 - "Cash Closings API"
Cohesion: 0.25
Nodes (6): bcrypt, express, { requireLogin, requireEstablishment }, router, store, { v4: uuid }

### Community 11 - "Security Audit API"
Cohesion: 0.25
Nodes (7): bcrypt, express, fs, path, { requireLogin }, router, store

### Community 12 - "Admin SPA: Settings & Users"
Cohesion: 0.48
Nodes (7): api(), getCsrfToken(), loadEstablishmentUsers(), openNewUserModal(), renderConfiguracoesPage(), saveBusinessHours(), setupBusinessHoursUI()

### Community 13 - "Establishments API"
Cohesion: 0.29
Nodes (5): express, { requireLogin }, router, store, { v4: uuid }

### Community 14 - "Password Management API"
Cohesion: 0.29
Nodes (5): bcrypt, express, { requireLogin }, router, store

### Community 15 - "Users API"
Cohesion: 0.29
Nodes (5): bcrypt, express, { requireLogin, requireEstablishment }, router, store

### Community 16 - "Auth API"
Cohesion: 0.33
Nodes (5): bcrypt, express, { requireLogin }, router, store

### Community 17 - "Dashboard API"
Cohesion: 0.40
Nodes (4): express, { requireLogin, requireEstablishment }, router, store

## Knowledge Gaps
- **119 isolated node(s):** `name`, `version`, `description`, `main`, `node` (+114 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireLogin()` connect `Auth Middleware & CRUD Factory` to `Appointments API`, `Cash Closings API`, `Security Audit API`, `Establishments API`, `Password Management API`, `Users API`, `Auth API`, `Dashboard API`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `renderAppShell()` (e.g. with `logout()` and `renderCashClosingPage()`) actually correct?**
  _`renderAppShell()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _119 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Server & Route Wiring` be split into smaller, more focused modules?**
  _Cohesion score 0.05110336817653891 - nodes in this community are weakly interconnected._
- **Should `Dependencies & Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._