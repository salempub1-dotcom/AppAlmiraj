# Android Preview — Images to PDF acceptance test

This is **internal testing only**, never production. Source branch: `feat/teacher-tools-images-pdf-20261009`, PR #14.

## Requirements
- Node.js >=22.13 and npm, Expo account with access to `almiradjapp/al-miraj-app`.
- EAS CLI: `npx eas-cli@latest`. Login locally: `npx eas-cli@latest login`.
- Use the existing **preview** profile in `eas.json` (Android `apk`, `distribution: internal`). Never use `production`.
- EAS may request Android signing credentials; approve only for this preview build. Do not paste access tokens/credentials into chat or commit them.

## Build on your computer (PowerShell)
```powershell
git clone https://github.com/salempub1-dotcom/AppAlmiraj.git
cd AppAlmiraj
git switch feat/teacher-tools-images-pdf-20261009
npm ci
npm run typecheck
npx expo-doctor
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```
Select remote/cloud build if prompted. The EAS console URL (and resulting APK download link once finished) is printed by EAS. **This does not submit a build to Google Play.** Check that branch/commit shown belongs to PR #14.

## Device acceptance checklist (real Android phone)
- Install APK from the EAS build URL. Do not replace a critical installed production app if Android prompts an overwrite; use a dedicated test device or back up data first.
- Open Account > Tools > Images to PDF. Check guest and authenticated access; open old timer, random picker and groups.
- Pick 1, 3 and 10 images; mix portrait and landscape. Reorder and delete. Cancel picker; deny camera permissions and retry.
- Export A4 portrait/landscape, A3 portrait/landscape, margins 0/5/10/20 mm. Check page count, dimensions and no crops/distortions using a PDF viewer or printer.
- Test JPEG, PNG, HEIC/HEIF from camera if supported, larger photos and error messages for oversized selections.
- Test share, open in PDF reader, print if printer is available. Confirm destination is accessible after application restart. Exports remain in app Documents; external Downloads save-as is NOT implemented.
- Dark/light mode, Arabic/English, offline operation, cancel and low-memory phone.
- Record phone model, Android version, EAS build URL, successes/failures. Attach screen recording/screenshots to PR #14, without private student images.

## Known caveats
- Current first-page preview is approximate, not a full rendered PDF.
- The app uses a 24 MiB total source-image cap and embeds base64 in one HTML document: real-device memory testing is mandatory.
- HEIC conversion currently relies on filename extension; URI/mime mismatches need testing.
- iOS needs its own real-device verification.
- No merge to main or production release until the above passes.
