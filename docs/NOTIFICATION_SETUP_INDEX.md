# Cross-Platform Notification Setup Documentation

**Status:** Complete for Android and iOS

**Target Audience:** Full-stack developers implementing push notifications for Airbnb AI Co-Host

---

## Quick Navigation by Platform

### Android Setup
- **Quick Start (15 min):** [ANDROID_QUICK_START.md](./ANDROID_QUICK_START.md)
- **Full Guide (2-3 hours):** [ANDROID_SETUP.md](./ANDROID_SETUP.md)
- **Troubleshooting:** [ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md)

### iOS Setup
- **Quick Start (15 min):** [IOS_QUICK_START.md](./IOS_QUICK_START.md)
- **Full Guide (2-3 hours):** [IOS_SETUP.md](./IOS_SETUP.md)
- **Troubleshooting:** [IOS_TROUBLESHOOTING.md](./IOS_TROUBLESHOOTING.md)

### Architecture & Backend
- **System Design:** [plan/notification-system.md](./plan/notification-system.md)
- **API Specification:** [NOTIFICATION_API_SPEC.md](./NOTIFICATION_API_SPEC.md)

### Phase 8: Production Hardening
- **Summary:** [PHASE8_SUMMARY.md](./PHASE8_SUMMARY.md) — Overview of features added (752 tests passing)
- **Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — Production configuration
- **Environment Variables:** [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) — Complete reference
- **QA Checklist:** [QA_CHECKLIST_PHASE8.md](./QA_CHECKLIST_PHASE8.md) — Manual testing (29 test cases)

---

## Document Overview

### Android Documentation

#### ANDROID_QUICK_START.md
**Time:** 5 minutes read, 45-60 minutes implementation

A condensed checklist covering essential steps:
- Package installation
- Capacitor configuration
- Firebase setup
- Gradle configuration
- Signing keystore
- Build and test

**Use when:** You need to get up and running quickly.

**Output:** Working Android app receiving push notifications from Firebase Cloud Messaging.

---

#### ANDROID_SETUP.md
**Time:** 2-3 hours detailed reading + implementation

Comprehensive 14-part guide:
1. Install Capacitor and required packages
2. Firebase Console setup
3. Gradle configuration
4. Android platform setup
5. App signing (debug and release)
6. Notification channel configuration
7. Push notification testing
8. Deep linking configuration
9. Troubleshooting
10. Production build
11. Environment variables
12. Versioning and updates
13. Manual setup checklist
14. Next steps

**Prerequisites:**
- Android Studio installed
- Physical Android device or emulator with Google Play Services
- Firebase project created

**Success Criteria:**
- App builds and runs on device/emulator
- Notification permission is requested and granted
- Device registers with backend
- Test notification appears with sound/vibration
- Tapping notification navigates to correct route

---

#### ANDROID_TROUBLESHOOTING.md
**Time:** 30 minutes browse, reference as needed

8 troubleshooting categories with 24+ specific issues:
1. Installation & Configuration
2. Firebase Issues
3. Permissions & Channels
4. Signing & Build
5. Runtime & Device
6. Emulator-Specific
7. Firebase-Specific
8. Deployment

Each issue includes: error message, root cause, step-by-step solutions, diagnostic commands.

**Use when:** Something goes wrong and you need help diagnosing it.

---

### iOS Documentation

#### IOS_QUICK_START.md
**Time:** 5 minutes read, 60-90 minutes implementation

A condensed checklist covering essential steps:
- Apple Developer Account setup
- Firebase Console setup
- Capacitor package installation
- iOS platform configuration
- Xcode configuration (Signing & Capabilities)
- Build on physical device
- Send test notification

**Key Points:**
- Must have macOS and Xcode 15+
- Physical iOS device required (simulator doesn't support push notifications)
- Apple Developer account enrollment required ($99/year)

**Use when:** You need to get up and running quickly.

**Output:** Working iOS app receiving push notifications via APNs through Firebase.

---

#### IOS_SETUP.md
**Time:** 2-3 hours detailed reading + implementation

Comprehensive 16-part guide:
1. Prerequisites and Apple Developer Account setup
2. Firebase Console setup for iOS
3. Install Capacitor packages
4. Verify Capacitor configuration
5. Capacitor iOS platform setup
6. Xcode configuration (Signing & Capabilities)
7. Building and testing on device
8. Sending test notifications
9. How the code works (CapacitorNotificationClient)
10. Deep linking configuration
11. Security considerations
12. Troubleshooting
13. Building for production
14. iOS Simulator limitations
15. Environment variables
16. Next steps

**Prerequisites:**
- macOS 13+ with Xcode 15+
- Physical iOS device (iPhone/iPad with iOS 14+)
- Apple Developer Account ($99/year)
- CocoaPods installed

**Success Criteria:**
- App builds and runs on physical device
- Notification permission is requested and granted
- Device registers with backend
- Test notification appears with badge/sound/banner
- Tapping notification navigates to correct route

---

#### IOS_TROUBLESHOOTING.md
**Time:** 30 minutes browse, reference as needed

12 troubleshooting sections with 20+ specific issues:
1. Installation and Configuration
2. Capacitor Sync Issues
3. Xcode Configuration
4. GoogleService-Info.plist
5. APNs Key Issues
6. Permission and Registration
7. Push Notification Delivery
8. Deep Linking
9. Build and Compilation
10. Simulator Limitations
11. Network and Backend
12. Debugging Techniques

Each issue includes: error message, root cause, step-by-step solutions, verification checklists.

**Use when:** Something goes wrong and you need help diagnosing it.

---

## Platform Comparison

| Aspect | Android | iOS |
|--------|---------|-----|
| **Setup Time** | 45-60 min | 60-90 min |
| **Server Required** | Android Studio | macOS + Xcode 15+ |
| **Push Service** | Firebase Cloud Messaging (FCM) | Apple Push Notification (APNs) via Firebase |
| **Test Device** | Emulator OK for testing* | Physical device only |
| **Key Skills** | Android Studio, Gradle | Xcode, CocoaPods, Apple Developer |
| **Cost** | Free | $99/year (Apple Developer) |
| **Signing** | Keystore file | Automatic via Xcode + Apple cert |

*Emulator can test if it has Google Play Services. Simulator cannot test push notifications at all.

---

## Implementation Timeline

### Week 1: Android Setup (5 hours)
- [ ] Read ANDROID_QUICK_START.md (1 hour)
- [ ] Verify app builds and runs (30 min)
- [ ] Test notification permission flow (30 min)
- [ ] Reference ANDROID_SETUP.md for clarification (2-3 hours as needed)

### Week 1: iOS Setup (5 hours)
- [ ] Read IOS_QUICK_START.md (1 hour)
- [ ] Verify app builds and runs on physical device (1 hour)
- [ ] Test notification permission flow (30 min)
- [ ] Reference IOS_SETUP.md for clarification (2-3 hours as needed)

### Week 2: Backend Integration (15 hours)
- [ ] Implement device registration endpoints (4 hours)
- [ ] Implement test notification endpoint (3 hours)
- [ ] Implement request state endpoints (5 hours)
- [ ] Test end-to-end flow on Android (2 hours)
- [ ] Test end-to-end flow on iOS (1 hour)

### Week 3: Testing & Hardening (10 hours)
- [ ] Test on multiple Android devices/emulators (3 hours)
- [ ] Test on multiple iOS devices (2 hours)
- [ ] Handle edge cases and errors (3 hours)
- [ ] Performance and battery optimization (2 hours)

### Week 4: Production Preparation (5 hours)
- [ ] Configure release signing for Android (1 hour)
- [ ] Configure App Store submission for iOS (2 hours)
- [ ] Create deployment documentation (1 hour)
- [ ] Final QA on both platforms (1 hour)

**Total:** ~35 hours for complete cross-platform implementation

---

## Key Concepts

### Notification Channels (Android)
Android concept for organizing notifications by importance and user controls.
- **guest-requests:** High-importance (IMPORTANCE_HIGH = 5)
- Created automatically by app on first notification registration
- Allows bypassing Do Not Disturb mode (with user control)

### Push Notification Service
- **Android:** Firebase Cloud Messaging (FCM) → Direct to app
- **iOS:** Apple Push Notification (APNs) → Firebase receives APNs token → Firebase handles delivery

### Deep Linking
Opening the app to a specific route (e.g., `/host/requests/123`) when notification is tapped.
- Requires intent filters (Android) or URL schemes (iOS)
- Firebase payload includes route in data section
- App navigates using React Router

### FCM Token Management
Firebase's identifier for a device.
- Obtained from Firebase on app startup
- Posted to backend `/api/host/devices/register`
- Should never be logged in full
- Rotates automatically when needed

### Idempotency
Operations can be repeated safely without side effects.
- Device registration: Same token, same host → returns existing device
- Acknowledgement: Same request → returns success
- Unregistration: Already unregistered → returns success

---

## Checklist for Success

### Pre-Implementation
- [ ] Read appropriate Quick Start guide (Android or iOS)
- [ ] Have physical Android device or iOS device ready
- [ ] Have Android Studio (Android) or Xcode (iOS) installed
- [ ] Have Firebase project created
- [ ] Understand notification system architecture (see plan/notification-system.md)

### Android Setup Phase
- [ ] Capacitor packages installed
- [ ] `capacitor.config.ts` created with correct appId
- [ ] `android/` directory created via `npx cap add android`
- [ ] `google-services.json` downloaded and placed in `android/app/`
- [ ] `google-services.json` added to `.gitignore`
- [ ] Gradle files updated with Google Services plugin
- [ ] Firebase BOM and Firebase Messaging dependencies added
- [ ] `npx cap sync android` successful
- [ ] Debug keystore created
- [ ] Debug SHA-1 registered in Firebase
- [ ] `.gitignore` includes keystore files
- [ ] `npm run build` successful
- [ ] `npx cap copy android` successful
- [ ] `npx cap run android` runs on device/emulator
- [ ] Notification permission dialog appears
- [ ] Permission granted
- [ ] Device appears in backend device list
- [ ] Test notification sent from Firebase Console
- [ ] Notification received with sound/vibration
- [ ] Tapping notification navigates to correct route

### iOS Setup Phase
- [ ] Apple Developer Account created ($99/year)
- [ ] App ID registered with Bundle ID `com.airbnb.aicohost`
- [ ] App ID has Push Notifications capability
- [ ] APNs authentication key created
- [ ] `.p8` key file downloaded and stored securely
- [ ] Firebase project created
- [ ] iOS app registered in Firebase with correct Bundle ID
- [ ] `GoogleService-Info.plist` downloaded
- [ ] APNs key uploaded to Firebase with Key ID and Team ID
- [ ] Capacitor packages installed
- [ ] `capacitor.config.ts` verified with correct appId
- [ ] `npx cap add ios` successful
- [ ] `npx cap sync ios` successful
- [ ] Xcode opens without errors
- [ ] Team selected in Signing & Capabilities
- [ ] Bundle Identifier set correctly
- [ ] Push Notifications capability added
- [ ] Background Modes > Remote notifications capability added
- [ ] `GoogleService-Info.plist` added to Xcode project
- [ ] CocoaPods dependencies installed
- [ ] Physical iOS device connected
- [ ] App builds and runs on device
- [ ] Notification permission dialog appears
- [ ] Permission granted
- [ ] Device appears in backend device list
- [ ] Test notification sent from Firebase Console
- [ ] Notification received with badge/sound/banner
- [ ] Tapping notification navigates to correct route

### Backend Implementation
- [ ] Device registration endpoints implemented
- [ ] Device unregistration endpoints implemented
- [ ] Device listing endpoints implemented
- [ ] Test notification endpoint implemented
- [ ] Request state endpoints implemented
- [ ] Database migrations applied
- [ ] All endpoints tested with curl or Postman
- [ ] End-to-end flow tested on Android
- [ ] End-to-end flow tested on iOS

### Production Readiness (Phase 8 Hardening)
- [ ] Release keystore created for Android (stored securely, not in Git)
- [ ] Release certificate SHA-1 registered in Firebase
- [ ] Environment variables configured for production
- [ ] Firebase project production-ready
- [ ] All automated tests passing (752+ tests)
- [ ] Security review completed
- [ ] Manual QA on 2+ Android devices
- [ ] Manual QA on 2+ iOS devices
- [ ] Structured logging configured (JSON with correlation IDs)
- [ ] Rate limiting configured (guest requests & test notifications)
- [ ] Device token cleanup scheduled (daily or weekly)
- [ ] FCM retry policy configured (exponential backoff)
- [ ] Worker health monitoring configured (GET /api/health/worker)
- [ ] Sensitive field redaction verified (no tokens in logs)
- [ ] All Phase 8 QA checks completed
- [ ] App Store listing created (iOS)
- [ ] Google Play Store listing prepared (Android)

---

## Troubleshooting Quick Reference

### Android Issues
- **Notification permission never requested** → See [ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md)
- **Device registration fails** → See [ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md)
- **Notification not received** → See [ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md)
- **Gradle sync fails** → See [ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md)
- **Deep link doesn't work** → See [ANDROID_SETUP.md#part-8](./ANDROID_SETUP.md#part-8-deep-linking-configuration)

### iOS Issues
- **"No valid aps-environment" error** → See [IOS_TROUBLESHOOTING.md](./IOS_TROUBLESHOOTING.md)
- **GoogleService-Info.plist not found** → See [IOS_TROUBLESHOOTING.md](./IOS_TROUBLESHOOTING.md)
- **Notification permission never appears** → See [IOS_TROUBLESHOOTING.md](./IOS_TROUBLESHOOTING.md)
- **Push notifications don't work on simulator** → See [IOS_TROUBLESHOOTING.md](./IOS_TROUBLESHOOTING.md)
- **Device not registered** → See [IOS_TROUBLESHOOTING.md](./IOS_TROUBLESHOOTING.md)

---

## File Structure

All documentation is located in `/docs/`:

```
docs/
├── NOTIFICATION_SETUP_INDEX.md        (this file - navigation)
├── ANDROID_SETUP_INDEX.md             (Android docs overview)
├── ANDROID_QUICK_START.md             (5-min Android checklist)
├── ANDROID_SETUP.md                   (comprehensive Android guide)
├── ANDROID_TROUBLESHOOTING.md         (Android issue resolution)
├── IOS_QUICK_START.md                 (5-min iOS checklist)
├── IOS_SETUP.md                       (comprehensive iOS guide)
├── IOS_TROUBLESHOOTING.md             (iOS issue resolution)
├── NOTIFICATION_API_SPEC.md           (backend endpoints)
├── plan/
│   └── notification-system.md         (system architecture)
└── ...
```

Related source code:

```
lib/notifications/
├── capacitor-notification-client.ts   (iOS & Android client)
├── notification-client.ts             (abstract interface)
├── notification-client-factory.ts     (client factory)
├── notification-click-handler.ts      (click handling)
└── __tests__/
    └── capacitor-notification-client.test.ts  (tests: 49 passing, 98.57% coverage)

types/
└── capacitor.d.ts                     (Capacitor type definitions)

capacitor.config.ts                    (Capacitor config: com.airbnb.aicohost)
android/                               (created by `npx cap add android`)
ios/                                   (created by `npx cap add ios`)
```

---

## Getting Started

### I want to set up Android push notifications

**Step 1:** Read [ANDROID_QUICK_START.md](./ANDROID_QUICK_START.md) (5 minutes)

**Step 2:** Follow the 10-step quick start (45-60 minutes)

**Step 3:** Refer to [ANDROID_SETUP.md](./ANDROID_SETUP.md) for detailed explanations

**Step 4:** Use [ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md) if issues arise

---

### I want to set up iOS push notifications

**Step 1:** Read [IOS_QUICK_START.md](./IOS_QUICK_START.md) (5 minutes)

**Step 2:** Follow the 10-step quick start (60-90 minutes)

**Step 3:** Refer to [IOS_SETUP.md](./IOS_SETUP.md) for detailed explanations

**Step 4:** Use [IOS_TROUBLESHOOTING.md](./IOS_TROUBLESHOOTING.md) if issues arise

---

### I want to set up both Android and iOS

**Timeline:** ~35 hours total for complete implementation

**Approach:**
1. Start with Android (more straightforward, can use emulator for initial testing)
2. Get Android working end-to-end
3. Move to iOS (requires physical device and Apple Developer account)
4. Get iOS working end-to-end
5. Implement backend once both platforms are configured
6. Test end-to-end on both platforms

---

### I need to implement the backend

**Step 1:** Read [plan/notification-system.md](./plan/notification-system.md) for architecture

**Step 2:** Follow [NOTIFICATION_API_SPEC.md](./NOTIFICATION_API_SPEC.md) for endpoint specifications

**Step 3:** Implement endpoints:
- Device registration (POST, PUT, GET, DELETE)
- Notification sending
- Request state management

**Step 4:** Test with both Android and iOS apps

---

## Support and Resources

### Official Documentation
- [Capacitor Docs](https://capacitorjs.com)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Android Developer Docs](https://developer.android.com)
- [Apple Developer Docs](https://developer.apple.com/documentation/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

### In-Project Resources
- Source code: `lib/notifications/` directory
- Tests: `lib/notifications/__tests__/capacitor-notification-client.test.ts`
- Types: `types/capacitor.d.ts`
- Architecture: `docs/plan/notification-system.md`

### When You Get Stuck
1. Check the appropriate **Troubleshooting** guide
2. Review logs in Android Studio (Android) or Xcode (iOS)
3. Consult official documentation
4. Check GitHub issues on Capacitor, Firebase, or native platform repos

---

## Document Maintenance

**Last Updated:** 2026-06-19

These documents are comprehensive as of the date above. To stay current:

- Update examples when package versions change
- Add new troubleshooting issues as they arise
- Keep API specification in sync with backend implementation
- Link to updated references when available

---

## What's NOT Covered

These topics are addressed elsewhere:

- **PWA/Web push:** See separate web push documentation
- **Escalation logic:** See [plan/notification-system.md](./plan/notification-system.md#acknowledgement-and-escalation)
- **Google Play Store submission:** See Google Play Console documentation
- **App Store submission:** See App Store Connect documentation
- **Production CI/CD:** See deployment documentation
- **Capacitor advanced features:** See [Capacitor documentation](https://capacitorjs.com)
- **Backend architecture:** See project README and API documentation

---

**Status:** Complete and ready for implementation.

**Questions?** Refer to the appropriate guide above or check official documentation links.
