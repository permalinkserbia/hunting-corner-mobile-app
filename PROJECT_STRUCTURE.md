# Project Structure

```
hunting-corner-mobile-app/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI/CD
├── cypress/
│   └── e2e/
│       ├── create-post.cy.js     # E2E test: create post flow
│       └── login.cy.js           # E2E test: login flow
├── public/
│   └── favicon.ico               # App favicon
├── src/
│   ├── boot/
│   │   ├── axios.js              # Axios boot file
│   │   └── capacitor.js          # Capacitor native features boot
│   ├── components/
│   │   ├── PostCard.vue          # Post card component
│   │   └── QBubble.vue           # Chat bubble component
│   ├── css/
│   │   └── app.scss              # Global styles
│   ├── layouts/
│   │   ├── AuthLayout.vue        # Auth pages layout
│   │   └── MainLayout.vue       # Main app layout with bottom nav
│   ├── pages/
│   │   ├── AdCreate.vue          # Create ad page
│   │   ├── AdDetail.vue          # Ad detail page
│   │   ├── Ads.vue               # Ads listing page
│   │   ├── ChatDetail.vue        # Chat conversation page
│   │   ├── ChatList.vue          # Chat list page
│   │   ├── Login.vue              # Login page
│   │   ├── Notifications.vue      # Notifications page
│   │   ├── PostCreate.vue        # Create post page
│   │   ├── Profile.vue           # User profile page
│   │   ├── Register.vue          # Registration page
│   │   ├── Search.vue             # Global search page
│   │   ├── Settings.vue           # Settings page
│   │   ├── Timeline.vue          # Timeline/feed page
│   │   └── UserProfile.vue       # Other user profile page
│   ├── router/
│   │   └── index.js              # Vue Router configuration
│   ├── services/
│   │   ├── api.js                # Axios API service with interceptors
│   │   ├── cache.js              # IndexedDB cache service
│   │   ├── offline-queue.js      # Offline request queue
│   │   ├── push-notifications.js # Push notifications service
│   │   ├── storage.js            # Secure storage (Capacitor/localforage)
│   │   ├── upload.js             # File upload service
│   │   └── websocket.js          # WebSocket/Pusher service
│   ├── stores/
│   │   ├── ads.js                # Ads Pinia store
│   │   ├── auth.js               # Authentication Pinia store
│   │   ├── network.js            # Network status store
│   │   ├── notifications.js      # Notifications store
│   │   └── posts.js              # Posts store
│   ├── utils/
│   │   ├── date.js               # Date formatting utilities
│   │   ├── image.js              # Image compression utilities
│   │   ├── tags.js               # Tag suggestions utilities
│   │   └── validators.js         # Form validation utilities
│   ├── App.vue                   # Root component
│   └── main.js                   # App entry point
├── tests/
│   └── unit/
│       ├── CreatePostForm.spec.js # Unit test: PostCreate
│       └── PostCard.spec.js       # Unit test: PostCard
├── .editorconfig                 # Editor configuration
├── .eslintrc.js                  # ESLint configuration
├── .gitignore                    # Git ignore rules
├── .prettierrc                   # Prettier configuration
├── babel.config.js               # Babel configuration
├── capacitor.config.json         # Capacitor configuration
├── cypress.config.js             # Cypress configuration
├── jest.config.js                # Jest configuration
├── index.html                    # HTML entry point
├── package.json                  # NPM dependencies and scripts
├── quasar.conf.js                # Quasar framework configuration
└── README.md                      # Project documentation
```

## Key Features Implemented

- ✅ Authentication (JWT with refresh tokens)
- ✅ Secure storage (Capacitor Storage / localforage)
- ✅ API service with automatic token refresh
- ✅ WebSocket real-time updates
- ✅ Timeline with infinite scroll
- ✅ Post creation with media upload
- ✅ Ads listing and creation
- ✅ Notifications (in-app + push)
- ✅ Search functionality
- ✅ Chat/messaging
- ✅ Offline support with caching
- ✅ Image compression
- ✅ Draft autosave
- ✅ Unit tests (Jest)
- ✅ E2E tests (Cypress)
- ✅ CI/CD (GitHub Actions)
- ✅ ESLint + Prettier

