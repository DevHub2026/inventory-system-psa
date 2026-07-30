import '../data/models/user.dart';

/// Check if user has admin role - checks all roles in the list
bool isAdmin(User user) {
  if (user.roles == null || user.roles!.isEmpty) return false;
  return user.roles!.any((role) => 
    role.name.toLowerCase() == 'admin' || 
    role.name.toLowerCase() == 'administrator'
  );
}

/// Check if user has staff role - checks all roles in the list
bool isStaff(User user) {
  if (user.roles == null || user.roles!.isEmpty) return false;
  return user.roles!.any((role) => 
    role.name.toLowerCase() == 'staff' || 
    role.name.toLowerCase() == 'officer'
  );
}

/// Check if user has employee role - checks all roles in the list
bool isEmployee(User user) {
  if (user.roles == null || user.roles!.isEmpty) return false;
  return user.roles!.any((role) => 
    role.name.toLowerCase() == 'employee' || 
    role.name.toLowerCase() == 'user'
  );
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
