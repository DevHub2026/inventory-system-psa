# Android Emulator Connection Fix

## Problem

```
URL: http://10.0.2.2:8000/api/v1/login
ERROR TYPE: DioExceptionType.connectionTimeout
MESSAGE: The request connection took longer than 0:00:15.000000 and it was aborted
```

## Root Cause

The Laravel backend was listening **only on localhost (127.0.0.1)**, which is not accessible from the Android emulator.

### Why 10.0.2.2 Didn't Work

- `10.0.2.2` is a special alias in Android emulator that refers to the host machine's loopback interface
- When you start `php artisan serve --host=127.0.0.1`, the server only listens on 127.0.0.1 (localhost)
- The emulator cannot access 127.0.0.1 from 10.0.2.2
- **This is an emulator networking limitation, not a Flutter bug**

### Correct Configuration

The backend must listen on **0.0.0.0** (all interfaces) so the emulator can reach it:

```bash
# ❌ WRONG - Only localhost, emulator can't reach it
php artisan serve --host=127.0.0.1 --port=8000

# ✅ CORRECT - All interfaces, emulator can reach via 10.0.2.2
php artisan serve --host=0.0.0.0 --port=8000
```

---

## Solution

### Step 1: Stop the Current Backend

```bash
# Find and kill the process running on port 8000
netstat -ano | findstr ":8000"
taskkill /PID <PID> /F
```

Or if using background process control, stop it.

### Step 2: Start Backend on All Interfaces

```bash
cd c:\Project\inventory-system-psa\backend
php artisan serve --host=0.0.0.0 --port=8000
```

Output:
```
INFO  Server running on [http://0.0.0.0:8000].
Press Ctrl+C to stop the server
```

### Step 3: Verify Backend is Accessible

From Windows command line:
```bash
curl -X POST http://127.0.0.1:8000/api/v1/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"test\"}"
```

Expected response: 401 or 422 (server is responding, not timeout)

### Step 4: Run Flutter App on Emulator

The Flutter app will now connect via `http://10.0.2.2:8000/api/v1/login` and **should NOT timeout**.

---

## Verification

### Test 1: Backend Responds on localhost

```bash
curl http://127.0.0.1:8000/api/v1/login -X POST -H "Content-Type: application/json"
```

✅ Expected: HTTP 422 or 401 (not timeout)

### Test 2: Flutter App Connects

Run app on Android emulator and attempt login.

✅ Expected: Login screen responds (either success or authentication error, not timeout)

---

## Why This Matters

| Configuration | Windows Can Access | Emulator Can Access |
|---|---|---|
| `--host=127.0.0.1` | ✅ Yes | ❌ No |
| `--host=localhost` | ✅ Yes | ❌ No |
| `--host=0.0.0.0` | ✅ Yes | ✅ Yes (via 10.0.2.2) |

---

## Important Notes

### For Physical Android Device on Same LAN

If you need to test on a physical device instead of emulator:

1. Find your Windows PC's local IP:
   ```bash
   ipconfig
   # Look for "IPv4 Address" - e.g., 192.168.1.100
   ```

2. Start backend listening on all interfaces (same command):
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

3. In Flutter app Settings page, set URL to: `http://192.168.1.100:8000/api/v1`

4. Make sure Windows firewall allows port 8000:
   - Windows Firewall → Inbound Rules → Allow PHP on port 8000

---

## Quick Reference

### Before (Broken)
```bash
php artisan serve --host=127.0.0.1 --port=8000
# Emulator times out accessing http://10.0.2.2:8000
```

### After (Fixed)
```bash
php artisan serve --host=0.0.0.0 --port=8000
# Emulator successfully reaches http://10.0.2.2:8000
```

---

## Summary

**The emulator connection timeout was NOT a Flutter code issue.**

**It was a backend configuration issue:** Server listening only on localhost instead of all interfaces.

**The fix:** Restart backend with `--host=0.0.0.0` instead of `--host=127.0.0.1`.

**Result:** Emulator can now reach backend via 10.0.2.2, and connection timeout should be resolved.

---

## Next Steps

1. ✅ Stop backend (or wait for it to be restarted with new settings)
2. ✅ Start: `php artisan serve --host=0.0.0.0 --port=8000`
3. ✅ Run Flutter app on emulator
4. ✅ Test login - should connect immediately (not timeout)
5. ✅ Verify all features work: Dashboard, Assets, Borrowing, etc.

---

**Try the login again. The connection should now succeed.**
