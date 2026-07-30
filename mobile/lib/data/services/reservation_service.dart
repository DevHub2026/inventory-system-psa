import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../../core/utils/api_error_handler.dart';
import '../models/reservation_model.dart';

class ReservationService {
  final Dio _dio = ApiConfig.dio;

  Future<List<ReservationModel>> getReservations({
    String? status,
    int page = 1,
    int perPage = 15,
  }) async {
    try {
      final response = await _dio.get(
        '/reservations',
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
      return list.map((e) => ReservationModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<ReservationModel> createReservation({
    required List<int> assetIds,
    required String startDate,
    String? endDate,
    String? remarks,
  }) async {
    try {
      final response = await _dio.post('/reservations', data: {
        'asset_ids': assetIds,
        'start_date': startDate,
        if (endDate != null) 'end_date': endDate,
        if (remarks != null) 'remarks': remarks,
      });
      final raw = response.data;
      return ReservationModel.fromJson(
          (raw is Map ? raw['data'] : raw) as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<ReservationModel> approveReservation(int id) async {
    try {
      final response = await _dio.post('/reservations/$id/approve');
      final raw = response.data;
      return ReservationModel.fromJson(
          (raw is Map ? raw['data'] : raw) as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  Future<void> cancelReservation(int id, {String? reason}) async {
    try {
      await _dio.post('/reservations/$id/cancel',
          data: {if (reason != null) 'reason': reason});
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  /// Reject a reservation (Staff/Admin only)
  Future<void> rejectReservation(int id, {String? reason}) async {
    try {
      await _dio.post('/reservations/$id/reject',
          data: {if (reason != null) 'reason': reason});
    } on DioException catch (e) {
      throw ApiErrorHandler.handleDioError(e);
    }
  }

  /// Get reservation receipt/details
  Future<Map<String, dynamic>> getReceipt(int reservationId) async {
    try {
      final response = await _dio.get('/reservations/$reservationId/receipt');
      if (response.statusCode == 200) {
        return response.data['data'] as Map<String, dynamic>;
      }
      return {};
    } on DioException {
      return {};
    }
  }

  /// Get reservation statistics
  Future<Map<String, dynamic>> getReservationStats() async {
    try {
      final response = await _dio.get('/reservations/stats');
      if (response.statusCode == 200) {
        return response.data['data'] as Map<String, dynamic>;
      }
      return {
        'pending': 0,
        'approved': 0,
        'rejected': 0,
        'completed': 0,
        'cancelled': 0,
      };
    } on DioException {
      return {
        'pending': 0,
        'approved': 0,
        'rejected': 0,
        'completed': 0,
        'cancelled': 0,
      };
    }
  }
}
