import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/asset.dart';
import '../../data/services/asset_service.dart';
import '../../shared/widgets/psa_status_badge.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/stat_card.dart';
import '../../utils/roleHelpers.dart';
import '../../data/models/user.dart';
import 'asset_detail_page.dart';

class AssetListPage extends StatefulWidget {
  final User? user;

  const AssetListPage({super.key, this.user});

  @override
  State<AssetListPage> createState() => _AssetListPageState();
}

class _AssetListPageState extends State<AssetListPage> {
  final AssetService _assetService = AssetService();
  final TextEditingController _searchController = TextEditingController();

  List<Asset> _assets = [];
  bool _isLoading = true;
  bool _loadingSummary = true;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _selectedStatus;

  // Summary stats
  int _totalAssets = 0;
  int _availableAssets = 0;
  int _borrowedAssets = 0;
  int _maintenanceAssets = 0;
  int _reservedAssets = 0;

  static const _statusFilters = ['', 'AVAILABLE', 'BORROWED', 'MAINTENANCE', 'RESERVED'];
  static const _statusLabels = ['All', 'Available', 'Borrowed', 'Maintenance', 'Reserved'];

  @override
  void initState() {
    super.initState();
    _loadAssets();
    _loadSummary();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadSummary() async {
    setState(() => _loadingSummary = true);
    try {
      final allAssets = await _assetService.getAssets(perPage: 9999);
      setState(() {
        _totalAssets = allAssets.length;
        _availableAssets = allAssets.where((a) => a.status == 'AVAILABLE').length;
        _borrowedAssets = allAssets.where((a) => a.status == 'BORROWED').length;
        _maintenanceAssets = allAssets.where((a) => a.status == 'MAINTENANCE').length;
        _reservedAssets = allAssets.where((a) => a.status == 'RESERVED').length;
        _loadingSummary = false;
      });
    } catch (e) {
      setState(() => _loadingSummary = false);
    }
  }

  Future<void> _loadAssets({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
    }
    if (!_hasMore && !refresh) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _assetService.getAssets(
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
        status: _selectedStatus?.isNotEmpty == true ? _selectedStatus : null,
        page: refresh ? 1 : _currentPage,
        perPage: 20,
      );
      setState(() {
        if (refresh) {
          _assets = result;
        } else {
          _assets.addAll(result);
        }
        _isLoading = false;
        _hasMore = result.length >= 20;
        _currentPage++;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Assets'),
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: Column(
        children: [
          // Summary cards
          if (!_loadingSummary && _totalAssets > 0)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.all(AppTheme.space4),
              child: Row(
                children: [
                  _buildSummaryCard(
                    'Total',
                    _totalAssets.toString(),
                    Icons.inventory_2_outlined,
                    AppTheme.primaryColor,
                    AppTheme.primaryPale,
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'Available',
                    _availableAssets.toString(),
                    Icons.check_circle_outline,
                    AppTheme.successColor,
                    const Color(0xFFDCFCE7),
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'Borrowed',
                    _borrowedAssets.toString(),
                    Icons.assignment_turned_in_outlined,
                    const Color(0xFF7C3AED),
                    const Color(0xFFEDE9FE),
                  ),
                  const SizedBox(width: AppTheme.space3),
                  _buildSummaryCard(
                    'Maintenance',
                    _maintenanceAssets.toString(),
                    Icons.build_outlined,
                    AppTheme.warningColor,
                    const Color(0xFFFEF3C7),
                  ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppTheme.space4,
              AppTheme.space2,
              AppTheme.space4,
              0,
            ),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by name, number…',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _loadAssets(refresh: true);
                        })
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.space3,
                  vertical: AppTheme.space2_5,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
              ),
              onChanged: (_) => setState(() {}),
              onSubmitted: (_) => _loadAssets(refresh: true),
            ),
          ),
          // Status filter chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(
                horizontal: AppTheme.space4,
                vertical: AppTheme.space2,
              ),
              separatorBuilder: (_, __) => const SizedBox(width: AppTheme.space2),
              itemCount: _statusFilters.length,
              itemBuilder: (_, i) {
                final selected = (_selectedStatus ?? '') == _statusFilters[i];
                return FilterChip(
                  label: Text(_statusLabels[i]),
                  selected: selected,
                  onSelected: (_) {
                    setState(() => _selectedStatus = _statusFilters[i]);
                    _loadAssets(refresh: true);
                  },
                  selectedColor: AppTheme.primaryColor.withValues(alpha: 0.12),
                  checkmarkColor: AppTheme.primaryColor,
                  labelStyle: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: selected
                        ? AppTheme.primaryColor
                        : AppTheme.textSecondary,
                  ),
                );
              },
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(
    String label,
    String value,
    IconData icon,
    Color color,
    Color bgColor,
  ) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.space3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: AppTheme.space1),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: color.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _assets.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_errorMessage != null && _assets.isEmpty) {
      return EmptyStateWidget(
        title: 'Error loading assets',
        message: _errorMessage,
        icon: Icons.error_outline,
        actionLabel: 'Retry',
        onRetry: () => _loadAssets(refresh: true),
      );
    }
    if (_assets.isEmpty) {
      return EmptyStateWidget(
        title: 'No assets found',
        message: _selectedStatus?.isNotEmpty == true
            ? 'No ${_selectedStatus!.toLowerCase()} assets match your search.'
            : 'Try adjusting your search criteria.',
        icon: Icons.inventory_2_outlined,
        onRetry: () => _loadAssets(refresh: true),
        actionLabel: 'Refresh',
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadAssets(refresh: true),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.space4,
          vertical: AppTheme.space3,
        ),
        itemCount: _assets.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _assets.length) {
            if (!_isLoading) _loadAssets();
            return const Padding(
              padding: EdgeInsets.all(AppTheme.space4),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          return _buildAssetCard(_assets[index]);
        },
      ),
    );
  }

  Widget _buildAssetCard(Asset asset) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.space3),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => AssetDetailPage(assetId: asset.id),
          ),
        ).then((_) => _loadAssets(refresh: true)),
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.space3),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.primaryPale,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                ),
                child: const Icon(
                  Icons.inventory_2_outlined,
                  size: 24,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(width: AppTheme.space3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      asset.name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      asset.assetNumber,
                      style: const TextStyle(
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    if (asset.category != null)
                      Text(
                        asset.category!.name,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textMuted,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: AppTheme.space2),
              PsaStatusBadge(
                status: asset.status,
                fontSize: 10,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.space2,
                  vertical: 3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}