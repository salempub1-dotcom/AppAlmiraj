# Teacher Toolkit: images to PDF — implementation status

Branch: `feat/teacher-tools-images-pdf-20261009`. Based on main SHA `2b7aa44f780e5f72e0bfdd9a4ae86b97b80e52e0`.

## Delivered
- Toolkit navigation entry in account (including guest), preserves existing classroom tool routes.
- Multi-select gallery + camera, reorder/remove, A4/A3, orientation, margin presets.
- HTML-to-PDF export locally with embedded base64 images (required for iOS WebView printing).
- Share / native print of exported PDF.
- Arabic/English toolkit strings, existing theme integration. No Supabase calls.

## IMPORTANT: Incomplete validation / merge blockers
1. `package.json` declares Expo SDK 57-compatible `expo-print`, `expo-sharing`, `expo-file-system`, but `package-lock.json` has **not yet been regenerated**. Run `npm install` in a network-enabled workspace and commit the lockfile, then verify `npm ci`.
2. Collect a **baseline** from the unmodified main commit: `npm ci && npm run typecheck && npx expo-doctor`. Compare it with the feature branch; document all pre-existing errors. GitHub PR #10 reports unrelated TypeScript errors but is not a reproducible baseline.
3. Run `npm run typecheck` on the branch, repair any new errors.
4. Test real Android and iOS Expo builds. Validate actual PDF page count, A3/A4 dimensions, memory use, orientation, margin, sharing and print.
5. Gallery may return HEIC/other formats. Convert unsupported types to JPEG using already-installed `expo-image-manipulator` before export. Avoid forcing JPEG MIME onto non-JPEG bytes.
6. PDF preview is presently **image sequence preview** rather than full rendered-page WYSIWYG. Implement real page preview before marking feature complete.
7. Export is held in temporary app storage; sharing is not proof of persistent saving. Add a clear persistent save/export flow.
8. Inline images are capped at 24 MiB total for safety; test WebView memory on low-memory devices.
9. Verify navigation to the toolkit from Profile guest/authenticated states and both languages.
10. Do not merge until acceptance checks have passed. No production release, no Supabase migration.

## Official references
- https://docs.expo.dev/versions/v57.0.0/sdk/print/
- https://docs.expo.dev/versions/v57.0.0/sdk/sharing/
- https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/
