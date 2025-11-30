# Hunting Corner Mobile App

Quasar 2 / Vue 3 mobile application for Hunting Corner platform.

## Cursor Instructions

When asked to "generate next" or continue development:

1. **Regenerate components**: Use Quasar CLI to scaffold new components:
   ```bash
   quasar new component ComponentName
   ```

2. **Scaffold native builds**: 
   ```bash
   quasar mode add capacitor
   quasar build -m capacitor -T android
   ```

3. **Wire additional API endpoints**: Add new methods to `src/services/api.js` and create corresponding store actions in `src/stores/`.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure environment variables in `.env`:
   ```
   VUE_APP_API_BASE_URL=https://lovackikutak.rs/api
   VUE_APP_WS_URL=wss://api.lovackikutak.rs/ws
   VUE_APP_PUSHER_KEY=your_pusher_key
   VUE_APP_PUSHER_CLUSTER=eu
   ```

## Development

### Web
```bash
npm run dev:web
```

### Android (Capacitor)
```bash
npm run dev
```

### iOS (Capacitor)
```bash
npm run dev:ios
```

## Build

### Web
```bash
npm run build:web
```

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

## Testing

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e
npm run test:e2e:open  # Interactive mode
```

## Code Quality

```bash
npm run lint
npm run format
```

## Backend API Contract

### Authentication

**POST /api/auth/register**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "avatar": "https://..."
  }
}
```

**POST /api/auth/login**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
Response: Same as register

**POST /api/auth/refresh**
```json
{
  "refresh_token": "refresh_token"
}
```
Response:
```json
{
  "access_token": "new_jwt_token"
}
```

**POST /api/auth/logout**
Headers: `Authorization: Bearer {token}`
Response: 200 OK

### User

**GET /api/me**
Headers: `Authorization: Bearer {token}`
Response:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "avatar": "https://...",
  "bio": "..."
}
```

**PUT /api/me**
Headers: `Authorization: Bearer {token}`
Body:
```json
{
  "name": "John Doe",
  "bio": "Bio text",
  "avatar": "https://..."
}
```

### Posts

**GET /api/posts?page=1**
Headers: `Authorization: Bearer {token}` (optional)
Response:
```json
{
  "data": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "name": "John Doe",
        "avatar": "https://..."
      },
      "content": "Post content",
      "media": [
        {
          "url": "https://...",
          "type": "image"
        }
      ],
      "likes_count": 5,
      "comments_count": 2,
      "tags": ["hunting"],
      "location": {
        "lat": 44.7866,
        "lng": 20.4489,
        "address": "Belgrade"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 20,
    "total": 200
  }
}
```

**POST /api/posts**
Headers: `Authorization: Bearer {token}`
Body:
```json
{
  "content": "Post content",
  "media": [
    {
      "url": "https://...",
      "type": "image"
    }
  ],
  "tags": ["hunting"],
  "location": {
    "lat": 44.7866,
    "lng": 20.4489
  },
  "yt_link": "https://youtube.com/..."
}
```
Response: 201 Created + post object

**POST /api/posts/{id}/like**
Headers: `Authorization: Bearer {token}`
Response: 200 OK

**DELETE /api/posts/{id}/like**
Headers: `Authorization: Bearer {token}`
Response: 200 OK

### Uploads

**POST /api/uploads/sign**
Headers: `Authorization: Bearer {token}`
Body:
```json
{
  "filename": "image.jpg",
  "content_type": "image/jpeg"
}
```
Response:
```json
{
  "upload_url": "https://s3...",
  "public_url": "https://cdn...",
  "fields": {
    "key": "...",
    "policy": "...",
    "signature": "..."
  }
}
```

### Ads

**GET /api/ads?category=Equipment&region=Belgrade&price_min=1000&price_max=5000&search=rifle**
Response:
```json
{
  "data": [
    {
      "id": 1,
      "title": "Hunting Rifle",
      "description": "...",
      "category": "Equipment",
      "region": "Belgrade",
      "price": 50000,
      "contact_phone": "+381...",
      "contact_email": "seller@example.com",
      "images": [
        {
          "url": "https://...",
          "type": "image"
        }
      ],
      "user_id": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**GET /api/ads/{id}**
Response: Ad object

**POST /api/ads**
Headers: `Authorization: Bearer {token}`
Body:
```json
{
  "title": "Hunting Rifle",
  "description": "...",
  "category": "Equipment",
  "region": "Belgrade",
  "price": 50000,
  "contact": "+381...",
  "images": [
    {
      "url": "https://...",
      "type": "image"
    }
  ]
}
```

**POST /api/ads/{id}/favorite**
Headers: `Authorization: Bearer {token}`
Response: 200 OK

**DELETE /api/ads/{id}/favorite**
Headers: `Authorization: Bearer {token}`
Response: 200 OK

### Notifications

**GET /api/notifications**
Headers: `Authorization: Bearer {token}`
Response:
```json
{
  "data": [
    {
      "id": 1,
      "type": "like",
      "title": "New like",
      "message": "User liked your post",
      "read_at": null,
      "data": {
        "post_id": 1
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**PUT /api/notifications/{id}/read**
Headers: `Authorization: Bearer {token}`
Response: 200 OK

**POST /api/notifications/read-all**
Headers: `Authorization: Bearer {token}`
Response: 200 OK

### Search

**GET /api/search?q=hunting**
Response:
```json
{
  "posts": [...],
  "users": [...],
  "ads": [...]
}
```

### Tags

**GET /api/tags?suggest=hunt**
Response:
```json
{
  "data": ["hunting", "hunter", "hunt"]
}
```

### Chats

**GET /api/chats**
Headers: `Authorization: Bearer {token}`
Response:
```json
{
  "data": [
    {
      "id": 1,
      "other_user": {
        "id": 2,
        "name": "Jane Doe",
        "avatar": "https://..."
      },
      "last_message": {
        "content": "Hello",
        "created_at": "2024-01-01T00:00:00Z"
      },
      "unread_count": 2
    }
  ]
}
```

**GET /api/chats/{id}/messages**
Headers: `Authorization: Bearer {token}`
Response:
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "content": "Hello",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**POST /api/chats/{id}/messages**
Headers: `Authorization: Bearer {token}`
Body:
```json
{
  "content": "Hello"
}
```

### WebSocket Events

**Connection**: `wss://api.lovackikutak.rs/ws` or Pusher

**Events**:
- `post.created`: `{ post: {...} }`
- `notification.created`: `{ notification: {...} }`
- `chat.{chat_id}.message`: `{ message: {...} }`

## Project Structure

```
hunting-corner-mobile-app/
├── src/
│   ├── components/       # Reusable components
│   ├── layouts/         # Layout components
│   ├── pages/           # Page components
│   ├── stores/          # Pinia stores
│   ├── services/        # API, WebSocket, storage services
│   ├── utils/           # Utility functions
│   ├── boot/            # Boot files
│   ├── css/             # Global styles
│   ├── router/          # Vue Router
│   ├── App.vue
│   └── main.js
├── tests/
│   └── unit/            # Jest unit tests
├── cypress/
│   └── e2e/             # Cypress E2E tests
├── public/              # Static assets
├── quasar.conf.js       # Quasar config
├── capacitor.config.json # Capacitor config
└── package.json
```

## Deployment

### Web
Build and deploy `dist/` folder to any static hosting.

### Android
1. Build: `npm run build:android`
2. Open Android Studio: `cd src-capacitor/android`
3. Build APK/AAB from Android Studio

### iOS
1. Build: `npm run build:ios`
2. Open Xcode: `cd src-capacitor/ios`
3. Archive and upload to App Store

## License

Private - Hunting Corner Team

