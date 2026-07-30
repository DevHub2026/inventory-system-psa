import 'package:intl/intl.dart';

class DateFormatter {
  DateFormatter._();

  static String formatDate(String? iso) {
    if (iso == null || iso.isEmpty) return '—';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return DateFormat('MMM dd, yyyy').format(dt);
    } catch (_) {
      return iso;
    }
  }

  static String formatDateTime(String? iso) {
    if (iso == null || iso.isEmpty) return '—';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return DateFormat('MMM dd, yyyy  hh:mm a').format(dt);
    } catch (_) {
      return iso;
    }
  }

  static String formatTime(String? iso) {
    if (iso == null || iso.isEmpty) return '—';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return DateFormat('hh:mm a').format(dt);
    } catch (_) {
      return iso;
    }
  }

  static String timeAgo(String? iso) {
    if (iso == null || iso.isEmpty) return '—';
    try {
      final dt = DateTime.parse(iso).toLocal();
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return formatDate(iso);
    } catch (_) {
      return iso;
    }
  }
}
