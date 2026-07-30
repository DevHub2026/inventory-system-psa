import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/string_utils.dart';
import '../../data/models/user.dart';
import '../../data/services/user_service.dart';
import '../../shared/widgets/app_empty.dart';
import '../../shared/widgets/app_error.dart';
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
  String? _error;
  int _page = 1;
  bool _hasMore = true;
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    _load(refresh: true);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load({bool refresh = false}) async {
    if (refresh) { _page = 1; _hasMore = true; }
    if (!_hasMore && !refresh) return;
    setState(() { _loading = true; _error = null; });
    try {
      final result = await _service.getUsers(
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
        status: _statusFilter,
        page: _page,
        perPage: 20,
      );
      setState(() {
        if (refresh) { _users = result; } else { _users.addAll(result); }
        _hasMore = result.length >= 20;
        _page++;
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (v) {
              setState(() => _statusFilter = v.isEmpty ? null : v);
              _load(refresh: true);
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: '', child: Text('All Status')),
              const PopupMenuItem(value: 'active', child: Text('Active')),
              const PopupMenuItem(value: 'inactive', child: Text('Inactive')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
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
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
              ),
              onSubmitted: (_) => _load(refresh: true),
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading && _users.isEmpty) return const Center(child: CircularProgressIndicator());
    if (_error != null && _users.isEmpty) return AppError(message: _error!, onRetry: () => _load(refresh: true));
    if (_users.isEmpty) return const AppEmpty(title: 'No users found', subtitle: 'Try adjusting your search.');

    return RefreshIndicator(
      onRefresh: () => _load(refresh: true),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _users.length + (_hasMore ? 1 : 0),
        itemBuilder: (_, i) {
          if (i == _users.length) {
            if (!_loading) _load();
            return const Padding(padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()));
          }
          return _userCard(_users[i]);
        },
      ),
    );
  }

  Widget _userCard(User u) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => UserDetailPage(userId: u.id)),
        ).then((_) => _load(refresh: true)),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: AppTheme.psaYellow,
                child: Text(StringUtils.getInitials(u.fullName),
                    style: const TextStyle(color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w800, fontSize: 15)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(u.fullName,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(u.email,
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    if (u.department != null)
                      Text(u.department!.name,
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: u.status?.toLowerCase() == 'active'
                      ? const Color(0xFFF0FDF4) : const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: u.status?.toLowerCase() == 'active'
                        ? AppTheme.successColor.withValues(alpha: 0.3)
                        : AppTheme.warningColor.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  u.status?.toUpperCase() ?? 'ACTIVE',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: u.status?.toLowerCase() == 'active'
                        ? AppTheme.successColor : AppTheme.warningColor,
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
