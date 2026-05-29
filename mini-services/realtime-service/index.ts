import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path — it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ---------------------------------------------------------------------------
// In-memory connected-user registry
// ---------------------------------------------------------------------------

interface ConnectedUser {
  socketId: string
  userId: string
  name: string
  role: string        // e.g. admin, teacher, student, parent
  schoolId: string
  connectedAt: Date
}

// Map<socketId, ConnectedUser>
const connectedUsers = new Map<string, ConnectedUser>()

// Map<schoolId, Set<socketId>> – quick lookup of who is in which school room
const schoolRooms = new Map<string, Set<string>>()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addConnectedUser(user: ConnectedUser) {
  connectedUsers.set(user.socketId, user)

  if (!schoolRooms.has(user.schoolId)) {
    schoolRooms.set(user.schoolId, new Set())
  }
  schoolRooms.get(user.schoolId)!.add(user.socketId)
}

function removeConnectedUser(socketId: string): ConnectedUser | undefined {
  const user = connectedUsers.get(socketId)
  if (!user) return undefined

  connectedUsers.delete(socketId)

  const room = schoolRooms.get(user.schoolId)
  if (room) {
    room.delete(socketId)
    if (room.size === 0) {
      schoolRooms.delete(user.schoolId)
    }
  }

  return user
}

function getOnlineUsersForSchool(schoolId: string): ConnectedUser[] {
  const socketIds = schoolRooms.get(schoolId)
  if (!socketIds) return []

  const users: ConnectedUser[] = []
  for (const sid of socketIds) {
    const u = connectedUsers.get(sid)
    if (u) users.push(u)
  }
  return users
}

// ---------------------------------------------------------------------------
// Socket connection handler
// ---------------------------------------------------------------------------

io.on('connection', (socket: Socket) => {
  console.log(`[connect] socket=${socket.id}`)

  // -----------------------------------------------------------------------
  // School room join / leave
  // -----------------------------------------------------------------------

  /**
   * A client must "authenticate" by sending their user info + schoolId.
   * This joins them into the Socket.IO room for that school so that all
   * school-scoped broadcasts reach them automatically.
   */
  socket.on('school:join', (data: { userId: string; name: string; role: string; schoolId: string }) => {
    const { userId, name, role, schoolId } = data

    const user: ConnectedUser = {
      socketId: socket.id,
      userId,
      name,
      role,
      schoolId,
      connectedAt: new Date(),
    }

    // Join Socket.IO room named after the schoolId
    const roomName = `school:${schoolId}`
    socket.join(roomName)

    addConnectedUser(user)

    // Notify everyone in the school room that this user is online
    io.to(roomName).emit('user:online', {
      userId,
      name,
      role,
      schoolId,
      timestamp: new Date().toISOString(),
    })

    // Send the newly-joined client the current online user list for the school
    const onlineUsers = getOnlineUsersForSchool(schoolId)
    socket.emit('user:list', { schoolId, users: onlineUsers })

    console.log(`[school:join] user=${name} (${userId}) school=${schoolId} role=${role}`)
  })

  /**
   * A client explicitly leaves a school room (e.g. switching schools).
   */
  socket.on('school:leave', (data: { schoolId: string }) => {
    const { schoolId } = data
    const user = removeConnectedUser(socket.id)

    if (user) {
      const roomName = `school:${schoolId}`
      socket.leave(roomName)

      io.to(roomName).emit('user:offline', {
        userId: user.userId,
        name: user.name,
        schoolId,
        timestamp: new Date().toISOString(),
      })

      console.log(`[school:leave] user=${user.name} school=${schoolId}`)
    }
  })

  // -----------------------------------------------------------------------
  // Attendance update
  // -----------------------------------------------------------------------

  socket.on('attendance:update', (data: {
    schoolId: string
    classId?: string
    studentId?: string
    date?: string
    status?: string
    markedBy?: string
    [key: string]: unknown
  }) => {
    const { schoolId, ...payload } = data
    const roomName = `school:${schoolId}`

    const event = {
      ...payload,
      schoolId,
      timestamp: new Date().toISOString(),
    }

    io.to(roomName).emit('attendance:update', event)
    console.log(`[attendance:update] school=${schoolId}`, JSON.stringify(payload))
  })

  // -----------------------------------------------------------------------
  // Notification
  // -----------------------------------------------------------------------

  socket.on('notification:new', (data: {
    schoolId: string
    targetUserId?: string   // if present, only that user gets it
    targetRole?: string     // if present, broadcast to role in school
    title?: string
    message?: string
    type?: string
    [key: string]: unknown
  }) => {
    const { schoolId, targetUserId, targetRole, ...payload } = data
    const roomName = `school:${schoolId}`

    const event = {
      ...payload,
      schoolId,
      timestamp: new Date().toISOString(),
    }

    if (targetUserId) {
      // Send to a specific user — find their socket(s) in the school
      const schoolSockets = schoolRooms.get(schoolId)
      if (schoolSockets) {
        for (const sid of schoolSockets) {
          const u = connectedUsers.get(sid)
          if (u && u.userId === targetUserId) {
            io.to(sid).emit('notification:new', event)
          }
        }
      }
    } else if (targetRole) {
      // Broadcast to users with a specific role in the school
      const schoolSockets = schoolRooms.get(schoolId)
      if (schoolSockets) {
        for (const sid of schoolSockets) {
          const u = connectedUsers.get(sid)
          if (u && u.role === targetRole) {
            io.to(sid).emit('notification:new', event)
          }
        }
      }
    } else {
      // Broadcast to the entire school
      io.to(roomName).emit('notification:new', event)
    }

    console.log(`[notification:new] school=${schoolId} targetUser=${targetUserId ?? '*'} targetRole=${targetRole ?? '*'}`)
  })

  // -----------------------------------------------------------------------
  // Dashboard refresh
  // -----------------------------------------------------------------------

  socket.on('dashboard:refresh', (data: {
    schoolId: string
    reason?: string
    [key: string]: unknown
  }) => {
    const { schoolId, ...payload } = data
    const roomName = `school:${schoolId}`

    const event = {
      ...payload,
      schoolId,
      timestamp: new Date().toISOString(),
    }

    io.to(roomName).emit('dashboard:refresh', event)
    console.log(`[dashboard:refresh] school=${schoolId}`)
  })

  // -----------------------------------------------------------------------
  // Alert trigger
  // -----------------------------------------------------------------------

  socket.on('alert:trigger', (data: {
    schoolId: string
    alertType: string   // e.g. "low_attendance", "unpaid_fees", "custom"
    severity?: string   // "info" | "warning" | "critical"
    targetUserId?: string
    message?: string
    [key: string]: unknown
  }) => {
    const { schoolId, targetUserId, ...payload } = data
    const roomName = `school:${schoolId}`

    const event = {
      ...payload,
      schoolId,
      timestamp: new Date().toISOString(),
    }

    if (targetUserId) {
      const schoolSockets = schoolRooms.get(schoolId)
      if (schoolSockets) {
        for (const sid of schoolSockets) {
          const u = connectedUsers.get(sid)
          if (u && u.userId === targetUserId) {
            io.to(sid).emit('alert:trigger', event)
          }
        }
      }
    } else {
      io.to(roomName).emit('alert:trigger', event)
    }

    console.log(`[alert:trigger] school=${schoolId} type=${data.alertType} targetUser=${targetUserId ?? '*'}`)
  })

  // -----------------------------------------------------------------------
  // Chat message
  // -----------------------------------------------------------------------

  socket.on('chat:message', (data: {
    schoolId: string
    fromUserId: string
    fromName: string
    toUserId?: string      // if present, it's a DM
    content: string
    [key: string]: unknown
  }) => {
    const { schoolId, fromUserId, fromName, toUserId, content, ...payload } = data
    const roomName = `school:${schoolId}`

    const messageEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      fromUserId,
      fromName,
      toUserId: toUserId ?? null,
      content,
      schoolId,
      timestamp: new Date().toISOString(),
      ...payload,
    }

    if (toUserId) {
      // Direct message — send to target user + back to sender for confirmation
      const schoolSockets = schoolRooms.get(schoolId)
      if (schoolSockets) {
        for (const sid of schoolSockets) {
          const u = connectedUsers.get(sid)
          if (u && u.userId === toUserId) {
            io.to(sid).emit('chat:message', messageEvent)
          }
        }
      }
      // Echo back to sender so their UI shows the sent message
      socket.emit('chat:message', messageEvent)
    } else {
      // Broadcast to entire school room
      io.to(roomName).emit('chat:message', messageEvent)
    }

    console.log(`[chat:message] school=${schoolId} from=${fromName} to=${toUserId ?? 'all'}`)
  })

  // -----------------------------------------------------------------------
  // Disconnect
  // -----------------------------------------------------------------------

  socket.on('disconnect', (reason) => {
    const user = removeConnectedUser(socket.id)

    if (user) {
      const roomName = `school:${user.schoolId}`
      io.to(roomName).emit('user:offline', {
        userId: user.userId,
        name: user.name,
        schoolId: user.schoolId,
        timestamp: new Date().toISOString(),
      })

      console.log(`[disconnect] user=${user.name} school=${user.schoolId} reason=${reason}`)
    } else {
      console.log(`[disconnect] socket=${socket.id} reason=${reason}`)
    }
  })

  // -----------------------------------------------------------------------
  // Error
  // -----------------------------------------------------------------------

  socket.on('error', (error) => {
    console.error(`[error] socket=${socket.id}`, error)
  })
})

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const PORT = 3003

httpServer.listen(PORT, () => {
  console.log(`EduFlow Real-time Service running on port ${PORT}`)
  console.log('Supported events:')
  console.log('  school:join / school:leave')
  console.log('  attendance:update')
  console.log('  notification:new')
  console.log('  dashboard:refresh')
  console.log('  alert:trigger')
  console.log('  user:online / user:offline')
  console.log('  chat:message')
})

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`)
  io.disconnectSockets(true)
  httpServer.close(() => {
    console.log('EduFlow Real-time Service stopped')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
