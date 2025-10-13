# Authentication Flow Diagram

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR COACHING APP                         │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Coach Dashboard │         │  Client Programs │         │
│  │   (Protected)    │         │   (Protected)    │         │
│  └──────────────────┘         └──────────────────┘         │
│           ↓                            ↓                     │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Coach Login    │         │  Client Login    │         │
│  │                  │         │                  │         │
│  │  Username: coach │         │  Username: john  │         │
│  │  Password: ***   │         │  Password: ***   │         │
│  └──────────────────┘         └──────────────────┘         │
│           ↓                            ↓                     │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Check .env      │         │  Check Database  │         │
│  │  Variables       │         │  (Supabase)      │         │
│  └──────────────────┘         └──────────────────┘         │
│           ↓                            ↓                     │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Create Session  │         │  Create Session  │         │
│  │  (24h expiry)    │         │  (24h expiry)    │         │
│  └──────────────────┘         └──────────────────┘         │
│           ↓                            ↓                     │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ Access Dashboard │         │ Access Program   │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Coach Workflow

```
1. Coach visits app
   ↓
2. Sees login screen
   ↓
3. Enters credentials from .env
   ↓
4. Authentication validates
   ↓
5. Access dashboard
   ↓
6. [Manage clients, create credentials, etc.]
   ↓
7. Click "Logout" to end session
```

## 👤 Client Workflow

```
1. Coach creates client credentials
   ↓
2. Coach generates share link
   ↓
3. Coach sends: Link + Username + Password
   ↓
4. Client clicks link
   ↓
5. Client sees login screen
   ↓
6. Client enters credentials
   ↓
7. Authentication validates against database
   ↓
8. Client accesses their program
```

## 🗄️ Database Structure

```
Supabase Database
│
├── clients (existing table)
│   ├── id (UUID)
│   ├── full_name
│   ├── email
│   └── ...
│
└── client_credentials (NEW table)
    ├── id (UUID)
    ├── client_id → references clients(id)
    ├── username (unique)
    ├── password_hash
    ├── created_at
    ├── updated_at
    ├── last_login
    └── is_active
```

## 🔐 Credentials Storage

```
COACH CREDENTIALS
┌─────────────────────────┐
│   .env file             │
│   (Not in git)          │
│                         │
│   VITE_COACH_USERNAME   │
│   VITE_COACH_PASSWORD   │
└─────────────────────────┘
         ↓
    [Validated at login]


CLIENT CREDENTIALS  
┌─────────────────────────┐
│   Supabase Database     │
│   (client_credentials)  │
│                         │
│   username              │
│   password_hash         │
└─────────────────────────┘
         ↓
    [Validated at login]
```

## 🎯 URL Routing

```
ROUTE                        AUTH REQUIRED    WHO CAN ACCESS
─────────────────────────────────────────────────────────────
/                           ✅ YES           Coach only
/meal-database              ✅ YES           Coach only
/exercise-database          ✅ YES           Coach only
/templates                  ✅ YES           Coach only
?client={clientId}          ✅ YES           Specific client only
```

## 🔄 Session Management

```
Login → Create Session Token → Store in localStorage
                                      ↓
                              Set expiry (24h)
                                      ↓
                    ┌─────────────────┴─────────────────┐
                    ↓                                   ↓
            Valid (< 24h)                        Expired (> 24h)
                    ↓                                   ↓
            Continue Access                      Force Re-login
```

## 🛠️ Creating Client Credentials (Coach)

```
1. Dashboard → Client List
   ↓
2. Click ⋮ menu on client
   ↓
3. Select "Manage Credentials"
   ↓
4. Modal opens:
   ├── Username (auto-suggested)
   ├── Password field
   └── [Generate] button
   ↓
5. Click "Generate" for secure password
   ↓
6. Click "Create Credentials"
   ↓
7. Credentials saved to database
   ↓
8. Click "Copy Full Message"
   ↓
9. Send to client via secure channel
```

## 📱 Component Architecture

```
App.tsx (Main)
│
├── Authentication Layer
│   ├── Check if authenticated
│   ├── Determine user type (coach/client)
│   └── Show appropriate login screen
│
├── CoachLogin.tsx
│   └── Validates against .env
│
├── ClientLogin.tsx
│   └── Validates against database
│
└── Protected Routes
    ├── UnbreakableSteamClientsManager
    │   └── ClientCredentialsManager (modal)
    ├── ModernClientInterface
    └── Other components
```

## 🔒 Security Layers

```
Layer 1: Environment Variables
         ↓
Layer 2: Authentication Service
         ↓
Layer 3: Route Protection
         ↓
Layer 4: Session Management
         ↓
Layer 5: Database Access Control
```

## 🚦 Authentication States

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Not Authenticated                                   │
│  ├── No URL params → Show CoachLogin                │
│  └── Has ?client= → Show ClientLogin                │
│                                                      │
│  Authenticated (Coach)                               │
│  └── Access all coach features                      │
│                                                      │
│  Authenticated (Client)                              │
│  └── Access only their program                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 🎬 Complete Example: First-Time Setup

```
STEP 1: Coach Setup
──────────────────────
1. Create .env file
2. Set VITE_COACH_USERNAME=coach
3. Set VITE_COACH_PASSWORD=MySecurePass123!
4. Run: npm run dev

STEP 2: Database Setup
──────────────────────
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run create_auth_tables.sql
4. Verify client_credentials table exists

STEP 3: First Login
──────────────────────
1. Visit: http://localhost:5173
2. See coach login screen
3. Enter: coach / MySecurePass123!
4. Access dashboard ✅

STEP 4: Create Client Credentials
──────────────────────
1. Find client "John Doe"
2. Click ⋮ → Manage Credentials
3. Username: johndoe (auto-filled)
4. Click [Generate Password]
5. Password: aB3$mK9@pL2#
6. Click "Create Credentials"
7. Click "Copy Full Message"

STEP 5: Share with Client
──────────────────────
1. Send copied message to John via WhatsApp
2. Also send share link via email
3. John receives:
   - Link: https://app.com/?client=uuid
   - Username: johndoe
   - Password: aB3$mK9@pL2#

STEP 6: Client Access
──────────────────────
1. John clicks link
2. Sees client login screen
3. Enters: johndoe / aB3$mK9@pL2#
4. Accesses his program ✅
```

## ✨ Key Features

| Feature | Coach | Client |
|---------|-------|--------|
| Login Screen | ✅ | ✅ |
| Logout Button | ✅ | ✅ |
| Session (24h) | ✅ | ✅ |
| Auto Re-login Check | ✅ | ✅ |
| Credentials Manager | ✅ | ❌ |
| Password Generator | ✅ | ❌ |
| Dashboard Access | ✅ | ❌ |
| Program Access | ❌ | ✅ |

---

This authentication system is **simple, secure, and effective** for your coaching business! 🎉


