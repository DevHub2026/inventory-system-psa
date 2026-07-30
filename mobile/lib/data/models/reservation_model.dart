import 'user.dart';
import 'asset.dart';

class ReservationModel {
  final int id;
  final int userId;
  final String status;
  final String? remarks;
  final String? startDate;
  final String? endDate;
  final String? approvedAt;
  final int? approvedBy;
  final String? createdAt;
  final User? user;
  final User? approver;
  final List<ReservationItem> items;

  const ReservationModel({
    required this.id,
    required this.userId,
    required this.status,
    this.remarks,
    this.startDate,
    this.endDate,
    this.approvedAt,
    this.approvedBy,
    this.createdAt,
    this.user,
    this.approver,
    this.items = const [],
  });

  factory ReservationModel.fromJson(Map<String, dynamic> json) =>
      ReservationModel(
        id: json['id'] as int,
        userId: json['user_id'] as int? ?? 0,
        status: json['status'] as String? ?? '',
        remarks: json['remarks'] as String?,
        startDate: json['start_date'] as String?,
        endDate: json['end_date'] as String?,
        approvedAt: json['approved_at'] as String?,
        approvedBy: json['approved_by'] as int?,
        createdAt: json['created_at'] as String?,
        user: json['user'] != null
            ? User.fromJson(json['user'] as Map<String, dynamic>)
            : null,
        approver: json['approver'] != null
            ? User.fromJson(json['approver'] as Map<String, dynamic>)
            : null,
        items: (json['items'] as List<dynamic>? ?? [])
            .map((e) => ReservationItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class ReservationItem {
  final int id;
  final int reservationId;
  final int assetId;
  final String? status;
  final Asset? asset;

  const ReservationItem({
    required this.id,
    required this.reservationId,
    required this.assetId,
    this.status,
    this.asset,
  });

  factory ReservationItem.fromJson(Map<String, dynamic> json) =>
      ReservationItem(
        id: json['id'] as int,
        reservationId: json['reservation_id'] as int? ?? 0,
        assetId: json['asset_id'] as int? ?? 0,
        status: json['status'] as String?,
        asset: json['asset'] != null
            ? Asset.fromJson(json['asset'] as Map<String, dynamic>)
            : null,
      );
}
