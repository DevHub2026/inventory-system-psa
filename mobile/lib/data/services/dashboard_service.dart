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
    // Backend returns nested structure + flat aliases
    // Handle both formats for compatibility
    
    // Try nested 'assets' group first, fallback to flat structure
    final assetsGroup = json['assets'] as Map<String, dynamic>?;
    final borrowingsGroup = json['borrowings'] as Map<String, dynamic>?;
    
    return DashboardStats(
      totalAssets: _parseInt(assetsGroup?['total'] ?? json['total_assets']),
      availableAssets: _parseInt(assetsGroup?['available'] ?? json['available']),
      borrowedAssets: _parseInt(assetsGroup?['borrowed'] ?? json['borrowed']),
      damagedAssets: _parseInt(assetsGroup?['maintenance'] ?? json['maintenance'] ?? 0),
      pendingBorrowRequests: _parseInt(borrowingsGroup?['pending_requests'] ?? json['pending_borrow_requests'] ?? 0),
      pendingReturns: _parseInt(assetsGroup?['borrowed'] ?? json['borrowed'] ?? 0), // Overdue = borrowed
    );
  }

  /// Parse int from dynamic value (handles String, int, or null)
  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
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
      id: _parseActivityId(json['id']),
      type: json['module'] as String? ?? json['type'] as String? ?? 'activity',
      description: json['action'] as String? ?? json['description'] as String? ?? 'Activity',
      userName: json['user'] as String? ?? json['user_name'] as String?,
      assetName: json['asset_name'] as String?,
      createdAt: json['created_at'] as String,
    );
  }

  /// Parse activity ID from dynamic value (handles String like 'borrowing-20' or int)
  static int _parseActivityId(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) {
      // Handle format like 'borrowing-20' or 'reservation-15'
      final match = RegExp(r'-(\d+)$').firstMatch(value);
      if (match != null) {
        return int.tryParse(match.group(1)!) ?? 0;
      }
      return int.tryParse(value) ?? 0;
    }
    return 0;
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