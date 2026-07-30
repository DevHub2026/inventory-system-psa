import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/models/asset.dart';
import '../../data/services/asset_service.dart';
import '../../shared/widgets/psa_status_badge.dart';
import '../../shared/widgets/info_row.dart';
import '../../shared/widgets/app_error.dart';

class AssetDetailPage extends StatefulWidget {
  final int assetId;
  const AssetDetailPage({super.key, required this.assetId});

  @override
  State<AssetDetailPage> createState() => _AssetDetailPageState();
}

class _AssetDetailPageState extends State<AssetDetailPage>
    with SingleTickerProviderStateMixin {
  final AssetService _assetService = AssetService();

  Asset? _asset;
  bool _loading = true;
  String? _error;
  bool _actionLoading = false;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final asset = await _assetService.getAsset(widget.assetId);
      setState(() { _asset = asset; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  Future<void> _borrow() async {
    final confirm = await _showConfirm(
      title: 'Borrow Asset',
      message: 'Do you want to borrow "${_asset!.name}"?',
      action: 'Borrow',
      color: AppTheme.primaryColor,
    );
    if (!confirm) return;
    setState(() => _actionLoading = true);
    try {
      await _assetService.borrowAsset(widget.assetId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Asset borrowed successfully.')));
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.errorColor,
        ));
      }
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<void> _return() async {
    final confirm = await _showConfirm(
      title: 'Return Asset',
      message: 'Do you want to return "${_asset!.name}"?',
      action: 'Return',
      color: AppTheme.successColor,
    );
    if (!confirm) return;
    setState(() => _actionLoading = true);
    try {
      await _assetService.returnAsset(widget.assetId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Asset returned successfully.')));
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.errorColor,
        ));
      }
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<bool> _showConfirm({
    required String title,
    required String message,
    required String action,
    required Color color,
  }) async {
    return await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            title: Text(title),
            content: Text(message),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                style: ElevatedButton.styleFrom(backgroundColor: color),
                child: Text(action),
              ),
            ],
          ),
        ) ??
        false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_asset?.name ?? 'Asset Details'),
        actions: [
          if (_asset != null)
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _load,
            ),
        ],
        bottom: _asset != null
            ? TabBar(
                controller: _tabController,
                indicatorColor: Colors.white,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white70,
                tabs: const [
                  Tab(text: 'Details'),
                  Tab(text: 'QR Code'),
                ],
              )
            : null,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? AppError(message: _error!, onRetry: _load)
              : Column(
                  children: [
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildDetailsTab(),
                          _buildQrTab(),
                        ],
                      ),
                    ),
                    _buildActionBar(),
                  ],
                ),
    );
  }

  Widget _buildDetailsTab() {
    final a = _asset!;
    return SingleChildScrollView(
      child: Column(
        children: [
          // Status header
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryPale,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.inventory_2_outlined, size: 28, color: AppTheme.primaryColor),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(a.name,
                          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary)),
                      const SizedBox(height: 4),
                      Text(a.assetNumber,
                          style: const TextStyle(fontSize: 12, fontFamily: 'monospace',
                              color: AppTheme.textSecondary)),
                    ],
                  ),
                ),
                PsaStatusBadge(status: a.status),
              ],
            ),
          ),
          const Divider(height: 1),
          // Info rows
          Card(
            margin: const EdgeInsets.all(16),
            child: Column(
              children: [
                InfoRow(label: 'Asset Number', value: a.assetNumber),
                InfoRow(label: 'Name', value: a.name),
                InfoRow(label: 'Category', value: a.category?.name),
                InfoRow(label: 'Model', value: a.model),
                InfoRow(label: 'Status', valueWidget: PsaStatusBadge(status: a.status)),
                InfoRow(label: 'Condition', value: a.conditionStatus),
                InfoRow(label: 'Office', value: a.office?.name),
                InfoRow(label: 'Location', value: a.location?.name),
                InfoRow(label: 'Purchase Date', value: DateFormatter.formatDate(a.purchaseDate)),
                InfoRow(label: 'Purchase Cost',
                    value: a.purchaseCost != null
                        ? '₱ ${a.purchaseCost!.toStringAsFixed(2)}'
                        : null),
                InfoRow(label: 'Warranty Until', value: DateFormatter.formatDate(a.warrantyUntil)),
                InfoRow(label: 'Description', value: a.description, divider: false),
              ],
            ),
          ),
          if (a.identifiers != null && a.identifiers!.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Card(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.fromLTRB(16, 14, 16, 8),
                      child: Text('Identifiers',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                              color: AppTheme.textSecondary)),
                    ),
                    const Divider(height: 1),
                    for (final id in a.identifiers!)
                      InfoRow(
                        label: id.identifierType.replaceAll('_', ' '),
                        value: id.identifierValue,
                        divider: a.identifiers!.last != id,
                      ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildQrTab() {
    final a = _asset!;
    // Find PSA QR identifier
    final psaQr = a.identifiers?.firstWhere(
      (id) => id.identifierType == 'PSA_QR',
      orElse: () => a.identifiers!.first,
    );
    final qrData = psaQr?.identifierValue ?? a.assetNumber;

    return SingleChildScrollView(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderColor),
                  boxShadow: const [BoxShadow(color: Color(0x10000000), blurRadius: 8)],
                ),
                child: QrImageView(
                  data: qrData,
                  version: QrVersions.auto,
                  size: 220,
                  backgroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              Text(a.name,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary),
                  textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(qrData,
                    style: const TextStyle(fontSize: 13, fontFamily: 'monospace',
                        color: AppTheme.textSecondary)),
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: qrData));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Copied to clipboard.')));
                },
                icon: const Icon(Icons.copy, size: 16),
                label: const Text('Copy Identifier'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionBar() {
    final a = _asset!;
    final status = a.status.toUpperCase();
    if (status != 'AVAILABLE' && status != 'BORROWED') return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppTheme.borderColor)),
      ),
      child: SafeArea(
        top: false,
        child: _actionLoading
            ? const Center(child: CircularProgressIndicator())
            : Row(
                children: [
                  if (status == 'AVAILABLE')
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _borrow,
                        icon: const Icon(Icons.archive_outlined, size: 18),
                        label: const Text('Borrow Asset'),
                      ),
                    ),
                  if (status == 'BORROWED')
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _return,
                        icon: const Icon(Icons.unarchive_outlined, size: 18),
                        label: const Text('Return Asset'),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.successColor),
                      ),
                    ),
                ],
              ),
      ),
    );
  }
}
