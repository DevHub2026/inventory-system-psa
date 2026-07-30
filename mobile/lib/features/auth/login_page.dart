import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../core/theme/app_theme.dart';
import '../auth/auth_bloc.dart';
import '../auth/auth_event.dart';
import '../auth/auth_state.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _rememberMe = false;
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic);
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.05),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic));
    _animController.forward();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _handleLogin() {
    if (_formKey.currentState!.validate()) {
      context.read<AuthBloc>().add(
            AuthLoginRequested(
              username: _usernameController.text.trim(),
              password: _passwordController.text,
              remember: _rememberMe,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.errorColor,
              ),
            );
          }
        },
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final isLarge = constraints.maxWidth > 600;
              
              if (isLarge) {
                return _buildWideLayout();
              }
              return _buildNarrowLayout();
            },
          ),
        ),
      ),
    );
  }

  Widget _buildWideLayout() {
    return Row(
      children: [
        // Left Brand Panel
        Expanded(
          flex: 42,
          child: _buildBrandPanel(),
        ),
        // Right Login Panel
        Expanded(
          flex: 58,
          child: _buildLoginPanel(),
        ),
      ],
    );
  }

  Widget _buildNarrowLayout() {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildCompactBrandPanel(),
          _buildLoginPanel(),
        ],
      ),
    );
  }

  Widget _buildBrandPanel() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment(0.36, -0.14),
          end: Alignment(-0.36, 0.14),
          colors: [
            Color(0xFF1976D2),
            Color(0xFF1565C0),
            Color(0xFF0D47A1),
            Color(0xFF0A3580),
            Color(0xFF07236B),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Sheen overlay
          Positioned.fill(
            child: CustomPaint(
              painter: _SheenPainter(),
            ),
          ),
          // Content
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo ring
                  _buildLogoRing(140),
                  const SizedBox(height: 28),
                  // Title
                  const Text(
                    'PHILIPPINE\nSTATISTICS\nAUTHORITY',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.05,
                      height: 1.03,
                      shadows: [Shadow(color: Color(0x66001450), blurRadius: 20)],
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Tri-color accent
                  _buildTriColor(120),
                  const SizedBox(height: 12),
                  Text(
                    'Republic of the Philippines',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.72),
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                      letterSpacing: 0.03,
                    ),
                  ),
                  const SizedBox(height: 16),
                  // System pill
                  _buildSystemPill(),
                  const SizedBox(height: 10),
                  Text(
                    'REGION XII',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.45),
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.18,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactBrandPanel() {
    return Container(
      constraints: const BoxConstraints(minHeight: 200),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment(0.36, -0.14),
          end: Alignment(-0.36, 0.14),
          colors: [
            Color(0xFF1976D2),
            Color(0xFF1565C0),
            Color(0xFF0D47A1),
            Color(0xFF0A3580),
            Color(0xFF07236B),
          ],
        ),
      ),
      child: Stack(
        children: [
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildLogoRing(70),
                  const SizedBox(height: 14),
                  const Text(
                    'PHILIPPINE STATISTICS AUTHORITY',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.05,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _buildTriColor(80),
                  const SizedBox(height: 8),
                  Text(
                    'REGION XII',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.18,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoRing(double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withValues(alpha: 0.13),
        border: Border.all(color: Colors.white.withValues(alpha: 0.22), width: 2),
        boxShadow: [
          BoxShadow(
            color: const Color(0x4D001450),
            blurRadius: 32,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: const Icon(
        Icons.analytics_outlined,
        size: 50,
        color: Colors.white,
      ),
    );
  }

  Widget _buildTriColor(double width) {
    return SizedBox(
      width: width,
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 3.5,
              decoration: BoxDecoration(
                color: const Color(0xFF60B8FF),
                borderRadius: BorderRadius.circular(99),
                boxShadow: [BoxShadow(color: const Color(0xB060B8FF), blurRadius: 8)],
              ),
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Container(
              height: 3.5,
              decoration: BoxDecoration(
                color: const Color(0xFFFFD400),
                borderRadius: BorderRadius.circular(99),
                boxShadow: [BoxShadow(color: const Color(0xB0FFD400), blurRadius: 8)],
              ),
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Container(
              height: 3.5,
              decoration: BoxDecoration(
                color: const Color(0xFFFF5A5F),
                borderRadius: BorderRadius.circular(99),
                boxShadow: [BoxShadow(color: const Color(0xB0FF5A5F), blurRadius: 8)],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSystemPill() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFF4ADE80),
              boxShadow: [BoxShadow(color: Color(0xCC4ADE80), blurRadius: 6)],
            ),
          ),
          const SizedBox(width: 7),
          Text(
            'INVENTORY MANAGEMENT SYSTEM',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.88),
              fontSize: 10,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginPanel() {
    return Container(
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment(-0.3, -0.3),
          radius: 1.5,
          colors: [
            Color(0xFFEEF3FB),
            Color(0xFFE8EFF8),
          ],
        ),
      ),
      child: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
              child: _buildLoginCard(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginCard() {
    return Container(
      width: 420,
      constraints: const BoxConstraints(maxWidth: 420),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x4DB4D2FF)),
        boxShadow: [
          BoxShadow(
            color: const Color(0x12002882),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: const Color(0x1F002882),
            blurRadius: 48,
            offset: const Offset(0, 16),
          ),
          BoxShadow(
            color: const Color(0x12002882),
            blurRadius: 80,
            offset: const Offset(0, 40),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Top accent strip
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            child: SizedBox(
              height: 4,
              child: Row(
                children: [
                  Expanded(child: Container(color: const Color(0xFF1565C0))),
                  Expanded(child: Container(color: const Color(0xFFFFD400))),
                  Expanded(child: Container(color: const Color(0xFFE31C23))),
                ],
              ),
            ),
          ),
          // Card body
          Padding(
            padding: const EdgeInsets.fromLTRB(28, 24, 28, 32),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
                  Column(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryPale,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(
                          Icons.analytics_outlined,
                          size: 48,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'PSA Inventory',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0D3B8E),
                          letterSpacing: -0.02,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'ASSET MANAGEMENT SYSTEM',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF7A96B8),
                          letterSpacing: 0.04,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // Divider
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 1,
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Colors.transparent, Color(0xFFD0DFF5), Colors.transparent],
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          'SIGN IN',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF9AB0D0),
                            letterSpacing: 0.08,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Container(
                          height: 1,
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Colors.transparent, Color(0xFFD0DFF5), Colors.transparent],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  
                  // Username/Email
                  _buildInputField(
                    controller: _usernameController,
                    label: 'Username or Email',
                    icon: Icons.person_outline,
                    validator: (v) => v == null || v.trim().isEmpty ? 'Please enter your username or email' : null,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 14),
                  
                  // Password
                  _buildInputField(
                    controller: _passwordController,
                    label: 'Password',
                    icon: Icons.lock_outline,
                    obscure: true,
                    validator: (v) => v == null || v.isEmpty ? 'Please enter your password' : null,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _handleLogin(),
                  ),
                  const SizedBox(height: 12),
                  
                  // Forgot password
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Password reset feature coming soon')),
                        );
                      },
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Forgot Password?',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1565C0),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Login Button (matching web gradient style)
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      final loading = state is AuthLoading;
                      return Container(
                        height: 50,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(13),
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              Color(0xFF1E88E5),
                              Color(0xFF1565C0),
                              Color(0xFF0D47A1),
                              Color(0xFF0A3580),
                            ],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0x730D47A1),
                              blurRadius: 16,
                              offset: const Offset(0, 4),
                            ),
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.18),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: loading ? null : _handleLogin,
                            borderRadius: BorderRadius.circular(13),
                            child: Center(
                              child: loading
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                      ),
                                    )
                                  : const Text(
                                      'SIGN IN',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 0.12,
                                      ),
                                    ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  
                  // Security note
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.lock_outline, size: 12, color: const Color(0xFF9AB0D0)),
                      const SizedBox(width: 5),
                      Text(
                        'Secured sign in · PSA Network',
                        style: TextStyle(
                          fontSize: 10.5,
                          color: const Color(0xFF9AB0D0),
                          letterSpacing: 0.01,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscure = false,
    String? Function(String?)? validator,
    TextInputAction textInputAction = TextInputAction.next,
    void Function(String)? onSubmitted,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: const Color(0xFFD8E7F8), width: 1.5),
        color: const Color(0xFFF4F8FF),
      ),
      child: TextFormField(
        controller: controller,
        obscureText: obscure,
        validator: validator,
        textInputAction: textInputAction,
        onFieldSubmitted: onSubmitted,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: Color(0xFF1A2A4A),
        ),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(
            color: Color(0xFF90AED0),
            fontSize: 14,
          ),
          floatingLabelStyle: const TextStyle(
            color: Color(0xFF1565C0),
            fontSize: 12,
          ),
          prefixIcon: Icon(icon, size: 18, color: const Color(0xFF90AED0)),
          suffixIcon: obscure
              ? IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    size: 18,
                    color: const Color(0xFF90AED0),
                  ),
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                )
              : null,
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          errorBorder: InputBorder.none,
          focusedErrorBorder: InputBorder.none,
          filled: false,
          contentPadding: const EdgeInsets.symmetric(horizontal: 46, vertical: 14),
        ),
      ),
    );
  }
}

class _SheenPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final gradient = RadialGradient(
      center: const Alignment(0.15, 0.10),
      radius: 1.2,
      colors: [
        const Color(0x4714B4FF).withValues(alpha: 0.28),
        Colors.transparent,
      ],
    );
    final paint = Paint()..shader = gradient.createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}