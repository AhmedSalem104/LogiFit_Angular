<p align="center">
  <img src="https://img.icons8.com/clouds/200/dumbbell.png" alt="LogicFit Logo" width="150"/>
</p>

<h1 align="center">LogicFit</h1>

<p align="center">
  <strong>A Modern, Multi-Tenant Gym Management SaaS</strong>
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-features">Features</a> •
  <a href="#-saas-architecture">SaaS</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-api-integration">API</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 18"/>
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/PrimeNG-17-DD0031?style=for-the-badge&logo=primeng&logoColor=white" alt="PrimeNG"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Multi--Tenant-SaaS-6366F1?style=flat-square" alt="Multi-Tenant"/>
  <img src="https://img.shields.io/badge/RBAC-Permissions-0EA5E9?style=flat-square" alt="RBAC"/>
  <img src="https://img.shields.io/badge/White--Label-Branding-8B5CF6?style=flat-square" alt="White Label"/>
  <img src="https://img.shields.io/badge/i18n-AR%20%2F%20EN%20RTL-F59E0B?style=flat-square" alt="i18n"/>
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel" alt="Vercel"/>
</p>

---

## 📋 Overview

**LogicFit** is a comprehensive, **multi-tenant SaaS** platform for managing gyms end-to-end. Each gym is an isolated tenant with its own members, staff, finances, inventory, and white-label branding. The app serves **seven roles** across three panels (back-office, coaching, and client self-service), with fine-grained permission control, automatic session refresh, and a full gym-to-platform subscription & billing flow.

The UI is fully responsive with first-class **Arabic (RTL)** and **English (LTR)** support, plus **Dark / Light** themes.

> 🔗 The **backend** exposes two APIs sharing one database: a **Tenant API** (this app) and a separate **Platform API** for the super-admin dashboard (gym approval, plan management, payment review).

---

## ✨ Features

### 🏢 Back-Office (Owner / Manager / Receptionist / Accountant)
| Area | Capabilities |
|------|--------------|
| 📊 **Dashboards** | Real-time KPIs, revenue charts, and an operations dashboard |
| 👥 **Members & Coaches** | Members, coaches, membership cards, and electronic gate access (QR / card / biometric) |
| 💳 **Client Subscriptions** | Plans, subscriptions, freeze / renew / cancel, and attendance |
| 🏢 **Facilities** | Branches, rooms, equipment, and maintenance tickets |
| 🗓️ **Group Classes** | Class types and scheduling with enrollments |
| 💰 **Finance** | Invoices, payments, expenses & categories, coupons, and tax settings |
| 🛒 **Inventory & POS** | Point of sale, products & categories, stock movements, and suppliers |
| 🧑‍💼 **HR & Payroll** | Employees, shifts, leaves, commissions, and payroll runs |
| 📈 **Reports** | General and operational reporting |
| ⭐ **Platform Billing** | Manage the gym's own subscription to the LogicFit platform |
| ⚙️ **Settings** | Gym profile, white-label branding, and preferences |

### 🏋️ Coaching (Coach / Trainer)
| Feature | Description |
|---------|-------------|
| 👨‍🏫 **Trainee Management** | View and manage assigned trainees and their progress |
| 📋 **Workout Programs** | Wizard builder with live muscle-distribution analysis |
| 🥗 **Diet Plans** | Personalized nutrition plans with macros |
| 💪 **Libraries** | Exercises, foods, and muscles databases |
| 📏 **Measurements** | Body measurement tracking |
| 💬 **Engagement** | Appointments, chat, and challenges |

### 🏃 Client Self-Service
| Feature | Description |
|---------|-------------|
| 🏠 **Dashboard** | Overview of the fitness journey |
| 📅 **My Program & Sessions** | View routines and log workout sessions (weight / reps / RPE) |
| 🥗 **My Diet & Meal Log** | Access meal plans and log meals |
| 📊 **Progress & Measurements** | Visualize improvements and history |
| 💳 **My Subscriptions** | Manage gym membership |
| 💬 **Chat & Challenges** | Communicate with the coach and join challenges |

---

## 🏛️ SaaS Architecture

LogicFit ships with a complete SaaS layer on top of the gym feature set.

### 🔑 Multi-Tenancy
- Every gym is an isolated **tenant**; all data is scoped by `tenantId` carried in the JWT.
- The tenant is resolved from the **subdomain** (`goldgym.logicfit.com`) at startup — no public gym list is exposed on branded domains.

### 🎨 White-Label Branding
- On app start, an `APP_INITIALIZER` fetches `GET /api/branding/{subdomain}` (anonymous) and applies the gym's **colors, logo, font, app name, and custom CSS** — before the first paint.
- Cached for a flash-free load; owners edit branding from **Gym Settings**.

### 🛡️ Roles & Permissions (RBAC)
Seven roles map onto two back-end panels; access **inside** a panel is governed by a permission catalog.

| Role | Panel | Default Permissions |
|------|-------|---------------------|
| **Owner** | Back-office | All gym permissions |
| **Manager** | Back-office | All except Settings & Platform Billing |
| **Receptionist** | Back-office | Members, Attendance, Client Subscriptions, POS |
| **Accountant** | Back-office | Finance, Reports, Platform Billing |
| **Coach** | Coaching | View Members, Attendance, Reports (own trainees) |
| **Trainer** | Coaching | Coaching self-service |
| **Client** | Self-service | Personal self-service screens only |

- Permissions drive the UI via `AuthService.hasPermission()` and the `*appHasPermission` structural directive; the sidebar is permission-filtered.
- **Permission catalog:** `ManageMembers`, `ViewMembers`, `ManageCoaches`, `ManageAttendance`, `ManageClientSubscriptions`, `ManagePOS`, `ManageInventory`, `ManageEmployees`, `ManageBranches`, `ManageFinance`, `ViewReports`, `ManageReports`, `ManageSettings`, `ManageTenantBilling`.

### 💳 Platform Subscription & Billing
The gym owner subscribes the gym to the LogicFit platform (paid manually, reviewed by the platform admin):

```
plans → select-plan → payment-methods → upload proof → (admin approves) → active
```
- Plan tiers with limits (max members / coaches / branches / employees / storage) and feature flags.
- **Usage-vs-limit** progress bars, invoices, and a full **payment-proof upload** flow with request history and reject reasons.

### 🔒 Authentication & Sessions
- **JWT** with a **15-minute access token** + **refresh token**.
- Transparent **auto-refresh** on `401` (single-flight — one refresh, queued retries); falls back to logout when refresh fails.
- `logout-all` invalidates every device session.
- **Plan-limit gating:** a `402 Payment Required` response routes owners to the upgrade screen.

---

## 🛠️ Tech Stack

### Frontend Framework
```
Angular 18 (Standalone Components)
├── Signals for state management (no NgRx)
├── New control flow (@if, @for, @switch)
├── Lazy-loaded, role-based routes
└── Functional HTTP interceptors & guards
```

### UI, State & Tooling
| Technology | Usage |
|------------|-------|
| **PrimeNG 17** | Rich UI component library |
| **TailwindCSS 3.4** | Utility-first styling |
| **PrimeIcons** | Icon set |
| **NgxCharts** (`@swimlane/ngx-charts`) | Data visualization |
| **SweetAlert2** | Dialogs & confirmations |
| **Angular Signals** | Reactive state management |
| **RxJS** | Reactive async & interceptor flows |
| **ngx-translate** | i18n (AR / EN) with full RTL |
| **jsPDF + jspdf-autotable** | PDF export (RTL-aware) |
| **docx / file-saver** | Word & file export |

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ · npm 9+ · Angular CLI 18+

### Setup
```bash
# 1) Clone
git clone https://github.com/AhmedSalem104/LogiFit_Angular.git
cd LogiFit_Angular

# 2) Install
npm install

# 3) Run
ng serve            # http://localhost:4200
```

### Environment
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://logicfit.runasp.net/api',   // Tenant API
  platformUrl: 'https://logicfit-platform.runasp.net', // Platform (gym signup)
  tokenKey: 'logicfit_token',
  refreshTokenKey: 'logicfit_refresh_token',
  userKey: 'logicfit_user',
  permissionsKey: 'logicfit_permissions',
  tenantIdKey: 'logicfit_tenant_id',
  brandingKey: 'logicfit_branding',
  // ...theme & language keys
};
```

> 💡 On `localhost` there's no subdomain, so the login screen falls back to a manual gym picker for convenience.

### Build for Production
```bash
ng build --configuration=production
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── guards/            # authGuard, guestGuard, role/permission guards
│   │   │   ├── interceptors/      # jwt + error (auto-refresh, 402/403 handling)
│   │   │   ├── models/            # auth models, roles, Permission catalog
│   │   │   └── services/          # AuthService (tokens, permissions, refresh)
│   │   ├── layout/                # main / auth layouts, header, sidebar (RBAC-filtered)
│   │   └── services/              # branding, export, chat, notifications, storage...
│   │
│   ├── features/
│   │   ├── auth/                  # login, register, register-gym (→ platform), reset-password
│   │   ├── owner/                 # back-office suite (35+ modules)
│   │   │   ├── clients, coaches, subscriptions, invoices, payments,
│   │   │   ├── products, stock, employees, payroll, branches, reports...
│   │   │   ├── subscription/      # ⭐ platform billing (plans, usage, payment proof, invoices)
│   │   │   └── services/          # domain-split services (finance, hr, inventory...)
│   │   ├── coach/                 # trainees, workout/diet builders, libraries...
│   │   └── client/                # program, sessions, diet, progress, subscriptions...
│   │
│   ├── shared/
│   │   ├── components/            # page-header, stat-card, chart-card, wizard-stepper...
│   │   ├── directives/            # *appHasPermission (RBAC directive)
│   │   └── models/                # api.models.ts, gym-management.models.ts
│   │
│   └── state/                     # theme.state.ts (signals: theme, language, sidebar)
│
├── assets/i18n/                   # ar.json / en.json
├── environments/
└── docs/PROJECT_REFERENCE.md      # full technical reference
```

---

## 🔌 API Integration

Base URL: **`{apiUrl}`** — all protected requests send `Authorization: Bearer <accessToken>`.

### Authentication
```http
POST /api/auth/login              # { phoneNumber, password, tenantId }
POST /api/auth/register           # creates a Client account
POST /api/auth/refresh            # rotate tokens (auto-called on 401)
POST /api/auth/logout-all         # invalidate all sessions
POST /api/auth/forget-password    # { phoneNumber, tenantId } → resetToken
POST /api/auth/reset-password     # { phoneNumber, resetToken, newPassword, tenantId }
GET  /api/branding/{identifier}   # white-label branding (anonymous)
```

### Platform Subscription (Owner · `ManageTenantBilling`)
```http
GET  /api/tenant/plans
GET  /api/tenant/my-subscription
GET  /api/tenant/usage
GET  /api/tenant/invoices
GET  /api/tenant/payment-methods
POST /api/tenant/subscription/select-plan | upgrade | renew
POST /api/tenant/payment-requests          # multipart: proof of payment
GET  /api/tenant/payment-requests
```

### Feature Areas (permission-gated)
```http
Members      /api/clients, /api/coaches, /api/membershipcards      # ManageMembers / ManageCoaches
Finance      /api/invoices, /api/payments, /api/expenses, /api/coupons   # ManageFinance
Inventory    /api/products, /api/stock, /api/suppliers, /api/sales  # ManageInventory / ManagePOS
HR           /api/employees, /api/shifts, /api/leaves, /api/payroll # ManageEmployees
Facilities   /api/branches, /api/rooms, /api/equipment             # ManageBranches
Coaching     /api/workoutprograms, /api/dietplans, /api/exercises  # ownership-checked
Reports      /api/reports/*, /api/operations-dashboard             # ViewReports
```

> 📎 The full endpoint map, enums, and conventions live in [`docs/PROJECT_REFERENCE.md`](docs/PROJECT_REFERENCE.md).

### Unified Error Handling
| Status | Meaning | Frontend behavior |
|--------|---------|-------------------|
| `400` | Validation | Show per-field errors |
| `401` | Token expired | Silent refresh + retry, else logout |
| `402` | Plan limit / feature not included | Redirect to upgrade screen |
| `403` | No permission | Hide/disable the element |
| `409` | Conflict | Show message |

---

## 🎨 Theming & Internationalization

- **Themes:** Dark / Light via a `dark` class on `<html>`, persisted in `localStorage`.
- **Branding:** tenant colors/logo/font/custom-CSS applied at startup (white-label).
- **Languages:** 🇸🇦 Arabic (RTL) · 🇺🇸 English (LTR) — toggled via `ThemeState`, translations in `assets/i18n`.

```typescript
themeState.toggleDarkMode();   // switch theme
themeState.setLanguage('ar');  // switch language (sets RTL)
```

---

## 🚀 Deployment

### Vercel (Recommended)
1. Import the project from GitHub.
2. Configure — **Build:** `npm run build` · **Output:** `dist/logicfit-app/browser`.
3. Deploy.

### Docker
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/logicfit-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Ahmed Salem**

[![GitHub](https://img.shields.io/badge/GitHub-AhmedSalem104-181717?style=for-the-badge&logo=github)](https://github.com/AhmedSalem104)

---

<p align="center"><strong>Built with ❤️ using Angular</strong></p>
<p align="center"><a href="#top">⬆️ Back to Top</a></p>
