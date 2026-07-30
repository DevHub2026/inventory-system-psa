class Asset {
  final int id;
  final String assetNumber;
  final String name;
  final String? description;
  final String? model;
  final String status;
  final String? conditionStatus;
  final String? purchaseDate;
  final double? purchaseCost;
  final String? warrantyUntil;
  final AssetCategory? category;
  final AssetOffice? office;
  final AssetLocation? location;
  final List<AssetIdentifier>? identifiers;

  Asset({
    required this.id,
    required this.assetNumber,
    required this.name,
    this.description,
    this.model,
    required this.status,
    this.conditionStatus,
    this.purchaseDate,
    this.purchaseCost,
    this.warrantyUntil,
    this.category,
    this.office,
    this.location,
    this.identifiers,
  });

  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  factory Asset.fromJson(Map<String, dynamic> json) {
    return Asset(
      id: json['id'] as int,
      assetNumber: json['asset_number'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      model: json['model'] as String?,
      status: json['status'] as String,
      conditionStatus: json['condition_status'] as String?,
      purchaseDate: json['purchase_date'] as String?,
      purchaseCost: _parseDouble(json['purchase_cost']),
      warrantyUntil: json['warranty_until'] as String?,
      category: json['category'] != null 
          ? AssetCategory.fromJson(json['category'] as Map<String, dynamic>) 
          : null,
      office: json['office'] != null 
          ? AssetOffice.fromJson(json['office'] as Map<String, dynamic>) 
          : null,
      location: json['location'] != null 
          ? AssetLocation.fromJson(json['location'] as Map<String, dynamic>) 
          : null,
      identifiers: (json['identifiers'] as List<dynamic>?)
          ?.map((e) => AssetIdentifier.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'asset_number': assetNumber,
      'name': name,
      'description': description,
      'model': model,
      'status': status,
      'condition_status': conditionStatus,
      'purchase_date': purchaseDate,
      'purchase_cost': purchaseCost,
      'warranty_until': warrantyUntil,
      'category': category?.toJson(),
      'office': office?.toJson(),
      'location': location?.toJson(),
      'identifiers': identifiers?.map((e) => e.toJson()).toList(),
    };
  }
}

class AssetCategory {
  final int id;
  final String name;

  AssetCategory({
    required this.id,
    required this.name,
  });

  factory AssetCategory.fromJson(Map<String, dynamic> json) {
    return AssetCategory(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}

class AssetLocation {
  final int id;
  final String name;

  AssetLocation({
    required this.id,
    required this.name,
  });

  factory AssetLocation.fromJson(Map<String, dynamic> json) {
    return AssetLocation(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}

class AssetOffice {
  final int id;
  final String name;

  AssetOffice({
    required this.id,
    required this.name,
  });

  factory AssetOffice.fromJson(Map<String, dynamic> json) {
    return AssetOffice(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}

class AssetIdentifier {
  final int id;
  final String identifierType;
  final String identifierValue;

  AssetIdentifier({
    required this.id,
    required this.identifierType,
    required this.identifierValue,
  });

  factory AssetIdentifier.fromJson(Map<String, dynamic> json) {
    return AssetIdentifier(
      id: json['id'] as int,
      identifierType: json['identifier_type'] as String,
      identifierValue: json['identifier_value'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'identifier_type': identifierType,
      'identifier_value': identifierValue,
    };
  }
}
