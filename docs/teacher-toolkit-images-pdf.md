# Teacher Toolkit: images to PDF — implementation status

Branch: `feat/teacher-tools-images-pdf-20261009`. Based on main SHA `2b7aa44f780e5f72e0bfdd9a4ae86b97b80e52e0`.

## Delivered
- Toolkit navigation entry in account (including guest), preserves existing classroom tool routes.
- Multi-select gallery + camera, reorder/remove, A4/A3, orientation, margin presets.
- HTML-to-PDF export locally with embedded base64 images (required for iOS WebView printing).
- Share / native print of exported PDF.
- Locally normalize HEIC/HEIF/WebP to JPEG before embedding where URI extensions expose unsupported formats.
- Copy generated PDF to app Documents so it survives temporary-cache cleanup (not yet user-selected external folder).
- In-app proportional first-page layout preview (approximate, not native PDF rendering).
- Arabic/English toolkit strings, existing theme integration. No Supabase calls.

## IMPORTANT: Incomplete validation / merge blockers
1. `package.json` declares Expo SDK 57-compatible `expo-print`, `expo-sharing`, `expo-file-system`, but `package-lock.json` has **not yet been regenerated**. Run `npm install` in a network-enabled workspace and commit the lockfile, then verify `npm ci`.
2. Collect a **baseline** from the unmodified main commit: `npm ci && npm run typecheck && npx expo-doctor`. Compare it with the feature branch; document all pre-existing errors. GitHub PR #10 reports unrelated TypeScript errors but is not a reproducible baseline.
3. Run `npm run typecheck` on the branch, repair any new errors.
4. Test real Android and iOS Expo builds. Validate actual PDF page count, A3/A4 dimensions, memory use, orientation, margin, sharing and print.
5. HEIC/HEIF/WebP conversion has an initial implementation based on image URI extension; test assets whose MIME disagrees with filename and file/content URIs; improve detection as needed.
6. Preview now approximates page size, orientation and margins for first image. This is **not** a rendered PDF preview; test and improve before release.
7. PDF exports now copy to app Documents. This is persistent inside the app sandbox, **not** a user-selected Downloads folder. Add an external save-as flow and exported-files management before release.
8. Inline images are capped at 24 MiB total for safety; test WebView memory on low-memory devices.
9. Verify navigation to the toolkit from Profile guest/authenticated states and both languages.
10. Do not merge until acceptance checks have passed. No production release, no Supabase migration.

## Official references
- https://docs.expo.dev/versions/v57.0.0/sdk/print/
- https://docs.expo.dev/versions/v57.0.0/sdk/sharing/
- https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/
