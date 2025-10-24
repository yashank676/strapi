# Audit Log Plugin

Automated audit logging for Strapi content changes with admin UI and REST API.

## Features

- ✅ Automatic tracking of create, update, delete, publish, unpublish operations
- ✅ Detailed diffs showing exact changes (JSON Patch RFC 6902)
- ✅ Admin UI panel in Settings
- ✅ REST API with filtering and pagination
- ✅ Role-based access control
- ✅ Captures user, timestamp, IP address, and user agent

## Quick Start

### 1. Enable Plugin

```typescript
// config/plugins.ts
export default {
  'audit-log': {
    enabled: true,
  },
};
```

### 2. Start Strapi

```bash
yarn build
yarn develop
```

### 3. Grant Permission

1. Go to Settings → Roles → Super Admin
2. Enable "Read" under Plugins → Audit Log
3. Save

### 4. View Logs

- **Admin UI**: Settings → Audit Logs
- **API**: `GET /admin/audit-log/logs`

## Configuration

```typescript
export default {
  'audit-log': {
    enabled: true,
    config: {
      enabled: true,
      excludeContentTypes: ['plugin::upload.file'],
    },
  },
};
```

## API Endpoints

All require authentication and `plugin::audit-log.read` permission.

```bash
# List logs (with filters)
GET /admin/audit-log/logs?contentType=api::article.article&action=update&page=1

# Get single log
GET /admin/audit-log/logs/:id

# Get audit trail for record
GET /admin/audit-log/logs/record/:contentType/:documentId

# Get statistics
GET /admin/audit-log/stats
```

## What Gets Logged

Each entry contains:

```json
{
  "id": 1,
  "action": "update",
  "contentType": "api::article.article",
  "userId": 1,
  "username": "admin@test.com",
  "payload": {"title": "Updated Title", ...},
  "changedFields": {
    "title": {"old": "Old", "new": "Updated Title"}
  },
  "diff": [
    {"op": "replace", "path": "/title", "value": "Updated Title"}
  ],
  "timestamp": "2025-10-24T10:30:00.000Z",
  "ipAddress": "192.168.1.1"
}
```

## How It Works

1. User creates/updates/deletes content
2. Lifecycle hook intercepts the operation
3. Captures metadata (user, IP, timestamp)
4. Calculates diff for updates (JSON Patch format)
5. Stores to `audit_logs` database table
6. View in Admin UI or query via API

## Testing

Create, edit, and delete content, then:

- **UI**: Go to Settings → Audit Logs
- **Database**: `sqlite3 .tmp/data.db "SELECT * FROM audit_logs;"`
- **API**: `curl http://localhost:1337/admin/audit-log/logs`

## License

MIT
