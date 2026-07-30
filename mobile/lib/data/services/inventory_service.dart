import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../../core/utils/api_error_handler.dart';
import '../models/inventory_model.dart';

class InventoryService {
  final Dio _dio = ApiConfig.dio;

  Future<List<InventoryModel>> getInventory({
    String? search,
    String? status,
    int page = 1,
    int perPage = 15,
  }) async {
    try {
      final response = await _dio.get(
        '/inventory',
        queryParameters: {
          'page': page,
          'per_page': perPage,
          if (search != null && search.isNotEmpty) 'search': search,
          if (status != null && status.isNotEmpty) 'status': status,
        },
      );
      final raw = response.data;
      final List<dynamic> list = raw is Map
          ? (raw['data']?['items'] ?? raw['data'] ?? []) as List<dynamic>
          : raw as List<dynamic>;
      return list.map((e) => InventoryModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<InventoryModel> getInventoryItem(int id) async {
    try {
      final response = await _dio.get('/inventory/$id');
      final raw = response.data;
      return InventoryModel.fromJson(
          (raw is Map ? raw['data'] : raw) as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }
}
