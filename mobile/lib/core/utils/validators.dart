class Validators {
  Validators._();

  static String? required(String? value, [String field = 'This field']) {
    if (value == null || value.trim().isEmpty) return '$field is required.';
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) return 'Email is required.';
    final re = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!re.hasMatch(value.trim())) return 'Please enter a valid email address.';
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'Password is required.';
    if (value.length < 8) return 'Password must be at least 8 characters.';
    if (!value.contains(RegExp(r'[a-zA-Z]'))) return 'Password must contain at least one letter.';
    if (!value.contains(RegExp(r'\d'))) return 'Password must contain at least one number.';
    return null;
  }

  static String? confirmPassword(String? value, String original) {
    if (value == null || value.isEmpty) return 'Please confirm your password.';
    if (value != original) return 'Passwords do not match.';
    return null;
  }

  static String? minLength(String? value, int min, [String field = 'This field']) {
    if (value == null || value.trim().length < min) return '$field must be at least $min characters.';
    return null;
  }
}
