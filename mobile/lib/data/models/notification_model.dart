class NotificationModel {
  final int id;
  final int? userId;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final String? readAt;
  final int? relatedId;
  final String? relatedType;
  final Map<String, dynamic>? data;
  final String? link;
  final String createdAt;

  const NotificationModel({
    required this.id,
    this.userId,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    this.readAt,
    this.relatedId,
    this.relatedType,
    this.data,
    this.link,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) =>
      NotificationModel(
        id: json['id'] as int,
        userId: json['user_id'] as int?,
        title: json['title'] as String? ?? '',
        message: json['message'] as String? ?? '',
        type: json['type'] as String? ?? '',
        isRead: json['is_read'] as bool? ?? false,
        readAt: json['read_at'] as String?,
        relatedId: json['related_id'] as int?,
        relatedType: json['related_type'] as String?,
        data: json['data'] as Map<String, dynamic>?,
        link: json['link'] as String?,
        createdAt: json['created_at'] as String? ?? '',
      );
}
