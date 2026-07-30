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
        final data = response.data['data'];
        return PaginatedBorrowings.fromJson(data);
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

  /// Return a borrowed asset
  Future<Borrowing> returnAsset(int borrowingId, {String? notes}) async {
    try {
      final response = await _dio.post(
        '${AppConstants.borrowings}/$borrowingId/return',
        data: {
          if (notes != null) 'notes': notes,
        },
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

  /// Request extension for a borrowing due date
  Future<Map<String, dynamic>> requestExtension(
    int borrowingId, {
    required String newDueDate,
    String? reason,
  }) async {
    try {
      final response = await _dio.post(
        '${AppConstants.borrowings}/$borrowingId/request-extension',
        data: {
          'new_due_date': newDueDate,
          if (reason != null) 'reason': reason,
        },
      );

      if (response.statusCode == 200) {
        return response.data['data'] as Map<String, dynamic>;
      } else {
        throw Exception('Failed to request extension');
      }
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  /// Get borrowing receipt/details
  Future<Map<String, dynamic>> getReceipt(int borrowingId) async {
    try {
      final response = await _dio.get('${AppConstants.borrowings}/$borrowingId/receipt');

      if (response.statusCode == 200) {
        return response.data['data'] as Map<String, dynamic>;
      } else {
        return {};
      }
    } on DioException {
      return {};
    }
  }

  /// Get borrowing history for statistics
  Future<Map<String, dynamic>> getBorrowingStats() async {
    try {
      final response = await _dio.get('${AppConstants.borrowings}/stats');

      if (response.statusCode == 200) {
        return response.data['data'] as Map<String, dynamic>;
      } else {
        return {
          'active': 0,
          'returned': 0,
          'overdue': 0,
          'pending_requests': 0,
          'approved_requests': 0,
        };
      }
    } on DioException {
      return {
        'active': 0,
        'returned': 0,
        'overdue': 0,
        'pending_requests': 0,
        'approved_requests': 0,
      };
    }
  }
}
