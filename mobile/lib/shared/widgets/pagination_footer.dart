import 'package:flutter/material.dart';

class PaginationFooter extends StatelessWidget {
  final int currentPage;
  final int lastPage;
  final int total;
  final bool loading;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  const PaginationFooter({
    super.key,
    required this.currentPage,
    required this.lastPage,
    required this.total,
    this.loading = false,
    this.onPrevious,
    this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '$total result${total == 1 ? '' : 's'}',
            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
          ),
          if (lastPage > 1)
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: (currentPage > 1 && !loading) ? onPrevious : null,
                  iconSize: 22,
                ),
                Text(
                  '$currentPage / $lastPage',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: (currentPage < lastPage && !loading) ? onNext : null,
                  iconSize: 22,
                ),
              ],
            ),
        ],
      ),
    );
  }
}
