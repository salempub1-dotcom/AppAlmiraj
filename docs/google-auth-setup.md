# Google Sign-In setup — Al Miraj Education

Status: **not enabled / not verified yet**. Do not mark Google sign-in complete until a fresh EAS Preview APK signs in on a real Android device and a Supabase session is created.

## Fixed project identity

- Expo account: `almiradjapp`
- Expo project: `al-miraj-app`
- EAS project ID: `284b813c-50f3-4104-a2bf-62dc065eebe6`
- Android package: `com.almiraj.education`
- Target Supabase project ref: `kgtgfxjpwfbtlegrquiy` (`store-elmiraj`)
- Do **not** use `szgvpajhmqvxugoeoidc` for this app.

## 1. Google Cloud — Web client

In Google Auth Platform → Clients → **Web client 1**, keep the existing callback if another app still needs it and add the target callback:

- `https://szgvpajhmqvxugoeoidc.supabase.co/auth/v1/callback` (legacy/other project; keep only while needed)
- `https://kgtgfxjpwfbtlegrquiy.supabase.co/auth/v1/callback` (Al Miraj Education target)

Save the client after the target callback is present.

Copy the **Web Client ID**. Copy the **Client Secret** only when needed for the Supabase dashboard. Never paste the Client Secret into chat, source code, GitHub, `.env.example`, or any `EXPO_PUBLIC_*` variable.

## 2. EAS signing SHA-1

Use the certificate that signs the EAS Android build, not a debug certificate.

From the project directory:

```bash
npx eas-cli@latest credentials -p android
```

Choose the credentials used by the `preview` build and copy the **SHA-1 fingerprint** if displayed.

If SHA-1 is not displayed, download the Android credentials/keystore through the EAS credentials menu, then inspect the certificate locally:

```bash
keytool -list -v -keystore /path/to/keystore.jks -alias YOUR_ALIAS
```

Use the `SHA1:` value. Keep the keystore and its passwords private and out of Git.

## 3. Google Cloud — Android client

Create an OAuth client with:

- Application type: **Android**
- Name: `Al Miraj Education Android (EAS)`
- Package name: `com.almiraj.education`
- SHA-1: the EAS signing fingerprint from step 2

The Android client has no secret that belongs in the app.

## 4. Supabase — Google provider

Open the **target** project `kgtgfxjpwfbtlegrquiy`, then Authentication → Providers → Google.

Configure the provider with the Google **Web Client ID** and **Client Secret** from step 1, then enable Google. Do not use the Android client ID as the web client ID.

If Supabase provides a multi-client-ID field, keep the Web client ID first; add additional platform client IDs only when required by the chosen flow.

## 5. EAS Preview environment

Set the public Web Client ID in the EAS **preview** environment:

```text
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<WEB_CLIENT_ID>.apps.googleusercontent.com
```

The Client ID is public configuration. The Client Secret must never be exposed as `EXPO_PUBLIC_*`.

The preview environment must also contain the existing target Supabase values:

```text
EXPO_PUBLIC_SUPABASE_URL=https://kgtgfxjpwfbtlegrquiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable key for kgtgfxjpwfbtlegrquiy>
```

The app now rejects any Supabase URL whose host is not `kgtgfxjpwfbtlegrquiy.supabase.co`.

## 6. Native dependency and Preview build

This branch uses:

```text
@react-native-google-signin/google-signin ^16.1.5
```

Google login uses the native Android module to obtain an ID token and sends that token to:

```ts
supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
```

The email/password flows remain unchanged.

The current Expo config uses `runtimeVersion: { policy: 'fingerprint' }`, so the native-module build gets a compatible runtime fingerprint and should not receive incompatible updates intended for the old binary.

For the Preview APK:

```bash
npx eas-cli@latest build -p android --profile preview
```

The Preview profile temporarily sets `EAS_NO_FROZEN_LOCKFILE=1` so EAS can install the newly added native dependency while `package-lock.json` is regenerated. Before production merge/release, regenerate and commit the lockfile locally and remove that Preview-only workaround if no longer needed.

## 7. Acceptance test on a real Android device

Google is only considered enabled after all of these pass:

1. Install the newly built Preview APK (an OTA update is not sufficient for a new native module).
2. Confirm email/password sign-in still works.
3. Tap **Continue with Google** and confirm the native Google account chooser opens.
4. Select a Google account and confirm the app enters the teacher space.
5. Confirm Supabase Auth contains the user and the app holds a non-null Supabase session.
6. Sign out, relaunch the app, and repeat Google sign-in.
7. Cancel the Google chooser once and confirm the app stays on the auth screen without creating a session.

Common Android `DEVELOPER_ERROR` causes are a wrong package name, wrong SHA-1, or wrong Web Client ID.
