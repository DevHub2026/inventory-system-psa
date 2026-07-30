import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  // ── Brand colours ─────────────────────────────────────────────────────────
  static const Color primaryColor  = Color(0xFF0D47A1);
  static const Color primaryHover  = Color(0xFF0B3D91);
  static const Color primaryPale   = Color(0xFFEFF6FF);
  static const Color psaYellow     = Color(0xFFFFD400);

  // ── Semantic colours ──────────────────────────────────────────────────────
  static const Color successColor  = Color(0xFF16A34A);
  static const Color warningColor  = Color(0xFFD97706);
  static const Color errorColor    = Color(0xFFDC2626);
  static const Color infoColor     = Color(0xFF0891B2);

  // ── Surface / text ────────────────────────────────────────────────────────
  static const Color cardColor     = Color(0xFFFFFFFF);
  static const Color surfaceColor  = Color(0xFFF8FAFC);
  static const Color borderColor   = Color(0xFFE5E7EB);
  static const Color shadowColor   = Color(0x0D000000);
  static const Color textPrimary   = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted     = Color(0xFF94A3B8);
  static const Color tealColor     = Color(0xFF0F766E);

  // ── Border radii ──────────────────────────────────────────────────────────
  static const double radiusSm  = 6.0;
  static const double radiusMd  = 8.0;
  static const double radiusLg  = 12.0;
  static const double radiusXl  = 16.0;
  static const double radius2xl = 20.0;

  // ── Stat tone maps (used by PsaStatCard) ─────────────────────────────────
  static const Map<String, Color> statToneAccent = {
    'blue'   : Color(0xFF1D4ED8),
    'green'  : Color(0xFF16A34A),
    'amber'  : Color(0xFFD97706),
    'red'    : Color(0xFFDC2626),
    'purple' : Color(0xFF7C3AED),
    'teal'   : Color(0xFF0F766E),
  };

  static const Map<String, Color> statToneBg = {
    'blue'   : Color(0xFFEFF6FF),
    'green'  : Color(0xFFF0FDF4),
    'amber'  : Color(0xFFFFFBEB),
    'red'    : Color(0xFFFEF2F2),
    'purple' : Color(0xFFF5F3FF),
    'teal'   : Color(0xFFF0FDFA),
  };

  // ── Material ThemeData ────────────────────────────────────────────────────
  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryColor,
      primary: primaryColor,
      onPrimary: Colors.white,
      primaryContainer: const Color(0xFFBFDBFE),
      surface: surfaceColor,
    ),
    scaffoldBackgroundColor: const Color(0xFFF1F5F9),
    fontFamily: 'Roboto',
    appBarTheme: const AppBarTheme(
      backgroundColor: primaryHover,
      foregroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: Colors.white,
        fontSize: 17,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
      ),
      iconTheme: IconThemeData(color: Colors.white, size: 22),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radiusXl),
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
        borderSide: const BorderSide(color: errorColor),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: errorColor, width: 1.5),
      ),
      labelStyle: const TextStyle(color: textMuted, fontSize: 14),
      hintStyle: const TextStyle(color: textMuted, fontSize: 14),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: const BorderSide(color: primaryColor),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: primaryColor),
    ),
    dividerTheme: const DividerThemeData(
      space: 1,
      thickness: 1,
      color: borderColor,
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      side: BorderSide.none,
      backgroundColor: const Color(0xFFF1F5F9),
      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: const Color(0xFF1E293B),
      contentTextStyle: const TextStyle(color: Colors.white, fontSize: 13),
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
