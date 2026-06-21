# iOS Troubleshooting Guide

**Last Updated:** 2026-06-19

This guide covers common issues encountered during iOS setup and provides step-by-step solutions.

---

## Section 1: Installation and Configuration Issues

### Issue 1.1: Xcode not found

**Error:**
```
xcode-select: error: unable to find utility
Command 'xcode-select' not found
```

**Cause:** Xcode not installed or command-line tools not configured.

**Solution:**

Install Xcode from App Store:

```bash
# Or via Apple App Store (recommended)
# Search for "Xcode" in App Store and click Install

# Verify installation
xcode-select --version
# Output: xcode-select version 2379.

# If needed, select Xcode path
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

---

### Issue 1.2: CocoaPods not installed

**Error:**
```
Command 'pod' not found
```

**Cause:** CocoaPods not installed.

**Solution:**

```bash
# Install via Homebrew
brew install cocoapods

# Or install via Ruby gem
sudo gem install cocoapods

# Verify
pod --version
# Output: 1.12.1 (or similar)
```

---

### Issue 1.3: `npx cap add ios` fails

**Error:**
```
Error: Unable to create native platforms directory. Is there a capacitor.config.ts in the root?
```

**Cause:** `capacitor.config.ts` missing or invalid.

**Solution:**

1. Verify `capacitor.config.ts` exists in project root:

```bash
ls -la capacitor.config.ts
```

2. Verify it's valid TypeScript:

```typescript
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.airbnb.aicohost',
  appName: 'AI Cohost',
  webDir: 'out',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
```

3. Re-run:

```bash
npx cap add ios
```

---

## Section 2: Capacitor Sync Issues

### Issue 2.1: `npx cap sync ios` times out

**Error:**
```
CocoaPods integration error: Timeout waiting for response
```

**Cause:** CocoaPods taking too long to download Firebase SDK (~500MB), network issues, or disk space.

**Solution:**

1. Check disk space:

```bash
df -h
# Need at least 2GB free space
```

2. Kill any running CocoaPods processes:

```bash
killall pod
```

3. Clear CocoaPods cache:

```bash
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/Library/Developer/Xcode/DerivedData
```

4. Re-run sync:

```bash
npx cap sync ios
```

5. If still timing out, manually install pods:

```bash
cd ios/App
pod install
cd ../..
npx cap sync ios
```

---

### Issue 2.2: CocoaPods dependency conflict

**Error:**
```
[!] CocoaPods could not find compatible versions for pod "Firebase":
```

**Cause:** CocoaPods version mismatch or conflicting dependencies.

**Solution:**

1. Update CocoaPods:

```bash
sudo gem update cocoapods
```

2. Clear and reinstall pods:

```bash
cd ios/App
rm -rf Pods/ Podfile.lock
pod install
cd ../..
npx cap sync ios
```

---

## Section 3: Xcode Configuration Issues

### Issue 3.1: App won't open in Xcode

**Error:**
```
Unable to open App.xcworkspace: No such file or directory
```

**Cause:** Xcode workspace not created by `npx cap add ios`.

**Solution:**

1. Verify `ios/App/` directory exists:

```bash
ls -la ios/App/
```

2. Re-run Capacitor iOS add:

```bash
npx cap remove ios
npx cap add ios
npx cap sync ios
```

3. Open workspace (not project):

```bash
open ios/App/App.xcworkspace
```

---

### Issue 3.2: "No valid aps-environment" entitlement error

**Error:**
```
No valid aps-environment entitlement for Push Notifications
```

**Cause:** Push Notifications capability not added to Signing & Capabilities.

**Solution:**

1. In Xcode, select **App** target in left navigator
2. Click **Signing & Capabilities** tab
3. Click **+ Capability** button
4. Search for **Push Notifications**
5. Click to add
6. Verify it appears in the Capabilities list
7. Rebuild: Cmd+R

---

### Issue 3.3: Bundle ID mismatch

**Error:**
```
Code Sign error: No provisioning profile found for bundle identifier
```

**Cause:** Bundle ID in Xcode doesn't match Apple Developer Portal, Firebase, or `capacitor.config.ts`.

**Solution:**

Verify all four locations have identical Bundle ID:

1. **capacitor.config.ts:**
   ```typescript
   appId: 'com.airbnb.aicohost'
   ```

2. **Apple Developer Portal:**
   - Go to [Identifiers](https://developer.apple.com/account/resources/identifiers/list)
   - App ID should be `com.airbnb.aicohost`

3. **Firebase Console:**
   - Click iOS app → Bundle ID should be `com.airbnb.aicohost`

4. **Xcode Signing & Capabilities:**
   - Select **App** target
   - **Bundle Identifier** should be `com.airbnb.aicohost`

If any mismatch, update Xcode and re-sync:

```bash
# Update Xcode project
npx cap sync ios

# Or manually in Xcode:
# Select App target → Build Settings → Bundle Identifier → set to com.airbnb.aicohost
```

---

### Issue 3.4: Team not appearing in Signing & Capabilities

**Error:**
```
Signing & Capabilities → Team → No team available
```

**Cause:** Apple Developer Account not linked to Xcode.

**Solution:**

1. In Xcode, click **Xcode** → **Preferences**
2. Click **Accounts** tab
3. Click **+** to add account
4. Sign in with Apple ID (the one enrolled in Apple Developer Program)
5. Wait for account to load
6. Close Preferences
7. In App target → **Signing & Capabilities** → **Team** dropdown should now show your team

---

## Section 4: GoogleService-Info.plist Issues

### Issue 4.1: GoogleService-Info.plist not found at runtime

**Error:**
```
Could not locate configuration file: GoogleService-Info.plist
```

**Cause:** File not added to Xcode project or in wrong location.

**Solution:**

1. **Download fresh copy:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click iOS app → **Download GoogleService-Info.plist**

2. **Add to Xcode:**
   - In Xcode, right-click **App** folder in navigator
   - Select **Add Files to App**
   - Select `GoogleService-Info.plist`
   - Verify:
     - **Copy items if needed** is checked ✓
     - **Add to targets: App** is selected ✓
   - Click **Add**

3. **Verify placement:**
   - In Xcode, verify `GoogleService-Info.plist` appears under **App** folder
   - In Finder: `ios/App/GoogleService-Info.plist` should exist

4. Rebuild: Cmd+R

---

### Issue 4.2: Wrong GoogleService-Info.plist (wrong Firebase project)

**Error:**
```
FCM token generation fails
App receives notifications from wrong Firebase project
```

**Cause:** `GoogleService-Info.plist` is for different Firebase project.

**Solution:**

1. Verify Firebase project matches:
   - In `GoogleService-Info.plist`, check the PROJECT_ID
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Verify you're in the correct project
   - Look at URL: `https://console.firebase.google.com/project/<PROJECT_ID>`

2. If wrong project:
   - Go to correct Firebase project
   - Click iOS app
   - Download correct `GoogleService-Info.plist`
   - Replace file in Xcode (delete old, add new)

---

## Section 5: APNs Key Issues

### Issue 5.1: APNs authentication key not uploaded to Firebase

**Error:**
```
APNs not configured in Firebase
Notifications sent but not delivered to device
```

**Cause:** `.p8` APNs key not uploaded to Firebase Cloud Messaging settings.

**Solution:**

1. In [Apple Developer Portal](https://developer.apple.com/account/resources/keys/list):
   - Go to **Keys**
   - Find your APNs key
   - Download the `.p8` file (if you don't have it, create a new key)

2. In [Firebase Console](https://console.firebase.google.com/):
   - Click iOS app → **Settings** (gear icon)
   - Go to **Cloud Messaging** tab
   - Under **APNs authentication key**, click **Upload**
   - Upload the `.p8` file
   - Enter **Key ID** (from Apple Developer Portal)
   - Enter **Team ID** (from Apple Developer Portal)
   - Click **Upload**

3. Test: Send notification via Firebase Console

---

### Issue 5.2: Wrong Key ID or Team ID in Firebase

**Error:**
```
APNs authentication failed
Invalid credentials
```

**Cause:** Key ID or Team ID entered incorrectly in Firebase.

**Solution:**

1. Get correct values from [Apple Developer Portal](https://developer.apple.com/account/resources/keys/list):
   - Click your APNs key
   - **Key ID:** 8-character alphanumeric ID at top right
   - **Team ID:** In top right of portal (next to your name)

2. In Firebase Console:
   - Click iOS app → **Settings** → **Cloud Messaging**
   - Update **Key ID** and **Team ID** with correct values
   - Click **Save**

---

## Section 6: Permission and Registration Issues

### Issue 6.1: Notification permission dialog never appears

**Error:**
```
App launches, no "Allow Notifications?" dialog
```

**Cause:** Permission already granted or denied in previous install.

**Solution:**

1. Reset privacy settings on device:
   - **Settings** → **General** → **Reset** → **Reset Location & Privacy**
   - Device will reboot
   
2. Uninstall app:
   - Press and hold app icon → **Remove App** → **Delete App**

3. Reinstall app in Xcode:
   - Cmd+R

4. When app launches, permission dialog should appear

---

### Issue 6.2: User tapped "Don't Allow" on permission dialog

**Error:**
```
Permission denied
App never asks again
No notifications received
```

**Cause:** User tapped "Don't Allow" on initial permission dialog.

**Solution:**

Device level:
- **Settings** → **Notifications** → Find **AI Cohost** → Enable notifications

Or reset privacy (see Issue 6.1).

---

### Issue 6.3: Device not registered (token not posted to backend)

**Error:**
```
Device doesn't appear in /api/host/devices
No notifications received
```

**Cause:** Permission denied, app crashed, or backend endpoint not working.

**Checklist:**

1. **Permission granted?**
   - **Settings** → **Notifications** → **AI Cohost** → Enabled?

2. **App registered successfully?**
   - Check app console output: `npx cap open ios` then Cmd+Shift+Y
   - Look for "Registration successful" or "Token: ..."
   - Any errors related to Firebase or registration?

3. **Backend endpoint working?**
   - Test manually:
     ```bash
     curl -X POST http://localhost:3000/api/host/devices/register \
       -H "Content-Type: application/json" \
       -d '{
         "token": "test-token-12345",
         "platform": "ios",
         "app_type": "native"
       }'
     ```
   - Check response and backend logs

4. **If still failing:**
   - Check Xcode console for errors: Cmd+Shift+Y
   - Look for Firebase or network errors
   - Verify backend is running and accessible from device (same network)

---

## Section 7: Push Notification Delivery Issues

### Issue 7.1: Notification not received on device

**Comprehensive Checklist:**

```
Device & App Setup:
- [ ] Physical iOS device (not simulator)
- [ ] iOS 14+ installed on device
- [ ] App installed and running
- [ ] Notification permission granted (Settings → Notifications)
- [ ] Device in same network as backend (or backend publicly accessible)

Registration:
- [ ] Device appears in /api/host/devices endpoint
- [ ] FCM token visible in device record (not in logs)
- [ ] Token last_seen_at is recent

Firebase Setup:
- [ ] Firebase project contains iOS app
- [ ] APNs authentication key uploaded (Project Settings → Cloud Messaging)
- [ ] Key ID and Team ID entered correctly
- [ ] GoogleService-Info.plist is for this Firebase project

Backend:
- [ ] Backend sends FCM message to correct token
- [ ] FCM API returns successful response
- [ ] Backend logs show "Notification sent to token: ..."
- [ ] No errors in Firebase Cloud Messaging logs

Network:
- [ ] Device connected to internet (cellular or WiFi)
- [ ] Device not in airplane mode
- [ ] Device not in Do Not Disturb mode
- [ ] App not force-quit
```

**If all above pass, issue is likely in notification payload format. Verify:**

```bash
# Check Firebase Cloud Messaging documentation
# Payload should be valid FCM format:
{
  "notification": {
    "title": "Title",
    "body": "Body"
  },
  "data": {
    "route": "/host/requests/123"
  }
}
```

---

### Issue 7.2: Notification received but not displayed

**Error:**
```
Notification delivered but doesn't appear on device screen
No sound, no badge, no banner
```

**Cause:** `presentationOptions` not configured or notification permission denied.

**Solution:**

1. Verify `capacitor.config.ts`:

```typescript
plugins: {
  PushNotifications: {
    presentationOptions: ['badge', 'sound', 'alert'],
  },
}
```

2. Sync Capacitor:

```bash
npx cap sync ios
```

3. Rebuild in Xcode: Cmd+R

4. Verify notification permission is granted:
   - **Settings** → **Notifications** → **AI Cohost** → Enabled

5. Test again: Send notification via Firebase Console

---

### Issue 7.3: Badge not incrementing

**Error:**
```
Notification received, sound plays, banner shows
But app badge (red number) doesn't increment
```

**Cause:** Badge not specified in `presentationOptions`.

**Solution:**

Verify `presentationOptions` includes `badge`:

```typescript
presentationOptions: ['badge', 'sound', 'alert']
```

Rebuild: Cmd+R

---

## Section 8: Deep Linking Issues

### Issue 8.1: Notification tapped but app doesn't navigate

**Error:**
```
Notification tapped
App opens but doesn't navigate to request
User sees home screen instead of request details
```

**Cause:** Deep link data not in notification payload, or navigation not configured.

**Solution:**

1. **Verify notification payload includes route:**

```json
{
  "notification": {
    "title": "New Guest Request"
  },
  "data": {
    "route": "/host/requests/req-123"
  }
}
```

2. **Verify React Router can navigate to route:**
   - Test in browser: `http://localhost:3000/host/requests/req-123`
   - Should load request page without errors

3. **Verify app initialization wires up navigation callback:**

```typescript
import { notificationClientFactory } from '@/lib/notifications/notification-client-factory'
import { useRouter } from 'next/navigation'

export function AppInitializer() {
  const router = useRouter()
  
  useEffect(() => {
    const notificationClient = notificationClientFactory.create({
      onNavigate: (route: string) => {
        console.log('Navigating to:', route)
        router.push(route)
      },
    })
    
    notificationClient.register()
  }, [])
  
  return null
}
```

4. **Check Xcode console for errors:**
   - Cmd+Shift+Y to open Console
   - Look for "Navigating to:" log
   - Look for "Cannot find route" or navigation errors

---

## Section 9: Build and Compilation Issues

### Issue 9.1: Xcode build fails with architecture errors

**Error:**
```
ld: symbol(s) not found for architecture arm64
Building for iOS Simulator, but linking against dylib built for iOS + iOS Simulator
```

**Cause:** Incorrect architecture or framework mismatch (simulator vs. device).

**Solution:**

1. **Ensure building for device, not simulator:**
   - Top-left in Xcode: Device selector should show your device, not "iPhone Simulator"

2. **Clean build cache:**
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

3. **Rebuild:**
   - Cmd+Shift+K (Clean Build Folder)
   - Cmd+B (Build)

---

### Issue 9.2: Xcode build takes very long

**Error:**
```
Build running...
Still running after 10+ minutes
```

**Cause:** First build includes downloading all Firebase dependencies via CocoaPods.

**Solution:**

- **First build:** 5-15 minutes normal (downloading ~500MB Firebase SDK)
- **Subsequent builds:** 30-60 seconds (incremental)
- **If extremely slow:** Check internet speed, disk I/O, CPU usage

Can't be avoided on first build. First build is always slow.

---

## Section 10: Simulator Limitations

### Issue 10.1: Push notifications don't work on simulator

**Error:**
```
App runs on simulator
No notification permission request
No FCM token generated
Can't send notifications
```

**Cause:** iOS Simulator doesn't support push notifications.

**Solution:**

**ALWAYS test on physical device.** There is no workaround.

Options if you don't have physical device:
- Borrow device from colleague
- Use cloud device service:
  - Appetize.io (cloud simulator with limited capability)
  - BrowserStack (real devices in cloud)
- Mock notification client for testing:

```typescript
// In development environment, mock the notification client
if (process.env.NODE_ENV === 'development' && !isNativeApp) {
  // Use mock notification client that simulates receiving notifications
  window.simulateNotification = (title: string, data: any) => {
    // Handle as if notification was received
  }
}
```

---

## Section 11: Network and Backend Issues

### Issue 11.1: App can't reach backend API from device

**Error:**
```
Device registration fails
Error: Cannot reach backend API
Network timeout
```

**Cause:** Device can't access backend (wrong URL, backend not running, firewall).

**Solution:**

1. **Verify backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   # Should return 200 OK
   ```

2. **Check device can reach backend:**
   - On iOS device, open Safari
   - Navigate to backend URL
   - Should load without errors

3. **Verify backend URL in app configuration:**
   - Check `.env.local` or app initialization
   - `NEXT_PUBLIC_API_URL` should be accessible from device

4. **If on different network:**
   - Use machine's actual IP instead of `localhost`:
     ```bash
     # Get machine IP
     ifconfig | grep "inet " | grep -v 127.0.0.1
     # E.g., 192.168.1.100
     
     # Update app to use: http://192.168.1.100:3000
     ```

---

### Issue 11.2: Backend doesn't receive device registration

**Error:**
```
Device appears to register (no error)
But doesn't show up in /api/host/devices
```

**Cause:** Request reaches backend but device record not created (DB issue, auth, or endpoint not implemented).

**Solution:**

1. **Check backend logs:**
   - Look for `POST /api/host/devices/register` request
   - Check if request has correct authorization header

2. **Test endpoint manually:**
   ```bash
   curl -X POST http://localhost:3000/api/host/devices/register \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "token": "test-token-12345",
       "platform": "ios",
       "app_type": "native"
     }'
   ```

3. **Check database:**
   - Query device table for token
   - Verify record created with correct host_id

4. **Verify device registration is implemented:**
   - Check if `/api/host/devices/register` endpoint exists
   - Check if it saves to database
   - Check auth is working

---

## Section 12: Debugging Techniques

### Enable Xcode Console Logging

```bash
# Open Xcode
npx cap open ios

# Run app
Cmd+R

# Open Console
Cmd+Shift+Y

# Filter for app logs
(in Console, search for "aicohost" or "firebase")
```

### Check Firebase Debug Logging

Enable Firebase debug logging in app initialization:

```typescript
import { initializeApp } from 'firebase/app'

// Enable debug logging
enableLogging(true)

const app = initializeApp(firebaseConfig)
```

### Check Device Settings

```
Settings → Privacy & Security → Notifications → AI Cohost
- Notifications: Enabled or Disabled?
- Allow Notifications: Check if enabled
- Lock Screen: Check if showing
- Notification Center: Check if showing
- Sounds: Check if enabled
- Badges: Check if enabled
```

### Reset Notification State

If notifications mysteriously stop working:

```bash
# Reset all notification settings
Settings → General → Reset → Reset Location & Privacy

# OR

# Reinstall app
Press and hold app → Remove App → Delete App
npm run build
npx cap copy ios
npx cap run ios
```

---

## Section 13: Getting Help

### When debugging, collect:

1. **iOS version:** Settings → General → About → iOS version
2. **App version:** In Xcode, select App target → General → Version
3. **Xcode Console output:** Cmd+Shift+Y (copy full log)
4. **Firebase console logs:** Project Settings → Cloud Messaging → check request logs
5. **Backend logs:** grep for device registration requests
6. **GoogleService-Info.plist validation:**
   ```bash
   # Verify file is valid plist
   plutil -p GoogleService-Info.plist
   ```

### Resources

- [Capacitor iOS Troubleshooting](https://capacitorjs.com/docs/ios/troubleshooting)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Apple Push Notification Debugging](https://developer.apple.com/documentation/usernotifications/handling_notifications_and_notification_related_actions)
- [Xcode Help](https://help.apple.com/xcode/)

---

**Last Updated:** 2026-06-19
