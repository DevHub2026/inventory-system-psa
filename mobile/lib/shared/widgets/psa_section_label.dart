import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class PsaSectionLabel extends StatelessWidget {
  final String label;

  const PsaSectionLabel({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.10,
          color: AppTheme.textMuted,
        ),
      ),
    );
  }
}