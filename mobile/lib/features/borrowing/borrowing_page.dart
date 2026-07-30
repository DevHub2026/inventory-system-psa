import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/models/borrowing.dart';
import '../../data/services/borrowing_service.dart';
import '../../data/services/asset_service.dart';
import '../../shared/widgets/psa_status_badge.dart';
import '../../shared/widgets/psa_empty_state.dart';
import '../../shared/widgets/psa_button.dart';
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
  String? _errorMessage;
  String _selectedStatus = '';
  final int _currentPage = 1;

  @override
  void initState() {
    super.initState();
    _loadBorrowings();
  }

  Future<void> _loadBorrowings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _borrowingService.getBorrowings(
        status: _selectedStatus.isEmpty ? null : _selectedStatus,
        page: _currentPage,
      );
      setState(() {
        _borrowings = result.items;
        // _lastPage = result.meta.lastPage;
        // _total = result.meta.total;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Borrowed Items'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list, size: 20),
            onSelected: (value) {
              setState(() => _selectedStatus = value);
              _loadBorrowings();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: '', child: Text('All Statuses')),
              const PopupMenuItem(value: 'BORROWED', child: Text('Borrowed')),
              const PopupMenuItem(value: 'RETURNED', child: Text('Returned')),
              const PopupMenuItem(value: 'OVERDUE', child: Text('Overdue')),
            ],
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppTheme.errorColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                ),
                child: const Icon(
                  Icons.error_outline,
                  size: 32,
                  color: AppTheme.errorColor,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'An Error Occurred',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.errorColor,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _errorMessage!,
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              PsaButton(
                label: 'Try Again',
                icon: Icons.refresh,
                variant: PsaButtonVariant.secondary,
                size: PsaButtonSize.sm,
                onPressed: _loadBorrowings,
              ),
            ],
          ),
        ),
      );
    }

    if (_borrowings.isEmpty) {
      return PsaEmptyState(
        title: 'No Borrowing Records',
        description: _selectedStatus.isNotEmpty
            ? 'No records found with status "$_selectedStatus".'
            : 'You have not borrowed any office assets yet.',
        icon: Icons.inventory_2_outlined,
        onAction: _loadBorrowings,
        actionLabel: 'Refresh List',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadBorrowings,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _borrowings.length,
        itemBuilder: (context, index) {
          final borrowing = _borrowings[index];
          return _buildBorrowingCard(borrowing);
        },
      ),
    );
  }

  Widget _buildBorrowingCard(Borrowing borrowing) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => BorrowingDetailPage(borrowingId: borrowing.id)),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(AppTheme.radiusXl),
          border: Border.all(color: AppTheme.borderColor),
          boxShadow: [BoxShadow(color: AppTheme.shadowColor, blurRadius: 4, offset: const Offset(0, 1))],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                        color: AppTheme.primaryPale,
                        borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.inventory_2_outlined, size: 20,
                        color: AppTheme.primaryColor),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(borrowing.asset?.name ?? 'Asset #${borrowing.assetId}',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 2),
                        Text(borrowing.asset?.assetNumber ?? '',
                            style: const TextStyle(fontSize: 12, fontFamily: 'monospace',
                                color: AppTheme.textSecondary)),
                      ],
                    ),
                  ),
                  PsaStatusBadge(status: borrowing.status),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Row(
                children: [
                  _dateChip(Icons.calendar_today, 'Borrowed',
                      DateFormatter.formatDate(borrowing.borrowedAt ?? borrowing.borrowDate)),
                  const SizedBox(width: 16),
                  _dateChip(Icons.event, 'Due',
                      DateFormatter.formatDate(borrowing.dueDate)),
                ],
              ),
              if (borrowing.returnedAt != null) ...[
                const SizedBox(height: 8),
                _dateChip(Icons.check_circle_outline, 'Returned',
                    DateFormatter.formatDate(borrowing.returnedAt),
                    color: AppTheme.successColor),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _dateChip(IconData icon, String label, String value, {Color? color}) {
    final c = color ?? AppTheme.textMuted;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: c),
        const SizedBox(width: 4),
        Text('$label: ', style: TextStyle(fontSize: 12, color: c)),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500,
            color: AppTheme.textSecondary)),
      ],
    );
  }
}