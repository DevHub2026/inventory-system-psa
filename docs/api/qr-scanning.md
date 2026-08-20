# QR Scanning API

Base path prefix: /api/v1

Routes (backend/app/Modules/QrScan/Routes/api.php)

GET /api/v1/qr/resolve/{identifier}
- Purpose: Resolve a QR identifier to a domain resource type (ASSET, BORROWING_RECEIPT, RETURN_RECEIPT, UNKNOWN)
- Authentication: Required (auth:sanctum)
- Notes: {identifier} is matched with a greedy where('identifier', '.*') to allow slashes

GET /api/v1/qr/asset/{identifier}
- Purpose: Legacy asset resolution by QR identifier; records a VIEW scan

POST /api/v1/qr/scan-action
- Purpose: Record a non-VIEW scan action with metadata
- Authentication: Required

GET /api/v1/qr/my-history
- Purpose: Return authenticated user's scan history

GET /api/v1/qr/history
- Purpose: Global scan history (role-restricted: Super Administrator,System Administrator,Property Custodian,Inventory Officer)

Source of truth
- backend/app/Modules/QrScan/Routes/api.php
- backend/app/Modules/QrScan/Controllers/QrScanController.php
