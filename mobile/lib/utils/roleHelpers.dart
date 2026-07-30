import '../data/models/user.dart';

/// Check if user has admin role
bool isAdmin(User user) {
  return user.role?.toLowerCase() == 'admin' ||
      user.role?.toLowerCase() == 'administrator';
}

/// Check if user has staff role
bool isStaff(User user) {
  return user.role?.toLowerCase() == 'staff' ||
      user.role?.toLowerCase() == 'officer';
}

/// Check if user has employee role
bool isEmployee(User user) {
  return user.role?.toLowerCase() == 'employee' ||
      user.role?.toLowerCase() == 'user';
}

/// Get all user roles
List<String> getUserRoles(User user) {
  final roles = <String>[];
  if (isAdmin(user)) roles.add('admin');
  if (isStaff(user)) roles.add('staff');
  if (isEmployee(user)) roles.add('employee');
  return roles;
}

/// Check if user can approve borrow requests (Admin or Staff)
bool canApproveBorrows(User user) {
  return isAdmin(user) || isStaff(user);
}

/// Check if user can manage assets (Admin or Staff)
bool canManageAssets(User user) {
  return isAdmin(user) || isStaff(user);
}

/// Check if user can view reports (Admin or Staff)
bool canViewReports(User user) {
  return isAdmin(user) || isStaff(user);
}

/// Check if user can manage users (Admin only)
bool canManageUsers(User user) {
  return isAdmin(user);
}

/// Check if user can manage system settings (Admin only)
bool canManageSettings(User user) {
  return isAdmin(user);
}
