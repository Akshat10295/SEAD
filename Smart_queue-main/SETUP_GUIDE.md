# Smart Queue Management System — Setup Guide
## MySQL + FastAPI + React (VS Code)

---

## Prerequisites

Install these before starting:

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.11+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/ |
| VS Code | Latest | https://code.visualstudio.com |

### Recommended VS Code Extensions
Install these from the Extensions panel (`Ctrl+Shift+X`):
- **Python** (Microsoft)
- **Pylance**
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **Thunder Client** (for API testing)
- **MySQL** (by weijan chen, for DB viewing)

---

## Step 1 — MySQL Setup

### 1.1 Create the Database

Open MySQL Workbench or the MySQL CLI and run:

```sql
CREATE DATABASE smart_queue CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'queueuser'@'localhost' IDENTIFIED BY 'StrongPass123!';
GRANT ALL PRIVILEGES ON smart_queue.* TO 'queueuser'@'localhost';
FLUSH PRIVILEGES;
```

> **Note:** You can also use `root` user for local development. Replace credentials in `.env` accordingly.

---

## Step 2 — Project Structure

Your project folder should look like this after copying the code:

```
smart-queue/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── security.py
│   │   │   └── exceptions.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── token.py
│   │   │   ├── counter.py
│   │   │   └── log.py
│   │   ├── schemas/
│   │   │   └── schemas.py
│   │   ├── repositories/
│   │   │   ├── user_repo.py
│   │   │   ├── token_repo.py
│   │   │   ├── counter_repo.py
│   │   │   └── log_repo.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── queue_service.py
│   │   │   └── admin_service.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── queue.py
│   │   │   ├── counter.py
│   │   │   ├── admin.py
│   │   │   └── ws.py
│   │   ├── middleware/
│   │   │   └── auth.py
│   │   └── websocket/
│   │       └── manager.py
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── index.css
    │   ├── types/index.ts
    │   ├── context/AppContext.tsx
    │   ├── services/
    │   │   ├── api.ts
    │   │   └── websocket.ts
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── CustomerPage.tsx
    │   │   ├── CounterPage.tsx
    │   │   ├── DisplayPage.tsx
    │   │   └── AdminPage.tsx
    │   ├── components/
    │   │   ├── ui/index.tsx
    │   │   ├── layout/Navbar.tsx
    │   │   └── ErrorBoundary.tsx
    │   └── routes/ProtectedRoute.tsx
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## Step 3 — Backend Setup

### 3.1 Open Terminal in VS Code

Press `Ctrl+\`` (backtick) to open the integrated terminal.

### 3.2 Navigate to backend folder

```bash
cd smart-queue/backend
```

### 3.3 Create a Python virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

> You should see `(venv)` appear at the start of your terminal prompt.

### 3.4 Install Python dependencies

```bash
pip install -r requirements.txt
```

Wait for all packages to install. This may take 1-2 minutes.

### 3.5 Create the .env file

Copy the example file:
```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Now open `.env` and fill in your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=queueuser
DB_PASSWORD=StrongPass123!
DB_NAME=smart_queue

SECRET_KEY=replace-this-with-a-random-32-char-string-abc123xyz
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

> **Tip:** Generate a secure SECRET_KEY by running:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

### 3.6 Start the backend server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:
```
INFO  | Starting Smart Queue System...
INFO  | Database tables created successfully
INFO  | Created 3 default counters
INFO  | Uvicorn running on http://0.0.0.0:8000
```

### 3.7 Verify backend is running

Open your browser and go to: **http://localhost:8000/docs**

You should see the FastAPI Swagger UI with all endpoints listed.

---

## Step 4 — Frontend Setup

### 4.1 Open a NEW terminal in VS Code

Press `Ctrl+Shift+\`` to open a second terminal panel.

### 4.2 Navigate to frontend folder

```bash
cd smart-queue/frontend
```

### 4.3 Install Node dependencies

```bash
npm install
```

### 4.4 Start the development server

```bash
npm run dev
```

You should see:
```
VITE v5.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## Step 5 — First Run & Testing

### 5.1 Open the app

Go to: **http://localhost:5173**

You'll be redirected to the login page.

### 5.2 Create an Admin account

1. Click **Register**
2. Enter a username (e.g., `admin`)
3. Enter a password (e.g., `admin123`)
4. Select role: **Admin**
5. Click **Create Account**

### 5.3 Create test accounts for each role

Logout and register accounts for:
- **Counter Staff** — username: `counter1`, role: Counter
- **Customer** — username: `customer1`, role: Customer
- **Display** — username: `display1`, role: Display Screen

### 5.4 Test the full flow

Open **4 browser tabs** (or use incognito windows):

| Tab | URL | Login as |
|-----|-----|----------|
| 1 | http://localhost:5173 | customer1 |
| 2 | http://localhost:5173 | counter1 |
| 3 | http://localhost:5173 | display1 |
| 4 | http://localhost:5173 | admin |

**Test workflow:**
1. **Customer tab** → Click "Join Queue" → See your token number
2. **Counter tab** → Click "Next" on Counter #1 → See token assigned
3. **Display tab** → See "Now Serving" update in real time
4. **Counter tab** → Click "Complete" → Token marked done
5. **Admin tab** → Check stats and logs

---

## Step 6 — VS Code Workspace Tips

### 6.1 Split your terminal

Run both servers simultaneously in split terminals:
- Terminal 1: Backend (`uvicorn app.main:app --reload`)
- Terminal 2: Frontend (`npm run dev`)

### 6.2 Recommended workspace settings

Create `.vscode/settings.json` in the `smart-queue` root:

```json
{
  "python.defaultInterpreterPath": "./backend/venv/Scripts/python",
  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### 6.3 Debug the backend

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI Debug",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload", "--port", "8000"],
      "cwd": "${workspaceFolder}/backend",
      "env": {},
      "console": "integratedTerminal"
    }
  ]
}
```

---

## API Reference

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /auth/register | Public | Create account |
| POST | /auth/login | Public | Login |
| POST | /token | Customer | Join queue |
| GET | /queue | All | Get queue state |
| GET | /counter/ | Counter/Admin | List counters |
| POST | /counter/{id}/next | Counter/Admin | Call next customer |
| POST | /counter/{id}/complete | Counter/Admin | Complete service |
| GET | /admin/stats | Admin | System statistics |
| POST | /admin/reset | Admin | Reset entire queue |
| GET | /admin/logs | Admin | Activity logs |
| GET | /admin/logs/export | Admin | Download CSV |
| WS | /ws/queue | All | Real-time updates |

---

## Common Errors & Fixes

### "Access denied for user" (MySQL)
```bash
# Re-grant privileges in MySQL CLI:
GRANT ALL PRIVILEGES ON smart_queue.* TO 'queueuser'@'localhost';
FLUSH PRIVILEGES;
```

### "Module not found" (Python)
Make sure your virtual environment is activated — you should see `(venv)` in the terminal prompt.

### CORS error in browser
Check that `ALLOWED_ORIGINS` in `.env` matches the exact URL of your frontend (e.g., `http://localhost:5173`).

### WebSocket not connecting
WebSocket connects through Vite's proxy. Make sure the backend is running on port 8000 before starting the frontend.

### Port 8000 already in use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill
```

---

## Build for Production

### Backend
```bash
# Run without --reload for production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend
```bash
cd frontend
npm run build
# Output is in frontend/dist/
```

---

## Security Checklist Before Deployment

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Set a strong MySQL password
- [ ] Restrict `ALLOWED_ORIGINS` to your actual domain
- [ ] Set `echo=False` in SQLAlchemy engine (already done)
- [ ] Use HTTPS in production
- [ ] Never commit `.env` to git (add to `.gitignore`)
