import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../../core/utils/api_error_handler.dart';
import '../models/maintenance_model.dart';

class MaintenanceService {
  final Dio _dio = ApiConfig.dio;

  Future<List<MaintenanceModel>> getMaintenances({
    String? status,
    int page = 1,
    int perPage = 15,
  }) async {
    try {
      final response = await _dio.get(
        '/maintenances',
        queryParameters: {
          'page': page,
          'per_page': perPage,
          if (status != null && status.isNotEmpty) 'status': status,
        },
      );
      final raw = response.data;
      final List<dynamic> list = raw is Map
          ? (raw['data']?['items'] ?? raw['data'] ?? []) as List<dynamic>
          : raw as List<dynamic>;
      return list.map((e) => MaintenanceModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<MaintenanceModel> getMaintenance(int id) async {
    try {
      final response = await _dio.get('/maintenances/$id');
      final raw = response.data;
      return MaintenanceModel.fromJson(
          (raw is Map ? raw['data'] : raw) as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<MaintenanceModel> createMaintenance({
    required int assetId,
    required String type,
    String? description,
    String? scheduledDate,
  }) async {
    try {
      final response = await _dio.post('/maintenances', data: {
        'asset_id': assetId,
        'type': type,
        if (description != null) 'description': description,
        if (scheduledDate != null) 'scheduled_date': scheduledDate,
      });
      final raw = response.data;
      return MaintenanceModel.fromJson(
          (raw is Map ? raw['data'] : raw) as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<MaintenanceModel> updateMaintenance(int id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/maintenances/$id', data: data);
      final raw = response.data;
      return MaintenanceModel.fromJson(
          (raw is Map ? raw['data'] : raw) as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<MaintenanceModel> completeMaintenance(int id, {String? notes}) async {
    try {
      final response = await _dio.post('/maintenances/$id/complete',
          data: {if (notes != null) 'notes': notes});
      final raw = response.data;
      return MaintenanceModel.fromJson(
          (raw is Map ? raw['data'] : raw) as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<void> cancelMaintenance(int id, {String? reason}) async {
    try {
      await _dio.post('/maintenances/$id/cancel',
          data: {if (reason != null) 'reason': reason});
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<void> deleteMaintenance(int id) async {
    try {
      await _dio.delete('/maintenances/$id');
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  /// Get maintenance statistics
  Future<Map<String, dynamic>> getMaintenanceStats() async {
    try {
      final response = await _dio.get('/maintenances/stats');
      if (response.statusCode == 200) {
        return response.data['data'] as Map<String, dynamic>;
      }
      return {
        'scheduled': 0,
        'in_progress': 0,
        'completed': 0,
        'overdue': 0,
      };
    } on DioException {
      return {
        'scheduled': 0,
        'in_progress': 0,
        'completed': 0,
        'overdue': 0,
      };
    }
  }
}
