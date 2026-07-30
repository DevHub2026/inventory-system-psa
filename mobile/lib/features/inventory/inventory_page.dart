import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/status_helpers.dart';
import '../../data/models/inventory_model.dart';
import '../../data/services/inventory_service.dart';
import '../../shared/widgets/app_empty.dart';
import '../../shared/widgets/app_error.dart';
import '../../shared/widgets/psa_badge.dart';

class InventoryPage extends StatefulWidget {
  const InventoryPage({super.key});

  @override
  State<InventoryPage> createState() => _InventoryPageState();
}

class _InventoryPageState extends State<InventoryPage> {
  final InventoryService _service = InventoryService();
  final _searchController = TextEditingController();
  List<InventoryModel> _items = [];
  bool _loading = true;
  String? _error;
  int _page = 1;
  bool _hasMore = true;
  String? _statusFilter;

  static const _filters = ['', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'];
  static const _filterLabels = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

  @override
  void initState() {
    super.initState();
    _load(refresh: true);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load({bool refresh = false}) async {
    if (refresh) { _page = 1; _hasMore = true; }
    if (!_hasMore && !refresh) return;
    setState(() { _loading = true; _error = null; });
    try {
      final result = await _service.getInventory(
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
        status: _statusFilter,
        page: _page,
        perPage: 20,
      );
      setState(() {
        if (refresh) { _items = result; } else { _items.addAll(result); }
        _hasMore = result.length >= 20;
        _page++;
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inventory')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search inventory…',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () { _searchController.clear(); _load(refresh: true); })
                    : null,
                filled: true, fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppTheme.borderColor)),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppTheme.borderColor)),
              ),
              onSubmitted: (_) => _load(refresh: true),
            ),
          ),
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemCount: _filters.length,
              itemBuilder: (_, i) {
                final selected = (_statusFilter ?? '') == _filters[i];
                return FilterChip(
                  label: Text(_filterLabels[i]),
                  selected: selected,
                  onSelected: (_) { setState(() => _statusFilter = _filters[i]); _load(refresh: true); },
                  selectedColor: AppTheme.primaryColor.withValues(alpha: 0.12),
                  checkmarkColor: AppTheme.primaryColor,
                  labelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                      color: selected ? AppTheme.primaryColor : AppTheme.textSecondary),
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
    if (_loading && _items.isEmpty) return const Center(child: CircularProgressIndicator());
    if (_error != null && _items.isEmpty) return AppError(message: _error!, onRetry: () => _load(refresh: true));
    if (_items.isEmpty) return const AppEmpty(title: 'No inventory items', icon: Icons.inventory_2_outlined);

    return RefreshIndicator(
      onRefresh: () => _load(refresh: true),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _items.length + (_hasMore ? 1 : 0),
        itemBuilder: (_, i) {
          if (i == _items.length) {
            if (!_loading) _load();
            return const Padding(padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()));
          }
          return _card(_items[i]);
        },
      ),
    );
  }

  Widget _card(InventoryModel item) {
    final statusColor = StatusHelpers.inventoryColor(item.status);
    final statusLabel = StatusHelpers.inventoryLabel(item.status);
    final isLow = item.reorderLevel != null && item.quantity <= item.reorderLevel!;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.category_outlined, size: 24, color: statusColor),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.name,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 3),
                  Row(children: [
                    const Text('Qty: ', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                    Text('${item.quantity}',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                            color: isLow ? AppTheme.errorColor : AppTheme.textPrimary)),
                    if (item.unit != null)
                      Text(' ${item.unit}',
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    if (item.reorderLevel != null) ...[
                      const SizedBox(width: 8),
                      Text('(min: ${item.reorderLevel})',
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    ],
                  ]),
                  if (item.sku != null)
                    Text('SKU: ${item.sku}',
                        style: const TextStyle(fontSize: 11, fontFamily: 'monospace',
                            color: AppTheme.textMuted)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            PsaBadge(label: statusLabel, color: statusColor, fontSize: 10),
          ],
        ),
      ),
    );
  }
}
