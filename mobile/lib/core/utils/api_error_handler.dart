import 'package:dio/dio.dart';

class ApiErrorHandler {
  static Exception handleDioError(DioException error) {
    String message = 'An unexpected error occurred';
    
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
        message = 'Connection timeout. Cannot reach server at ${error.requestOptions.baseUrl}';
        break;
      case DioExceptionType.sendTimeout:
        message = 'Send timeout in connection with server';
        break;
      case DioExceptionType.receiveTimeout:
        message = 'Receive timeout in connection with server';
        break;
      case DioExceptionType.badResponse:
        final data = error.response?.data;
        if (data is Map<String, dynamic>) {
          if (data.containsKey('errors') && data['errors'] is Map<String, dynamic>) {
            final errorsMap = data['errors'] as Map<String, dynamic>;
            final firstErrorList = errorsMap.values.firstWhere(
              (element) => element is List && element.isNotEmpty,
              orElse: () => null,
            );
            if (firstErrorList != null && firstErrorList is List) {
              message = firstErrorList.first.toString();
            } else {
              message = data['message'] ?? 'Validation failed';
            }
          } else {
            message = data['message'] ?? error.response?.statusMessage ?? 'Server error (${error.response?.statusCode})';
          }
        } else {
          message = error.response?.statusMessage ?? 'Server error (${error.response?.statusCode})';
        }
        break;
      case DioExceptionType.cancel:
        message = 'Request to server was cancelled';
        break;
      case DioExceptionType.connectionError:
        message = 'Cannot connect to server at ${error.requestOptions.baseUrl}. Ensure PC firewall allows port 8000 and phone is on the same Wi-Fi.';
        break;
      default:
        message = error.message ?? 'Something went wrong. Please try again.';
    }
    
    return Exception(message);
  }
}
