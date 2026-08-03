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
        User user;
        if (data is Map<String, dynamic> && data.containsKey('data')) {
          user = User.fromJson(data['data']);
        } else {
          user = User.fromJson(data);
        }
        
        // Ensure roles are loaded - fetch separately if missing
        if (user.roles == null || user.roles!.isEmpty) {
          try {
            final rolesResponse = await _dio.get('/user-roles');
            if (rolesResponse.statusCode == 200) {
              final rolesData = rolesResponse.data;
              List<Role> roles = [];
              if (rolesData is Map<String, dynamic> && rolesData.containsKey('data')) {
                final rolesList = rolesData['data'] as List<dynamic>;
                roles = rolesList.map((e) => Role.fromJson(e as Map<String, dynamic>)).toList();
              } else if (rolesData is List<dynamic>) {
                roles = rolesData.map((e) => Role.fromJson(e as Map<String, dynamic>)).toList();
              }
              
              // Merge roles into user
              user = User(
                id: user.id,
                employeeNumber: user.employeeNumber,
                username: user.username,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,
                name: user.name,
                status: user.status,
                createdAt: user.createdAt,
                department: user.department,
                office: user.office,
                roles: roles.isNotEmpty ? roles : user.roles,
              );
            }
          } catch (e) {
            // If fetching roles fails, continue with existing user data
            // The dashboard will default to Employee view if no roles
          }
        }
        
        return user;
      } else {
        throw Exception('Failed to fetch profile');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }
}