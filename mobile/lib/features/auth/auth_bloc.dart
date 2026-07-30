import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/auth_response.dart';
import '../../data/services/auth_service.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthService _authService;
  final FlutterSecureStorage _storage;

  AuthBloc(this._authService, this._storage) : super(const AuthInitial()) {
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthCheckStatus>(_onCheckStatus);
  }

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final request = LoginRequest(
        username: event.username,
        password: event.password,
        remember: event.remember,
      );

      final response = await _authService.login(request);

      if (response.success == true && response.token != null && response.user != null) {
        // Store token
        await _storage.write(
          key: AppConstants.accessTokenKey,
          value: response.token,
        );

        // Store user
        await _storage.write(
          key: AppConstants.userKey,
          value: response.user!.toJson().toString(),
        );

        emit(AuthAuthenticated(response.user!));
      } else {
        emit(AuthError(response.message ?? 'Login failed'));
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      await _authService.logout();
      
      // Clear storage
      await _storage.delete(key: AppConstants.accessTokenKey);
      await _storage.delete(key: AppConstants.refreshTokenKey);
      await _storage.delete(key: AppConstants.userKey);

      emit(const AuthUnauthenticated());
    } catch (e) {
      // Even if logout fails, clear local storage
      await _storage.delete(key: AppConstants.accessTokenKey);
      await _storage.delete(key: AppConstants.refreshTokenKey);
      await _storage.delete(key: AppConstants.userKey);
      
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onCheckStatus(
    AuthCheckStatus event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final token = await _storage.read(key: AppConstants.accessTokenKey);
      
      if (token != null) {
        final user = await _authService.getProfile();
        emit(AuthAuthenticated(user));
      } else {
        emit(const AuthUnauthenticated());
      }
    } catch (e) {
      // Clear invalid token
      await _storage.delete(key: AppConstants.accessTokenKey);
      await _storage.delete(key: AppConstants.refreshTokenKey);
      await _storage.delete(key: AppConstants.userKey);
      
      emit(const AuthUnauthenticated());
    }
  }
}
