import 'package:flutter/material.dart';

class InfoRow extends StatelessWidget {
  final String label;
  final String? value;
  final Widget? valueWidget;
  final bool divider;

  const InfoRow({
    super.key,
    required this.label,
    this.value,
    this.valueWidget,
    this.divider = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 130,
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF94A3B8),
                    letterSpacing: 0.4,
                  ),
                ),
              ),
              Expanded(
                child: valueWidget ??
                    Text(
                      value?.isNotEmpty == true ? value! : '—',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF1E293B),
                      ),
                    ),
              ),
            ],
          ),
        ),
        if (divider)
          const Divider(height: 1, indent: 16, endIndent: 16),
      ],
    );
  }
}
