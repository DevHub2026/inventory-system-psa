import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../../core/utils/api_error_handler.dart';

class DashboardStats {
  final int totalAssets;
  final int availableAssets;
  final int borrowedAssets;
  final int damagedAssets;
  final int pendingBorrowRequests;
  final int pendingReturns;

  DashboardStats({
    required this.totalAssets,
    required this.availableAssets,
    required this.borrowedAssets,
    required this.damagedAssets,
    required this.pendingBorrowRequests,
    required this.pendingReturns,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalAssets: json['total_assets'] as int? ?? 0,
      availableAssets: json['available_assets'] as int? ?? 0,
      borrowedAssets: json['borrowed_assets'] as int? ?? 0,
      damagedAssets: json['damaged_assets'] as int? ?? 0,
      pendingBorrowRequests: json['pending_borrow_requests'] as int? ?? 0,
      pendingReturns: json['pending_returns'] as int? ?? 0,
    );
  }
}

class ActivityItem {
  final int id;
  final String type;
  final String description;
  final String? userName;
  final String? assetName;
  final String createdAt;

  ActivityItem({
    required this.id,
    required this.type,
    required this.description,
    this.userName,
    this.assetName,
    required this.createdAt,
  });

  factory ActivityItem.fromJson(Map<String, dynamic> json) {
    return ActivityItem(
      id: json['id'] as int,
      type: json['type'] as String,
      description: json['description'] as String,
      userName: json['user_name'] as String?,
      assetName: json['asset_name'] as String?,
      createdAt: json['created_at'] as String,
    );
  }
}

class DashboardService {
  final Dio _dio = ApiConfig.dio;

  Future<DashboardStats> getStats() async {
    try {
      final response = await _dio.get('/dashboard/stats');
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data.containsKey('data')) {
          return DashboardStats.fromJson(data['data']);
        }
        return DashboardStats.fromJson(data);
      } else {
        throw Exception('Failed to fetch dashboard stats');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<List<ActivityItem>> getRecentActivity() async {
    try {
      final response = await _dio.get('/dashboard/recent-activity');
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data.containsKey('data')) {
          final items = data['data'] as List<dynamic>;
          return items.map((e) => ActivityItem.fromJson(e as Map<String, dynamic>)).toList();
        }
        return <ActivityItem>[];
      } else {
        throw Exception('Failed to fetch recent activity');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }
}