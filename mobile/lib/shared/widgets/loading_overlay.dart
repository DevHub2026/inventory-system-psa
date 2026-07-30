import 'package:flutter/material.dart';

class LoadingOverlay extends StatelessWidget {
  final bool loading;
  final Widget child;

  const LoadingOverlay({super.key, required this.loading, required this.child});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (loading)
          const ColoredBox(
            color: Color(0x66FFFFFF),
            child: Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }
}
