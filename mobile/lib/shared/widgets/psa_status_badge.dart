import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class PsaStatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;
  final EdgeInsetsGeometry padding;

  const PsaStatusBadge({
    super.key,
    required this.status,
    this.fontSize = 12,
    this.padding = const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
  });

  Color get _bgColor {
    switch (status.toUpperCase()) {
      case 'BORROWED':
      case 'IN_USE':
      case 'ISSUED':
        return const Color(0xFFFFFBEB);
      case 'RETURNED':
      case 'AVAILABLE':
      case 'APPROVED':
      case 'COMPLETED':
        return const Color(0xFFF0FDF4);
      case 'OVERDUE':
      case 'REJECTED':
      case 'DAMAGED':
      case 'LOST':
        return const Color(0xFFFEF2F2);
      case 'PENDING':
      case 'UNDER_REPAIR':
      case 'MAINTENANCE':
        return const Color(0xFFFFFBEB);
      default:
        return const Color(0xFFF8FAFC);
    }
  }

  Color get _textColor {
    switch (status.toUpperCase()) {
      case 'BORROWED':
      case 'IN_USE':
      case 'ISSUED':
        return AppTheme.warningColor;
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
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: _bgColor,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: _textColor.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: _textColor,
          fontWeight: FontWeight.w700,
          fontSize: fontSize,
          letterSpacing: 0.02,
        ),
      ),
    );
  }
}