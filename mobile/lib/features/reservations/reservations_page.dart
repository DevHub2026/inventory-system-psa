import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_formatter.dart';
import '../../core/utils/status_helpers.dart';
import '../../data/models/reservation_model.dart';
import '../../data/services/reservation_service.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/psa_status_badge.dart';
import '../../utils/roleHelpers.dart';
import '../../data/models/user.dart';

class ReservationsPage extends StatefulWidget {
  final User? user;

  const ReservationsPage({super.key, this.user});

  @override
  State<ReservationsPage> createState() => _ReservationsPageState();
}

class _ReservationsPageState extends State<ReservationsPage> {
  final ReservationService _service = ReservationService();
  List<ReservationModel> _items = [];
  bool _loading = true;
  bool _loadingStats = true;
  String? _error;
  String _statusFilter = '';
  int _currentPage = 1;
  bool _hasMore = true;

  // Summary stats
  int _pendingRequests = 0;
  int _approvedRequests = 0;
  int _completedRequests = 0;

  static const _statusFilters = ['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
  static const _statusLabels = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'];

  @override
  void initState() {
    super.initState();
    _load();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _loadingStats = true);
    try {
      final stats = await _service.getReservationStats();
      setState(() {
        _pendingRequests = (stats['pending'] as num?)?.toInt() ?? 0;
        _approvedRequests = (stats['approved'] as num?)?.toInt() ?? 0;
        _completedRequests = (stats['completed'] as num?)?.toInt() ?? 0;
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
      final r = await _service.getReservations(
        status: _statusFilter.isEmpty ? null : _statusFilter,
        page: refresh ? 1 : _currentPage,
        perPage: 20,
      );
      setState(() {
        if (refresh) {
          _items = r;
        } else {
          _items.addAll(r);
        }
        _loading = false;
        _hasMore = r.length >= 20;
        _currentPage++;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  bool get _canApprove {
    final user = _user;
    if (user == null) return false;
    return isAdmin(user) || isStaff(user);
  }

  User? get _user => widget.user;

  Future<void> _handleApprove(ReservationModel reservation) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Approve Request'),
        content: Text(
          'Approve borrow request from ${reservation.user?.fullName ?? 'user'}?\n\nAssets will be released when approved.',
        ),
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
            child: const Text('Approve'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _service.approveReservation(reservation.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Request approved successfully.')),
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

  Future<void> _handleReject(ReservationModel reservation) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Reject Request'),
        content: Text('Reject borrow request from ${reservation.user?.fullName ?? 'user'}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.dangerColor,
            ),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _service.rejectReservation(reservation.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Request rejected.')),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reservations'),
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: Column(
        children: [
          // Summary cards
          if (!_loadingStats && _canApprove)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.all(AppTheme.space4),
              child: Row(
                children: [
                  _buildSummaryCard(
                    'Pending',
                    _pendingRequests.toString(),
                    Icons.access_time_outlined,
                    AppTheme.warningColor,
                    const Color(0xFFFEF3C7),
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'Approved',
                    _approvedRequests.toString(),
                    Icons.check_circle_outline,
                    AppTheme.successColor,
                    const Color(0xFFDCFCE7),
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'Completed',
                    _completedRequests.toString(),
                    Icons.task_alt_outlined,
                    AppTheme.primaryColor,
                    AppTheme.primaryPale,
                  ),
                ],
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
        title: 'Error loading reservations',
        message: _error!,
        icon: Icons.error_outline,
        actionLabel: 'Retry',
        onRetry: () => _load(refresh: true),
      );
    }

    if (_items.isEmpty) {
      return EmptyStateWidget(
        title: 'No reservations found',
        message: _statusFilter.isEmpty
            ? 'Borrow requests will appear here.'
            : 'No ${_statusLabels[_statusFilters.indexOf(_statusFilter)].toLowerCase()} reservations.',
        icon: Icons.event_available_outlined,
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
        itemBuilder: (context, index) {
          if (index == _items.length) {
            if (!_loading) _load();
            return const Padding(
              padding: EdgeInsets.all(AppTheme.space4),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          return _buildReservationCard(_items[index]);
        },
      ),
    );
  }

  Widget _buildReservationCard(ReservationModel reservation) {
    final color = StatusHelpers.reservationColor(reservation.status);
    final label = StatusHelpers.reservationLabel(reservation.status);

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
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                  ),
                  child: Icon(
                    Icons.event_available_outlined,
                    size: 22,
                    color: color,
                  ),
                ),
                const SizedBox(width: AppTheme.space3),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        reservation.assetName ?? 'Asset Reservation',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (reservation.user?.fullName != null)
                        Text(
                          'By ${reservation.user!.fullName}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                    ],
                  ),
                ),
                PsaStatusBadge(
                  status: reservation.status,
                  fontSize: 10,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.space2,
                    vertical: 3,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.space2),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Date Range',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    Text(
                      reservation.startDate != null
                          ? '${DateFormatter.formatDate(reservation.startDate)}'
                          : 'N/A',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                if (_canApprove && reservation.status == 'PENDING')
                  Row(
                    children: [
                      ElevatedButton.icon(
                        onPressed: () => _handleApprove(reservation),
                        icon: const Icon(Icons.check, size: 16),
                        label: const Text('Approve'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.successColor,
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppTheme.space3,
                            vertical: AppTheme.space2,
                          ),
                        ),
                      ),
                      const SizedBox(width: AppTheme.space2),
                      ElevatedButton.icon(
                        onPressed: () => _handleReject(reservation),
                        icon: const Icon(Icons.close, size: 16),
                        label: const Text('Reject'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.dangerColor,
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppTheme.space3,
                            vertical: AppTheme.space2,
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
