# Submitting Bookmark Notes & Tasks to the Chrome Web Store

## Files in this folder

- `store-listing.md` - all listing text (name, summary, description, single
  purpose, permission justifications, data disclosures). Copy-paste into the
  dashboard fields.
- `PRIVACY.md` - a privacy policy. Host it at a public URL and paste that link
  into the Privacy tab.
- `screenshots/` - three 1280x800 PNG screenshots, ready to upload.

The package itself is built by `scripts/build-zip.sh` into
`dist/bookmark-notes-tasks-v<version>.zip` (see "Rebuild the package" below).

## Step by step

1. On the "Add new item" screen (or, for an update, the item's **Package** tab
   and **Upload new package**), choose `dist/bookmark-notes-tasks-v<version>.zip`.
2. **Store listing** tab: paste the product name, summary, and detailed
   description from `store-listing.md`; set category to Productivity and language
   to English. Upload the three images from `screenshots/`.
3. **Privacy** tab: paste the single purpose and each permission justification;
   fill the data-usage certifications; paste your hosted privacy policy URL.
4. **Distribution** tab: pick visibility (Public / Unlisted) and regions.
5. **Submit for review.**

## One-time account requirement

If this is your first submission, you must register as a Chrome Web Store
developer and pay a one-time **USD 5** fee before you can publish.

## Screenshots still missing (optional but recommended)

The three provided screenshots show the full-page dashboard, the note+task
editor, and the filter/manage view. They do NOT show the toolbar popup (the
primary UI). If you want a popup screenshot too, load the unpacked extension in
Chrome, open the popup, and capture it at 1280x800.

## Permissions

The manifest requests `storage`, `tabs`, `bookmarks`, and `favicon` - the minimal
set the code actually uses. (`activeTab` was removed as unused; `favicon` was
added so site icons render locally via Chrome's favicon API instead of a remote
service, which means the extension now makes zero external network requests.)

## Privacy policy URL

Use: https://larsca.com/legal/bookmark-notes-tasks/privacy
This goes live once the larsca-w3 site is deployed. Until then the Web Store
"Privacy policy URL" field will point to a page that is not yet reachable, so
deploy larsca-w3 before submitting.

## Rebuild the package

Bump the `version` in manifest.json for every new upload of an already-published
item, then from the repo root:

```
scripts/build-zip.sh
```

It packages only the tracked runtime files (manifest, popup and dashboard
pages, theme files, icons, fonts) and prints the zip path.
