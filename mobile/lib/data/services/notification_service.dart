import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../../core/utils/api_error_handler.dart';
import '../../data/models/notification_model.dart';

class NotificationService {
  final Dio _dio = ApiConfig.dio;

  Future<List<NotificationModel>> getNotifications({int perPage = 20}) async {
    try {
      final response = await _dio.get(
        '/notifications',
        queryParameters: {'per_page': perPage},
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data.containsKey('data')) {
          final nested = data['data'] as Map<String, dynamic>;
          final items = nested['items'] as List<dynamic>? ?? [];
          return items.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
        }
        return <NotificationModel>[];
      } else {
        throw Exception('Failed to fetch notifications');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get('/notifications/unread-count');

      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data.containsKey('data')) {
          return data['data']['unread_count'] as int? ?? 0;
        }
        return 0;
      } else {
        throw Exception('Failed to fetch unread count');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<void> markAsRead(int notificationId) async {
    try {
      await _dio.post('/notifications/$notificationId/read');
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _dio.post('/notifications/mark-all-read');
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }
}