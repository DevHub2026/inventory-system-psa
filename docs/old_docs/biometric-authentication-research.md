# Biometric Authentication Research

## Overview
Research and implementation plan for biometric authentication in the PSA Inventory Management System.

## Supported Platforms

### Web (Desktop/Laptop)
- **WebAuthn/FIDO2**: Standard web API for passwordless authentication
  - Supports: Windows Hello, Touch ID (macOS), USB security keys
  - Browser support: Chrome, Edge, Firefox, Safari (modern versions)
  - Implementation: Laravel WebAuthn package or native WebAuthn API

### Mobile (Future Flutter App)
- **Local Authentication**: Flutter biometric plugins
  - `local_auth` package: Fingerprint, Face ID (iOS), Face Unlock (Android)
  - Platform-specific APIs: Touch ID, Face ID, Android BiometricPrompt

## Implementation Strategy

### Phase 1: WebAuthn for Web (Recommended First)
1. **Backend Setup**
   - Install Laravel WebAuthn package: `laravel-webauthn`
   - Configure WebAuthn in Laravel
   - Add biometric credential storage to users table

2. **Frontend Setup**
   - Integrate WebAuthn API in React
   - Add "Enable Biometric Login" option in Settings
   - Implement biometric login flow on login page

3. **Security Considerations**
   - Biometric as 2FA (password still required initially)
   - Require device registration before biometric use
   - Fallback to password always available
   - Rate limiting for biometric attempts

### Phase 2: Mobile Biometrics (Flutter)
1. **Flutter Setup**
   - Add `local_auth` package
   - Add `flutter_secure_storage` for credential storage

2. **Implementation**
   - Biometric enrollment after successful login
   - Biometric login option on mobile app
   - Sync with WebAuthn credentials via API

## Database Schema Changes

### Add to `users` table:
```php
$table->json('webauthn_credentials')->nullable(); // Store WebAuthn credentials
$table->boolean('biometric_enabled')->default(false);
```

## API Endpoints

### WebAuthn Endpoints
- `POST /api/v1/webauthn/register/options` - Get registration options
- `POST /api/v1/webauthn/register` - Complete registration
- `POST /api/v1/webauthn/login/options` - Get login options
- `POST /api/v1/webauthn/login` - Complete biometric login

### Mobile Biometric Endpoints
- `POST /api/v1/biometric/enroll` - Enroll biometric (mobile)
- `POST /api/v1/biometric/verify` - Verify biometric (mobile)

## Security Requirements

1. **Device Binding**: Biometric credentials bound to specific device
2. **User Verification**: Require PIN/password fallback
3. **Rate Limiting**: Prevent brute force attacks
4. **Credential Revocation**: Allow users to revoke biometric access
5. **Audit Logging**: Log all biometric authentication attempts

## User Flow

### Enrollment
1. User logs in with password
2. User navigates to Settings → Security
3. User clicks "Enable Biometric Login"
4. System prompts for biometric registration
5. User authenticates with device biometric
6. Credential stored and linked to user account

### Login
1. User visits login page
2. System detects available biometric methods
3. User can choose password or biometric login
4. If biometric selected, user authenticates
5. System verifies credential and creates session

## Compliance Notes

- **Philippine Data Privacy Act (RA 10173)**: Biometric data is sensitive personal information
  - Require explicit consent
  - Store securely (encrypted)
  - Allow data deletion
  - Document data processing

## Recommended Libraries

### Laravel (Backend)
- `laravel-webauthn` - WebAuthn implementation for Laravel
- `web-auth/webauthn-lib` - WebAuthn library

### React (Frontend)
- `@simplewebauthn/browser` - WebAuthn browser library
- `@simplewebauthn/server` - WebAuthn server utilities

### Flutter (Mobile)
- `local_auth` - Local authentication
- `flutter_secure_storage` - Secure storage
- `passkeys` - Passkeys/FIDO2 support

## Timeline Estimate

- **Phase 1 (Web)**: 2-3 weeks
  - Backend integration: 1 week
  - Frontend implementation: 1 week
  - Testing and security review: 1 week

- **Phase 2 (Mobile)**: 1-2 weeks (after Flutter app development)
  - Plugin integration: 3 days
  - API integration: 3 days
  - Testing: 4 days

## Next Steps

1. Evaluate WebAuthn package compatibility with Laravel 12
2. Create proof-of-concept for WebAuthn login
3. Design UI for biometric enrollment
4. Implement security audit logging
5. Draft user consent form for biometric data collection
