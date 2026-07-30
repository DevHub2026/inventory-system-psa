import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../../core/constants/app_constants.dart';
import '../../core/utils/api_error_handler.dart';
import '../models/asset.dart';
import '../models/borrowing.dart';

class AssetService {
  final Dio _dio = ApiConfig.dio;

  Future<List<Asset>> getAssets({
    String? search,
    String? status,
    int? categoryId,
    int page = 1,
    int perPage = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'per_page': perPage,
      };

      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (status != null && status.isNotEmpty) queryParams['status'] = status;
      if (categoryId != null) queryParams['category_id'] = categoryId;

      final response = await _dio.get(
        AppConstants.assets,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final items = response.data['data'] as List<dynamic>;
        return items.map((e) => Asset.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        throw Exception('Failed to fetch assets');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<Asset> getAsset(int id) async {
    try {
      final response = await _dio.get('${AppConstants.assets}/$id');

      if (response.statusCode == 200) {
        return Asset.fromJson(response.data['data']);
      } else {
        throw Exception('Failed to fetch asset');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<Borrowing> borrowAsset(int assetId, {int? dueDays}) async {
    try {
      final response = await _dio.post(
        AppConstants.borrow.replaceAll('{id}', assetId.toString()),
        data: {
          'due_date': dueDays ?? 7,
        },
      );

      if (response.statusCode == 200) {
        return Borrowing.fromJson(response.data['data']);
      } else {
        throw Exception('Failed to borrow asset');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<Borrowing> returnAsset(int assetId) async {
    try {
      final response = await _dio.post(
        AppConstants.returnAsset.replaceAll('{id}', assetId.toString()),
      );

      if (response.statusCode == 200) {
        return Borrowing.fromJson(response.data['data']);
      } else {
        throw Exception('Failed to return asset');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<Borrowing> scanAsset(String identifier) async {
    try {
      final response = await _dio.post(
        AppConstants.scan,
        data: {
          'identifier': identifier,
        },
      );

      if (response.statusCode == 200) {
        return Borrowing.fromJson(response.data['data']);
      } else {
        throw Exception('Failed to scan asset');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }
}
