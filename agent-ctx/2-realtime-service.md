# Task 2 - Real-time WebSocket Service Work Record

## Agent: Real-time Service Developer
## Date: 2026-05-29

## Summary
Created a Socket.IO-based real-time service for EduFlow OS at `/home/z/my-project/mini-services/realtime-service/`. The service runs on port 3003 and supports school-scoped rooms, user presence tracking, and 6 real-time event types. All events were tested and verified working.

## Files Created

### 1. `mini-services/realtime-service/package.json`
- Standalone Bun project with `socket.io@^4.8.1` dependency
- Dev dependency: `socket.io-client@^4.8.1` (for testing)
- Script: `"dev": "bun --hot index.ts"` (auto-restart on file changes)

### 2. `mini-services/realtime-service/index.ts`
- **Port**: 3003 (hardcoded)
- **Socket.IO path**: `/` (required for Caddy gateway forwarding)
- **CORS**: Open (`origin: "*"`)
- **Ping**: 60s timeout, 25s interval

#### In-Memory Data Structures
- `connectedUsers: Map<socketId, ConnectedUser>` — All connected users with userId, name, role, schoolId, connectedAt
- `schoolRooms: Map<schoolId, Set<socketId>>` — Quick lookup of sockets per school

#### Supported Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `school:join` | Client → Server | Join a school room; emits `user:online` + `user:list` |
| `school:leave` | Client → Server | Leave a school room; emits `user:offline` |
| `attendance:update` | Client → Server → School room | Broadcast attendance changes |
| `notification:new` | Client → Server → Target/Role/All | Supports targeted user, role-based, or school-wide broadcast |
| `dashboard:refresh` | Client → Server → School room | Notify clients to refresh dashboard data |
| `alert:trigger` | Client → Server → Target/All | Alert with type (low_attendance, unpaid_fees, etc.) and severity |
| `user:online` | Server → School room | Emitted when a user joins a school |
| `user:offline` | Server → School room | Emitted when a user leaves or disconnects |
| `user:list` | Server → Joining client | Current online users for the school |
| `chat:message` | Client → Server → School room or DM | Supports broadcast (no toUserId) or direct message (with toUserId) |

#### Room Architecture
- Each school gets a Socket.IO room named `school:{schoolId}`
- All school-scoped events are broadcast only to clients in that school's room
- Targeted notifications/alerts find the recipient by iterating `schoolRooms`

#### Graceful Shutdown
- Handles SIGTERM and SIGINT signals
- Disconnects all sockets cleanly before exiting

## Frontend Connection Pattern
From the Next.js frontend, clients connect using:
```typescript
const socket = io('/?XTransformPort=3003', {
  transports: ['websocket', 'polling'],
  forceNew: true,
  reconnection: true,
})
```

## Testing Results
Comprehensive test with 2 simulated clients (Alice/admin and Bob/teacher) in the same school:

| Test | Result |
|------|--------|
| User connects and joins school | ✅ `user:online` broadcast received |
| User receives online user list | ✅ `user:list` with correct count |
| Chat broadcast message | ✅ All users in school receive it |
| Attendance update broadcast | ✅ School room receives event with timestamp |
| Notification broadcast | ✅ School room receives event |
| Dashboard refresh broadcast | ✅ School room receives event |
| Alert trigger broadcast | ✅ School room receives event with type & severity |
| Second user joins | ✅ Both users see each other, `user:list` count = 2 |
| Direct message (DM) | ✅ Only target user receives the message |
| User disconnects | ✅ `user:offline` broadcast to school room |

## Service Startup
```bash
cd /home/z/my-project/mini-services/realtime-service
bun install
bun run dev &   # runs: bun --hot index.ts
```

## Notes
- The service uses in-memory state; connected user data is lost on restart
- For production, consider persisting presence to Redis or a database
- The `socket.io-client` dev dependency is included for testing purposes only
