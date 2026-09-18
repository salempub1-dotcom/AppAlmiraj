# Google Sign-In setup — Al Miraj Education

Status: **configuration in progress / not device-verified yet**. Do not mark Google sign-in complete until a fresh EAS Preview APK signs in on a real Android device and a Supabase session is created.

## Fixed project identity

- Expo account: `almiradjapp`
- Expo project: `al-miraj-app`
- EAS project ID: `284b813c-50f3-4104-a2bf-62dc065eebe6`
- Android package: `com.almiraj.education`
- Target Supabase project ref for the teacher-space app: `szgvpajhmqvxugoeoidc`
- `kgtgfxjpwfbtlegrquiy` is the separate `store-elmiraj` project and must not be used for teacher-space auth.

## 1. Google Cloud — Web client

In Google Auth Platform → Clients → **Web client 1**:

- `https://szgvpajhmqvxugoeoidc.supabase.co/auth/v1/callback` is the callback used by the teacher-space app.
- `https://kgtgfxjpwfbtlegrquiy.supabase.co/auth/v1/callback` may remain if the separate store project needs it.

The target callback has been confirmed present and saved.

Use the **Web Client ID** for the app/EAS public configuration. The **Client Secret** belongs only in the Supabase Google provider configuration. Never paste the Client Secret into chat, source code, GitHub, `.env.example`, or any `EXPO_PUBLIC_*` variable.

## 2. EAS signing SHA-1

The Preview build uses the EAS Android keystore for `com.almiraj.education`.

Verified SHA-1 fingerprint:

```text
DC:B7:A2:61:E4:BD:11:74:18:BA:09:00:FF:07:3B:DA:72:BA:73:46
```

This was obtained from:

```bash
npx eas-cli@latest credentials -p android
```

using the `preview` profile.

## 3. Google Cloud — Android client

An Android OAuth client was created with:

- Application type: **Android**
- Name: `Al Miraj Education Android (EAS)`
- Package name: `com.almiraj.education`
- SHA-1: `DC:B7:A2:61:E4:BD:11:74:18:BA:09:00:FF:07:3B:DA:72:BA:73:46`

The Android client has no secret that belongs in the app.

## 4. Supabase — Google provider

Target project: `szgvpajhmqvxugoeoidc`.

In Authentication → Providers → Google, the following were visually confirmed:

- Google sign-in enabled.
- Web Client ID configured.
- Client Secret configured and masked.
- Callback URL belongs to `szgvpajhmqvxugoeoidc`.
- `Skip nonce checks` remains off.
- `Allow users without an email` remains off.

Do not use the Android client ID in place of the Web Client ID for the Supabase provider.

## 5. EAS Preview environment

The Preview environment has been verified to contain:

```text
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<WEB_CLIENT_ID>.apps.googleusercontent.com
EXPO_PUBLIC_SUPABASE_URL=https://szgvpajhmqvxugoeoidc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable key for szgvpajhmqvxugoeoidc>
```

The Google Client ID and Supabase publishable key are public app configuration. The Google Client Secret must never be exposed as `EXPO_PUBLIC_*`.

This branch rejects any Supabase URL other than `https://szgvpajhmqvxugoeoidc.supabase.co`.

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
