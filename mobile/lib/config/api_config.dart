import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_constants.dart';

class ApiConfig {
  static String _getDefaultBaseUrl() {
    // Automatically select correct base URL based on platform/environment
    if (kDebugMode) {
      // In debug mode, try to use saved URL first
      // This will be loaded async in _initializeBaseUrl()
      return AppConstants.baseUrl;
    }
    // Production
    return AppConstants.baseUrl;
  }

  static Future<String> _getBaseUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(AppConstants.keyBaseUrl);
      if (saved != null && saved.isNotEmpty) {
        return saved;
      }
    } catch (e) {
      if (kDebugMode) debugPrint('Failed to read saved base URL: $e');
    }
    return _getDefaultBaseUrl();
  }

  static Dio createDio(String baseUrl) {
    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(milliseconds: AppConstants.connectTimeout),
      receiveTimeout: const Duration(milliseconds: AppConstants.receiveTimeout),
      sendTimeout: const Duration(milliseconds: AppConstants.sendTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptors for Auth Token & Debug Logging
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token if available
        const storage = FlutterSecureStorage();
        final token = await storage.read(key: AppConstants.accessTokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        if (kDebugMode) {
          debugPrint('==================== API REQUEST ====================');
          debugPrint('URL: ${options.baseUrl}${options.path}');
          debugPrint('METHOD: ${options.method}');
          debugPrint('HEADERS: ${options.headers}');
          debugPrint('PAYLOAD: ${options.data}');
          debugPrint('=====================================================');
        }

        return handler.next(options);
      },
      onResponse: (response, handler) {
        if (kDebugMode) {
          debugPrint('==================== API RESPONSE ===================');
          debugPrint('URL: ${response.requestOptions.baseUrl}${response.requestOptions.path}');
          debugPrint('STATUS CODE: ${response.statusCode}');
          debugPrint('BODY: ${response.data}');
          debugPrint('=====================================================');
        }
        return handler.next(response);
      },
      onError: (error, handler) async {
        if (kDebugMode) {
          debugPrint('==================== API ERROR =====================');
          debugPrint('URL: ${error.requestOptions.baseUrl}${error.requestOptions.path}');
          debugPrint('ERROR TYPE: ${error.type}');
          debugPrint('STATUS CODE: ${error.response?.statusCode}');
          debugPrint('ERROR DATA: ${error.response?.data}');
          debugPrint('MESSAGE: ${error.message}');
          debugPrint('=====================================================');
        }

        if (error.response?.statusCode == 401) {
          // Token expired, clear storage
          const storage = FlutterSecureStorage();
          await storage.delete(key: AppConstants.accessTokenKey);
          await storage.delete(key: AppConstants.refreshTokenKey);
          await storage.delete(key: AppConstants.userKey);
        }
        return handler.next(error);
      },
    ));

    return dio;
  }

  // Initialize Dio with dynamic base URL
  static Future<Dio> _initializeDio() async {
    final baseUrl = await _getBaseUrl();
    return createDio(baseUrl);
  }

  static late Dio dio;

  // Call this from main() before runApp()
  static Future<void> initialize() async {
    dio = await _initializeDio();
  }

  // Update base URL at runtime
  static Future<void> updateBaseUrl(String newBaseUrl) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyBaseUrl, newBaseUrl);
    // Reinitialize Dio with new URL
    dio = createDio(newBaseUrl);
  }

  // Get current base URL
  static Future<String> getCurrentBaseUrl() async {
    return _getBaseUrl();
  }
}
