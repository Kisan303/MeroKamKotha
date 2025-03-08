# Database Schema Documentation

## Tables Overview

### users
User accounts and authentication information.
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  fullname TEXT NOT NULL,
  password TEXT NOT NULL
);
```

### chats
Chat rooms between users.
```sql
CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### chat_participants
Users participating in each chat.
```sql
CREATE TABLE chat_participants (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### messages
Individual chat messages.
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  read_at TIMESTAMP
);
```

### user_blocks
Blocked users tracking.
```sql
CREATE TABLE user_blocks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  blocked_user_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### posts
Room and job listings.
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('room', 'job')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER,
  location TEXT NOT NULL,
  images TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMP
);
```

### comments
Comments on posts.
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_id INTEGER,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMP
);
```

### bookmarks
Saved posts for users.
```sql
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Relationships

### Chat System
- `chats` ↔ `chat_participants`: One-to-many (chat has multiple participants)
- `chats` ↔ `messages`: One-to-many (chat has multiple messages)
- `messages` ↔ `users`: Many-to-one (message belongs to a user)

### Post System
- `posts` ↔ `users`: Many-to-one (post belongs to a user)
- `posts` ↔ `comments`: One-to-many (post has multiple comments)
- `comments` ↔ `users`: Many-to-one (comment belongs to a user)
- `posts` ↔ `bookmarks`: One-to-many (post can be bookmarked by multiple users)

### User Relationships
- `users` ↔ `user_blocks`: One-to-many (user can block multiple users)
