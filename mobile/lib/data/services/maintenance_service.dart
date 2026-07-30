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
}
