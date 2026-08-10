# In-App Messaging System

## Overview

The messaging system allows users to send direct messages to each other in real-time. It's built with:

- **Backend API**: REST endpoints for managing conversations and messages
- **WebSocket**: Real-time message delivery and typing indicators
- **Frontend**: React hooks and components for chat UI
- **Database**: PostgreSQL with Prisma ORM

## Architecture

### Database Schema

Two new models were added to `packages/db/schema.prisma`:

```prisma
model Conversation {
  id            String    @id @default(uuid())
  participants  String[]  // Array of user IDs
  lastMessage   String?
  lastMessageAt DateTime?
  messages      Message[]
  // timestamps...
}

model Message {
  id             String       @id @default(uuid())
  conversation   Conversation @relation(...)
  conversationId String
  senderId       String
  senderName     String
  content        String       @db.Text
  readBy         String[]     @default([])
  // timestamps...
}
```

### Backend API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

#### GET `/api/messages/conversations`

Get all conversations for the current user.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "conv-id",
      "participants": [...],
      "lastMessage": "Hello!",
      "lastMessageAt": "2026-01-24T...",
      "unreadCount": 2,
      "messages": [...]
    }
  ]
}
```

#### POST `/api/messages/conversations`

Create or get an existing conversation.

**Request:**

```json
{
  "participantIds": ["user-id-1", "user-id-2"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "conv-id",
    "participants": ["user-id-1", "user-id-2"],
    ...
  }
}
```

#### GET `/api/messages/conversations/:conversationId/messages`

Get messages for a conversation with pagination.

**Query Parameters:**

- `limit` (optional): Number of messages to return (default: 50)
- `before` (optional): Message ID for pagination

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "msg-id",
      "conversationId": "conv-id",
      "senderId": "user-id",
      "senderName": "John Doe",
      "content": "Hello!",
      "readBy": ["user-id"],
      "createdAt": "2026-01-24T...",
      "updatedAt": "2026-01-24T..."
    }
  ]
}
```

#### POST `/api/messages`

Send a message.

**Request:**

```json
{
  "conversationId": "conv-id",
  "content": "Hello, how are you?"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "msg-id",
    "conversationId": "conv-id",
    "senderId": "user-id",
    "senderName": "John Doe",
    "content": "Hello, how are you?",
    "readBy": ["user-id"],
    "createdAt": "2026-01-24T...",
    "updatedAt": "2026-01-24T..."
  }
}
```

#### POST `/api/messages/read`

Mark messages as read.

**Request:**

```json
{
  "messageIds": ["msg-id-1", "msg-id-2"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "updated": 2
  }
}
```

#### GET `/api/messages/users/search`

Search for users to start a conversation.

**Query Parameters:**

- `q`: Search query (matches name or email)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "MEMBER",
      "profile": {
        "profession": "Engineer",
        "location": "New York"
      }
    }
  ]
}
```

### WebSocket Protocol

Connect to `ws://localhost:3002` with JWT token in the upgrade headers.

#### Client → Server Messages

**Send Chat Message:**

```json
{
  "type": "chat",
  "conversationId": "conv-id",
  "content": "Hello!",
  "recipientIds": ["user-id-1", "user-id-2"]
}
```

**Typing Indicator:**

```json
{
  "type": "typing",
  "conversationId": "conv-id",
  "recipientIds": ["user-id-1", "user-id-2"]
}
```

#### Server → Client Messages

**New Chat Message:**

```json
{
  "type": "chat",
  "messageId": "msg-id",
  "conversationId": "conv-id",
  "senderId": "user-id",
  "senderName": "John Doe",
  "content": "Hello!",
  "timestamp": "2026-01-24T..."
}
```

**Typing Indicator:**

```json
{
  "type": "typing",
  "conversationId": "conv-id",
  "userId": "user-id",
  "timestamp": "2026-01-24T..."
}
```

**Notification:**

```json
{
  "type": "notification",
  "notification": {
    "eventId": "...",
    "message": "...",
    ...
  }
}
```

## Frontend Implementation

### React Hook: `useChat`

Located at `apps/web/hooks/useChat.ts`, this hook manages chat state and WebSocket connection.

**Usage:**

```tsx
import { useChat } from "@/hooks/useChat";

function MyComponent() {
  const {
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    isConnected,
    typingUsers,
    sendMessage,
    createConversation,
    fetchConversations,
    fetchMessages,
    markAsRead,
    sendTypingIndicator,
  } = useChat({
    token: "your-jwt-token",
    apiUrl: "http://localhost:3001",
    wsUrl: "ws://localhost:3002",
  });

  // Use the returned values and functions...
}
```

### Chat Component

Located at `apps/web/components/Chat.tsx`, this is a full-featured chat UI.

**Usage:**

```tsx
import { Chat } from "@/components/Chat";

function MessagesPage() {
  return (
    <Chat
      token={userToken}
      currentUserId={user.id}
      currentUserName={user.name}
    />
  );
}
```

**Features:**

- ✅ Conversation list with unread counts
- ✅ Real-time message updates
- ✅ Typing indicators
- ✅ User search to start new conversations
- ✅ Message read receipts
- ✅ Responsive design
- ✅ Connection status indicator

## Setup Instructions

### 1. Run Database Migration

```bash
cd packages/db
npx prisma migrate dev --name add-messaging
```

This creates the `Conversation` and `Message` tables in your database.

### 2. Generate Prisma Client

```bash
cd packages/db
npx prisma generate
```

### 3. Update Environment Variables

Ensure these variables are set in your `.env` file:

```env
# Backend API
PORT=3001

# WebSocket Server
WS_PORT=3002

# Database
DATABASE_URL=postgresql://...

# Kafka (for notifications)
KAFKA_BROKER=localhost:9092
NOTIFICATION_TOPIC=notification.events
WS_CONSUMER_GROUP=notifications-ws
```

### 4. Start the Services

```bash
# Terminal 1: Start backend API
cd apps/be
bun run dev

# Terminal 2: Start WebSocket server
cd apps/ws
bun run dev

# Terminal 3: Start frontend
cd apps/web
npm run dev
```

### 5. Add Chat to Your App

Create a new page or add to existing navigation:

```tsx
// app/messages/page.tsx
"use client";

import { Chat } from "@/components/Chat";
import { useAuth } from "@/hooks/useAuth"; // Your auth hook

export default function MessagesPage() {
  const { user, token } = useAuth();

  if (!user || !token) {
    return <div>Please log in to view messages</div>;
  }

  return (
    <Chat token={token} currentUserId={user.id} currentUserName={user.name} />
  );
}
```

## Testing

### Manual Testing

1. **Create two users** and log in with each in different browser windows
2. **Start a conversation**: Click the "New conversation" button and search for the other user
3. **Send messages**: Type and send messages from both windows
4. **Verify real-time delivery**: Messages should appear instantly in both windows
5. **Check typing indicators**: Start typing in one window and verify the indicator shows in the other
6. **Test read receipts**: Open a conversation and verify unread count updates

### API Testing with cURL

```bash
# Login
TOKEN=$(curl -X POST http://localhost:3001/api/login/member \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.token')

# Get conversations
curl http://localhost:3001/api/messages/conversations \
  -H "Authorization: Bearer $TOKEN"

# Create conversation
curl -X POST http://localhost:3001/api/messages/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"participantIds":["user-id-2"]}'

# Send message
curl -X POST http://localhost:3001/api/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"conv-id","content":"Hello!"}'
```

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Users can only access conversations they're part of
3. **Input Validation**: All inputs are validated with Zod schemas
4. **XSS Prevention**: Messages are displayed as text, not HTML
5. **Rate Limiting**: Consider adding rate limits to prevent spam

## WebSocket Reliability

### Message Durability

Chat messages are persisted to PostgreSQL before being broadcast via Redis Pub/Sub. This ensures messages are not lost if:
- The WebSocket server restarts
- Redis connection drops
- A client disconnects temporarily

### Reconnection Reconciliation

When a client reconnects, it can recover missed messages by sending a `sync` message with `lastSeenAt`:

```json
{
  "type": "sync",
  "lastSeenAt": "2026-08-10T10:00:00Z"
}
```

The server responds with all messages created after `lastSeenAt` from conversations the user participates in. This handles:
- Normal reconnect
- WS server restart
- Redis disconnect
- Multiple browser tabs
- Duplicate delivery (idempotent by message ID)

### Known Limitations

- Messages are delivered in creation order per conversation
- The sync endpoint returns up to 200 missed messages per reconnect
- Duplicate messages are possible if the client sends multiple sync requests; the client should deduplicate by `messageId`

## Performance Optimization

1. **Pagination**: Messages are paginated (50 per request by default)
2. **Lazy Loading**: Messages are only fetched when a conversation is opened
3. **WebSocket**: Real-time updates without polling
4. **Indexes**: Database indexes on frequently queried fields

## Future Enhancements

- [ ] Image/file attachments
- [ ] Group chats (more than 2 participants)
- [ ] Message editing/deletion
- [ ] Message reactions (emoji)
- [ ] Voice/video calls
- [ ] Push notifications for mobile
- [ ] End-to-end encryption
- [ ] Message search
- [ ] Conversation archiving
- [ ] Online/offline status

## Troubleshooting

### Messages not appearing in real-time

1. Check WebSocket connection status (green indicator in UI)
2. Verify WS server is running on correct port
3. Check browser console for WebSocket errors
4. Ensure JWT token is valid

### Database errors

1. Make sure migrations are run: `npx prisma migrate dev`
2. Regenerate Prisma client: `npx prisma generate`
3. Check DATABASE_URL in .env

### Conversations not loading

1. Verify backend API is running
2. Check JWT token is being sent in headers
3. Look for errors in backend logs
4. Verify database connection

## Support

For issues or questions, please check:

- Backend logs: `apps/be` console output
- WebSocket logs: `apps/ws` console output
- Browser console: Network and Console tabs
- Database: Use Prisma Studio (`npx prisma studio`) to inspect data
