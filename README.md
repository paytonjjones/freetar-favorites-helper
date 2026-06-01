# Freetar Favorites Helper

A Chrome extension that moves saved Ultimate Guitar tabs into Freetar.

## What it does

- Downloads favorites from `https://www.ultimate-guitar.com/user/mytabs`
- Exports them as a Freetar-compatible JSON file
- Imports that JSON into any running Freetar tab

## Install

Load this folder as an unpacked extension in Chrome.

1. Open `chrome://extensions/`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select `/Users/payton.jones/dev/freetar-favorites-helper`

## Use

1. Open a logged-in Ultimate Guitar tab.
2. Click the extension and choose `Download favorites`.
3. Open a Freetar tab such as `https://freetar.de`.
4. Click the extension and choose `Upload favorites`.
5. Select the downloaded `freetar-favorites.json`.
6. Use `Advanced` if you need to clear the saved favorites from Freetar.

## Notes

- The downloader reads only the personal `mytabs` page on Ultimate Guitar.
- This project was built to interoperate with Freetar and the local Freetar workflow used during development.
- The exported JSON uses Freetar-style path URLs so imported favorites stay on the Freetar site when clicked.
- macOS Gatekeeper may still warn about a downloaded JSON file. That warning is controlled by the operating system, not by the extension.
- If you want to publish this as a Chrome Web Store item, you still need a Chrome Web Store developer account and a store submission from that account.

## Development

```sh
npm test
npm run zip
```
