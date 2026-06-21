# iOS Native App Setup Guide

**Last Updated:** 2026-06-19

This guide covers the complete setup process for building and deploying the Airbnb AI Co-Host iOS application using Capacitor and Firebase Cloud Messaging via Apple Push Notification service (APNs).

## Overview

The iOS implementation uses Capacitor to wrap the shared React/TypeScript frontend and integrates Firebase Cloud Messaging (FCM) for push notifications via APNs. Notifications are delivered with high priority to ensure timely guest request alerts.

### Architecture

```
┌─────────────────────────────┐
│   Shared React/TypeScript   │
│   UI (React 18, TypeScript) │
└────────────┬────────────────┘
             │
             │ Capacitor Bridge
             │
┌────────────┴────────────────┐
│                              │
│  Capacitor Native Shell     │
│  ├─ iOS Platform            │
│  ├─ Android Platform        │
│  └─ Push Notifications      │
│      Plugin                 │
│                              │
└────────┬───────────┬────────┘
         │           │
    ┌────▼─┐     ┌───▼────┐
    │ APNs │     │ Backend│
    │Token │     │ API    │
    │Reg.  │     │        │
    └────┬─┘     └───┬────┘
         │           │
         └─────┬─────┘
         Firebase as
         delivery bridge
```

---

## Part 1: Prerequisites and Apple Developer Account Setup

### 1.1 System Requirements

- **macOS 13+** (M1/M2/Intel)
- **Xcode 15+** with iOS SDK 17+
- **CocoaPods 1.12+** (installed via Homebrew or Ruby gem)
- **Physical iOS device** (iPhone/iPad with iOS 14+) — **Push notifications do NOT work on simulator**
- **Apple Developer Account** ($99/year)
- Node.js 16+ and npm/yarn installed

### 1.2 Verify Prerequisites

```bash
# Check Xcode version
xcode-select --version

# Check CocoaPods
pod --version

# Check Node.js
node --version
npm --version
```

### 1.3 Apple Developer Account Setup

1. Visit [Apple Developer Program](https://developer.apple.com/enroll/)
2. Sign in or create an Apple ID
3. Enroll in Apple Developer Program ($99/year)
4. Wait for approval (typically 24 hours)

### 1.4 Create App ID in Apple Developer Portal

1. Navigate to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)
2. Click **Identifiers** → **+** button
3. Select **App IDs** → Click **Continue**
4. Select **App** → Click **Continue**
5. Fill in:
   - **Description:** AI Co-Host
   - **Bundle ID:** `com.airbnb.aicohost` (must match `capacitor.config.ts`)
   - **Capabilities:** Check **Push Notifications**
6. Click **Continue** → **Register** → **Done**

**Note:** The Bundle ID is critical and must match exactly in all subsequent steps.

### 1.5 Create APNs Authentication Key

1. In Apple Developer Portal, navigate to **Keys**
2. Click **+** button to create new key
3. Select **Apple Push Notifications service (APNs)** → Click **Continue**
4. Name the key: "AI Co-Host APNs Key"
5. Click **Continue** → **Register** → **Done**
6. Click the newly created key to view its details
7. **Download** the `.p8` file (save it securely, not in Git)
8. **Note the Key ID** and **Team ID** (visible in the portal)

**Critical:** This key is used only once to upload to Firebase. Keep it secure and never commit to Git.

```bash
# Add to .gitignore
echo "*.p8" >> .gitignore
echo "keys/" >> .gitignore
```

---

## Part 2: Firebase Console Setup for iOS

### 2.1 Create or Select Firebase Project

1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a project** (or select existing)
3. **Project name:** AI Co-Host
4. **Enable Google Analytics:** Optional (recommended for production)
5. Click **Create project**

Wait for the project to initialize (2-3 minutes).

### 2.2 Register iOS App

1. In Firebase Console, click **Add app** → **iOS**
2. **iOS bundle ID:** `com.airbnb.aicohost` (must match Apple App ID and `capacitor.config.ts`)
3. **App nickname (optional):** AI Co-Host iOS
4. **App Store ID:** Leave empty (not needed for this phase)
5. Click **Register app**

### 2.3 Download `GoogleService-Info.plist`

1. After registration, click **Download GoogleService-Info.plist**
2. Save the file securely (will be added to Xcode later)

**Critical:** Never commit `GoogleService-Info.plist` to Git. Add to `.gitignore`:

```bash
echo "GoogleService-Info.plist" >> .gitignore
echo "ios/App/GoogleService-Info.plist" >> .gitignore
```

### 2.4 Upload APNs Authentication Key to Firebase

1. In Firebase Console, click your iOS app → **Settings** (gear icon)
2. Navigate to **Cloud Messaging** tab
3. Under **iOS app configuration**, scroll to **APNs authentication key**
4. Click **Upload** button
5. Upload the `.p8` file downloaded earlier
6. Enter:
   - **Key ID:** From Apple Developer Portal
   - **Team ID:** From Apple Developer Portal
7. Click **Upload**

Firebase now has the authentication credentials to send notifications via APNs.

### 2.5 Enable Cloud Messaging

Verify that Cloud Messaging is enabled for the iOS app (it should be enabled by default).

---

## Part 3: Install Capacitor and Required Packages

### 3.1 Install Core Capacitor Packages

If not already installed, install the Capacitor core and iOS-specific packages:

```bash
npm install @capacitor/core @capacitor/ios @capacitor/push-notifications
```

**Package versions** (as of 2026-06):
- `@capacitor/core`: 6.x
- `@capacitor/ios`: 6.x
- `@capacitor/push-notifications`: 6.x

Verify installation:

```bash
npm ls @capacitor/core @capacitor/ios @capacitor/push-notifications
```

### 3.2 Verify Capacitor Configuration

Ensure `capacitor.config.ts` exists in your project root with the correct settings:

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

**Key configuration notes:**

- `appId`: **Must** match iOS Bundle ID from Apple Developer Portal and Firebase (`com.airbnb.aicohost`)
- `appName`: Display name shown in iOS home screen and app switcher
- `webDir`: Next.js static export directory (default: `out`)
- `presentationOptions`: How to display foreground notifications (badge, sound, alert)

---

## Part 4: Capacitor iOS Platform Setup

### 4.1 Add iOS Platform

Initialize iOS platform:

```bash
npx cap add ios
```

This creates:
- `ios/` — Complete iOS Xcode project
- `ios/App/App.xcodeproj` — Xcode project file
- `ios/App/Pods/` — CocoaPods dependencies (created after first sync)

**Note:** This must be run on macOS.

### 4.2 Sync Capacitor Platform

After adding iOS platform, sync web assets:

```bash
npx cap sync ios
```

This command:
- Copies `webDir` assets to `ios/App/public/`
- Updates iOS native configuration
- Installs Capacitor plugins via CocoaPods

**First-time note:** This may take 2-5 minutes on first run as CocoaPods downloads Firebase SDK (~500MB).

### 4.3 Verify iOS Project Structure

After sync, verify the following directories exist:

```
ios/
├── App/
│   ├── App.xcodeproj
│   ├── App.xcworkspace              (OPEN THIS, not .xcodeproj)
│   ├── Pods/
│   │   ├── FirebaseMessaging/
│   │   ├── FirebaseCore/
│   │   └── ...
│   ├── public/                      (web assets copied here)
│   │   └── index.html
│   ├── Podfile
│   └── Podfile.lock
└── Podfile
```

---

## Part 5: Xcode Configuration

### 5.1 Open Xcode Project

```bash
npx cap open ios
```

Or manually:

```bash
open ios/App/App.xcworkspace
```

**Important:** Open `.xcworkspace`, not `.xcodeproj` (the workspace includes CocoaPods dependencies).

### 5.2 Configure Signing & Capabilities

1. In Xcode, select the **App** target in the left navigator
2. Click the **Signing & Capabilities** tab
3. Under **Team**, select your Apple Developer Team:
   - If not visible, click **Team** → **Add an Account** → Sign in with Apple ID
4. Set **Bundle Identifier** to `com.airbnb.aicohost` (must match Apple Developer Portal)
5. Ensure **Automatically manage signing** is enabled (default)

**Note:** Xcode will create or update provisioning profiles automatically.

### 5.3 Add Push Notifications Capability

1. Click **+ Capability** button
2. Search for **Push Notifications**
3. Click to add **Push Notifications** capability
4. Verify it appears in the Capabilities list

### 5.4 Add Background Modes Capability

1. Click **+ Capability** button
2. Search for **Background Modes**
3. Click to add **Background Modes**
4. Check **Remote notifications** checkbox

This allows the app to handle notifications that arrive while the app is in the background.

### 5.5 Place GoogleService-Info.plist

1. In Finder, locate the `GoogleService-Info.plist` file downloaded from Firebase (Part 2.3)
2. In Xcode, right-click the **App** target → **Add Files to App**
3. Select `GoogleService-Info.plist`
4. Ensure:
   - **Copy items if needed** is checked
   - **Add to targets** has **App** selected
5. Click **Add**

Xcode will add the file to the project. Verify it appears in the file navigator.

### 5.6 Verify Build Settings

1. Select the **App** target
2. Click **Build Settings** tab
3. Search for **Swift Language** and ensure it's set to a version compatible with Capacitor (typically Swift 5.5+)
4. Search for **iOS Deployment Target** and verify it's set to 14.0 or higher

---

## Part 6: Building and Testing on Device

### 6.1 Connect Physical iOS Device

1. Connect your iOS device to your Mac via USB cable
2. On your device, tap **Trust** when prompted
3. In Xcode, verify your device appears in the device selector (top-left, next to the Run button)

### 6.2 Build Web Assets

```bash
npm run build
```

This creates optimized static assets in `out/` directory.

### 6.3 Sync Capacitor Assets

```bash
npx cap copy ios
```

This copies the web assets to the iOS app.

### 6.4 Build and Run on Device

In Xcode:

1. Select your physical device from the device selector (top-left)
2. Click the **Play** button (or press Cmd+R)
3. Xcode builds the app and deploys it to your device

**First-time build:** 3-5 minutes (Xcode compiles all dependencies)

**Subsequent builds:** 30-60 seconds (incremental compilation)

### 6.5 Grant Notification Permission

1. When the app launches, an alert appears asking to allow notifications
2. Tap **Allow** to grant notification permission
3. Check backend logs or `/api/host/devices` endpoint to confirm device was registered

**Note:** If the permission dialog doesn't appear, the app may have been denied permission in a previous run. Reset app permissions:

1. **Settings** → **General** → **Reset** → **Reset Location & Privacy**
2. Reinstall app: Press and hold app icon → **Remove App** → **Delete App** → Reinstall

### 6.6 Test on Physical Device

Once the app is running and permission is granted:

1. Navigate to notification settings in the app (your app's UI)
2. Tap **Enable Notifications** (or equivalent button)
3. The device should register with Firebase and post the FCM token to `/api/host/devices`

**Expected flow:**

```
✓ Notification permission granted
✓ Device registered with FCM
✓ FCM token posted to /api/host/devices/register
✓ Device appears in host device list
✓ Ready to receive push notifications
```

---

## Part 7: Sending Test Notifications

### 7.1 Send Test Notification via Firebase Console

Use Firebase Console to send a test notification without building a backend:

1. In Firebase Console, navigate **Cloud Messaging** → **Send your first message**
2. Fill in:
   - **Notification title:** Test Notification
   - **Notification text:** This is a test from Firebase
   - **Data field (optional):**
     ```json
     {
       "type": "guest_request",
       "route": "/host/requests/test-123"
     }
     ```
3. Click **Send test message**
4. Select your iOS app and device
5. Click **Send**

### 7.2 Verify Notification Received

**When app is in foreground:**
- Notification appears as a banner at the top of the screen (due to `presentationOptions` config)
- Badge number increments on app icon
- Sound plays

**When app is in background:**
- Notification appears in Notification Center
- Badge number increments on app icon
- Sound plays
- Tapping notification opens app and routes to specified URL

**When app is closed:**
- Notification appears in Notification Center
- Badge number increments on app icon
- Sound plays
- Tapping notification launches app and routes to specified URL

---

## Part 8: How the Code Works

### 8.1 CapacitorNotificationClient

The `CapacitorNotificationClient` is the bridge between the React app and native push notification handling.

**File:** `/lib/notifications/capacitor-notification-client.ts`

When `register()` is called:

```typescript
async register(): Promise<void> {
  await PushNotifications.register()
  this.attachListeners()
}
```

On iOS:
1. The Capacitor PushNotifications plugin requests notification permission (if not already granted)
2. iOS presents the permission dialog
3. If user taps **Allow**, permission is granted
4. The plugin registers with APNs and receives an APNs device token
5. The plugin exchanges the APNs token with Firebase for an FCM token
6. The `registration` event fires with the FCM token
7. The app posts the token to `/api/host/devices/register`

### 8.2 Foreground Notification Handling

When a notification arrives while the app is in the foreground on iOS:

1. The system normally suppresses the notification banner
2. Because `capacitor.config.ts` specifies `presentationOptions: ['badge', 'sound', 'alert']`, the Capacitor plugin configures the native UNUserNotificationCenter delegate
3. The OS displays the notification banner, plays sound, and increments badge
4. The app's `pushNotificationReceived` listener is called
5. The `CapacitorNotificationClient` handles the notification (typically a no-op, since the OS already displayed it)

### 8.3 Background and Closed App Handling

When a notification arrives while the app is in background or closed:

1. iOS receives the remote notification via APNs
2. iOS displays the notification in Notification Center with badge, sound, and vibration
3. When the user taps the notification:
   - iOS launches the app (if closed) or brings it to foreground (if in background)
   - The Capacitor plugin delivers the notification to the `pushNotificationReceived` listener
   - The app extracts the `route` from the notification data
   - The app navigates to that route using React Router

### 8.4 Token Management

When the APNs token or FCM token rotates:

1. APNs may issue a new device token (e.g., after device update or token expiration)
2. Firebase detects the new token and fires the `registration` event
3. The app automatically posts the new token to `/api/host/devices/register`
4. The backend creates a new device record or updates the existing one (idempotent operation)

No manual intervention is needed. The token rotation is handled automatically.

---

## Part 9: Deep Linking Configuration

### 9.1 Deep Link Overview

When a user taps a notification while the app is running, closed, or in the background, a deep link route should open the specific guest request.

**Example flow:**

```
1. Backend sends FCM notification with data:
   {
     "route": "/host/requests/req-12345"
   }

2. User taps notification

3. iOS launches/resumes app

4. Capacitor passes route to app via pushNotificationReceived listener

5. React Router navigates to /host/requests/req-12345

6. Host sees guest request details
```

### 9.2 Deep Link Handling in React

The `CapacitorNotificationClient` extracts the route and calls `config.onNavigate(route)`.

Ensure this is wired to your React Router in the app initialization:

**Example** (in your Next.js app or React initialization):

```typescript
import { notificationClientFactory } from '@/lib/notifications/notification-client-factory'
import { useRouter } from 'next/navigation'

export function AppInitializer() {
  const router = useRouter()
  
  useEffect(() => {
    const notificationClient = notificationClientFactory.create({
      onNavigate: (route: string) => {
        router.push(route)
      },
    })
    
    notificationClient.register()
  }, [])
  
  return null
}
```

### 9.3 Notification Deep Link Data

Ensure your FCM payload includes the route in the data section:

```json
{
  "notification": {
    "title": "New Guest Request",
    "body": "Room 204: Air conditioner problem"
  },
  "data": {
    "type": "guest_request",
    "requestId": "req-12345",
    "route": "/host/requests/req-12345"
  }
}
```

---

## Part 10: Security Considerations

### 10.1 Do NOT Commit Sensitive Files

Add these to `.gitignore` if not already present:

```bash
# Apple keys and certificates
*.p8
*.cer
*.mobileprovision
*.pem

# Firebase configuration
GoogleService-Info.plist
ios/App/GoogleService-Info.plist

# Xcode build artifacts
ios/App/Pods/
ios/App/Podfile.lock
ios/App/build/
```

**Verify:**

```bash
git status
```

Should NOT show any `.p8`, `.cer`, `.mobileprovision`, or `GoogleService-Info.plist` files.

### 10.2 Secrets Management

- **APNs Key (.p8):** Store in secure location, never commit
- **Firebase service account key:** Only needed on backend (if using Firebase Admin SDK)
- **Bundle ID:** Public knowledge, safe to commit
- **Team ID:** Public knowledge, safe to commit
- **Key ID:** Public knowledge, safe to commit (Firebase needs it to correlate with key)

### 10.3 Notification Token Handling

- Never log full FCM tokens in production
- Tokens should only be sent over HTTPS to `/api/host/devices/register`
- Backend should store tokens securely and never expose them in public APIs
- Rotate tokens if a device is compromised

---

## Part 11: Troubleshooting

### Issue: Notification permission never requested

**Cause:** Already granted or denied in a previous app install.

**Solution:**

1. **Settings** → **General** → **Reset** → **Reset Location & Privacy**
2. Reinstall the app

### Issue: Xcode build fails with CocoaPods error

**Error:**
```
Podfile.lock: No such file or directory
```

**Solution:**

```bash
cd ios/App
pod install
cd ../..
npx cap sync ios
```

### Issue: GoogleService-Info.plist not found

**Error:**
```
Could not locate configuration file: GoogleService-Info.plist
```

**Cause:** File not added to Xcode project or in wrong location.

**Solution:**

1. Download `GoogleService-Info.plist` from Firebase Console again
2. In Xcode, drag the file into the **App** folder in the navigator
3. Ensure **Copy items if needed** is checked and target is **App**
4. Rebuild: Cmd+R

### Issue: "No valid aps-environment" entitlement

**Error:**
```
No valid aps-environment entitlement for Push Notifications
```

**Cause:** Push Notifications capability not added to Signing & Capabilities.

**Solution:**

1. In Xcode, select **App** target
2. Click **Signing & Capabilities**
3. Click **+ Capability**
4. Add **Push Notifications**
5. Rebuild: Cmd+R

### Issue: Push notifications not received on device

**Checklist:**

- [ ] Device is registered (check `/api/host/devices` endpoint)
- [ ] Notification permission is granted (**Settings** → **Notifications** → **AI Cohost** → Allow)
- [ ] Firebase project has the APNs key uploaded (Project Settings → Cloud Messaging → iOS app)
- [ ] `GoogleService-Info.plist` is correctly placed in Xcode project
- [ ] Bundle ID matches everywhere:
  - [ ] `capacitor.config.ts`
  - [ ] Apple Developer Portal App ID
  - [ ] Firebase iOS app registration
  - [ ] Xcode project Signing & Capabilities
- [ ] FCM token was posted to backend (check backend logs)
- [ ] Backend correctly sends to registered token (check Firebase Cloud Messaging logs)

### Issue: Foreground notifications not showing

**Cause:** `presentationOptions` not configured or notification permission denied.

**Solution:**

1. Verify `capacitor.config.ts` includes:
   ```typescript
   plugins: {
     PushNotifications: {
       presentationOptions: ['badge', 'sound', 'alert'],
     },
   }
   ```
2. Run `npx cap sync ios`
3. Rebuild: Cmd+R
4. Verify notification permission is granted on device

### Issue: Deep link not opening

**Cause:** Route not in notification data or app not configured to handle routes.

**Solution:**

1. Verify FCM payload includes `route` in data section:
   ```json
   {
     "data": {
       "route": "/host/requests/req-123"
     }
   }
   ```
2. Verify React Router is configured and can navigate to the route:
   ```bash
   # Test in browser
   http://localhost:3000/host/requests/req-123
   ```
3. Verify `onNavigate` callback is configured when creating notification client
4. Check Xcode console for errors: Cmd+Shift+Y (open Console)

---

## Part 12: Building for Production

### 12.1 Pre-Build Checklist

Before building for production:

- [ ] `capacitor.config.ts` has correct `appId` matching Apple App ID and Firebase
- [ ] `GoogleService-Info.plist` is in Xcode project (not committed to Git)
- [ ] APNs authentication key is uploaded to Firebase
- [ ] Push Notifications and Background Modes capabilities enabled
- [ ] Signing & Capabilities configured with your Apple Developer Team
- [ ] All automated tests passing
- [ ] Backend API endpoints are production URLs
- [ ] Firebase project is production-ready
- [ ] Notification permission request is working on device

### 12.2 Create App Store Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **My Apps**
3. Click **+ Create an app**
4. Select **iOS** → **App**
5. Fill in:
   - **App Name:** AI Cohost
   - **Primary Language:** English
   - **Bundle ID:** Select or create `com.airbnb.aicohost`
   - **SKU:** (your internal ID)
6. Click **Create**

### 12.3 Build Release App

In Xcode:

1. Select **App** target
2. Select **Product** → **Scheme** → **Edit Scheme**
3. Select **Run** → Set **Build Configuration** to **Release**
4. Close dialog
5. Select **Product** → **Build** (Cmd+B)

Or via command line:

```bash
npm run build
npx cap copy ios
npx cap open ios
# Then in Xcode: Product → Build
```

### 12.4 Archive and Upload to App Store

In Xcode:

1. Select **Product** → **Archive**
2. Wait for build to complete
3. Xcode opens Organizer window
4. Select the latest archive
5. Click **Distribute App**
6. Choose **App Store Connect** → **Upload**
7. Follow prompts to upload build

---

## Part 13: iOS Simulator Limitations

**Important:** Push notifications do NOT work on the iOS Simulator.

- FCM tokens cannot be obtained on simulator
- APNs tokens are not issued on simulator
- Test notifications will not appear on simulator

**Always test on physical device.**

If you need to test without a physical device:
- Use cloud device services (e.g., Appetize.io, BrowserStack)
- Mock the notification client in development to simulate receiving notifications

---

## Part 14: Environment Variables and Configuration

### 14.1 Backend API Configuration

Ensure your Next.js app connects to the correct backend API:

**.env.local (local development):**

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=https://localhost:3000
```

**.env.production (production):**

```
NEXT_PUBLIC_API_URL=https://api.aicohost.com
NEXT_PUBLIC_APP_URL=https://app.aicohost.com
```

### 14.2 Firebase Configuration (Web)

Firebase Web configuration is embedded in your frontend. Ensure it's configured correctly in your app initialization.

### 14.3 Capacitor Configuration for Different Environments

**capacitor.config.ts:**

```typescript
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID || 'com.airbnb.aicohost',
  appName: process.env.CAPACITOR_APP_NAME || 'AI Cohost',
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

## Part 15: Manual Setup Checklist

Use this checklist to verify all manual steps are complete:

### Apple Developer Account

- [ ] Apple Developer Account created
- [ ] Team ID available (https://developer.apple.com/account/)
- [ ] App ID registered with Bundle ID `com.airbnb.aicohost`
- [ ] App ID has Push Notifications capability enabled

### Apple Developer Keys

- [ ] APNs authentication key created
- [ ] `.p8` key file downloaded and stored securely
- [ ] Key ID noted
- [ ] Team ID confirmed

### Firebase Setup

- [ ] Firebase project created
- [ ] iOS app registered with Bundle ID `com.airbnb.aicohost`
- [ ] `GoogleService-Info.plist` downloaded
- [ ] APNs authentication key uploaded to Firebase
- [ ] Key ID and Team ID entered in Firebase
- [ ] Cloud Messaging enabled

### Capacitor Setup

- [ ] `@capacitor/core`, `@capacitor/ios`, `@capacitor/push-notifications` installed
- [ ] `capacitor.config.ts` created with correct `appId: 'com.airbnb.aicohost'`
- [ ] `npx cap add ios` run successfully
- [ ] `npx cap sync ios` run successfully

### Xcode Configuration

- [ ] Xcode 15+ installed
- [ ] `ios/App/App.xcworkspace` opens without errors
- [ ] Team selected in Signing & Capabilities
- [ ] Bundle Identifier set to `com.airbnb.aicohost`
- [ ] **Push Notifications** capability added
- [ ] **Background Modes > Remote notifications** capability added
- [ ] `GoogleService-Info.plist` added to Xcode project
- [ ] CocoaPods dependencies installed (Pods/ directory exists)

### Testing

- [ ] Physical iOS device connected via USB
- [ ] App builds and runs on physical device
- [ ] Notification permission dialog appears on first launch
- [ ] Permission granted
- [ ] Device appears in `/api/host/devices` endpoint
- [ ] Test notification sent from Firebase Console received on device
- [ ] Device shows badge, plays sound, displays banner
- [ ] Tapping notification navigates to correct route

### .gitignore Updates

- [ ] `*.p8` ignored (APNs keys)
- [ ] `GoogleService-Info.plist` ignored
- [ ] `ios/App/Pods/` ignored (CocoaPods dependencies)
- [ ] `ios/App/Podfile.lock` optionally ignored (best to commit for reproducibility)
- [ ] `.env` and environment files ignored (if not already)

---

## Part 16: Next Steps

After completing this setup:

1. **Implement Backend Device Registration Endpoints** — Create `/api/host/devices/register` and `/api/host/devices/unregister` to persist device tokens
2. **Implement Notification Delivery** — Create backend worker to send FCM messages when guest requests are created
3. **Test on Physical Device** — Verify end-to-end notification flow from guest request to host notification
4. **Configure Android** — Similar setup for Capacitor Android if needed (see [ANDROID_SETUP.md](./ANDROID_SETUP.md))
5. **Prepare for App Store Release** — Build release version, create App Store listing, submit for review
6. **Set Up Escalation** — Implement automatic escalation if host doesn't acknowledge within timeout

---

## References

- [Capacitor Documentation](https://capacitorjs.com)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/plugins/push-notifications)
- [Firebase Cloud Messaging (iOS via APNs)](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server)
- [Xcode Help](https://help.apple.com/xcode/)
- [Apple Developer Account Help](https://developer.apple.com/support/)
- [App Store Connect](https://appstoreconnect.apple.com/)

---

**Document Status:** Complete and ready for Phase 5 implementation.

**Last Reviewed:** 2026-06-19
