import 'asset.dart';
import 'user.dart';

class Borrowing {
  final int id;
  final int userId;
  final int assetId;
  final String? borrowDate;
  final String? borrowedAt;
  final String? dueDate;
  final String? returnedAt;
  final String status;
  final String? remarks;
  final int? authorizedBy;
  final String? authorizedAt;
  final User? user;
  final Asset? asset;
  final User? authorizer;

  Borrowing({
    required this.id,
    required this.userId,
    required this.assetId,
    this.borrowDate,
    this.borrowedAt,
    this.dueDate,
    this.returnedAt,
    required this.status,
    this.remarks,
    this.authorizedBy,
    this.authorizedAt,
    this.user,
    this.asset,
    this.authorizer,
  });

  factory Borrowing.fromJson(Map<String, dynamic> json) {
    return Borrowing(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      assetId: json['asset_id'] as int,
      borrowDate: json['borrow_date'] as String?,
      borrowedAt: json['borrowed_at'] as String?,
      dueDate: json['due_date'] as String?,
      returnedAt: json['returned_at'] as String?,
      status: json['status'] as String,
      remarks: json['remarks'] as String?,
      authorizedBy: json['authorized_by'] as int?,
      authorizedAt: json['authorized_at'] as String?,
      user: json['user'] != null 
          ? User.fromJson(json['user'] as Map<String, dynamic>) 
          : null,
      asset: json['asset'] != null 
          ? Asset.fromJson(json['asset'] as Map<String, dynamic>) 
          : null,
      authorizer: json['authorizer'] != null 
          ? User.fromJson(json['authorizer'] as Map<String, dynamic>) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'asset_id': assetId,
      'borrow_date': borrowDate,
      'borrowed_at': borrowedAt,
      'due_date': dueDate,
      'returned_at': returnedAt,
      'status': status,
      'remarks': remarks,
      'authorized_by': authorizedBy,
      'authorized_at': authorizedAt,
      'user': user?.toJson(),
      'asset': asset?.toJson(),
      'authorizer': authorizer?.toJson(),
    };
  }
}

class PaginatedBorrowings {
  final List<Borrowing> items;
  final PaginationMeta meta;

  PaginatedBorrowings({
    required this.items,
    required this.meta,
  });

  factory PaginatedBorrowings.fromJson(Map<String, dynamic> json) {
    return PaginatedBorrowings(
      items: (json['items'] as List<dynamic>?)
          ?.map((e) => Borrowing.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      meta: PaginationMeta.fromJson(json['meta'] as Map<String, dynamic>?),
    );
  }
}

class PaginationMeta {
  final int currentPage;
  final int perPage;
  final int total;
  final int lastPage;

  PaginationMeta({
    required this.currentPage,
    required this.perPage,
    required this.total,
    required this.lastPage,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic>? json) {
    return PaginationMeta(
      currentPage: json?['current_page'] as int? ?? 1,
      perPage: json?['per_page'] as int? ?? 20,
      total: json?['total'] as int? ?? 0,
      lastPage: json?['last_page'] as int? ?? 1,
    );
  }
}
