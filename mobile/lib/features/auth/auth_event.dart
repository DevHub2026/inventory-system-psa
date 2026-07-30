import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthLoginRequested extends AuthEvent {
  final String username;
  final String password;
  final bool? remember;

  const AuthLoginRequested({
    required this.username,
    required this.password,
    this.remember,
  });

  @override
  List<Object?> get props => [username, password, remember];
}

class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

class AuthCheckStatus extends AuthEvent {
  const AuthCheckStatus();
}
