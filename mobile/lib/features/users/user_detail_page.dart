import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/string_utils.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/models/user.dart';
import '../../data/services/user_service.dart';
import '../../shared/widgets/app_error.dart';
import '../../shared/widgets/info_row.dart';

class UserDetailPage extends StatefulWidget {
  final int userId;
  const UserDetailPage({super.key, required this.userId});

  @override
  State<UserDetailPage> createState() => _UserDetailPageState();
}

class _UserDetailPageState extends State<UserDetailPage>
    with SingleTickerProviderStateMixin {
  final UserService _service = UserService();
  late TabController _tabs;
  User? _user;
  Map<String, dynamic>? _profileData;
  List<dynamic> _history = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final profile = await _service.getUserProfile(widget.userId);
      final userJson = profile['user'] as Map<String, dynamic>?;
      final history  = await _service.getBorrowingHistory(widget.userId);
      setState(() {
        _user        = userJson != null ? User.fromJson(userJson) : null;
        _profileData = profile;
        _history     = history;
        _loading     = false;
      });
    } catch (e) {
      setState(() {
        _error   = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_user?.fullName ?? 'User Profile'),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
        bottom: _loading || _error != null
            ? null
            : TabBar(
                controller: _tabs,
                indicatorColor: Colors.white,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white70,
                tabs: const [
                  Tab(text: 'Profile'),
                  Tab(text: 'Issued'),
                  Tab(text: 'History'),
                ],
              ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? AppError(message: _error!, onRetry: _load)
              : TabBarView(
                  controller: _tabs,
                  children: [
                    _buildProfile(),
                    _buildIssued(),
                    _buildHistory(),
                  ],
                ),
    );
  }

  // ── Profile tab ──────────────────────────────────────────────────────────
  Widget _buildProfile() {
    final u = _user!;
    final stats = (_profileData?['stats'] as Map<String, dynamic>?) ?? {};
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Avatar + name
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.cardColor,
              borderRadius: BorderRadius.circular(AppTheme.radiusXl),
              border: Border.all(color: AppTheme.borderColor),
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: AppTheme.psaYellow,
                  child: Text(StringUtils.getInitials(u.fullName),
                      style: const TextStyle(color: AppTheme.primaryColor,
                          fontWeight: FontWeight.w900, fontSize: 24)),
                ),
                const SizedBox(height: 12),
                Text(u.fullName,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary)),
                if (u.employeeNumber != null)
                  Text('ID: ${u.employeeNumber}',
                      style: const TextStyle(fontSize: 12, fontFamily: 'monospace',
                          color: AppTheme.textSecondary)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  alignment: WrapAlignment.center,
                  children: [
                    _chip(u.status?.toUpperCase() ?? 'ACTIVE',
                        u.status?.toLowerCase() == 'active'
                            ? AppTheme.successColor : AppTheme.warningColor),
                    if (u.roles != null)
                      for (final r in u.roles!)
                        _chip(r.name, AppTheme.primaryColor),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Stats
          Row(
            children: [
              _statBox('Current', '${stats['currently_borrowed'] ?? 0}', AppTheme.primaryColor),
              const SizedBox(width: 8),
              _statBox('Total', '${stats['total_borrowed'] ?? 0}', const Color(0xFF0F766E)),
              const SizedBox(width: 8),
              _statBox('Returned', '${stats['returned'] ?? 0}', AppTheme.successColor),
              const SizedBox(width: 8),
              _statBox('Overdue', '${stats['overdue'] ?? 0}', AppTheme.errorColor),
            ],
          ),
          const SizedBox(height: 12),
          // Info
          Card(
            child: Column(
              children: [
                InfoRow(label: 'Full Name',   value: u.fullName),
                InfoRow(label: 'Employee ID', value: u.employeeNumber),
                InfoRow(label: 'Username',    value: u.username),
                InfoRow(label: 'Email',       value: u.email),
                InfoRow(label: 'Department',  value: u.department?.name),
                InfoRow(label: 'Office',      value: u.office?.name),
                InfoRow(label: 'Status',      value: u.status?.toUpperCase()),
                InfoRow(label: 'Created',
                    value: DateFormatter.formatDate(u.createdAt), divider: false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.10),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withValues(alpha: 0.3)),
    ),
    child: Text(label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
  );

  Widget _statBox(String label, String value, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600,
              color: color.withValues(alpha: 0.8))),
        ],
      ),
    ),
  );

  // ── Issued tab ───────────────────────────────────────────────────────────
  Widget _buildIssued() {
    final items = (_profileData?['issued_assets'] as List<dynamic>?) ?? [];
    if (items.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.inbox_outlined, size: 48, color: Color(0xFFCBD5E1)),
            SizedBox(height: 12),
            Text('No currently issued assets.',
                style: TextStyle(fontSize: 14, color: AppTheme.textSecondary)),
          ]),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (_, i) {
        final item = items[i] as Map<String, dynamic>;
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: Text(item['asset_name']?.toString() ?? '—',
                        style: const TextStyle(fontWeight: FontWeight.w700,
                            fontSize: 14, color: AppTheme.textPrimary))),
                    _chip(item['status']?.toString() ?? '—', AppTheme.primaryColor),
                  ],
                ),
                const SizedBox(height: 4),
                Text(item['asset_code']?.toString() ?? '',
                    style: const TextStyle(fontSize: 12, fontFamily: 'monospace',
                        color: AppTheme.textSecondary)),
                const SizedBox(height: 6),
                Text('Borrowed: ${DateFormatter.formatDate(item['borrowed_at']?.toString())}',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                if (item['due_date'] != null)
                  Text('Due: ${DateFormatter.formatDate(item['due_date']?.toString())}',
                      style: const TextStyle(fontSize: 12, color: AppTheme.warningColor)),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── History tab ──────────────────────────────────────────────────────────
  Widget _buildHistory() {
    if (_history.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text('No borrowing history.',
              style: TextStyle(fontSize: 14, color: AppTheme.textSecondary)),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _history.length,
      itemBuilder: (_, i) {
        final item = _history[i] as Map<String, dynamic>;
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['asset_name']?.toString() ?? '—',
                          style: const TextStyle(fontWeight: FontWeight.w600,
                              fontSize: 14, color: AppTheme.textPrimary)),
                      const SizedBox(height: 3),
                      Text(DateFormatter.formatDate(item['borrowed_at']?.toString()),
                          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                    ],
                  ),
                ),
                _chip(item['status']?.toString() ?? '—', _historyColor(item['status']?.toString())),
              ],
            ),
          ),
        );
      },
    );
  }

  Color _historyColor(String? status) => switch (status?.toUpperCase()) {
    'RETURNED'  => AppTheme.successColor,
    'OVERDUE'   => AppTheme.errorColor,
    'BORROWED'  => AppTheme.primaryColor,
    _ => AppTheme.textMuted,
  };
}
