# Android Setup Documentation Index

**Status:** Complete and comprehensive

**Target Audience:** Developers implementing Android push notifications for Airbnb AI Co-Host

---

## Quick Navigation

### For First-Time Setup
1. Start with **[ANDROID_QUICK_START.md](./ANDROID_QUICK_START.md)** (15-20 minutes)
2. Reference **[ANDROID_SETUP.md](./ANDROID_SETUP.md)** for detailed explanations
3. Use **[ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md)** when issues arise

### For Backend Integration
- **[NOTIFICATION_API_SPEC.md](./NOTIFICATION_API_SPEC.md)** — Device registration and request management endpoints

### For Architecture Overview
- **[Plan: notification-system.md](./plan/notification-system.md)** — Complete system design and requirements

---

## Document Summary

### ANDROID_QUICK_START.md
**Time:** 5 minutes read, 45-60 minutes implementation

A condensed checklist covering the essential steps:
- Package installation (5 min)
- Capacitor configuration (2 min)
- Firebase setup (10 min)
- Gradle configuration (5 min)
- Capacitor sync (3 min)
- Signing keystore (2 min)
- Build and test (10 min)

**Use this when:** You need to get up and running quickly and don't need detailed explanations.

**Output:** Working Android app receiving notifications.

---

### ANDROID_SETUP.md
**Time:** 2-3 hours detailed reading + implementation

The comprehensive guide organized into 14 parts:

| Part | Topic | Time | Key Output |
|------|-------|------|-----------|
| 1 | Capacitor Installation | 15 min | `capacitor.config.ts` |
| 2 | Firebase Console Setup | 10 min | `google-services.json` |
| 3 | Gradle Configuration | 10 min | Modified build.gradle files |
| 4 | Android Platform Setup | 10 min | Synced Android platform |
| 5 | App Signing (Debug/Release) | 15 min | Debug keystore, SHA-1 in Firebase |
| 6 | Notification Channel Configuration | 10 min | Understanding high-importance channel |
| 7 | Push Notification Testing | 30 min | Verified device registration and notification delivery |
| 8 | Deep Linking Configuration | 15 min | Intent filters, route handling |
| 9 | Troubleshooting | Reference | Common issues and solutions |
| 10 | Production Build | 20 min | Release APK/AAB for Play Store |
| 11 | Environment Variables | 10 min | Configuration for different environments |
| 12 | Versioning and Updates | 5 min | Version management for updates |
| 13 | Manual Setup Checklist | 5 min | Verification checklist |
| 14 | Next Steps | Reference | What to implement after setup |

**Use this when:** You need to understand each step deeply and implement from scratch.

**Prerequisites:**
- Android Studio installed
- Physical Android device or emulator with Google Play Services
- Firebase project created
- Basic familiarity with Gradle and Android development

**Success Criteria:**
- App builds and runs on device/emulator
- Notification permission is requested and granted
- Device registers with backend
- Test notification appears on device with sound/vibration
- Tapping notification navigates to correct route

---

### ANDROID_TROUBLESHOOTING.md
**Time:** 30 minutes browse, reference as needed

Organized into 8 troubleshooting categories with 24+ specific issues:

| Category | Issues | When to Use |
|----------|--------|------------|
| 1. Installation & Config | 3 issues | Build fails, config not found |
| 2. Firebase | 4 issues | Token generation fails, SHA-1 issues |
| 3. Permissions & Channels | 4 issues | Permission not requested, no sound |
| 4. Signing & Build | 3 issues | Keystore problems, build failures |
| 5. Runtime & Device | 4 issues | App crashes, registration fails |
| 6. Emulator-Specific | 3 issues | Google Play Services, localhost, performance |
| 7. Firebase-Specific | 3 issues | Invalid token, sender ID mismatch |
| 8. Deployment | 3 issues | Gradle timeout, large APK |

**Each issue includes:**
- Error message
- Root cause
- Step-by-step solutions
- Diagnostic commands

**Plus:**
- Debugging techniques section
- Performance profiling tips
- Getting help resources

**Use this when:** Something goes wrong and you need help diagnosing and fixing it.

---

### NOTIFICATION_API_SPEC.md
**Time:** 1-2 hours implementation

Specification for backend endpoints required by the Android app:

**Endpoints Covered:**
1. **Device Registration**
   - `POST /api/host/devices/register` — Register device for push
   - `POST /api/host/devices/unregister` — Unregister device
   - `GET /api/host/devices` — List host's devices
   - `DELETE /api/host/devices/:id` — Remove device

2. **Notifications**
   - `POST /api/host/notifications/test` — Send test notification
   - Modified `POST /api/guest/requests` — Trigger notifications

3. **Request Management**
   - `GET /api/host/requests` — List requests
   - `GET /api/host/requests/:id` — Get request details
   - `POST /api/host/requests/:id/acknowledge` — Acknowledge request
   - `POST /api/host/requests/:id/seen` — Mark as seen
   - `POST /api/host/requests/:id/start` — Start handling
   - `POST /api/host/requests/:id/resolve` — Resolve request

**For Each Endpoint:**
- Full request/response schema with examples
- Authentication and authorization requirements
- Implementation notes
- Backend logic pseudocode
- Rate limiting guidance

**Plus:**
- Data model definitions (SQL CREATE statements)
- Security considerations
- Error handling format
- Implementation roadmap

**Use this when:** Implementing backend endpoints to support the Android app.

---

## Implementation Timeline

### Week 1: Setup (5 hours)
- [ ] Follow ANDROID_QUICK_START.md (1 hour)
- [ ] Verify app builds and runs (30 min)
- [ ] Test notification permission flow (30 min)
- [ ] Reference ANDROID_SETUP.md for clarification (2-3 hours as needed)

### Week 2: Backend Integration (15 hours)
- [ ] Implement device registration endpoints (4 hours)
- [ ] Implement test notification endpoint (3 hours)
- [ ] Implement request state endpoints (5 hours)
- [ ] Test end-to-end flow (3 hours)

### Week 3: Testing & Hardening (10 hours)
- [ ] Test on multiple devices (3 hours)
- [ ] Test on emulator (2 hours)
- [ ] Handle edge cases and errors (3 hours)
- [ ] Performance and battery optimization (2 hours)

### Week 4: Production Preparation (5 hours)
- [ ] Configure release signing (2 hours)
- [ ] Prepare Play Store listing (2 hours)
- [ ] Create deployment documentation (1 hour)

**Total:** ~35 hours for complete implementation

---

## Key Concepts

### Notification Channel
An Android concept for organizing notifications by importance and user controls.

- **guest-requests channel:** High-importance (IMPORTANCE_HIGH = 5)
- Created automatically by app on first notification registration
- Allows bypassing Do Not Disturb mode (with user control)
- User can mute or change settings via **Settings** → **Apps** → **Notifications**

### Deep Linking
Opening the app to a specific route (e.g., `/host/requests/123`) when a notification is tapped.

- Requires `AndroidManifest.xml` intent filter
- Firebase payload includes route in data section
- `CapacitorNotificationClient` extracts route and navigates

### Idempotency
Operations can be repeated safely without side effects.

- Device registration: Same token, same host → returns existing device
- Acknowledgement: Same request → returns success
- Unregistration: Already unregistered → returns success

### FCM Token
Firebase's identifier for a device. Used to send notifications.

- Obtained from Firebase on app startup
- Posted to backend `/api/host/devices/register`
- Should never be logged in full
- May rotate over time (app handles automatically)

---

## Checklist for Success

### Pre-Implementation
- [ ] Read ANDROID_QUICK_START.md
- [ ] Have physical Android device or emulator ready
- [ ] Have Android Studio installed
- [ ] Have Firebase project created
- [ ] Understand the notification system architecture (see plan/notification-system.md)

### Setup Phase
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

### Build & Test Phase
- [ ] `npm run build` successful
- [ ] `npx cap copy android` successful
- [ ] `npx cap run android` runs on device/emulator
- [ ] Notification permission dialog appears
- [ ] Permission granted
- [ ] Device appears in backend device list
- [ ] Test notification sent from Firebase Console
- [ ] Notification received on device with sound/vibration
- [ ] Tapping notification navigates to correct route

### Backend Implementation
- [ ] Device registration endpoints implemented
- [ ] Device unregistration endpoints implemented
- [ ] Device listing endpoints implemented
- [ ] Test notification endpoint implemented
- [ ] Request state endpoints implemented
- [ ] Database migrations applied
- [ ] All endpoints tested with curl or Postman

### Production Readiness
- [ ] Release keystore created (stored securely, not in Git)
- [ ] Release certificate SHA-1 registered in Firebase
- [ ] Environment variables configured for production
- [ ] Firebase project production-ready
- [ ] All automated tests passing
- [ ] Security review completed (see security.md)
- [ ] Manual QA on 2+ devices
- [ ] Rate limiting implemented
- [ ] Audit logging implemented

---

## Troubleshooting Quick Reference

**Issue:** Notification permission never requested
→ See [ANDROID_TROUBLESHOOTING.md#issue-31](./ANDROID_TROUBLESHOOTING.md#issue-31-notification-permission-never-requested)

**Issue:** Device registration fails
→ See [ANDROID_TROUBLESHOOTING.md#issue-52](./ANDROID_TROUBLESHOOTING.md#issue-52-device-registration-fails-token-not-posted-to-backend)

**Issue:** Notification not received
→ See [ANDROID_TROUBLESHOOTING.md#issue-54](./ANDROID_TROUBLESHOOTING.md#issue-54-notification-not-appearing-after-send)

**Issue:** Gradle sync fails
→ See [ANDROID_TROUBLESHOOTING.md#issue-12](./ANDROID_TROUBLESHOOTING.md#issue-12-gradle-sync-fails)

**Issue:** Deep link doesn't work
→ See [ANDROID_SETUP.md#part-8](./ANDROID_SETUP.md#part-8-deep-linking-configuration)

---

## What's NOT Covered

These topics are addressed elsewhere:

- **iOS setup:** See separate iOS documentation (when available)
- **PWA/Web push:** See web-push setup documentation
- **Escalation logic:** See [notification-system.md](./plan/notification-system.md#acknowledgement-and-escalation)
- **Google Play Store submission:** See Play Store documentation
- **Production CI/CD:** See deployment documentation
- **Capacitor advanced features:** See [Capacitor documentation](https://capacitorjs.com)

---

## File Locations

All documentation lives in `/docs/`:

```
docs/
├── ANDROID_SETUP_INDEX.md          (this file)
├── ANDROID_QUICK_START.md          (5-min checklist)
├── ANDROID_SETUP.md                (comprehensive guide)
├── ANDROID_TROUBLESHOOTING.md      (issue resolution)
├── NOTIFICATION_API_SPEC.md        (backend endpoints)
├── plan/
│   └── notification-system.md      (system architecture)
└── ...
```

Related source code:

```
lib/notifications/
├── capacitor-notification-client.ts
├── notification-client.ts
├── notification-client-factory.ts
├── notification-click-handler.ts
└── __tests__/
    └── capacitor-notification-client.test.ts

types/
└── capacitor.d.ts                  (type definitions)

android/                            (created by `npx cap add android`)
├── app/
│   ├── google-services.json        (from Firebase)
│   ├── debug.keystore              (debug signing)
│   └── build.gradle                (Gradle config)
└── build.gradle                    (Gradle config)

capacitor.config.ts                 (Capacitor config)
```

---

## Support and Resources

### Official Documentation
- [Capacitor Docs](https://capacitorjs.com)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Android Developer Docs](https://developer.android.com)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

### In-Project Resources
- `src/lib/notifications/capacitor-notification-client.ts` — Implementation reference
- `src/lib/notifications/__tests__/` — Test examples
- `types/capacitor.d.ts` — Type definitions
- `docs/plan/notification-system.md` — Architecture and requirements

### Getting Help
1. Check [ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md) for your issue
2. Review logs: `adb logcat | grep -i "aicohost\|firebase"`
3. Check GitHub issues: Capacitor, Firebase Android SDK repos
4. Consult official documentation links above

---

## Document Maintenance

**Last Updated:** 2026-06-19

These documents are comprehensive as of the date above. To stay current:

- Update examples when package versions change
- Add new troubleshooting issues as they arise
- Keep API specification in sync with backend implementation
- Link to updated references when available

**To contribute updates:**
1. Update relevant .md file
2. Test instructions if they include code
3. Update "Last Updated" date
4. Note what changed in commit message

---

## Next Steps After Setup

Once the Android app is building and receiving notifications:

1. **Implement Backend Endpoints** (see NOTIFICATION_API_SPEC.md)
   - Device registration and management
   - Notification delivery from guest requests
   - Request state transitions

2. **Test End-to-End Flow**
   - Guest submits request
   - Host receives notification
   - Host taps notification to open request
   - Host acknowledges request

3. **Configure Escalation** (see plan/notification-system.md)
   - Implement escalation policy
   - Backup host notifications
   - Fallback (SMS/WhatsApp) support

4. **Production Hardening**
   - Token cleanup for inactive devices
   - Rate limiting
   - Structured logging
   - Performance monitoring

5. **Set Up iOS** (similar to Android)
   - APNs configuration
   - iOS-specific setup
   - Deep linking for iOS

---

**Status:** Complete and ready for implementation.

**Questions or issues?** Refer to the troubleshooting guide or check official documentation links.
