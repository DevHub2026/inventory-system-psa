import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/asset.dart';
import '../../data/models/borrowing.dart';
import '../../data/services/asset_service.dart';
import '../../shared/widgets/psa_status_badge.dart';

class QrScannerPage extends StatefulWidget {
  const QrScannerPage({super.key});

  @override
  State<QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends State<QrScannerPage> with WidgetsBindingObserver {
  final AssetService _assetService = AssetService();
  MobileScannerController? _controller;

  bool _scanning = false;
  bool _processing = false;
  bool _torchOn = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_controller == null) return;
    
    if (state == AppLifecycleState.paused) {
      _controller!.stop();
    } else if (state == AppLifecycleState.resumed && _scanning && !_processing) {
      _controller!.start();
    }
  }

  void _startScanning() {
    _controller = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
      formats: const [BarcodeFormat.qrCode, BarcodeFormat.code128, BarcodeFormat.code39],
    );
    
    setState(() {
      _scanning = true;
      _processing = false;
    });
    _controller!.start();
  }

  void _onDetect(BarcodeCapture capture) {
    if (!_scanning || _processing || capture.barcodes.isEmpty) return;
    final value = capture.barcodes.first.rawValue;
    if (value == null || value.isEmpty) return;
    _handleScan(value);
  }

  Future<void> _handleScan(String code) async {
    setState(() { _scanning = false; _processing = true; });
    await _controller?.stop();

    try {
      final result = await _assetService.scanAsset(code);
      if (mounted) {
        await _showScanResult(result, code);
      }
    } catch (e) {
      if (mounted) {
        await _showError(e.toString().replaceAll('Exception: ', ''), code);
      }
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<void> _showScanResult(Borrowing result, String code) async {
    final asset = result.asset;
    if (asset == null) {
      await _showError('Asset not found for code: $code', code);
      return;
    }

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _ScanResultSheet(
        asset: asset,
        borrowing: result,
        assetService: _assetService,
        onDone: () {
          Navigator.pop(context);
          _resetScan();
        },
      ),
    );
    if (mounted && _scanning == false) _resetScan();
  }

  Future<void> _showError(String message, String code) async {
    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Row(children: [
          Icon(Icons.error_outline, color: AppTheme.errorColor, size: 22),
          SizedBox(width: 8),
          Text('Scan Failed'),
        ]),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message),
            const SizedBox(height: 8),
            Text('Code: $code',
                style: const TextStyle(fontSize: 12, fontFamily: 'monospace',
                    color: AppTheme.textMuted)),
          ],
        ),
        actions: [
          TextButton(onPressed: () { Navigator.pop(context); _resetScan(); },
              child: const Text('Scan Again')),
          TextButton(onPressed: () => Navigator.pop(context),
              child: const Text('Close')),
        ],
      ),
    );
  }

  void _resetScan() {
    setState(() { _scanning = true; _processing = false; });
    _controller?.start();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Scan Asset QR Code'),
        backgroundColor: Colors.black54,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        titleTextStyle: const TextStyle(
          color: Colors.white,
          fontSize: 17,
          fontWeight: FontWeight.w700,
        ),
        actions: [
          if (_scanning && _controller != null)
            IconButton(
              icon: Icon(_torchOn ? Icons.flash_on : Icons.flash_off, color: Colors.white),
              onPressed: () async {
                await _controller!.toggleTorch();
                setState(() => _torchOn = !_torchOn);
              },
            ),
        ],
      ),
      body: Stack(
        children: [
          // Camera view - only show when scanning and controller exists
          if (_scanning && !_processing && _controller != null)
            MobileScanner(
              controller: _controller!,
              onDetect: _onDetect,
            )
          else
            // Black background when not scanning
            Container(
              color: Colors.black,
              child: const Center(
                child: Icon(Icons.camera_alt, size: 64, color: Colors.white24),
              ),
            ),
          // Dark overlay with cutout
          _buildOverlay(),
          // Status indicator
          if (_processing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text('Processing scan…',
                        style: TextStyle(color: Colors.white, fontSize: 14)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOverlay() {
    final screenWidth = MediaQuery.of(context).size.width;
    final frameSize = (screenWidth * 0.75).clamp(200.0, 280.0);

    return CustomPaint(
      painter: _ScanOverlayPainter(frameSize: frameSize),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Hint text
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _scanning ? 'Align QR code within the frame' : 'Processing…',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Scan frame - centered and responsive
            SizedBox(
              width: frameSize,
              height: frameSize,
              child: CustomPaint(painter: _CornerPainter()),
            ),
            const SizedBox(height: 24),
            // Start scanning button - show when not scanning
            if (!_scanning && !_processing)
              ElevatedButton(
                onPressed: _startScanning,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.camera_alt, size: 24),
                    const SizedBox(width: 12),
                    const Text('Start Scanning', style: TextStyle(fontSize: 16)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ScanOverlayPainter extends CustomPainter {
  final double frameSize;

  _ScanOverlayPainter({required this.frameSize});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0x88000000);
    final cx = size.width / 2;
    final cy = size.height / 2;
    final frameLeft = cx - frameSize / 2;
    final frameTop = cy - frameSize / 2;
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTWH(frameLeft, frameTop, frameSize, frameSize),
        const Radius.circular(12),
      ))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter _) => false;
}

class _CornerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = 3.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    const r = 12.0;
    const len = 28.0;
    canvas.drawArc(const Rect.fromLTWH(0, 0, r * 2, r * 2), 3.14159, 0.5, false, paint);
    canvas.drawLine(const Offset(r, 0), Offset(r + len, 0), paint);
    canvas.drawLine(const Offset(0, r), Offset(0, r + len), paint);
    final tr = Offset(size.width - r * 2, 0.0);
    canvas.drawArc(Rect.fromLTWH(tr.dx, tr.dy, r * 2, r * 2), -0.5, 0.5, false, paint);
    canvas.drawLine(Offset(size.width - r - len, 0), Offset(size.width - r, 0), paint);
    canvas.drawLine(Offset(size.width, r), Offset(size.width, r + len), paint);
    canvas.drawArc(Rect.fromLTWH(0, size.height - r * 2, r * 2, r * 2), 1.57079, 0.5, false, paint);
    canvas.drawLine(Offset(0, size.height - r - len), Offset(0, size.height - r), paint);
    canvas.drawLine(Offset(r, size.height), Offset(r + len, size.height), paint);
    canvas.drawArc(Rect.fromLTWH(size.width - r * 2, size.height - r * 2, r * 2, r * 2), 0, 0.5, false, paint);
    canvas.drawLine(Offset(size.width - r - len, size.height), Offset(size.width - r, size.height), paint);
    canvas.drawLine(Offset(size.width, size.height - r - len), Offset(size.width, size.height - r), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter _) => false;
}

class _ScanResultSheet extends StatefulWidget {
  final Asset asset;
  final Borrowing borrowing;
  final AssetService assetService;
  final VoidCallback onDone;

  const _ScanResultSheet({
    required this.asset,
    required this.borrowing,
    required this.assetService,
    required this.onDone,
  });

  @override
  State<_ScanResultSheet> createState() => _ScanResultSheetState();
}

class _ScanResultSheetState extends State<_ScanResultSheet> {
  bool _loading = false;
  String? _successMsg;
  String? _errorMsg;

  Future<void> _doBorrow() async {
    setState(() { _loading = true; _errorMsg = null; });
    try {
      await widget.assetService.borrowAsset(widget.asset.id);
      setState(() { _successMsg = 'Asset borrowed successfully.'; });
    } catch (e) {
      setState(() { _errorMsg = e.toString().replaceAll('Exception: ', ''); });
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _doReturn() async {
    setState(() { _loading = true; _errorMsg = null; });
    try {
      await widget.assetService.returnAsset(widget.asset.id);
      setState(() { _successMsg = 'Asset returned successfully.'; });
    } catch (e) {
      setState(() { _errorMsg = e.toString().replaceAll('Exception: ', ''); });
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.asset;
    final status = a.status.toUpperCase();

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 12, 20,
          MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(children: [
            const Icon(Icons.check_circle, color: AppTheme.successColor, size: 22),
            const SizedBox(width: 8),
            const Text('Asset Found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary)),
            const Spacer(),
            PsaStatusBadge(status: a.status),
          ]),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.surfaceColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary)),
                const SizedBox(height: 4),
                Text(a.assetNumber, style: const TextStyle(fontSize: 12, fontFamily: 'monospace',
                    color: AppTheme.textSecondary)),
                if (a.category != null) ...[
                  const SizedBox(height: 4),
                  Text(a.category!.name, style: const TextStyle(fontSize: 12,
                      color: AppTheme.textMuted)),
                ],
                if (a.location != null) ...[
                  const SizedBox(height: 4),
                  Row(children: [
                    const Icon(Icons.location_on_outlined, size: 13, color: AppTheme.textMuted),
                    const SizedBox(width: 4),
                    Text(a.location!.name, style: const TextStyle(fontSize: 12,
                        color: AppTheme.textMuted)),
                  ]),
                ],
              ],
            ),
          ),
          if (_errorMsg != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(children: [
                const Icon(Icons.error_outline, color: AppTheme.errorColor, size: 16),
                const SizedBox(width: 8),
                Expanded(child: Text(_errorMsg!,
                    style: const TextStyle(color: AppTheme.errorColor, fontSize: 12))),
              ]),
            ),
          ],
          if (_successMsg != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(children: [
                const Icon(Icons.check_circle_outline, color: AppTheme.successColor, size: 16),
                const SizedBox(width: 8),
                Expanded(child: Text(_successMsg!,
                    style: const TextStyle(color: AppTheme.successColor, fontSize: 12))),
              ]),
            ),
          ],
          const SizedBox(height: 20),
          if (_successMsg != null)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: widget.onDone,
                child: const Text('Scan Another'),
              ),
            )
          else if (_loading)
            const Center(child: CircularProgressIndicator())
          else
            Row(children: [
              if (status == 'AVAILABLE')
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _doBorrow,
                    icon: const Icon(Icons.archive_outlined, size: 16),
                    label: const Text('Borrow'),
                  ),
                ),
              if (status == 'BORROWED')
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _doReturn,
                    icon: const Icon(Icons.unarchive_outlined, size: 16),
                    label: const Text('Return'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.successColor),
                  ),
                ),
              if (status != 'AVAILABLE' && status != 'BORROWED')
                const Expanded(
                  child: Text('No action available for current status.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                ),
              const SizedBox(width: 12),
              OutlinedButton(
                onPressed: widget.onDone,
                child: const Text('Close'),
              ),
            ]),
        ],
      ),
    );
  }
}