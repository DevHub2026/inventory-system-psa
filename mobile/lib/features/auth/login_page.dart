import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../auth/auth_bloc.dart';
import '../auth/auth_event.dart';
import '../auth/auth_state.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  final bool _rememberMe = false;
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late AnimationController _bubbleController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = CurvedAnimation(
        parent: _animController, curve: Curves.easeOutCubic);
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.05),
      end: Offset.zero,
    ).animate(
        CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic));
    _animController.forward();

    // Bubble / particle animation controller — loops forever
    _bubbleController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    _bubbleController.dispose();
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
    // Apply Inter font (matching web login page) to the entire login page
    final interTheme = Theme.of(context).copyWith(
      textTheme: GoogleFonts.interTextTheme(Theme.of(context).textTheme),
    );

    return Theme(
      data: interTheme,
      child: Scaffold(
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

  // ════════════════════════════════════════════════════════════════
  //  BRAND PANEL  (wide layout)
  // ════════════════════════════════════════════════════════════════
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
          // Sheen overlay (matches web ::before pseudo-element)
          Positioned.fill(
            child: CustomPaint(painter: _SheenPainter()),
          ),
          // Floating bubble particles
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _bubbleController,
              builder: (context, _) {
                return CustomPaint(
                  painter: _BubblePainter(_bubbleController.value),
                  size: Size.infinite,
                );
              },
            ),
          ),
          // Bottom wave
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 120,
            child: CustomPaint(painter: _WavePainter()),
          ),
          // Content
          Center(
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
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
                      shadows: [
                        Shadow(color: Color(0x66001450), blurRadius: 20)
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Tri-color accent
                  _buildTriColor(120),
                  const SizedBox(height: 12),
                  // Tagline — "Solid, responsive, World Class"
                  _buildTagline(),
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

  // ════════════════════════════════════════════════════════════════
  //  COMPACT BRAND PANEL  (narrow / mobile layout)
  // ════════════════════════════════════════════════════════════════
  Widget _buildCompactBrandPanel() {
    return Container(
      constraints: const BoxConstraints(minHeight: 240),
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
          // Sheen overlay (matches web ::before pseudo-element)
          Positioned.fill(child: CustomPaint(painter: _SheenPainter())),
          // Floating bubble particles
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _bubbleController,
              builder: (context, _) {
                return CustomPaint(
                  painter: _BubblePainter(_bubbleController.value),
                  size: Size.infinite,
                );
              },
            ),
          ),
          // Bottom wave
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 80,
            child: CustomPaint(painter: _WavePainter()),
          ),
          Center(
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildLogoRing(72),
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
                  _buildTagline(fontSize: 11),
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

  // ── Logo ring with PSA logo image ──
  Widget _buildLogoRing(double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withValues(alpha: 0.13),
        border:
            Border.all(color: Colors.white.withValues(alpha: 0.22), width: 2),
        boxShadow: const [
          BoxShadow(
            color: Color(0x4D001450),
            blurRadius: 32,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.all(size * 0.11),
        child: Image.asset(
          'assets/images/logo.png',
          fit: BoxFit.contain,
        ),
      ),
    );
  }

  // ── Tri-color accent bar ──
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
                boxShadow: const [
                  BoxShadow(color: Color(0xB060B8FF), blurRadius: 8)
                ],
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
                boxShadow: const [
                  BoxShadow(color: Color(0xB0FFD400), blurRadius: 8)
                ],
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
                boxShadow: const [
                  BoxShadow(color: Color(0xB0FF5A5F), blurRadius: 8)
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Tagline: "Solid • Responsive • World-class" with colored dots ──
  Widget _buildTagline({double fontSize = 13}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Solid',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.72),
            fontSize: fontSize,
            fontWeight: FontWeight.w400,
            letterSpacing: 0.03,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6),
          child: Text(
            '●',
            style: TextStyle(
              color: const Color(0xFF60B8FF),
              fontSize: fontSize * 0.5,
            ),
          ),
        ),
        Text(
          'Responsive',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.72),
            fontSize: fontSize,
            fontWeight: FontWeight.w400,
            letterSpacing: 0.03,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6),
          child: Text(
            '●',
            style: TextStyle(
              color: const Color(0xFFFFD400),
              fontSize: fontSize * 0.5,
            ),
          ),
        ),
        Text(
          'World-class',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.72),
            fontSize: fontSize,
            fontWeight: FontWeight.w400,
            letterSpacing: 0.03,
          ),
        ),
      ],
    );
  }

  // ── System pill ──
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

  // ════════════════════════════════════════════════════════════════
  //  LOGIN PANEL
  // ════════════════════════════════════════════════════════════════
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
      child: Stack(
        children: [
          // Mesh dot pattern
          Positioned.fill(child: CustomPaint(painter: _MeshPainter())),
          // Soft blobs — mirrors web auth-blob with drift animation.
          // Uses radial gradient to create the soft blurred glow effect.
          Positioned(
            top: -80,
            left: -80,
            child: AnimatedBuilder(
              animation: _bubbleController,
              builder: (context, _) {
                final t = _bubbleController.value;
                // auth-blob-drift: 0%,100% -> (0,0) scale(1); 50% -> (20,-15) scale(1.08)
                final wave = math.sin(t * math.pi);
                return Transform.translate(
                  offset: Offset(wave * 20, -wave * 15),
                  child: Transform.scale(
                    scale: 1 + wave * 0.08,
                    child: Container(
                      width: 380,
                      height: 380,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            Color(0x73B4D2FF),
                            Color(0x00B4D2FF),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          Positioned(
            bottom: -60,
            right: -40,
            child: AnimatedBuilder(
              animation: _bubbleController,
              builder: (context, _) {
                final t = (_bubbleController.value + 0.167) % 1.0;
                final wave = math.sin(t * math.pi);
                return Transform.translate(
                  offset: Offset(wave * 20, -wave * 15),
                  child: Transform.scale(
                    scale: 1 + wave * 0.08,
                    child: Container(
                      width: 280,
                      height: 280,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            Color(0x59C8DCFF),
                            Color(0x00C8DCFF),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          // Login card
          Center(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
                  child: _buildLoginCard(),
                ),
              ),
            ),
          ),
        ],
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
        boxShadow: const [
          BoxShadow(
            color: Color(0x12002882),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
          BoxShadow(
            color: Color(0x1F002882),
            blurRadius: 48,
            offset: Offset(0, 16),
          ),
          BoxShadow(
            color: Color(0x12002882),
            blurRadius: 80,
            offset: Offset(0, 40),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Top accent strip
          ClipRRect(
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(24)),
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
                  // Header — PSA logo + title
                  Column(
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        padding: const EdgeInsets.all(8),
                        child: Image.asset(
                          'assets/images/logo.png',
                          fit: BoxFit.contain,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Philippine Statistics Authority',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0D3B8E),
                          letterSpacing: -0.02,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'REGION XII · INVENTORY SYSTEM',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF7A96B8),
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
                              colors: [
                                Colors.transparent,
                                Color(0xFFD0DFF5),
                                Colors.transparent
                              ],
                            ),
                          ),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          'SIGN IN TO CONTINUE',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF9AB0D0),
                            letterSpacing: 0.08,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Container(
                          height: 1,
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.transparent,
                                Color(0xFFD0DFF5),
                                Colors.transparent
                              ],
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
                    validator: (v) => v == null || v.trim().isEmpty
                        ? 'Please enter your username or email'
                        : null,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 14),

                  // Password
                  _buildInputField(
                    controller: _passwordController,
                    label: 'Password',
                    icon: Icons.lock_outline,
                    obscure: true,
                    validator: (v) =>
                        v == null || v.isEmpty ? 'Please enter your password' : null,
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
                          const SnackBar(
                              content:
                                  Text('Password reset feature coming soon')),
                        );
                      },
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 4, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Forgot Password?',
                        style: TextStyle(
                          fontSize: 12.5,
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
                            const BoxShadow(
                              color: Color(0x730D47A1),
                              blurRadius: 16,
                              offset: Offset(0, 4),
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
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                                Colors.white),
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
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.lock_outline,
                          size: 12, color: Color(0xFF9AB0D0)),
                      SizedBox(width: 5),
                      Text(
                        'Secure connection · PSA official portal',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFF9AB0D0),
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
        obscureText: obscure && _obscurePassword,
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
          prefixIcon:
              Icon(icon, size: 18, color: const Color(0xFF90AED0)),
          suffixIcon: obscure
              ? IconButton(
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                    size: 18,
                    color: const Color(0xFF90AED0),
                  ),
                  onPressed: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                )
              : null,
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          errorBorder: InputBorder.none,
          focusedErrorBorder: InputBorder.none,
          filled: false,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 46, vertical: 14),
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
//  PAINTERS
// ════════════════════════════════════════════════════════════════

/// Floating bubble particles — mirrors the web `auth-particle-drift` animation.
/// 10 white circles drift gently up/down/left/right with varying opacity.
class _BubblePainter extends CustomPainter {
  final double t; // 0 -> 1, loops

  _BubblePainter(this.t);

  // Particle definitions matching the web Particles() component
  static const _particles = [
    _Particle(x: 0.12, y: 0.18, r: 2.5, op: 0.35, delay: 0.00),
    _Particle(x: 0.28, y: 0.72, r: 1.8, op: 0.25, delay: 0.13),
    _Particle(x: 0.78, y: 0.14, r: 3.2, op: 0.20, delay: 0.23),
    _Particle(x: 0.68, y: 0.80, r: 2.0, op: 0.30, delay: 0.07),
    _Particle(x: 0.52, y: 0.50, r: 1.4, op: 0.18, delay: 0.33),
    _Particle(x: 0.88, y: 0.44, r: 2.8, op: 0.22, delay: 0.18),
    _Particle(x: 0.40, y: 0.28, r: 1.6, op: 0.28, delay: 0.28),
    _Particle(x: 0.18, y: 0.58, r: 2.2, op: 0.20, delay: 0.10),
    _Particle(x: 0.62, y: 0.36, r: 1.2, op: 0.15, delay: 0.38),
    _Particle(x: 0.84, y: 0.68, r: 2.4, op: 0.25, delay: 0.03),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.shortestSide / 100;

    for (final p in _particles) {
      // Phase 0->1 with delay offset
      final phase = (t + p.delay) % 1.0;

      // Drift animation matching auth-particle-drift keyframes:
      //   0%,100% -> (0, 0)
      //   33%     -> (4, -8)
      //   66%     -> (-3, 5)
      // Linear interpolation: a + (b - a) * f
      double dx, dy;
      if (phase < 0.33) {
        final f = phase / 0.33;
        dx = 4 * f;
        dy = -8 * f;
      } else if (phase < 0.66) {
        final f = (phase - 0.33) / 0.33;
        dx = 4 + (-3 - 4) * f;
        dy = -8 + (5 - (-8)) * f;
      } else {
        final f = (phase - 0.66) / 0.34;
        dx = -3 + (0 - (-3)) * f;
        dy = 5 + (0 - 5) * f;
      }

      final cx = p.x * size.width + dx * scale;
      final cy = p.y * size.height + dy * scale;
      final radius = p.r * scale;

      final paint = Paint()
        ..color = Colors.white.withValues(alpha: p.op)
        ..style = PaintingStyle.fill;

      canvas.drawCircle(Offset(cx, cy), radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _BubblePainter oldDelegate) => true;
}

class _Particle {
  final double x, y, r, op, delay;
  const _Particle({
    required this.x,
    required this.y,
    required this.r,
    required this.op,
    required this.delay,
  });
}

/// Bottom wave — mirrors the web `auth-wave` SVG.
class _WavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // First wave layer
    final path1 = Path();
    path1.moveTo(0, h * 0.5);
    path1.cubicTo(w * 0.25, h, w * 0.75, 0, w, h * 0.5);
    path1.lineTo(w, h);
    path1.lineTo(0, h);
    path1.close();
    canvas.drawPath(
      path1,
      Paint()..color = Colors.white.withValues(alpha: 0.04),
    );

    // Second wave layer
    final path2 = Path();
    path2.moveTo(0, h * 0.67);
    path2.cubicTo(w * 0.33, h * 0.17, w * 0.67, h * 0.83, w, h * 0.33);
    path2.lineTo(w, h);
    path2.lineTo(0, h);
    path2.close();
    canvas.drawPath(
      path2,
      Paint()..color = Colors.white.withValues(alpha: 0.03),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Mesh dot pattern — mirrors the web `auth-mesh` background.
class _MeshPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const spacing = 28.0;
    final paint = Paint()
      ..color = const Color(0xFF6496FF).withValues(alpha: 0.12);

    for (double x = spacing / 2; x < size.width; x += spacing) {
      for (double y = spacing / 2; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), 1, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Radial sheen overlay — mirrors the web `.auth-brand-panel::before`
/// pseudo-element with two radial gradients:
///   1. rgba(100,180,255,.28) at 15% 10% (top-left, blue glow)
///   2. rgba(0,20,120,.40) at 90% 90% (bottom-right, dark blue shadow)
class _SheenPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;

    // First gradient: top-left blue glow
    // rgba(100,180,255,.28) = Color(0x4764B4FF)
    final gradient1 = RadialGradient(
      center: const Alignment(0.15, 0.10),
      radius: 0.75,
      colors: [
        const Color(0x4764B4FF),
        Colors.transparent,
      ],
      stops: const [0.0, 0.55],
    );
    canvas.drawRect(
      rect,
      Paint()..shader = gradient1.createShader(rect),
    );

    // Second gradient: bottom-right dark blue shadow
    // rgba(0,20,120,.40) = Color(0x66001478)
    final gradient2 = RadialGradient(
      center: const Alignment(0.90, 0.90),
      radius: 0.60,
      colors: [
        const Color(0x66001478),
        Colors.transparent,
      ],
      stops: const [0.0, 0.55],
    );
    canvas.drawRect(
      rect,
      Paint()..shader = gradient2.createShader(rect),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}