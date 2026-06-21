# Android Setup Quick Reference

**For detailed information, see [ANDROID_SETUP.md](./ANDROID_SETUP.md)**

## 1. Install Packages (5 minutes)

```bash
npm install @capacitor/core @capacitor/android @capacitor/push-notifications
npx cap init  # Choose defaults
npx cap add android
```

## 2. Create capacitor.config.ts (2 minutes)

**File: `/capacitor.config.ts`**

```typescript
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
```

## 3. Firebase Console Setup (10 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project → "AI Co-Host"
3. **Add app** → **Android**
4. Package name: `com.aicohost.app`
5. **Download google-services.json** → Place in `android/app/`
6. Add to `.gitignore`: `echo "android/app/google-services.json" >> .gitignore`

## 4. Configure Gradle (5 minutes)

**Edit: `android/build.gradle`**

```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

**Edit: `android/app/build.gradle`** (top of file)

```gradle
plugins {
  id 'com.android.application'
  id 'com.google.gms.google-services'
}

dependencies {
  implementation 'com.google.firebase:firebase-bom:32.7.0'
  implementation 'com.google.firebase:firebase-messaging'
}
```

## 5. Sync Capacitor (3 minutes)

```bash
npx cap sync android
```

## 6. Create Debug Keystore (2 minutes)

```bash
keytool -genkey -v -keystore android/app/debug.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias androiddebugkey -storepass android -keypass android \
  -dname "CN=Debug, O=AI Co-Host, L=Local, ST=Dev, C=US"

echo "android/app/*.keystore" >> .gitignore
```

## 7. Get SHA-1 and Register in Firebase (3 minutes)

```bash
keytool -list -v -keystore android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android | grep SHA1
```

Copy the SHA1 fingerprint → Firebase Console → Android app settings → Paste SHA1 fingerprint

## 8. Build and Test (10 minutes)

```bash
npm run build
npx cap copy android
npx cap run android
```

Grant notification permission when prompted → Device registers for push notifications

## 9. Verify Registration

Check backend logs or `/api/host/devices` endpoint to confirm device was registered.

## 10. Send Test Notification (2 minutes)

Firebase Console → **Cloud Messaging** → **Send your first message**
- Title: "Test Notification"
- Body: "This is a test"
- Select device → **Send**

Should appear on device with sound and vibration.

---

## Common Issues

| Issue | Fix |
|-------|-----|
| Gradle sync fails | Run `cd android && ./gradlew clean && cd ..` |
| Permission not requested | Grant manually: **Settings** → **Apps** → **Permissions** |
| Notification not received | Verify device in `/api/host/devices` and check Firebase logs |
| Deep link not working | Verify `AndroidManifest.xml` has intent-filter with correct scheme |
| "Google Play Services not found" | Use emulator with Google Play or physical device |

---

## Files Changed/Created

```
capacitor.config.ts                    (NEW)
android/                               (NEW directory)
android/app/google-services.json       (NEW - Firebase config)
android/app/debug.keystore             (NEW - signing key)
android/build.gradle                   (MODIFIED)
android/app/build.gradle               (MODIFIED)
.gitignore                             (MODIFIED - added keystore and json)
```

---

## Time Estimate

- **First-time setup:** 45-60 minutes
- **Per-developer setup:** 15-20 minutes
- **Rebuild and redeploy:** 5-10 minutes

---

## Next: Backend Integration

Once device registration works:

1. Implement `/api/host/devices/register` endpoint
2. Implement `/api/host/devices/unregister` endpoint
3. Create notification worker to send FCM messages
4. Test guest request → host notification flow

See [ANDROID_SETUP.md](./ANDROID_SETUP.md#part-1-install-capacitor-and-required-packages) for detailed walkthrough.
