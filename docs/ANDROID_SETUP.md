# Android Native App Setup Guide

**Last Updated:** 2026-06-19

This guide covers the complete setup process for building and deploying the Airbnb AI Co-Host Android application using Capacitor and Firebase Cloud Messaging.

## Overview

The Android implementation uses Capacitor to wrap the shared React/TypeScript frontend and integrates Firebase Cloud Messaging (FCM) for push notifications. Notifications are delivered with a high-importance channel to ensure timely guest request alerts.

### Architecture

```
┌─────────────────────────────────┐
│   Shared React/TypeScript UI    │
│   (React 18, TypeScript, Zod)   │
└────────────┬────────────────────┘
             │
             │ Capacitor Bridge
             │
┌────────────┴────────────────────┐
│                                  │
│  Capacitor Native Shell         │
│  ├─ Android Platform            │
│  ├─ iOS Platform                │
│  └─ Push Notifications Plugin   │
│                                  │
└────────┬───────────────┬────────┘
         │               │
    ┌────▼─┐         ┌───▼────┐
    │ FCM  │         │ Backend│
    │Token │         │ API    │
    │Reg.  │         │        │
    └────┬─┘         └───┬────┘
         │               │
         └───────┬───────┘
              Sync via
         Device Registration
              Endpoint
```

---

## Part 1: Install Capacitor and Required Packages

### 1.1 Install Core Capacitor Packages

Install the Capacitor core and Android-specific packages into the root of your Next.js project:

```bash
npm install @capacitor/core @capacitor/android @capacitor/push-notifications
```

**Package versions** (as of 2026-06):
- `@capacitor/core`: 6.x
- `@capacitor/android`: 6.x
- `@capacitor/push-notifications`: 6.x

Verify installation:

```bash
npm ls @capacitor/core @capacitor/android @capacitor/push-notifications
```

### 1.2 Create Capacitor Configuration

Create a new file in your project root:

**File: `/capacitor.config.ts`**

```typescript
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.aicohost.app',
  appName: 'AI Co-Host',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
```

**Key configuration notes:**

- `appId`: Must match Firebase Android app package name (e.g., `com.aicohost.app`)
- `appName`: Display name shown in Android launcher
- `webDir`: Next.js static export directory (default: `out`)
- `androidScheme`: Use `https` for deep linking
- `presentationOptions`: How to display foreground notifications (badge, sound, alert)

### 1.3 Initialize Capacitor

Initialize Capacitor in your project:

```bash
npx cap init
```

When prompted:
- **App name:** AI Co-Host
- **App ID:** com.aicohost.app (must match Firebase)
- **Directory of web assets:** out
- **Build web assets before deploying:** yes

This creates:
- `capacitor.config.ts` (already created above)
- `ios/` and `android/` platform directories

### 1.4 Add Android Platform

If the `android/` directory was not created, add the Android platform explicitly:

```bash
npx cap add android
```

This creates:
- `android/` — Complete Android Gradle project
- `android/app/build.gradle` — App-level build configuration
- `android/build.gradle` — Project-level build configuration
- `android/app/src/main/AndroidManifest.xml`

**Note:** The Android directory must be opened in Android Studio for signing and deployment setup (see **Part 5: App Signing**).

---

## Part 2: Firebase Console Setup for Android

### 2.1 Create or Select Firebase Project

1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a project** (or select existing)
3. **Project name:** AI Co-Host
4. **Enable Google Analytics:** Optional (recommended for production)
5. Click **Create project**

Wait for the project to initialize (2-3 minutes).

### 2.2 Register Android App

1. In the Firebase Console, click **Add app** → **Android**
2. **Android package name:** `com.aicohost.app` (must match `capacitor.config.ts`)
3. **App nickname (optional):** AI Co-Host Android
4. Leave **Debug signing certificate SHA-1** empty for now (we will update this after creating signing keys in Part 5)
5. Click **Register app**

### 2.3 Download `google-services.json`

1. After registration, click **Download google-services.json**
2. Place the file in your Android app directory:

```
android/app/google-services.json
```

**CRITICAL:** Never commit `google-services.json` to Git. Add to `.gitignore`:

```bash
echo "android/app/google-services.json" >> .gitignore
```

**Verify placement:**

```bash
ls -la android/app/google-services.json
```

### 2.4 Enable Cloud Messaging

1. In Firebase Console, navigate to **Cloud Messaging** tab
2. Note the **Sender ID** (you may need this for manual testing)
3. Verify that push notifications are enabled for the Android app

---

## Part 3: Gradle Configuration for Firebase

### 3.1 Add Google Services Plugin to Project-Level build.gradle

Edit: `android/build.gradle`

```gradle
buildscript {
  ext {
    gradlePluginVersion = '7.3.1'
  }
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath 'com.android.tools.build:gradle:7.3.1'
    classpath 'com.google.gms:google-services:4.3.15'
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
  }
}
```

### 3.2 Apply Google Services Plugin in App-Level build.gradle

Edit: `android/app/build.gradle`

Add at the **top** of the file (before `plugins {}` block if present):

```gradle
plugins {
  id 'com.android.application'
  id 'com.google.gms.google-services'
}

android {
  compileSdk 34
  
  // ... rest of android configuration
}

dependencies {
  // Firebase
  implementation 'com.google.firebase:firebase-bom:32.7.0'
  implementation 'com.google.firebase:firebase-messaging'
  
  // Capacitor and related
  implementation 'androidx.activity:activity:1.7.2'
  implementation 'androidx.appcompat:appcompat:1.6.1'
  
  // ... other dependencies
}
```

**BOM Version Note:** Firebase BOM version `32.7.0` (or latest stable) automatically pins compatible versions of Firebase libraries. Check [Firebase BOM versions](https://firebase.google.com/docs/android/setup#available-libraries).

### 3.3 Verify Gradle Sync

Sync Gradle in Android Studio:

1. Open `android/` directory in Android Studio
2. **File** → **Sync Now**
3. Wait for Gradle sync to complete (first time: 2-5 minutes)
4. Verify **Build** output shows no errors

---

## Part 4: Android Platform Setup

### 4.1 Sync Capacitor Platform

After creating `capacitor.config.ts` and adding the Android platform, sync the web assets:

```bash
npx cap sync android
```

This command:
- Copies `webDir` assets to `android/app/src/main/assets/public/`
- Updates Android native configuration
- Installs Capacitor plugins

**First-time note:** This may prompt you to update Gradle. Allow the update.

### 4.2 Verify Android Project Structure

After sync, verify the following directories exist:

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── assets/
│   │   │   │   └── public/       (web assets copied here)
│   │   │   └── java/
│   │   │       └── com/
│   │   │           └── aicohost/
│   │   │               └── app/
│   │   │                   ├── MainActivity.java
│   │   │                   └── MainActivity.kt
│   │   └── ...
│   ├── build.gradle
│   └── google-services.json
├── build.gradle
└── gradle/
```

### 4.3 Android Studio Configuration

Open the Android project in Android Studio:

```bash
open -a "Android Studio" android/
```

Or manually:
1. Launch Android Studio
2. **File** → **Open** → select `android/` directory
3. Wait for Gradle to sync

### 4.4 Update AndroidManifest.xml (if needed)

Verify `android/app/src/main/AndroidManifest.xml` includes the following permissions:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.aicohost.app">

    <!-- Notification permission (required on Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Internet permission for Firebase and API calls -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Optional: Wake lock for background operations -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:debuggable="false">
        
        <activity
            android:name="com.aicohost.app.MainActivity"
            android:label="@string/title_activity_main"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale"
            android:exported="true">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Deep linking support -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="app.aicohost.com"
                    android:pathPrefix="/" />
            </intent-filter>
        </activity>

        <!-- Firebase Services -->
        <service
            android:name="com.google.firebase.messaging.FirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

**Key permissions explained:**

| Permission | Purpose | Android Level |
|------------|---------|---------------|
| `POST_NOTIFICATIONS` | Send notifications to user | 13+ |
| `INTERNET` | Network access for FCM and API | All |
| `WAKE_LOCK` | Keep CPU awake for background work | All (optional) |

---

## Part 5: App Signing (Debug and Release)

### 5.1 Create Debug Keystore

Android requires all apps to be signed. Create a debug keystore for local development:

```bash
keytool -genkey -v -keystore android/app/debug.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias androiddebugkey -storepass android -keypass android \
  -dname "CN=Debug, O=AI Co-Host, L=Local, ST=Dev, C=US"
```

This creates `android/app/debug.keystore` with:
- **Alias:** `androiddebugkey`
- **Store password:** `android`
- **Key password:** `android`

**Add to .gitignore:**

```bash
echo "android/app/*.keystore" >> .gitignore
```

### 5.2 Get Debug Signing Certificate SHA-1

Extract the SHA-1 fingerprint needed for Firebase:

```bash
keytool -list -v -keystore android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android | grep SHA1
```

**Output example:**

```
SHA1: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12
```

Copy this fingerprint.

### 5.3 Register Debug Certificate in Firebase

1. In Firebase Console, open your Android app settings
2. Click the **Settings** tab (gear icon)
3. Scroll to **Your apps** → **Android apps**
4. In the Android app row, click the **three-dot menu** → **Edit**
5. Paste the SHA-1 fingerprint in **Debug signing certificate SHA-1**
6. Click **Save**

Firebase will use this to validate API calls from your debug app.

### 5.4 Configure Gradle Signing (for Release)

For production releases, create a release keystore and configure Gradle. Edit `android/app/build.gradle`:

```gradle
android {
  compileSdk 34
  
  // ... other config ...
  
  signingConfigs {
    debug {
      keystore file('debug.keystore')
      keyAlias 'androiddebugkey'
      keyPassword 'android'
      storePassword 'android'
    }
    
    release {
      keystore file("${project.rootDir}/keystore.jks")
      keyAlias System.getenv('RELEASE_KEY_ALIAS') ?: 'release-key'
      keyPassword System.getenv('RELEASE_KEY_PASSWORD') ?: ''
      storePassword System.getenv('RELEASE_STORE_PASSWORD') ?: ''
    }
  }
  
  buildTypes {
    debug {
      signingConfig signingConfigs.debug
    }
    
    release {
      signingConfig signingConfigs.release
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
```

**For production releases:**

1. Generate a release keystore (keep this file **secure and not committed to Git**)
2. Store passwords in environment variables or secure CI/CD secrets
3. Never commit `keystore.jks` or passwords to Git

---

## Part 6: Android Notification Channel Configuration

### 6.1 Notification Channel Overview

The AI Co-Host Android app creates a high-importance notification channel named **"guest-requests"** for urgent guest request alerts.

**Channel properties:**

| Property | Value | Reason |
|----------|-------|--------|
| Channel ID | `guest-requests` | Unique identifier for the channel |
| Channel Name | Guest Requests | User-visible name in Settings |
| Importance | 5 (IMPORTANCE_HIGH) | Ensures notification bypasses Do Not Disturb |
| Visibility | 1 (VISIBILITY_PUBLIC) | Content visible on lock screen |
| Sound | default | Uses system notification sound |
| Vibration | enabled | Device vibrates when notification arrives |

### 6.2 Channel Creation in Code

The channel is automatically created by `CapacitorNotificationClient` when the app registers for push notifications.

**File:** `/lib/notifications/capacitor-notification-client.ts` (already implemented)

```typescript
const GUEST_REQUESTS_CHANNEL = {
  id: 'guest-requests',
  name: 'Guest Requests',
  description: 'High-priority alerts for incoming guest requests',
  importance: 5, // IMPORTANCE_HIGH
  visibility: 1, // VISIBILITY_PUBLIC
  vibration: true,
  sound: 'default',
} as const
```

When `CapacitorNotificationClient.register()` is called:

```typescript
async register(): Promise<void> {
  await PushNotifications.createChannel(GUEST_REQUESTS_CHANNEL)
  this.attachListeners()
  await PushNotifications.register()
}
```

### 6.3 Notification Channel User Control

Users can modify channel settings in Android Settings:

1. **Settings** → **Apps & notifications** → **Notifications**
2. Find **AI Co-Host**
3. Tap **Guest Requests** channel
4. Modify:
   - Sound
   - Vibration
   - Importance
   - Show notifications

**Note:** The app respects user preferences. High importance allows notifications to sound/vibrate even in silent or Do Not Disturb mode, but users can always disable or mute a channel.

### 6.4 Understanding High-Importance Channels

**Why IMPORTANCE_HIGH?**

- Guest requests require immediate host attention
- High importance allows notifications to bypass certain quiet hours
- Does not override user's explicit "app muted" setting
- Complies with Android notification best practices

**What it enables:**

- Sound and vibration even in Do Not Disturb mode (in most cases)
- Persistent notification icon in status bar
- Large notification heads-up display
- User control via Settings

**What it does NOT do:**

- Override user's explicit channel mute
- Bypass system battery-saver restrictions
- Send notifications if app permission is denied

---

## Part 7: Push Notification Testing

### 7.1 Test on Physical Device

#### Prerequisites

- Physical Android device running Android 7.0+
- Device connected to development machine via USB
- USB debugging enabled on device
- `adb` command-line tools installed

#### Enable USB Debugging

1. **Settings** → **About phone** → Tap **Build number** 7 times
2. Back to **Settings** → **Developer options** → Enable **USB Debugging**
3. Connect device via USB
4. In Android Studio, verify device appears:

```bash
adb devices
```

**Output:**

```
List of attached devices
ABC123DEF456 device
```

#### Build and Deploy to Device

```bash
# Build Next.js production assets
npm run build

# Copy assets to Android
npx cap copy android

# Build Android app and deploy to connected device
npx cap run android
```

This opens the app on your connected device.

#### Register Device for Notifications

1. Open the app on your device
2. Navigate to notification settings (in your app's UI)
3. Tap **Enable Notifications**
4. When prompted, grant **Notification permission**
5. The device will register with FCM and post token to backend

**Expected flow:**

```
✓ Notification permission granted
✓ Device registered with FCM
✓ FCM token posted to /api/host/devices/register
✓ Device appears in host device list
✓ Ready to receive push notifications
```

### 7.2 Test on Android Emulator

If you don't have a physical device, test using the Android Emulator.

#### Create Emulator

In Android Studio:

1. **Tools** → **Virtual Device Manager**
2. Click **Create device**
3. Select **Pixel 6** (or similar)
4. Select **API level 33 or higher** (for Android 13+ notifications)
5. Complete device creation

#### Launch Emulator

```bash
emulator -avd Pixel_6_API_33
```

#### Verify Google Play Services

The emulator must include Google Play Services for FCM to work.

In emulator settings:
1. Open **Google Play Store** on emulator
2. Accept terms
3. Back in Android Studio: **Emulator** → verify **Google Play** is installed

#### Build and Deploy to Emulator

```bash
npm run build
npx cap copy android
npx cap run android
```

**Note:** First build to emulator takes 2-5 minutes.

### 7.3 Send Test Notification via Firebase Console

Use Firebase Console to send a test notification without building a backend.

#### Send a Test Message

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
4. Select your app and device
5. Click **Send**

#### Verify Notification Received

- Physical device or emulator receives notification
- Device vibrates and plays sound
- Notification appears in notification drawer
- Tapping notification should trigger deep link handling (if configured)

### 7.4 Troubleshooting Notification Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Permission dialog never appears | Already granted or denied in past | Clear app data: **Settings** → **Apps** → **AI Co-Host** → **Clear Storage** |
| Permission denied | User tapped "Don't Allow" | User must re-enable in **Settings** → **Apps** → **Permissions** → **Notifications** |
| Notification not received | Token not registered | Check backend logs for device registration |
| Notification not displayed in app | Wrong notification channel | Verify channel ID in FCM payload matches `guest-requests` |
| Notification appears but doesn't open request | Deep link route incorrect | Check URL scheme matches `capacitor.config.ts` |
| "Google Play Services not available" | Emulator lacks Google Play | Use emulator image with Google Play included or physical device |

---

## Part 8: Deep Linking Configuration

### 8.1 Deep Link Overview

When a user taps a notification while the app is running, closed, or in the background, a deep link route should open the specific guest request.

**Example flow:**

```
1. Backend sends FCM notification with data:
   {
     "route": "/host/requests/req-12345"
   }

2. User taps notification (app is in background)

3. Android system launches/resumes app

4. Capacitor passes route to app via onNavigate callback

5. React Router navigates to /host/requests/req-12345

6. Host sees guest request details
```

### 8.2 Deep Link URL Scheme

Configure your app's URL scheme in `AndroidManifest.xml`:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="https"
        android:host="app.aicohost.com"
        android:pathPrefix="/" />
</intent-filter>
```

This allows URLs like:
- `https://app.aicohost.com/host/requests/123`

### 8.3 Notification Deep Link Data

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

### 8.4 Deep Link Handling in React

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

---

## Part 9: Troubleshooting

### Missing google-services.json

**Error:**

```
Gradle: Plugin with id 'com.google.gms.google-services' not found
```

**Solution:**

1. Verify `google-services.json` is in `android/app/`
2. Verify `com.google.gms:google-services` is in `android/build.gradle`
3. Sync Gradle: **File** → **Sync Now**

### Wrong Package Name

**Error:**

```
E/FirebaseMessaging: Failed to retrieve the Firebase Instance ID Token
```

**Cause:** Package name in `capacitor.config.ts` does not match Firebase Android app registration.

**Solution:**

1. Check `capacitor.config.ts`:
   ```typescript
   appId: 'com.aicohost.app'
   ```
2. Verify Firebase Console → Android app → package name matches
3. Rebuild and redeploy:
   ```bash
   npx cap sync android
   npx cap run android
   ```

### Notification Permission Denied

**Issue:** Notification permission dialog appears, user taps "Don't Allow".

**Solution:**

1. On device: **Settings** → **Apps** → **AI Co-Host** → **Permissions** → **Notifications** → Enable
2. Or uninstall and reinstall app to reset permission state

### Notification Not Appearing

**Checklist:**

- [ ] Device is registered (check `/api/host/devices` endpoint)
- [ ] Notification channel "guest-requests" exists (should be created on first register)
- [ ] Channel is not muted in **Settings** → **Apps** → **AI Co-Host** → **Guest Requests**
- [ ] Firebase project has Google Services API enabled
- [ ] `google-services.json` is correctly placed in `android/app/`
- [ ] FCM token was posted to backend (check backend logs)
- [ ] Backend correctly sends to registered token (check Firebase logs)

### Gradle Sync Fails

**Error:** `Gradle sync failed`

**Solution:**

1. Verify Google Services version in `android/build.gradle`:
   ```gradle
   classpath 'com.google.gms:google-services:4.3.15'
   ```
2. Verify Firebase BOM version in `android/app/build.gradle`:
   ```gradle
   implementation 'com.google.firebase:firebase-bom:32.7.0'
   ```
3. Clean Gradle cache:
   ```bash
   cd android && ./gradlew clean
   cd ..
   ```
4. Sync again in Android Studio: **File** → **Sync Now**

### App Crashes on Startup

**Error:** App crashes immediately after opening.

**Solution:**

1. Check logcat for errors:
   ```bash
   adb logcat | grep -i "aicohost\|error"
   ```
2. Verify all Capacitor plugins are installed:
   ```bash
   npm ls @capacitor/core @capacitor/push-notifications
   ```
3. Verify `capacitor.config.ts` exists and is valid TypeScript
4. Rebuild:
   ```bash
   npm run build
   npx cap sync android
   npx cap run android
   ```

### Deep Link Not Opening

**Issue:** Tapping notification doesn't navigate to request.

**Checklist:**

- [ ] `AndroidManifest.xml` includes intent-filter with deep link scheme
- [ ] FCM payload includes `route` in data section
- [ ] `notificationClientFactory.create()` is called with `onNavigate` callback
- [ ] React Router is configured and can navigate to `/host/requests/:id`

**Debug:**

```bash
adb logcat | grep -i "deep\|route\|navigate"
```

---

## Part 10: Building for Production

### 10.1 Pre-Build Checklist

Before building for production:

- [ ] `capacitor.config.ts` has correct `appId` matching Firebase
- [ ] `google-services.json` is in `android/app/`
- [ ] Release keystore is created (not committed to Git)
- [ ] Release certificate SHA-1 is registered in Firebase
- [ ] Environment variables are set:
  ```bash
  export RELEASE_KEY_ALIAS=release-key
  export RELEASE_KEY_PASSWORD=<secure-password>
  export RELEASE_STORE_PASSWORD=<secure-password>
  ```
- [ ] Backend API endpoints are production URLs
- [ ] Firebase project is production-ready

### 10.2 Build APK for Local Testing

```bash
npm run build
npx cap copy android
cd android
./gradlew assembleDebug
cd ..
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

Deploy to device:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 10.3 Build Release APK

```bash
npm run build
npx cap copy android
cd android
./gradlew assembleRelease
cd ..
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

### 10.4 Build Release App Bundle (for Play Store)

```bash
cd android
./gradlew bundleRelease
cd ..
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

Upload to Google Play Console for distribution.

### 10.5 Signing and Verification

Verify app signature:

```bash
jarsigner -verify -verbose -certs \
  android/app/build/outputs/apk/release/app-release.apk
```

Check APK signing details:

```bash
keytool -printcert -jarfile \
  android/app/build/outputs/apk/release/app-release.apk
```

---

## Part 11: Environment Variables and Configuration

### 11.1 Backend API Configuration

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

### 11.2 Firebase Configuration (Web)

Firebase Web configuration is embedded in your frontend. Ensure it's configured correctly:

**lib/notifications/firebase-admin.ts (Backend only):**

Backend-only Firebase Admin SDK configuration is handled via environment variables (not accessible from frontend).

**Frontend Firebase (for Web/PWA):**

Configured in your Next.js initialization, separate from Firebase Admin SDK.

### 11.3 Capacitor Configuration for Different Environments

**capacitor.config.ts:**

```typescript
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID || 'com.aicohost.app',
  appName: process.env.CAPACITOR_APP_NAME || 'AI Co-Host',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: process.env.CAPACITOR_SERVER_URL,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
```

---

## Part 12: Versioning and Updates

### 12.1 Version Management

Edit `android/app/build.gradle`:

```gradle
android {
  compileSdk 34
  
  defaultConfig {
    applicationId "com.aicohost.app"
    minSdk 24
    targetSdk 34
    versionCode 1
    versionName "1.0.0"
  }
}
```

- **versionCode:** Incrementing integer (required for Play Store updates)
- **versionName:** Semantic version string (shown to users)

**Increment before release:**

```gradle
versionCode 2
versionName "1.0.1"
```

### 12.2 Handling Notification Token Rotation

FCM may issue new tokens. The app handles this automatically:

1. Device receives new token from FCM
2. `CapacitorNotificationClient` detects `registration` event
3. Posts new token to `/api/host/devices/register`
4. Backend updates or creates new device record

No manual intervention needed.

---

## Part 13: Manual Setup Checklist

Use this checklist to verify all manual steps are complete:

### Firebase Setup

- [ ] Firebase project created
- [ ] Android app registered with correct package name
- [ ] `google-services.json` downloaded
- [ ] `google-services.json` placed in `android/app/`
- [ ] Cloud Messaging enabled
- [ ] Debug certificate SHA-1 registered in Firebase
- [ ] Release certificate SHA-1 registered for production

### Capacitor Setup

- [ ] `@capacitor/core`, `@capacitor/android`, `@capacitor/push-notifications` installed
- [ ] `capacitor.config.ts` created with correct appId
- [ ] `npx cap init` completed
- [ ] `npx cap add android` completed or `android/` directory exists
- [ ] `npx cap sync android` run successfully

### Gradle Configuration

- [ ] `android/build.gradle` includes `com.google.gms:google-services` plugin
- [ ] `android/app/build.gradle` applies `com.google.gms.google-services`
- [ ] Firebase BOM and Firebase Messaging dependencies added
- [ ] Gradle sync successful in Android Studio

### Signing

- [ ] Debug keystore created at `android/app/debug.keystore`
- [ ] Debug SHA-1 fingerprint extracted and registered in Firebase
- [ ] Release keystore created (stored securely, not in Git)
- [ ] Keystore files added to `.gitignore`
- [ ] Gradle signing configuration for release build added

### Permissions and Manifest

- [ ] `POST_NOTIFICATIONS` permission in `AndroidManifest.xml`
- [ ] `INTERNET` permission in `AndroidManifest.xml`
- [ ] Deep link intent-filter configured in `AndroidManifest.xml`
- [ ] Firebase Services configured in `AndroidManifest.xml`

### Testing

- [ ] App builds and runs on physical device or emulator
- [ ] Notification permission granted on device
- [ ] Device appears in `/api/host/devices` list
- [ ] Test notification sent via Firebase Console received on device
- [ ] Tapping notification navigates to correct route

### .gitignore Updates

- [ ] `android/app/google-services.json` ignored
- [ ] `android/app/*.keystore` ignored
- [ ] `.env` and environment files ignored (if not already)

---

## Part 14: Next Steps

After completing this setup:

1. **Implement Backend Device Registration Endpoints** — Create `/api/host/devices/register` and `/api/host/devices/unregister` to persist device tokens
2. **Implement Notification Delivery** — Create backend worker to send FCM messages when guest requests are created
3. **Test on Physical Device** — Verify end-to-end notification flow from guest request to host notification
4. **Configure Firebase for iOS** — Similar setup for Capacitor iOS if needed
5. **Prepare for Production Release** — Build APK, test on multiple devices, prepare Google Play Store listing

---

## References

- [Capacitor Documentation](https://capacitorjs.com)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/plugins/push-notifications)
- [Firebase Cloud Messaging (Android)](https://firebase.google.com/docs/cloud-messaging/android/client)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)
- [Android Deep Linking](https://developer.android.com/training/app-links/deep-linking)
- [Google Play Console](https://play.google.com/console)
- [Android Studio Setup](https://developer.android.com/studio)

---

**Document Status:** Complete and ready for Phase 5 implementation.

**Last Reviewed:** 2026-06-19
