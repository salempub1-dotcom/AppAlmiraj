# Android release handoff

## Status on 2026-09-10

- PR #6 merged into main at `ffc6f0dff6d074190503811183470e5541070ccd`.
- `npm run typecheck`: passed.
- `expo export --platform android --max-workers 2`: passed; 1,114 modules and a Hermes bundle were generated.
- Export is a compile/bundle check only: it does not execute app startup, authenticate users, compile native Android code, sign an APK, or test backend connectivity.
- No Android emulator/device is available in the execution environment.
- Expo dashboard authenticated as `almiradjapp`. Created the EAS project `al-miraj-app` after confirming the account had no projects. Project UUID: `284b813c-50f3-4104-a2bf-62dc065eebe6`.
- EAS Update configuration is prepared but incomplete: `expo-updates` is not installed. Network package installation was blocked; an offline attempt failed with `ENOTCACHED`. No native build or OTA update has been published.

## Build profiles

`eas.json` provides `preview` (internally distributed APK) and `production` (AAB), with matching, separate EAS environments and update channels. `app.config.js` identifies the registered EAS project. The fingerprint runtime policy separates updates when native dependencies or configuration change. These settings alone do not install the update module, provision credentials, create server-side channels, start a build, or publish an update.

The existing application ID remains `com.almiraj.education` and the app version remains `1.0.0`. Confirm ownership of that ID before the first signed release. Remote version management increments the production build number; initialize it from the existing Play release history if there is one.

## Before the first APK

1. Finish the EAS Update dependency installation below before merging the configuration draft or creating a build.
2. Resolve native dependency mismatches reported by the installed Expo SDK. At inspection: `react-native` 0.86.2 (expected 0.86.3), `react-native-safe-area-context` 5.9.1 (expected ~5.7.0), and `react-native-screens` 4.27.0 (expected ~4.26.0). Refresh package-lock.json together with package.json, then rerun typecheck and Android export. No dependency update was performed in this phase.
3. Authenticate EAS CLI as `almiradjapp` and verify that `eas project:info` reports the UUID above. The browser session does not authenticate the CLI. Reuse this registered project.
4. Configure the application's confirmed public runtime configuration in both relevant EAS environments. Never embed server credentials or signing secrets in source code. Runtime values were not available during the bundle-only test.
5. Configure the approved app icon, Android adaptive icon, and splash assets. None are currently configured in app.config.js. Do not substitute an unapproved logo.
6. Confirm/reuse Android signing credentials; do not replace an existing upload key.
7. Run `eas build --platform android --profile preview` in the authenticated, configured environment.

## Complete EAS Update setup

In an environment with permitted npm access, from the branch containing this configuration:

```sh
npx expo install expo-updates react-native react-native-safe-area-context react-native-screens
npx expo install --check
npm run typecheck
npx expo export --platform android --max-workers 2
```

The installed Expo SDK currently expects `expo-updates ~57.0.19`. Use Expo's version selection, commit both package.json and package-lock.json, and review the changes. Keep this configuration as a draft until installation and validation pass.

After the release prerequisites above are completed, build and install the preview APK. For subsequent compatible Android updates:

```sh
eas update --platform android --channel preview --environment preview --message "Describe the tested change"
```

Test the update on the installed APK before publishing to production, using the production environment and channel. Use the same reviewed configuration and environment when building and publishing. With the fingerprint policy, any native runtime change requires a new compatible build.

The app checks for updates on launch while immediately using its cached or embedded bundle. A downloaded update normally applies on a subsequent cold launch; changes are not pushed into an already open screen. GitHub commits alone do not publish updates. There is no automatic deployment workflow in this change.

## Device acceptance checklist (not yet executed)

- Cold start online/offline; no blank screen or crash.
- Install preview APK, publish a harmless preview-only change, cold launch online to download it, then relaunch and verify it appears. Verify offline startup and that a production build does not receive preview updates.
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
- [EAS Update setup](https://docs.expo.dev/eas-update/getting-started/)
- [Runtime compatibility](https://docs.expo.dev/eas-update/runtime-versions/)
