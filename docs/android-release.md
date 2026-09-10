# Android release handoff

## Verified on 2026-09-09

- PR #6: `chore/publish-readiness` (not merged at inspection).
- `npm run typecheck`: passed.
- `expo export --platform android --max-workers 2`: passed; 1,114 modules and a Hermes bundle were generated.
- Export is a compile/bundle check only: it does not execute app startup, authenticate users, compile native Android code, sign an APK, or test backend connectivity.
- No Android emulator/device or Expo account session was available in the execution environment.

## Build profiles

`eas.json` provides `preview` (internally distributed APK) and `production` (AAB). They use separate EAS environments. These profiles do not link the project, provision credentials, start a build, or publish anything.

The existing application ID remains `com.almiraj.education` and the app version remains `1.0.0`. Confirm ownership of that ID before the first signed release. Remote version management increments the production build number; initialize it from the existing Play release history if there is one.

## Before the first APK

1. Review and merge PR #6, or explicitly build its reviewed branch.
2. Resolve native dependency mismatches reported by the installed Expo SDK. At inspection: `react-native` 0.86.2 (expected 0.86.3), `react-native-safe-area-context` 5.9.1 (expected ~5.7.0), and `react-native-screens` 4.27.0 (expected ~4.26.0). Refresh package-lock.json together with package.json, then rerun typecheck and Android export. No dependency update was performed in this phase.
3. Sign into the intended Expo account and link the existing EAS project. Do not create a duplicate project. No owner or project UUID was inferred in this change.
4. Configure the application's confirmed public runtime configuration in both relevant EAS environments. Never embed server credentials or signing secrets in source code. Runtime values were not available during the bundle-only test.
5. Configure the approved app icon, Android adaptive icon, and splash assets. None are currently configured in app.config.js. Do not substitute an unapproved logo.
6. Confirm/reuse Android signing credentials; do not replace an existing upload key.
7. Run `eas build --platform android --profile preview` in the authenticated, configured environment.

## Device acceptance checklist (not yet executed)

- Cold start online/offline; no blank screen or crash.
- Guest opens Teacher Space, signs in through its prompt, and returns to the correct tab.
- Sign up, sign in, sign out, and persisted session after restart.
- Teacher Space / Store / Profile navigation; Android back and gesture navigation.
- Arabic/English and light/dark, including tab labels and header visibility.
- Create/edit post, image/PDF attachment, comment, save, follow, and report using designated test data.
- Owner actions remain above Android system navigation controls.
- Product list, cart, delivery quote, and order flow against an explicitly approved test setup; do not create real delivery orders as a smoke test.
- Permission denial and network failure show recoverable messages.

Only after acceptance, build with `eas build --platform android --profile production`. Submission is a separate authorized step; this change does not configure auto-submit. Also review privacy disclosures, account deletion, moderation, and store listing requirements before submission.

## References

- [EAS configuration](https://docs.expo.dev/build/eas-json/)
- [APK versus AAB](https://docs.expo.dev/build-reference/apk/)
- [EAS environment configuration](https://docs.expo.dev/eas/environment-variables/)
