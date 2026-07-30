import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../../core/constants/app_constants.dart';
import '../../core/utils/api_error_handler.dart';
import '../models/auth_response.dart';
import '../models/user.dart';

class AuthService {
  final Dio _dio = ApiConfig.dio;

  Future<AuthResponse> login(LoginRequest request) async {
    try {
      final response = await _dio.post(
        AppConstants.login,
        data: request.toJson(),
      );
      
      if (response.statusCode == 200) {
        return AuthResponse.fromJson(response.data);
      } else {
        throw Exception('Login failed');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post(AppConstants.logout);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<User> getProfile() async {
    try {
      final response = await _dio.get(AppConstants.me);
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data.containsKey('data')) {
          return User.fromJson(data['data']);
        }
        return User.fromJson(data);
      } else {
        throw Exception('Failed to fetch profile');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }
}
