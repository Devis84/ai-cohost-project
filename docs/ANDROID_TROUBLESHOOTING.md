# Android Notification System Troubleshooting Guide

**Last Updated:** 2026-06-19

This guide covers common issues encountered during Android notification system setup and provides step-by-step solutions.

## Diagnostic Commands

Before troubleshooting, gather information about your environment:

```bash
# Check Capacitor installation
npm ls @capacitor/core @capacitor/android @capacitor/push-notifications

# Check Android SDK
adb version

# List connected devices
adb devices

# Check app logs in real-time
adb logcat | grep -i "aicohost\|firebase\|fcm"

# Get package info
adb shell dumpsys package com.aicohost.app

# Get notification channel info
adb shell cmd notification list_channels --user 0
```

---

## Category 1: Installation and Configuration Issues

### Issue 1.1: `Plugin with id 'com.google.gms.google-services' not found`

**Error Message:**
```
Gradle: Plugin with id 'com.google.gms.google-services' not found
```

**Cause:** Google Services plugin not added to project-level Gradle configuration.

**Solutions:**

1. **Verify `android/build.gradle` contains Google Services dependency:**
   ```gradle
   buildscript {
     dependencies {
       classpath 'com.google.gms:google-services:4.3.15'
     }
   }
   ```

2. **Sync Gradle:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

3. **In Android Studio:** **File** → **Sync Now**

4. **If issue persists, update Gradle wrapper:**
   ```bash
   cd android
   ./gradlew wrapper --gradle-version=8.5
   cd ..
   ```

### Issue 1.2: `google-services.json` file not found

**Error Message:**
```
Gradle: Processing file google-services.json
ERROR: File google-services.json doesn't exist in app/src/main
```

**Cause:** `google-services.json` not downloaded or placed in wrong location.

**Solutions:**

1. **Verify file location:**
   ```bash
   ls -la android/app/google-services.json
   ```

2. **If missing, download from Firebase:**
   - Firebase Console → Your Android app → **Download google-services.json**
   - Copy to `android/app/google-services.json`

3. **Verify file contains Firebase credentials:**
   ```bash
   cat android/app/google-services.json | jq '.project_info.project_id'
   ```

4. **Sync Gradle:**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

### Issue 1.3: `capacitor.config.ts` not found

**Error Message:**
```
Error: Unable to find capacitor.config.ts
```

**Cause:** Configuration file not created or in wrong location.

**Solutions:**

1. **Verify file exists in project root:**
   ```bash
   ls -la /path/to/project/capacitor.config.ts
   ```

2. **Create file if missing:**
   ```bash
   cat > capacitor.config.ts <<'EOF'
   import { CapacitorConfig } from '@capacitor/cli'

   const config: CapacitorConfig = {
     appId: 'com.aicohost.app',
     appName: 'AI Co-Host',
     webDir: 'out',
     server: { androidScheme: 'https' },
     plugins: {
       PushNotifications: {
         presentationOptions: ['badge', 'sound', 'alert'],
       },
     },
   }

   export default config
   EOF
   ```

3. **Verify syntax:**
   ```bash
   npx tsc --noEmit capacitor.config.ts
   ```

---

## Category 2: Firebase Configuration Issues

### Issue 2.1: Firebase not initializing — "Unknown project ID"

**Error Message:**
```
E/FirebaseMessaging: Failed to initialize Firebase
E/FirebaseMessaging: Unknown project ID
```

**Cause:** 
- `google-services.json` is corrupted or incomplete
- Firebase project ID mismatch
- JSON file was not downloaded correctly

**Solutions:**

1. **Verify `google-services.json` content:**
   ```bash
   cat android/app/google-services.json | jq '.project_info'
   ```
   
   Should output:
   ```json
   {
     "project_number": "123456789",
     "project_id": "aicohost-xxxxx",
     "firebase_url": "https://aicohost-xxxxx.firebaseio.com"
   }
   ```

2. **If content is missing, redownload from Firebase:**
   - Firebase Console → Your Android app
   - Click **three-dot menu** → **Edit app**
   - Download and replace `google-services.json`

3. **Verify package name matches:**
   - Firebaseproject → Android app package name: `com.aicohost.app`
   - `capacitor.config.ts` → `appId: 'com.aicohost.app'`
   - Must match exactly

4. **Rebuild:**
   ```bash
   rm -rf android/app/build
   npx cap sync android
   npx cap run android
   ```

### Issue 2.2: FCM token not generated

**Error Message:**
```
E/FirebaseMessaging: Failed to retrieve Firebase Instance ID Token
```

**Causes:**
- Google Play Services not available on device/emulator
- Firebase project not fully initialized
- Wrong package name registered in Firebase

**Solutions:**

1. **Verify Google Play Services on device:**
   - Physical device: **Settings** → **Google Play Store** → Check installed
   - Emulator: May need to use Google Play-enabled emulator image

2. **Verify Firebase initialization on backend:**
   - Check Firebase Console → **Cloud Messaging** tab
   - Verify Sender ID is visible

3. **Check app logs for token generation:**
   ```bash
   adb logcat | grep -i "firebase\|fcm\|token" | head -20
   ```

4. **Force token refresh:**
   ```bash
   adb shell am force-stop com.aicohost.app
   adb shell am start -n com.aicohost.app/.MainActivity
   ```
   Wait 10 seconds, check logs again

5. **If still failing, check Firebase backend:**
   ```bash
   # Backend logs (adjust for your logging framework)
   grep "firebase\|fcm" /path/to/backend/logs/*.log
   ```

### Issue 2.3: SHA-1 fingerprint mismatch

**Error Message:**
```
Failed to determine Firebase Instance ID
Authentication failed
```

**Cause:** Debug/release certificate SHA-1 not registered in Firebase.

**Solutions:**

1. **Extract SHA-1 from keystore:**
   ```bash
   keytool -list -v -keystore android/app/debug.keystore \
     -alias androiddebugkey -storepass android -keypass android | grep SHA1
   ```

2. **Copy the SHA1 value** (format: `AB:CD:EF:...`)

3. **Register in Firebase:**
   - Firebase Console → Your Android app → **Settings** (gear icon)
   - **Your apps** → Android app → **Debug signing certificate SHA-1**
   - Paste SHA1 value
   - Click **Save**

4. **Rebuild and test:**
   ```bash
   npx cap run android
   ```

### Issue 2.4: Cloud Messaging API not enabled

**Error Message:**
```
Error: Cloud Messaging API is not enabled
```

**Cause:** Firebase project needs Cloud Messaging API enabled.

**Solutions:**

1. **Enable via Firebase Console:**
   - Firebase Console → **Project Settings** (gear icon) → **Service Accounts**
   - Link to **Google Cloud Console**
   - Search for "Cloud Messaging API"
   - Click → **Enable**

2. **Or enable via Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Select your Firebase project
   - **APIs & Services** → **Library**
   - Search "Firebase Cloud Messaging"
   - Click result → **Enable**

3. **Wait 1-2 minutes for changes to propagate**

4. **Test:**
   ```bash
   npx cap run android
   ```

---

## Category 3: Permission and Channel Issues

### Issue 3.1: Notification permission never requested

**Symptom:** App doesn't ask for notification permission, notifications don't appear.

**Causes:**
- Permission already denied in past (cached)
- Permission not implemented in code
- Android version < 13 (older versions don't have notification permission)

**Solutions:**

1. **Clear app data to reset permissions:**
   ```bash
   adb shell pm clear com.aicohost.app
   ```

2. **Or via device settings:**
   - **Settings** → **Apps** → **AI Co-Host** → **Storage** → **Clear Storage**

3. **Verify permission request in code:**
   - Check `CapacitorNotificationClient.requestPermission()` is called
   - Verify `PushNotifications.requestPermissions()` from `@capacitor/push-notifications`

4. **Check AndroidManifest.xml includes permission:**
   ```xml
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```

5. **Check minimum API level:**
   - `android/app/build.gradle`:
     ```gradle
     android {
       minSdk 24  // Should work, but 26+ recommended
       targetSdk 34  // Should be 34+
     }
     ```

6. **Manually grant permission:**
   - **Settings** → **Apps** → **AI Co-Host** → **Permissions** → **Notifications** → Toggle **On**

### Issue 3.2: "Permission denied" error when registering

**Error Message:**
```
E/PushNotifications: Permission denied
E/PushNotifications: Unable to register for notifications
```

**Cause:** Notification permission not granted by user.

**Solutions:**

1. **Grant permission manually on device:**
   - **Settings** → **Apps** → **AI Co-Host**
   - **Permissions** → **Notifications** → **Allow**

2. **Or reset and re-request:**
   ```bash
   adb shell pm clear com.aicohost.app
   adb shell am start -n com.aicohost.app/.MainActivity
   ```
   Grant permission when prompted

3. **Verify permission is granted:**
   ```bash
   adb shell dumpsys package com.aicohost.app | grep POST_NOTIFICATIONS
   ```
   
   Should show: `android.permission.POST_NOTIFICATIONS: true`

### Issue 3.3: Notifications appear but make no sound/vibration

**Symptom:** Notification appears silently, no vibration or sound.

**Causes:**
- Notification channel not created with correct importance
- Device in silent/DND mode
- Notification channel settings muted by user

**Solutions:**

1. **Verify channel importance in code:**
   ```typescript
   const GUEST_REQUESTS_CHANNEL = {
     id: 'guest-requests',
     importance: 5,  // IMPORTANCE_HIGH
     vibration: true,
     sound: 'default',
   }
   ```

2. **Force channel recreation:**
   ```bash
   adb shell pm clear com.aicohost.app
   npx cap run android
   ```

3. **Check channel settings on device:**
   - **Settings** → **Apps** → **AI Co-Host** → **Notifications**
   - **Guest Requests** channel → Verify **Importance** is "High"
   - Verify **Sound** and **Vibration** are enabled

4. **Check device mode:**
   - Device in silent mode? Press volume up to unmute
   - Device in Do Not Disturb? Disable for testing

5. **Recreate channel:**
   - Delete channel: `adb shell cmd notification delete_channel com.aicohost.app guest-requests`
   - Reinstall app: `adb uninstall com.aicohost.app && npx cap run android`

### Issue 3.4: Channel name not appearing in Settings

**Symptom:** Notification channel exists but name doesn't show in Settings.

**Cause:** Channel not created by app (may be default channel).

**Solutions:**

1. **Verify channel creation is called:**
   ```typescript
   // In CapacitorNotificationClient.register()
   await PushNotifications.createChannel(GUEST_REQUESTS_CHANNEL)
   ```

2. **Force channel creation:**
   ```bash
   adb shell pm clear com.aicohost.app
   npx cap run android
   # Tap "Enable Notifications" button if present
   ```

3. **Verify channel exists:**
   ```bash
   adb shell cmd notification list_channels --user 0 | grep guest-requests
   ```

---

## Category 4: Signing and Build Issues

### Issue 4.1: Keystore file not found

**Error Message:**
```
Gradle: Keystore file not found: debug.keystore
```

**Cause:** Debug keystore not created or in wrong location.

**Solutions:**

1. **Verify keystore exists:**
   ```bash
   ls -la android/app/debug.keystore
   ```

2. **If missing, create it:**
   ```bash
   keytool -genkey -v -keystore android/app/debug.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias androiddebugkey -storepass android -keypass android \
     -dname "CN=Debug, O=AI Co-Host, L=Local, ST=Dev, C=US"
   ```

3. **Verify file is readable:**
   ```bash
   keytool -list -keystore android/app/debug.keystore -storepass android
   ```

### Issue 4.2: Wrong password for keystore

**Error Message:**
```
Gradle: Error initializing keystore: Invalid keystore format
```

**Cause:** Password in `build.gradle` doesn't match keystore password.

**Solutions:**

1. **Verify keystore password:**
   ```bash
   keytool -list -keystore android/app/debug.keystore -storepass android
   ```
   
   If this fails, password is wrong.

2. **If password is unknown, recreate keystore:**
   ```bash
   rm android/app/debug.keystore
   keytool -genkey -v -keystore android/app/debug.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias androiddebugkey -storepass android -keypass android \
     -dname "CN=Debug, O=AI Co-Host, L=Local, ST=Dev, C=US"
   ```

3. **Verify `build.gradle` passwords match:**
   ```gradle
   signingConfigs {
     debug {
       keystore file('debug.keystore')
       keyAlias 'androiddebugkey'
       keyPassword 'android'
       storePassword 'android'
     }
   }
   ```

### Issue 4.3: Certificate not valid

**Error Message:**
```
Gradle: Certificate is not valid (SHA1:...)
```

**Cause:** Signing certificate expired or mismatched.

**Solutions:**

1. **Check certificate validity:**
   ```bash
   keytool -list -v -keystore android/app/debug.keystore \
     -alias androiddebugkey -storepass android -keypass android | grep -A 2 Valid
   ```

2. **If expired, recreate keystore:**
   ```bash
   rm android/app/debug.keystore
   keytool -genkey -v -keystore android/app/debug.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias androiddebugkey -storepass android -keypass android \
     -dname "CN=Debug, O=AI Co-Host, L=Local, ST=Dev, C=US"
   ```

3. **Extract and register new SHA-1:**
   ```bash
   keytool -list -v -keystore android/app/debug.keystore \
     -alias androiddebugkey -storepass android -keypass android | grep SHA1
   ```
   Register in Firebase Console

---

## Category 5: Runtime and Device Issues

### Issue 5.1: App crashes on startup

**Error Message:**
```
FATAL EXCEPTION: Process com.aicohost.app crashed
```

**Causes:**
- Capacitor plugin not properly initialized
- Missing permissions in manifest
- Wrong package name in manifest

**Solutions:**

1. **Check crash logs:**
   ```bash
   adb logcat -e "FATAL\|Exception\|Error" | head -50
   ```

2. **Verify AndroidManifest.xml has required permissions:**
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```

3. **Verify main activity name:**
   ```xml
   <activity android:name="com.aicohost.app.MainActivity" ... >
   ```

4. **Clear app cache and reinstall:**
   ```bash
   adb shell pm clear com.aicohost.app
   npx cap run android
   ```

5. **Enable app debugging:**
   - Android Studio → **Run** → **Edit Configurations**
   - Enable **Debug** mode
   - Run with debugger attached
   - Check breakpoints and stack trace

### Issue 5.2: Device registration fails (token not posted to backend)

**Error Message:**
```
Error: Device registration failed
```

**Causes:**
- Backend API endpoint not responding
- Network connectivity issue
- Incorrect API URL in app
- CORS issue

**Solutions:**

1. **Verify backend API is running:**
   ```bash
   curl -i http://localhost:3000/api/host/devices/register
   ```
   Should return 400+ (not network error)

2. **Check API URL in app configuration:**
   - Search codebase for `/api/host/devices/register`
   - Verify `NEXT_PUBLIC_API_URL` is correct in `.env.local`

3. **Test connectivity from device/emulator:**
   ```bash
   adb shell ping 8.8.8.8
   adb shell curl -i http://localhost:3000/api/health
   ```
   (Note: `localhost` on emulator refers to host machine)

4. **Check backend logs for registration errors:**
   ```bash
   grep "device\|register" /path/to/backend/logs/*.log | tail -20
   ```

5. **Verify endpoint exists and accepts POST:**
   ```bash
   curl -X POST http://localhost:3000/api/host/devices/register \
     -H "Content-Type: application/json" \
     -d '{
       "notification_token": "test-token",
       "platform": "android",
       "app_type": "native"
     }'
   ```

### Issue 5.3: Notification received but doesn't open when tapped

**Symptom:** Notification appears, but tapping it doesn't navigate to request.

**Causes:**
- Deep link route not in FCM payload
- Deep link not configured in AndroidManifest
- React Router not configured for that route

**Solutions:**

1. **Verify FCM payload includes route:**
   - Firebase Console → Send test message
   - Expand **Advanced options**
   - **Data field** should include:
     ```json
     {
       "route": "/host/requests/test-123"
     }
     ```

2. **Verify manifest has deep link intent filter:**
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

3. **Check notification handler is called:**
   ```bash
   adb logcat | grep -i "navigate\|route\|deep"
   ```

4. **Test deep link manually:**
   ```bash
   adb shell am start -W -a android.intent.action.VIEW \
     -d "https://app.aicohost.com/host/requests/test-123"
   ```
   App should open to that request

### Issue 5.4: Notification not appearing after send

**Symptom:** Firebase shows message sent successfully, but no notification appears on device.

**Checklist:**

- [ ] Device has notification permission granted
- [ ] Channel exists and is not muted
- [ ] Device is online and connected to Firebase
- [ ] FCM token is valid (posted to backend successfully)
- [ ] Notification payload is valid JSON
- [ ] Device hasn't uninstalled or revoked app
- [ ] Battery saver mode not blocking notifications

**Solutions:**

1. **Verify device token is correct:**
   - Check backend device registration logs
   - Verify token was posted and stored
   - Use that token in test message

2. **Check Firebase delivery logs:**
   - Firebase Console → Cloud Messaging
   - Check message history for success/failure status

3. **Verify notification payload:**
   ```json
   {
     "notification": {
       "title": "New Guest Request",
       "body": "Room 204: Air conditioner"
     },
     "data": {
       "route": "/host/requests/123"
     }
   }
   ```

4. **Check device battery saver:**
   - **Settings** → **Battery** → **Battery Saver**
   - If enabled, disable for testing

5. **Check Do Not Disturb mode:**
   - Toggle off for testing
   - Verify notification channel importance is HIGH

6. **Monitor device logs:**
   ```bash
   adb logcat -s "FirebaseMessaging:*" -v brief
   ```

---

## Category 6: Emulator-Specific Issues

### Issue 6.1: Google Play Services not available

**Error Message:**
```
E/FirebaseMessaging: Google Play services not available
E/PlayUtils: Trying to get app package info. com.google.android.gms not found
```

**Cause:** Emulator doesn't have Google Play Services.

**Solutions:**

1. **Recreate emulator with Google Play:**
   - Android Studio → **Virtual Device Manager**
   - **Create device** → Select **Pixel 6** (or similar)
   - **Select system image** → Switch to **Google Play** tab
   - Select **API 33** or higher with Google Play
   - Complete device creation

2. **Or use physical device for testing** (recommended for push notifications)

### Issue 6.2: Network connectivity to localhost

**Error Message:**
```
Failed to register device: Network unreachable
```

**Cause:** Emulator can't reach `localhost:3000` on host machine.

**Solutions:**

1. **Use `10.0.2.2` instead of `localhost` on emulator:**
   - In app code for emulator:
     ```typescript
     const apiUrl = IS_EMULATOR ? 'http://10.0.2.2:3000' : 'http://localhost:3000'
     ```

2. **Or configure in capacitor.config.ts:**
   ```typescript
   const config: CapacitorConfig = {
     server: {
       url: process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:3000',
     },
   }
   ```

3. **Test connectivity:**
   ```bash
   adb shell ping 10.0.2.2
   adb shell curl -i http://10.0.2.2:3000/api/health
   ```

### Issue 6.3: Emulator performance slow

**Symptom:** App runs very slowly on emulator, UI lags.

**Solutions:**

1. **Enable hardware acceleration:**
   - Android Studio → **AVD Manager** → Select device
   - **Edit** → **Advanced Settings**
   - **Graphics:** Change to **Hardware - ANGLE**

2. **Allocate more CPU cores:**
   - **CPU cores:** Set to 4 or more

3. **Allocate more RAM:**
   - **RAM:** Set to 2GB or more

4. **Use physical device for testing** (much faster)

---

## Category 7: Firebase-Specific Issues

### Issue 7.1: Invalid registration token

**Error Message:**
```
Error: Invalid registration token provided (FCM Error)
```

**Cause:** Token is expired, malformed, or for different Firebase project.

**Solutions:**

1. **Verify token format:**
   ```bash
   # Check backend logs for stored token
   grep "notification_token" /path/to/backend/logs/*.log | tail -5
   ```
   Token should be 100-200 characters, alphanumeric

2. **Delete and reregister device:**
   ```bash
   # On device: Clear app data
   adb shell pm clear com.aicohost.app
   
   # Reinstall
   npx cap run android
   
   # Tap "Enable Notifications" to re-register
   ```

3. **Verify token is from correct Firebase project:**
   - Check `google-services.json` project ID
   - Verify Firebase project matches backend configuration

### Issue 7.2: Mismatched sender ID

**Error Message:**
```
E/FirebaseMessaging: Error with sender ID (Sender ID mismatch)
```

**Cause:** Sender ID in `google-services.json` doesn't match backend Firebase project.

**Solutions:**

1. **Extract Sender ID from google-services.json:**
   ```bash
   jq '.project_info.firebase_url' android/app/google-services.json
   ```

2. **Verify it matches backend Firebase project:**
   - Firebase Console → **Project Settings** → **Cloud Messaging**
   - **Sender ID** should match

3. **If mismatch, redownload google-services.json:**
   - Firebase Console → Android app → **Download google-services.json**
   - Replace `android/app/google-services.json`
   - Rebuild: `npx cap sync android && npx cap run android`

### Issue 7.3: Firebase project quota exceeded

**Error Message:**
```
Error: Exceeded rate limit for sending messages to this device
```

**Cause:** Too many messages sent to same device in short time.

**Solution:**

- This is rate limiting by Firebase, not a misconfiguration
- Wait 1 hour before sending more test messages to same device
- Or delete and re-register device to reset quota

---

## Category 8: Build and Deployment Issues

### Issue 8.1: Gradle build timeout

**Error Message:**
```
Gradle build time out after 120 seconds
```

**Cause:** First build takes long time, especially on slow network.

**Solutions:**

1. **Increase Gradle timeout:**
   - Create `gradle.properties` in project root (or `android/` directory):
     ```properties
     org.gradle.jvmargs=-Xmx4096m
     org.gradle.parallel=true
     org.gradle.workers.max=4
     org.gradle.configureondemand=true
     ```

2. **Use faster internet connection**

3. **Cache Gradle dependencies:**
   ```bash
   # First build: 5-10 minutes
   cd android && ./gradlew build && cd ..
   
   # Subsequent builds: 30-60 seconds (cache hit)
   ```

### Issue 8.2: APK file too large

**Symptom:** App-debug.apk is >100MB, install fails.

**Causes:**
- Unnecessary dependencies
- Unminified release build
- Debug symbols included

**Solutions:**

1. **For debug builds, size doesn't matter much** (only for internal testing)

2. **For release builds, enable minification:**
   ```gradle
   buildTypes {
     release {
       minifyEnabled true
       shrinkResources true
     }
   }
   ```

3. **Check for unnecessary dependencies:**
   ```bash
   cd android
   ./gradlew dependencies
   cd ..
   ```

### Issue 8.3: "Unable to get the Android SDK location"

**Error Message:**
```
Unable to get the Android SDK location
```

**Cause:** `ANDROID_SDK_ROOT` or `ANDROID_HOME` environment variable not set.

**Solutions:**

1. **Find Android SDK location:**
   ```bash
   # Usually in one of:
   /Users/username/Library/Android/sdk          # macOS
   /home/username/Android/sdk                    # Linux
   C:\Users\username\AppData\Local\Android\sdk   # Windows
   ```

2. **Set environment variable:**
   ```bash
   export ANDROID_SDK_ROOT="/path/to/android/sdk"
   export ANDROID_HOME="/path/to/android/sdk"
   ```

3. **Or configure in `local.properties`:**
   ```properties
   sdk.dir=/path/to/android/sdk
   ```

4. **Verify:**
   ```bash
   echo $ANDROID_SDK_ROOT
   ls $ANDROID_SDK_ROOT/platforms
   ```

---

## Debugging Techniques

### Enable Verbose Logging

```bash
# Real-time logs
adb logcat -v brief -s "aicohost:*" "Firebase*" "Capacitor*"

# Filter by log level
adb logcat "*:E"  # Errors only
adb logcat "*:W"  # Warnings only
adb logcat "*:D"  # Debug only
```

### Inspect App State

```bash
# Device info
adb shell getprop ro.build.version.release   # Android version

# App info
adb shell dumpsys package com.aicohost.app | grep -A 20 "versionCode"

# Notification channels
adb shell cmd notification list_channels --user 0

# Permissions
adb shell dumpsys package com.aicohost.app | grep "permission"
```

### Test Push Notification Delivery

```bash
# Option 1: Firebase Console (UI)
# See Part 7.3 in ANDROID_SETUP.md

# Option 2: Firebase Admin SDK (backend)
# Inject test code in backend to send message directly

# Option 3: curl (for testing backend endpoint)
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "device_id": "DEVICE_ID_FROM_DB",
    "title": "Test",
    "body": "Test message"
  }'
```

### Performance Profiling

In Android Studio:
1. **Run** → **Attach Debugger to Android Process**
2. Select `com.aicohost.app`
3. Use **Profiler** tab to monitor:
   - CPU usage
   - Memory usage
   - Network activity
   - Battery consumption

---

## Getting Help

If you're still stuck:

1. **Check logs first:**
   ```bash
   adb logcat > debug.log
   # Reproduce issue
   # Review debug.log for errors
   ```

2. **Search GitHub issues:**
   - [Capacitor](https://github.com/ionic-team/capacitor)
   - [Firebase Android SDK](https://github.com/firebase/firebase-android-sdk)

3. **Review documentation:**
   - [ANDROID_SETUP.md](./ANDROID_SETUP.md)
   - [Capacitor Android Guide](https://capacitorjs.com/docs/android)
   - [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

4. **Contact support:**
   - Firebase Console → Help & Support
   - Android Studio Help

---

**Last Updated:** 2026-06-19
