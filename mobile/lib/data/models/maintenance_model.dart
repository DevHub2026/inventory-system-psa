import 'asset.dart';
import 'user.dart';

class MaintenanceModel {
  final int id;
  final int assetId;
  final String? type;
  final String status;
  final String? description;
  final String? scheduledDate;
  final String? completedAt;
  final int? performedBy;
  final String? createdAt;
  final Asset? asset;
  final User? technician;

  const MaintenanceModel({
    required this.id,
    required this.assetId,
    this.type,
    required this.status,
    this.description,
    this.scheduledDate,
    this.completedAt,
    this.performedBy,
    this.createdAt,
    this.asset,
    this.technician,
  });

  factory MaintenanceModel.fromJson(Map<String, dynamic> json) =>
      MaintenanceModel(
        id: json['id'] as int,
        assetId: json['asset_id'] as int? ?? 0,
        type: json['type'] as String?,
        status: json['status'] as String? ?? '',
        description: json['description'] as String?,
        scheduledDate: json['scheduled_date'] as String?,
        completedAt: json['completed_at'] as String?,
        performedBy: json['performed_by'] as int?,
        createdAt: json['created_at'] as String?,
        asset: json['asset'] != null
            ? Asset.fromJson(json['asset'] as Map<String, dynamic>)
            : null,
        technician: json['technician'] != null
            ? User.fromJson(json['technician'] as Map<String, dynamic>)
            : null,
      );
}
