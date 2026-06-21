# iOS Setup Quick Reference

**For detailed information, see [IOS_SETUP.md](./IOS_SETUP.md)**

## Prerequisites Checklist

- [ ] macOS 13+ with Xcode 15+
- [ ] CocoaPods installed (`pod --version`)
- [ ] Physical iOS device (iPhone/iPad) with iOS 14+
- [ ] Apple Developer Account ($99/year)
- [ ] Node.js 16+ and npm installed

---

## 1. Apple Developer Portal Setup (10 minutes)

```bash
# Prerequisites:
# - Apple ID
# - $99 Apple Developer Program enrollment
# - Access to https://developer.apple.com/account/resources/identifiers/list
```

### Create App ID

1. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)
2. Click **Identifiers** → **+** → **App IDs** → **Continue**
3. Select **App** → **Continue**
4. Fill in:
   - **Description:** AI Co-Host
   - **Bundle ID:** `com.airbnb.aicohost`
   - **Check:** Push Notifications capability
5. Click **Continue** → **Register** → **Done**

### Create APNs Key

1. Click **Keys** → **+**
2. Select **Apple Push Notifications service (APNs)** → **Continue**
3. Name: "AI Co-Host APNs Key"
4. Click **Continue** → **Register** → **Download the .p8 file**
5. **Note down:** Key ID and Team ID (shown in portal)

**Important:** Save `.p8` file securely, never commit to Git.

```bash
echo "*.p8" >> .gitignore
```

---

## 2. Firebase Console Setup (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project → Name: "AI Co-Host"
3. Click **Add app** → **iOS**
4. **Bundle ID:** `com.airbnb.aicohost` (must match Apple App ID)
5. Click **Register app**
6. **Download GoogleService-Info.plist**

```bash
echo "GoogleService-Info.plist" >> .gitignore
echo "ios/App/GoogleService-Info.plist" >> .gitignore
```

### Upload APNs Key to Firebase

1. In Firebase, open your iOS app → **Settings** (gear icon)
2. Go to **Cloud Messaging** tab
3. Under **APNs authentication key**, click **Upload**
4. Upload the `.p8` file from step 1
5. Enter **Key ID** and **Team ID** from Apple Developer Portal
6. Click **Upload**

---

## 3. Install Capacitor Packages (2 minutes)

```bash
npm install @capacitor/core @capacitor/ios @capacitor/push-notifications
```

---

## 4. Create/Verify Capacitor Configuration (1 minute)

**File: `/capacitor.config.ts`**

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

---

## 5. Add iOS Platform (5 minutes)

Run on **macOS only**:

```bash
npx cap add ios
npx cap sync ios
```

First `npx cap sync ios` takes 2-5 minutes (CocoaPods downloads Firebase SDK).

---

## 6. Open and Configure in Xcode (10 minutes)

```bash
npx cap open ios
```

### Configure Signing & Capabilities

1. Select **App** target in left navigator
2. Click **Signing & Capabilities** tab
3. Under **Team**, select your Apple Developer account
   - If not visible: **Team** → **Add an Account** → sign in
4. Set **Bundle Identifier** to `com.airbnb.aicohost`
5. Ensure **Automatically manage signing** is enabled

### Add Capabilities

1. Click **+ Capability** button
2. Add **Push Notifications**
3. Click **+ Capability** button again
4. Add **Background Modes** → check **Remote notifications**

### Add GoogleService-Info.plist

1. In Finder, open the `GoogleService-Info.plist` file (downloaded from Firebase)
2. In Xcode, right-click **App** folder → **Add Files to App**
3. Select `GoogleService-Info.plist`
4. Check:
   - **Copy items if needed** ✓
   - **Add to targets: App** ✓
5. Click **Add**

---

## 7. Build Web Assets (3 minutes)

```bash
npm run build
npx cap copy ios
```

---

## 8. Build and Run on Physical Device (5 minutes)

**IMPORTANT:** Push notifications DO NOT work on simulator. Must use physical device.

1. Connect physical iOS device via USB
2. On device: tap **Trust** when prompted
3. In Xcode: Select your device from dropdown (top-left)
4. Press **Play** button or press **Cmd+R**
5. Wait for build to complete (first time: 3-5 minutes)

### Grant Permission

When app launches:
- Tap **Allow** on notification permission dialog
- Check device is registered at `/api/host/devices` endpoint

---

## 9. Send Test Notification (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click your iOS app → **Cloud Messaging**
3. Click **Send your first message**
4. Fill in:
   - **Notification title:** Test Notification
   - **Notification text:** This is a test
5. Click **Send test message** → Select device → **Send**

**Verify on device:**
- If app is open: notification banner appears at top
- If app is closed: notification appears in Notification Center
- Device plays sound and badge increments

---

## 10. Verify End-to-End Flow

- [ ] App builds and runs on physical device
- [ ] Permission dialog appears and user grants permission
- [ ] Device appears in `/api/host/devices` endpoint
- [ ] Test notification sent from Firebase appears on device
- [ ] Notification shows badge, sound, and banner
- [ ] Device receives notifications when app is backgrounded

---

## Common Issues

| Issue | Fix |
|-------|-----|
| "No valid aps-environment" error | Add **Push Notifications** capability in Xcode Signing & Capabilities |
| `GoogleService-Info.plist` not found | Drag file into Xcode project, ensure **Copy items if needed** is checked |
| Notification permission never appears | **Settings** → **General** → **Reset** → **Reset Location & Privacy**, reinstall app |
| App won't build in Xcode | Run `cd ios/App && pod install && cd ../..` |
| Notification not received | Verify: (1) Device in `/api/host/devices`, (2) Permission granted, (3) APNs key uploaded to Firebase |
| Push notifications don't work on simulator | **Use physical device only** — simulator doesn't support push notifications |

---

## Files Changed/Created

```
capacitor.config.ts                       (ALREADY EXISTS - verified)
ios/                                      (NEW directory created by npx cap add ios)
ios/App/App.xcodeproj
ios/App/App.xcworkspace                   (OPEN THIS, not .xcodeproj)
ios/App/GoogleService-Info.plist          (NEW - Firebase config, added to Xcode)
ios/App/Pods/                             (NEW - CocoaPods dependencies)
.gitignore                                (MODIFIED - added *.p8 and GoogleService-Info.plist)
```

---

## Time Estimate

- **First-time setup:** 60-90 minutes
- **Per-developer setup:** 20-30 minutes
- **Rebuild and redeploy:** 5-10 minutes

---

## Next: Backend Integration

Once device registration works:

1. Implement `/api/host/devices/register` endpoint
2. Implement `/api/host/devices/unregister` endpoint
3. Create notification worker to send FCM messages
4. Test guest request → host notification flow

See [IOS_SETUP.md](./IOS_SETUP.md) for detailed walkthrough.

---

## Need More Details?

- **Full setup guide:** [IOS_SETUP.md](./IOS_SETUP.md)
- **Troubleshooting:** [IOS_TROUBLESHOOTING.md](./IOS_TROUBLESHOOTING.md)
- **Architecture overview:** [plan/notification-system.md](./plan/notification-system.md)
