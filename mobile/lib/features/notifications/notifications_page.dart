import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/models/notification_model.dart';
import '../../data/services/notification_service.dart';
import '../../shared/widgets/app_empty.dart';
import '../../shared/widgets/app_error.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final NotificationService _service = NotificationService();
  List<NotificationModel> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final result = await _service.getNotifications(perPage: 50);
      if (mounted) setState(() { _items = result; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  Future<void> _markAllRead() async {
    try {
      await _service.markAllAsRead();
      setState(() {
        _items = _items.map((n) => NotificationModel(
          id: n.id, userId: n.userId, title: n.title, message: n.message,
          type: n.type, isRead: true, readAt: n.readAt,
          relatedId: n.relatedId, relatedType: n.relatedType,
          data: n.data, link: n.link, createdAt: n.createdAt,
        )).toList();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('All notifications marked as read.')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.errorColor,
        ));
      }
    }
  }

  Future<void> _markRead(NotificationModel n) async {
    if (n.isRead) return;
    try {
      await _service.markAsRead(n.id);
      setState(() {
        _items = _items.map((item) => item.id == n.id
            ? NotificationModel(
                id: item.id, userId: item.userId, title: item.title,
                message: item.message, type: item.type, isRead: true,
                readAt: item.readAt, relatedId: item.relatedId,
                relatedType: item.relatedType, data: item.data,
                link: item.link, createdAt: item.createdAt)
            : item).toList();
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final unread = _items.where((n) => !n.isRead).length;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unread > 0)
            TextButton.icon(
              onPressed: _markAllRead,
              icon: const Icon(Icons.done_all, size: 18, color: Colors.white),
              label: const Text('Mark all read',
                  style: TextStyle(color: Colors.white, fontSize: 12)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? AppError(message: _error!, onRetry: _load)
              : _items.isEmpty
                  ? const AppEmpty(
                      title: 'No notifications',
                      subtitle: 'You have no notifications at this time.',
                      icon: Icons.notifications_none_outlined,
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        itemCount: _items.length,
                        separatorBuilder: (_, __) =>
                            const Divider(height: 1, indent: 72),
                        itemBuilder: (_, i) => _tile(_items[i]),
                      ),
                    ),
    );
  }

  Widget _tile(NotificationModel n) {
    return InkWell(
      onTap: () => _markRead(n),
      child: Container(
        color: n.isRead ? null : AppTheme.primaryColor.withValues(alpha: 0.04),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: n.isRead
                    ? const Color(0xFFF1F5F9)
                    : AppTheme.primaryColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                _iconForType(n.type),
                size: 20,
                color: n.isRead ? AppTheme.textMuted : AppTheme.primaryColor,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(n.title,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: n.isRead ? FontWeight.w500 : FontWeight.w700,
                              color: n.isRead ? AppTheme.textSecondary : AppTheme.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                      ),
                      if (!n.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(left: 8),
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(n.message,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(DateFormatter.timeAgo(n.createdAt),
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _iconForType(String type) => switch (type.toLowerCase()) {
    'borrow_request' || 'borrowing_confirmed' => Icons.archive_outlined,
    'asset_returned' => Icons.unarchive_outlined,
    'request_approved' => Icons.check_circle_outline,
    'request_rejected' => Icons.cancel_outlined,
    'maintenance_update' => Icons.build_outlined,
    'inventory_low_stock' || 'inventory_out_of_stock' => Icons.inventory_2_outlined,
    'insurance_expiration' => Icons.shield_outlined,
    _ => Icons.notifications_outlined,
  };
}
