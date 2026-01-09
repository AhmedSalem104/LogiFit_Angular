<p align="center">
  <img src="https://img.icons8.com/clouds/200/dumbbell.png" alt="LogicFit Logo" width="150"/>
</p>

<h1 align="center">LogicFit</h1>

<p align="center">
  <strong>A Modern Gym Management System</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#project-structure">Structure</a> •
  <a href="#api-integration">API</a> •
  <a href="#screenshots">Screenshots</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 18"/>
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/PrimeNG-17-DD0031?style=for-the-badge&logo=primeng&logoColor=white" alt="PrimeNG"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel" alt="Vercel"/>
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" alt="PRs Welcome"/>
  <img src="https://img.shields.io/github/last-commit/AhmedSalem104/LogiFit_Angular?style=flat-square" alt="Last Commit"/>
</p>

---

## 📋 Overview

**LogicFit** is a comprehensive, full-featured gym management system built with Angular 18. It provides a complete solution for gym owners, coaches, and clients to manage memberships, workout programs, diet plans, and track fitness progress.

The application features a modern, responsive UI with support for **Arabic (RTL)** and **English (LTR)** languages, along with **Dark** and **Light** theme modes.

---

## ✨ Features

### 🏢 For Gym Owners
| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Real-time statistics, revenue charts, and KPIs |
| 👥 **Client Management** | Add, edit, search, and manage gym members |
| 🏋️ **Coach Management** | Manage coaching staff and their assignments |
| 💳 **Subscription Plans** | Create and manage membership packages |
| 📑 **Subscriptions** | Track all active and expired subscriptions |
| 📈 **Reports** | Financial and operational reports |
| ⚙️ **Gym Settings** | Configure gym profile and preferences |

### 🏋️ For Coaches
| Feature | Description |
|---------|-------------|
| 👨‍🏫 **Trainee Management** | View and manage assigned trainees |
| 📋 **Workout Programs** | Create custom workout programs with exercises |
| 🥗 **Diet Plans** | Design personalized nutrition plans |
| 📏 **Body Measurements** | Track client progress with measurements |
| 💪 **Exercise Library** | Browse and manage exercise database |
| 🍎 **Foods Database** | Access nutritional information |
| 📊 **Muscle Distribution** | Analyze workout muscle targeting |

### 🏃 For Clients
| Feature | Description |
|---------|-------------|
| 🏠 **Personal Dashboard** | Overview of fitness journey |
| 📅 **My Program** | View assigned workout routines |
| 🎯 **Workout Sessions** | Log and track workout progress |
| 🥗 **My Diet** | Access personalized meal plans |
| 📊 **Progress Tracking** | Visualize fitness improvements |
| 📏 **Measurements** | View body measurement history |
| 💳 **Subscriptions** | Manage gym membership |

---

## 🛠️ Tech Stack

### Frontend Framework
```
Angular 18 (Standalone Components)
├── Signals for State Management
├── New Control Flow (@if, @for, @switch)
├── Lazy Loading Routes
└── Server-Side Rendering Ready
```

### UI Components & Styling
| Technology | Usage |
|------------|-------|
| **PrimeNG 17** | Rich UI component library |
| **PrimeFlex** | CSS utility library |
| **TailwindCSS 3.4** | Utility-first CSS framework |
| **PrimeIcons** | Icon library |
| **NgxCharts** | Data visualization |

### State & Data Management
| Technology | Usage |
|------------|-------|
| **Angular Signals** | Reactive state management |
| **RxJS** | Reactive programming |
| **HttpClient** | API communication |

### Internationalization & Theming
| Feature | Implementation |
|---------|----------------|
| **i18n** | ngx-translate (AR/EN) |
| **RTL Support** | Full Arabic support |
| **Theming** | Dark/Light modes |

### Development Tools
| Tool | Purpose |
|------|---------|
| **TypeScript 5.4** | Type-safe JavaScript |
| **SCSS** | CSS preprocessing |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |

### Export & Reporting
| Format | Library |
|--------|---------|
| **PDF** | html2canvas + jsPDF |
| **Word** | docx |
| **CSV** | Custom implementation |
| **Print** | Native browser |

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm 9+
- Angular CLI 18+

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/AhmedSalem104/LogiFit_Angular.git
cd LogiFit_Angular
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://your-api-url.com/api',
  // ... other settings
};
```

4. **Run development server**
```bash
ng serve
```

5. **Open browser**
```
http://localhost:4200
```

### Build for Production
```bash
ng build --configuration=production
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                    # Core functionality
│   │   ├── auth/               # Authentication
│   │   │   ├── guards/         # Route guards
│   │   │   ├── interceptors/   # HTTP interceptors
│   │   │   ├── models/         # Auth models
│   │   │   └── services/       # Auth service
│   │   ├── layout/             # App layouts
│   │   │   ├── auth-layout/    # Login/Register layout
│   │   │   ├── main-layout/    # Dashboard layout
│   │   │   └── components/     # Header, Sidebar
│   │   └── services/           # Core services
│   │
│   ├── features/               # Feature modules
│   │   ├── auth/               # Authentication pages
│   │   ├── owner/              # Owner dashboard
│   │   │   ├── clients/        # Client management
│   │   │   ├── coaches/        # Coach management
│   │   │   ├── dashboard/      # Owner dashboard
│   │   │   ├── subscription-plans/
│   │   │   └── services/       # Owner services
│   │   ├── coach/              # Coach dashboard
│   │   │   ├── trainees/       # Trainee management
│   │   │   ├── workout-programs/
│   │   │   ├── diet-plans/
│   │   │   ├── measurements/
│   │   │   ├── exercises/
│   │   │   └── services/
│   │   └── client/             # Client portal
│   │       ├── workout/        # Workout tracking
│   │       ├── diet/           # Diet tracking
│   │       ├── progress/       # Progress charts
│   │       └── services/
│   │
│   ├── shared/                 # Shared resources
│   │   ├── components/         # Reusable components
│   │   │   ├── page-header/
│   │   │   ├── stat-card/
│   │   │   ├── chart-card/
│   │   │   ├── loading-skeleton/
│   │   │   └── export-menu/
│   │   └── models/             # Shared interfaces
│   │
│   └── state/                  # Global state
│       └── theme.state.ts      # Theme management
│
├── assets/
│   └── i18n/                   # Translation files
│       ├── ar.json             # Arabic
│       └── en.json             # English
│
└── environments/               # Environment configs
    ├── environment.ts
    └── environment.prod.ts
```

---

## 🔌 API Integration

### Authentication
```typescript
POST /api/auth/login          // User login
POST /api/auth/register       // User registration
POST /api/auth/refresh        // Refresh token
POST /api/auth/forgot-password
```

### Owner Endpoints
```typescript
GET    /api/clients           // List all clients
POST   /api/clients           // Create client
PUT    /api/clients/:id       // Update client
DELETE /api/clients/:id       // Delete client

GET    /api/coaches           // List all coaches
GET    /api/subscriptionplans // List subscription plans
GET    /api/reports/dashboard // Dashboard statistics
```

### Coach Endpoints
```typescript
GET    /api/coachclients              // Get assigned trainees
GET    /api/workoutprograms           // List programs
POST   /api/workoutprograms           // Create program
GET    /api/dietplans                 // List diet plans
POST   /api/dietplans                 // Create diet plan
GET    /api/bodymeasurements          // List measurements
GET    /api/exercises                 // Exercise library
GET    /api/foods                     // Foods database
```

### Client Endpoints
```typescript
GET    /api/clients/:id               // Get profile
GET    /api/workoutprograms?clientId= // My programs
GET    /api/dietplans?clientId=       // My diet plans
GET    /api/subscriptions?clientId=   // My subscriptions
POST   /api/workoutsessions/start     // Start workout
POST   /api/workoutsessions/:id/sets  // Log exercise set
```

---

## 🎨 Theme System

### Color Palette
```scss
// Light Theme
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--text-primary: #1e293b;
--accent-color: #3b82f6;

// Dark Theme
--bg-primary: #1e1e2d;
--bg-secondary: #151521;
--text-primary: #ffffff;
--accent-color: #3b82f6;
```

### Theme Toggle
```typescript
// Automatic theme persistence
themeState.toggleTheme(); // Switch between dark/light
themeState.isDark();      // Check current theme
```

---

## 🌐 Internationalization

### Supported Languages
- 🇸🇦 **Arabic** (RTL) - Default
- 🇺🇸 **English** (LTR)

### Usage
```typescript
// In component
translate.use('ar'); // Switch to Arabic
translate.use('en'); // Switch to English
```

### Translation Files
```json
// assets/i18n/ar.json
{
  "dashboard": "لوحة التحكم",
  "clients": "العملاء",
  "coaches": "المدربين"
}
```

---

## 📱 Responsive Design

| Breakpoint | Description |
|------------|-------------|
| `< 640px` | Mobile devices |
| `640px - 768px` | Tablets |
| `768px - 1024px` | Small laptops |
| `> 1024px` | Desktops |

---

## 🚀 Deployment

### Vercel (Recommended)

1. Import project from GitHub
2. Configure:
   - **Framework**: Angular
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/logicfit-app/browser`
3. Deploy

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

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ahmed Salem**

[![GitHub](https://img.shields.io/badge/GitHub-AhmedSalem104-181717?style=for-the-badge&logo=github)](https://github.com/AhmedSalem104)

---

<p align="center">
  <strong>Built with ❤️ using Angular</strong>
</p>

<p align="center">
  <a href="#top">⬆️ Back to Top</a>
</p>
