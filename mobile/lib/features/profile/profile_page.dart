import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/string_utils.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/models/user.dart';
import '../../data/services/user_service.dart';
import '../auth/auth_bloc.dart';
import '../auth/auth_event.dart';
import '../notifications/notifications_page.dart';
import 'edit_profile_page.dart';
import 'change_password_page.dart';

class ProfilePage extends StatefulWidget {
  final User user;
  const ProfilePage({super.key, required this.user});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final UserService _userService = UserService();
  Map<String, dynamic>? _profileData;
  bool _loading = true;
  // ignore: unused_field
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _userService.getUserProfile(widget.user.id);
      setState(() { _profileData = data; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  void _logout() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<AuthBloc>().add(const AuthLogoutRequested());
            },
            style: TextButton.styleFrom(foregroundColor: AppTheme.errorColor),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const NotificationsPage()),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadProfile,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadProfile,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _buildHeader(),
              const SizedBox(height: 16),
              if (!_loading && _profileData != null) ...[
                _buildStats(),
                const SizedBox(height: 16),
              ],
              _buildInfoSection(),
              const SizedBox(height: 16),
              _buildActions(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final u = widget.user;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.psaYellow,
              boxShadow: [BoxShadow(
                  color: AppTheme.psaYellow.withValues(alpha: 0.4),
                  blurRadius: 12, spreadRadius: 2)],
            ),
            child: Center(
              child: Text(
                StringUtils.getInitials(u.fullName),
                style: const TextStyle(
                  color: AppTheme.primaryColor,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(u.fullName,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary)),
                const SizedBox(height: 4),
                if (u.employeeNumber != null)
                  Text('ID: ${u.employeeNumber}',
                      style: const TextStyle(fontSize: 12, fontFamily: 'monospace',
                          color: AppTheme.textSecondary)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
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
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: u.status?.toLowerCase() == 'active'
                          ? AppTheme.successColor : AppTheme.warningColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStats() {
    final stats = _profileData!['stats'] as Map<String, dynamic>? ?? {};
    return Row(
      children: [
        _statChip('Borrowed', '${stats['currently_borrowed'] ?? 0}', AppTheme.primaryColor),
        const SizedBox(width: 8),
        _statChip('Total', '${stats['total_borrowed'] ?? 0}', const Color(0xFF0F766E)),
        const SizedBox(width: 8),
        _statChip('Returned', '${stats['returned'] ?? 0}', AppTheme.successColor),
        const SizedBox(width: 8),
        _statChip('Overdue', '${stats['overdue'] ?? 0}', AppTheme.errorColor),
      ],
    );
  }

  Widget _statChip(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Text(value,
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600,
                    color: color.withValues(alpha: 0.8))),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection() {
    final u = widget.user;
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Text('Account Information',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                    color: AppTheme.textSecondary)),
          ),
          const Divider(height: 1),
          _row('Full Name', u.fullName),
          _row('Employee ID', u.employeeNumber),
          _row('Username', u.username),
          _row('Email', u.email),
          _row('Department', u.department?.name),
          _row('Office', u.office?.name),
          if (u.roles != null && u.roles!.isNotEmpty)
            _row('Role', u.roles!.map((r) => r.name).join(', ')),
          _row('Member Since', DateFormatter.formatDate(u.createdAt), last: true),
        ],
      ),
    );
  }

  Widget _row(String label, String? value, {bool last = false}) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              SizedBox(
                width: 110,
                child: Text(label,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                        color: AppTheme.textMuted, letterSpacing: 0.3)),
              ),
              Expanded(
                child: Text(
                  value?.isNotEmpty == true ? value! : '—',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500,
                      color: AppTheme.textPrimary),
                ),
              ),
            ],
          ),
        ),
        if (!last) const Divider(height: 1, indent: 16, endIndent: 16),
      ],
    );
  }

  Widget _buildActions() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        children: [
          _actionTile(
            icon: Icons.edit_outlined,
            label: 'Edit Profile',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => EditProfilePage(user: widget.user)),
            ).then((_) => _loadProfile()),
          ),
          const Divider(height: 1, indent: 56),
          _actionTile(
            icon: Icons.lock_outline,
            label: 'Change Password',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ChangePasswordPage()),
            ),
          ),
          const Divider(height: 1, indent: 56),
          _actionTile(
            icon: Icons.notifications_outlined,
            label: 'Notifications',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const NotificationsPage()),
            ),
          ),
          const Divider(height: 1, indent: 56),
          _actionTile(
            icon: Icons.logout,
            label: 'Sign Out',
            color: AppTheme.errorColor,
            onTap: _logout,
          ),
        ],
      ),
    );
  }

  Widget _actionTile({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) {
    final c = color ?? AppTheme.textPrimary;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.radiusXl),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: c.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: c),
            ),
            const SizedBox(width: 14),
            Expanded(child: Text(label,
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c))),
            Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
          ],
        ),
      ),
    );
  }
}
