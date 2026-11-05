# 🎫 QuickLine — Gestion de file d'attente multi-entreprises

Application web SaaS **multi-entreprises** et **multi-guichets** qui remplace le ticket papier par un ticket numérique suivi en temps réel sur smartphone.

---

## 📌 Contexte

Dans de nombreuses entreprises (banques, cliniques, opérateurs télécoms, administrations), l'accueil client repose encore sur une file d'attente physique statique.

**QuickLine élimine ce problème :**

- **Client** — prend un ticket via QR code, suit sa position en temps réel
- **Agent** — dashboard avec appel du suivant (sans conflit), chronomètre, gestion des absents
- **Administrateur** — configure les services, guichets, agents, consulte les statistiques

---

## 🏗️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Laravel 12 (PHP 8.2+) |
| Base de données | PostgreSQL 15+ |
| ORM | Eloquent |
| Auth | Laravel Sanctum (tokens SHA-256) |
| Temps réel | Laravel Reverb (WebSockets) |
| Frontend | React 18 + Vite |
| UI | Tailwind CSS 3 + DaisyUI |
| Tests | PHPUnit 11 (25 tests, 70 assertions) |

---

## 🚀 Installation

### Prérequis

```bash
php -v                # >= 8.2
composer -V           # >= 2.9
node -v               # >= 18
psql --version        # >= 15
php -m | grep pgsql   # doit afficher pdo_pgsql
```

### 1. Base de données

```bash
sudo systemctl start postgresql

sudo -u postgres psql -c "CREATE USER quickline WITH PASSWORD 'quickline';"
sudo -u postgres psql -c "CREATE DATABASE quickline OWNER quickline;"
sudo -u postgres psql -c "CREATE DATABASE quickline_test OWNER quickline;"
sudo -u postgres psql -c "ALTER USER quickline CREATEDB;"
```

### 2. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

---

## 🎯 Démarrage

### Terminal 1 — Backend API

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8001
```

### Terminal 2 — WebSocket Reverb

```bash
cd backend
php artisan reverb:start --host=0.0.0.0 --port=8080
```

### Terminal 3 — Frontend React

```bash
cd frontend
npm run dev -- --host
```

### URLs d'accès

| Rôle | URL |
|------|-----|
| Client | http://localhost:5173/c/ma-banque |
| Écran TV | http://localhost:5173/display/ma-banque |
| Login | http://localhost:5173/agent/login |
| Dashboard Agent | http://localhost:5173/agent/dashboard |
| Admin Services | http://localhost:5173/admin/services |
| Admin Stats | http://localhost:5173/admin/stats |

---

## 🔐 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@mabanque.com | password123 |
| Agent 1 | agent1@mabanque.com | password123 |
| Agent 2 | agent2@mabanque.com | password123 |

---

## 🧪 Tests automatisés

```bash
cd backend
php artisan test
```

**Résultat attendu :**

```
PASS  Tests\Feature\AuthTest                 (5 tests)
PASS  Tests\Feature\CallNextConcurrencyTest  (4 tests)
PASS  Tests\Feature\IsolationTest            (5 tests)
PASS  Tests\Feature\TicketLifecycleTest      (5 tests)
PASS  Tests\Feature\TicketNumberingTest      (4 tests)

Tests:    25 passed (70 assertions)
```

### Preuve de concurrence (SKIP LOCKED)

```bash
cd backend
~/quickline-stress-test.sh
```

**Résultat attendu :** 5 tickets uniques, **0 doublon** sur 100 appels simultanés.

---

## 📊 API REST (v1)

**Base URL :** `http://localhost:8001/api/v1`

### Routes publiques

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /admin/register | Créer une entreprise + admin |
| POST | /auth/login | Connexion (agent ou admin) |
| GET | /companies/{slug} | Infos entreprise + services |
| GET | /time | Heure serveur |
| POST | /tickets | Prendre un ticket |
| GET | /tickets/{id} | Suivre un ticket |
| DELETE | /tickets/{id} | Annuler un ticket |
| GET | /display/{slug} | Écran TV |

### Routes agent (auth:sanctum)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /agent/counters | Liste des guichets |
| POST | /agent/call-next | Appeler le suivant |
| POST | /agent/tickets/{id}/finish | Terminer un passage |
| POST | /agent/tickets/{id}/absent | Signaler absent |
| POST | /agent/tickets/{id}/recall | Rappeler |
| POST | /agent/counter/pause | Pause / reprise |
| GET | /agent/queue | File d'attente |

### Routes admin (auth:sanctum)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | /admin/services | CRUD services |
| PUT/DELETE | /admin/services/{id} | Modifier / désactiver |
| GET/POST | /admin/counters | CRUD guichets |
| DELETE | /admin/counters/{id} | Désactiver |
| GET/POST | /admin/agents | CRUD agents |
| DELETE | /admin/agents/{id} | Désactiver |
| GET | /admin/stats | Statistiques |

---

## 🏆 Conformité au cahier des charges v3

| Exigence | Statut | Preuve |
|----------|--------|--------|
| AUTH-01, AUTH-02 | ✅ | AuthTest |
| ORG-01 à ORG-04 | ✅ | Routes admin |
| TKT-01 à TKT-04 | ✅ | TicketLifecycleTest |
| **AGENT-01 (SKIP LOCKED)** | ✅ | **CallNextConcurrencyTest + 100 appels manuels** |
| AGENT-02 à AGENT-05 | ✅ | TicketLifecycleTest |
| TV-01, TV-02 | ✅ | Display.jsx + WebSocket |
| STAT-01 | ✅ | /admin/stats |
| Isolation cross-company | ✅ | IsolationTest |
| RBAC admin/agent | ✅ | Middleware EnsureRole |

**21 exigences sur 21 validées.** ✅

---

## 📁 Structure du projet

```
quickline/
├── backend/                       # Laravel 12
│   ├── app/
│   │   ├── Events/                # TicketCalled
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # 5 contrôleurs
│   │   │   └── Middleware/        # Role, CompanyIsolation
│   │   └── Models/                # 7 modèles Eloquent
│   ├── database/
│   │   ├── migrations/            # 8 migrations
│   │   └── seeders/               # QuickLineSeeder
│   ├── routes/                    # api.php, channels.php
│   └── tests/Feature/             # 5 fichiers, 25 tests
│
└── frontend/                      # React 18 + Vite
    ├── src/
    │   ├── components/            # Sidebar, Topbar, Navbar, Logo
    │   ├── layouts/               # AdminLayout, AgentLayout
    │   ├── pages/
    │   │   ├── client/            # Home, Ticket
    │   │   ├── agent/             # Login, Dashboard
    │   │   ├── admin/             # Register, Services, Counters, Agents, Stats
    │   │   └── display/           # Display (TV)
    │   └── services/              # api.js, echo.js
    └── .env
```

---

## 🎯 Équipe

| Membre | Rôle |
|--------|------|
| FALANAN Olivier Olayinola | Chef de projet / Backend |
| TAO Jude | Frontend |
| BOKOSSA Eunice / LOKOSSOU Freud | Base de données / Backend |
| AYIVODJI Exaucé | Tests / Documentation |

**Dépôt Git :** https://github.com/Olivier132/QuickLine

---

## 📄 Licence

Projet académique — 2026
