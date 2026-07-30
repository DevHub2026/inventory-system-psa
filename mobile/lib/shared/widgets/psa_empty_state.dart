import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'psa_button.dart';

class PsaEmptyState extends StatelessWidget {
  final String title;
  final String? description;
  final IconData icon;
  final VoidCallback? onAction;
  final String actionLabel;

  const PsaEmptyState({
    super.key,
    required this.title,
    this.description,
    this.icon = Icons.inventory_2_outlined,
    this.onAction,
    this.actionLabel = 'Refresh',
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppTheme.surfaceColor,
                borderRadius: BorderRadius.circular(AppTheme.radiusLg),
              ),
              child: Icon(
                icon,
                size: 32,
                color: AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            if (description != null) ...[
              const SizedBox(height: 8),
              Text(
                description!,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (onAction != null) ...[
              const SizedBox(height: 24),
              PsaButton(
                label: actionLabel,
                icon: Icons.refresh,
                variant: PsaButtonVariant.secondary,
                size: PsaButtonSize.sm,
                onPressed: onAction,
              ),
            ],
          ],
        ),
      ),
    );
  }
}