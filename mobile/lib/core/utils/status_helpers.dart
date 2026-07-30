import 'package:flutter/material.dart';

/// Mirrors the web app's borrowingStatusTone / borrowingStatusLabel utilities.
class StatusHelpers {
  StatusHelpers._();

  // ── Borrowing status ──────────────────────────────────────────────────────
  static Color borrowingColor(String? status) => switch (status?.toUpperCase()) {
    'BORROWED'   => const Color(0xFF1D4ED8),
    'RETURNED'   => const Color(0xFF16A34A),
    'OVERDUE'    => const Color(0xFFDC2626),
    'PENDING'    => const Color(0xFFD97706),
    'APPROVED'   => const Color(0xFF0F766E),
    'REJECTED'   => const Color(0xFF9CA3AF),
    _            => const Color(0xFF6B7280),
  };

  static String borrowingLabel(String? status) => switch (status?.toUpperCase()) {
    'BORROWED'   => 'Borrowed',
    'RETURNED'   => 'Returned',
    'OVERDUE'    => 'Overdue',
    'PENDING'    => 'Pending',
    'APPROVED'   => 'Approved',
    'REJECTED'   => 'Rejected',
    _            => status ?? '—',
  };

  // ── Asset status ──────────────────────────────────────────────────────────
  static Color assetColor(String? status) => switch (status?.toUpperCase()) {
    'AVAILABLE'    => const Color(0xFF16A34A),
    'BORROWED'     => const Color(0xFF1D4ED8),
    'MAINTENANCE'  => const Color(0xFFD97706),
    'RESERVED'     => const Color(0xFF7C3AED),
    'DISPOSED'     => const Color(0xFF9CA3AF),
    _              => const Color(0xFF6B7280),
  };

  static String assetLabel(String? status) => switch (status?.toUpperCase()) {
    'AVAILABLE'    => 'Available',
    'BORROWED'     => 'Borrowed',
    'MAINTENANCE'  => 'Under Maintenance',
    'RESERVED'     => 'Reserved',
    'DISPOSED'     => 'Disposed',
    _              => status ?? '—',
  };

  // ── Reservation status ────────────────────────────────────────────────────
  static Color reservationColor(String? status) => switch (status?.toUpperCase()) {
    'PENDING'    => const Color(0xFFD97706),
    'APPROVED'   => const Color(0xFF0F766E),
    'REJECTED'   => const Color(0xFFDC2626),
    'CANCELLED'  => const Color(0xFF9CA3AF),
    _            => const Color(0xFF6B7280),
  };

  static String reservationLabel(String? status) => switch (status?.toUpperCase()) {
    'PENDING'    => 'Pending',
    'APPROVED'   => 'Approved',
    'REJECTED'   => 'Rejected',
    'CANCELLED'  => 'Cancelled',
    _            => status ?? '—',
  };

  // ── Inventory status ──────────────────────────────────────────────────────
  static Color inventoryColor(String? status) => switch (status?.toUpperCase()) {
    'IN_STOCK'    => const Color(0xFF16A34A),
    'LOW_STOCK'   => const Color(0xFFD97706),
    'OUT_OF_STOCK'=> const Color(0xFFDC2626),
    _             => const Color(0xFF6B7280),
  };

  static String inventoryLabel(String? status) => switch (status?.toUpperCase()) {
    'IN_STOCK'    => 'In Stock',
    'LOW_STOCK'   => 'Low Stock',
    'OUT_OF_STOCK'=> 'Out of Stock',
    _             => status ?? '—',
  };
}
