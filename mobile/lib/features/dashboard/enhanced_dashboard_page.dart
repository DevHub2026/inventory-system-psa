import 'package:flutter/material.dart';
import '../../data/models/user.dart';
import '../../utils/roleHelpers.dart';
import 'admin_dashboard.dart';
import 'staff_dashboard.dart';
import 'employee_dashboard.dart';

/// Dashboard Page - Routes to role-specific dashboard
class EnhancedDashboardPage extends StatelessWidget {
  final User user;
  final void Function(int index)? onNavigate;

  const EnhancedDashboardPage({
    super.key,
    required this.user,
    this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    // Check user role and display appropriate dashboard
    if (isAdmin(user)) {
      return AdminDashboard(user: user, onNavigate: onNavigate);
    } else if (isStaff(user)) {
      return StaffDashboard(user: user, onNavigate: onNavigate);
    } else {
      // Default to Employee dashboard
      return EmployeeDashboard(user: user, onNavigate: onNavigate);
    }
  }
}

