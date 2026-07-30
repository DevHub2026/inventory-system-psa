import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

enum PsaButtonVariant { primary, secondary, outline, danger, success, ghost }
enum PsaButtonSize { sm, md, lg }

class PsaButton extends StatefulWidget {
  final String label;
  final IconData? icon;
  final PsaButtonVariant variant;
  final PsaButtonSize size;
  final VoidCallback? onPressed;
  final bool loading;
  final bool expanded;

  const PsaButton({
    super.key,
    required this.label,
    this.icon,
    this.variant = PsaButtonVariant.primary,
    this.size = PsaButtonSize.md,
    this.onPressed,
    this.loading = false,
    this.expanded = false,
  });

  @override
  State<PsaButton> createState() => _PsaButtonState();
}

class _PsaButtonState extends State<PsaButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final v = _getVariantStyle();
    final s = _getSizeStyle();
    final disabled = widget.onPressed == null || widget.loading;

    return GestureDetector(
      onTapDown: disabled ? null : (_) => setState(() => _hovered = true),
      onTapUp: disabled ? null : (_) {
        setState(() => _hovered = false);
        widget.onPressed?.call();
      },
      onTapCancel: () => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: widget.expanded ? double.infinity : null,
        height: s.height,
        padding: EdgeInsets.symmetric(horizontal: s.paddingInline),
        decoration: BoxDecoration(
          color: _hovered && !disabled ? v.hoverBackground : v.background,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(
            color: _hovered && !disabled ? v.hoverBorder : v.border,
          ),
          boxShadow: v.hasShadow && !disabled
              ? [BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  blurRadius: 3,
                  offset: const Offset(0, 1),
                )]
              : null,
        ),
        child: widget.loading
            ? SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: v.color,
                ),
              )
            : Row(
                mainAxisSize: widget.expanded ? MainAxisSize.max : MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (widget.icon != null) ...[
                    Icon(widget.icon, size: s.iconSize, color: v.color),
                    SizedBox(width: s.gap),
                  ],
                  Text(
                    widget.label,
                    style: TextStyle(
                      fontSize: s.fontSize,
                      fontWeight: FontWeight.w600,
                      color: disabled ? v.color.withValues(alpha: 0.7) : v.color,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  _VariantStyle _getVariantStyle() {
    switch (widget.variant) {
      case PsaButtonVariant.primary:
        return _VariantStyle(
          background: AppTheme.primaryColor,
          hoverBackground: AppTheme.primaryHover,
          border: AppTheme.primaryColor,
          hoverBorder: AppTheme.primaryHover,
          color: Colors.white,
          hasShadow: true,
        );
      case PsaButtonVariant.secondary:
        return _VariantStyle(
          background: Colors.white,
          hoverBackground: const Color(0xFFF1F5F9),
          border: AppTheme.borderColor,
          hoverBorder: const Color(0xFFCBD5E1),
          color: AppTheme.textPrimary,
          hasShadow: false,
        );
      case PsaButtonVariant.outline:
        return _VariantStyle(
          background: Colors.transparent,
          hoverBackground: AppTheme.primaryPale,
          border: AppTheme.primaryColor.withValues(alpha: 0.35),
          hoverBorder: AppTheme.primaryColor.withValues(alpha: 0.65),
          color: AppTheme.primaryColor,
          hasShadow: false,
        );
      case PsaButtonVariant.danger:
        return _VariantStyle(
          background: AppTheme.errorColor,
          hoverBackground: const Color(0xFFB71C1C),
          border: AppTheme.errorColor,
          hoverBorder: const Color(0xFFB71C1C),
          color: Colors.white,
          hasShadow: true,
        );
      case PsaButtonVariant.success:
        return _VariantStyle(
          background: AppTheme.successColor,
          hoverBackground: const Color(0xFF1B5E20),
          border: AppTheme.successColor,
          hoverBorder: const Color(0xFF1B5E20),
          color: Colors.white,
          hasShadow: true,
        );
      case PsaButtonVariant.ghost:
        return _VariantStyle(
          background: Colors.transparent,
          hoverBackground: const Color(0xFFF1F5F9),
          border: Colors.transparent,
          hoverBorder: Colors.transparent,
          color: AppTheme.textSecondary,
          hasShadow: false,
        );
    }
  }

  _SizeStyle _getSizeStyle() {
    switch (widget.size) {
      case PsaButtonSize.sm:
        return _SizeStyle(height: 32, paddingInline: 12, fontSize: 12, gap: 6, iconSize: 14);
      case PsaButtonSize.md:
        return _SizeStyle(height: 38, paddingInline: 16, fontSize: 14, gap: 8, iconSize: 16);
      case PsaButtonSize.lg:
        return _SizeStyle(height: 42, paddingInline: 20, fontSize: 14, gap: 8, iconSize: 18);
    }
  }
}

class _VariantStyle {
  final Color background;
  final Color hoverBackground;
  final Color border;
  final Color hoverBorder;
  final Color color;
  final bool hasShadow;

  const _VariantStyle({
    required this.background,
    required this.hoverBackground,
    required this.border,
    required this.hoverBorder,
    required this.color,
    required this.hasShadow,
  });
}

class _SizeStyle {
  final double height;
  final double paddingInline;
  final double fontSize;
  final double gap;
  final double iconSize;

  const _SizeStyle({
    required this.height,
    required this.paddingInline,
    required this.fontSize,
    required this.gap,
    required this.iconSize,
  });
}