# Offline-First Architecture Design

## Overview
Design for implementing offline capabilities in the PSA Inventory Management System, allowing users to continue working without internet connectivity and synchronize data when connection is restored.

## Architecture Principles

1. **Offline-First**: Assume offline by default, sync when online
2. **Optimistic UI**: Update UI immediately, sync in background
3. **Conflict Resolution**: Handle data conflicts gracefully
4. **Data Integrity**: Ensure no data loss during sync
5. **User Experience**: Seamless transition between online/offline

## Technology Stack

### Frontend (React)
- **IndexedDB**: Local data storage using `dexie.js` or `idb`
- **Service Workers**: Cache static assets and API responses
- **Background Sync API**: Queue operations for later sync
- **Network Status API**: Detect online/offline state

### Backend (Laravel)
- **API Versioning**: Support offline sync endpoints
- **Conflict Detection**: Timestamp-based conflict resolution
- **Batch Operations**: Handle bulk sync requests
- **WebSockets**: Real-time sync status updates (future)

## Data Synchronization Strategy

### Sync Types

1. **Initial Sync**: Download all user data on first load
2. **Incremental Sync**: Sync only changed data
3. **Conflict Sync**: Resolve conflicts between local and server
4. **Full Sync**: Periodic complete data refresh

### Data Categories

#### Read-Only Data (Cache)
- Asset categories
- Offices/Departments
- System settings
- User roles/permissions

#### Read-Write Data (Sync)
- Borrow transactions
- Return transactions
- Asset status updates
- User profile changes

## Database Schema Changes

### Add to `users` table:
```php
$table->timestamp('last_sync_at')->nullable();
$table->string('device_id')->nullable();
```

### New `sync_logs` table:
```php
Schema::create('sync_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('device_id')->nullable();
    $table->string('sync_type'); // 'initial', 'incremental', 'conflict'
    $table->json('synced_data')->nullable();
    $table->integer('records_synced')->default(0);
    $table->timestamp('started_at');
    $table->timestamp('completed_at')->nullable();
    $table->string('status'); // 'pending', 'completed', 'failed'
    $table->text('error_message')->nullable();
    $table->timestamps();
});
```

### New `pending_operations` table:
```php
Schema::create('pending_operations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('device_id')->nullable();
    $table->string('operation_type'); // 'borrow', 'return', 'update'
    $table->string('entity_type'); // 'asset', 'borrowing'
    $table->integer('entity_id')->nullable();
    $table->json('payload');
    $table->timestamp('created_at');
    $table->timestamp('synced_at')->nullable();
    $table->boolean('is_synced')->default(false);
});
```

## API Endpoints

### Sync Endpoints
- `GET /api/v1/sync/status` - Check sync status
- `GET /api/v1/sync/initial` - Get initial data
- `GET /api/v1/sync/incremental` - Get changes since last sync
- `POST /api/v1/sync/push` - Push local changes to server
- `POST /api/v1/sync/resolve-conflict` - Resolve sync conflicts

### Offline Queue Endpoints
- `GET /api/v1/sync/pending` - Get pending operations
- `POST /api/v1/sync/process-queue` - Process pending operations
- `DELETE /api/v1/sync/pending/{id}` - Remove pending operation

## Frontend Implementation

### IndexedDB Schema
```javascript
// Database: PSAInventoryDB
// Stores:
// - assets: { id, asset_number, name, category, status, last_updated }
// - borrowings: { id, asset_id, user_id, status, borrowed_at, due_date }
// - pending_operations: { id, operation_type, entity_type, payload, created_at }
// - sync_metadata: { last_sync_at, device_id, user_id }
```

### Service Worker Strategy
```javascript
// Cache Strategy:
// - Static assets: Cache First
// - API GET requests: Network First, fallback to Cache
// - API POST requests: Network Only, queue for offline
// - Offline page: Serve cached offline page
```

### Sync Service
```typescript
class SyncService {
  // Check online status
  isOnline(): boolean
  
  // Queue operation for sync
  queueOperation(operation: PendingOperation): void
  
  // Sync pending operations
  syncPending(): Promise<void>
  
  // Fetch incremental updates
  fetchUpdates(): Promise<void>
  
  // Resolve conflicts
  resolveConflict(conflict: SyncConflict): Promise<void>
  
  // Handle conflict automatically
  autoResolve(conflict: SyncConflict): ResolutionStrategy
}
```

## Conflict Resolution Strategies

### Strategies

1. **Last-Write-Wins (LWW)**: Use most recent timestamp
2. **Server-Wins**: Server data always takes precedence
3. **Client-Wins**: Client data takes precedence
4. **Manual Resolution**: User chooses which to keep
5. **Merge**: Combine changes when possible

### Conflict Detection
```php
// Backend conflict detection
public function detectConflict($localData, $serverData)
{
    if ($localData['updated_at'] > $serverData['updated_at']) {
        return 'client-wins';
    }
    if ($serverData['updated_at'] > $localData['updated_at']) {
        return 'server-wins';
    }
    return 'manual-resolution-required';
}
```

## User Experience

### Online State
- Real-time data updates
- Immediate server sync
- Live notifications
- Full feature access

### Offline State
- Show offline indicator
- Enable offline-capable features
- Queue operations for sync
- Show pending operations count
- Disable features requiring server

### Sync State
- Show sync progress
- Display sync errors
- Allow manual sync trigger
- Show last sync time
- Handle sync failures gracefully

## Security Considerations

1. **Data Encryption**: Encrypt sensitive data at rest
2. **Authentication**: Require auth before sync
3. **Rate Limiting**: Prevent abuse of sync endpoints
4. **Data Validation**: Validate all synced data
5. **Audit Logging**: Log all sync operations

## Performance Optimization

1. **Delta Sync**: Only sync changed data
2. **Compression**: Compress sync payloads
3. **Batching**: Batch multiple operations
4. **Throttling**: Limit sync frequency
5. **Background Sync**: Use Background Sync API

## Implementation Phases

### Phase 1: Foundation (2-3 weeks)
- Set up IndexedDB
- Implement basic sync service
- Add offline detection
- Create sync API endpoints

### Phase 2: Core Features (3-4 weeks)
- Implement borrow/return offline queue
- Add conflict resolution
- Implement incremental sync
- Add sync status UI

### Phase 3: Advanced Features (2-3 weeks)
- Background sync with Service Workers
- Real-time sync status
- Advanced conflict resolution
- Performance optimization

### Phase 4: Testing & Polish (1-2 weeks)
- Comprehensive testing
- Edge case handling
- User experience refinement
- Documentation

## Testing Strategy

1. **Unit Tests**: Test sync logic, conflict resolution
2. **Integration Tests**: Test sync API endpoints
3. **E2E Tests**: Test offline workflows
4. **Network Simulation**: Test with slow/unstable networks
5. **Conflict Scenarios**: Test various conflict cases

## Monitoring & Analytics

1. **Sync Success Rate**: Track sync success/failure
2. **Sync Duration**: Monitor sync performance
3. **Conflict Rate**: Track conflict frequency
4. **Offline Usage**: Measure offline feature usage
5. **Error Tracking**: Log sync errors

## Rollback Plan

1. **Feature Flag**: Disable offline mode if needed
2. **Data Recovery**: Restore from server if local corrupted
3. **Sync Reset**: Clear local data and re-sync
4. **Emergency Mode**: Force online-only mode

## Compliance Notes

- **Philippine Data Privacy Act (RA 10173)**: Local data storage
  - Encrypt sensitive data at rest
  - Allow data deletion on device
  - Provide data export functionality
  - Document local data processing

## Recommended Libraries

### Frontend
- `dexie.js` - IndexedDB wrapper
- `workbox` - Service worker toolkit
- `localforage` - Offline storage
- `axios` - HTTP client with interceptors

### Backend
- Laravel Queue - Background job processing
- Laravel Events - Sync event handling
- Laravel Broadcasting - Real-time updates (future)

## Next Steps

1. Set up IndexedDB schema
2. Create sync service skeleton
3. Implement offline detection
4. Design sync API endpoints
5. Create conflict resolution logic
6. Build sync status UI
7. Write comprehensive tests
8. Document sync procedures

## Estimated Timeline

- **Phase 1**: 2-3 weeks
- **Phase 2**: 3-4 weeks
- **Phase 3**: 2-3 weeks
- **Phase 4**: 1-2 weeks

**Total**: 8-12 weeks for full implementation
