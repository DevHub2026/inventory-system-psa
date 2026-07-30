import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/app_constants.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _urlController = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadSavedUrl();
  }

  Future<void> _loadSavedUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(AppConstants.keyBaseUrl) ?? AppConstants.baseUrl;
    _urlController.text = saved;
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _saveUrl() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;
    setState(() => _saving = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.keyBaseUrl, url);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Server URL saved. Restart the app to apply.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Server Configuration',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                    color: AppTheme.textSecondary, letterSpacing: 0.4)),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('API Base URL',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary)),
                    const SizedBox(height: 6),
                    const Text(
                      'Enter your PSA server address. '
                      'For Chrome/Web: use http://localhost:8000/api/v1 or your LAN IP. '
                      'For Android emulator: 10.0.2.2 (default). '
                      'For physical device: use your PC\'s LAN IP (e.g., 192.168.1.100:8000/api/v1).',
                      style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _urlController,
                      keyboardType: TextInputType.url,
                      decoration: const InputDecoration(
                        hintText: 'http://localhost:8000/api/v1 (or 10.0.2.2 for emulator)',
                        prefixIcon: Icon(Icons.link, size: 18),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _saveUrl,
                        child: _saving
                            ? const SizedBox(height: 18, width: 18,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : const Text('Save URL'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text('About',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                    color: AppTheme.textSecondary, letterSpacing: 0.4)),
            const SizedBox(height: 12),
            Card(
              child: Column(
                children: [
                  _row(Icons.info_outline, 'Version', '1.0.0'),
                  const Divider(height: 1, indent: 56),
                  _row(Icons.business_outlined, 'Organization',
                      'Philippine Statistics Authority'),
                  const Divider(height: 1, indent: 56),
                  _row(Icons.inventory_2_outlined, 'System',
                      'PSA Inventory Management System'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(children: [
        Icon(icon, size: 20, color: AppTheme.textMuted),
        const SizedBox(width: 14),
        Expanded(child: Text(label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500,
                color: AppTheme.textPrimary))),
        Text(value, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
      ]),
    );
  }
}
