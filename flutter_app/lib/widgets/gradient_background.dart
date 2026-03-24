import 'package:flutter/material.dart';

class GradientBackground extends StatelessWidget {
  final Widget child;

  const GradientBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  const Color(0xFF0a0e21),
                  const Color(0xFF1a1a2e),
                  const Color(0xFF16213e),
                ]
              : [
                  const Color(0xFFe8eaf6),
                  const Color(0xFFc5cae9),
                  const Color(0xFF9fa8da),
                ],
        ),
      ),
      child: child,
    );
  }
}
