import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/models/borrowing.dart';
import '../../data/services/borrowing_service.dart';
import '../../shared/widgets/psa_status_badge.dart';
import '../../shared/widgets/empty_state_widget.dart';
import 'borrowing_detail_page.dart';

class BorrowingPage extends StatefulWidget {
  const BorrowingPage({super.key});

  @override
  State<BorrowingPage> createState() => _BorrowingPageState();
}

class _BorrowingPageState extends State<BorrowingPage> {
  final BorrowingService _borrowingService = BorrowingService();
  List<Borrowing> _borrowings = [];
  bool _isLoading = true;
  bool _loadingStats = true;
  String? _errorMessage;
  String _selectedStatus = '';
  int _currentPage = 1;
  bool _hasMore = true;

  // Summary stats
  int _activeBorrowings = 0;
  int _returnedItems = 0;
  int _overdueItems = 0;

  static const _statusFilters = ['', 'BORROWED', 'RETURNED', 'OVERDUE'];
  static const _statusLabels = ['All', 'Active', 'Returned', 'Overdue'];

  @override
  void initState() {
    super.initState();
    _loadBorrowings();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _loadingStats = true);
    try {
      final stats = await _borrowingService.getBorrowingStats();
      setState(() {
        _activeBorrowings = (stats['active'] as num?)?.toInt() ?? 0;
        _returnedItems = (stats['returned'] as num?)?.toInt() ?? 0;
        _overdueItems = (stats['overdue'] as num?)?.toInt() ?? 0;
        _loadingStats = false;
      });
    } catch (e) {
      setState(() => _loadingStats = false);
    }
  }

  Future<void> _loadBorrowings({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
    }
    if (!_hasMore && !refresh) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _borrowingService.getBorrowings(
        status: _selectedStatus.isEmpty ? null : _selectedStatus,
        page: refresh ? 1 : _currentPage,
        perPage: 20,
      );
      setState(() {
        if (refresh) {
          _borrowings = result.items;
        } else {
          _borrowings.addAll(result.items);
        }
        _isLoading = false;
        _hasMore = result.items.length >= 20;
        _currentPage++;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _handleReturn(Borrowing borrowing) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Return Item'),
        content: Text('Return "${borrowing.asset?.name ?? 'Asset'}"?'),
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
            child: const Text('Return'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _borrowingService.returnAsset(borrowing.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Asset returned successfully.')),
        );
        _loadBorrowings(refresh: true);
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
        title: const Text('Borrowed Items'),
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
                    'Active',
                    _activeBorrowings.toString(),
                    Icons.assignment_turned_in_outlined,
                    const Color(0xFF7C3AED),
                    const Color(0xFFEDE9FE),
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'Returned',
                    _returnedItems.toString(),
                    Icons.check_circle_outline,
                    AppTheme.successColor,
                    const Color(0xFFDCFCE7),
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'Overdue',
                    _overdueItems.toString(),
                    Icons.warning_amber_outlined,
                    AppTheme.dangerColor,
                    const Color(0xFFFEE2E2),
                  ),
                ],
              ),
            ),
          // Filter chips
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
                final isSelected = _selectedStatus == _statusFilters[i];
                return FilterChip(
                  label: Text(_statusLabels[i]),
                  selected: isSelected,
                  onSelected: (_) {
                    setState(() => _selectedStatus = _statusFilters[i]);
                    _loadBorrowings(refresh: true);
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
    if (_isLoading && _borrowings.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null && _borrowings.isEmpty) {
      return EmptyStateWidget(
        title: 'Error loading borrowings',
        message: _errorMessage!,
        icon: Icons.error_outline,
        actionLabel: 'Retry',
        onRetry: () => _loadBorrowings(refresh: true),
      );
    }

    if (_borrowings.isEmpty) {
      return EmptyStateWidget(
        title: 'No borrowed items',
        message: _selectedStatus.isEmpty
            ? 'Borrowed assets will appear here after you borrow or request items.'
            : 'No ${_statusLabels[_statusFilters.indexOf(_selectedStatus)].toLowerCase()} borrowings.',
        icon: Icons.inventory_2_outlined,
        actionLabel: 'Refresh',
        onRetry: () => _loadBorrowings(refresh: true),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadBorrowings(refresh: true),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.space4,
          vertical: AppTheme.space3,
        ),
        itemCount: _borrowings.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _borrowings.length) {
            if (!_isLoading) _loadBorrowings();
            return const Padding(
              padding: EdgeInsets.all(AppTheme.space4),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          return _buildBorrowingCard(_borrowings[index]);
        },
      ),
    );
  }

  Widget _buildBorrowingCard(Borrowing borrowing) {
    final isOverdue = borrowing.dueDate != null &&
        DateTime.parse(borrowing.dueDate!).isBefore(DateTime.now());

    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.space3),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => BorrowingDetailPage(borrowingId: borrowing.id),
          ),
        ).then((_) => _loadBorrowings(refresh: true)),
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
                      Icons.assignment_turned_in_outlined,
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
                          borrowing.asset?.name ?? 'Asset',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (borrowing.user?.fullName != null)
                          Text(
                            'From ${borrowing.user!.fullName}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  ),
                  PsaStatusBadge(
                    status: borrowing.status,
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
                        'Due Date',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      Text(
                        borrowing.dueDate != null
                            ? DateFormatter.formatDate(borrowing.dueDate!)
                            : 'N/A',
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
                  if (borrowing.status == 'BORROWED')
                    ElevatedButton.icon(
                      onPressed: () => _handleReturn(borrowing),
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Return'),
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
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAssetCell(String? name, String? identifier) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          name ?? '—',
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        if (identifier != null && identifier.isNotEmpty) ...[
          const SizedBox(height: 2),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
            decoration: BoxDecoration(
              color: AppTheme.surfaceColor,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              identifier,
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 11,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildDateTimeCell(String label, String? iso) {
    if (iso == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 2),
          const Text(
            '—',
            style: TextStyle(
              fontSize: 13,
              color: AppTheme.textMuted,
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppTheme.textMuted,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          DateFormatter.formatDate(iso),
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppTheme.textPrimary,
          ),
        ),
        Text(
          DateFormatter.formatTime(iso),
          style: const TextStyle(
            fontSize: 11.5,
            color: AppTheme.textMuted,
          ),
        ),
      ],
    );
  }

  Widget _buildDueDateCell(String? iso, String status) {
    if (iso == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Due Date',
            style: TextStyle(
              fontSize: 11,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 2),
          const Text(
            '—',
            style: TextStyle(
              fontSize: 13,
              color: AppTheme.textMuted,
            ),
          ),
        ],
      );
    }

    final now = DateTime.now();
    final due = DateTime.parse(iso);
    final isOverdue = status != 'RETURNED' && due.isBefore(now);
    final isDueSoon = !isOverdue && status != 'RETURNED' && due.difference(now).inHours < 48;

    final textColor = isOverdue
        ? AppTheme.dangerColor
        : isDueSoon
            ? AppTheme.warningColor
            : AppTheme.textPrimary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Due Date',
          style: TextStyle(
            fontSize: 11,
            color: AppTheme.textMuted,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          DateFormatter.formatDate(iso),
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: textColor,
          ),
        ),
        if (isOverdue)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 0),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Text(
              'OVERDUE',
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w600,
                color: AppTheme.dangerColor,
              ),
            ),
          ),
        if (isDueSoon && !isOverdue)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 0),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Text(
              'DUE SOON',
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w600,
                color: AppTheme.warningColor,
              ),
            ),
          ),
      ],
    );
  }
}