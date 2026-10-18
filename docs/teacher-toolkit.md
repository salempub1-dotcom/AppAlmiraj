# Teacher Toolkit: Images to PDF

Phase 1 adds a Tools tab alongside the existing classroom tools. Photos are processed locally: no Supabase uploads, tables, buckets or policy changes.

## Features

Gallery multi-select and camera, reorder/remove, A4/A3, portrait/landscape, margins, aspect-preserving placement, native PDF preview, local history, sharing, printing, Android folder export and iOS Save to Files via the share sheet. Arabic/English and existing theme are reused.

PDF generation uses pdf-lib and sequential Expo ImageManipulator processing. Temporary generated images are deleted; saved PDFs remain until deleted by the user or app removal. Picker originals are never deleted. Limits: 20 images, 25 MB and 50 megapixels per source, 24 MB total embedded image bytes. Output targets 200 DPI capped at 3000 pixels without upscaling. These are provisional safeguards, not device memory benchmarks.

Preview uses react-native-pdf 7.0.5, react-native-blob-util 0.24.5 and its Expo config plugin. A new native build is required; this feature cannot be validated in Expo Go or delivered solely as an OTA update. Expo SDK 57 and React Native 0.86 remain unchanged.

## Verification

- TypeScript: passed, including minimal fixes for existing type errors (style props, navigation header option, palette indexing and callback type).
- Six PDF tests: passed; paper dimensions, orientation, margins, image aspect ratio, invalid inputs, serialized multi-page PDF.
- Android and iOS Metro exports: passed.
- Expo prebuild for both platforms in an isolated copy: passed.
- Native compilation and physical-device tests: pending; this environment has no Android SDK or Xcode.

## Required before merge/release

Build an internal APK using the existing preview EAS profile and an appropriately provisioned iOS build. Confirm native PDF library compatibility with this RN version on both platforms. Test gallery cancellation and limited access, denied camera permission, camera rotation/HEIC/PNG, large images and low-memory devices, repeated generation/cancel, every paper orientation, preview page order, export destination cancellation, iOS Save to Files, printing, saved-file deletion and relaunch. Verify Arabic/RTL, English, both themes, and all original tabs/classroom tools.

The preview is the generated PDF itself; internal saving precedes preview, while external export/printing happens only on request. Limits and print quality must be verified on actual devices. Smart Print and Flashcard Maker remain future phases. Do not merge or publish a production build until device testing is complete.
