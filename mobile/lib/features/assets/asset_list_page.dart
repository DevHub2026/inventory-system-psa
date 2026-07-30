import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/asset.dart';
import '../../data/services/asset_service.dart';
import '../../shared/widgets/psa_status_badge.dart';
import '../../shared/widgets/empty_state_widget.dart';
import 'asset_detail_page.dart';

class AssetListPage extends StatefulWidget {
  const AssetListPage({super.key});

  @override
  State<AssetListPage> createState() => _AssetListPageState();
}

class _AssetListPageState extends State<AssetListPage> {
  final AssetService _assetService = AssetService();
  final TextEditingController _searchController = TextEditingController();

  List<Asset> _assets = [];
  bool _isLoading = true;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _selectedStatus;

  static const _statusFilters = ['', 'AVAILABLE', 'BORROWED', 'MAINTENANCE', 'RESERVED'];
  static const _statusLabels = ['All', 'Available', 'Borrowed', 'Maintenance', 'Reserved'];

  @override
  void initState() {
    super.initState();
    _loadAssets();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAssets({bool refresh = false}) async {
    if (refresh) { _currentPage = 1; _hasMore = true; }
    if (!_hasMore && !refresh) return;

    setState(() { _isLoading = true; _errorMessage = null; });

    try {
      final result = await _assetService.getAssets(
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
        status: _selectedStatus?.isNotEmpty == true ? _selectedStatus : null,
        page: refresh ? 1 : _currentPage,
        perPage: 20,
      );
      setState(() {
        if (refresh) { _assets = result; } else { _assets.addAll(result); }
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
      appBar: AppBar(title: const Text('Assets')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
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
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
              ),
              onSubmitted: (_) => _loadAssets(refresh: true),
            ),
          ),
          // Status filter chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              separatorBuilder: (_, __) => const SizedBox(width: 8),
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
                    color: selected ? AppTheme.primaryColor : AppTheme.textSecondary,
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _assets.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _assets.length) {
            if (!_isLoading) _loadAssets();
            return const Padding(
              padding: EdgeInsets.all(16),
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
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => AssetDetailPage(assetId: asset.id)),
        ).then((_) => _loadAssets(refresh: true)),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.primaryPale,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.inventory_2_outlined,
                    size: 24, color: AppTheme.primaryColor),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(asset.name,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Text(asset.assetNumber,
                        style: const TextStyle(fontSize: 12, fontFamily: 'monospace',
                            color: AppTheme.textSecondary)),
                    if (asset.category != null)
                      Text(asset.category!.name,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              PsaStatusBadge(status: asset.status, fontSize: 10,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3)),
            ],
          ),
        ),
      ),
    );
  }
}