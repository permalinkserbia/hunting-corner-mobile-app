# Environment Variables Troubleshooting

## Issue: "PUSHER_KEY not configured"

If you see this error, it means the environment variables are not being loaded properly.

## Solution

1. **Check your `.env` file** in `/var/www/hunting-corner-mobile-app/.env`:
   ```env
   VUE_APP_API_BASE_URL=https://lovackikutak.rs/api
   VUE_APP_PUSHER_KEY=66cdd20794488bcda4f4
   VUE_APP_PUSHER_CLUSTER=eu
   ```

2. **Restart the dev server**:
   - Stop the current `quasar dev` process (Ctrl+C)
   - Start it again: `quasar dev`
   - Environment variables are loaded when the dev server starts

3. **For production builds**:
   - Make sure `.env` file exists before running `quasar build`
   - Environment variables are baked into the build at build time

## Important Notes

- Environment variables must be prefixed with `VUE_APP_` to be available in the app
- The dev server must be restarted after changing `.env` file
- The `VUE_APP_PUSHER_KEY` must match `PUSHER_APP_KEY` in the backend `.env` file
- The `VUE_APP_PUSHER_CLUSTER` must match `PUSHER_APP_CLUSTER` in the backend `.env` file

## Verification

After restarting, check the browser console. You should see:
- "Pusher connected" (instead of "PUSHER_KEY not configured")
- No WebSocket initialization errors

## If Still Not Working

1. Check that `.env` file is in the root of the mobile app directory
2. Verify the file has no syntax errors (no spaces around `=`)
3. Make sure you're using `VUE_APP_` prefix (not just `PUSHER_KEY`)
4. Try clearing Quasar cache: `rm -rf node_modules/.vite`
5. Rebuild: `quasar build` then `quasar dev`

