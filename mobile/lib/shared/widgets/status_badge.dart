import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;
  final EdgeInsetsGeometry padding;

  const StatusBadge({
    super.key,
    required this.status,
    this.fontSize = 12.0,
    this.padding = const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
  });

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'BORROWED':
      case 'IN_USE':
      case 'ISSUED':
        return AppTheme.primaryColor;
      case 'RETURNED':
      case 'AVAILABLE':
      case 'APPROVED':
      case 'COMPLETED':
        return AppTheme.successColor;
      case 'OVERDUE':
      case 'REJECTED':
      case 'DAMAGED':
      case 'LOST':
        return AppTheme.errorColor;
      case 'PENDING':
      case 'UNDER_REPAIR':
      case 'MAINTENANCE':
        return AppTheme.warningColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _getStatusColor(status);
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 1),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: fontSize,
        ),
      ),
    );
  }
}
