import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/validators.dart';
import '../../data/services/user_service.dart';

class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final UserService _userService = UserService();
  final _current  = TextEditingController();
  final _new      = TextEditingController();
  final _confirm  = TextEditingController();
  bool _loading   = false;
  bool _showCurrent = false;
  bool _showNew     = false;
  bool _showConfirm = false;
  String? _error;

  @override
  void dispose() {
    _current.dispose();
    _new.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      await _userService.changePassword(
        currentPassword: _current.text,
        newPassword: _new.text,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Password changed successfully.')));
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Change Password')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppTheme.primaryPale,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.lock_outline, size: 28, color: AppTheme.primaryColor),
              ),
              const SizedBox(height: 16),
              const Text('Change your password',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800,
                      color: AppTheme.textPrimary)),
              const SizedBox(height: 6),
              const Text('Use a strong password with at least 8 characters, including letters and numbers.',
                  style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
              const SizedBox(height: 28),
              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.errorColor.withValues(alpha: 0.3)),
                  ),
                  child: Row(children: [
                    const Icon(Icons.error_outline, color: AppTheme.errorColor, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_error!,
                        style: const TextStyle(color: AppTheme.errorColor, fontSize: 13))),
                  ]),
                ),
                const SizedBox(height: 16),
              ],
              _passwordField(
                controller: _current,
                label: 'Current Password',
                show: _showCurrent,
                onToggle: () => setState(() => _showCurrent = !_showCurrent),
                validator: (v) => (v == null || v.isEmpty) ? 'Current password is required.' : null,
              ),
              const SizedBox(height: 14),
              _passwordField(
                controller: _new,
                label: 'New Password',
                show: _showNew,
                onToggle: () => setState(() => _showNew = !_showNew),
                validator: Validators.password,
              ),
              const SizedBox(height: 14),
              _passwordField(
                controller: _confirm,
                label: 'Confirm New Password',
                show: _showConfirm,
                onToggle: () => setState(() => _showConfirm = !_showConfirm),
                validator: (v) => Validators.confirmPassword(v, _new.text),
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Change Password'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _passwordField({
    required TextEditingController controller,
    required String label,
    required bool show,
    required VoidCallback onToggle,
    required String? Function(String?) validator,
    TextInputAction textInputAction = TextInputAction.next,
    void Function(String)? onSubmitted,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: !show,
      textInputAction: textInputAction,
      onFieldSubmitted: onSubmitted,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.lock_outline),
        suffixIcon: IconButton(
          icon: Icon(show ? Icons.visibility_off_outlined : Icons.visibility_outlined,
              size: 20),
          onPressed: onToggle,
        ),
      ),
    );
  }
}
