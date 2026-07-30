import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/models/maintenance_model.dart';
import '../../data/services/maintenance_service.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/psa_status_badge.dart';

class MaintenancePage extends StatefulWidget {
  const MaintenancePage({super.key});

  @override
  State<MaintenancePage> createState() => _MaintenancePageState();
}

class _MaintenancePageState extends State<MaintenancePage> {
  final MaintenanceService _service = MaintenanceService();
  final _searchController = TextEditingController();
  List<MaintenanceModel> _items = [];
  bool _loading = true;
  bool _loadingStats = true;
  String? _error;
  String _statusFilter = '';
  int _currentPage = 1;
  bool _hasMore = true;

  // Summary stats
  int _scheduledCount = 0;
  int _inProgressCount = 0;
  int _completedCount = 0;
  int _overdueCount = 0;

  static const _statusFilters = ['', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  static const _statusLabels = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];

  @override
  void initState() {
    super.initState();
    _load(refresh: true);
    _loadStats();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadStats() async {
    setState(() => _loadingStats = true);
    try {
      final stats = await _service.getMaintenanceStats();
      setState(() {
        _scheduledCount = (stats['scheduled'] as num?)?.toInt() ?? 0;
        _inProgressCount = (stats['in_progress'] as num?)?.toInt() ?? 0;
        _completedCount = (stats['completed'] as num?)?.toInt() ?? 0;
        _overdueCount = (stats['overdue'] as num?)?.toInt() ?? 0;
        _loadingStats = false;
      });
    } catch (e) {
      setState(() => _loadingStats = false);
    }
  }

  Future<void> _load({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
    }
    if (!_hasMore && !refresh) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await _service.getMaintenances(
        status: _statusFilter.isEmpty ? null : _statusFilter,
        page: refresh ? 1 : _currentPage,
        perPage: 20,
      );
      setState(() {
        if (refresh) {
          _items = result;
        } else {
          _items.addAll(result);
        }
        _loading = false;
        _hasMore = result.length >= 20;
        _currentPage++;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _handleComplete(MaintenanceModel maintenance) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Complete Maintenance'),
        content: Text('Mark "${maintenance.asset?.name ?? 'Asset'}" maintenance as completed?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.successColor,
            ),
            child: const Text('Complete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _service.completeMaintenance(maintenance.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Maintenance completed.')),
        );
        _load(refresh: true);
        _loadStats();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  String _statusLabel(String? s) => switch (s?.toUpperCase()) {
    'PENDING' => 'Pending',
    'IN_PROGRESS' => 'In Progress',
    'COMPLETED' => 'Completed',
    'CANCELLED' => 'Cancelled',
    _ => s ?? '—',
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Maintenance'),
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: Column(
        children: [
          // Summary cards
          if (!_loadingStats)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.all(AppTheme.space4),
              child: Row(
                children: [
                  _buildSummaryCard(
                    'Scheduled',
                    _scheduledCount.toString(),
                    Icons.calendar_today_outlined,
                    AppTheme.warningColor,
                    const Color(0xFFFEF3C7),
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'In Progress',
                    _inProgressCount.toString(),
                    Icons.build_outlined,
                    AppTheme.primaryColor,
                    AppTheme.primaryPale,
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'Completed',
                    _completedCount.toString(),
                    Icons.check_circle_outline,
                    AppTheme.successColor,
                    const Color(0xFFDCFCE7),
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'Overdue',
                    _overdueCount.toString(),
                    Icons.warning_amber_outlined,
                    AppTheme.dangerColor,
                    const Color(0xFFFEE2E2),
                  ),
                ],
              ),
            ),
          // Search box
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppTheme.space4,
              AppTheme.space2,
              AppTheme.space4,
              0,
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => setState(() {}),
              onSubmitted: (_) => _load(refresh: true),
              decoration: InputDecoration(
                hintText: 'Search by asset name…',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _load(refresh: true);
                        })
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.space3,
                  vertical: AppTheme.space2_5,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
              ),
            ),
          ),
          // Status filter chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(
                horizontal: AppTheme.space4,
                vertical: AppTheme.space2,
              ),
              separatorBuilder: (_, __) => const SizedBox(width: AppTheme.space2),
              itemCount: _statusFilters.length,
              itemBuilder: (_, i) {
                final isSelected = _statusFilter == _statusFilters[i];
                return FilterChip(
                  label: Text(_statusLabels[i]),
                  selected: isSelected,
                  onSelected: (_) {
                    setState(() => _statusFilter = _statusFilters[i]);
                    _load(refresh: true);
                  },
                  selectedColor: AppTheme.primaryColor.withValues(alpha: 0.12),
                  checkmarkColor: AppTheme.primaryColor,
                  labelStyle: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isSelected
                        ? AppTheme.primaryColor
                        : AppTheme.textSecondary,
                  ),
                );
              },
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(
    String label,
    String value,
    IconData icon,
    Color color,
    Color bgColor,
  ) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.space3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: AppTheme.space1),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: color.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading && _items.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null && _items.isEmpty) {
      return EmptyStateWidget(
        title: 'Error loading maintenance',
        message: _error!,
        icon: Icons.error_outline,
        actionLabel: 'Retry',
        onRetry: () => _load(refresh: true),
      );
    }

    if (_items.isEmpty) {
      return EmptyStateWidget(
        title: 'No maintenance records',
        message: _statusFilter.isEmpty
            ? 'Maintenance requests will appear here.'
            : 'No ${_statusLabels[_statusFilters.indexOf(_statusFilter)].toLowerCase()} maintenance records.',
        icon: Icons.build_outlined,
        actionLabel: 'Refresh',
        onRetry: () => _load(refresh: true),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _load(refresh: true),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.space4,
          vertical: AppTheme.space3,
        ),
        itemCount: _items.length + (_hasMore ? 1 : 0),
        itemBuilder: (_, i) {
          if (i == _items.length) {
            if (!_loading) _load();
            return const Padding(
              padding: EdgeInsets.all(AppTheme.space4),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          return _buildMaintenanceCard(_items[i]);
        },
      ),
    );
  }

  Widget _buildMaintenanceCard(MaintenanceModel maintenance) {
    final isOverdue = maintenance.scheduledDate != null &&
        DateTime.parse(maintenance.scheduledDate!).isBefore(DateTime.now()) &&
        maintenance.status?.toUpperCase() != 'COMPLETED';

    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.space3),
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.space3),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryPale,
                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                  ),
                  child: const Icon(
                    Icons.build_outlined,
                    size: 22,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(width: AppTheme.space3),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        maintenance.asset?.name ?? 'Asset #${maintenance.assetId}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (maintenance.type != null)
                        Text(
                          maintenance.type!,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                    ],
                  ),
                ),
                PsaStatusBadge(
                  status: maintenance.status,
                  fontSize: 10,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.space2,
                    vertical: 3,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.space2),
            if (maintenance.description != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppTheme.space2),
                child: Text(
                  maintenance.description!,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Scheduled',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    Text(
                      maintenance.scheduledDate != null
                          ? DateFormatter.formatDate(maintenance.scheduledDate)
                          : 'Not scheduled',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isOverdue
                            ? AppTheme.dangerColor
                            : AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                if (maintenance.status?.toUpperCase() == 'PENDING' ||
                    maintenance.status?.toUpperCase() == 'IN_PROGRESS')
                  ElevatedButton.icon(
                    onPressed: () => _handleComplete(maintenance),
                    icon: const Icon(Icons.check, size: 16),
                    label: const Text('Complete'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.successColor,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppTheme.space3,
                        vertical: AppTheme.space2,
                      ),
                    ),
                  ),
              ],
            ),
            if (maintenance.completedAt != null)
              Padding(
                padding: const EdgeInsets.only(top: AppTheme.space2),
                child: Text(
                  'Completed: ${DateFormatter.formatDateTime(maintenance.completedAt)}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.successColor,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
