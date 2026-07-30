import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class PsaStatCard extends StatelessWidget {
  final String label;
  final String value;
  final String description;
  final IconData icon;
  final String tone;
  final VoidCallback? onTap;

  const PsaStatCard({
    super.key,
    required this.label,
    required this.value,
    required this.description,
    required this.icon,
    this.tone = 'blue',
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final accent = AppTheme.statToneAccent[tone] ?? AppTheme.primaryHover;
    final iconBg = AppTheme.statToneBg[tone] ?? AppTheme.primaryPale;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 148),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(AppTheme.radiusXl),
          border: Border(
            left: BorderSide(color: accent, width: 4),
            top: const BorderSide(color: AppTheme.borderColor),
            right: const BorderSide(color: AppTheme.borderColor),
            bottom: const BorderSide(color: AppTheme.borderColor),
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.shadowColor,
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Row 1: label + icon
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.07,
                      color: AppTheme.textSecondary,
                      height: 1.35,
                    ),
                  ),
                ),
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, size: 20, color: accent),
                ),
              ],
            ),
            const SizedBox(height: 14),
            // Row 2: large number
            Text(
              value,
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.w700,
                height: 1,
                letterSpacing: -0.02,
                color: accent,
              ),
            ),
            const Spacer(),
            // Row 3: description
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text(
                description,
                style: const TextStyle(
                  fontSize: 12,
                  height: 1.4,
                  color: AppTheme.textMuted,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}