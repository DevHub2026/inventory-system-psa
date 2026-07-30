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
<<<<<<< HEAD
          // Page Header
          _buildPageHeader(),
          const SizedBox(height: AppTheme.space6),

          // Stat cards
          _buildStatCards(stats),
          const SizedBox(height: AppTheme.space6),

          // Quick Actions Panel
          _buildQuickActionsPanel(),
          const SizedBox(height: AppTheme.space6),

          // Recent Activity Panel
          if (_recentActivity.isNotEmpty) _buildRecentActivityPanel(),
        ],
      ),
    );
  }

  Widget _buildPageHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Employee Dashboard',
          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                fontSize: AppTheme.textSectionTitle,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
        ),
        const SizedBox(height: AppTheme.space2),
        Text(
          'Welcome back. Here is your asset activity overview.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textSecondary,
              ),
        ),
      ],
    );
  }

  Widget _buildStatCards(DashboardStats stats) {
    final statCards = [
      {
        'label': 'My Borrow Requests',
        'value': stats.pendingBorrowRequests.toString(),
        'description': 'Requests you submitted',
        'icon': Icons.content_paste_outlined,
        'tone': 'blue',
      },
      {
        'label': 'My Borrowed Items',
        'value': stats.borrowedAssets.toString(),
        'description': 'Items currently borrowed',
        'icon': Icons.inventory_2_outlined,
        'tone': 'green',
      },
      {
        'label': 'Due Soon',
        'value': stats.pendingReturns.toString(),
        'description': 'Active items to monitor',
        'icon': Icons.calendar_today_outlined,
        'tone': 'amber',
      },
      {
        'label': 'Overdue',
        'value': '0',
        'description': 'Items needing return',
        'icon': Icons.warning_amber_outlined,
        'tone': 'red',
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: AppTheme.space4,
        crossAxisSpacing: AppTheme.space4,
        childAspectRatio: 1.3,
      ),
      itemCount: statCards.length,
      itemBuilder: (context, index) {
        final card = statCards[index];
        return PsaStatCard(
          label: card['label'] as String,
          value: card['value'] as String,
          description: card['description'] as String,
          icon: card['icon'] as IconData,
          tone: card['tone'] as String,
        );
      },
    );
  }

  Widget _buildQuickActionsPanel() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.borderColor),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Panel Header
          Padding(
            padding: const EdgeInsets.all(AppTheme.space4),
            child: Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                
                letterSpacing: 0.10,
                color: AppTheme.textMuted,
              ),
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(AppTheme.space4),
            child: Column(
              children: [
                _buildQuickActionButton(
                  icon: Icons.qr_code_scanner,
                  title: 'Scan Asset QR Code',
                  onTap: () => widget.onNavigate?.call(2),
                ),
                const SizedBox(height: AppTheme.space2),
                _buildQuickActionButton(
                  icon: Icons.history,
                  title: 'View Borrowing Records',
                  onTap: () => widget.onNavigate?.call(3),
                ),
                const SizedBox(height: AppTheme.space2),
                _buildQuickActionButton(
                  icon: Icons.inventory_2_outlined,
                  title: 'Browse Available Assets',
                  onTap: () => widget.onNavigate?.call(1),
                ),
                const SizedBox(height: AppTheme.space2),
                _buildQuickActionButton(
                  icon: Icons.person_outline,
                  title: 'My Profile Settings',
                  onTap: () => widget.onNavigate?.call(4),
=======
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
>>>>>>> 6bc7d60696539327e12f61fa55cb8e57b4e53eb7
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 18),
        label: Text(title),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: AppTheme.space3),
          alignment: Alignment.centerLeft,
        ),
      ),
    );
  }

  Widget _buildRecentActivityPanel() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.borderColor),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Panel Header
          Padding(
            padding: const EdgeInsets.all(AppTheme.space4),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Recent Activity',
                        style: TextStyle(
                          fontSize: AppTheme.textCardTitle,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Your recent asset interactions',
                        style: TextStyle(
                          fontSize: AppTheme.textSmall, color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Column(
            children: [
              for (int i = 0; i < _recentActivity.length && i < 5; i++) ...[
                if (i > 0) const Divider(height: 1),
                _buildActivityTile(_recentActivity[i]),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActivityTile(ActivityItem item) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.space4, vertical: AppTheme.space3),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.primaryPale,
              borderRadius: BorderRadius.circular(AppTheme.radiusSm),
            ),
            child: const Icon(Icons.history, size: 18, color: AppTheme.primaryColor),
          ),
          const SizedBox(width: AppTheme.space3),
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
          const SizedBox(width: AppTheme.space2),
          Text(
            DateFormatter.timeAgo(item.createdAt),
            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
        ],
      ),
    );
  }
}

<<<<<<< HEAD
=======
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
>>>>>>> 6bc7d60696539327e12f61fa55cb8e57b4e53eb7
