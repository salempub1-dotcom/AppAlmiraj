# Google sign-in: Android integration draft

This draft adds Google as an alternative on both existing email/password screens.
It is not ready to merge, build, or publish. No Google provider settings were changed.
The connected Supabase account returned an empty project list, so the app's actual
Auth configuration could not be inspected. Do not create a replacement project.

## Complete dependency setup

Install `@react-native-google-signin/google-signin` in this branch using Expo,
commit package.json and package-lock.json together, and run TypeScript, Expo
dependency validation, and Android export. The dependency has not been installed
in this environment. Do not use local TypeScript shims to hide the missing package.

The integration uses the documented Original Google Sign-In API, including
`isSuccessResponse`. Its underlying Android SDK is deprecated but still functional
according to the maintainer. Before release, review support for the installed
version/Expo SDK and decide whether to use Google's newer Credential Manager
integration; the maintainer's Universal module is a separate offering.

## Provider configuration

1. Identify the existing Supabase project from the working app's URL.
2. In the intended Google Cloud project, configure the consent screen with the
   actual app identity and only email/basic profile scopes. If in Testing, add
   the intended testers. Do not request Gmail inbox, contacts, or Drive access.
3. Register an Android OAuth client for `com.almiraj.education` with the SHA-1 of
   the existing EAS signing certificate. Never generate a replacement keystore.
   A future Play release also needs its Play App Signing certificate registered.
4. Register/reuse a Web OAuth client for the server audience. Enable Google in
   the existing Supabase Auth project and configure the matching client ID and
   provider credentials there. Keep client secrets only in provider configuration.
   Keep audience/nonce verification enabled; do not loosen validation to fix errors.
5. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to that Web client ID in the relevant
   EAS build/update environment. It is a public identifier, not a client secret.
6. Follow the installed library's Expo config-plugin instructions. This draft
   does not invent an iOS URL scheme or Firebase configuration. iOS Google login
   is intentionally hidden until a separate iOS configuration is implemented.
7. Build a new preview APK with the native dependency, reusing signing credentials.
   Do not publish this change as an OTA update for the previous APK. Fingerprint
   runtime compatibility must change with the new native dependency/configuration.

## Acceptance before merging/releasing

- Run typecheck and export with the actual installed library, then native build.
- New Google account creates a Supabase session and expected teacher profile.
- Existing Google account signs in; Supabase session persists after restart.
- Email/password sign-in and email-confirmed registration still work.
- Existing verified email account linking follows Supabase's configured behavior;
  never manually merge users or authorize access using user profile metadata.
- Cancel selection, retry, double tap, offline error, unavailable Play services,
  and wrong client ID/signing certificate all fail recoverably.
- Sign out and test a different account. No ID tokens or provider secrets in logs.
- Verify actual Google button branding against Google's published guidelines.

## References

- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://react-native-google-signin.github.io/docs/original
- https://react-native-google-signin.github.io/docs/setting-up/expo
