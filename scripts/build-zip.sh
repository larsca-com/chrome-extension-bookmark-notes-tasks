#!/bin/sh
# Build the Chrome Web Store upload zip from the extension's runtime files.
#
# Usage: scripts/build-zip.sh [output-dir]     (default: dist/)
# Writes bookmark-notes-tasks-v<manifest version>.zip and prints its path.
# Only tracked files under the runtime paths below are packaged, so docs,
# store assets and local leftovers never end up in the upload.
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
out_dir=${1:-"$root/dist"}

RUNTIME_FILES="manifest.json
popup.html popup.css popup.js
all-bookmarks.html all-bookmarks.css all-bookmarks.js
theme.css theme.js
icons fonts"

version=$(sed -n 's/^ *"version": *"\([^"]*\)".*/\1/p' "$root/manifest.json")
if [ -z "$version" ]; then
  echo "build-zip: no version found in manifest.json" >&2
  exit 1
fi

mkdir -p "$out_dir"
zip_path="$(cd "$out_dir" && pwd)/bookmark-notes-tasks-v$version.zip"
rm -f "$zip_path"

# shellcheck disable=SC2086 # word splitting of RUNTIME_FILES is intended
files=$(git -C "$root" ls-files -- $RUNTIME_FILES)
for f in $files; do
  [ -f "$root/$f" ] || { echo "build-zip: missing $f" >&2; exit 1; }
done

(cd "$root" && printf '%s\n' "$files" | zip -q -X "$zip_path" -@)
echo "$zip_path"
