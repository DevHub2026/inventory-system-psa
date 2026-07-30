import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../../core/constants/app_constants.dart';
import '../../core/utils/api_error_handler.dart';
import '../models/borrowing.dart';

class BorrowingService {
  final Dio _dio = ApiConfig.dio;

  Future<PaginatedBorrowings> getBorrowings({
    String? status,
    int page = 1,
    int perPage = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'per_page': perPage,
      };

      if (status != null && status.isNotEmpty) queryParams['status'] = status;

      final response = await _dio.get(
        AppConstants.borrowings,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        return PaginatedBorrowings.fromJson(response.data);
      } else {
        throw Exception('Failed to fetch borrowings');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<Borrowing> getBorrowing(int id) async {
    try {
      final response = await _dio.get('${AppConstants.borrowings}/$id');

      if (response.statusCode == 200) {
        return Borrowing.fromJson(response.data['data']);
      } else {
        throw Exception('Failed to fetch borrowing');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }
}
