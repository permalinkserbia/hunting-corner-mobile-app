# Android Push Notifications Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for Android push notifications.

## Prerequisites

1. Google Firebase account
2. Firebase project created
3. Android app registered in Firebase Console

## Step 1: Firebase Setup

1. Go to https://console.firebase.google.com
2. Create a new project or select existing one
3. Add Android app to your Firebase project:
   - Package name: `rs.lovackikutak.mobile` (check `capacitor.config.json` for exact package name)
   - Download `google-services.json`

## Step 2: Add google-services.json to Android Project

1. Copy the downloaded `google-services.json` file to:
   ```
   /var/www/hunting-corner-mobile-app/android/app/google-services.json
   ```

2. The build.gradle file is already configured to use this file automatically.

## Step 3: Get FCM Server Key

1. In Firebase Console, go to Project Settings
2. Click on "Cloud Messaging" tab
3. Copy the "Server key" (this is your FCM_SERVER_KEY)

## Step 4: Backend Configuration

Add to `/var/www/hunting-corner/.env`:

```env
FCM_SERVER_KEY=your_fcm_server_key_here
```

## Step 5: Run Migrations

```bash
cd /var/www/hunting-corner
php artisan migrate
```

This will create the `device_tokens` table to store FCM tokens.

## Step 6: Rebuild Android App

```bash
cd /var/www/hunting-corner-mobile-app
quasar build
npx cap sync android
cd android
./gradlew clean
./gradlew assembleDebug
```

## Step 7: Test Push Notifications

1. Install the app on an Android device
2. Log in to the app
3. The app will automatically request notification permissions
4. Check backend logs to see if device token was registered:
   ```bash
   cd /var/www/hunting-corner
   tail -f storage/logs/laravel.log
   ```

5. Test by having another user comment on your post - you should receive a push notification

## Troubleshooting

### Notifications not working?

1. **Check Firebase Configuration**:
   - Verify `google-services.json` is in `android/app/` directory
   - Check package name matches in `google-services.json` and `capacitor.config.json`

2. **Check FCM Server Key**:
   - Verify `FCM_SERVER_KEY` is set in backend `.env`
   - Make sure it's the Server Key, not the API Key

3. **Check Device Token Registration**:
   - Check backend logs for "Push token registered with backend"
   - Verify device token is stored in database:
     ```bash
     cd /var/www/hunting-corner
     php artisan tinker
     >>> \App\Models\DeviceToken::all();
     ```

4. **Check Android Logs**:
   ```bash
   adb logcat | grep -i "push\|fcm\|notification"
   ```

5. **Verify Permissions**:
   - Android 13+ requires runtime notification permission
   - The app should request permission on first launch
   - Check Settings > Apps > Your App > Notifications

6. **Test FCM Directly**:
   - Use Firebase Console > Cloud Messaging > Send test message
   - Use the device token from the database
   - If this works, the issue is in the app code
   - If this doesn't work, check Firebase configuration

### Common Issues

**Issue**: "google-services.json not found"
- **Solution**: Make sure the file is in `android/app/google-services.json`

**Issue**: "FCM_SERVER_KEY not configured"
- **Solution**: Add `FCM_SERVER_KEY` to backend `.env` file

**Issue**: "Device token not registered"
- **Solution**: Check that user is logged in and API endpoint `/api/notifications/register` is accessible

**Issue**: "Notifications received but not displayed"
- **Solution**: Check notification permissions in Android Settings

## Testing

### Manual Test

1. Log in as User A
2. Log in as User B on another device
3. User B comments on User A's post
4. User A should receive a push notification

### Check Logs

Backend logs will show:
- Device token registration
- Push notification sending attempts
- FCM API responses

Mobile app console will show:
- Push token registration
- Notification received events
- Any errors

## Next Steps

- Set up iOS push notifications (requires Apple Developer account)
- Configure notification channels for Android (different sounds, priorities)
- Add notification actions (reply, like, etc.)
- Implement notification grouping

