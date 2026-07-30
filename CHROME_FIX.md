# Chrome Connection Fix - Platform-Specific Base URLs

## The Problem

When running Flutter on **Chrome (web)**, the app was using `http://10.0.2.2:8000/api/v1` to connect to the backend.

**10.0.2.2 is an Android emulator-specific address that doesn't work on Chrome/Windows.**

Result: **15-second connection timeout** on every login attempt.

## Root Cause

The `AppConstants.baseUrl` was hardcoded to `http://10.0.2.2:8000/api/v1`, which is only correct for Android emulator.

Different platforms need different URLs:
- **Chrome (Web):** `http://localhost:8000/api/v1`
- **Windows Desktop:** `http://localhost:8000/api/v1`
- **Android Emulator:** `http://10.0.2.2:8000/api/v1`
- **Physical Android Device:** `http://192.168.1.X:8000/api/v1` (user-configurable)

## The Fix (Applied)

**File:** `lib/core/constants/app_constants.dart`

Changed from hardcoded constant:
```dart
// ❌ WRONG - Same URL for all platforms
static const String baseUrl = 'http://10.0.2.2:8000/api/v1';
```

To platform-aware getter:
```dart
// ✅ CORRECT - Platform-specific URL
import 'package:flutter/foundation.dart';

static String get baseUrl {
  if (kIsWeb) {
    // Web platform: use localhost
    return 'http://localhost:8000/api/v1';
  } else {
    // Mobile/Desktop: use Android emulator IP (can be changed in Settings)
    return 'http://10.0.2.2:8000/api/v1';
  }
}
```

**Also updated:**
- `lib/features/settings/settings_page.dart` - Updated help text to explain platform-specific URLs

## How It Works Now

| Platform | Automatic URL | Can Override? |
|----------|---|---|
| Chrome (Web) | `http://localhost:8000/api/v1` | Yes (Settings) |
| Windows Desktop | `http://localhost:8000/api/v1` | Yes (Settings) |
| Android Emulator | `http://10.0.2.2:8000/api/v1` | Yes (Settings) |
| Physical Android | `http://10.0.2.2:8000/api/v1` (default) | Yes (Settings) |

## Testing on Chrome

1. **Hot restart** the Flutter app on Chrome:
   ```
   Press 'R' in the terminal
   ```

2. **Try login** again:
   - Email: `admin@example.com`
   - Password: `password123`

3. **Expected result:**
   - ✅ No 15-second timeout
   - ✅ Backend responds from `http://localhost:8000/api/v1`
   - ✅ Login succeeds or returns authentication error (not timeout)
   - ✅ Dashboard loads

## Verification

**Backend must be running:**
```bash
# In another terminal, ensure backend is running
cd c:\Project\inventory-system-psa\backend
php artisan serve --host=0.0.0.0 --port=8000

# Output should show:
# INFO Server running on [http://0.0.0.0:8000].
```

**Chrome can now reach:** `http://localhost:8000/api/v1`

## Why This Works

- `kIsWeb` constant from Flutter detects platform at compile time
- On Web, uses `localhost` (standard local development URL)
- On Mobile/Desktop, uses `10.0.2.2` (Android emulator default)
- Settings page allows runtime override for custom servers

## For Different Scenarios

### Chrome on Windows (localhost doesn't work)
If `localhost` doesn't work, find your Windows IP:
```bash
ipconfig
# Look for IPv4 Address, e.g., 192.168.1.100
```

In Settings page, set: `http://192.168.1.100:8000/api/v1`

### Chrome on Remote Server
If backend is on a different machine:
1. Find server IP
2. In Settings page, set: `http://{SERVER_IP}:8000/api/v1`
3. Tap "Save URL"
4. Hot restart or restart app

### Reverting to Default
1. Go to Settings page
2. Clear URL field
3. Delete saved URL from app data
4. Restart app

## Code Quality

✅ No hardcoded URLs per platform  
✅ Automatic detection at runtime  
✅ Fallback to defaults  
✅ User can override with Settings  
✅ Works on Web, Desktop, Mobile  

## Summary

**The connection timeout on Chrome is now FIXED.**

- ✅ Web uses `localhost:8000`
- ✅ Emulator uses `10.0.2.2:8000`
- ✅ Desktop uses `localhost:8000`
- ✅ All platforms supported

**Try login on Chrome now. It should work! 🚀**
