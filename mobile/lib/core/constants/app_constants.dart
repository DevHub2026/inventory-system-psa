// ignore_for_file: constant_identifier_names
import 'package:flutter/foundation.dart';

class AppConstants {
  AppConstants._();

  // ── API Base ─────────────────────────────────────────────────────────────
  /// Platform-specific base URL
  /// - Web (Chrome/Firefox): http://localhost:8000/api/v1
  /// - Android Emulator: http://10.0.2.2:8000/api/v1
  /// - Windows Desktop: http://localhost:8000/api/v1
  /// - Physical Device: http://{LAN_IP}:8000/api/v1 (set in Settings)
  static String get baseUrl {
    if (kIsWeb) {
      // Web platform: use localhost
      return 'http://localhost:8000/api/v1';
    } else {
      // Mobile/Desktop: use Android emulator IP (can be changed in Settings)
      return 'http://10.0.2.2:8000/api/v1';
    }
  }

  // ── Timeouts ─────────────────────────────────────────────────────────────
  static const int connectTimeout = 15000;
  static const int receiveTimeout = 30000;
  static const int sendTimeout = 30000;

  // ── Storage keys (matching existing code) ────────────────────────────────
  static const String accessTokenKey  = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey         = 'auth_user';
  static const String keyBaseUrl      = 'base_url';

  // ── API Endpoints ────────────────────────────────────────────────────────
  static const String login        = '/login';
  static const String logout       = '/logout';
  static const String me           = '/me';
  static const String assets       = '/assets';
  static const String borrow       = '/assets/{id}/borrow';
  static const String returnAsset  = '/assets/{id}/return';
  static const String scan         = '/assets/scan';
  static const String borrowings   = '/borrowings';
  static const String notifications = '/notifications';

  // ── PSA brand colours ────────────────────────────────────────────────────
  static const int psaBlue       = 0xFF0D47A1;
  static const int psaBlueDark   = 0xFF0B3D91;
  static const int psaBlueLight  = 0xFFBFDBFE;
  static const int psaAccent     = 0xFF1D4ED8;

  // ── Role names (must match backend exactly) ──────────────────────────────
  static const String roleSuperAdmin  = 'Super Administrator';
  static const String roleSysAdmin    = 'System Administrator';
  static const String roleCustodian   = 'Property Custodian';
  static const String roleOfficer     = 'Inventory Officer';
  static const String roleDeptHead    = 'Department Head';
  static const String roleEmployee    = 'Employee';
}
