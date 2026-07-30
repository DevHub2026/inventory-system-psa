# Quick Start Guide - PSA Inventory Mobile App

## In 3 Steps

### 1️⃣ Start Backend
```bash
cd c:\Project\inventory-system-psa\backend
php artisan serve
```
✅ Backend running at: `http://127.0.0.1:8000`

### 2️⃣ Run Flutter App
```bash
cd c:\Project\inventory-system-psa\mobile
flutter run
```

### 3️⃣ Configure Server URL (if needed)
In app Settings:
- **Android Emulator:** `http://10.0.2.2:8000/api/v1`
- **Windows PC:** `http://localhost:8000/api/v1`
- **Physical Device:** `http://192.168.1.X:8000/api/v1` (replace X with your PC's IP)

Then tap **Save URL** and restart app.

---

## Test Login

```
Email: admin@example.com
Password: password
```

(Check backend database for actual users if these don't work)

---

## What's Working

✅ Compilation - Zero errors  
✅ Backend - Running and responding  
✅ API Connection - Dynamic URL configuration  
✅ Authentication - Login/Logout  
✅ Dashboard - Statistics and activity  
✅ Assets - List, search, detail, QR  
✅ Borrowing - List and detail  
✅ Profile - View and edit  
✅ Notifications - List and read  
✅ All other features - Inventory, Maintenance, Reservations  

---

## Troubleshooting

**App times out on login?**
1. ✅ Backend running? → Run `php artisan serve`
2. ✅ Correct URL in Settings?
3. ✅ Backend responds? → `curl http://127.0.0.1:8000/api/v1/login`

**Wrong URL for your device?**
- Emulator: Use `10.0.2.2`
- PC/Chrome: Use `localhost`
- Physical Device: Use PC's LAN IP (find via `ipconfig`)

**App won't build?**
```bash
flutter clean
flutter pub get
flutter build apk --debug
```

---

## Files Created

📄 `BACKEND_SETUP.md` - Complete backend setup guide  
📄 `BACKEND_API_FIX.md` - Root cause analysis and fixes  
📄 `FINAL_STATUS.md` - Complete status report  
📄 `QUICK_START.md` - This file  

---

**That's it! Your app is ready. 🚀**

For detailed setup, see `BACKEND_SETUP.md`  
For troubleshooting, see `BACKEND_API_FIX.md`
