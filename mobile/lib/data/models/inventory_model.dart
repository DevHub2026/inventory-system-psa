class InventoryModel {
  final int id;
  final String name;
  final String? sku;
  final String? description;
  final int quantity;
  final int? reorderLevel;
  final String? unit;
  final String? status;
  final String? category;
  final String? location;
  final String? createdAt;

  const InventoryModel({
    required this.id,
    required this.name,
    this.sku,
    this.description,
    required this.quantity,
    this.reorderLevel,
    this.unit,
    this.status,
    this.category,
    this.location,
    this.createdAt,
  });

  factory InventoryModel.fromJson(Map<String, dynamic> json) =>
      InventoryModel(
        id: json['id'] as int,
        name: json['name'] as String? ?? '',
        sku: json['sku'] as String?,
        description: json['description'] as String?,
        quantity: json['quantity'] as int? ?? 0,
        reorderLevel: json['reorder_level'] as int?,
        unit: json['unit'] as String?,
        status: json['status'] as String?,
        category: json['category'] as String?,
        location: json['location'] as String?,
        createdAt: json['created_at'] as String?,
      );
}
