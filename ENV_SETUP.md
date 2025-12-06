# Environment Variables Setup for Notifications

To enable notifications (comments, likes, new ads) in the mobile app, you need to configure the following environment variables.

## Backend (.env file in `/var/www/hunting-corner`)

Add these to your Laravel `.env` file:

```env
# Broadcasting Configuration
BROADCAST_DRIVER=pusher

# Pusher Configuration
# Get these from https://dashboard.pusher.com/apps
PUSHER_APP_ID=your_pusher_app_id
PUSHER_APP_KEY=your_pusher_app_key
PUSHER_APP_SECRET=your_pusher_app_secret
PUSHER_APP_CLUSTER=eu
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
```

## Mobile App (.env file in `/var/www/hunting-corner-mobile-app`)

Create a `.env` file in the mobile app root directory with:

```env
# API Configuration
VUE_APP_API_BASE_URL=https://lovackikutak.rs/api

# Pusher Configuration (same values as backend PUSHER_APP_KEY and PUSHER_APP_CLUSTER)
VUE_APP_PUSHER_KEY=your_pusher_app_key
VUE_APP_PUSHER_CLUSTER=eu
```

## Steps to Set Up

1. **Create Pusher Account** (if you don't have one):
   - Go to https://pusher.com
   - Sign up for a free account
   - Create a new app
   - Choose "eu" cluster (or your preferred cluster)

2. **Backend Setup**:
   ```bash
   cd /var/www/hunting-corner
   
   # Install Pusher PHP SDK (if not already installed)
   composer require pusher/pusher-php-server
   
   # Add Pusher credentials to .env file
   # Copy PUSHER_APP_ID, PUSHER_APP_KEY, PUSHER_APP_SECRET, PUSHER_APP_CLUSTER from Pusher dashboard
   
   # Clear config cache
   php artisan config:clear
   ```

3. **Mobile App Setup**:
   ```bash
   cd /var/www/hunting-corner-mobile-app
   
   # Create .env file (if it doesn't exist)
   cp .env.example .env  # or create manually
   
   # Add VUE_APP_PUSHER_KEY and VUE_APP_PUSHER_CLUSTER
   # Use the same PUSHER_APP_KEY and PUSHER_APP_CLUSTER from backend .env
   
   # Rebuild the app
   quasar build
   npx cap sync android
   ```

4. **Test the Setup**:
   - Make sure both backend and mobile app have the same Pusher credentials
   - The mobile app should automatically connect when a user logs in
   - Check browser console (or Android logcat) for connection messages
   - Try commenting on a post - the post owner should receive a notification

## Troubleshooting

### Notifications not working?

1. **Check Pusher Dashboard**:
   - Go to https://dashboard.pusher.com
   - Check "Debug Console" to see if events are being sent
   - Verify your app is receiving events

2. **Check Backend Logs**:
   ```bash
   cd /var/www/hunting-corner
   tail -f storage/logs/laravel.log
   ```
   Look for Pusher-related errors

3. **Check Mobile App Console**:
   - Open browser DevTools (for web) or Android Logcat (for Android)
   - Look for WebSocket connection messages
   - Check for authentication errors

4. **Verify Environment Variables**:
   - Make sure `VUE_APP_PUSHER_KEY` matches `PUSHER_APP_KEY` in backend
   - Make sure `VUE_APP_PUSHER_CLUSTER` matches `PUSHER_APP_CLUSTER` in backend
   - Make sure `VUE_APP_API_BASE_URL` points to your backend API

5. **Check Authentication**:
   - User must be logged in for notifications to work
   - Private channels require authentication
   - Check that `/api/broadcasting/auth` endpoint is accessible

6. **Clear Caches**:
   ```bash
   # Backend
   php artisan config:clear
   php artisan cache:clear
   
   # Mobile app - rebuild
   quasar build
   ```

## Important Notes

- The Pusher app key and cluster must match between backend and mobile app
- Private channels (like `private-user.{id}`) require authentication
- The backend must have the broadcasting auth endpoint configured (already done in `routes/api.php`)
- Make sure `BROADCAST_DRIVER=pusher` in backend `.env`

