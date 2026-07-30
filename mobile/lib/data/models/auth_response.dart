import 'user.dart';

class AuthResponse {
  final String? token;
  final User? user;
  final String? message;
  final bool? success;

  AuthResponse({
    this.token,
    this.user,
    this.message,
    this.success,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] as String?,
      user: json['user'] != null 
          ? User.fromJson(json['user'] as Map<String, dynamic>) 
          : null,
      message: json['message'] as String?,
      success: json['success'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'user': user?.toJson(),
      'message': message,
      'success': success,
    };
  }
}

class LoginRequest {
  final String username;
  final String password;
  final bool? remember;

  LoginRequest({
    required this.username,
    required this.password,
    this.remember,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': username,
      'username': username,
      'password': password,
      'remember': remember,
    };
  }
}
