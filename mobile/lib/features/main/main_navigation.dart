import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/user.dart';
import '../../data/services/notification_service.dart';
import '../dashboard/dashboard_page.dart';
import '../assets/asset_list_page.dart';
import '../borrowing/borrowing_page.dart';
import '../qr_scanner/qr_scanner_page.dart';
import '../profile/profile_page.dart';
import '../auth/auth_bloc.dart';
import '../auth/auth_state.dart';

class MainNavigation extends StatefulWidget {
  final User user;
  const MainNavigation({super.key, required this.user});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;
  int _unreadCount = 0;
  final NotificationService _notifService = NotificationService();

  late final List<_NavItem> _navItems;

  @override
  void initState() {
    super.initState();
    _navItems = [
      _NavItem(
        label: 'Dashboard',
        icon: Icons.dashboard_outlined,
        activeIcon: Icons.dashboard,
        builder: () => DashboardPage(user: widget.user, onNavigate: _navigateTo),
      ),
      _NavItem(
        label: 'Assets',
        icon: Icons.inventory_2_outlined,
        activeIcon: Icons.inventory_2,
        builder: () => const AssetListPage(),
      ),
      _NavItem(
        label: 'Scan',
        icon: Icons.qr_code_scanner_outlined,
        activeIcon: Icons.qr_code_scanner,
        builder: () => const QrScannerPage(),
      ),
      _NavItem(
        label: 'Borrowings',
        icon: Icons.assignment_outlined,
        activeIcon: Icons.assignment,
        builder: () => const BorrowingPage(),
      ),
      _NavItem(
        label: 'Profile',
        icon: Icons.person_outline,
        activeIcon: Icons.person,
        builder: () => ProfilePage(user: widget.user),
      ),
    ];
    _loadUnread();
  }

  void _navigateTo(int index) {
    if (index >= 0 && index < _navItems.length) {
      setState(() => _currentIndex = index);
    }
  }

  Future<void> _loadUnread() async {
    try {
      final count = await _notifService.getUnreadCount();
      if (mounted) setState(() => _unreadCount = count);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    // Listen for auth state — if unauthenticated, nothing to do (main.dart handles rebuild)
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        // handled by main.dart BlocBuilder
      },
      child: Scaffold(
        body: IndexedStack(
          index: _currentIndex,
          children: _navItems.map((item) => item.builder()).toList(),
        ),
        bottomNavigationBar: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: AppTheme.borderColor)),
            boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, -2))],
          ),
          child: SafeArea(
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: (i) {
                setState(() => _currentIndex = i);
                if (i == 4) _loadUnread(); // refresh on profile tab
              },
              items: [
                for (final item in _navItems)
                  BottomNavigationBarItem(
                    icon: _buildNavIcon(item, _navItems.indexOf(item), active: false),
                    activeIcon: _buildNavIcon(item, _navItems.indexOf(item), active: true),
                    label: item.label,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavIcon(_NavItem item, int index, {required bool active}) {
    final icon = active ? item.activeIcon : item.icon;
    // Show badge on Profile tab if there are unread notifications
    if (index == 4 && _unreadCount > 0) {
      return Badge(
        label: Text(_unreadCount > 9 ? '9+' : '$_unreadCount',
            style: const TextStyle(fontSize: 10)),
        child: Icon(icon, size: 22),
      );
    }
    return Icon(icon, size: 22);
  }
}

class _NavItem {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  final Widget Function() builder;
  const _NavItem({
    required this.label,
    required this.icon,
    required this.activeIcon,
    required this.builder,
  });
}
