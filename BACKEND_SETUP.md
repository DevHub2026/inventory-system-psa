# PSA Inventory Management System - Backend Setup & Running

## Prerequisites

- PHP 8.1 or higher
- Composer installed
- SQLite (included with PHP)
- Node.js (optional, for frontend assets)

## Installation

### 1. Install Dependencies

```bash
cd backend
composer install
```

### 2. Environment Setup

The `.env` file is already configured for local development:

```env
APP_NAME=Laravel
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=sqlite
# SQLite database file will be created at: storage/app/database.sqlite
```

### 3. Generate Application Key (if needed)

```bash
php artisan key:generate
```

### 4. Run Database Migrations

```bash
php artisan migrate
```

### 5. Seed Database (optional - populates sample data)

```bash
php artisan db:seed
```

---

## Running the Backend

### Option A: PHP Built-in Server (Recommended for Development)

**On Windows:**

```bash
cd c:\Project\inventory-system-psa\backend
php -S localhost:8000
```

The API will be available at: `http://localhost:8000/api/v1`

**Keep this terminal window open** - the server will run until you press `Ctrl+C`.

### Option B: Laravel Artisan Serve

```bash
cd backend
php artisan serve
```

This starts the server on `http://localhost:8000` by default.

### Option C: Laravel Octane (Faster, requires Swoole)

```bash
composer require laravel/octane
php artisan octane:start
```

---

## Testing the API

Once the backend is running, verify it works:

### 1. Check if API is accessible

```bash
curl http://localhost:8000/api/v1/login -X POST
```

### 2. Test login endpoint

```bash
curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

### 3. Using Chrome/Frontend

Navigate to: `http://localhost:8000`

---

## Configuration for Different Platforms

### Flutter on Android Emulator

The emulator can reach your Windows host using: `http://10.0.2.2:8000/api/v1`

1. Start the backend on Windows: `php -S localhost:8000`
2. In Flutter settings, set URL to: `http://10.0.2.2:8000/api/v1`

### Flutter on Windows Desktop

Use `http://localhost:8000/api/v1` directly (same machine).

### Flutter on Physical Android Device (same LAN)

Find your Windows PC's local IP:

**Windows Command Prompt:**
```bash
ipconfig
```

Look for "IPv4 Address" under your network adapter (e.g., `192.168.1.100`).

In Flutter settings, set URL to: `http://192.168.1.100:8000/api/v1`

### Flutter on Chrome

Use `http://localhost:8000` (CORS enabled in Laravel).

---

## Troubleshooting

### Port 8000 Already in Use

```bash
# Find what's using port 8000
netstat -ano | findstr ":8000"

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

### Database Connection Error

```bash
# Ensure SQLite database file exists
php artisan migrate
```

### "Class not found" Errors

```bash
# Regenerate autoloader
composer dump-autoload
php artisan cache:clear
php artisan config:clear
```

### 401 Unauthorized When Testing API

This is expected for protected routes. Use a valid token from the login response.

---

## Key API Endpoints

- `POST /api/v1/login` - User login
- `POST /api/v1/logout` - User logout
- `GET /api/v1/me` - Get current user
- `GET /api/v1/assets` - List all assets
- `POST /api/v1/assets/{id}/borrow` - Borrow an asset
- `POST /api/v1/assets/{id}/return` - Return an asset
- `GET /api/v1/borrowings` - List borrowing requests
- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/users` - List users (admin only)

All authenticated endpoints require: `Authorization: Bearer <token>` header.

---

## Development Notes

- The backend uses **Sanctum** for API authentication
- All API responses follow JSON:API format
- The database is **SQLite** (file-based, stored at `storage/app/database.sqlite`)
- Rate limiting is enabled for login/forgot-password (5 requests/minute per IP)
- CORS is configured to allow requests from localhost and LAN IPs

---

## Next Steps

1. ✅ Start backend: `php -S localhost:8000`
2. ✅ Test API: `curl http://localhost:8000/api/v1/login`
3. ✅ Run Flutter app and login
4. ✅ In Flutter Settings page, verify or update the server URL
5. ✅ Test features (assets, borrowing, notifications, etc.)
