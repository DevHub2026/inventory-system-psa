import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/models/maintenance_model.dart';
import '../../data/services/maintenance_service.dart';
import '../../shared/widgets/app_empty.dart';
import '../../shared/widgets/app_error.dart';
import '../../shared/widgets/psa_badge.dart';

class MaintenancePage extends StatefulWidget {
  const MaintenancePage({super.key});

  @override
  State<MaintenancePage> createState() => _MaintenancePageState();
}

class _MaintenancePageState extends State<MaintenancePage> {
  final MaintenanceService _service = MaintenanceService();
  List<MaintenanceModel> _items = [];
  bool _loading = true;
  String? _error;
  String? _statusFilter;

  static const _filters = ['', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];
  static const _filterLabels = ['All', 'Pending', 'In Progress', 'Completed'];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final result = await _service.getMaintenances(status: _statusFilter);
      setState(() { _items = result; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  Color _statusColor(String? s) => switch (s?.toUpperCase()) {
    'PENDING'     => AppTheme.warningColor,
    'IN_PROGRESS' => AppTheme.primaryColor,
    'COMPLETED'   => AppTheme.successColor,
    'CANCELLED'   => AppTheme.textMuted,
    _ => AppTheme.textMuted,
  };

  String _statusLabel(String? s) => switch (s?.toUpperCase()) {
    'PENDING'     => 'Pending',
    'IN_PROGRESS' => 'In Progress',
    'COMPLETED'   => 'Completed',
    'CANCELLED'   => 'Cancelled',
    _ => s ?? '—',
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Maintenance'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (v) { setState(() => _statusFilter = v.isEmpty ? null : v); _load(); },
            itemBuilder: (_) => [
              for (int i = 0; i < _filters.length; i++)
                PopupMenuItem(value: _filters[i], child: Text(_filterLabels[i])),
            ],
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? AppError(message: _error!, onRetry: _load)
              : _items.isEmpty
                  ? const AppEmpty(
                      title: 'No maintenance records',
                      icon: Icons.build_outlined,
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _items.length,
                        itemBuilder: (_, i) => _card(_items[i]),
                      ),
                    ),
    );
  }

  Widget _card(MaintenanceModel m) {
    final sc = _statusColor(m.status);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                  color: sc.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.build_outlined, size: 22, color: sc),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(m.asset?.name ?? 'Asset #${m.assetId}',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                      PsaBadge(label: _statusLabel(m.status), color: sc, fontSize: 10),
                    ],
                  ),
                  if (m.type != null)
                    Text(m.type!, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                  if (m.description != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(m.description!,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                          maxLines: 2, overflow: TextOverflow.ellipsis),
                    ),
                  const SizedBox(height: 6),
                  if (m.scheduledDate != null)
                    Text('Scheduled: ${DateFormatter.formatDate(m.scheduledDate)}',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                  if (m.completedAt != null)
                    Text('Completed: ${DateFormatter.formatDate(m.completedAt)}',
                        style: const TextStyle(fontSize: 11, color: AppTheme.successColor)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
