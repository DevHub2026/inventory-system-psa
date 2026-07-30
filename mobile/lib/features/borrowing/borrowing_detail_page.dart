import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/models/borrowing.dart';
import '../../data/services/borrowing_service.dart';
import '../../shared/widgets/psa_status_badge.dart';
import '../../shared/widgets/info_row.dart';
import '../../shared/widgets/app_error.dart';

class BorrowingDetailPage extends StatefulWidget {
  final int borrowingId;
  const BorrowingDetailPage({super.key, required this.borrowingId});

  @override
  State<BorrowingDetailPage> createState() => _BorrowingDetailPageState();
}

class _BorrowingDetailPageState extends State<BorrowingDetailPage> {
  final BorrowingService _service = BorrowingService();
  Borrowing? _borrowing;
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
      final b = await _service.getBorrowing(widget.borrowingId);
      setState(() { _borrowing = b; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Borrowing Details'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? AppError(message: _error!, onRetry: _load)
              : _buildBody(),
    );
  }

  Widget _buildBody() {
    final b = _borrowing!;
    return SingleChildScrollView(
      child: Column(
        children: [
          // Header
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryPale,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.assignment_outlined, size: 26, color: AppTheme.primaryColor),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(b.asset?.name ?? 'Asset #${b.assetId}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 4),
                      Text(b.asset?.assetNumber ?? '',
                          style: const TextStyle(fontSize: 12, fontFamily: 'monospace',
                              color: AppTheme.textSecondary)),
                    ],
                  ),
                ),
                PsaStatusBadge(status: b.status),
              ],
            ),
          ),
          const Divider(height: 1),
          // Details
          Card(
            margin: const EdgeInsets.all(16),
            child: Column(
              children: [
                InfoRow(label: 'Borrower', value: b.user?.fullName),
                InfoRow(label: 'Employee ID', value: b.user?.employeeNumber),
                InfoRow(label: 'Asset', value: b.asset?.name),
                InfoRow(label: 'Asset Code', value: b.asset?.assetNumber),
                InfoRow(label: 'Category', value: b.asset?.category?.name),
                InfoRow(label: 'Borrow Date',
                    value: DateFormatter.formatDate(b.borrowedAt ?? b.borrowDate)),
                InfoRow(label: 'Borrow Time',
                    value: DateFormatter.formatTime(b.borrowedAt)),
                InfoRow(label: 'Due Date', value: DateFormatter.formatDate(b.dueDate)),
                InfoRow(label: 'Return Date',
                    value: DateFormatter.formatDate(b.returnedAt)),
                InfoRow(label: 'Return Time',
                    value: DateFormatter.formatTime(b.returnedAt)),
                InfoRow(label: 'Issued By', value: b.authorizer?.fullName),
                InfoRow(label: 'Authorized At',
                    value: DateFormatter.formatDateTime(b.authorizedAt)),
                InfoRow(label: 'Remarks', value: b.remarks, divider: false),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
