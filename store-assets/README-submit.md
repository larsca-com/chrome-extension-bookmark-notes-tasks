# Submitting Bookmark Notes & Tasks to the Chrome Web Store

## Files in this folder

- `store-listing.md` - all listing text (name, summary, description, single
  purpose, permission justifications, data disclosures). Copy-paste into the
  dashboard fields.
- `PRIVACY.md` - a privacy policy. Host it at a public URL and paste that link
  into the Privacy tab.
- `screenshots/` - three 1280x800 PNG screenshots, ready to upload.

The package itself is `bookmark-notes-tasks-v1.0.0.zip` in the repo root
(regenerate any time with the command in "Rebuild the package" below).

## Step by step

1. On the "Add new item" screen, click **Select file** and choose
   `bookmark-notes-tasks-v1.0.0.zip`.
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

From the repo root:

```
zip -r bookmark-notes-tasks-v1.0.0.zip \
  manifest.json \
  popup.html popup.css popup.js \
  all-bookmarks.html all-bookmarks.css all-bookmarks.js \
  icons \
  -x '*.DS_Store'
```

Bump the `version` in manifest.json for every new upload of an already-published
item.
