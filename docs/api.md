# API Documentation

## Authentication Endpoints
### POST /api/register
Register a new user account.
```json
{
  "username": "string",
  "fullname": "string",
  "password": "string"
}
```

### POST /api/login
Login with existing credentials.
```json
{
  "username": "string",
  "password": "string"
}
```

### POST /api/logout
Logout current user session.

### GET /api/user
Get current authenticated user details.

## Chat Endpoints
### GET /api/chats
Get all chats for current user with their participants and last messages.

### POST /api/chats
Create a new chat with specified participants.
```json
{
  "participantIds": "number[]"
}
```

### GET /api/chats/:id/messages
Get all messages for a specific chat.

### POST /api/chats/:id/messages
Send a new message in a chat.
```json
{
  "content": "string"
}
```

### DELETE /api/chats/:id
Delete a chat and all its messages.

## Posts Endpoints
### GET /api/posts
Get all posts with optional filters.

### POST /api/posts
Create a new post (room or job listing).
```json
{
  "type": "room" | "job",
  "title": "string",
  "description": "string",
  "location": "string",
  "price": "number | null",
  "images": "string[]"
}
```

### PATCH /api/posts/:id
Update an existing post.

### DELETE /api/posts/:id
Delete a post.

## Real-time Events
The application uses Socket.IO for real-time updates:

### Client Events
- `user-online`: Emitted when user connects
- `join-chat`: Join a chat room
- `leave-chat`: Leave a chat room

### Server Events
- `new-message`: New chat message received
- `user-status-change`: User online/offline status update
- `initial-online-users`: List of currently online users
