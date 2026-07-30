import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/models/user.dart';
import '../../data/services/dashboard_service.dart';
import '../../shared/widgets/stat_card.dart';
import '../../shared/widgets/action_card.dart';
import '../../shared/widgets/error_state_widget.dart';
import '../assets/asset_list_page.dart';
import '../borrowing/borrowing_page.dart';
import '../inventory/inventory_page.dart';
import '../maintenance/maintenance_page.dart';
import '../reservations/reservations_page.dart';

/// Staff Dashboard - Operations focus with approval tasks and asset management
class StaffDashboard extends StatefulWidget {
  final User user;
  final void Function(int index)? onNavigate;

  const StaffDashboard({
    super.key,
    required this.user,
    this.onNavigate,
  });

  @override
  State<StaffDashboard> createState() => _StaffDashboardState();
}

class _StaffDashboardState extends State<StaffDashboard> {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Staff Dashboard'),
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? ErrorStateWidget(
                  title: 'Error loading dashboard',
                  message: _errorMessage!,
                  icon: Icons.error_outline,
                  onRetry: _loadData,
                )
              : RefreshIndicator(
                  onRefresh: () => Future.delayed(Duration.zero, _loadData),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(AppTheme.space4),
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildStatsGrid(),
                        const SizedBox(height: AppTheme.space6),
                        _buildApprovalPanel(),
                        const SizedBox(height: AppTheme.space6),
                        _buildQuickActions(),
                        if (_recentActivity.isNotEmpty) ...[
                          const SizedBox(height: AppTheme.space6),
                          _buildRecentActivitySection(),
                        ],
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildStatsGrid() {
    final stats = _stats!;
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: AppTheme.space3,
      crossAxisSpacing: AppTheme.space3,
      childAspectRatio: 1.4,
      children: [
        StatCard(
          label: 'Available Assets',
          value: stats.availableAssets.toString(),
          icon: Icons.check_circle_outline,
          color: AppTheme.successColor,
          backgroundColor: const Color(0xFFDCFCE7),
        ),
        StatCard(
          label: 'Active Borrowings',
          value: stats.borrowedAssets.toString(),
          icon: Icons.assignment_turned_in_outlined,
          color: const Color(0xFF7C3AED),
          backgroundColor: const Color(0xFFEDE9FE),
        ),
        StatCard(
          label: 'Pending Requests',
          value: stats.pendingBorrowRequests.toString(),
          icon: Icons.content_paste_outlined,
          color: AppTheme.primaryColor,
          backgroundColor: AppTheme.primaryPale,
        ),
        StatCard(
          label: 'Maintenance',
          value: stats.damagedAssets.toString(),
          icon: Icons.build_outlined,
          color: AppTheme.warningColor,
          backgroundColor: const Color(0xFFFEF3C7),
        ),
      ],
    );
  }

  Widget _buildApprovalPanel() {
    final stats = _stats!;
    final hasPendingApprovals = stats.pendingBorrowRequests > 0;

    return Container(
      decoration: BoxDecoration(
        color: hasPendingApprovals ? AppTheme.primaryPale : AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(
          color: hasPendingApprovals
              ? AppTheme.primaryColor
              : AppTheme.borderColor,
        ),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.space4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.pending_actions,
                  size: 20,
                  color: hasPendingApprovals
                      ? AppTheme.primaryColor
                      : AppTheme.textMuted,
                ),
                const SizedBox(width: AppTheme.space2),
                Text(
                  'Pending Approvals',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: hasPendingApprovals
                        ? AppTheme.primaryColor
                        : AppTheme.textPrimary,
                  ),
                ),
                const Spacer(),
                if (hasPendingApprovals)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.space2,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      stats.pendingBorrowRequests.toString(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: AppTheme.space3),
            if (hasPendingApprovals)
              Column(
                children: [
                  Text(
                    'You have ${stats.pendingBorrowRequests} borrow request${stats.pendingBorrowRequests == 1 ? '' : 's'} awaiting approval.',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: AppTheme.space3),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ReservationsPage(),
                        ),
                      ),
                      icon: const Icon(Icons.check_circle_outline, size: 18),
                      label: const Text('Review Requests'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          vertical: AppTheme.space3,
                        ),
                      ),
                    ),
                  ),
                ],
              )
            else
              Text(
                'All borrow requests are up to date.',
                style: TextStyle(
                  fontSize: 13,
                  color: AppTheme.textMuted,
                  fontStyle: FontStyle.italic,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppTheme.space2),
          child: Text(
            'Quick Actions',
            style: Theme.of(context).textTheme.displaySmall,
          ),
        ),
        const SizedBox(height: AppTheme.space3),
        ActionCard(
          title: 'Assets',
          subtitle: 'View and manage assets',
          icon: Icons.inventory_2_outlined,
          color: AppTheme.primaryColor,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AssetListPage()),
          ),
        ),
        ActionCard(
          title: 'Borrow Requests',
          subtitle: 'Review and approve requests',
          icon: Icons.content_paste_outlined,
          color: AppTheme.primaryColor,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ReservationsPage()),
          ),
        ),
        ActionCard(
          title: 'Borrowed Items',
          subtitle: 'Track active borrowings',
          icon: Icons.assignment_turned_in_outlined,
          color: const Color(0xFF7C3AED),
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const BorrowingPage()),
          ),
        ),
        ActionCard(
          title: 'Inventory',
          subtitle: 'Manage inventory',
          icon: Icons.category_outlined,
          color: AppTheme.tealColor,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const InventoryPage()),
          ),
        ),
        ActionCard(
          title: 'Maintenance',
          subtitle: 'Asset maintenance',
          icon: Icons.build_outlined,
          color: AppTheme.warningColor,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const MaintenancePage()),
          ),
        ),
      ],
    );
  }

  Widget _buildRecentActivitySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppTheme.space2),
          child: Text(
            'Recent Activity',
            style: Theme.of(context).textTheme.displaySmall,
          ),
        ),
        const SizedBox(height: AppTheme.space3),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.cardColor,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
            border: Border.all(color: AppTheme.borderColor),
            boxShadow: AppTheme.shadowSm,
          ),
          child: Column(
            children: [
              for (int i = 0; i < _recentActivity.length && i < 5; i++) ...[
                if (i > 0) const Divider(height: 1),
                _buildActivityTile(_recentActivity[i]),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActivityTile(ActivityItem item) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.space4,
        vertical: AppTheme.space3,
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.primaryPale,
              borderRadius: BorderRadius.circular(AppTheme.radiusSm),
            ),
            child: const Icon(
              Icons.history,
              size: 18,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(width: AppTheme.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.description,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (item.userName != null)
                  Text(
                    'By ${item.userName}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: AppTheme.space2),
          Text(
            DateFormatter.timeAgo(item.createdAt),
            style: const TextStyle(
              fontSize: 11,
              color: AppTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}
