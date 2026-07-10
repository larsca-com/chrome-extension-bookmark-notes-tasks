# Chrome Web Store listing - Bookmark Notes & Tasks

Copy-paste the fields below into the Web Store "Store listing", "Privacy", and
"Distribution" tabs. All text is English (store-facing UI language). Character
limits noted where the store enforces them.

---

## Product name (max 75 chars)

Bookmark Notes & Tasks

## Summary (short description, max 132 chars)

Save any page as a bookmark, attach private notes and to-do tasks, then search and filter it all from one calm dark dashboard.

## Category

Productivity  (sub-category: Workflow & Planning)

## Language

English (United States)

---

## Detailed description

Bookmark Notes & Tasks turns a plain bookmark into a small workspace. Save the
page you are on, then add the context you will actually need later: a note to
yourself and a checklist of things to do.

WHAT YOU CAN DO
- One-click bookmark the current tab from the toolbar popup, with its title,
  URL, and favicon captured automatically.
- Write a free-form note on any bookmark - a summary, a quote, a reminder.
- Add a task checklist to any bookmark and tick items off as you go.
- Open the full-page dashboard to see every bookmark, note, and task together.
- Search across bookmarks, notes, and tasks instantly (Ctrl+K).
- Filter to "With Notes", "With Tasks", or "Pending Tasks" to find what still
  needs attention.
- See at a glance how many tasks are pending vs. done on each bookmark.
- Remove a bookmark - and its notes and tasks - whenever you are finished.

WHY YOU MIGHT LIKE IT
- Everything is stored locally in your browser. There is no account, no sign-up,
  and no sync server.
- A quiet, focused dark interface that stays out of your way.
- Works alongside Chrome's own bookmarks rather than replacing them.

Bookmark Notes & Tasks is ideal for research, reading lists, and any workflow
where "I saved the link" is not enough and you need the reason you saved it.

---

## Single purpose (Privacy tab, required)

Bookmark web pages and enrich each bookmark with private notes and a task
checklist, all searchable from a single dashboard.

---

## Permission justifications (Privacy tab, required per permission)

storage
  Stores your notes and tasks locally on your device via chrome.storage.local so
  they persist between sessions. No data is sent anywhere.

bookmarks
  Creates, reads, and removes Chrome bookmarks. Notes and tasks are attached to
  these bookmarks, so the extension needs to manage them to work.

tabs
  Reads the active tab's URL, title, and favicon when you choose to bookmark the
  current page, so the bookmark is created with the right information.

favicon
  Shows the site icon next to each saved bookmark using Chrome's built-in favicon
  API, which reads icons already cached by the browser. No network request is
  made to any external server.

---

## Remote code (Privacy tab)

Answer: No, I am not using remote code. All scripts are bundled in the package;
there is no eval(), no externally-hosted JS/Wasm. (Google Fonts and site icons
are resources, not code.)

## Data usage disclosures (Privacy tab certifications)

"What user data do you plan to collect?" - check NOTHING. The extension stores
your bookmarks, notes, and tasks locally in chrome.storage.local and makes no
network requests to the developer or any third party. Favicons are served
locally by Chrome's built-in favicon API, so no bookmarked data leaves the
device.

Certification checkboxes (check all three - all true):
- [x] I do not sell or transfer user data to third parties, outside the approved
      use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to my
      item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for
      lending purposes.

Privacy policy URL (required):
  https://larsca.com/legal/bookmark-notes-tasks/privacy
  (Live only after the larsca-w3 site is deployed. Source page:
  larsca-w3/app/legal/bookmark-notes-tasks/privacy/page.tsx)
