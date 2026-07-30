import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/string_utils.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/models/user.dart';
import '../../data/services/dashboard_service.dart';
import '../../shared/widgets/psa_stat_card.dart';
import '../../shared/widgets/psa_section_label.dart';
import '../auth/auth_bloc.dart';
import '../auth/auth_event.dart';
import '../notifications/notifications_page.dart';

class DashboardPage extends StatefulWidget {
  final User user;
  final void Function(int index)? onNavigate;

  const DashboardPage({
    super.key,
    required this.user,
    this.onNavigate,
  });

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final DashboardService _dashboardService = DashboardService();

  DashboardStats? _stats;
  List<ActivityItem> _recentActivity = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final stats = await _dashboardService.getStats();
      final activity = await _dashboardService.getRecentActivity();
      setState(() {
        _stats = stats;
        _recentActivity = activity;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Sign out'),
        content: const Text('Are you sure you want to sign out of PSA Inventory?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              context.read<AuthBloc>().add(const AuthLogoutRequested());
            },
            style: TextButton.styleFrom(foregroundColor: AppTheme.errorColor),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, size: 20),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const NotificationsPage()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout, size: 20),
            onPressed: () => _showLogoutDialog(context),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? RefreshIndicator(
                  onRefresh: _loadData,
                  child: SingleChildScrollView(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: AppTheme.errorColor),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  ),
                )
              : _buildDashboard(),
    );
  }

  Widget _buildDashboard() {
    final stats = _stats!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.cardColor,
              borderRadius: BorderRadius.circular(AppTheme.radiusXl),
              border: Border.all(color: AppTheme.borderColor),
              boxShadow: const [
                BoxShadow(
                  color: AppTheme.shadowColor,
                  blurRadius: 4,
                  offset: Offset(0, 1),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.psaYellow,
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x66FFD400),
                        blurRadius: 8,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      StringUtils.getInitials(widget.user.fullName),
                      style: const TextStyle(
                        color: AppTheme.primaryColor,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.user.fullName,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.user.employeeNumber != null && widget.user.employeeNumber!.isNotEmpty
                            ? 'ID: ${widget.user.employeeNumber}'
                            : widget.user.email,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.user.department?.name ?? 'PSA Staff',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const PsaSectionLabel(label: 'Summary Overview'),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.3,
            children: [
              PsaStatCard(
                label: 'Total Assets',
                value: stats.totalAssets.toString(),
                description: 'All registered assets',
                icon: Icons.inventory_2_outlined,
                tone: 'blue',
              ),
              PsaStatCard(
                label: 'Available',
                value: stats.availableAssets.toString(),
                description: 'Ready for use',
                icon: Icons.check_circle_outline,
                tone: 'green',
              ),
              PsaStatCard(
                label: 'Borrowed',
                value: stats.borrowedAssets.toString(),
                description: 'Currently in use',
                icon: Icons.archive_outlined,
                tone: 'amber',
              ),
              PsaStatCard(
                label: 'Damaged',
                value: stats.damagedAssets.toString(),
                description: 'Needs repair',
                icon: Icons.warning_amber_outlined,
                tone: 'red',
              ),
              PsaStatCard(
                label: 'Pending Requests',
                value: stats.pendingBorrowRequests.toString(),
                description: 'Awaiting approval',
                icon: Icons.schedule_outlined,
                tone: 'amber',
              ),
              PsaStatCard(
                label: 'Overdue',
                value: stats.pendingReturns.toString(),
                description: 'Past due date',
                icon: Icons.warning_amber_outlined,
                tone: 'red',
              ),
            ],
          ),
          const SizedBox(height: 24),
          const PsaSectionLabel(label: 'Quick Actions'),
          _buildQuickActionCard(
            context,
            icon: Icons.qr_code_scanner,
            iconBg: AppTheme.primaryPale,
            iconColor: AppTheme.primaryColor,
            title: 'Scan Asset QR Code',
            subtitle: 'Scan physical tag to view or update asset status',
            onTap: () => widget.onNavigate?.call(2),
          ),
          const SizedBox(height: 10),
          _buildQuickActionCard(
            context,
            icon: Icons.history,
            iconBg: const Color(0xFFF0FDF4),
            iconColor: AppTheme.successColor,
            title: 'View Borrowing Records',
            subtitle: 'Check history and active borrowing status',
            onTap: () => widget.onNavigate?.call(3),
          ),
          const SizedBox(height: 10),
          _buildQuickActionCard(
            context,
            icon: Icons.inventory_2_outlined,
            iconBg: const Color(0xFFFFFBEB),
            iconColor: AppTheme.warningColor,
            title: 'Browse Assets',
            subtitle: 'View all available office assets and equipment',
            onTap: () => widget.onNavigate?.call(1),
          ),
          const SizedBox(height: 24),
          if (_recentActivity.isNotEmpty) ...[
            const PsaSectionLabel(label: 'Recent Activity'),
            Container(
              decoration: BoxDecoration(
                color: AppTheme.cardColor,
                borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                border: Border.all(color: AppTheme.borderColor),
              ),
              child: Column(
                children: [
                  for (int i = 0; i < _recentActivity.length && i < 5; i++) ...[
                    if (i > 0) const Divider(height: 1, indent: 56),
                    _buildActivityTile(_recentActivity[i]),
                  ],
                ],
              ),
            ),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildActivityTile(ActivityItem item) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.primaryPale,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.history, size: 18, color: AppTheme.primaryColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.description,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (item.userName != null)
                  Text(item.userName!,
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            DateFormatter.timeAgo(item.createdAt),
            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard(
    BuildContext context, {
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        border: Border.all(color: AppTheme.borderColor),
        boxShadow: const [
          BoxShadow(
            color: AppTheme.shadowColor,
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppTheme.radiusXl),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, size: 22, color: iconColor),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}