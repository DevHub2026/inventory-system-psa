import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class PsaPanel extends StatelessWidget {
  final String title;
  final String subtitle;
  final int? count;
  final String? countTone;
  final VoidCallback? onViewAll;
  final bool loading;
  final Widget child;

  const PsaPanel({
    super.key,
    required this.title,
    required this.subtitle,
    this.count,
    this.countTone,
    this.onViewAll,
    this.loading = false,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        border: Border.all(color: AppTheme.borderColor),
        boxShadow: const [
          BoxShadow(
            color: AppTheme.shadowColor,
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            title,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          if (count != null && count! > 0) ...[
                            const SizedBox(width: 8),
                            _CountBadge(count: count!, tone: countTone ?? 'amber'),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                if (onViewAll != null)
                  GestureDetector(
                    onTap: onViewAll,
                    child: const Text(
                      'View all',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.primaryHover,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Content
          if (loading)
            const Padding(
              padding: EdgeInsets.all(48),
              child: Center(child: CircularProgressIndicator()),
            )
          else
            child,
        ],
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  final int count;
  final String tone;

  const _CountBadge({required this.count, required this.tone});

  @override
  Widget build(BuildContext context) {
    final bg = tone == 'red'
        ? const Color(0xFFFEE2E2)
        : tone == 'teal'
            ? const Color(0xFFCCFBF1)
            : const Color(0xFFFEF3C7);
    final color = tone == 'red'
        ? AppTheme.errorColor
        : tone == 'teal'
            ? AppTheme.tealColor
            : AppTheme.warningColor;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        '$count',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}