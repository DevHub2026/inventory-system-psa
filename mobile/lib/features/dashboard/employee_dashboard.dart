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

/// Employee Dashboard - Personal asset and borrowing view with self-service actions
class EmployeeDashboard extends StatefulWidget {
  final User user;
  final void Function(int index)? onNavigate;

  const EmployeeDashboard({
    super.key,
    required this.user,
    this.onNavigate,
  });

  @override
  State<EmployeeDashboard> createState() => _EmployeeDashboardState();
}

class _EmployeeDashboardState extends State<EmployeeDashboard> {
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
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text(
          'Employee Dashboard',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        backgroundColor: AppTheme.primaryColor,
        elevation: 0,
        scrolledUnderElevation: 0,
        automaticallyImplyLeading: false,
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
                  onRefresh: _loadData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildWelcomeSection(),
                        const SizedBox(height: AppTheme.space5),
                        _buildMyActivityGrid(),
                        const SizedBox(height: AppTheme.space5),
                        _buildQuickActions(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildWelcomeSection() {
    return Container(
      padding: const EdgeInsets.all(AppTheme.space4),
      decoration: const BoxDecoration(
        color: AppTheme.primaryColor,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back!',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: AppTheme.space1),
          Text(
            'Here is your asset activity overview.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withValues(alpha: 0.9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMyActivityGrid() {
    final stats = _stats!;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.space4),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: AppTheme.space3,
        crossAxisSpacing: AppTheme.space3,
        childAspectRatio: 1.3,
        children: [
          _buildStatCard(
            'My Borrowed Items',
            stats.borrowedAssets.toString(),
            Icons.inventory_2_outlined,
            AppTheme.primaryColor,
            AppTheme.primaryPale,
          ),
          _buildStatCard(
            'Pending Requests',
            stats.pendingBorrowRequests.toString(),
            Icons.content_paste_outlined,
            AppTheme.infoColor,
            const Color(0xFFDEF9FF),
          ),
          _buildStatCard(
            'Due Soon',
            stats.pendingReturns.toString(),
            Icons.calendar_today_outlined,
            AppTheme.warningColor,
            const Color(0xFFFEF3C7),
          ),
          _buildStatCard(
            'Overdue',
            '0',
            Icons.warning_amber_outlined,
            AppTheme.dangerColor,
            const Color(0xFFFEE2E2),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.space4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textSecondary,
                ),
              ),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
                child: Icon(icon, size: 20, color: color),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.space3),
          Text(
            value,
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppTheme.space4),
          child: Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        const SizedBox(height: AppTheme.space3),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppTheme.space4),
          child: Column(
            children: [
              _buildActionTile(
                'Browse Assets',
                'View available assets to borrow',
                Icons.inventory_2_outlined,
                AppTheme.primaryColor,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AssetListPage()),
                ),
              ),
              const SizedBox(height: AppTheme.space2),
              _buildActionTile(
                'My Borrowings',
                'View your active borrowings and returns',
                Icons.assignment_turned_in_outlined,
                const Color(0xFF7C3AED),
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const BorrowingPage()),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionTile(String title, String subtitle, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.radiusLg),
      child: Container(
        padding: const EdgeInsets.all(AppTheme.space4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              ),
              child: Icon(icon, size: 22, color: color),
            ),
            const SizedBox(width: AppTheme.space3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              size: 20,
              color: AppTheme.textMuted,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMyActivitySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppTheme.space4),
          child: Text(
            'Your Recent Activity',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        const SizedBox(height: AppTheme.space3),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppTheme.space4),
          child: Container(
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
                if (item.assetName != null)
                  Text(
                    item.assetName!,
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
