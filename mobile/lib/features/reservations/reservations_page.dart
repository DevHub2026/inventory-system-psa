import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_formatter.dart';
import '../../core/utils/status_helpers.dart';
import '../../data/models/reservation_model.dart';
import '../../data/services/reservation_service.dart';
import '../../shared/widgets/app_empty.dart';
import '../../shared/widgets/app_error.dart';
import '../../shared/widgets/psa_badge.dart';

class ReservationsPage extends StatefulWidget {
  const ReservationsPage({super.key});
  @override
  State<ReservationsPage> createState() => _ReservationsPageState();
}

class _ReservationsPageState extends State<ReservationsPage> {
  final ReservationService _service = ReservationService();
  List<ReservationModel> _items = [];
  bool _loading = true;
  String? _error;
  String? _statusFilter;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final r = await _service.getReservations(status: _statusFilter);
      setState(() { _items = r; _loading = false; });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reservations'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (v) {
              setState(() => _statusFilter = v.isEmpty ? null : v);
              _load();
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: '', child: Text('All')),
              PopupMenuItem(value: 'PENDING',   child: Text('Pending')),
              PopupMenuItem(value: 'APPROVED',  child: Text('Approved')),
              PopupMenuItem(value: 'REJECTED',  child: Text('Rejected')),
              PopupMenuItem(value: 'CANCELLED', child: Text('Cancelled')),
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
                      title: 'No reservations found',
                      icon: Icons.event_available_outlined,
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

  Widget _card(ReservationModel r) {
    final color = StatusHelpers.reservationColor(r.status);
    final label = StatusHelpers.reservationLabel(r.status);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.event_available_outlined, size: 20, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Reservation #${r.id}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary)),
                  if (r.user != null)
                    Text(r.user!.fullName,
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                ]),
              ),
              PsaBadge(label: label, color: color, fontSize: 10),
            ]),
            if (r.startDate != null || r.endDate != null) ...[
              const SizedBox(height: 10),
              const Divider(height: 1),
              const SizedBox(height: 8),
              Row(children: [
                const Icon(Icons.calendar_today, size: 13, color: AppTheme.textMuted),
                const SizedBox(width: 4),
                Text(DateFormatter.formatDate(r.startDate),
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                if (r.endDate != null) ...[
                  const Text(' → ', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                  Text(DateFormatter.formatDate(r.endDate),
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                ],
              ]),
            ],
            if (r.items.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6, runSpacing: 4,
                children: r.items.take(3).map((item) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(item.asset?.name ?? 'Asset #${item.assetId}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                )).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
