import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'config/api_config.dart';
import 'core/theme/app_theme.dart';
import 'data/services/auth_service.dart';
import 'features/auth/auth_bloc.dart';
import 'features/auth/auth_event.dart';
import 'features/auth/auth_state.dart';
import 'features/auth/login_page.dart';
import 'features/auth/forgot_password_page.dart';
import 'features/main/main_navigation.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize API configuration (load base URL from SharedPreferences)
  await ApiConfig.initialize();

  // Lock to portrait only (can be unlocked for tablets)
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Status bar: white icons on dark PSA blue
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));

  runApp(const PSAInventoryApp());
}

class PSAInventoryApp extends StatelessWidget {
  const PSAInventoryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AuthBloc(
        AuthService(),
        const FlutterSecureStorage(),
      )..add(const AuthCheckStatus()),
      child: MaterialApp(
        title: 'PSA Inventory',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            if (state is AuthLoading || state is AuthInitial) {
              return const _SplashScreen();
            }
            if (state is AuthAuthenticated) {
              return MainNavigation(user: state.user);
            }
            return const LoginPage();
          },
        ),
        onGenerateRoute: (settings) {
          switch (settings.name) {
            case '/forgot-password':
              return MaterialPageRoute(
                builder: (_) => const ForgotPasswordPage(),
              );
            default:
              return null;
          }
        },
      ),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.primaryHover,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // PSA Logo
            Image.asset(
              'assets/images/logo.png',
              width: 120,
              height: 120,
              fit: BoxFit.contain,
            ),
            const SizedBox(height: 32),
            // App Name
            const Text(
              'PSA Inventory',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.3,
              ),
            ),
            const SizedBox(height: 40),
            // Loading indicator
            const CircularProgressIndicator(
              color: Colors.white,
              strokeWidth: 2.5,
            ),
          ],
        ),
      ),
    );
  }
}
