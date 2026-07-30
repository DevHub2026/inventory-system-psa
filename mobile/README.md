# PSA Inventory Mobile App

A native Android mobile application for the PSA Inventory Management System, built with Flutter.

## Overview

This mobile app complements the existing web-based PSA Inventory Management System, allowing employees to:
- Login with existing credentials
- View dashboard statistics
- Scan QR codes to borrow/return assets
- View borrowing history
- Manage their profile

## Technology Stack

- **Framework**: Flutter 3.44.6
- **Language**: Dart 3.12.2
- **State Management**: Flutter BLoC
- **API Communication**: Dio
- **Secure Storage**: flutter_secure_storage
- **QR Scanning**: mobile_scanner
- **Notifications**: flutter_local_notifications
- **Connectivity**: connectivity_plus

## Features

### Implemented
- ✅ Authentication (login, logout, token storage)
- ✅ Dashboard with statistics cards
- ✅ QR Code Scanner for asset borrowing/returning
- ✅ Borrowing history with status filtering
- ✅ User profile display
- ✅ Bottom navigation
- ✅ PSA-themed UI design
- ✅ Secure token storage
- ✅ API integration with Laravel backend

### Pending
- ⏳ Asset management (list, search, filters)
- ⏳ Local notifications
- ⏳ Offline support
- ⏳ Push notifications (Firebase)

## Project Structure

```
lib/
├── config/              # API configuration
├── core/
│   ├── constants/      # App constants
│   ├── theme/          # App theme
│   └── utils/          # Utility functions
├── data/
│   ├── models/         # Data models
│   ├── services/       # API services
│   └── repositories/   # Data repositories
├── features/
│   ├── auth/           # Authentication module
│   ├── dashboard/      # Dashboard module
│   ├── assets/         # Asset management
│   ├── borrowing/      # Borrowing module
│   ├── qr_scanner/     # QR scanner module
│   ├── notifications/  # Notifications module
│   └── profile/        # Profile module
└── shared/
    ├── widgets/        # Shared widgets
    └── providers/      # Shared providers
```

## Setup

### Prerequisites
- Flutter SDK 3.12.2 or higher
- Android Studio / VS Code with Flutter extension
- Android SDK (API level 29+)

### Installation

1. Clone the repository:
```bash
cd mobile
```

2. Install dependencies:
```bash
flutter pub get
```

3. Configure API base URL:
```bash
flutter run --dart-define=API_BASE_URL=http://your-backend-url/api/v1
```

Or edit `lib/core/constants/app_constants.dart` to set the default URL.

### Running the App

```bash
flutter run
```

### Building Release APK

```bash
flutter build apk --release
```

The APK will be generated at `build/app/outputs/flutter-apk/app-release.apk`.

## API Integration

The app connects to the existing Laravel backend API:
- Base URL: Configured in `AppConstants.baseUrl`
- Authentication: Laravel Sanctum tokens
- Endpoints: Reuses existing API endpoints

## Permissions

The app requires the following Android permissions:
- `INTERNET` - For API communication
- `CAMERA` - For QR code scanning
- `POST_NOTIFICATIONS` - For local notifications
- `ACCESS_NETWORK_STATE` - For connectivity checking

## Security

- Tokens stored securely using flutter_secure_storage
- Automatic token refresh on 401 responses
- HTTPS recommended for production
- No sensitive data stored in plain text

## Development

### Code Style
- Follow Flutter/Dart best practices
- Use BLoC pattern for state management
- Modular architecture with feature-based organization

### Testing
```bash
flutter test
```

### Analysis
```bash
flutter analyze
```

## Future Enhancements

- iOS support
- Offline mode with data synchronization
- Push notifications via Firebase Cloud Messaging
- Asset catalog with search and filters
- Advanced borrowing statistics
- Report generation and export

## License

This project is part of the PSA Inventory Management System.
