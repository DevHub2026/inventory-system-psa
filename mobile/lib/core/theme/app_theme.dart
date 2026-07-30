import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  // ── PSA Brand colours (from web CSS) ───────────────────────────────────────
  static const Color primaryColor     = Color(0xFF0D47A1);
  static const Color primaryHover     = Color(0xFF1565C0);
  static const Color primaryPale      = Color(0xFFEEF4FF); // Added missing primaryPale
  static const Color psaBlue          = Color(0xFF003DA5);
  static const Color psaBlueDark      = Color(0xFF002A75);
  static const Color psaBlueLight     = Color(0xFF1A6FD4);
  static const Color psaBluePale      = Color(0xFFEEF4FF);
  static const Color psaYellow        = Color(0xFFFFD400);
  static const Color psaYellowLight   = Color(0xFFFFE566);
  static const Color psaRed           = Color(0xFFE31C23);
  static const Color psaRedLight      = Color(0xFFFF5A5F);

  // ── Semantic colours (from web CSS) ─────────────────────────────────────────
  static const Color successColor     = Color(0xFF2E7D32);
  static const Color warningColor     = Color(0xFFF9A825);
  static const Color dangerColor      = Color(0xFFD32F2F);
  static const Color infoColor        = Color(0xFF0288D1);
  static const Color errorColor       = Color(0xFFD32F2F);
  static const Color tealColor        = Color(0xFF0F766E); // Added missing tealColor

  // ── Neutral palette (from web CSS) ────────────────────────────────────────
  static const Color backgroundColor  = Color(0xFFF5F7FA);
  static const Color surfaceColor     = Color(0xFFF8FAFC);
  static const Color cardColor        = Color(0xFFFFFFFF);
  static const Color borderColor      = Color(0xFFE5E7EB);
  static const Color borderLightColor = Color(0xFFEEF2F8);
  static const Color shadowColor      = Color(0x1A000000); // Added missing shadowColor
  static const Color textPrimary      = Color(0xFF1F2937);
  static const Color textSecondary    = Color(0xFF6B7280);
  static const Color textMuted        = Color(0xFF9CA3AF);
  static const Color hoverBgColor     = Color(0xFFF3F4F6);

  // ── Stat card tone colors ──────────────────────────────────────────────────
  static const Map<String, Color> statToneAccent = {
    'blue': primaryColor,
    'green': successColor,
    'amber': warningColor,
    'red': errorColor,
    'violet': Color(0xFF7C3AED),
    'teal': tealColor,
  };

  static const Map<String, Color> statToneBg = {
    'blue': primaryPale,
    'green': Color(0xFFDCFCE7),
    'amber': Color(0xFFFEF3C7),
    'red': Color(0xFFFEE2E2),
    'violet': Color(0xFFEDE9FE),
    'teal': Color(0xFFCCFBF1),
  };

  // ── Border radii (from web CSS) ────────────────────────────────────────────
  static const double radiusXs  = 4.0;
  static const double radiusSm  = 6.0;
  static const double radiusMd  = 10.0;
  static const double radiusLg  = 12.0;
  static const double radiusXl  = 16.0;
  static const double radius2xl = 20.0;

  // ── Shadows (from web CSS) ────────────────────────────────────────────────
  static List<BoxShadow> shadowXs = [
    BoxShadow(
      color: Colors.black.withOpacity(0.05),
      offset: const Offset(0, 1),
      blurRadius: 2,
    ),
  ];
  static List<BoxShadow> shadowSm = [
    BoxShadow(
      color: Colors.black.withOpacity(0.06),
      offset: const Offset(0, 2),
      blurRadius: 6,
    ),
  ];
  static List<BoxShadow> shadowMd = [
    BoxShadow(
      color: Colors.black.withOpacity(0.08),
      offset: const Offset(0, 4),
      blurRadius: 12,
    ),
  ];
  static List<BoxShadow> shadowLg = [
    BoxShadow(
      color: Colors.black.withOpacity(0.10),
      offset: const Offset(0, 8),
      blurRadius: 24,
    ),
  ];
  static List<BoxShadow> shadowXl = [
    BoxShadow(
      color: Colors.black.withOpacity(0.12),
      offset: const Offset(0, 16),
      blurRadius: 40,
    ),
  ];

  // ── Spacing (from web CSS) ────────────────────────────────────────────────
  static const double space1  = 4.0;
  static const double space2  = 8.0;
  static const double space2_5 = 10.0;
  static const double space3  = 12.0;
  static const double space4  = 16.0;
  static const double space5  = 20.0;
  static const double space6  = 24.0;
  static const double space8  = 32.0;
  static const double space10 = 40.0;
  static const double space12 = 48.0;

  // ── Typography (from web CSS) ───────────────────────────────────────────────
  static const double textPageTitle    = 32.0;
  static const double textSectionTitle = 22.0;
  static const double textCardTitle    = 14.0;
  static const double textBody         = 14.0;
  static const double textSmall        = 13.0; // Renamed from textSecondary to avoid conflict

  // ── Component tokens (from web CSS) ────────────────────────────────────────
  static const double btnHeight      = 40.0;
  static const double btnPaddingX   = 20.0;
  static const double btnPaddingY   = 10.0;
  static const double inputHeight    = 44.0;
  static const double navItemHeight = 52.0;
  static const double topnavHeight  = 64.0;

  // ── Material ThemeData ────────────────────────────────────────────────────
  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryColor,
      primary: primaryColor,
      onPrimary: Colors.white,
      primaryContainer: psaBluePale,
      surface: surfaceColor,
      background: backgroundColor,
      error: dangerColor,
    ),
    scaffoldBackgroundColor: backgroundColor,
    fontFamily: 'Inter',
    textTheme: TextTheme(
      displayLarge: TextStyle(
        fontSize: textPageTitle,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.02,
        color: textPrimary,
      ),
      displayMedium: TextStyle(
        fontSize: textSectionTitle,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.015,
        color: textPrimary,
      ),
      displaySmall: TextStyle(
        fontSize: 18.0,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.015,
        color: textPrimary,
      ),
      headlineMedium: TextStyle(
        fontSize: 16.0,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.015,
        color: textPrimary,
      ),
      titleMedium: TextStyle(
        fontSize: textCardTitle,
        fontWeight: FontWeight.w500,
        color: textPrimary,
      ),
      bodyMedium: TextStyle(
        fontSize: textBody,
        fontWeight: FontWeight.w400,
        color: textPrimary,
        height: 1.6,
      ),
      bodySmall: TextStyle(
        fontSize: textSmall,
        fontWeight: FontWeight.w400,
        color: textSecondary,
      ),
      labelSmall: TextStyle(
        fontSize: textSmall,
        fontWeight: FontWeight.w500,
        color: textMuted,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: primaryColor,
      foregroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: const TextStyle(
        color: Colors.white,
        fontSize: 17,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
      ),
      iconTheme: const IconThemeData(color: Colors.white, size: 22),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radiusLg),
        side: const BorderSide(color: borderColor),
      ),
      color: cardColor,
      margin: EdgeInsets.zero,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surfaceColor,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: primaryColor, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: dangerColor),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: dangerColor, width: 1.5),
      ),
      labelStyle: const TextStyle(color: textMuted, fontSize: textBody),
      hintStyle: const TextStyle(color: textMuted, fontSize: textBody),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        minimumSize: const Size(btnHeight, btnHeight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
        padding: const EdgeInsets.symmetric(horizontal: btnPaddingX, vertical: btnPaddingY),
        textStyle: const TextStyle(fontSize: textBody, fontWeight: FontWeight.w500),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: const BorderSide(color: primaryColor),
        minimumSize: const Size(btnHeight, btnHeight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
        padding: const EdgeInsets.symmetric(horizontal: btnPaddingX, vertical: btnPaddingY),
        textStyle: const TextStyle(fontSize: textBody, fontWeight: FontWeight.w500),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
        textStyle: const TextStyle(fontSize: textBody, fontWeight: FontWeight.w500),
      ),
    ),
    dividerTheme: const DividerThemeData(
      space: 1,
      thickness: 1,
      color: borderColor,
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius2xl)),
      side: BorderSide.none,
      backgroundColor: surfaceColor,
      labelStyle: const TextStyle(fontSize: textSmall, fontWeight: FontWeight.w600),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: textPrimary,
      contentTextStyle: const TextStyle(color: Colors.white, fontSize: textBody),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
      behavior: SnackBarBehavior.floating,
    ),
    dialogTheme: DialogThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusXl)),
      backgroundColor: cardColor,
      elevation: 8,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.white,
      selectedItemColor: primaryColor,
      unselectedItemColor: textMuted,
      selectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
      unselectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
      elevation: 0,
      type: BottomNavigationBarType.fixed,
    ),
  );
}
