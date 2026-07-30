import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../../core/utils/api_error_handler.dart';
import '../models/user.dart';

class UserService {
  final Dio _dio = ApiConfig.dio;

  Future<List<User>> getUsers({
    String? search,
    String? status,
    int page = 1,
    int perPage = 15,
  }) async {
    try {
      final response = await _dio.get('/users', queryParameters: {
        'page': page,
        'per_page': perPage,
        if (search != null && search.isNotEmpty) 'search': search,
        if (status != null && status.isNotEmpty) 'status': status,
      });
      final raw = response.data;
      final List<dynamic> list = raw is Map
          ? (raw['data']?['items'] ?? raw['data'] ?? []) as List<dynamic>
          : raw as List<dynamic>;
      return list.map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<User> getUser(int id) async {
    try {
      final response = await _dio.get('/users/$id');
      final raw = response.data;
      return User.fromJson(
          (raw is Map ? raw['data'] : raw) as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<User> createUser(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/users', data: data);
      final raw = response.data;
      return User.fromJson(
          (raw is Map ? raw['data'] : raw) as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<User> updateUser(int id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/users/$id', data: data);
      final raw = response.data;
      return User.fromJson(
          (raw is Map ? raw['data'] : raw) as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<void> deleteUser(int id) async {
    try {
      await _dio.delete('/users/$id');
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<void> resetPassword(int id, String newPassword) async {
    try {
      await _dio.post('/users/$id/reset-password', data: {
        'password': newPassword,
        'password_confirmation': newPassword,
      });
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  /// GET /api/v1/users/{id}/profile — returns user info + stats
  Future<Map<String, dynamic>> getUserProfile(int id) async {
    try {
      final response = await _dio.get('/users/$id/profile');
      final raw = response.data;
      return (raw is Map ? raw['data'] : raw) as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  /// GET /api/v1/users/{id}/borrowing-history
  Future<List<dynamic>> getBorrowingHistory(int id, {int page = 1}) async {
    try {
      final response = await _dio.get(
        '/users/$id/borrowing-history',
        queryParameters: {'page': page, 'per_page': 15},
      );
      final raw = response.data;
      final data = raw is Map ? raw['data'] : raw;
      return data is Map
          ? (data['items'] as List<dynamic>? ?? [])
          : data as List<dynamic>;
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    try {
      await _dio.put('/profile', data: data);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _dio.put('/change-password', data: {
        'current_password': currentPassword,
        'new_password': newPassword,
        'new_password_confirmation': newPassword,
      });
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }
}
