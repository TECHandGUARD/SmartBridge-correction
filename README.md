# 🚀 SmartBridge FET

**CAPS-aligned learning platform for South African Grades 10-12 students.**

SmartBridge FET connects students with verified tutors, practice quizzes, video lessons, progress tracking, and AI-powered study tools — all aligned with the South African CAPS curriculum.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Database Tables](#database-tables)
- [Supabase Edge Functions](#supabase-edge-functions)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **Hosting** | AWS Amplify (Europe/Ireland - eu-west-1) |
| **AI Provider** | Google Gemini API |
| **State Management** | React hooks, TanStack Query |
| **Routing** | React Router v6 |
| **Styling** | Tailwind CSS, shadcn/ui components |

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Supabase account** (for backend services)
- **AWS Amplify account** (for hosting)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone git@github.com:TECHandGUARD/SmartBridge-correction.git
cd SmartBridge-correction
npm ci
```

## Environment variables

Copy `.env.example` to `.env.local` and set your project URL and browser publishable key (or legacy anon key). Run `npm run check:env` before building. Production builds reject missing or invalid connection settings and obvious server-secret exposure. Optional payment settings remain unavailable until configured.

See [environment setup](docs/environment-configuration.md) for public settings, server-only secrets, staging isolation and deployment requirements.


## Technical repair and validation

See [the technical repair report](docs/technical-repair.md) for setup checks, database migration deployment order, browser tests, and remaining launch blockers.

Backend source reconciliation and staging rollout: [docs/backend-reconciliation.md](docs/backend-reconciliation.md).
