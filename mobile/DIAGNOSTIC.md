# DIAGNOSTIC - Chrome Connection Timeout

## CURRENT STATE
```
✅ Backend: Running on http://127.0.0.1:8000
❌ Flutter: Still using http://10.0.2.2:8000/api/v1/login
✅ Code: Fixed with platform-specific URLs
```

## ROOT CAUSE ANALYSIS

### Problem 1: Wrong URL Still Being Used
The app is running on Chrome (web) but using Android emulator IP: `http://10.0.2.2:8000`

### Why This Happens
1. **Saved URL override**: You might have saved `http://10.0.2.2:8000/api/v1` in Settings
2. **No hot restart**: Changes not applied (need 'R' not 'r')
3. **Cache issue**: Old app data overriding new code

## IMMEDIATE FIXES

### Option 1: Hot Restart (Most Likely)
```
In Flutter terminal, press:
R  (Uppercase R for HOT RESTART)
```

### Option 2: Clear Saved URL
```
1. Go to Settings page in the app
2. Clear the URL field
3. Press "Save URL" 
4. Then press 'R' (hot restart)
```

### Option 3: Clear App Cache
```
1. Stop the app (Ctrl+C)
2. Run: flutter clean
3. Run: flutter pub get
4. Run: flutter run (choose Chrome)
```

## VERIFICATION STEPS

### Step A: What URL is actually being used?
After hot restart, check the log:
```
==================== API REQUEST ====================
URL: http://localhost:8000/api/v1/login    ← Should say localhost
METHOD: POST
```

### Step B: Test Backend Directly
Open Chrome and go to:
```
http://127.0.0.1:8000
```

Should show Laravel welcome page.

### Step C: Test API Endpoint
```
# In PowerShell:
Invoke-WebRequest http://localhost:8000/api/v1/login -Method Options
```

Should return CORS headers.

## IF STILL TIMING OUT

### 1. Check Backend Status
```
# Terminal 1:
cd c:\Project\inventory-system-psa\backend
php artisan serve --host=0.0.0.0 --port=8000

# Output should be:
# INFO Server running on [http://0.0.0.0:8000].
```

### 2. Check CORS Configuration
```
# Check backend CORS:
cd backend
php artisan route:list --path=api
```

### 3. Browser DevTools Check
```
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Try login
4. Check which URL is actually being requested
```

## FINAL FIX - Manual Override

If nothing else works, manually edit `AppConstants.baseUrl`:

```dart
// TEMPORARY FIX - Replace in app_constants.dart
static String get baseUrl {
  return 'http://localhost:8000/api/v1'; // ALWAYS use localhost
}
```

Then hot restart ('R').

## SUMMARY

**The app SHOULD work after:**

1. Hot restart ('R' key)
2. OR clear saved URL in Settings
3. OR edit baseUrl to always use localhost

**Try Step 1 first - PRESS 'R' in the terminal.**
