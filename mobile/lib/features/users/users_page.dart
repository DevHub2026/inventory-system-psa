import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/user.dart';
import '../../data/services/user_service.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/psa_status_badge.dart';
import 'user_detail_page.dart';

class UsersPage extends StatefulWidget {
  const UsersPage({super.key});

  @override
  State<UsersPage> createState() => _UsersPageState();
}

class _UsersPageState extends State<UsersPage> {
  final UserService _service = UserService();
  final _searchController = TextEditingController();
  List<User> _users = [];
  bool _loading = true;
  bool _loadingStats = true;
  String? _error;
  int _page = 1;
  bool _hasMore = true;
  String _statusFilter = '';

  // Summary stats
  int _totalUsers = 0;
  int _activeUsers = 0;
  int _inactiveUsers = 0;

  static const _statusFilters = ['', 'active', 'inactive'];
  static const _statusLabels = ['All', 'Active', 'Inactive'];

  @override
  void initState() {
    super.initState();
    _load(refresh: true);
    _loadStats();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadStats() async {
    setState(() => _loadingStats = true);
    try {
      final allUsers = await _service.getUsers(perPage: 9999);
      setState(() {
        _totalUsers = allUsers.length;
        _activeUsers = allUsers
            .where((u) => u.status?.toLowerCase() == 'active')
            .length;
        _inactiveUsers = allUsers
            .where((u) => u.status?.toLowerCase() != 'active')
            .length;
        _loadingStats = false;
      });
    } catch (e) {
      setState(() => _loadingStats = false);
    }
  }

  Future<void> _load({bool refresh = false}) async {
    if (refresh) {
      _page = 1;
      _hasMore = true;
    }
    if (!_hasMore && !refresh) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await _service.getUsers(
        search:
            _searchController.text.isNotEmpty ? _searchController.text : null,
        status: _statusFilter.isEmpty ? null : _statusFilter,
        page: _page,
        perPage: 20,
      );
      setState(() {
        if (refresh) {
          _users = result;
        } else {
          _users.addAll(result);
        }
        _hasMore = result.length >= 20;
        _page++;
        _loading = false;
      });
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
        title: const Text('User Management'),
        elevation: 0,
        scrolledUnderElevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Add User',
            onPressed: () {
              // TODO: Navigate to create user page
            },
          ),
        ],
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
                    'Total Users',
                    _totalUsers.toString(),
                    Icons.people_outlined,
                    AppTheme.primaryColor,
                    AppTheme.primaryPale,
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'Active',
                    _activeUsers.toString(),
                    Icons.check_circle_outline,
                    AppTheme.successColor,
                    const Color(0xFFDCFCE7),
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'Inactive',
                    _inactiveUsers.toString(),
                    Icons.block_outlined,
                    AppTheme.warningColor,
                    const Color(0xFFFEF3C7),
                  ),
                ],
              ),
            ),
          // Search box
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppTheme.space4,
              AppTheme.space2,
              AppTheme.space4,
              0,
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => setState(() {}),
              onSubmitted: (_) => _load(refresh: true),
              decoration: InputDecoration(
                hintText: 'Search by name, email, ID…',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _load(refresh: true);
                        })
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.space3,
                  vertical: AppTheme.space2_5,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
              ),
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
    if (_loading && _users.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && _users.isEmpty) {
      return EmptyStateWidget(
        title: 'Error loading users',
        message: _error!,
        icon: Icons.error_outline,
        actionLabel: 'Retry',
        onRetry: () => _load(refresh: true),
      );
    }
    if (_users.isEmpty) {
      return EmptyStateWidget(
        title: 'No users found',
        message: _statusFilter.isEmpty
            ? 'Try adjusting your search criteria.'
            : 'No ${_statusLabels[_statusFilters.indexOf(_statusFilter)].toLowerCase()} users found.',
        icon: Icons.people_outline,
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
        itemCount: _users.length + (_hasMore ? 1 : 0),
        itemBuilder: (_, i) {
          if (i == _users.length) {
            if (!_loading) _load();
            return const Padding(
              padding: EdgeInsets.all(AppTheme.space4),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          return _userCard(_users[i]);
        },
      ),
    );
  }

  Widget _userCard(User user) {
    final isActive = user.status?.toLowerCase() == 'active';

    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.space3),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => UserDetailPage(userId: user.id)),
        ).then((_) => _load(refresh: true)),
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.space3),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.primaryPale,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                ),
                child: Center(
                  child: Text(
                    (user.firstName?.substring(0, 1) ?? 'U')
                        .toUpperCase(),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppTheme.space3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${user.firstName} ${user.lastName}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      user.email ?? 'No email',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (user.role != null)
                      Text(
                        user.role!,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.textMuted,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: AppTheme.space2),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.space2,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: isActive
                      ? const Color(0xFFDCFCE7)
                      : const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  isActive ? 'Active' : 'Inactive',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isActive
                        ? AppTheme.successColor
                        : AppTheme.warningColor,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
